/**
 * Accessibility / tagged-PDF conformance mode for the document.
 *
 * Independent of {@link DocumentSettings.pdfAEnabled}; both can be enabled
 * together, separately, or not at all.
 *
 * When set to a non-{@link None} value, the writer emits a PDF structure
 * tree, marked-content (BDC/EMC) wrapping every visible text run and image,
 * the XMP `pdfuaid` conformance claim, and the catalog-level `/MarkInfo`
 * and `/Lang` entries — enough for screen readers and assistive tech to
 * interpret the document.
 *
 * See `the specification` for the full design
 * and `this feature-implementation-plan.md` for the staged implementation.
 */
export enum AccessibilityMode {
  /**
   * No tagging. Default. Produces a visually-correct but
   * structurally-untagged PDF — same output as BonniePDF has always
   * produced.
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
