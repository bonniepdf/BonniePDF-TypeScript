/**
 * Text decoration styles that can be combined using bitwise OR.
 */
export enum TextDecoration {
  /** No decoration */
  None = 0,

  /** Underline drawn below the text baseline */
  Underline = 1,

  /** Line drawn through the middle of the text */
  Strikethrough = 2,

  /** Line drawn above the text (over the cap height) */
  Overline = 4,
}
