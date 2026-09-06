/** Defines horizontal alignment within an available layout region. */
export class HorizontalAlignment {
  /**
   * Align to the start (left for LTR languages)
   */
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
