import { PdfSize } from '../Configuration/PdfSize';

/** Describes the width and height of a rendered page in points. */
export class PageDimensions {
  /** The page size. */
  public size: PdfSize;
  /** The page margin, in points. */
  public margin: number;

  constructor(size: PdfSize, margin: number) {
    this.size = size;
    this.margin = margin;
  }
}
