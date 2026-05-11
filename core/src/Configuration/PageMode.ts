/**
 * Defines how the PDF document should be displayed when opened
 */
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

export type PageMode = typeof PageModeEnum[keyof typeof PageModeEnum];