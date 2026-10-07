/** Entries describing raster image XObjects. */
export const Image = {
  /** Width of the image in samples. */
  Width: '/Width',

  /** Height of the image in samples. */
  Height: '/Height',

  /** Color space used to interpret the image's color samples. */
  ColorSpace: '/ColorSpace',

  /** Number of bits representing each image color component. */
  BitsPerComponent: '/BitsPerComponent',

  /** Pairs of values mapping encoded image samples to color-component values. */
  Decode: '/Decode',

  /** Reference to the grayscale image supplying this image's per-pixel alpha. */
  SoftMask: '/SMask',
} as const;
