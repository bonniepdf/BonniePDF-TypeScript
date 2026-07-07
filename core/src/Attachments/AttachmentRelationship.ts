/**
 * The relationship an embedded file has to the PDF that carries it, written
 * as the `/AFRelationship` entry of the file's `/Filespec` dictionary
 * (PDF 2.0 §7.11.3, ISO 19005-3 for PDF/A-3). Associated files are the
 * mechanism e-invoicing standards (ZUGFeRD / Factur-X) use to attach the
 * source XML alongside the rendered invoice.
 *
 * The enum values are the PDF names verbatim so the serializer can emit
 * `/${relationship}` directly, keeping output identical to the .NET peer.
 */
export enum AttachmentRelationship {
  /** Relationship unknown or not covered by the other values. Default. */
  Unspecified = 'Unspecified',

  /** The source the visible content was derived from (ZUGFeRD invoice XML). */
  Source = 'Source',

  /** Data used to generate the visible content (Factur-X invoice XML). */
  Data = 'Data',

  /** An alternative representation of the PDF's content. */
  Alternative = 'Alternative',

  /** Supplementary material for the PDF's content. */
  Supplement = 'Supplement',

  /** An encrypted payload for which the PDF is a wrapper. */
  EncryptedPayload = 'EncryptedPayload',

  /** Data associated with an AcroForm. */
  FormData = 'FormData',

  /** A schema definition for other associated files. */
  Schema = 'Schema',
}
