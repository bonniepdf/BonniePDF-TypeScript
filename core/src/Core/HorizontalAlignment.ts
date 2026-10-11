/** Defines horizontal alignment within an available layout region. */
export class HorizontalAlignment {
  /** Physical left edge, independent of direction. */
  static readonly Left = 'Left' as const;
  /** Physical right edge, independent of direction. */
  static readonly Right = 'Right' as const;
  /** Inline start: left in LTR, right in RTL. */
  static readonly Start = 'Start' as const;
  /**
   * Align to the center
   */
  static readonly Center = 'Center' as const;
  /**
   * Align to the end (right for LTR languages)
   */
  static readonly End = 'End' as const;
  /**
   * Stretch to fill available space
   */
  static readonly Stretch = 'Stretch' as const;
}
