/**
 * Accessibility / tagged-PDF conformance mode for the document.
 *
 * Independent of {@link DocumentSettings.pdfAEnabled}; both can be enabled
 * together, separately, or not at all.
 *
 * When set to a non-{@link None} value, the writer emits a PDF structure
 * tree, marked-content (BDC/EMC) wrapping every visible text run and image,
 * the XMP `pdfuaid` conformance claim, and the catalog-level `/MarkInfo`
 * and `/Lang` entries - enough for screen readers and assistive tech to
 * interpret the document.
 *
 * {@link PdfUa1} is PDF 1.7 output and {@link PdfUa2} is PDF 2.0 output;
 * each selects its PDF version automatically. Asking for a version the level
 * cannot use (PDF/UA-1 with `PdfVersion.Pdf20`, PDF/UA-2 with
 * `PdfVersion.Pdf17` or a PDF/A-1, -2 or -3 level) throws rather than
 * dropping the tagging or the claim.
 *
 * Tagged-PDF behaviour is defined by the shared specification, which both
 * implementations conform to.
 */
export enum AccessibilityMode {
  /**
   * No tagging. Default. Produces a visually-correct but structurally-untagged PDF.
   */
  None = 0,

  /**
   * PDF/UA-1 (ISO 14289-1) tagged output. The library emits a structure
   * tree, marked-content operators, and the corresponding metadata
   * required for accessibility validators (VeraPDF profile `ua1`) to
   * pass.
   */
  PdfUa1 = 1,

  /**
   * PDF/UA-2 (ISO 14289-2:2024) tagged output on PDF 2.0. Everything
   * {@link AccessibilityMode.PdfUa1} writes, with the structure tree in the
   * PDF 2.0 namespace, structure destinations for in-document links and
   * bookmarks, list numbering on lists, and table-of-contents entries that
   * reference their targets (VeraPDF profile `ua2`). Combines with
   * `PdfAConformance.PdfA4`, not with PDF/A-1, -2 or -3.
   */
  PdfUa2 = 2,
}
