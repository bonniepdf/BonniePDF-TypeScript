/**
 * PDF/A archival-conformance level for the document.
 *
 * Orthogonal to {@link AccessibilityMode} in storage, but the two
 * interact: "a" (accessible) levels presuppose tagged output, so
 * selecting {@link PdfA1a}, {@link PdfA2a}, or {@link PdfA3a} requires
 * `settings.accessibility = AccessibilityMode.PdfUa1`. PDF/A-4 baseline has
 * no legacy `a`/`b`/`u` conformance suffix. The serializer
 * enforces this at save time.
 *
 * "b" (basic) levels guarantee visual reproducibility only - they do
 * not require structure tagging and so are the safe upgrade path for
 * documents that have not yet adopted PDF/UA-1.
 *
 * See `the specification` (in the .NET project)
 * for the cross-language design.
 */
export enum PdfAConformance {
  /** No PDF/A claim. Default. The document is a normal PDF. */
  None = 'None',

  /** PDF/A-1b (ISO 19005-1:2005, conformance B). PDF 1.4 visual fidelity. */
  PdfA1b = 'PdfA1b',

  /** PDF/A-1a (ISO 19005-1:2005, conformance A). PDF/A-1b + tagging. */
  PdfA1a = 'PdfA1a',

  /** PDF/A-2b (ISO 19005-2:2011, conformance B). PDF 1.7-based; modern baseline. */
  PdfA2b = 'PdfA2b',

  /** PDF/A-2a (ISO 19005-2:2011, conformance A). PDF/A-2b + tagging. */
  PdfA2a = 'PdfA2a',

  /** PDF/A-3b (ISO 19005-3:2012, conformance B). PDF/A-2b + embedded files (ZUGFeRD basis). */
  PdfA3b = 'PdfA3b',

  /** PDF/A-3a (ISO 19005-3:2012, conformance A). PDF/A-3b + tagging. */
  PdfA3a = 'PdfA3a',

  /** PDF/A-4 (ISO 19005-4:2020 baseline). PDF 2.0-based archival output. */
  PdfA4 = 'PdfA4',
}
