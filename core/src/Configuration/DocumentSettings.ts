import { PdfSize } from './PdfSize';
import { PageOrientation } from '../Core/PageOrientation';
import { ZoomLevel } from './ZoomLevel';
import { PageMode, PageModeEnum } from './PageMode';
import { PdfVersion } from './PdfVersion';
import { BookmarkItem } from './BookmarkItem';
import { WatermarkSettings } from './WatermarkSettings';
import { EncryptionSettings } from '../Security/Models/EncryptionSettings';

interface _LocalIElement {
  getPreferredWidth(): number;
  measureHeight(availableWidth: number): number;
  render(ctx: any, width: number): void;
}

/**
 * Configuration settings for PDF document creation and display
 */
export class DocumentSettings {
  /**
   * Template function for generating page headers.
   * Called with the page number (1-based) and should return an IElement to render at the top of each page.
   * The returned element is rendered at the top margin position.
   */
  public headerTemplate?: (pageNumber: number) => _LocalIElement | undefined;
  /**
   * Template function for generating page footers.
   * Called with the page number (1-based) and should return an IElement to render at the bottom of each page.
   * The returned element is rendered at the bottom margin position.
   */
  public footerTemplate?: (pageNumber: number) => _LocalIElement | undefined;
  /**
   * The page size for the document (default: A4)
   */
  public pageSize: PdfSize;
  /**
   * The page orientation for the document (default: Portrait)
   */
  public orientation: PageOrientation;
  /**
   * The margin size in points for all pages (default: 50)
   */
  public margin: number;
  /**
   * The default zoom level when the PDF is opened (default: FitPage)
   */
  public defaultZoom: ZoomLevel;
  /**
   * Custom zoom level for ZoomLevel.Custom (1.0 = 100%, default: 1.0)
   */
  public customZoomLevel: number;
  /**
   * How the PDF document should be displayed when opened (default: UseNone)
   */
  public pageMode: PageMode;
  /**
   * Whether to hide the toolbar in the PDF viewer (default: false)
   */
  public hideToolbar: boolean;
  /**
   * Whether to hide the menubar in the PDF viewer (default: false)
   */
  public hideMenubar: boolean;
  /**
   * Whether to hide the window UI in the PDF viewer (default: false)
   */
  public hideWindowUI: boolean;
  /**
   * Whether to fit the document window to the first page (default: false)
   */
  public fitWindow: boolean;
  /**
   * Whether to center the document window on screen (default: false)
   */
  public centerWindow: boolean;
  /**
   * Whether to display the document title in the title bar instead of filename (default: false)
   */
  public displayDocTitle: boolean;
  /**
   * Gets or sets the PDF version for the output document (default: PDF 1.4).
   */
  public version: PdfVersion;
  /**
   * Gets or sets whether PDF/A-1b archival mode is enabled.
   * Requires Version == Pdf17. Cannot be used with encryption.
   */
  public pdfAEnabled: boolean;
  /**
   * Gets or sets the bookmark items for the document outline tree.
   */
  public bookmarks: BookmarkItem[];
  /**
   * Gets whether the document has any bookmarks defined.
   */
  public get hasBookmarks(): boolean {
    return this.bookmarks.length > 0;
  }
  /**
   * Internal destinations mapping a name to a 0-based page index.
   */
  public namedDestinations: Map<string, number>;
  /**
   * Gets or sets the watermark settings for the document.
   * When null, no watermark is rendered.
   */
  public watermark?: WatermarkSettings;
  /**
   * Gets or sets the encryption settings for the document.
   * When null, the document is not encrypted.
   */
  public encryption?: EncryptionSettings;
  /**
   * Gets whether encryption is enabled for this document.
   */
  public get isEncrypted(): boolean {
    return this.encryption !== undefined;
  }

  constructor();
  constructor(pageSize: PdfSize, margin: number);
  constructor(pageSize: PdfSize, orientation: PageOrientation, margin: number);
  constructor(pageSize: PdfSize, orientation: PageOrientation);
  constructor(pageSize?: PdfSize, orientationOrMargin?: PageOrientation | number, margin?: number) {
    this.pageSize = pageSize || PdfSize.a4;
    this.orientation = PageOrientation.Portrait;
    this.margin = 50;
    this.defaultZoom = ZoomLevel.FitPage;
    this.customZoomLevel = 1.0;
    this.pageMode = PageModeEnum.UseNone;
    this.hideToolbar = false;
    this.hideMenubar = false;
    this.hideWindowUI = false;
    this.fitWindow = false;
    this.centerWindow = false;
    this.displayDocTitle = false;
    this.version = PdfVersion.Pdf14;
    this.pdfAEnabled = false;
    this.bookmarks = [];
    this.namedDestinations = new Map();

    if (typeof orientationOrMargin === 'number') {
      this.margin = orientationOrMargin;
    } else if (orientationOrMargin !== undefined) {
      this.orientation = orientationOrMargin;
      if (margin !== undefined) {
        this.margin = margin;
      }
    }
  }

  /**
   * Gets the actual page size with orientation applied
   */
  getOrientedPageSize(): PdfSize {
    return this.pageSize.getOrientedSize(this.orientation);
  }
}
