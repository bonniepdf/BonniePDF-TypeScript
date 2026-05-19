/**
 * PDF color space for images
 */
export enum ImageColorSpace {
  /**
   * RGB color space (3 components: red, green, blue)
   */
  DeviceRGB = 'DeviceRGB',

  /**
   * CMYK color space (4 components: cyan, magenta, yellow, black)
   */
  DeviceCMYK = 'DeviceCMYK',

  /**
   * Grayscale color space (1 component)
   */
  DeviceGray = 'DeviceGray',

  /**
   * Indexed color space (palette-based)
   */
  Indexed = 'Indexed',
}
