import { applyOptions } from '../../Core/applyOptions';
import { IElement } from '../IElement';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { PdfSize } from '../../Configuration/PdfSize';
import { Color } from '../../Core/Color';

/**
 * Represents a single page in a PDF document
 */
/**
 * Settable properties of {@link Page}.
 *
 * `size` and `margin` are `readonly` - they are the page's identity and stay
 * constructor-only, so they are not options.
 */
export const PAGE_OPTION_KEYS = ['pageColor', 'pageBackground', 'pageForeground'] as const;

/** Options for {@link Page}. */
export type PageOptions = Partial<Omit<Pick<Page, (typeof PAGE_OPTION_KEYS)[number]>, 'pageColor'>> & {
  /** Page background fill. Accepts a palette token or hex. */
  pageColor?: ColorInput;
};

export class Page {
  private readonly elements: IElement[] = [];
  public readonly size: PdfSize;
  public readonly margin: number;

  /**
   * Background colour for this page only. When set, the render pipeline fills
   * the entire page (ignoring margins) with this colour behind everything else,
   * overriding {@link DocumentSettings.pageColor} for this page. When undefined,
   * the document-level `pageColor` (if any) is used. Leave both undefined for a
   * transparent (viewer-default) background.
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
   * Full-page background element for this page only (drawn behind all content,
   * ignoring margins). When set, the pipeline renders this element instead of
   * calling {@link DocumentSettings.pageBackground} for this page (and any
   * continuation pages its content overflows onto). Useful for per-page
   * letterhead, cover images, or section dividers. Leave undefined to fall back
   * to the document-level `pageBackground` template.
   */
  public pageBackground?: IElement;

  /**
   * Full-page foreground element for this page only (drawn on top of all
   * content, ignoring margins). When set, the pipeline renders this element
   * instead of calling {@link DocumentSettings.pageForeground} for this page
   * (and any continuation pages). Useful for per-page "DRAFT"/"CONFIDENTIAL"
   * overlays. Leave undefined to fall back to the document-level `pageForeground`
   * template.
   */
  public pageForeground?: IElement;

  /**
   * Creates a new instance of Page with the specified dimensions and margin
   * @param width - Page width in points
   * @param height - Page height in points
   * @param margin - Page margin in points
   */
  constructor(width: number, height: number, margin: number, options?: PageOptions);
  /**
   * Creates a new instance of Page with the specified page size and margin
   * @param pageSize - The page size
   * @param margin - Page margin in points
   */
  constructor(pageSize: PdfSize, margin: number, options?: PageOptions);
  constructor(
    widthOrPageSize: number | PdfSize,
    height: number,
    marginOrOptions?: number | PageOptions,
    options?: PageOptions
  ) {
    // The explicit-dimensions form puts margin third and options fourth; the
    // PdfSize form puts margin second and options third.
    if (typeof widthOrPageSize === 'number') {
      this.size = new PdfSize(widthOrPageSize, height);
      this.margin = typeof marginOrOptions === 'number' ? marginOrOptions : 0;
      applyOptions(this, options);
    } else {
      this.size = widthOrPageSize;
      this.margin = height;
      applyOptions(this, typeof marginOrOptions === 'number' ? options : marginOrOptions);
    }
  }

  /**
   * Whether this page carries a margin of its own. When `false` the renderer
   * takes `settings.margin` instead, so a `DocumentSettings` assigned after the
   * document was constructed still reaches the first page. Set by
   * {@link Document.addPage} for pages whose margin came from the settings.
   * @internal
   */
  public hasExplicitMargin: boolean = true;

  /**
   * Gets the page width in points
   */
  get width(): number {
    return this.size.width;
  }

  /**
   * Gets the page height in points
   */
  get height(): number {
    return this.size.height;
  }

  /**
   * Gets the available content width (page width minus margins)
   */
  get contentWidth(): number {
    return this.width - this.margin * 2;
  }

  /**
   * Gets the available content height (page height minus margins)
   */
  get contentHeight(): number {
    return this.height - this.margin * 2;
  }

  /**
   * Adds an element to this page
   * @param element - The element to add
   */
  public add(element: IElement): void {
    if (!element) throw new Error('Element cannot be null');
    this.elements.push(element);
  }

  /**
   * Gets the elements on this page (alias for the elements getter)
   */
  public getElements(): ReadonlyArray<IElement> {
    return this.elements;
  }

  /**
   * Measures the total height of all elements on this page
   */
  public measureContentHeight(): number {
    let totalHeight = 0;
    for (const element of this.elements) {
      totalHeight += element.measureHeight(this.contentWidth);
    }
    return totalHeight;
  }

  /**
   * Checks if the content fits within the available height
   */
  public contentFits(): boolean {
    return this.measureContentHeight() <= this.contentHeight;
  }
}
