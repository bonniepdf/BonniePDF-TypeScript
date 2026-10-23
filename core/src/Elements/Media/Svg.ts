import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import type { ImageInfo } from '../../Rendering/Images/ImageInfo';
import { ImageLoader } from '../../Rendering/Images/ImageLoader';
import { ImageFitMode } from './ImageFitMode';
import { resolveImageBox, type ImageBoxRequest } from './ImageBox';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toImageFitMode, type ImageFitModeInput } from '../../Normalize/toEnum';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { IAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import { toOptionalLength, type LengthInput } from '../../Normalize/toLength';
import { getPlatformIO } from '../../Platform/PlatformIO';
import { BonniePdfCanvasSink } from '../../Drawing/BonniePdfCanvasSink';
import { BonniePdfFontProvider } from '../../Drawing/BonniePdfFontProvider';
import { emit } from '../../Rendering/Svg/Emit';
import {
  fitDocument,
  parseSvg,
  rasterSnippets,
  SvgUnsupportedFeatureError,
  type SvgRasterizer,
} from '../../Rendering/Svg/ImportSvg';
import type { IrDocument } from '../../Rendering/Svg/Ir/Types';

export { SvgUnsupportedFeatureError, type SvgRasterizer };

/** Points per SVG user unit: user units are CSS pixels, 96 to the inch. */
const PT_PER_PX = 0.75;

/**
 * The element's sizes are computed in single precision, as the .NET element's
 * `float` sizes are, so the two draw byte-identical operators.
 */
const f32 = Math.fround;

/** The box an {@link Svg}'s generator is asked to fill, in points. */
export interface SvgSize {
  /** Width of the box, in points. */
  readonly width: number;
  /** Height of the box, in points. */
  readonly height: number;
}

/** Settable properties declared by {@link Svg} itself. */
export const SVG_OWN_OPTION_KEYS = [
  'svgData',
  'filePath',
  'svgGenerator',
  'altText',
  'isDecorative',
  'width',
  'height',
  'fitMode',
  'strictUnsupportedFeatures',
] as const;

/** The full settable surface, base included. */
export const SVG_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...SVG_OWN_OPTION_KEYS] as const;

/**
 * Options for {@link Svg}.
 *
 * `svgData`, `filePath` and `svgGenerator` are mutually exclusive sources;
 * supply one. `filePath` is Node-only; the others are universal.
 */
export type SvgOptions = ElementOptions &
  Partial<Omit<Pick<Svg, (typeof SVG_OWN_OPTION_KEYS)[number]>, 'fitMode' | 'width' | 'height'>> & {
    /** Width. Accepts a length: a number of points, `'1cm'`, or `{ value, unit }`. */
    width?: LengthInput;
    /** Height. Accepts a length: a number of points, `'2cm'`, or `{ value, unit }`. */
    height?: LengthInput;
    /** How the drawing fills its box. Accepts `'contain' | 'cover' | 'fill' | 'fit-height' | 'actual-size'`. */
    fitMode?: ImageFitModeInput;
  };

/** A parsed document, and what drawing it needs. */
interface Parsed {
  readonly source: string;
  readonly strict: boolean;
  readonly document: IrDocument;
  /** Rasterized snippets and their decoded images; set only by the async path. */
  readonly images?: ReadonlyMap<string, Uint8Array>;
  readonly decoded?: ReadonlyMap<Uint8Array, ImageInfo>;
}

/**
 * Draws an SVG document as vector content: paths, fills, strokes, gradients,
 * clips and text drawn as glyph outlines, through the same canvas as every
 * other element.
 *
 * The element sizes its box exactly as {@link Image} does, from `width`,
 * `height` and the document's intrinsic size under `fitMode`; the document's
 * own `viewBox` and `preserveAspectRatio` then place its content inside that
 * box, as a browser's `<img>` does.
 *
 * Text uses the fonts registered with BonniePDF, resolved as for a paragraph.
 * Features outside the supported profile (filters, masks, patterns,
 * stylesheets, …) fail generation by default; see
 * {@link strictUnsupportedFeatures}.
 */
export class Svg extends ElementBase implements IRoleProvider, IAltTextProvider {
  private parsed: Parsed | undefined;
  private file: { path: string; markup: string } | undefined;
  private generated: { size: SvgSize; markup: string } | undefined;

  /** Creates an SVG element, optionally configured in one expression. */
  constructor(options?: SvgOptions) {
    super();
    applyOptions(this, options);
  }

  /** SVG markup (mutually exclusive with `filePath` and `svgGenerator`). */
  svgData: string = '';

  /** Path to an SVG file; Node only (mutually exclusive with `svgData` and `svgGenerator`). */
  filePath: string = '';

  /**
   * Produces the markup for the box it is given, in points (mutually exclusive
   * with `svgData` and `filePath`). The box cannot come from markup that does
   * not exist yet, so a generator needs both `width` and `height`.
   */
  svgGenerator: ((size: SvgSize) => string) | undefined = undefined;

  private _altText: string = '';

  /**
   * Alternate text for accessibility. Under PDF/UA-1 it becomes the figure's
   * `/Alt`. When not set, reads as the document's own `<title>`, which is used
   * in its place.
   */
  get altText(): string {
    return this._altText || this.documentTitle();
  }
  set altText(value: string) {
    this._altText = value;
  }

  /** When `true`, the drawing is decorative and tagged as an artifact, with no alt-text finding. */
  isDecorative: boolean = false;

  /**
   * When `true` (the default), a document using a feature outside the
   * supported profile fails generation, naming every such feature. When
   * `false`, the rest is drawn and each skipped feature is a diagnostic - or,
   * with an SVG rasterizer registered on the document and the async generate
   * path, drawn as an image in its place.
   */
  strictUnsupportedFeatures: boolean = true;

  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return this.isDecorative || !this.altText ? SemanticRole.Artifact : SemanticRole.Figure;
  }

  private _width?: number;

  /** Desired display width in points (undefined = from the document). Accepts a length. */
  public get width(): number | undefined {
    return this._width;
  }
  public set width(value: LengthInput | undefined) {
    this._width = toOptionalLength(value);
  }

  private _height?: number;

  /** Desired display height in points (undefined = from the document). Accepts a length. */
  public get height(): number | undefined {
    return this._height;
  }
  public set height(value: LengthInput | undefined) {
    this._height = toOptionalLength(value);
  }

  private _fitMode: ImageFitMode = ImageFitMode.Contain;

  /** How the drawing fills its box, as for {@link Image}. Accepts the enum or a token like `'cover'`. */
  public get fitMode(): ImageFitMode {
    return this._fitMode;
  }
  public set fitMode(value: ImageFitModeInput) {
    this._fitMode = toImageFitMode(value);
  }

  /**
   * Parses the document ahead of layout, rasterizing what the profile cannot
   * draw when a rasterizer is given and {@link strictUnsupportedFeatures} is
   * off. The async generate paths call this; there is no need to call it
   * yourself.
   */
  public async prepareAsync(rasterizer?: SvgRasterizer): Promise<void> {
    const base = this.parse();
    if (rasterizer === undefined || this.strictUnsupportedFeatures || base.document.unsupported.length === 0) return;
    if (base.images !== undefined) return;

    // Rasterize at the size the element will most likely be drawn: the box is
    // not final until layout, but the IR is re-fitted to it then.
    const box = this.provisionalBox(base.document);
    const document = parseSvg(base.source, {
      strict: false,
      fonts: new BonniePdfFontProvider(),
      rasterizer,
      ...(box !== undefined ? { width: box.width / PT_PER_PX, height: box.height / PT_PER_PX } : {}),
    });
    const images = new Map<string, Uint8Array>();
    for (const svg of rasterSnippets(document.children)) {
      if (!images.has(svg)) images.set(svg, await rasterizer(svg));
    }
    const decoded = new Map<Uint8Array, ImageInfo>();
    for (const png of images.values()) {
      if (!decoded.has(png)) decoded.set(png, await ImageLoader.loadFromBytesAsync(png));
    }
    this.parsed = { ...base, document, images, decoded };
  }

  /**
   * The synchronous generate paths call this before layout. A document that
   * the registered rasterizer would draw differently fails here rather than
   * being drawn without it.
   */
  public prepare(rasterizerRegistered: boolean): void {
    const parsed = this.parse();
    if (
      rasterizerRegistered &&
      !this.strictUnsupportedFeatures &&
      parsed.images === undefined &&
      parsed.document.unsupported.length > 0
    ) {
      throw new Error(
        'This SVG uses features outside the supported profile, which the registered SVG rasterizer draws as images, ' +
          'and only the async generate path can call it. Use generateBytesAsync() or saveAsync().'
      );
    }
  }

  protected override getPreferredContentWidth(): number {
    const native = this.nativeSize();
    if (this.width !== undefined) return f32(this.width);
    if (native === undefined) return 0;
    if (this.height !== undefined) return f32(f32(this.height) * f32(native.width / native.height));
    return native.width;
  }

  protected override measureContentHeight(contentWidth: number): number {
    return this.resolveBox(contentWidth)?.height ?? 0;
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    const box = this.resolveBox(contentWidth);
    if (box === undefined) {
      ctx.resources.diagnostics.addError(
        'render',
        'The SVG has no intrinsic size (no width, height or viewBox), so it needs both width and height; it was not drawn.',
        'svg'
      );
      return;
    }

    const parsed = this.parse();
    for (const { feature, detail } of parsed.document.unsupported) {
      ctx.resources.diagnostics.addWarning('render', `SVG feature not drawn: ${feature}: ${detail}`, 'svg');
    }

    const widthPx = box.width / PT_PER_PX;
    const heightPx = box.height / PT_PER_PX;
    const document = fitDocument(parsed.document, widthPx, heightPx);
    const decoded = parsed.decoded;
    const sink = new BonniePdfCanvasSink(ctx.canvas, png => decoded?.get(png) ?? ImageLoader.loadFromBytes(png));

    // Drawn in CSS px scaled onto points, so a document with no viewBox, whose
    // user units are px, is drawn at 0.75 pt per unit too. Clipped to its box,
    // as a browser clips an SVG to its viewport.
    const canvas = ctx.canvas;
    canvas.saveState();
    canvas.translate(f32(ctx.currentX), f32(ctx.currentY));
    canvas.scale(PT_PER_PX, PT_PER_PX);
    canvas.beginPath();
    canvas.moveTo(0, 0);
    canvas.lineTo(f32(widthPx), 0);
    canvas.lineTo(f32(widthPx), f32(heightPx));
    canvas.lineTo(0, f32(heightPx));
    canvas.closePath();
    canvas.clipToCurrentPath();
    emit(document, sink, parsed.images);
    canvas.restoreState();

    ctx.currentY += box.height;
  }

  /** The display box in points, or undefined when there is nothing to size it from. */
  private resolveBox(availableWidth: number): SvgSize | undefined {
    if (this.svgGenerator !== undefined) return this.generatorBox();
    const native = this.nativeSize();
    if (native === undefined) {
      return this.generatorBox();
    }
    const out = { width: 0, height: 0 };
    resolveImageBox(this.boxRequest(), native.width, native.height, availableWidth, out, f32);
    return out;
  }

  /** The box to rasterize at before layout: the final one, unless it depends on the available width. */
  private provisionalBox(document: IrDocument): SvgSize | undefined {
    if (this.svgGenerator !== undefined) return this.generatorBox();
    const native = intrinsicSize(document);
    if (native === undefined) return this.resolveBox(0);
    const out = { width: 0, height: 0 };
    resolveImageBox(this.boxRequest(), native.width, native.height, native.width, out, f32);
    return out;
  }

  private boxRequest(): ImageBoxRequest {
    return { width: this.width, height: this.height, fitMode: this.fitMode, maintainAspectRatio: true };
  }

  private generatorBox(): SvgSize | undefined {
    return this.width !== undefined && this.height !== undefined
      ? { width: f32(this.width), height: f32(this.height) }
      : undefined;
  }

  /** Intrinsic size in points, or undefined when the document declares none. */
  private nativeSize(): SvgSize | undefined {
    if (this.svgGenerator !== undefined) return this.generatorBox();
    return intrinsicSize(this.parse().document);
  }

  private documentTitle(): string {
    try {
      return this.parse().document.title ?? '';
    } catch {
      // Unreadable markup has no title; the error surfaces when it is drawn.
      return '';
    }
  }

  /** Parses the source, once per distinct source, and enforces strictness. */
  private parse(): Parsed {
    const source = this.source();
    const strict = this.strictUnsupportedFeatures;
    if (this.parsed === undefined || this.parsed.source !== source || this.parsed.strict !== strict) {
      const document = parseSvg(source, { strict: false, fonts: new BonniePdfFontProvider() });
      this.parsed = { source, strict, document };
    }
    if (strict && this.parsed.document.unsupported.length > 0) {
      throw new SvgUnsupportedFeatureError(this.parsed.document.unsupported);
    }
    return this.parsed;
  }

  private source(): string {
    const given = [this.svgData !== '', this.filePath !== '', this.svgGenerator !== undefined].filter(Boolean).length;
    if (given > 1) throw new Error('Set only one of svgData, filePath and svgGenerator');

    if (this.svgData !== '') return this.svgData;
    if (this.filePath !== '') {
      if (this.file === undefined || this.file.path !== this.filePath) {
        const io = getPlatformIO();
        if (io.readFileSync === undefined)
          throw new Error('filePath needs file IO, which only Node provides; use svgData');
        this.file = { path: this.filePath, markup: new TextDecoder().decode(io.readFileSync(this.filePath)) };
      }
      return this.file.markup;
    }
    if (this.svgGenerator !== undefined) {
      const size = this.generatorBox();
      if (size === undefined) throw new Error('An SVG generator needs both width and height');
      if (
        this.generated === undefined ||
        this.generated.size.width !== size.width ||
        this.generated.size.height !== size.height
      ) {
        this.generated = { size, markup: this.svgGenerator(size) };
      }
      return this.generated.markup;
    }
    throw new Error('Either svgData, filePath or svgGenerator must be specified');
  }
}

function intrinsicSize(document: IrDocument): SvgSize | undefined {
  const { intrinsicWidth, intrinsicHeight } = document.fit;
  if (intrinsicWidth === undefined || intrinsicHeight === undefined) return undefined;
  return { width: f32(intrinsicWidth * PT_PER_PX), height: f32(intrinsicHeight * PT_PER_PX) };
}
