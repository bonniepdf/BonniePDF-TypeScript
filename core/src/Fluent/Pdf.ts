import { PdfBuilder } from './PdfBuilder';

export class Pdf {
  public static create(handler: (builder: PdfBuilder) => void): PdfBuilder {
    const builder = new PdfBuilder();
    handler(builder);
    return builder;
  }
}
