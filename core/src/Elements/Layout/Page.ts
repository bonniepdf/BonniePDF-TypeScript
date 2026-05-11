import { IElement } from '../IElement';
import { PdfSize } from '../../Configuration/PdfSize';

/**
 * Represents a single page in a PDF document
 */
export class Page {
  private readonly elements: IElement[] = [];
  public readonly size: PdfSize;
  public readonly margin: number;

  /**
   * Creates a new instance of Page with the specified dimensions and margin
   * @param width - Page width in points
   * @param height - Page height in points
   * @param margin - Page margin in points
   */
  constructor(width: number, height: number, margin: number);
  /**
   * Creates a new instance of Page with the specified page size and margin
   * @param pageSize - The page size
   * @param margin - Page margin in points
   */
  constructor(pageSize: PdfSize, margin: number);
  constructor(widthOrPageSize: number | PdfSize, height: number, marginOrMargin?: number) {
    if (typeof widthOrPageSize === 'number') {
      this.size = new PdfSize(widthOrPageSize, height);
      this.margin = marginOrMargin ?? 0;
    } else {
      this.size = widthOrPageSize;
      this.margin = height;
    }
  }

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