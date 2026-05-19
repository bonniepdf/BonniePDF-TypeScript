/**
 * Specifies the PDF version for the output document.
 */
export class PdfVersion {
  /**
   * PDF 1.4 (default). RC4 encryption support.
   */
  static readonly Pdf14 = 'Pdf14' as const;
  /**
   * PDF 1.7. AES-256 encryption, PDF/A-1b compliance, XMP metadata, and bookmarks.
   */
  static readonly Pdf17 = 'Pdf17' as const;
}
