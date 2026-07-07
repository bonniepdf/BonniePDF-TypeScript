import { AttachmentRelationship } from './AttachmentRelationship';

/**
 * A file embedded into a generated PDF as an associated file (PDF 2.0
 * §7.11.4 / ISO 19005-3 for PDF/A-3). The engine writes it as an
 * `/EmbeddedFile` stream referenced from a `/Filespec` in the document's
 * `/Names /EmbeddedFiles` name tree, and lists the filespec in the catalog's
 * `/AF` array so conforming readers surface it.
 *
 * Attaching a file only affects generated documents; it does not read or
 * modify an existing PDF (that is the separate document-operations feature,
 * this feature).
 */
export interface FileAttachment {
  /**
   * The file name shown to the user and stored in the filespec's `/F` and
   * `/UF` entries (e.g. `"invoice.xml"`). Required.
   */
  fileName: string;

  /** The raw bytes of the file. Required and non-empty. */
  content: Uint8Array;

  /**
   * The relationship of this file to the document, written as
   * `/AFRelationship`. Defaults to {@link AttachmentRelationship.Unspecified}.
   */
  relationship?: AttachmentRelationship;

  /**
   * The MIME media type of the file (e.g. `"text/xml"`), written as the
   * embedded-file stream's `/Subtype`. Optional but recommended; PDF/A-3 and
   * e-invoicing validators expect it.
   */
  mediaType?: string;

  /** A human-readable description, written as the filespec's `/Desc`. */
  description?: string;

  /**
   * The file's modification timestamp, written to the embedded-file stream's
   * `/Params /ModDate`.
   */
  modificationDate?: Date;

  /**
   * The file's creation timestamp, written to the embedded-file stream's
   * `/Params /CreationDate`.
   */
  creationDate?: Date;
}
