import * as PdfKeys from './Pdf/PdfKeys';
import { ImageInfo, ImageFormat } from './Images/ImageInfo';
import { EmbeddedFontInfo } from '../Typography/EmbeddedFontInfo';
import { Color } from '../Core/Color';
import { DeferredXObjectInfo } from './RenderContext';
import { StandardFonts } from '../Typography/StandardFonts';
import { IPdfWriter } from './Writers/IPdfWriter';
import { FontWriter } from './Writers/FontWriter';
import { ImageWriter } from './Images/ImageWriter';
import { ImageResampler } from './Images/ImageResampler';
import { PdfSyntax } from './Pdf/PdfSyntax';
import { TtfFont } from '../Typography/TrueType/TtfFont';
import { GlyphUsageTracker } from '../Typography/GlyphUsageTracker';
import { FontManager, FallbackFont } from '../Typography/FontManager';
import {
  getActiveDocumentFonts,
  getDocumentFontBytes,
  recordRegistryFontInstance,
  recordRegistryFontPath,
} from '../Typography/DocumentFontMetricScope';
import { DiagnosticsCollector } from '../Core/Diagnostics';
import { PdfAConformance } from '../Configuration/PdfAConformance';
import { primaryCovers, shapeTextRuns, ShaperFont } from '../Typography/TextRunShaper';
import { ShadingRequest, buildColorShadingDict, buildAlphaShadingDict } from './Pdf/GradientShading';

/** Identifier prefix for glyph-fallback fonts registered on demand. */
const FALLBACK_PREFIX = 'virtual:fallback:';

/**
 * A maximal substring of a draw call that renders with one font, after
 * glyph-fallback resolution. `embeddedFont` is `null` for non-embedded
 * (standard Type1) fonts, in which case the text is emitted as a literal
 * string rather than glyph IDs.
 */
export interface ResolvedTextRun {
  tracker?: GlyphUsageTracker | null;
  // Shared parsed faces may back distinct resources with separate trackers.
  canTrackPreparedGlyphs?: boolean;
  resourceName: string;
  embeddedFont: TtfFont | null;
  fontIdentifier: string;
  text: string;
}

export type PdfAResourceIssueCode =
  'non-embedded-standard-font' | 'alpha-graphics-state-flattened' | 'png-soft-mask-flattened';

export type PdfAResourceIssueSeverity = 'blocking' | 'mitigated';

export interface PdfAResourceIssue {
  code: PdfAResourceIssueCode;
  severity: PdfAResourceIssueSeverity;
  message: string;
  resource?: string;
}

/** Registers and writes the fonts, images, graphics states, and deferred objects used by a PDF. */
export class PdfResourceRegistry {
  private fontCounter = 0;
  private imageCounter = 0;
  private graphicsStateCounter = 0;
  private _conformance = PdfAConformance.None;

  public get conformance(): PdfAConformance {
    return this._conformance;
  }

  public set conformance(value: PdfAConformance) {
    this._conformance = value ?? PdfAConformance.None;
  }

  public get pdfAEnabled(): boolean {
    return this._conformance !== PdfAConformance.None;
  }

  public set pdfAEnabled(value: boolean) {
    this._conformance = value ? PdfAConformance.PdfA2b : PdfAConformance.None;
  }

  /**
   * When true, standard-14 font references are substituted with embedded
   * Liberation TTFs even without a PDF/A claim. PDF/UA-1 mandates font
   * embedding (ISO 14289-1, veraPDF rule 7.21.4.1) independently of PDF/A,
   * so the serializer sets this for tagged output. PDF/A implies it via
   * `conformance`.
   */
  public embedStandardFonts = false;

  /**
   * Whether standard-14 names should be resolved to embedded TTFs. True for
   * any PDF/A conformance, or when {@link embedStandardFonts} is set (PDF/UA-1).
   */
  private get shouldEmbedStandardFonts(): boolean {
    return this._conformance !== PdfAConformance.None || this.embedStandardFonts;
  }

  /**
   * Collector that receives recoverable failures encountered while loading
   * or embedding resources. Wired by Document; defaults to a private
   * collector so non-Document callers still get a usable instance.
   */
  public diagnostics: DiagnosticsCollector = new DiagnosticsCollector();

  public fontAliasMap: Map<string, string> = new Map();
  public fontNameMap: Map<string, string> = new Map();
  public fontIdMap: Map<string, number> = new Map();
  public embeddedFonts: Map<string, EmbeddedFontInfo> = new Map();
  public loadedImages: Map<string, ImageInfo> = new Map();
  public imageIdMap: Map<string, number> = new Map();
  public imageResourceNames: Map<number, string> = new Map();
  private imagePdfObjectIds: Map<string, number> = new Map();
  public deferredXObjects: Map<string, DeferredXObjectInfo> = new Map();
  private alphaGraphicsStates: Map<string, { resourceName: string; alpha: number }> = new Map();
  private requestedAlphaValues: Set<string> = new Set();
  private shadings: { shadingName: string; softMaskGsName: string | null; request: ShadingRequest }[] = [];
  private shadingCounter = 0;
  private softMaskGsCounter = 0;

  private registerMetricFontInstance(identifier: string, font: TtfFont): void {
    recordRegistryFontInstance(this, identifier, font);
  }

  private registerMetricFontAlias(identifier: string, path: string): void {
    recordRegistryFontPath(this, identifier, path);
  }

  public registerFont(fontIdentifier: string): string {
    // (A) Direct TTF/OTF path
    if (PdfResourceRegistry.isEmbeddedFont(fontIdentifier)) {
      // Browser callers frequently preload URL fonts through FontManager. Reuse
      // those exact bytes instead of fetching the same URL again; this also lets
      // Node build-time preview generation resolve browser-rooted font URLs.
      const registeredBytes = getDocumentFontBytes(fontIdentifier) ?? FontManager.getBytesForIdentifier(fontIdentifier);
      if (registeredBytes) return this.registerEmbeddedFontFromBytes(registeredBytes, fontIdentifier);
      return this.registerEmbeddedFont(fontIdentifier);
    }

    // (B) Already registered as a virtual (bytes-based) font
    const virtualKey = `virtual:${fontIdentifier}`;
    if (this.embeddedFonts.has(virtualKey)) {
      return this.embeddedFonts.get(virtualKey)!.resourceName;
    }

    if (this.shouldEmbedStandardFonts) {
      // 1. Try FontManager (bytes-based - works in all environments)
      const bytes = FontManager.getBytesForStandardFont(fontIdentifier);
      if (bytes) {
        const virtualKey = `virtual:${fontIdentifier}`;
        const resourceName = this.registerEmbeddedFontFromBytes(bytes, virtualKey);
        this.fontNameMap.set(fontIdentifier, resourceName);
        this.fontAliasMap.set(fontIdentifier, virtualKey);
        // Register the TtfFont instance (not a file path) so FontMetrics can measure accurately.
        const info = this.embeddedFonts.get(virtualKey);
        if (info?.font instanceof TtfFont) {
          this.registerMetricFontInstance(fontIdentifier, info.font);
        }
        return resourceName;
      }

      // 2. Legacy: file-path based resolution (Node.js, system fonts)
      const ttfPath = this.resolveStandardFontToTtf(fontIdentifier);
      if (ttfPath) {
        const resourceName = this.registerEmbeddedFont(ttfPath);
        this.fontNameMap.set(fontIdentifier, resourceName);
        this.fontAliasMap.set(fontIdentifier, ttfPath);
        this.registerMetricFontAlias(fontIdentifier, ttfPath);
        return resourceName;
      }
    }

    // (D) Standard type-1 font (not embedded)
    if (!this.fontNameMap.has(fontIdentifier)) {
      this.fontCounter++;
      const value = `/F${this.fontCounter}`;
      this.fontNameMap.set(fontIdentifier, value);
    }

    return this.fontNameMap.get(fontIdentifier)!;
  }

  public static isEmbeddedFont(fontIdentifier: string): boolean {
    const lower = fontIdentifier.toLowerCase();
    return lower.endsWith('.ttf') || lower.endsWith('.otf') || lower.startsWith('virtual:');
  }

  public getEmbeddedFont(filePath: string): EmbeddedFontInfo | null {
    return this.embeddedFonts.get(filePath) || null;
  }

  private registerEmbeddedFont(filePath: string): string {
    if (!this.embeddedFonts.has(filePath)) {
      // Attempt to load the font synchronously right now so the GlyphUsageTracker
      // is ready before rendering begins (rendering is synchronous).
      // Falls back to null in non-Node.js environments or if the file is missing;
      // callers can also call preloadAllFontsAsync() for the async path.
      let font: TtfFont | null = null;
      let tracker: GlyphUsageTracker | null = null;
      try {
        font = TtfFont.fromFileSync(filePath);
        tracker = new GlyphUsageTracker(font);
        // Make the parsed font available to the synchronous measurement path
        // (FontMetrics) keyed by the same identifier the element uses for
        // `fontName`. Without this, layout falls back to the ASCII-only width
        // approximation and under-measures supplementary-plane glyphs (e.g. emoji),
        // preventing word-wrap from triggering.
        this.registerMetricFontInstance(filePath, font);
      } catch (err) {
        // Not loadable synchronously (file missing, parse error, browser env, etc.).
        // The document will still render; the font falls back to a standard Type1.
        // In the browser the async preload path (preloadEmbeddedFont) retries via fetch,
        // so suppress this diagnostic when the failure is the expected "Node-only" path.
        const msg = (err as Error).message;
        if (!msg.includes('only available in Node.js')) {
          this.diagnostics.addWarning('font', `Could not load embedded font: ${msg}`, filePath, err);
        }
      }

      this.fontCounter++;
      const resourceName = `/F${this.fontCounter}`;
      const subsetPrefix = this.generateSubsetPrefix();

      const info = new EmbeddedFontInfo();
      info.font = font;
      info.tracker = tracker;
      info.subsetPrefix = subsetPrefix;
      info.resourceName = resourceName;
      info.type0ObjectId = 0;

      this.embeddedFonts.set(filePath, info);
      this.fontNameMap.set(filePath, resourceName);
    }

    return this.fontNameMap.get(filePath)!;
  }

  /**
   * Reports whether this document will end up emitting any
   * non-embedded standard-14 Type1 font reference (Helvetica,
   * Times-*, Courier-*, Symbol, ZapfDingbats). Such references are
   * **forbidden by PDF/A-1b §6.3.4**, so when this returns `true`
   * the serializer suppresses the PDF/A conformance claim rather
   * than emitting an invalid one.
   *
   * Mirrors what {@link writeResources} does - anything that won't
   * be aliased to a TTF and isn't already an embedded-font path will
   * be written via `writeType1Font` (non-embedded).
   */
  public hasNonEmbeddedStandardFont(): boolean {
    return this.getNonEmbeddedStandardFonts().length > 0;
  }

  /**
   * Returns resource-policy issues relevant to PDF/A conformance. Blocking
   * issues suppress the PDF/A claim; mitigated issues document resources that
   * BonniePDF already rewrites into a PDF/A-safe form (for example by making
   * alpha graphics states opaque or flattening PNG soft masks).
   */
  public getPdfAResourceIssues(): PdfAResourceIssue[] {
    const issues: PdfAResourceIssue[] = [];

    for (const fontIdentifier of this.getNonEmbeddedStandardFonts()) {
      issues.push({
        code: 'non-embedded-standard-font',
        severity: 'blocking',
        resource: fontIdentifier,
        message: `Font ${fontIdentifier} would be emitted as a non-embedded standard Type1 font.`,
      });
    }

    // Transparency is only flattened for PDF/A-1 (ISO 19005-1 §6.4). PDF/A-2/3/4
    // permit constant alpha and soft masks, so they keep their real transparency
    // and raise no issue. Outside PDF/A there is nothing to report either.
    if (this.requiresPdfA1TransparencyFallback()) {
      for (const alphaKey of this.requestedAlphaValues) {
        if (Number(alphaKey) < 1) {
          issues.push({
            code: 'alpha-graphics-state-flattened',
            severity: 'mitigated',
            resource: alphaKey,
            message: `Requested alpha ${alphaKey} was replaced with an opaque graphics state for PDF/A-1 output.`,
          });
        }
      }

      for (const [key, image] of this.loadedImages) {
        if (image.format === ImageFormat.Png && image.hasAlpha && image.alphaData.length > 0) {
          issues.push({
            code: 'png-soft-mask-flattened',
            severity: 'mitigated',
            resource: key,
            message: `PNG image ${key} has alpha data that will be flattened for PDF/A-1 output.`,
          });
        }
      }
    }

    return issues;
  }

  /** The standard-14 font references that will be written without embedding. */
  public getNonEmbeddedStandardFonts(): string[] {
    const result: string[] = [];
    for (const fontIdentifier of this.fontNameMap.keys()) {
      if (this.fontAliasMap.has(fontIdentifier)) continue;
      if (PdfResourceRegistry.isEmbeddedFont(fontIdentifier)) continue;
      result.push(fontIdentifier);
    }
    return result;
  }

  /**
   * Loads the actual TtfFont bytes for a previously registered embedded font path.
   * Must be called (and awaited) before rendering begins so that glyph metrics and
   * tracking are available during layout and content-stream generation.
   */
  public async preloadEmbeddedFont(filePath: string): Promise<void> {
    const info = this.embeddedFonts.get(filePath);
    if (!info) return; // not registered - nothing to do
    if (info.font instanceof TtfFont) return; // already loaded

    try {
      const font = await TtfFont.fromFile(filePath);
      info.font = font;
      info.tracker = new GlyphUsageTracker(font);
      // Mirror the sync path: make the parsed font visible to FontMetrics
      // under the same key so the synchronous measurement path uses real
      // per-glyph advances during the subsequent render pass.
      this.registerMetricFontInstance(filePath, font);
    } catch (err) {
      // Don't reject the whole render - record the failure so the caller can
      // surface it via `Document.diagnostics`, and leave the font with no
      // tracker so the renderer falls back to the nearest standard Type1.
      this.diagnostics.addError('font', `Failed to preload embedded font: ${(err as Error).message}`, filePath, err);
    }
  }

  /**
   * Loads all embedded fonts that have been registered so far.
   * Call this after all elements have been added to the document
   * but before serialisation.
   */
  public async preloadAllFontsAsync(): Promise<void> {
    const paths = Array.from(this.embeddedFonts.keys());
    await Promise.all(paths.map(p => this.preloadEmbeddedFont(p)));
  }

  private registerEmbeddedFontFromBytes(bytes: Uint8Array, key: string): string {
    if (!this.embeddedFonts.has(key)) {
      let font: TtfFont | null = null;
      let tracker: GlyphUsageTracker | null = null;
      try {
        font = TtfFont.loadFromBytesCached(bytes);
        tracker = new GlyphUsageTracker(font);
        this.registerMetricFontInstance(key, font);
      } catch (err) {
        this.diagnostics.addWarning('font', `Could not parse font bytes: ${(err as Error).message}`, key, err);
      }

      this.fontCounter++;
      const resourceName = `/F${this.fontCounter}`;
      const subsetPrefix = this.generateSubsetPrefix();

      const info = new EmbeddedFontInfo();
      info.font = font;
      info.tracker = tracker;
      info.subsetPrefix = subsetPrefix;
      info.resourceName = resourceName;
      info.type0ObjectId = 0;
      this.embeddedFonts.set(key, info);
      this.fontNameMap.set(key, resourceName);
    }

    return this.fontNameMap.get(key)!;
  }

  private resolveStandardFontToTtf(_fontIdentifier: string): string | null {
    // FontManager covers all cases via bytes - this is a fallback for direct file paths.
    return null;
  }

  private generateSubsetPrefix(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  public resolveEmbeddedFont(fontIdentifier: string): TtfFont | null {
    if (PdfResourceRegistry.isEmbeddedFont(fontIdentifier)) {
      const fontInfo = this.getEmbeddedFont(fontIdentifier);
      return fontInfo?.font ?? null;
    }

    // Check for virtual (bytes-based) font
    const virtualKey = `virtual:${fontIdentifier}`;
    if (this.embeddedFonts.has(virtualKey)) {
      return this.embeddedFonts.get(virtualKey)!.font;
    }

    if (this.fontAliasMap.has(fontIdentifier)) {
      const ttfPath = this.fontAliasMap.get(fontIdentifier)!;
      const fontInfo = this.getEmbeddedFont(ttfPath);
      return fontInfo?.font ?? null;
    }

    return null;
  }

  public trackGlyphUsage(fontIdentifier: string, text: string): void {
    if (PdfResourceRegistry.isEmbeddedFont(fontIdentifier)) {
      const fontInfo = this.getEmbeddedFont(fontIdentifier);
      fontInfo?.tracker?.markUsedText?.(text);
      return;
    }

    // Check for virtual (bytes-based) font
    const virtualKey = `virtual:${fontIdentifier}`;
    if (this.embeddedFonts.has(virtualKey)) {
      this.embeddedFonts.get(virtualKey)!.tracker?.markUsedText?.(text);
      return;
    }

    if (this.fontAliasMap.has(fontIdentifier)) {
      const ttfPath = this.fontAliasMap.get(fontIdentifier)!;
      const fontInfo = this.getEmbeddedFont(ttfPath);
      fontInfo?.tracker?.markUsedText?.(text);
    }
  }

  /**
   * Resolves a draw call's text into one or more runs, each renderable by a
   * single font. The primary font is used wherever it has the glyph; code
   * points it lacks are routed to the first registered fallback font that
   * covers them (registering it for embedding on demand). Control and
   * default-ignorable code points are dropped, as are code points no font can
   * render — both silently in output, the latter with a diagnostic — so the
   * content stream never references the forbidden `.notdef` glyph.
   *
   * When the primary font covers the whole string (or is a non-embedded
   * Type1 font) the result is a single run identical to the legacy path.
   */
  public resolveTextRuns(primaryFontIdentifier: string, text: string): ResolvedTextRun[] {
    const resourceName = this.registerFont(primaryFontIdentifier);
    const primaryFont = this.resolveEmbeddedFont(primaryFontIdentifier);

    // Non-embedded standard Type1 fonts can't be shaped (no cmap/glyph IDs);
    // preserve the literal-string emission path unchanged.
    if (!(primaryFont instanceof TtfFont)) {
      return [{ resourceName, embeddedFont: null, fontIdentifier: primaryFontIdentifier, text }];
    }

    const primaryInfo = Array.from(this.embeddedFonts.values()).find(f => f.font === primaryFont);
    if (primaryCovers(text, primaryFont))
      return [
        {
          resourceName,
          embeddedFont: primaryFont,
          tracker: primaryInfo?.tracker,
          canTrackPreparedGlyphs: primaryInfo?.resourceName === resourceName,
          fontIdentifier: primaryFontIdentifier,
          text,
        },
      ];

    // candidates[0] is the primary font; fallbackByIndex is aligned to
    // candidates (index 0 is the primary and has no FallbackFont entry).
    const candidates: ShaperFont[] = [{ fontIdentifier: primaryFontIdentifier, font: primaryFont }];
    const fallbackByIndex: (FallbackFont | undefined)[] = [undefined];
    // The document's own faces come first, then the global registrations (spec 16 §4).
    const documentFallbacks = getActiveDocumentFonts()?.fallbackFonts() ?? [];
    for (const fb of [...documentFallbacks, ...FontManager.getFallbackFonts()]) {
      if (fb.font === primaryFont) continue;
      candidates.push({ fontIdentifier: `${FALLBACK_PREFIX}${fb.key}`, font: fb.font });
      fallbackByIndex.push(fb);
    }

    const { runs, unsupported } = shapeTextRuns(text, candidates);

    if (unsupported.length > 0) {
      const sample = Array.from(new Set(unsupported))
        .slice(0, 8)
        .map(cp => `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`)
        .join(', ');
      this.diagnostics.addWarning(
        'font',
        `Dropped ${unsupported.length} code point(s) with no glyph in the selected or fallback fonts (${sample}).`,
        primaryFontIdentifier
      );
    }

    return runs.map(run => {
      if (run.fontIndex === 0) {
        return {
          resourceName,
          embeddedFont: primaryFont,
          fontIdentifier: primaryFontIdentifier,
          text: run.text,
          tracker: primaryInfo?.tracker,
          canTrackPreparedGlyphs: primaryInfo?.resourceName === resourceName,
        };
      }
      const fb = fallbackByIndex[run.fontIndex]!;
      const fbIdentifier = candidates[run.fontIndex].fontIdentifier;
      const fbResource = this.registerEmbeddedFontFromBytes(fb.bytes, fbIdentifier);
      const fbFont = this.resolveEmbeddedFont(fbIdentifier);
      const fbInfo = Array.from(this.embeddedFonts.values()).find(f => f.font === fbFont);
      return {
        resourceName: fbResource,
        embeddedFont: fbFont instanceof TtfFont ? fbFont : null,
        tracker: fbInfo?.tracker,
        canTrackPreparedGlyphs: fbInfo?.resourceName === fbResource,
        fontIdentifier: fbIdentifier,
        text: run.text,
      };
    });
  }

  public getNewImageId(): number {
    return ++this.imageCounter;
  }

  /** Images discovered by synchronous layout whose decoding requires the async writer path. */
  public deferredImages(): ImageInfo[] {
    return [...this.loadedImages.values()].filter(image => image.prepareDeferred !== undefined);
  }

  public registerImage(info: ImageInfo): number {
    const key = this.imageKey(info);

    if (!this.imageIdMap.has(key)) {
      const imageId = this.getNewImageId();
      this.imageIdMap.set(key, imageId);
      this.loadedImages.set(key, info);
      return imageId;
    }

    return this.imageIdMap.get(key)!;
  }

  /**
   * The resolution cap for embedded images, in pixels per inch; `null` embeds every image at
   * its source resolution. Wired from the document's settings.
   */
  public maxImageDpi: number | null = null;

  /** The largest size each image is painted at, per axis of the stored pixels. */
  private readonly imagePlacements = new Map<
    string,
    { maxWidthMilliPoints: number; maxHeightMilliPoints: number; keepResolution: boolean }
  >();

  /**
   * Records that `image` is painted `widthPoints` x `heightPoints` on the page (its display size,
   * already scaled by any transform). One embedded copy serves every placement, so it keeps the
   * largest size asked of it, and one placement that keeps full resolution keeps it for all of them.
   */
  public noteImagePlacement(image: ImageInfo, widthPoints: number, heightPoints: number): void {
    // Lengths are along the stored pixel axes: EXIF orientations 5-8 swap them for display.
    const swapped = image.orientation >= 5 && image.orientation <= 8;
    const storedWidth = swapped ? heightPoints : widthPoints;
    const storedHeight = swapped ? widthPoints : heightPoints;

    // Round half away from zero to whole milli-points, exactly as the other implementation does.
    const toMilli = (points: number): number => Math.sign(points) * Math.round(Math.abs(points) * 1000);
    const widthMilli = toMilli(storedWidth);
    const heightMilli = toMilli(storedHeight);

    const key = this.imageKey(image);
    const placed = this.imagePlacements.get(key);
    if (placed === undefined) {
      this.imagePlacements.set(key, {
        maxWidthMilliPoints: widthMilli,
        maxHeightMilliPoints: heightMilli,
        keepResolution: image.keepResolution,
      });
    } else {
      placed.maxWidthMilliPoints = Math.max(placed.maxWidthMilliPoints, widthMilli);
      placed.maxHeightMilliPoints = Math.max(placed.maxHeightMilliPoints, heightMilli);
      placed.keepResolution ||= image.keepResolution;
    }
  }

  /**
   * Returns the image to embed for `key`: the source itself, or a reduced copy when the resolution
   * cap applies. Decided from pixel counts and placement sizes alone, so every generate path, and
   * the other language implementation, agree.
   */
  private prepareImageForWrite(key: string, info: ImageInfo): ImageInfo {
    const dpi = this.maxImageDpi;
    const placed = this.imagePlacements.get(key);
    if (dpi === null || placed === undefined) return info;
    if (placed.keepResolution || placed.maxWidthMilliPoints <= 0 || placed.maxHeightMilliPoints <= 0) return info;

    const targetWidth = ImageResampler.targetLength(placed.maxWidthMilliPoints, dpi, info.width);
    const targetHeight = ImageResampler.targetLength(placed.maxHeightMilliPoints, dpi, info.height);
    if (!ImageResampler.shouldResample(info.width, info.height, targetWidth, targetHeight)) return info;

    const ppi = (pixels: number, milliPoints: number): number => Math.floor((pixels * 72000) / milliPoints);
    const points = (milli: number): string => String(Number((milli / 1000).toFixed(2)));
    const drawn = `${points(placed.maxWidthMilliPoints)} x ${points(placed.maxHeightMilliPoints)} pt`;

    const eligibility = ImageResampler.eligibility(info);
    if (!eligibility.eligible) {
      this.diagnostics.addInfo(
        'image',
        `image.passed-through: ${info.width}x${info.height} px drawn ${drawn} ` +
          `(about ${ppi(info.width, placed.maxWidthMilliPoints)} ppi, cap ${dpi}); ` +
          `embedded as it is: ${eligibility.reason}.`,
        key
      );
      return info;
    }

    const reduced = ImageResampler.resampleImage(info, targetWidth, targetHeight);
    const samplesPerPixel = info.components + (info.hasAlpha ? 1 : 0);
    const saved = (info.width * info.height - targetWidth * targetHeight) * samplesPerPixel;
    this.diagnostics.addInfo(
      'image',
      `image.resampled: ${info.width}x${info.height} -> ${targetWidth}x${targetHeight} px, drawn ${drawn} ` +
        `(about ${ppi(info.width, placed.maxWidthMilliPoints)} -> ${ppi(targetWidth, placed.maxWidthMilliPoints)} ppi), ` +
        `${saved} fewer raw bytes.`,
      key
    );
    return reduced;
  }

  private readonly imageKeys = new WeakMap<ImageInfo, string>();

  /** The content-hash key for an image, computed once per decoded image. */
  private imageKey(info: ImageInfo): string {
    let key = this.imageKeys.get(info);
    if (key === undefined) {
      const dataToHash = info.originalData && info.originalData.length > 0 ? info.originalData : info.data;
      key = 'img_' + this.computeHash(dataToHash);
      this.imageKeys.set(info, key);
    }
    return key;
  }

  private computeHash(data: Uint8Array): string {
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;

    for (const b of data) {
      h1 ^= b;
      h1 = Math.imul(h1, 0x01000193) >>> 0;

      h2 ^= b + 0x9e3779b9 + ((h2 << 6) >>> 0) + (h2 >>> 2);
      h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
    }

    return `${data.length.toString(16)}_${h1.toString(16).padStart(8, '0')}_${h2.toString(16).padStart(8, '0')}`;
  }

  public getImageResourceName(imageId: number): string {
    if (!this.imageResourceNames.has(imageId)) {
      const resourceName = `/I${imageId}`;
      this.imageResourceNames.set(imageId, resourceName);
      return resourceName;
    }
    return this.imageResourceNames.get(imageId)!;
  }

  public registerDeferredXObject(fontFamily: string, fontSize: number, color: Color): string {
    const fontResName = this.registerFont(fontFamily);
    const signature = `${fontResName}_${fontSize}_${color.toHexString()}`;

    if (!this.deferredXObjects.has(signature)) {
      const resName = `/DXO${this.deferredXObjects.size + 1}`;
      const info: DeferredXObjectInfo = {
        resourceName: resName,
        fontIdentifier: fontFamily,
        fontResourceName: fontResName,
        fontSize,
        color,
      };
      this.deferredXObjects.set(signature, info);
    }

    return this.deferredXObjects.get(signature)!.resourceName;
  }

  public registerAlphaGraphicsState(alpha: number): string {
    const clamped = Math.max(0, Math.min(1, alpha));
    this.requestedAlphaValues.add(clamped.toFixed(4));
    const effectiveAlpha = this.requiresPdfA1TransparencyFallback() ? 1 : clamped;
    const key = effectiveAlpha.toFixed(4);

    if (!this.alphaGraphicsStates.has(key)) {
      this.graphicsStateCounter++;
      this.alphaGraphicsStates.set(key, {
        resourceName: `/GS_ALPHA_${this.graphicsStateCounter}`,
        alpha: effectiveAlpha,
      });
    }

    return this.alphaGraphicsStates.get(key)!.resourceName;
  }

  private requiresPdfA1TransparencyFallback(): boolean {
    return this._conformance === PdfAConformance.PdfA1b || this._conformance === PdfAConformance.PdfA1a;
  }

  /**
   * Registers a native gradient shading (axial Type-2 / radial Type-3) and, for
   * translucent gradients, the luminosity soft mask that carries its alpha.
   * Returns the resource names the content stream should reference, or `null`
   * when the gradient can't be represented as a shading under the active
   * conformance — specifically a translucent gradient under PDF/A-1, which
   * forbids transparency (ISO 19005-1 §6.4). The caller falls back to the
   * strip/disc approximation in that case.
   *
   * Opaque gradients are always emitted as shadings (smooth shadings are valid
   * in every PDF/A level); only the soft mask is gated on transparency support.
   */
  public registerShading(request: ShadingRequest): { shadingName: string; softMaskGs: string | null } | null {
    if (request.hasAlpha && this.requiresPdfA1TransparencyFallback()) return null;

    this.shadingCounter++;
    const shadingName = `/Sh${this.shadingCounter}`;
    let softMaskGsName: string | null = null;
    if (request.hasAlpha) {
      this.softMaskGsCounter++;
      softMaskGsName = `/GSsm${this.softMaskGsCounter}`;
    }
    this.shadings.push({ shadingName, softMaskGsName, request });
    return { shadingName, softMaskGs: softMaskGsName };
  }

  private mapToStandardFontName(fontIdentifier: string): string {
    const lower = fontIdentifier.toLowerCase();
    if (lower.includes('arial') || lower.includes('helvetica')) return StandardFonts.Helvetica;
    if (lower.includes('times')) return StandardFonts.TimesRoman;
    if (lower.includes('courier') || lower.includes('mono')) return StandardFonts.Courier;
    return StandardFonts.Helvetica;
  }

  private resolveFontObjectId(fontIdentifier: string): number {
    if (this.fontAliasMap.has(fontIdentifier)) {
      const ttfPath = this.fontAliasMap.get(fontIdentifier)!;
      if (this.fontIdMap.has(ttfPath)) return this.fontIdMap.get(ttfPath)!;
    }
    return this.fontIdMap.get(fontIdentifier) ?? 0;
  }

  /**
   * Writes all resource objects (fonts, images, deferred XObjects) to the writer
   * and returns the /Resources dictionary string for embedding in page dictionaries.
   */
  public writeResources(writer: IPdfWriter, totalPages: number): string {
    const fontWriter = new FontWriter(writer, this.diagnostics);
    const imageWriter = new ImageWriter(writer);
    imageWriter.conformance = this._conformance;

    // 1. Write fonts
    for (const [fontIdentifier, _resourceName] of this.fontNameMap) {
      // Skip aliased entries (they're written under their canonical TTF path)
      if (this.fontAliasMap.has(fontIdentifier)) continue;

      // Skip logical names that have a virtual (bytes-based) entry registered under virtual:<name>
      if (!fontIdentifier.startsWith('virtual:') && this.embeddedFonts.has(`virtual:${fontIdentifier}`)) continue;

      if (PdfResourceRegistry.isEmbeddedFont(fontIdentifier)) {
        const fontInfo = this.embeddedFonts.get(fontIdentifier);
        if (fontInfo && fontInfo.font) {
          // Font was successfully loaded - write as a proper Type0 embedded font.
          const type0Id = writer.getNewId();
          fontInfo.type0ObjectId = type0Id;
          this.fontIdMap.set(fontIdentifier, type0Id);
          fontWriter.writeEmbeddedTtfFont(type0Id, fontInfo);
        } else {
          // Font failed to load (file missing, parse error, etc.) - fall back to
          // the nearest standard Type1 font so the document is still valid.
          const fontId = writer.getNewId();
          this.fontIdMap.set(fontIdentifier, fontId);
          fontWriter.writeType1Font(fontId, this.mapToStandardFontName(fontIdentifier));
        }
      } else {
        const fontId = writer.getNewId();
        this.fontIdMap.set(fontIdentifier, fontId);
        fontWriter.writeType1Font(fontId, fontIdentifier);
      }
    }

    // 2. Write images
    this.imagePdfObjectIds.clear();
    for (const [key, info] of this.loadedImages) {
      const pdfObjectId = writer.getNewId();
      this.imagePdfObjectIds.set(key, pdfObjectId);
      const internalId = this.imageIdMap.get(key)!;
      const resourceName = this.getImageResourceName(internalId);
      imageWriter.writeImage(pdfObjectId, this.prepareImageForWrite(key, info), resourceName);
    }

    // 3. Write deferred XObjects (total-page-count placeholders etc.)
    const deferredIds = new Map<string, number>();
    for (const [signature, info] of this.deferredXObjects) {
      const id = writer.getNewId();
      deferredIds.set(signature, id);

      const text = totalPages.toString();
      const colorCmd = `${info.color.scR.toFixed(3)} ${info.color.scG.toFixed(3)} ${info.color.scB.toFixed(3)} rg`;

      const embeddedFont = this.resolveEmbeddedFont(info.fontIdentifier);
      let textOperand: string;
      if (embeddedFont) {
        this.trackGlyphUsage(info.fontIdentifier, text);
        textOperand = PdfSyntax.toGlyphIdHexString(text, embeddedFont);
      } else {
        textOperand = `(${PdfSyntax.escape(text)})`;
      }

      const content = `BT ${info.fontResourceName} ${info.fontSize} Tf ${colorCmd} 0 -${info.fontSize} Td ${textOperand} Tj ET`;

      const fontObjId = this.resolveFontObjectId(info.fontIdentifier);
      writer.writeObject(
        id,
        new Map([
          [PdfKeys.Common.Type, '/XObject'],
          [PdfKeys.Common.Subtype, '/Form'],
          [PdfKeys.Form.BoundingBox, `[0 -${info.fontSize * 2} 100 0]`],
          [PdfKeys.Form.Resources, `<< /Font << ${info.fontResourceName} ${fontObjId} 0 R >> >>`],
        ]),
        content
      );
    }

    // 4. Build font resource string
    const fontRefs: string[] = [];
    for (const [fontIdentifier, resourceName] of this.fontNameMap) {
      if (this.fontAliasMap.has(fontIdentifier)) continue;
      // Skip logical names that have a virtual (bytes-based) entry
      if (!fontIdentifier.startsWith('virtual:') && this.embeddedFonts.has(`virtual:${fontIdentifier}`)) continue;
      const objectId = this.fontIdMap.get(fontIdentifier);
      if (objectId) fontRefs.push(`${resourceName} ${objectId} 0 R`);
    }
    const fontResources = `<< /Font << ${fontRefs.join(' ')} >> >>`;

    // 5. Build XObject (image + deferred) resource string
    const xobjRefs: string[] = [];
    for (const [key, internalId] of this.imageIdMap) {
      const pdfObjectId = this.imagePdfObjectIds.get(key);
      if (pdfObjectId) {
        const resourceName = this.getImageResourceName(internalId);
        xobjRefs.push(`${resourceName} ${pdfObjectId} 0 R`);
      }
    }
    for (const [signature, objectId] of deferredIds) {
      const info = this.deferredXObjects.get(signature);
      if (info) xobjRefs.push(`${info.resourceName} ${objectId} 0 R`);
    }

    const imageResources = xobjRefs.length > 0 ? `<< /XObject << ${xobjRefs.join(' ')} >> >>` : '';

    const graphicsStateRefs: string[] = [];
    for (const { resourceName, alpha } of this.alphaGraphicsStates.values()) {
      const objectId = writer.getNewId();
      // `alpha` is already conformance-aware: registerAlphaGraphicsState() forces
      // it to 1.0 only for PDF/A-1 (ISO 19005-1 §6.4 forbids transparency).
      // PDF/A-2/3/4 permit constant alpha (ISO 19005-2 §6.2.4), so they keep
      // their real opacity - mirroring how image soft masks are already handled.
      const alphaValue = alpha;
      writer.writeObject(
        objectId,
        new Map<string, string>([
          [PdfKeys.Common.Type, '/ExtGState'],
          [PdfKeys.GraphicsState.FillAlpha, alphaValue.toFixed(4)],
          [PdfKeys.GraphicsState.StrokeAlpha, alphaValue.toFixed(4)],
        ])
      );
      graphicsStateRefs.push(`${resourceName} ${objectId} 0 R`);
    }

    // 6. Gradient shadings (native axial/radial) and their luminosity soft masks.
    //    The colour shading is an inline dict in the /Shading resources; a
    //    translucent gradient additionally needs a form XObject carrying the
    //    grayscale alpha shading, wrapped by an /SMask ExtGState that joins the
    //    page's /ExtGState dict alongside the constant-alpha states above.
    const fmt = (v: number): string => Number(v.toFixed(4)).toString();
    const shadingRefs: string[] = [];
    for (const { shadingName, softMaskGsName, request } of this.shadings) {
      shadingRefs.push(`${shadingName} ${buildColorShadingDict(request)}`);
      if (!softMaskGsName) continue;

      const [x0, y0, x1, y1] = request.bbox;
      const formId = writer.getNewId();
      writer.writeObject(
        formId,
        new Map<string, string>([
          [PdfKeys.Common.Type, '/XObject'],
          [PdfKeys.Common.Subtype, '/Form'],
          [PdfKeys.Form.FormType, '1'],
          [PdfKeys.Form.BoundingBox, `[${fmt(x0)} ${fmt(y0)} ${fmt(x1)} ${fmt(y1)}]`],
          [PdfKeys.Form.Group, '<< /Type /Group /S /Transparency /CS /DeviceGray /I true >>'],
          [PdfKeys.Form.Resources, `<< /Shading << /ShM ${buildAlphaShadingDict(request)} >> >>`],
        ]),
        '/ShM sh\n'
      );

      const gsId = writer.getNewId();
      writer.writeObject(
        gsId,
        new Map<string, string>([
          [PdfKeys.Common.Type, '/ExtGState'],
          [PdfKeys.GraphicsState.SoftMask, `<< /Type /Mask /S /Luminosity /G ${formId} 0 R >>`],
          [PdfKeys.GraphicsState.FillAlpha, '1'],
          [PdfKeys.GraphicsState.StrokeAlpha, '1'],
        ])
      );
      graphicsStateRefs.push(`${softMaskGsName} ${gsId} 0 R`);
    }
    const shadingResources = shadingRefs.length > 0 ? `<< /Shading << ${shadingRefs.join(' ')} >> >>` : '';

    const graphicsStateResources =
      graphicsStateRefs.length > 0 ? `<< /ExtGState << ${graphicsStateRefs.join(' ')} >> >>` : '';

    return this.combineResources(fontResources, imageResources, graphicsStateResources, shadingResources);
  }

  private combineResources(...resources: string[]): string {
    const nonEmptyResources = resources.filter(r => r && r.trim() !== '');
    if (nonEmptyResources.length === 0) return '<< >>';

    const content = nonEmptyResources
      .map(resource => {
        let inner = resource.trim();
        if (inner.startsWith('<<')) inner = inner.slice(2).trimStart();
        if (inner.endsWith('>>')) inner = inner.slice(0, -2).trimEnd();
        return inner;
      })
      .filter(Boolean)
      .join(' ');

    return `<< ${content} >>`;
  }
}
