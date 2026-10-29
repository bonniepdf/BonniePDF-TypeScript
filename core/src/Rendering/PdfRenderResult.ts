import { PdfSize } from '../Configuration/PdfSize';
import type { PageDimensions } from './PageDimensions';
import { RenderContext } from './RenderContext';

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
