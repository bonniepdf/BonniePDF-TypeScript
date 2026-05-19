/**
 * How to fit an image within its bounds
 */
export enum ImageFitMode {
  /**
   * Scale to fit within bounds, maintain aspect ratio
   */
  Contain = 'Contain',

  /**
   * Scale to fill bounds, maintain aspect ratio, crop if needed
   */
  Cover = 'Cover',

  /**
   * Stretch to fill bounds, ignore aspect ratio
   */
  Fill = 'Fill',

  /**
   * Scale to fit height, maintain aspect ratio
   */
  FitHeight = 'FitHeight',

  /**
   * Use actual image size (1 pixel = 1 point)
   */
  ActualSize = 'ActualSize',
}
