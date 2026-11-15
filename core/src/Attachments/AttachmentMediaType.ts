import { PdfAConformance } from '../Configuration/PdfAConformance';

/**
 * The media type written for an attachment that names none: under PDF/A,
 * `application/octet-stream`, because PDF/A-3 (6.8) and PDF/A-4 (6.9) require
 * every embedded file to state one (spec 04 §10.1). Otherwise undefined, and
 * `/Subtype` is left out.
 */
export function defaultAttachmentMediaType(conformance: PdfAConformance): string | undefined {
  return conformance === PdfAConformance.None ? undefined : 'application/octet-stream';
}
