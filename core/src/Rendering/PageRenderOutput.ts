import { PdfSize } from '../Configuration/PdfSize';
import type { RegisteredLink } from './RegisteredLink';

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
