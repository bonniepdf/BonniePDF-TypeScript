import { PdfAConformance } from '../Configuration/PdfAConformance';

/**
 * Conformance rules for embedded files. Kept in one place so the TypeScript
 * and .NET implementations enforce the same honest-claim behaviour: an
 * attachment is only embedded when the declared PDF/A level actually permits
 * embedded files. Where it does not, the serializer drops the attachment and
 * records a diagnostic rather than emitting a PDF that fails its own claim.
 *
 * - `None` - allowed (ordinary PDF).
 * - PDF/A-1 (1a/1b) - forbidden; ISO 19005-1 disallows embedded files entirely.
 * - PDF/A-2 (2a/2b) - forbidden here; ISO 19005-2 permits embedding only files
 *   that are themselves PDF/A, which the engine cannot verify for an arbitrary
 *   byte payload.
 * - PDF/A-3 (3a/3b) - allowed; ISO 19005-3 exists precisely to carry
 *   associated files of any type (the ZUGFeRD / Factur-X basis).
 * - PDF/A-4 - forbidden here; ISO 19005-4 6.9 permits embedding only files
 *   that are themselves PDF/A-1, -2 or -4, which the engine cannot verify.
 * - PDF/A-4f - allowed; the PDF/A-4 level that carries files of any type.
 */
export function allowsEmbeddedFiles(conformance: PdfAConformance): boolean {
  switch (conformance) {
    case PdfAConformance.None:
    case PdfAConformance.PdfA3a:
    case PdfAConformance.PdfA3b:
    case PdfAConformance.PdfA4f:
      return true;
    default:
      return false;
  }
}
