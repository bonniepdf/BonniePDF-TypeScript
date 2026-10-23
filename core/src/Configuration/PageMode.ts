/** Defines how a PDF viewer initially presents the document. */
export class PageModeEnum {
  /**
   * Neither document outline nor thumbnail images visible
   */
  static readonly UseNone = 'UseNone' as const;
  /**
   * Document outline visible
   */
  static readonly UseOutlines = 'UseOutlines' as const;
  /**
   * Thumbnail images visible
   */
  static readonly UseThumbs = 'UseThumbs' as const;
  /**
   * Full-screen mode, with no menu bar, window controls, or any other window visible
   */
  static readonly FullScreen = 'FullScreen' as const;
  /**
   * Optional content group panel visible
   */
  static readonly UseOC = 'UseOC' as const;
  /**
   * Attachments panel visible
   */
  static readonly UseAttachments = 'UseAttachments' as const;
}

/**
 * How a PDF viewer initially presents the document: one of the {@link PageModeEnum} values, such as `'UseOutlines'` or `'FullScreen'`.
 */
export type PageMode = (typeof PageModeEnum)[keyof typeof PageModeEnum];
