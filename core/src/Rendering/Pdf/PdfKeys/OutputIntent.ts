/** Entries describing the intended color reproduction conditions. */
export const OutputIntent = {
  /** Name identifying the output-intent category, such as the PDF/A output intent. */
  Subtype: '/S',

  /** Identifier of the intended output condition, such as the sRGB profile name. */
  ConditionIdentifier: '/OutputConditionIdentifier',

  /** Registry identifying the source of the output-condition identifier. */
  RegistryName: '/RegistryName',

  /** Reference to the ICC profile describing the intended output condition. */
  DestinationProfile: '/DestOutputProfile',
} as const;
