/**
 * Specifies the PDF version for the output document.
 */
export class PdfVersion {
  /**
   * PDF 1.4 (default). RC4 encryption support.
   */
  static readonly Pdf14 = 'Pdf14' as const;
  /**
   * PDF 1.7. AES-256 encryption, PDF/A-1/2/3 compliance, XMP metadata, and bookmarks.
   */
  static readonly Pdf17 = 'Pdf17' as const;
  /**
   * PDF 2.0. Foundation for PDF/A-4 and PDF/UA-2; initially feature-equivalent to PDF 1.7 output.
   */
  static readonly Pdf20 = 'Pdf20' as const;
}
