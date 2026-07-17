import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { ImageInfo } from '../../Rendering/Images/ImageInfo';
import { ImageLoader } from '../../Rendering/Images/ImageLoader';
import { ImageFitMode } from './ImageFitMode';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { IAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';

/**
 * An image element that displays JPEG or PNG images in the PDF
 */
export class Image extends ElementBase implements IRoleProvider, IAltTextProvider {
  private cachedInfo: ImageInfo | undefined;

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

  /**
   * Desired display width in points (null = auto)
   */
  width: number | undefined;

  /**
   * Desired display height in points (null = auto-scale)
   */
  height: number | undefined;

  /**
   * How to fit the image within bounds
   */
  fitMode: ImageFitMode = ImageFitMode.Contain;

  /**
   * Whether to maintain aspect ratio (ignored for Fill mode)
   */
  maintainAspectRatio: boolean = true;

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

  // Temporary storage for calculated dimensions
  private displayWidth = { value: 0 };
  private displayHeight = { value: 0 };

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    const info = this.getImageInfo();

    // Calculate display dimensions
    this.calculateDimensions(contentWidth, this.displayWidth, this.displayHeight);

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
      throw new Error('Either FilePath or ImageData must be specified');
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
    const nativeWidth = info.displayWidth;
    const nativeHeight = info.displayHeight;
    const aspectRatio = nativeWidth / nativeHeight;

    // Use specified width or available width
    const targetWidth = this.width ?? availableWidth;
    const targetHeight = this.height ?? (this.maintainAspectRatio ? targetWidth / aspectRatio : nativeHeight);

    let displayWidth = targetWidth;
    let displayHeight = targetHeight;

    // Apply fit mode
    switch (this.fitMode) {
      case ImageFitMode.Contain:
        // Scale to fit within bounds, maintain aspect ratio
        if (this.width !== undefined && this.height !== undefined) {
          const widthRatio = this.width / nativeWidth;
          const heightRatio = this.height / nativeHeight;
          const scale = Math.min(widthRatio, heightRatio);
          displayWidth = nativeWidth * scale;
          displayHeight = nativeHeight * scale;
        } else if (this.width !== undefined) {
          displayWidth = this.width;
          displayHeight = displayWidth / aspectRatio;
        } else if (this.height !== undefined) {
          displayHeight = this.height;
          displayWidth = displayHeight * aspectRatio;
        }
        break;

      case ImageFitMode.Cover:
        // Scale to fill bounds, maintain aspect ratio, crop if needed
        if (this.width !== undefined && this.height !== undefined) {
          const widthRatio = this.width / nativeWidth;
          const heightRatio = this.height / nativeHeight;
          const scale = Math.max(widthRatio, heightRatio);
          displayWidth = nativeWidth * scale;
          displayHeight = nativeHeight * scale;
        }
        break;

      case ImageFitMode.Fill:
        // Stretch to fill, ignore aspect ratio
        displayWidth = this.width ?? availableWidth;
        displayHeight = this.height ?? nativeHeight;
        break;

      case ImageFitMode.FitHeight:
        // Scale to fit height, maintain aspect ratio
        if (this.height !== undefined) {
          displayHeight = this.height;
          displayWidth = displayHeight * aspectRatio;
        }
        break;

      case ImageFitMode.ActualSize:
        // Use native dimensions (1 pixel = 1 point)
        displayWidth = nativeWidth;
        displayHeight = nativeHeight;
        break;
    }

    outDisplayWidth.value = displayWidth;
    outDisplayHeight.value = displayHeight;
  }
}
