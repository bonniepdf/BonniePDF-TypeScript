/** Provides the supported portrait and landscape page orientations. */
export class PageOrientation {
  /** The shorter side of the page size is the page width. */
  static readonly Portrait = 'Portrait' as const;
  /** The longer side of the page size is the page width. */
  static readonly Landscape = 'Landscape' as const;
}
