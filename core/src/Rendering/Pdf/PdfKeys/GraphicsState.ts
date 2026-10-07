/** Entries configuring transparency in extended graphics states. */
export const GraphicsState = {
  /** Constant alpha applied to nonstroking painting operations. */
  FillAlpha: '/ca',

  /** Constant alpha applied to stroking painting operations. */
  StrokeAlpha: '/CA',

  /** Soft-mask dictionary or name controlling transparency for subsequent painting. */
  SoftMask: '/SMask',
} as const;
