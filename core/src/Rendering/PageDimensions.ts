import { PdfSize } from '../Configuration/PdfSize';
import { RenderContext } from './RenderContext';
import type { RegisteredLink } from './RegisteredLink';

export class PageDimensions {
  public size: PdfSize;
  public margin: number;

  constructor(size: PdfSize, margin: number) {
    this.size = size;
    this.margin = margin;
  }
}

export class PageRenderOutput {
  public contentStream: string;
  public size: PdfSize;
  public hyperlinks: RegisteredLink[];

  constructor(contentStream: string, size: PdfSize, hyperlinks: RegisteredLink[] = []) {
    this.contentStream = contentStream;
    this.size = size;
    this.hyperlinks = hyperlinks;
  }
}

export class RenderedPageDimensions {
  public size: PdfSize;
  public margin: number;

  constructor(size: PdfSize, margin: number) {
    this.size = size;
    this.margin = margin;
  }
}

export class PdfRenderResult {
  public pageContentStreams: string[] = [];
  public pageDimensions: Map<number, PageDimensions> = new Map();
  public renderContext: RenderContext;
  public orientedPageSize: PdfSize;

  constructor(renderContext: RenderContext, orientedPageSize: PdfSize) {
    this.renderContext = renderContext;
    this.orientedPageSize = orientedPageSize;
  }
}
