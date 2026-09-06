/** Defines the initial magnification used when a PDF is opened. */
export class ZoomLevel {
  /**
   * Fit the entire page within the window
   */
  static readonly FitPage = 'FitPage' as const;
  /**
   * Fit the page width within the window
   */
  static readonly FitWidth = 'FitWidth' as const;
  /**
   * Fit the page height within the window
   */
  static readonly FitHeight = 'FitHeight' as const;
  /**
   * Use a custom zoom level (specified in DocumentSettings)
   */
  static readonly Custom = 'Custom' as const;
}
