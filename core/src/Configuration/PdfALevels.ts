import { PdfAConformance } from './PdfAConformance';

/** True for PDF/A-4 and PDF/A-4f, the PDF 2.0 levels. */
export function isPdfA4Level(conformance: PdfAConformance): boolean {
  return conformance === PdfAConformance.PdfA4 || conformance === PdfAConformance.PdfA4f;
}
