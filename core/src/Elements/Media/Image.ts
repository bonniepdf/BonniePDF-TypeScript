import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { ImageInfo } from '../../Rendering/Images/ImageInfo';
import { ImageLoader } from '../../Rendering/Images/ImageLoader';
import { ImageFitMode } from './ImageFitMode';
import { resolveImageBox } from './ImageBox';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toImageFitMode, type ImageFitModeInput } from '../../Normalize/toEnum';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { IAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import { toOptionalLength, type LengthInput } from '../../Normalize/toLength';

/**
 * An image element that displays JPEG or PNG images in the PDF
 */
/** Settable properties declared by {@link Image} itself. */
export const IMAGE_OWN_OPTION_KEYS = [
  'filePath',
  'imageData',
  'altText',
  'isDecorative',
  'width',
  'height',
  'fitMode',
  'maintainAspectRatio',
  'keepResolution',
] as const;

/** The full settable surface, base included. */
export const IMAGE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...IMAGE_OWN_OPTION_KEYS] as const;

/**
 * Options for {@link Image}.
 *
 * `filePath` and `imageData` are mutually exclusive sources; supply one.
 * `filePath` is Node-only (`05 §4`); `imageData` is universal.
 */
export type ImageOptions = ElementOptions &
  Partial<Omit<Pick<Image, (typeof IMAGE_OWN_OPTION_KEYS)[number]>, 'fitMode' | 'width' | 'height'>> & {
    /** Width. Accepts a length: a number of points, `'1cm'`, or `{ value, unit }`. */
    width?: LengthInput;
    /** Height. Accepts a length: a number of points, `'2cm'`, or `{ value, unit }`. */
    height?: LengthInput;
    /** How the image fills its box. Accepts `'contain' | 'cover' | 'fill' | 'fit-height' | 'actual-size'`. */
    fitMode?: ImageFitModeInput;
  };

/** Renders JPEG or PNG image data as a document element. */
export class Image extends ElementBase implements IRoleProvider, IAltTextProvider {
  private cachedInfo: ImageInfo | undefined;

  /** Creates an image, optionally configured in one expression. */
  constructor(options?: ImageOptions) {
    super();
    applyOptions(this, options);
  }

  /**
   * Path to image file (mutually exclusive with imageData)
   */
  filePath: string = '';

  /**
   * Raw image data (mutually exclusive with filePath)
   */
  imageData: Uint8Array = new Uint8Array(0);

  /**
   * Alternate text description for accessibility. When the document opts
   * into `AccessibilityMode.PdfUa1`, this populates the `/Alt` entry on
   * the structure element wrapping the image. Required by PDF/UA for
   * non-decorative figures.
   */
  altText: string = '';

  /**
   * When `true`, the image is purely decorative and is tagged as
   * `/Artifact` with no alt-text warning. Set explicitly for decorative
   * borders, dividers, and background imagery.
   */
  isDecorative: boolean = false;

  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return this.isDecorative || !this.altText ? SemanticRole.Artifact : SemanticRole.Figure;
  }

  private _width?: number;

  /**
   * Desired display width in points (null = auto).
   *
   * Accepts a length: a number of points, `'8cm'`, or `{ value, unit }` (§4A.3).
   */
  public get width(): number | undefined {
    return this._width;
  }
  public set width(value: LengthInput | undefined) {
    this._width = toOptionalLength(value);
  }

  private _height?: number;

  /**
   * Desired display height in points (null = auto-scale).
   *
   * Accepts a length: a number of points, `'6cm'`, or `{ value, unit }` (§4A.3).
   */
  public get height(): number | undefined {
    return this._height;
  }
  public set height(value: LengthInput | undefined) {
    this._height = toOptionalLength(value);
  }

  /**
   * How to fit the image within bounds
   */
  private _fitMode: ImageFitMode = ImageFitMode.Contain;

  /** How the image fills its box. Accepts the enum or a token like `'cover'`. */
  public get fitMode(): ImageFitMode {
    return this._fitMode;
  }
  public set fitMode(value: ImageFitModeInput) {
    this._fitMode = toImageFitMode(value);
  }

  /**
   * Whether to maintain aspect ratio (ignored for Fill mode)
   */
  maintainAspectRatio: boolean = true;

  /**
   * When `true`, the image is embedded at its source resolution regardless of the document's
   * `maxImageDpi`. If the same image is placed more than once, one placement with this set keeps
   * the whole embedded copy at full resolution.
   */
  keepResolution: boolean = false;

  protected override getPreferredContentWidth(): number {
    const info = this.getImageInfo();
    const nativeWidth = info.displayWidth;
    const nativeHeight = info.displayHeight;
    const aspectRatio = nativeWidth / nativeHeight;

    if (this.width !== undefined) return this.width;
    if (this.height !== undefined) return this.height * aspectRatio;
    return nativeWidth;
  }

  protected override measureContentHeight(contentWidth: number): number {
    this.getImageInfo();
    this.calculateDimensions(contentWidth, this.displayWidth, this.displayHeight);
    return this.displayHeight.value;
  }

  // Mutable result holders avoid allocating a tuple during repeated layout passes.
  private displayWidth = { value: 0 };
  private displayHeight = { value: 0 };

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    const info = this.getImageInfo();

    // Calculate display dimensions
    this.calculateDimensions(contentWidth, this.displayWidth, this.displayHeight);
    info.keepResolution = this.keepResolution;

    // Calculate position (Screen coordinates)
    const x = ctx.currentX;
    const y = ctx.currentY;

    // Draw via Canvas
    ctx.canvas.drawImage(info, x, y, this.displayWidth.value, this.displayHeight.value);

    // Advance Y by the image height
    ctx.currentY += this.displayHeight.value;
  }

  /**
   * Asynchronously decode the image and cache its `ImageInfo`.  Required for
   * real-world (Huffman-compressed) PNGs, because the sync loader only
   * handles stored-block PNGs.  `Document.generateBytesAsync()` calls this
   * automatically during its preload phase; you only need to invoke it
   * yourself if you intend to call `generateBytes()` (sync) on a document
   * containing PNG images decoded from arbitrary sources.
   *
   * No-ops if the image is already prepared, or if `imageData` is a JPEG
   * (JPEGs need no decompression - their bytes pass straight into
   * `/DCTDecode`).
   */
  public async prepareAsync(): Promise<void> {
    if (this.cachedInfo !== undefined) return;
    if (this.imageData.length === 0) return; // filePath path is not async-decoded here
    this.cachedInfo = await ImageLoader.loadFromBytesAsync(this.imageData);
  }

  /**
   * True when this image carries raw PNG bytes that have not yet been
   * decoded.  Used by the document async-preload phase to discover which
   * images need a `prepareAsync()` call before the sync render pass runs.
   */
  public needsAsyncDecode(): boolean {
    if (this.cachedInfo !== undefined) return false;
    if (this.imageData.length < 8) return false;
    return (
      this.imageData[0] === 0x89 &&
      this.imageData[1] === 0x50 &&
      this.imageData[2] === 0x4e &&
      this.imageData[3] === 0x47
    );
  }

  /**
   * Get or load image information (auto-detects JPEG or PNG)
   */
  private getImageInfo(): ImageInfo {
    if (this.cachedInfo !== undefined) {
      return this.cachedInfo;
    }

    if (this.imageData.length > 0) {
      this.cachedInfo = ImageLoader.loadFromBytes(this.imageData);
    } else if (this.filePath !== '') {
      this.cachedInfo = ImageLoader.load(this.filePath);
    } else {
      throw new Error('Either filePath or imageData must be specified');
    }

    return this.cachedInfo;
  }

  /**
   * Calculate display dimensions based on fit mode
   */
  private calculateDimensions(
    availableWidth: number,
    outDisplayWidth: { value: number },
    outDisplayHeight: { value: number }
  ): void {
    const info = this.getImageInfo();

    // Use displayWidth/Height so EXIF-rotated JPEGs (orientation 5–8) lay
    // out in their visual orientation, not their stored sensor orientation.
    resolveImageBox(this, info.displayWidth, info.displayHeight, availableWidth, this.box);
    outDisplayWidth.value = this.box.width;
    outDisplayHeight.value = this.box.height;
  }

  private readonly box = { width: 0, height: 0 };
}
