import { Image } from '../Elements/Media/Image';
import { ImageFitMode } from '../Elements/Media/ImageFitMode';



  /**
   * Fluent extension methods for images
   */
  export class ImageExtensions {
    /**
     * Sets the fit mode to contain
     */
    static fitContain(i: Image): Image {
      i.fitMode = ImageFitMode.Contain;
      return i;
    }

    /**
     * Sets the fit mode to cover
     */
    static fitCover(i: Image): Image {
      i.fitMode = ImageFitMode.Cover;
      return i;
    }

    /**
     * Sets the fit mode to fill
     */
    static fitFill(i: Image): Image {
      i.fitMode = ImageFitMode.Fill;
      return i;
    }

    /**
     * Sets the fit mode to fit height
     */
    static fitHeight(i: Image): Image {
      i.fitMode = ImageFitMode.FitHeight;
      return i;
    }

    /**
     * Sets the fit mode to actual size
     */
    static actualSize(i: Image): Image {
      i.fitMode = ImageFitMode.ActualSize;
      return i;
    }

    /**
     * Sets the desired width of the image
     */
    static width(i: Image, value: number): Image {
      i.width = value;
      return i;
    }

    /**
     * Sets the desired height of the image
     */
    static height(i: Image, value: number): Image {
      i.height = value;
      return i;
    }

    /**
     * Sets the desired size of the image
     */
    static size(i: Image, width: number, height: number): Image {
      i.width = width;
      i.height = height;
      return i;
    }
  }

  /**
   * Shortcut functions for ImageExtensions
   */
  export function fitContain(i: Image): Image {
    return ImageExtensions.fitContain(i);
  }

  export function fitCover(i: Image): Image {
    return ImageExtensions.fitCover(i);
  }

  export function fitFill(i: Image): Image {
    return ImageExtensions.fitFill(i);
  }

  export function fitHeight(i: Image): Image {
    return ImageExtensions.fitHeight(i);
  }

  export function actualSize(i: Image): Image {
    return ImageExtensions.actualSize(i);
  }

  export function imageWidth(i: Image, value: number): Image {
    return ImageExtensions.width(i, value);
  }

  export function imageHeight(i: Image, value: number): Image {
    return ImageExtensions.height(i, value);
  }

  export function imageSize(i: Image, width: number, height: number): Image {
    return ImageExtensions.size(i, width, height);
  }
