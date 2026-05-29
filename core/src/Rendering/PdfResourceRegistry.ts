import { ImageInfo } from './Images/ImageInfo';
import { EmbeddedFontInfo } from '../Typography/EmbeddedFontInfo';
import { Color } from '../Core/Color';
import { DeferredXObjectInfo } from './RenderContext';
import { StandardFonts } from '../Typography/StandardFonts';
import { IPdfWriter, FontWriter } from './Writers/PdfWriter';
import { ImageWriter } from './Images/ImageWriter';
import { PdfSyntax } from './Pdf/PdfSyntax';
import { TtfFont } from '../Typography/TrueType/TtfFont';
import { GlyphUsageTracker } from '../Typography/GlyphUsageTracker';
import { FontManager } from '../Typography/FontManager';
import { FontMetrics } from '../Typography/FontMetrics';
import { DiagnosticsCollector } from '../Core/Diagnostics';

export class PdfResourceRegistry {
  private fontCounter = 0;
  private imageCounter = 0;
  public pdfAEnabled = false;

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

  public registerFont(fontIdentifier: string): string {
    // (A) Direct TTF/OTF path
    if (PdfResourceRegistry.isEmbeddedFont(fontIdentifier)) {
      return this.registerEmbeddedFont(fontIdentifier);
    }

    // (B) Already registered as a virtual (bytes-based) font
    const virtualKey = `virtual:${fontIdentifier}`;
    if (this.embeddedFonts.has(virtualKey)) {
      return this.embeddedFonts.get(virtualKey)!.resourceName;
    }

    if (this.pdfAEnabled) {
      // 1. Try FontManager (bytes-based — works in all environments)
      const bytes = FontManager.getBytesForStandardFont(fontIdentifier);
      if (bytes) {
        const virtualKey = `virtual:${fontIdentifier}`;
        const resourceName = this.registerEmbeddedFontFromBytes(bytes, virtualKey);
        this.fontNameMap.set(fontIdentifier, resourceName);
        this.fontAliasMap.set(fontIdentifier, virtualKey);
        // Register the TtfFont instance (not a file path) so FontMetrics can measure accurately.
        const info = this.embeddedFonts.get(virtualKey);
        if (info?.font instanceof TtfFont) {
          FontMetrics.registerFontInstance(fontIdentifier, info.font);
        }
        return resourceName;
      }

      // 2. Legacy: file-path based resolution (Node.js, system fonts)
      const ttfPath = this.resolveStandardFontToTtf(fontIdentifier);
      if (ttfPath) {
        const resourceName = this.registerEmbeddedFont(ttfPath);
        this.fontNameMap.set(fontIdentifier, resourceName);
        this.fontAliasMap.set(fontIdentifier, ttfPath);
        FontMetrics.registerFontAlias(fontIdentifier, ttfPath);
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
        // stub and under-measures supplementary-plane glyphs (e.g. emoji),
        // preventing word-wrap from triggering.
        FontMetrics.registerFontInstance(filePath, font);
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
   * Mirrors what {@link writeResources} does — anything that won't
   * be aliased to a TTF and isn't already an embedded-font path will
   * be written via `writeType1Font` (non-embedded).
   */
  public hasNonEmbeddedStandardFont(): boolean {
    for (const fontIdentifier of this.fontNameMap.keys()) {
      if (this.fontAliasMap.has(fontIdentifier)) continue;
      if (PdfResourceRegistry.isEmbeddedFont(fontIdentifier)) continue;
      return true;
    }
    return false;
  }

  /**
   * Loads the actual TtfFont bytes for a previously registered embedded font path.
   * Must be called (and awaited) before rendering begins so that glyph metrics and
   * tracking are available during layout and content-stream generation.
   */
  public async preloadEmbeddedFont(filePath: string): Promise<void> {
    const info = this.embeddedFonts.get(filePath);
    if (!info) return; // not registered — nothing to do
    if (info.font instanceof TtfFont) return; // already loaded

    try {
      const font = await TtfFont.fromFile(filePath);
      info.font = font;
      info.tracker = new GlyphUsageTracker(font);
      // Mirror the sync path: make the parsed font visible to FontMetrics
      // under the same key so the synchronous measurement path uses real
      // per-glyph advances during the subsequent render pass.
      FontMetrics.registerFontInstance(filePath, font);
    } catch (err) {
      // Don't reject the whole render — record the failure so the caller can
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
        font = TtfFont.loadFromBytes(bytes);
        tracker = new GlyphUsageTracker(font);
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
    // FontManager covers all cases via bytes — this is a fallback for direct file paths.
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

  public resolveEmbeddedFont(fontIdentifier: string): any {
    if (PdfResourceRegistry.isEmbeddedFont(fontIdentifier)) {
      const fontInfo = this.getEmbeddedFont(fontIdentifier);
      return fontInfo?.font;
    }

    // Check for virtual (bytes-based) font
    const virtualKey = `virtual:${fontIdentifier}`;
    if (this.embeddedFonts.has(virtualKey)) {
      return this.embeddedFonts.get(virtualKey)!.font;
    }

    if (this.fontAliasMap.has(fontIdentifier)) {
      const ttfPath = this.fontAliasMap.get(fontIdentifier)!;
      const fontInfo = this.getEmbeddedFont(ttfPath);
      return fontInfo?.font;
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

  public getNewImageId(): number {
    return ++this.imageCounter;
  }

  public registerImage(info: ImageInfo): number {
    const dataToHash = info.originalData && info.originalData.length > 0 ? info.originalData : info.data;
    const key = 'img_' + this.computeHash(dataToHash);

    if (!this.imageIdMap.has(key)) {
      const imageId = this.getNewImageId();
      this.imageIdMap.set(key, imageId);
      this.loadedImages.set(key, info);
      return imageId;
    }

    return this.imageIdMap.get(key)!;
  }

  private computeHash(data: Uint8Array): string {
    // Stub: would use SHA256
    return Array.from(data)
      .slice(0, 16)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
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
    imageWriter.pdfAEnabled = this.pdfAEnabled;

    // 1. Write fonts
    for (const [fontIdentifier, resourceName] of this.fontNameMap) {
      // Skip aliased entries (they're written under their canonical TTF path)
      if (this.fontAliasMap.has(fontIdentifier)) continue;

      // Skip logical names that have a virtual (bytes-based) entry registered under virtual:<name>
      if (!fontIdentifier.startsWith('virtual:') && this.embeddedFonts.has(`virtual:${fontIdentifier}`)) continue;

      if (PdfResourceRegistry.isEmbeddedFont(fontIdentifier)) {
        const fontInfo = this.embeddedFonts.get(fontIdentifier);
        if (fontInfo && fontInfo.font) {
          // Font was successfully loaded — write as a proper Type0 embedded font.
          const type0Id = writer.getNewId();
          fontInfo.type0ObjectId = type0Id;
          this.fontIdMap.set(fontIdentifier, type0Id);
          fontWriter.writeEmbeddedTtfFont(type0Id, fontInfo);
        } else {
          // Font failed to load (file missing, parse error, etc.) — fall back to
          // the nearest standard Type1 font so the document is still valid.
          const fontId = writer.getNewId();
          this.fontIdMap.set(fontIdentifier, fontId);
          fontWriter.writeType1Font(fontId, this.mapToStandardFontName(fontIdentifier));
        }
      } else {
        const fontId = writer.getNewId();
        this.fontIdMap.set(fontIdentifier, fontId);
        fontWriter.writeType1Font(fontId, this.mapToStandardFontName(fontIdentifier));
      }
    }

    // 2. Write images
    this.imagePdfObjectIds.clear();
    for (const [key, info] of this.loadedImages) {
      const pdfObjectId = writer.getNewId();
      this.imagePdfObjectIds.set(key, pdfObjectId);
      const internalId = this.imageIdMap.get(key)!;
      const resourceName = this.getImageResourceName(internalId);
      imageWriter.writeImage(pdfObjectId, info, resourceName);
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
          ['/Type', '/XObject'],
          ['/Subtype', '/Form'],
          ['/BBox', `[0 -${info.fontSize * 2} 100 0]`],
          ['/Resources', `<< /Font << ${info.fontResourceName} ${fontObjId} 0 R >> >>`],
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

    return this.combineResources(fontResources, imageResources);
  }

  private combineResources(fontResources: string, imageResources: string): string {
    if (!imageResources) return fontResources;

    // Strip outer << >> from imageResources and merge into fontResources
    let imgContent = imageResources;
    if (imgContent.startsWith('<< ')) imgContent = imgContent.slice(3);
    if (imgContent.endsWith(' >>')) imgContent = imgContent.slice(0, -3);

    let fontBase = fontResources;
    if (fontBase.endsWith(' >>')) fontBase = fontBase.slice(0, -3);

    return `${fontBase} ${imgContent} >>`;
  }
}
