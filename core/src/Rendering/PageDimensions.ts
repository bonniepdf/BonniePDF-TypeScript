import { PdfSize } from '../Configuration/PdfSize';
import { RenderContext } from './RenderContext';
import type { RegisteredLink } from './RegisteredLink';

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

/** Contains the content stream and dimensions produced for one rendered page. */
export class PageRenderOutput {
  public contentStream: string;
  public size: PdfSize;
  public hyperlinks: RegisteredLink[];
  /**
   * The page's whole content stream, already compressed, when layout sealed it; then
   * `contentStream` is empty. Only the PDF serializer turns sealing on.
   */
  public compressedContent?: Uint8Array;

  constructor(contentStream: string, size: PdfSize, hyperlinks: RegisteredLink[] = []) {
    this.contentStream = contentStream;
    this.size = size;
    this.hyperlinks = hyperlinks;
  }
}

/** Contains all rendered pages and the resources collected during layout. */
export class PdfRenderResult {
  /** The content stream of each page. */
  public pageContentStreams: string[] = [];
  /** The size and margin of each page, keyed by page index. */
  public pageDimensions: Map<number, PageDimensions> = new Map();
  /** The context the document was rendered with. */
  public renderContext: RenderContext;
  /** The page size after orientation was applied. */
  public orientedPageSize: PdfSize;

  constructor(renderContext: RenderContext, orientedPageSize: PdfSize) {
    this.renderContext = renderContext;
    this.orientedPageSize = orientedPageSize;
  }
}
