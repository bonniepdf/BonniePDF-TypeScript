import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { ImageInfo } from '../../Rendering/Images/ImageInfo';
import { ImageLoader } from '../../Rendering/Images/ImageLoader';
import { ImageFitMode } from './ImageFitMode';

/**
 * An image element that displays JPEG or PNG images in the PDF
 */
export class Image extends ElementBase {
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
    const nativeWidth = info.width;
    const nativeHeight = info.height;
    const aspectRatio = nativeWidth / nativeHeight;

    if (this.width !== undefined) return this.width;
    if (this.height !== undefined) return this.height * aspectRatio;
    return nativeWidth;
  }

  protected override measureContentHeight(contentWidth: number): number {
    const info = this.getImageInfo();
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

    const nativeWidth = info.width;
    const nativeHeight = info.height;
    const aspectRatio = nativeWidth / nativeHeight;

    // Use specified width or available width
    let targetWidth = this.width ?? availableWidth;
    let targetHeight = this.height ?? (this.maintainAspectRatio ? targetWidth / aspectRatio : nativeHeight);

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
