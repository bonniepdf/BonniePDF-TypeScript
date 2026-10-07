/** Entries describing ICC-based color profiles. */
export const ColorProfile = {
  /** Number of color components described by the ICC profile. */
  Components: '/N',

  /** Fallback color space used when the ICC profile cannot be interpreted. */
  Alternate: '/Alternate',
} as const;
