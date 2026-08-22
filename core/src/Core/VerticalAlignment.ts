/**
 * Vertical alignment options for layout elements.
 *
 * The counterpart to {@link HorizontalAlignment}. Meaningful on a container that
 * has more vertical room than its child needs - typically one given an explicit
 * `height` - which is what makes it possible to anchor content to the bottom of a
 * fixed box without hand-computing a top padding.
 */
export class VerticalAlignment {
  /**
   * Align to the top
   */
  static readonly Start = 'Start' as const;
  /**
   * Align to the middle
   */
  static readonly Center = 'Center' as const;
  /**
   * Align to the bottom
   */
  static readonly End = 'End' as const;
  /**
   * Stretch to fill available space
   */
  static readonly Stretch = 'Stretch' as const;
}
