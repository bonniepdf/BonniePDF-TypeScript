import { PdfSize } from './PdfSize';
import { PageOrientation } from '../Core/PageOrientation';
import { ZoomLevel } from './ZoomLevel';
import { PageMode, PageModeEnum } from './PageMode';
import { PdfVersion } from './PdfVersion';
import { BookmarkItem } from './BookmarkItem';
import { WatermarkSettings } from './WatermarkSettings';
import { EncryptionSettings } from '../Security/Models/EncryptionSettings';
import type { TextStyle } from '../Elements/Text/TextStyle';
import { AccessibilityMode } from './AccessibilityMode';
import { PdfAConformance } from './PdfAConformance';

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
   * Template function for the full-page **background** slot.
   * Called with the page number (1-based); the returned element is painted
   * *behind* all page content. Unlike {@link headerTemplate} /
   * {@link footerTemplate}, the background slot spans the **entire page and
   * ignores the margins**, so bleed images, scanned letterhead, and
   * certificate backgrounds reach the page edge. Rendered at the page origin
   * (0, 0) with the full page width available.
   */
  public pageBackground?: (pageNumber: number) => _LocalIElement | undefined;
  /**
   * Template function for the full-page **foreground** slot.
   * Called with the page number (1-based); the returned element is painted
   * *on top of* all page content (including headers and footers), making it
   * ideal for "DRAFT"/"CONFIDENTIAL" overlays and stamps. Like
   * {@link pageBackground} it spans the entire page and ignores the margins,
   * rendered at the page origin (0, 0) with the full page width available.
   */
  public pageForeground?: (pageNumber: number) => _LocalIElement | undefined;
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
   * Gets or sets the PDF/A archival conformance level. Default
   * {@link PdfAConformance.None} - the document is a normal PDF.
   *
   * When set to PDF/A-1/2/3 the serializer auto-upgrades {@link version}
   * to PDF 1.7; PDF/A-4 auto-upgrades to PDF 2.0. It embeds the sRGB ICC profile, emits the
   * matching `/OutputIntents`, and writes a `pdfaid:part` /
   * `pdfaid:conformance` XMP block.
   *
   * "a" levels ({@link PdfAConformance.PdfA1a}, {@link PdfAConformance.PdfA2a},
   * {@link PdfAConformance.PdfA3a}) require
   * {@link accessibility} = {@link AccessibilityMode.PdfUa1}.
   *
   * **Honest-claim behaviour:** setting this is a request, not a
   * guarantee. The serializer suppresses the `pdfaid` XMP block and
   * `/OutputIntents` entry whenever the document references any of the
   * standard 14 fonts (Helvetica, Times-*, Courier-*, Symbol,
   * ZapfDingbats), because PDF/A §6.3.4 requires every font to be
   * embedded and BonniePDF does not bundle subset versions of those
   * faces. To actually produce a PDF/A-conformant file, register a
   * real TTF via `TtfFont.fromFile()` / `FontMetrics.registerFontAlias()`
   * (or rely on the bundled Liberation faces) and use that for every
   * text element.
   */
  public conformance: PdfAConformance;

  /**
   * Legacy boolean PDF/A switch. Maps onto {@link conformance}:
   * reading returns `true` whenever any PDF/A level is selected;
   * writing `true` selects {@link PdfAConformance.PdfA2b} (the modern
   * visual-reproducibility baseline) and writing `false` selects
   * {@link PdfAConformance.None}.
   */
  public get pdfAEnabled(): boolean {
    return this.conformance !== PdfAConformance.None;
  }
  public set pdfAEnabled(value: boolean) {
    this.conformance = value ? PdfAConformance.PdfA2b : PdfAConformance.None;
  }
  /**
   * Gets or sets the accessibility / tagged-PDF conformance mode.
   * Default {@link AccessibilityMode.None} - the writer produces an
   * untagged PDF and ignores all tagging machinery. Set to
   * {@link AccessibilityMode.PdfUa1} to opt the document into PDF/UA-1
   * emission (structure tree, MCIDs, XMP conformance claim, `/Lang`,
   * `/MarkInfo`).
   *
   * Orthogonal to {@link pdfAEnabled}: a document can be PDF/A, PDF/UA,
   * both, or neither. See
   * `the specification`.
   */
  public accessibility: AccessibilityMode;
  /**
   * Document natural language as a BCP-47 tag (e.g. `"en-GB"`,
   * `"de-DE"`, `"fr"`). Written to the catalog as `/Lang` when set;
   * required for PDF/UA-1 conformance, where it tells assistive tech
   * the language of unmarked content.
   * Default `undefined` (no language declared).
   */
  public language?: string;
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
   * Default text style applied to all text elements that have not had their style
   * properties explicitly set. Use this to define a document-wide font/size/color
   * baseline and avoid repeating style assignments on every element.
   *
   * ```typescript
   * doc.settings.defaultTextStyle = new TextStyle()
   *   .withFamily('Helvetica')
   *   .withSize(11)
   *   .withColor(ColorPalette.slate[600]);
   * ```
   */
  public defaultTextStyle?: TextStyle;
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
    this.conformance = PdfAConformance.None;
    this.accessibility = AccessibilityMode.None;
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
