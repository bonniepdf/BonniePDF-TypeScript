import { ContentDirection, toContentDirection, type ContentDirectionInput } from './ContentDirection';
import { applyOptions } from '../Core/applyOptions';
import { EmojiRendering } from './EmojiRendering';
import { PdfSize } from './PdfSize';
import { PageOrientation } from '../Core/PageOrientation';
import { Color } from '../Core/Color';
import { ZoomLevel } from './ZoomLevel';
import { PageMode, PageModeEnum } from './PageMode';
import { PdfVersion } from './PdfVersion';
import { BookmarkItem, type BookmarkItemOptions } from './BookmarkItem';
import { Watermark, type WatermarkOptions } from './Watermark';
import { EncryptionSettings, type EncryptionSettingsOptions } from '../Security/Models/EncryptionSettings';
import { TextStyle, type TextStyleOptions } from '../Elements/Text/TextStyle';
import { AccessibilityMode } from './AccessibilityMode';
import { PdfAConformance } from './PdfAConformance';
import { toColor, type ColorInput } from '../Normalize/toColor';
import { toPageSize, type PageSizeInput } from '../Normalize/toPageSize';
import {
  toPageOrientation,
  toZoomLevel,
  toPageMode,
  toPdfAConformance,
  toAccessibilityMode,
  type PageOrientationInput,
  type ZoomLevelInput,
  type PageModeInput,
  type PdfAConformanceInput,
  type AccessibilityModeInput,
} from '../Normalize/toEnum';
import { PageLabel, type PageLabelOptions } from './PageLabel';
import { FacturXMetadata } from '../EInvoice/FacturXMetadata';
import type { IElement } from '../Elements/IElement';
import { toLength, type LengthInput } from '../Normalize/toLength';
import type { PageTemplate } from './PageTemplate';

/**
 * Configuration settings for PDF document creation and display
 */
/** Every settable {@link DocumentSettings} property. */
export const DOCUMENT_SETTINGS_OPTION_KEYS = [
  'emojiRendering',
  'contentDirection',
  'pageSize',
  'pageColor',
  'orientation',
  'margin',
  'maxImageDpi',
  'defaultZoom',
  'customZoomLevel',
  'pageMode',
  'hideToolbar',
  'hideMenubar',
  'hideWindowUI',
  'fitWindow',
  'centerWindow',
  'displayDocTitle',
  'version',
  'conformance',
  'pdfAEnabled',
  'accessibility',
  'language',
  'facturX',
  'bookmarks',
  'namedDestinations',
  'watermark',
  'defaultTextStyle',
  'encryption',
  'pageLabel',
  'headerTemplate',
  'footerTemplate',
  'pageBackground',
  'pageForeground',
] as const;

type DocumentSettingsOwnKey = (typeof DOCUMENT_SETTINGS_OPTION_KEYS)[number];

/**
 * Keys handled specially rather than by plain keyed assignment: either their
 * accepted input is wider than the stored type (asymmetric accessor), or they
 * accept a nested options literal in place of an instance.
 */
type DocumentSettingsSpecialKey =
  | 'pageSize'
  | 'pageColor'
  | 'orientation'
  | 'defaultZoom'
  | 'pageMode'
  | 'conformance'
  | 'accessibility'
  | 'watermark'
  | 'encryption'
  | 'pageLabel'
  | 'defaultTextStyle'
  | 'bookmarks'
  | 'margin';

/**
 * Options for {@link DocumentSettings} - the largest options bag in the library.
 *
 * Nested settings accept either an instance or their own options literal, so a
 * whole document can be configured in one expression without importing the
 * sub-types.
 */
export type DocumentSettingsOptions = Partial<
  Omit<Pick<DocumentSettings, DocumentSettingsOwnKey>, DocumentSettingsSpecialKey>
> & {
  /** Page size. Accepts `'a4'`, `'letter'`, … or `{ width, height }`. */
  pageSize?: PageSizeInput;
  /** Uniform page margin. Accepts a length: `50`, `'2cm'`, or `{ value, unit }`. */
  margin?: LengthInput;
  /** Page background fill. Accepts a palette token or hex. */
  pageColor?: ColorInput;
  /** Page orientation. Accepts `'portrait' | 'landscape'`. */
  orientation?: PageOrientationInput;
  /** Initial zoom. Accepts `'fit-page' | 'fit-width' | 'fit-height' | 'custom'`. */
  defaultZoom?: ZoomLevelInput;
  /** Viewer page mode. Accepts `'use-none' | 'use-outlines' | …`. */
  pageMode?: PageModeInput;
  /** PDF/A claim. Accepts `'none'`, `'pdf/a-2b'`, `'pdf/a-2a'`, `'pdf/a-4'`, … */
  conformance?: PdfAConformanceInput;
  /** Accessibility (tagging) mode. Accepts `'none' | 'pdf/ua-1'`. */
  accessibility?: AccessibilityModeInput;
  /** Watermark. Accepts an instance or an options literal. */
  watermark?: Watermark | WatermarkOptions;
  /** Encryption. Accepts an instance or an options literal. */
  encryption?: EncryptionSettings | EncryptionSettingsOptions;
  /** Page labelling. Accepts an instance or an options literal. */
  pageLabel?: PageLabel | PageLabelOptions;
  /** Default text style. Accepts an instance or an options literal. */
  defaultTextStyle?: TextStyle | TextStyleOptions;
  /** Outline entries. Each accepts an instance or an options literal. */
  bookmarks?: (BookmarkItem | BookmarkItemOptions)[];
};

/** Configures document-wide page, output, security, accessibility, and metadata behavior. */
export class DocumentSettings {
  private _contentDirection = ContentDirection.LeftToRight;
  /** Default inline progression and paragraph base direction. */
  public get contentDirection(): ContentDirection {
    return this._contentDirection;
  }
  public set contentDirection(value: ContentDirectionInput) {
    this._contentDirection = toContentDirection(value);
  }

  private _emojiRendering: EmojiRendering = EmojiRendering.Outline;
  /** Emoji paint mode; colour requires a registered colour font. Defaults to outlines. */
  public get emojiRendering(): EmojiRendering | 'outline' | 'colour' {
    return this._emojiRendering;
  }
  public set emojiRendering(value: EmojiRendering | 'outline' | 'colour') {
    if (value !== 'outline' && value !== 'colour') throw new RangeError('Invalid emoji rendering mode');
    this._emojiRendering = value as EmojiRendering;
  }
  /**
   * Template function for generating page headers.
   * Called with the page number (1-based) and should return an IElement to render at the top of each page.
   * The returned element is rendered at the top margin position.
   */
  public headerTemplate?: PageTemplate;
  /**
   * Template function for generating page footers.
   * Called with the page number (1-based) and should return an IElement to render at the bottom of each page.
   * The returned element is rendered at the bottom margin position.
   */
  public footerTemplate?: PageTemplate;
  /**
   * Template function for the full-page **background** slot.
   * Called with the page number (1-based); the returned element is painted
   * *behind* all page content. Unlike {@link headerTemplate} /
   * {@link footerTemplate}, the background slot spans the **entire page and
   * ignores the margins**, so bleed images, scanned letterhead, and
   * certificate backgrounds reach the page edge. Rendered at the page origin
   * (0, 0) with the full page width available.
   */
  public pageBackground?: PageTemplate;
  /**
   * Template function for the full-page **foreground** slot.
   * Called with the page number (1-based); the returned element is painted
   * *on top of* all page content (including headers and footers), making it
   * ideal for "DRAFT"/"CONFIDENTIAL" overlays and stamps. Like
   * {@link pageBackground} it spans the entire page and ignores the margins,
   * rendered at the page origin (0, 0) with the full page width available.
   */
  public pageForeground?: PageTemplate;
  /**
   * The page size for the document (default: A4)
   */
  private _pageSize!: PdfSize;

  /** Page size. Accepts `'a4'`, `'letter'`, … or `{ width, height }`. */
  public get pageSize(): PdfSize {
    return this._pageSize;
  }
  public set pageSize(value: PageSizeInput) {
    this._pageSize = toPageSize(value);
  }
  /**
   * Background colour painted behind every page. When set, the render pipeline
   * fills the entire page (origin 0,0, full width and height, ignoring margins)
   * with this colour before anything else is drawn, so it sits behind the
   * {@link pageBackground} slot, headers, body content, and footers. Leave
   * undefined for a transparent (viewer-default, usually white) background.
   *
   * This is the simple "page colour" shortcut; for textured or image
   * backgrounds use {@link pageBackground} instead (or both — pageColor fills,
   * pageBackground layers on top).
   */
  private _pageColor?: Color;

  /** Page background fill. Accepts a palette token or hex. */
  public get pageColor(): Color | undefined {
    return this._pageColor;
  }
  public set pageColor(value: ColorInput | undefined) {
    this._pageColor = value === undefined ? undefined : toColor(value);
  }
  /**
   * The page orientation for the document (default: Portrait)
   */
  private _orientation!: PageOrientation;

  /** Page orientation. Accepts `'portrait' | 'landscape'`. */
  public get orientation(): PageOrientation {
    return this._orientation;
  }
  public set orientation(value: PageOrientationInput) {
    this._orientation = toPageOrientation(value);
  }
  private _margin = 50;

  /**
   * The margin size in points for all pages (default: 50).
   *
   * Accepts a length: a number of points, `'2cm'`, or `{ value, unit }` (§4A.3).
   */
  public get margin(): number {
    return this._margin;
  }
  public set margin(value: LengthInput) {
    this._margin = toLength(value);
  }
  private _maxImageDpi: number | null = 288;

  /**
   * The most pixels per inch an embedded PNG image is kept at (default: 288). An image that carries
   * more pixels than its printed size can use is reduced to this resolution when the document is
   * written, by an exact area average that never re-encodes the image lossily and never enlarges
   * it. `null` embeds every image at its source resolution. JPEG, indexed and 16-bit images are
   * always embedded as they are; `Document.diagnostics` reports what was reduced and what was
   * passed through.
   */
  public get maxImageDpi(): number | null {
    return this._maxImageDpi;
  }
  public set maxImageDpi(value: number | null) {
    if (value !== null && !(Number.isInteger(value) && value >= 1)) {
      throw new RangeError(`maxImageDpi must be a whole number of at least 1, or null for no cap; got ${value}.`);
    }
    this._maxImageDpi = value;
  }

  /**
   * The default zoom level when the PDF is opened (default: FitPage)
   */
  private _defaultZoom!: ZoomLevel;

  /** Initial zoom. Accepts `'fit-page' | 'fit-width' | 'fit-height' | 'custom'`. */
  public get defaultZoom(): ZoomLevel {
    return this._defaultZoom;
  }
  public set defaultZoom(value: ZoomLevelInput) {
    this._defaultZoom = toZoomLevel(value);
  }
  /**
   * Custom zoom level for ZoomLevel.Custom (1.0 = 100%, default: 1.0)
   */
  public customZoomLevel: number;
  /**
   * How the PDF document should be displayed when opened (default: UseNone)
   */
  private _pageMode!: PageMode;

  /** Viewer page mode. Accepts `'use-none' | 'use-outlines' | …`. */
  public get pageMode(): PageMode {
    return this._pageMode;
  }
  public set pageMode(value: PageModeInput) {
    this._pageMode = toPageMode(value);
  }
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
  private _conformance!: PdfAConformance;

  /**
   * PDF/A conformance claim. Accepts `'none'`, `'pdf/a-2b'`, `'pdf/a-2a'`,
   * `'pdf/a-4'`, … (`the specification` §4A.4).
   */
  public get conformance(): PdfAConformance {
    return this._conformance;
  }
  public set conformance(value: PdfAConformanceInput) {
    this._conformance = toPdfAConformance(value);
  }

  /**
   * Legacy boolean view of {@link conformance}, not a separate PDF/A setting.
   * Reading it returns `true` whenever any PDF/A level is selected. Writing it
   * replaces the exact conformance level: `true` selects
   * {@link PdfAConformance.PdfA2b}, the modern visual-reproducibility baseline,
   * while `false` selects {@link PdfAConformance.None}. Prefer
   * {@link conformance} in new code when the precise PDF/A profile matters.
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
   * the shared specification.
   */
  private _accessibility!: AccessibilityMode;

  /** Accessibility (tagging) mode. Accepts `'none' | 'pdf/ua-1'`. */
  public get accessibility(): AccessibilityMode {
    return this._accessibility;
  }
  public set accessibility(value: AccessibilityModeInput) {
    this._accessibility = toAccessibilityMode(value);
  }
  /**
   * ZUGFeRD / Factur-X e-invoice metadata. When set (and the document is a
   * PDF/A-3 level), the XMP writer emits the `fx:*` conformance block.
   * Normally set via {@link applyFacturX} rather than directly — that helper
   * also attaches the XML and forces PDF/A-3. Default `undefined`.
   */
  public facturX?: FacturXMetadata;
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
  public watermark?: Watermark;
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
   * Page labelling configuration written as `/PageLabels` in the document
   * catalog (PDF §12.4.2). Controls the number shown in the viewer's page
   * counter and "go to page" dialog — not the printed text on the page itself.
   *
   * Use when the document represents a subset of a larger work and the viewer
   * counter should reflect the logical page numbering rather than the physical
   * 1-based sheet count.
   *
   * ```typescript
   * const label = new PageLabel()
   * label.startAt = 42
   * settings.pageLabel = label
   * // → viewer shows "42" on page 1, "43" on page 2, etc.
   * ```
   *
   * Note: the footer template still receives the physical page number. Offset
   * it manually if you want the printed number to match:
   * `footerTemplate = (n) => new TextBlock(String(n + 41))`
   */
  public pageLabel?: PageLabel;
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
  /** Creates settings configured in one expression. */
  constructor(options: DocumentSettingsOptions);
  constructor(
    pageSizeOrOptions?: PdfSize | DocumentSettingsOptions,
    orientationOrMargin?: PageOrientation | number,
    margin?: number
  ) {
    const options = pageSizeOrOptions instanceof PdfSize ? undefined : pageSizeOrOptions;
    const pageSize = pageSizeOrOptions instanceof PdfSize ? pageSizeOrOptions : undefined;
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

    if (options !== undefined) {
      applyDocumentSettingsOptions(this, options);
    }
  }

  /**
   * Gets the actual page size with orientation applied
   */
  getOrientedPageSize(): PdfSize {
    return this.pageSize.getOrientedSize(this.orientation);
  }
}

/**
 * Applies {@link DocumentSettingsOptions}, coercing nested literals into their
 * canonical types and resolving the `conformance` / `pdfAEnabled` overlap.
 *
 * Concrete callers MUST use this rather than {@link applyOptions} directly: a
 * bare keyed assignment would store plain literals where the engine expects
 * `Watermark`, `TextStyle`, … instances.
 */
export function applyDocumentSettingsOptions(
  target: DocumentSettings,
  options: DocumentSettingsOptions
): DocumentSettings {
  const { watermark, encryption, pageLabel, defaultTextStyle, bookmarks, pdfAEnabled, conformance, ...rest } = options;

  applyOptions(target, rest);

  if (watermark !== undefined) {
    target.watermark = watermark instanceof Watermark ? watermark : new Watermark(watermark);
  }
  if (encryption !== undefined) {
    target.encryption = encryption instanceof EncryptionSettings ? encryption : new EncryptionSettings(encryption);
  }
  if (pageLabel !== undefined) {
    target.pageLabel = pageLabel instanceof PageLabel ? pageLabel : new PageLabel(pageLabel);
  }
  if (defaultTextStyle !== undefined) {
    target.defaultTextStyle =
      defaultTextStyle instanceof TextStyle ? defaultTextStyle : new TextStyle(defaultTextStyle);
  }
  if (bookmarks !== undefined) {
    target.bookmarks = bookmarks.map(b => (b instanceof BookmarkItem ? b : new BookmarkItem(b)));
  }

  // `pdfAEnabled` is legacy sugar over `conformance` (it flips PdfA2b/None), so
  // it is applied first and `conformance` wins when both are supplied. Without a
  // fixed order this would depend on the literal's key order, which is not a
  // contract callers should have to reason about.
  if (pdfAEnabled !== undefined) {
    target.pdfAEnabled = pdfAEnabled;
  }
  if (conformance !== undefined) {
    target.conformance = conformance;
  }

  return target;
}
