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
 * **Why no `PdfUa2` here yet:** PDF/UA-2 (ISO 14289-2:2024) is bound to
 * PDF 2.0 output. BonniePDF currently emits PDF 1.4 and PDF 1.7 only -
 * there is no PDF 2.0 writer. Adding a `PdfUa2` value before that writer
 * lands would create a "lying enum" - the same kind of claim-without-
 * substance the honest-claim guard exists to prevent. The value lands
 * when the PDF 2.0 writer does - do not add it speculatively.
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
}
