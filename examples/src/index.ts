import { Document } from '@bonniepdf/core';
// ── Recipes (technical primitives) ──────────────────────────────────────────
import { generate as simpleDocument } from './recipes/basics/simple-document';
import { generate as simpleDocumentClasses } from './recipes/basics/simple-document-classes';
import { generate as pdfCompliance } from './recipes/basics/pdf-compliance';
import { generate as pdfComplianceClasses } from './recipes/basics/pdf-compliance-classes';
import { generate as margins } from './recipes/basics/margins';
import { generate as marginsClasses } from './recipes/basics/margins-classes';
import { generate as pageSettings } from './recipes/basics/page-settings';
import { generate as pageSettingsClasses } from './recipes/basics/page-settings-classes';
import { generate as headersFooters } from './recipes/layout/headers-footers';
import { generate as headersFootersClasses } from './recipes/layout/headers-footers-classes';
import { generate as horizontalStacks } from './recipes/layout/horizontal-stacks';
import { generate as horizontalStacksClasses } from './recipes/layout/horizontal-stacks-classes';
import { generate as textBlockOverflow } from './conformance/text-block-overflow';
import { generate as verticalStackOverflow } from './recipes/layout/vertical-stack-overflow';
import { generate as verticalStackOverflowClasses } from './recipes/layout/vertical-stack-overflow-classes';
import { generate as tables } from './recipes/elements/tables';
import { generate as tablesClasses } from './recipes/elements/tables-classes';
import { generate as textAlignment } from './recipes/typography/text-alignment';
import { generate as textAlignmentClasses } from './recipes/typography/text-alignment-classes';
import { generate as embeddedFontMetrics } from './recipes/typography/embedded-font-metrics';
import { generate as embeddedFontMetricsClasses } from './recipes/typography/embedded-font-metrics-classes';
import { generate as bookPageLayout } from './recipes/typography/book-page-layout';
import { generate as bookPageLayoutClasses } from './recipes/typography/book-page-layout-classes';
import { generate as richTextStyles } from './recipes/typography/rich-text-styles';
import { generate as richTextStylesClasses } from './recipes/typography/rich-text-styles-classes';
import { generate as textDecorations } from './recipes/typography/text-decorations';
import { generate as textDecorationsClasses } from './recipes/typography/text-decorations-classes';
import { generate as customFonts } from './recipes/typography/custom-fonts';
import { generate as customFontsClasses } from './recipes/typography/custom-fonts-classes';
import { generate as emojisAndUnicode } from './recipes/typography/emojis-and-unicode';
import { generate as emojisAndUnicodeClasses } from './recipes/typography/emojis-and-unicode-classes';
import { generate as advancedTypography } from './recipes/typography/advanced-typography';
import { generate as advancedTypographyClasses } from './recipes/typography/advanced-typography-classes';
import { generate as dickensNovel } from './recipes/typography/dickens-novel';
import { generate as dickensNovelClasses } from './recipes/typography/dickens-novel-classes';
import { generate as lists } from './recipes/elements/lists';
import { generate as listsClasses } from './recipes/elements/lists-classes';
import { generate as hyperlinks } from './recipes/elements/hyperlinks';
import { generate as hyperlinksClasses } from './recipes/elements/hyperlinks-classes';
import { generate as crossReferences } from './recipes/elements/cross-references';
import { generate as crossReferencesClasses } from './recipes/elements/cross-references-classes';
import { generate as shapesAndBorders } from './recipes/elements/shapes-and-borders';
import { generate as shapesAndBordersClasses } from './recipes/elements/shapes-and-borders-classes';
import { generate as colorPalette } from './recipes/elements/color-palette';
import { generate as colorPaletteClasses } from './recipes/elements/color-palette-classes';
import { generate as qrCodes } from './recipes/elements/qr-codes';
import { generate as qrCodesClasses } from './recipes/elements/qr-codes-classes';
import { generate as barcodes } from './recipes/elements/barcodes';
import { generate as barcodesClasses } from './recipes/elements/barcodes-classes';
import { generate as dataMatrix } from './recipes/elements/data-matrix';
import { generate as dataMatrixClasses } from './recipes/elements/data-matrix-classes';
import { generate as images } from './recipes/elements/images';
import { generate as imagesClasses } from './recipes/elements/images-classes';
import { generate as chartShowcase } from './recipes/charting/chart-showcase';
import { generate as chartShowcaseClasses } from './recipes/charting/chart-showcase-classes';
import { generate as barChart } from './recipes/charting/bar-chart';
import { generate as barChartClasses } from './recipes/charting/bar-chart-classes';
import { generate as groupedBarChart } from './recipes/charting/grouped-bar-chart';
import { generate as groupedBarChartClasses } from './recipes/charting/grouped-bar-chart-classes';
import { generate as lineChart } from './recipes/charting/line-chart';
import { generate as lineChartClasses } from './recipes/charting/line-chart-classes';
import { generate as areaChart } from './recipes/charting/area-chart';
import { generate as areaChartClasses } from './recipes/charting/area-chart-classes';
import { generate as lollipopChart } from './recipes/charting/lollipop-chart';
import { generate as lollipopChartClasses } from './recipes/charting/lollipop-chart-classes';
import { generate as dotPlotChart } from './recipes/charting/dot-plot-chart';
import { generate as dotPlotChartClasses } from './recipes/charting/dot-plot-chart-classes';
import { generate as pieChart } from './recipes/charting/pie-chart';
import { generate as pieChartClasses } from './recipes/charting/pie-chart-classes';
import { generate as multiSeriesLineChart } from './recipes/charting/multi-series-line-chart';
import { generate as multiSeriesLineChartClasses } from './recipes/charting/multi-series-line-chart-classes';
import { generate as watermarking } from './recipes/security/watermarking';
import { generate as watermarkingClasses } from './recipes/security/watermarking-classes';
import { generate as encryption } from './recipes/security/encryption';
import { generate as encryptionClasses } from './recipes/security/encryption-classes';
import { generate as attachedData } from './recipes/security/attached-data';
import { generate as attachedDataClasses } from './recipes/security/attached-data-classes';
// ── Showcases (industry / vertical-market documents) ────────────────────────
import { generate as businessInvoice } from './showcases/invoices/business-invoice';
import { generate as businessInvoiceClasses } from './showcases/invoices/business-invoice-classes';
import { generate as usSalesInvoice } from './showcases/invoices/us-sales-invoice';
import { generate as usSalesInvoiceClasses } from './showcases/invoices/us-sales-invoice-classes';
import { generate as ukVatInvoice } from './showcases/invoices/uk-vat-invoice';
import { generate as ukVatInvoiceClasses } from './showcases/invoices/uk-vat-invoice-classes';
import { generate as facturXInvoice } from './showcases/invoices/factur-x-invoice';
import { generate as facturXInvoiceClasses } from './showcases/invoices/factur-x-invoice-classes';
import { generate as indiaGstInvoice } from './showcases/invoices/india-gst-invoice';
import { generate as indiaGstInvoiceClasses } from './showcases/invoices/india-gst-invoice-classes';
import { generate as productPhotoGallery } from './showcases/catalogs/product-photo-gallery';
import { generate as productPhotoGalleryClasses } from './showcases/catalogs/product-photo-gallery-classes';
import { generate as financialDashboard } from './showcases/reports/financial-dashboard';
import { generate as financialDashboardClasses } from './showcases/reports/financial-dashboard-classes';
import { generate as complianceFindingsRegister } from './showcases/reports/compliance-findings-register';
import { generate as complianceFindingsRegisterClasses } from './showcases/reports/compliance-findings-register-classes';
import { generate as annualReport } from './showcases/reports/annual-report';
import { generate as annualReportClasses } from './showcases/reports/annual-report-classes';
import { generate as annualReportGradientCover } from './showcases/reports/annual-report-gradient-cover';
import { generate as annualReportGradientCoverClasses } from './showcases/reports/annual-report-gradient-cover-classes';
import { generate as annualReportMaskedCover } from './showcases/reports/annual-report-masked-cover';
import { generate as annualReportMaskedCoverClasses } from './showcases/reports/annual-report-masked-cover-classes';
import { generate as annualReportGeometricCover } from './showcases/reports/annual-report-geometric-cover';
import { generate as annualReportGeometricCoverClasses } from './showcases/reports/annual-report-geometric-cover-classes';
import { generate as eventTicket } from './showcases/operations/event-ticket';
import { generate as eventTicketClasses } from './showcases/operations/event-ticket-classes';
import { generate as patientSummary } from './showcases/healthcare/patient-summary';
import { generate as patientSummaryClasses } from './showcases/healthcare/patient-summary-classes';
import { generate as outpatientAppointmentLetter } from './showcases/healthcare/outpatient-appointment-letter';
import { generate as outpatientAppointmentLetterClasses } from './showcases/healthcare/outpatient-appointment-letter-classes';
import { generate as productRoadmap } from './showcases/operations/product-roadmap';
import { generate as productRoadmapClasses } from './showcases/operations/product-roadmap-classes';
// ── Vertical-market gallery follow-up (registrations + new showcases) ────────
import { generate as saasInvoice } from './showcases/invoices/saas-invoice';
import { generate as saasInvoiceClasses } from './showcases/invoices/saas-invoice-classes';
import { generate as shippingLabel } from './showcases/operations/shipping-label';
import { generate as shippingLabelClasses } from './showcases/operations/shipping-label-classes';
import { generate as horizontalBarChart } from './recipes/charting/horizontal-bar-chart';
import { generate as horizontalBarChartClasses } from './recipes/charting/horizontal-bar-chart-classes';
import { generate as horizontalGroupedBarChart } from './recipes/charting/horizontal-grouped-bar-chart';
import { generate as horizontalGroupedBarChartClasses } from './recipes/charting/horizontal-grouped-bar-chart-classes';
import { generate as horizontalLollipopChart } from './recipes/charting/horizontal-lollipop-chart';
import { generate as horizontalLollipopChartClasses } from './recipes/charting/horizontal-lollipop-chart-classes';
import { generate as watermarkingConfidential } from './recipes/security/watermarking-confidential';
import { generate as watermarkingConfidentialClasses } from './recipes/security/watermarking-confidential-classes';
import { generate as edgeReceipt } from './showcases/edge/edge-receipt';
import { generate as edgeReceiptClasses } from './showcases/edge/edge-receipt-classes';
import { generate as publicLibraryMembershipLetter } from './showcases/community/public-library-membership-letter';
import { generate as publicLibraryMembershipLetterClasses } from './showcases/community/public-library-membership-letter-classes';
import { generate as grantAwardLetter } from './showcases/community/grant-award-letter';
import { generate as grantAwardLetterClasses } from './showcases/community/grant-award-letter-classes';
import { generate as auditReport } from './showcases/compliance/audit-report';
import { generate as auditReportClasses } from './showcases/compliance/audit-report-classes';
import { generate as shelfLabel } from './showcases/retail/shelf-label';
import { generate as shelfLabelClasses } from './showcases/retail/shelf-label-classes';
import { generate as ukDegreeTranscript } from './showcases/education/uk-degree-transcript';
import { generate as ukDegreeTranscriptClasses } from './showcases/education/uk-degree-transcript-classes';
import { generate as financialStatement } from './showcases/reports/financial-statement';
import { generate as financialStatementClasses } from './showcases/reports/financial-statement-classes';
import { generate as labReport } from './showcases/healthcare/lab-report';
import { generate as labReportClasses } from './showcases/healthcare/lab-report-classes';
import { generate as payslip } from './showcases/hr/payslip';
import { generate as payslipClasses } from './showcases/hr/payslip-classes';

export * from './recipes/svg';

// ── Structured taxonomy (gallery filters, capability search) ─────────────────
// These axes are orthogonal to the free-text {@link ExampleDef.category}: an
// invoice is `documentType: 'invoice'` but can serve any {@link Industry}.
// They power gallery facets ("PDF/UA", "Browser-only", "Barcodes", "Multi-page
// tables", "PDF/A-3 attachments") without each showcase re-deriving them from
// its own description.

/** Vertical market / buyer context a document serves. */
export type Industry =
  | 'Legal'
  | 'Insurance'
  | 'Property'
  | 'HR'
  | 'Banking'
  | 'Manufacturing'
  | 'Government'
  | 'Healthcare'
  | 'Education'
  | 'Retail'
  | 'Logistics'
  | 'Events'
  | 'Finance'
  | 'Technology'
  | 'Media'
  | 'Compliance'
  | 'Utilities'
  | 'General';

/** The kind of document, independent of which industry it serves. */
export type DocumentType =
  | 'invoice'
  | 'receipt'
  | 'statement'
  | 'payslip'
  | 'contract'
  | 'report'
  | 'schedule'
  | 'certificate'
  | 'transcript'
  | 'letter'
  | 'label'
  | 'ticket'
  | 'catalog'
  | 'dashboard'
  | 'roadmap'
  | 'chart';

/** BonniePDF engine capabilities a document exercises. */
export type Capability =
  | 'crossReferences'
  | 'encryption'
  | 'attachments'
  | 'watermark'
  | 'qr'
  | 'barcodes'
  | 'dataMatrix'
  | 'longTables'
  | 'charts'
  | 'images'
  | 'bookmarks'
  | 'numbering'
  | 'signatures'
  | 'clientSide';

/** Formal compliance / conformance profiles demonstrated (registry-level mirror for filtering). */
export type Compliance = 'pdf/a-1b' | 'pdf/a-2a' | 'pdf/a-2b' | 'pdf/a-3a' | 'pdf/a-3b' | 'pdf/a-4' | 'pdf/ua-1';

/** Runtime environments the document is designed to generate in. */
export type Runtime = 'browser' | 'node' | 'edge';

/** Volume of tabular/repeated data — `'scale'` marks a deliberate stress test. */
export type DataDensity = 'low' | 'medium' | 'high' | 'scale';

export interface ExampleDef {
  id: string;
  name: string;
  category: string;
  description: string;
  /**
   * Which layer of the gallery this belongs to (see the example-gallery revenue
   * strategy in BonniePDF). `'showcase'` = a finished industry/vertical
   * document for the public gallery; `'recipe'` = a technical primitive demo for
   * the docs cookbook. Defaults to `'recipe'` when omitted.
   */
  tier?: 'showcase' | 'recipe';
  /** Target market for market-specific showcases (e.g. 'US', 'UK', 'EU', 'India'). */
  region?: string;
  filename: string;
  generate: (assets?: ReadonlyMap<string, Uint8Array>) => Document;
  /** Asset paths (relative to examples/assets/) that must be pre-loaded before generate() is called. */
  requiredAssets?: string[];
  /** Should the associated viewer show thumbnails by default */
  thumbnails?: boolean;
  /** Corresponding .NET class name in BonniePDF-NET/Examples/. null = TypeScript-only. */
  dotnetClass?: string | null;
  /** PDF/UA-1 tagged document - validated by VeraPDF in CI. */
  pdfUa1?: boolean;
  /**
   * Whether this example appears on the public website gallery / docs. Defaults
   * to `true`. Set `false` for conformance-corpus documents: PDFs kept purely to
   * exercise the engine and pass veraPDF (and future validators) in CI, but which
   * aren't relevant as marketing/documentation. They still generate and validate
   * like any other example; they just don't surface in the sidebar, gallery grid,
   * per-example pages, or playground. Live in `src/conformance/`.
   * See {@link galleryExamples}.
   */
  gallery?: boolean;
  /**
   * Marks this example as an authoring-style *variant* of another example
   * (its `id`), rather than a distinct document. Variants render the same
   * output as their parent - they only differ in how the source is written
   * (e.g. options-object vs construct-then-mutate). Set `gallery: false`
   * alongside this so the variant does not get its own sidebar link / gallery
   * card; the website surfaces it through a switcher on the parent's page.
   */
  variantOf?: string;
  /**
   * Short label for this authoring style, shown in the website's source-code
   * variant switcher (e.g. 'Options API', 'Class API'). Set it on the parent
   * too so its own switcher entry reads well. Falls back to {@link name}.
   */
  variantLabel?: string;
  /** User password for encrypted PDFs - passed to the viewer so it can open the document. */
  password?: string;
  // ── Structured taxonomy (optional; powers gallery facets / capability search) ──
  /** Vertical market(s) this document serves (orthogonal to {@link category}). */
  industries?: Industry[];
  /** The document archetype, independent of industry (e.g. `'payslip'`, `'contract'`). */
  documentType?: DocumentType;
  /** Engine capabilities this document exercises (e.g. `'encryption'`, `'longTables'`). */
  capabilities?: Capability[];
  /** Conformance profiles demonstrated. Mirrors {@link pdfUa1} + PDF/A claims for filtering. */
  compliance?: Compliance[];
  /** Runtime environments the document is designed to generate in. */
  runtime?: Runtime[];
  /** Volume of tabular/repeated data; `'scale'` marks a deliberate stress test. */
  dataDensity?: DataDensity;
  /**
   * Grouping key for related variants shown as one gallery card (e.g. the four
   * annual-report covers share `series: 'annual-report'`). Distinct from
   * {@link variantOf} (authoring-style Options-vs-Class) — `series` groups
   * *different documents* that belong together, like an invoice pack.
   */
  series?: string;
}

export const examples: ExampleDef[] = [
  // Basic
  {
    id: 'simple-document',
    name: 'Simple Document',
    category: 'Basic',
    description:
      'A 3-page PDF/UA-1 tagged document demonstrating the core Document API - semantic headings, text, spacers, a custom square page, and a QR Figure with alt-text.',
    filename: 'simple-document.pdf',
    generate: simpleDocument,
    dotnetClass: 'SimpleDocumentExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'simple-document-classes',
    name: 'Simple Document (Class API)',
    category: 'Basic',
    description:
      'The same document as Simple Document, authored the long way: construct each object with `new`, then set properties. Shows the class/mutation surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'simple-document-classes.pdf',
    generate: simpleDocumentClasses,
    dotnetClass: 'SimpleDocumentExample',
    pdfUa1: true,
    // Not a distinct gallery entry: it's an authoring-style variant of
    // `simple-document`, surfaced through the source switcher on that page.
    gallery: false,
    variantOf: 'simple-document',
    variantLabel: 'Class API',
  },
  {
    id: 'pdf-compliance',
    name: 'Archival & Accessible PDF',
    category: 'Basic',
    description:
      'A concise PDF/A-2a and PDF/UA-1 example showing the two settings, what BonniePDF handles, and what the author supplies.',
    filename: 'pdf-compliance.pdf',
    generate: pdfCompliance,
    dotnetClass: 'PdfComplianceExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'pdf-compliance-classes',
    name: 'Archival & Accessible PDF (Class API)',
    category: 'Basic',
    description:
      'The same concise conformance example, authored by constructing and mutating every object without helper functions.',
    filename: 'pdf-compliance-classes.pdf',
    generate: pdfComplianceClasses,
    dotnetClass: 'PdfComplianceExample',
    pdfUa1: true,
    // Not a distinct gallery entry: it's an authoring-style variant of
    // `pdf-compliance`, surfaced through the source switcher on that page.
    gallery: false,
    variantOf: 'pdf-compliance',
    variantLabel: 'Class API',
  },
  {
    id: 'margins',
    name: 'Margins and Padding',
    category: 'Basic',
    description: 'How to apply margins and padding to text, containers, tables, and stacks.',
    filename: 'margins.pdf',
    generate: margins,
    dotnetClass: 'MarginsAndPadding',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'margins-classes',
    name: 'Margins and Padding (Class API)',
    category: 'Basic',
    description:
      'The same margins-and-padding tour as Margins and Padding, authored the long way: construct each element and assign properties. Shows the class/mutation surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'margins-classes.pdf',
    generate: marginsClasses,
    dotnetClass: 'MarginsAndPadding',
    pdfUa1: true,
    gallery: false,
    variantOf: 'margins',
    variantLabel: 'Class API',
  },
  {
    id: 'page-settings',
    name: 'Page Settings',
    category: 'Basic',
    description: 'Gallery of every standard page size in both portrait and landscape orientation.',
    filename: 'page-settings.pdf',
    generate: pageSettings,
    dotnetClass: 'PageSettingsExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'page-settings-classes',
    name: 'Page Settings (Class API)',
    category: 'Basic',
    description:
      'The same standard-page-formats gallery as Page Settings, authored the long way: construct each element and assign properties. Shows the class/mutation surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'page-settings-classes.pdf',
    generate: pageSettingsClasses,
    dotnetClass: 'PageSettingsExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'page-settings',
    variantLabel: 'Class API',
  },
  // Layout
  {
    id: 'headers-footers',
    name: 'Headers & Footers',
    category: 'Layout',
    description:
      'Dynamic running header and footer templates on every page. The templates are marked as decorative (skipped by screen readers) while the numbered body sections are semantically structured.',
    filename: 'headers-footers.pdf',
    generate: headersFooters,
    dotnetClass: 'HeadersFootersExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'headers-footers-classes',
    name: 'Headers & Footers (Class API)',
    category: 'Layout',
    description:
      'The same running-header/footer document as Headers & Footers, authored the long way: construct each element and assign properties. Shows the class/mutation surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'headers-footers-classes.pdf',
    generate: headersFootersClasses,
    dotnetClass: 'HeadersFootersExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'headers-footers',
    variantLabel: 'Class API',
  },
  {
    id: 'horizontal-stacks',
    name: 'Horizontal Stacks',
    category: 'Layout',
    description:
      'Flex-like horizontal layout - equal and weighted width distribution, cross-axis (vertical) alignment, key-value pairs, and two-column text, all structured for screen readers.',
    filename: 'horizontal-stacks.pdf',
    generate: horizontalStacks,
    thumbnails: false,
    dotnetClass: 'HorizontalStacksExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'horizontal-stacks-classes',
    name: 'Horizontal Stacks (Class API)',
    category: 'Layout',
    description:
      'The same HorizontalStack tour as Horizontal Stacks, authored the long way: construct each element and assign properties. Shows the class/mutation surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'horizontal-stacks-classes.pdf',
    generate: horizontalStacksClasses,
    thumbnails: false,
    dotnetClass: 'HorizontalStacksExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'horizontal-stacks',
    variantLabel: 'Class API',
  },
  {
    id: 'text-block-overflow',
    name: 'TextBlock Overflow',
    category: 'Layout',
    description:
      'Long-form text flowing automatically across page boundaries. Three self-documenting sections remain accessible as they paginate, with a decorative page-number footer on every page.',
    filename: 'text-block-overflow.pdf',
    generate: textBlockOverflow,
    dotnetClass: 'TextBlockOverflowExample',
    pdfUa1: true,
    // Conformance corpus: automatic pagination is baseline library behaviour, not
    // a feature to teach, so this is validated in CI but kept off the website.
    gallery: false,
  },
  {
    id: 'vertical-stack-overflow',
    name: 'VerticalStack Overflow',
    category: 'Layout',
    description:
      'A warehouse asset-label sheet: a column of Code 128 barcodes inside a VerticalStack. Barcodes (like images and QR codes) have no pagination of their own, so the VerticalStack is what carries each label that would fall off the page onto the next one - drop the same list straight onto the document and the overflow is lost off the bottom edge.',
    filename: 'vertical-stack-overflow.pdf',
    generate: verticalStackOverflow,
    dotnetClass: 'VerticalStackOverflowExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'vertical-stack-overflow-classes',
    name: 'VerticalStack Overflow (Class API)',
    category: 'Layout',
    description:
      'The same warehouse asset-label sheet as VerticalStack Overflow, authored the long way: construct each element and assign properties. Shows the class/mutation surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'vertical-stack-overflow-classes.pdf',
    generate: verticalStackOverflowClasses,
    dotnetClass: 'VerticalStackOverflowExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'vertical-stack-overflow',
    variantLabel: 'Class API',
  },
  // Typography
  {
    id: 'text-alignment',
    name: 'Text Alignment',
    category: 'Typography',
    description:
      'Left, centre, right, and justified text alignment including book-style paragraphs, accessible to screen readers. PDF/A-2a + PDF/UA-1.',
    filename: 'text-alignment.pdf',
    generate: textAlignment,
    thumbnails: false,
    dotnetClass: 'TextAlignmentExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'text-alignment-classes',
    name: 'Text Alignment (Class API)',
    category: 'Typography',
    description:
      'The same alignment tour as Text Alignment, authored the long way: construct each element and assign properties. Shows the class/mutation surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'text-alignment-classes.pdf',
    generate: textAlignmentClasses,
    thumbnails: false,
    dotnetClass: 'TextAlignmentExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'text-alignment',
    variantLabel: 'Class API',
  },
  {
    id: 'embedded-font-metrics',
    name: 'Embedded-Font Metrics',
    category: 'Typography',
    description:
      "Why an embedded TrueType font makes alignment edges exact: BonniePDF measures from the font's own hmtx advance widths rather than the approximate standard-14 width tables. The four alignments are rendered in embedded Liberation Sans. PDF/A-2a + PDF/UA-1.",
    filename: 'embedded-font-metrics.pdf',
    generate: embeddedFontMetrics,
    thumbnails: false,
    dotnetClass: 'EmbeddedFontMetricsExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'embedded-font-metrics-classes',
    name: 'Embedded-Font Metrics (Class API)',
    category: 'Typography',
    description:
      'The same embedded-Liberation-Sans alignment demo as Embedded-Font Metrics, authored the long way: construct each element and assign properties. Shows the class/mutation surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'embedded-font-metrics-classes.pdf',
    generate: embeddedFontMetricsClasses,
    thumbnails: false,
    dotnetClass: 'EmbeddedFontMetricsExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'embedded-font-metrics',
    variantLabel: 'Class API',
  },
  {
    id: 'book-page-layout',
    name: 'Book Page Layout',
    category: 'Typography',
    description:
      'A typeset chapter page in the style of an academic monograph: Times family fonts throughout, justified body text, a bordered pull-quote block inset from the text column, a mixed bold/italic emphasis break, and a chapter footer with page number and imprint. The document is fully structured for screen readers. PDF/A-2a + PDF/UA-1.',
    filename: 'book-page-layout.pdf',
    generate: bookPageLayout,
    thumbnails: false,
    dotnetClass: 'BookPageLayoutExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'book-page-layout-classes',
    name: 'Book Page Layout (Class API)',
    category: 'Typography',
    description:
      'The same typeset chapter page as Book Page Layout, authored the long way: construct each element and assign properties. Shows the class/mutation surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'book-page-layout-classes.pdf',
    generate: bookPageLayoutClasses,
    thumbnails: false,
    dotnetClass: 'BookPageLayoutExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'book-page-layout',
    variantLabel: 'Class API',
  },
  {
    id: 'rich-text-styles',
    name: 'Rich Text Styles',
    category: 'Typography',
    description:
      'Bold, italic, coloured, highlighted, and mixed-size spans within flowing paragraphs. Reusable style objects, justified alignment, and a practical legal disclaimer. PDF/A-2a + PDF/UA-1.',
    filename: 'rich-text-styles.pdf',
    generate: richTextStyles,
    dotnetClass: 'RichTextExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'rich-text-styles-classes',
    name: 'Rich Text Styles (Class API)',
    category: 'Typography',
    description:
      'The same inline mixed-style RichText tour as Rich Text Styles, authored the long way: fluent per-span TextStyle builders and construct-then-mutate. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'rich-text-styles-classes.pdf',
    generate: richTextStylesClasses,
    dotnetClass: 'RichTextExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'rich-text-styles',
    variantLabel: 'Class API',
  },
  {
    id: 'text-decorations',
    name: 'Text Decorations',
    category: 'Typography',
    description:
      'Underline and strikethrough decorations applied individually, combined, and across all text alignments and font sizes, with a practical price-list example. PDF/A-2a + PDF/UA-1.',
    filename: 'text-decorations.pdf',
    generate: textDecorations,
    thumbnails: false,
    dotnetClass: 'TextDecorationExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'text-decorations-classes',
    name: 'Text Decorations (Class API)',
    category: 'Typography',
    description:
      'The same underline/strikethrough tour as Text Decorations, authored the long way: construct each element and assign properties, using the TextDecoration flag enum. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'text-decorations-classes.pdf',
    generate: textDecorationsClasses,
    thumbnails: false,
    dotnetClass: 'TextDecorationExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'text-decorations',
    variantLabel: 'Class API',
  },
  {
    id: 'custom-fonts',
    name: 'Custom Fonts',
    category: 'Typography',
    description:
      'TrueType font embedding with Unicode coverage — symbols, currency, arrows, maths, dingbats, and Greek across NotoSans, NotoSansMath, and NotoSansSymbols2. PDF/A-2a + PDF/UA-1.',
    filename: 'custom-fonts.pdf',
    generate: customFonts,
    thumbnails: false,
    dotnetClass: 'CustomFontExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'custom-fonts-classes',
    name: 'Custom Fonts (Class API)',
    category: 'Typography',
    description:
      'The same TrueType-embedding / Unicode-coverage tour as Custom Fonts, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'custom-fonts-classes.pdf',
    generate: customFontsClasses,
    thumbnails: false,
    dotnetClass: 'CustomFontExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'custom-fonts',
    variantLabel: 'Class API',
  },
  {
    id: 'emojis-and-unicode',
    name: 'Emojis & Unicode',
    category: 'Typography',
    description:
      'Full Unicode range — BMP symbols, Greek, Cyrillic, dingbats, and supplementary emoji across multiple embedded fonts, with a mixed text/emoji status-line example. PDF/UA-1.',
    filename: 'emojis-and-unicode.pdf',
    generate: emojisAndUnicode,
    thumbnails: false,
    dotnetClass: 'EmojiExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'emojis-and-unicode-classes',
    name: 'Emojis & Unicode (Class API)',
    category: 'Typography',
    description:
      'The same full-Unicode / emoji tour as Emojis & Unicode, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'emojis-and-unicode-classes.pdf',
    generate: emojisAndUnicodeClasses,
    thumbnails: false,
    dotnetClass: 'EmojiExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'emojis-and-unicode',
    variantLabel: 'Class API',
  },
  {
    id: 'advanced-typography',
    name: 'Advanced Typography',
    category: 'Typography',
    description:
      'Super/subscript baseline shift (H₂O, E=mc²) and decoration styling — overline plus coloured/thick underline and strikethrough. PDF/UA-1.',
    filename: 'advanced-typography.pdf',
    generate: advancedTypography,
    thumbnails: false,
    dotnetClass: 'AdvancedTypographyExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'advanced-typography-classes',
    name: 'Advanced Typography (Class API)',
    category: 'Typography',
    description:
      'The same super/subscript + decoration-styling tour as Advanced Typography, authored the long way: construct each element and assign properties, per-span TextStyles via the fluent builders. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'advanced-typography-classes.pdf',
    generate: advancedTypographyClasses,
    thumbnails: false,
    dotnetClass: 'AdvancedTypographyExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'advanced-typography',
    variantLabel: 'Class API',
  },
  {
    id: 'dickens-novel',
    name: 'Dickens: A Tale of Two Cities',
    category: 'Typography',
    description:
      'PDF/UA-1 tagged book layout with VisualToc, decorative running headers, footer page numbers, and justified body text across three books and fourteen chapters.',
    filename: 'dickens-novel.pdf',
    generate: dickensNovel,
    dotnetClass: 'DickensNovelExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'dickens-novel-classes',
    name: 'Dickens: A Tale of Two Cities (Class API)',
    category: 'Typography',
    description:
      'The same multi-page book layout as Dickens: A Tale of Two Cities, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'dickens-novel-classes.pdf',
    generate: dickensNovelClasses,
    dotnetClass: 'DickensNovelExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'dickens-novel',
    variantLabel: 'Class API',
  },
  // Elements
  {
    id: 'tables',
    name: 'Tables',
    category: 'Elements',
    description:
      'A 45-row employee table with repeating /TH column headers across pages, alternating row colours, and a "Page N of M" footer — all automatically tagged for screen readers. PDF/A-2a + PDF/UA-1.',
    filename: 'tables.pdf',
    generate: tables,
    dotnetClass: 'TablesExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'tables-classes',
    name: 'Tables (Class API)',
    category: 'Elements',
    description:
      'The same multi-page employee table + prose as Tables, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'tables-classes.pdf',
    generate: tablesClasses,
    dotnetClass: 'TablesExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'tables',
    variantLabel: 'Class API',
  },
  {
    id: 'lists',
    name: 'Lists',
    category: 'Elements',
    description:
      'Ordered (decimal, roman, alpha, custom start) and unordered (disc, circle, square, dash, custom, coloured) lists including nested sub-lists. Each item is automatically structured for screen readers. PDF/A-2a + PDF/UA-1.',
    filename: 'lists.pdf',
    generate: lists,
    dotnetClass: 'ListsExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'lists-classes',
    name: 'Lists (Class API)',
    category: 'Elements',
    description:
      'The same ordered/unordered list tour as Lists, authored the long way: construct each list and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'lists-classes.pdf',
    generate: listsClasses,
    dotnetClass: 'ListsExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'lists',
    variantLabel: 'Class API',
  },
  {
    id: 'hyperlinks',
    name: 'Hyperlinks',
    category: 'Elements',
    description: 'External hyperlinks with custom font, size, and colour styling.',
    filename: 'hyperlinks.pdf',
    generate: hyperlinks,
    thumbnails: false,
    dotnetClass: 'HyperlinksExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'hyperlinks-classes',
    name: 'Hyperlinks (Class API)',
    category: 'Elements',
    description:
      'The same hyperlink tour as Hyperlinks, authored the long way: construct each link and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'hyperlinks-classes.pdf',
    generate: hyperlinksClasses,
    thumbnails: false,
    dotnetClass: 'HyperlinksExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'hyperlinks',
    variantLabel: 'Class API',
  },
  {
    id: 'cross-references',
    name: 'Cross-References',
    category: 'Elements',
    description:
      'Section anchors, SectionLink internal jumps, and PageNumberOf "see page N" references, resolved automatically by two-pass layout.',
    filename: 'cross-references.pdf',
    generate: crossReferences,
    thumbnails: false,
    dotnetClass: 'CrossReferencesExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'cross-references-classes',
    name: 'Cross-References (Class API)',
    category: 'Elements',
    description:
      'The same cross-reference field guide as Cross-References, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'cross-references-classes.pdf',
    generate: crossReferencesClasses,
    thumbnails: false,
    dotnetClass: 'CrossReferencesExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'cross-references',
    variantLabel: 'Class API',
  },
  {
    id: 'shapes-and-borders',
    name: 'Shapes & Borders',
    category: 'Elements',
    description: 'Rounded rectangles, bordered containers, card layouts, and status banners.',
    filename: 'shapes-and-borders.pdf',
    generate: shapesAndBorders,
    dotnetClass: 'ShapesAndBordersExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'shapes-and-borders-classes',
    name: 'Shapes & Borders (Class API)',
    category: 'Elements',
    description:
      'The same rounded-rectangle / borders / cards / banners tour as Shapes & Borders, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'shapes-and-borders-classes.pdf',
    generate: shapesAndBordersClasses,
    dotnetClass: 'ShapesAndBordersExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'shapes-and-borders',
    variantLabel: 'Class API',
  },
  {
    id: 'color-palette',
    name: 'Colour Palette',
    category: 'Elements',
    description:
      'The full ColorPalette as a swatch grid - all 22 Tailwind v4 ramps x 11 shades, drawn as little squares.',
    filename: 'color-palette.pdf',
    generate: colorPalette,
    thumbnails: false,
    dotnetClass: 'ColorPaletteExample',
    pdfUa1: false,
    variantLabel: 'Options API',
  },
  {
    id: 'color-palette-classes',
    name: 'Colour Palette (Class API)',
    category: 'Elements',
    description:
      'The same 22-ramp swatch grid as Colour Palette, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'color-palette-classes.pdf',
    generate: colorPaletteClasses,
    thumbnails: false,
    dotnetClass: 'ColorPaletteExample',
    pdfUa1: false,
    gallery: false,
    variantOf: 'color-palette',
    variantLabel: 'Class API',
  },
  {
    id: 'qr-codes',
    name: 'QR Codes',
    category: 'Elements',
    description:
      'Native vector QR codes with all four error correction levels, custom colours, and transparent backgrounds.',
    filename: 'qr-codes.pdf',
    generate: qrCodes,
    // .NET ships the Fluent variant as the canonical source
    dotnetClass: 'QRCodesExampleFluent',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'qr-codes-classes',
    name: 'QR Codes (Class API)',
    category: 'Elements',
    description:
      'The same native vector-QR tour as QR Codes, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'qr-codes-classes.pdf',
    generate: qrCodesClasses,
    dotnetClass: 'QRCodesExampleFluent',
    pdfUa1: true,
    gallery: false,
    variantOf: 'qr-codes',
    variantLabel: 'Class API',
  },
  {
    id: 'barcodes',
    name: 'Barcodes',
    category: 'Elements',
    description:
      'Native vector 1D barcodes - Code 128, EAN-13, UPC-A, and ITF-14 - covering retail and logistics ' +
      'across the UK, EU, and US, with automatic check digits and human-readable labels.',
    filename: 'barcodes.pdf',
    generate: barcodes,
    dotnetClass: 'BarcodesExampleFluent',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'barcodes-classes',
    name: 'Barcodes (Class API)',
    category: 'Elements',
    description:
      'The same native 1D-barcode tour as Barcodes, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'barcodes-classes.pdf',
    generate: barcodesClasses,
    dotnetClass: 'BarcodesExampleFluent',
    pdfUa1: true,
    gallery: false,
    variantOf: 'barcodes',
    variantLabel: 'Class API',
  },
  {
    id: 'data-matrix',
    name: 'Data Matrix',
    category: 'Elements',
    description:
      'Native vector Data Matrix (ECC200) symbols with automatic encodation (ASCII, C40, Text, X12, EDIFACT, ' +
      'Base-256), Reed-Solomon error correction, square and rectangular sizes, and custom colours.',
    filename: 'data-matrix.pdf',
    generate: dataMatrix,
    dotnetClass: 'DataMatrixExampleFluent',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'data-matrix-classes',
    name: 'Data Matrix (Class API)',
    category: 'Elements',
    description:
      'The same native Data Matrix tour as Data Matrix, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'data-matrix-classes.pdf',
    generate: dataMatrixClasses,
    dotnetClass: 'DataMatrixExampleFluent',
    pdfUa1: true,
    gallery: false,
    variantOf: 'data-matrix',
    variantLabel: 'Class API',
  },
  {
    id: 'images',
    name: 'Images',
    category: 'Elements',
    description:
      'PNG embedding with contain, cover, and fill fit modes, bordered containers, and alpha transparency. Every informative image carries alt text (Figure + /Alt) and a decorative divider is marked as decorative. PDF/A-2a + PDF/UA-1.',
    filename: 'images.pdf',
    generate: images,
    dotnetClass: 'ImagesExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'images-classes',
    name: 'Images (Class API)',
    category: 'Elements',
    description:
      'The same raster-image tour as Images, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'images-classes.pdf',
    generate: imagesClasses,
    dotnetClass: 'ImagesExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'images',
    variantLabel: 'Class API',
  },
  // Charting
  {
    id: 'chart-showcase',
    name: 'Chart Showcase',
    category: 'Charting',
    description:
      'PDF/UA-1 tagged eight-page landscape showcase of all chart types, each tagged as a Figure with alt text.',
    filename: 'chart-showcase.pdf',
    generate: chartShowcase,
    dotnetClass: 'ChartShowcaseExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'chart-showcase-classes',
    name: 'Chart Showcase (Class API)',
    category: 'Charting',
    description:
      'The same eight-page all-chart-types showcase as Chart Showcase, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'chart-showcase-classes.pdf',
    generate: chartShowcaseClasses,
    dotnetClass: 'ChartShowcaseExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'chart-showcase',
    variantLabel: 'Class API',
  },
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    category: 'Charting',
    description: 'Vertical bar chart showing monthly sales with grid lines and value labels.',
    filename: 'bar-chart.pdf',
    generate: barChart,
    dotnetClass: 'BarChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'bar-chart-classes',
    name: 'Bar Chart (Class API)',
    category: 'Charting',
    description:
      'The same monthly-sales bar chart as Bar Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'bar-chart-classes.pdf',
    generate: barChartClasses,
    dotnetClass: 'BarChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'bar-chart',
    variantLabel: 'Class API',
  },
  {
    id: 'grouped-bar-chart',
    name: 'Grouped Bar Chart',
    category: 'Charting',
    description: 'Side-by-side bars comparing three product lines across 12 months with a colour legend.',
    filename: 'grouped-bar-chart.pdf',
    generate: groupedBarChart,
    dotnetClass: 'GroupedBarChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'grouped-bar-chart-classes',
    name: 'Grouped Bar Chart (Class API)',
    category: 'Charting',
    description:
      'The same three-series grouped bar chart as Grouped Bar Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'grouped-bar-chart-classes.pdf',
    generate: groupedBarChartClasses,
    dotnetClass: 'GroupedBarChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'grouped-bar-chart',
    variantLabel: 'Class API',
  },
  {
    id: 'line-chart',
    name: 'Line Chart',
    category: 'Charting',
    description: 'Connected data points with circular markers and value labels showing monthly revenue trends.',
    filename: 'line-chart.pdf',
    generate: lineChart,
    dotnetClass: 'LineChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'line-chart-classes',
    name: 'Line Chart (Class API)',
    category: 'Charting',
    description:
      'The same monthly-revenue line chart as Line Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'line-chart-classes.pdf',
    generate: lineChartClasses,
    dotnetClass: 'LineChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'line-chart',
    variantLabel: 'Class API',
  },
  {
    id: 'area-chart',
    name: 'Area Chart',
    category: 'Charting',
    description: 'Filled area under a line with configurable opacity showing monthly sales performance.',
    filename: 'area-chart.pdf',
    generate: areaChart,
    dotnetClass: 'AreaChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'area-chart-classes',
    name: 'Area Chart (Class API)',
    category: 'Charting',
    description:
      'The same chart as Area Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'area-chart-classes.pdf',
    generate: areaChartClasses,
    dotnetClass: 'AreaChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'area-chart',
    variantLabel: 'Class API',
  },
  {
    id: 'lollipop-chart',
    name: 'Lollipop Chart',
    category: 'Charting',
    description: 'Stems with circular heads - a clear, minimal alternative to bar charts for quarterly metrics.',
    filename: 'lollipop-chart.pdf',
    generate: lollipopChart,
    dotnetClass: 'LollipopChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'lollipop-chart-classes',
    name: 'Lollipop Chart (Class API)',
    category: 'Charting',
    description:
      'The same chart as Lollipop Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'lollipop-chart-classes.pdf',
    generate: lollipopChartClasses,
    dotnetClass: 'LollipopChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'lollipop-chart',
    variantLabel: 'Class API',
  },
  {
    id: 'dot-plot-chart',
    name: 'Dot Plot Chart',
    category: 'Charting',
    description: 'Circular markers positioned along a value axis to compare product performance at a glance.',
    filename: 'dot-plot-chart.pdf',
    generate: dotPlotChart,
    dotnetClass: 'DotPlotChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'dot-plot-chart-classes',
    name: 'Dot Plot Chart (Class API)',
    category: 'Charting',
    description:
      'The same chart as Dot Plot Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'dot-plot-chart-classes.pdf',
    generate: dotPlotChartClasses,
    dotnetClass: 'DotPlotChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'dot-plot-chart',
    variantLabel: 'Class API',
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    category: 'Charting',
    description: 'Donut chart with a colour legend and total value in the centre showing monthly sales share.',
    filename: 'pie-chart.pdf',
    generate: pieChart,
    dotnetClass: 'PieChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'pie-chart-classes',
    name: 'Pie Chart (Class API)',
    category: 'Charting',
    description:
      'The same chart as Pie Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'pie-chart-classes.pdf',
    generate: pieChartClasses,
    dotnetClass: 'PieChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'pie-chart',
    variantLabel: 'Class API',
  },
  {
    id: 'multi-series-line-chart',
    name: 'Multi-Series Line Chart',
    category: 'Charting',
    description: 'Two overlapping line series comparing year-over-year revenue on a shared axis with a legend.',
    filename: 'multi-series-line-chart.pdf',
    generate: multiSeriesLineChart,
    dotnetClass: 'MultiSeriesLineChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'multi-series-line-chart-classes',
    name: 'Multi-Series Line Chart (Class API)',
    category: 'Charting',
    description:
      'The same chart as Multi-Series Line Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'multi-series-line-chart-classes.pdf',
    generate: multiSeriesLineChartClasses,
    dotnetClass: 'MultiSeriesLineChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'multi-series-line-chart',
    variantLabel: 'Class API',
  },
  // Security
  {
    id: 'watermarking',
    name: 'Watermarking',
    category: 'Security',
    description: 'Semi-transparent diagonal DRAFT watermark rendered behind page content on every page.',
    filename: 'watermarking.pdf',
    generate: watermarking,
    // .NET has three variants; Draft is canonical
    dotnetClass: 'WatermarkDraftExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'watermarking-classes',
    name: 'Watermarking (Class API)',
    category: 'Security',
    description:
      'The same DRAFT-watermarked draft document as Watermarking, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'watermarking-classes.pdf',
    generate: watermarkingClasses,
    dotnetClass: 'WatermarkDraftExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'watermarking',
    variantLabel: 'Class API',
  },
  {
    id: 'encryption',
    name: 'Encryption',
    category: 'Security',
    description:
      'Three encryption scenarios: simple password, user/owner passwords with permissions, and owner-only restrictions.',
    filename: 'encryption.pdf',
    generate: encryption,
    pdfUa1: true,
    password: 'demo123',
    // .NET has three variants; Password is canonical
    dotnetClass: 'EncryptionPasswordExample',
    variantLabel: 'Options API',
  },
  {
    id: 'encryption-classes',
    name: 'Encryption (Class API)',
    category: 'Security',
    description:
      'The same AES-256 encrypted document as Encryption, authored the long way: construct settings/elements and assign properties (encryption uses the same preset builder). Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'encryption-classes.pdf',
    generate: encryptionClasses,
    pdfUa1: true,
    password: 'demo123',
    dotnetClass: 'EncryptionPasswordExample',
    gallery: false,
    variantOf: 'encryption',
    variantLabel: 'Class API',
  },
  {
    id: 'attached-data',
    name: 'Report with Embedded Data',
    category: 'Security',
    description:
      'A PDF/A-3 report that embeds its underlying CSV data as an associated file for reproducibility, using the generic file-attachment API.',
    filename: 'attached-data.pdf',
    generate: attachedData,
    dotnetClass: 'AttachedDataExample',
    pdfUa1: false,
    variantLabel: 'Options API',
  },
  {
    id: 'attached-data-classes',
    name: 'Report with Embedded Data (Class API)',
    category: 'Security',
    description:
      'The same PDF/A-3 report with embedded CSV as Report with Embedded Data, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'attached-data-classes.pdf',
    generate: attachedDataClasses,
    dotnetClass: 'AttachedDataExample',
    pdfUa1: false,
    gallery: false,
    variantOf: 'attached-data',
    variantLabel: 'Class API',
  },
  // Showcases - Invoices (vertical: billing; region-specific tax/e-invoicing)
  {
    id: 'business-invoice',
    name: 'Business Invoice',
    category: 'Invoices',
    tier: 'showcase',
    description:
      'Professional PDF/UA-1 tagged invoice with company branding, line-items table, totals, and payment details.',
    filename: 'business-invoice.pdf',
    generate: businessInvoice,
    dotnetClass: 'BusinessInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'business-invoice-classes',
    name: 'Business Invoice (Class API)',
    category: 'Invoices',
    tier: 'showcase',
    description:
      'The same branded invoice as Business Invoice, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'business-invoice-classes.pdf',
    generate: businessInvoiceClasses,
    dotnetClass: 'BusinessInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'business-invoice',
    variantLabel: 'Class API',
  },
  {
    id: 'us-sales-invoice',
    name: 'US Sales-Tax Invoice',
    category: 'Invoices',
    tier: 'showcase',
    region: 'US',
    description:
      'A US commercial invoice: destination-based state + county sales-tax breakdown, a purchase-order reference, USD amounts, and an ACH/check remittance line. PDF/A-2a + PDF/UA-1.',
    filename: 'us-sales-invoice.pdf',
    generate: usSalesInvoice,
    dotnetClass: 'UsSalesInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'us-sales-invoice-classes',
    name: 'US Sales-Tax Invoice (Class API)',
    category: 'Invoices',
    tier: 'showcase',
    region: 'US',
    description:
      'The same US sales-tax invoice as US Sales-Tax Invoice, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'us-sales-invoice-classes.pdf',
    generate: usSalesInvoiceClasses,
    dotnetClass: 'UsSalesInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'us-sales-invoice',
    variantLabel: 'Class API',
  },
  {
    id: 'uk-vat-invoice',
    name: 'UK VAT Invoice',
    category: 'Invoices',
    tier: 'showcase',
    region: 'UK',
    description:
      'A HMRC-style VAT invoice: supplier VAT registration number, tax point, mixed standard/reduced/zero-rated lines, and a per-rate VAT summary (net / VAT / gross) in GBP. PDF/A-2a + PDF/UA-1.',
    filename: 'uk-vat-invoice.pdf',
    generate: ukVatInvoice,
    dotnetClass: 'UkVatInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'uk-vat-invoice-classes',
    name: 'UK VAT Invoice (Class API)',
    category: 'Invoices',
    tier: 'showcase',
    region: 'UK',
    description:
      'The same UK VAT invoice as UK VAT Invoice, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'uk-vat-invoice-classes.pdf',
    generate: ukVatInvoiceClasses,
    dotnetClass: 'UkVatInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'uk-vat-invoice',
    variantLabel: 'Class API',
  },
  {
    id: 'factur-x-invoice',
    name: 'EU E-Invoice (Factur-X / ZUGFeRD, EN 16931)',
    category: 'Invoices',
    tier: 'showcase',
    region: 'EU',
    description:
      'A cross-border EU e-invoice in the EN 16931 / Factur-X idiom: a polished PDF/A-3 invoice - both parties, EUR amounts, IBAN/BIC - carrying the machine-readable CII invoice XML embedded as an associated file. The visible totals mirror the embedded XML exactly. Validated in CI with veraPDF (PDF/A-3b) and the Mustang project (ZUGFeRD / EN 16931).',
    filename: 'factur-x_invoice.pdf',
    generate: facturXInvoice,
    requiredAssets: ['factur-x/en16931-invoice.xml'],
    dotnetClass: 'FacturXInvoiceExample',
    thumbnails: false,
    pdfUa1: false,
    variantLabel: 'Options API',
  },
  {
    id: 'factur-x-invoice-classes',
    name: 'EU E-Invoice (Factur-X / ZUGFeRD, EN 16931) (Class API)',
    category: 'Invoices',
    tier: 'showcase',
    region: 'EU',
    description:
      'The same EU Factur-X e-invoice as EU E-Invoice, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'factur-x_invoice-classes.pdf',
    generate: facturXInvoiceClasses,
    requiredAssets: ['factur-x/en16931-invoice.xml'],
    dotnetClass: 'FacturXInvoiceExample',
    thumbnails: false,
    pdfUa1: false,
    gallery: false,
    variantOf: 'factur-x-invoice',
    variantLabel: 'Class API',
  },
  {
    id: 'india-gst-invoice',
    name: 'India GST E-Invoice',
    category: 'Invoices',
    tier: 'showcase',
    region: 'India',
    description:
      'An India GST e-invoice: GSTIN for both parties, HSN/SAC codes, an intra-state CGST + SGST split, the IRN and acknowledgement details, and a signed QR generated with BonniePDF’s native vector QR. INR amounts. PDF/A-2a + PDF/UA-1.',
    filename: 'india-gst-invoice.pdf',
    generate: indiaGstInvoice,
    dotnetClass: 'IndiaGstInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'india-gst-invoice-classes',
    name: 'India GST E-Invoice (Class API)',
    category: 'Invoices',
    tier: 'showcase',
    region: 'India',
    description:
      'The same India GST e-invoice as India GST E-Invoice, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'india-gst-invoice-classes.pdf',
    generate: indiaGstInvoiceClasses,
    dotnetClass: 'IndiaGstInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'india-gst-invoice',
    variantLabel: 'Class API',
  },
  {
    id: 'product-photo-gallery',
    name: 'Product Gallery',
    category: 'Retail',
    tier: 'showcase',
    description:
      'A retail look-book: products laid out two-per-row as cards with name, SKU, price, and blurb, paginating automatically. Each card leads with a deterministic colour-blocked tile drawn natively by the engine, so the catalogue is self-contained. PDF/A-2a + PDF/UA-1.',
    filename: 'product-photo-gallery.pdf',
    generate: productPhotoGallery,
    dotnetClass: 'ProductPhotoGalleryExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'product-photo-gallery-classes',
    name: 'Product Gallery (Class API)',
    category: 'Retail',
    tier: 'showcase',
    description:
      'A retail look-book: products laid out two-per-row as cards with name, SKU, price, and blurb, paginating automatically. Each card leads with a deterministic colour-blocked tile drawn natively by the engine, so the catalogue is self-contained. PDF/A-2a + PDF/UA-1.',
    filename: 'product-photo-gallery-classes.pdf',
    generate: productPhotoGalleryClasses,
    dotnetClass: 'ProductPhotoGalleryExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'product-photo-gallery',
    variantLabel: 'Class API',
  },
  {
    id: 'compliance-findings-register',
    name: 'Compliance Findings Register',
    category: 'Reports',
    tier: 'showcase',
    description:
      'A GRC / audit findings register: 18 severity-coloured finding cards (badge + heading + remediation) paginating across pages. PDF/A-2a + PDF/UA-1.',
    filename: 'compliance-findings-register.pdf',
    generate: complianceFindingsRegister,
    dotnetClass: 'ComplianceFindingsRegisterExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'compliance-findings-register-classes',
    name: 'Compliance Findings Register (Class API)',
    category: 'Reports',
    tier: 'showcase',
    description:
      'A GRC / audit findings register: 18 severity-coloured finding cards (badge + heading + remediation) paginating across pages. PDF/A-2a + PDF/UA-1.',
    filename: 'compliance-findings-register-classes.pdf',
    generate: complianceFindingsRegisterClasses,
    dotnetClass: 'ComplianceFindingsRegisterExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'compliance-findings-register',
    variantLabel: 'Class API',
  },
  {
    id: 'financial-dashboard',
    name: 'Financial Dashboard',
    category: 'Reports',
    tier: 'showcase',
    description:
      'Single-page A4 quarterly report with a full-bleed header, four KPI metrics, a 12-month bar chart, and a top-products table - all styled with a warm earth-tone palette.',
    filename: 'financial-dashboard.pdf',
    generate: financialDashboard,
    dotnetClass: 'FinancialDashboardExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'financial-dashboard-classes',
    name: 'Financial Dashboard (Class API)',
    category: 'Reports',
    tier: 'showcase',
    description:
      'Single-page A4 quarterly report with a full-bleed header, four KPI metrics, a 12-month bar chart, and a top-products table - all styled with a warm earth-tone palette.',
    filename: 'financial-dashboard-classes.pdf',
    generate: financialDashboardClasses,
    dotnetClass: 'FinancialDashboardExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'financial-dashboard',
    variantLabel: 'Class API',
  },
  {
    id: 'annual-report',
    name: 'Annual - Classic',
    category: 'Reports',
    tier: 'showcase',
    description:
      'A4 portrait annual-report template: a full-bleed navy front cover with a hero photograph, then inner pages whose page-background slot paints blue header/footer bands carrying the BonniePDF mark, generation time, and page numbers around the flowing report content.',
    filename: 'annual-report.pdf',
    generate: annualReport,
    requiredAssets: ['images/sean-pollock-PhYq704ffdA-unsplash.jpg'],
    dotnetClass: 'AnnualReportExample',
    thumbnails: false,
    pdfUa1: false,
    variantLabel: 'Options API',
  },
  {
    id: 'annual-report-classes',
    name: 'Annual - Classic (Class API)',
    category: 'Reports',
    tier: 'showcase',
    description:
      'A4 portrait annual-report template: a full-bleed navy front cover with a hero photograph, then inner pages whose page-background slot paints blue header/footer bands carrying the BonniePDF mark, generation time, and page numbers around the flowing report content.',
    filename: 'annual-report-classes.pdf',
    generate: annualReportClasses,
    requiredAssets: ['images/sean-pollock-PhYq704ffdA-unsplash.jpg'],
    dotnetClass: 'AnnualReportExample',
    thumbnails: false,
    pdfUa1: false,
    gallery: false,
    variantOf: 'annual-report',
    variantLabel: 'Class API',
  },
  {
    id: 'annual-report-gradient-cover',
    name: 'Annual - Gradient',
    category: 'Reports',
    tier: 'showcase',
    description:
      'A two-page annual report. Page 1 is a full-bleed cover drawn entirely on the vector surface (indigo-to-fuchsia gradient, radial glow, diagonal accent rules, rotated brand mark, canvas-drawn type); page 2 is the "inside the report" spread - KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-gradient-cover.pdf',
    generate: annualReportGradientCover,
    dotnetClass: 'AnnualReportGradientCoverExample',
    thumbnails: false,
    pdfUa1: false,
    variantLabel: 'Options API',
  },
  {
    id: 'annual-report-gradient-cover-classes',
    name: 'Annual - Gradient (Class API)',
    category: 'Reports',
    tier: 'showcase',
    description:
      'A two-page annual report. Page 1 is a full-bleed cover drawn entirely on the vector surface (indigo-to-fuchsia gradient, radial glow, diagonal accent rules, rotated brand mark, canvas-drawn type); page 2 is the "inside the report" spread - KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-gradient-cover-classes.pdf',
    generate: annualReportGradientCoverClasses,
    dotnetClass: 'AnnualReportGradientCoverExample',
    thumbnails: false,
    pdfUa1: false,
    gallery: false,
    variantOf: 'annual-report-gradient-cover',
    variantLabel: 'Class API',
  },
  {
    id: 'annual-report-masked-cover',
    name: 'Annual - Masked',
    category: 'Reports',
    tier: 'showcase',
    description:
      'A two-page annual report. Page 1 is the classic photographic cover: a full-width hero image clipped to an angled mask cutting into a green title band with a gold seam. Page 2 is the "inside the report" spread - KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-masked-cover.pdf',
    generate: annualReportMaskedCover,
    requiredAssets: ['images/sean-pollock-PhYq704ffdA-unsplash.jpg'],
    dotnetClass: 'AnnualReportMaskedCoverExample',
    thumbnails: false,
    pdfUa1: false,
    variantLabel: 'Options API',
  },
  {
    id: 'annual-report-masked-cover-classes',
    name: 'Annual - Masked (Class API)',
    category: 'Reports',
    tier: 'showcase',
    description:
      'A two-page annual report. Page 1 is the classic photographic cover: a full-width hero image clipped to an angled mask cutting into a green title band with a gold seam. Page 2 is the "inside the report" spread - KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-masked-cover-classes.pdf',
    generate: annualReportMaskedCoverClasses,
    requiredAssets: ['images/sean-pollock-PhYq704ffdA-unsplash.jpg'],
    dotnetClass: 'AnnualReportMaskedCoverExample',
    thumbnails: false,
    pdfUa1: false,
    gallery: false,
    variantOf: 'annual-report-masked-cover',
    variantLabel: 'Class API',
  },
  {
    id: 'annual-report-geometric-cover',
    name: 'Annual - Geometric',
    category: 'Reports',
    tier: 'showcase',
    description:
      'A two-page annual report. Page 1 is a light, modern cover built from vector primitives (radial sun, translucent rotated polygons and a star via affine transforms, a circular masked image badge ringed in gold). Page 2 is the "inside the report" spread - KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-geometric-cover.pdf',
    generate: annualReportGeometricCover,
    dotnetClass: 'AnnualReportGeometricCoverExample',
    thumbnails: false,
    pdfUa1: false,
    variantLabel: 'Options API',
  },
  {
    id: 'annual-report-geometric-cover-classes',
    name: 'Annual - Geometric (Class API)',
    category: 'Reports',
    tier: 'showcase',
    description:
      'A two-page annual report. Page 1 is a light, modern cover built from vector primitives (radial sun, translucent rotated polygons and a star via affine transforms, a circular masked image badge ringed in gold). Page 2 is the "inside the report" spread - KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-geometric-cover-classes.pdf',
    generate: annualReportGeometricCoverClasses,
    dotnetClass: 'AnnualReportGeometricCoverExample',
    thumbnails: false,
    pdfUa1: false,
    gallery: false,
    variantOf: 'annual-report-geometric-cover',
    variantLabel: 'Class API',
  },
  {
    id: 'event-ticket',
    name: 'Event Ticket',
    category: 'Operations',
    tier: 'showcase',
    description:
      'Event ticket / boarding-pass style card (PDF/UA-1 + PDF/A-2a) with a concert background image, a QR entry pass, a Code 128 ticket-id barcode, and a perforation-style tear-off stub on a custom ticket page size.',
    filename: 'event-ticket.pdf',
    generate: eventTicket,
    requiredAssets: ['images/danny-howe-bn-D2bCvpik-unsplash.jpg'],
    dotnetClass: 'EventTicketExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'event-ticket-classes',
    name: 'Event Ticket (Class API)',
    category: 'Operations',
    tier: 'showcase',
    description:
      'Event ticket / boarding-pass style card (PDF/UA-1 + PDF/A-2a) with a concert background image, a QR entry pass, a Code 128 ticket-id barcode, and a perforation-style tear-off stub on a custom ticket page size.',
    filename: 'event-ticket-classes.pdf',
    generate: eventTicketClasses,
    requiredAssets: ['images/danny-howe-bn-D2bCvpik-unsplash.jpg'],
    dotnetClass: 'EventTicketExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'event-ticket',
    variantLabel: 'Class API',
  },
  {
    id: 'patient-summary',
    name: 'Patient Summary',
    category: 'Healthcare',
    tier: 'showcase',
    description:
      'A4 portrait healthcare patient-summary sheet built from rounded-corner cards: each card clips a full-bleed coloured header band to its rounded outline - a teal patient card, an indigo vitals grid, and a rose allergies/alerts panel.',
    filename: 'patient-summary.pdf',
    generate: patientSummary,
    dotnetClass: 'PatientSummaryExample',
    thumbnails: false,
    pdfUa1: false,
    variantLabel: 'Options API',
  },
  {
    id: 'patient-summary-classes',
    name: 'Patient Summary (Class API)',
    category: 'Healthcare',
    tier: 'showcase',
    description:
      'A4 portrait healthcare patient-summary sheet built from rounded-corner cards: each card clips a full-bleed coloured header band to its rounded outline - a teal patient card, an indigo vitals grid, and a rose allergies/alerts panel.',
    filename: 'patient-summary-classes.pdf',
    generate: patientSummaryClasses,
    dotnetClass: 'PatientSummaryExample',
    thumbnails: false,
    pdfUa1: false,
    gallery: false,
    variantOf: 'patient-summary',
    variantLabel: 'Class API',
  },
  {
    id: 'outpatient-appointment-letter',
    name: 'Outpatient Appointment',
    category: 'Healthcare',
    tier: 'showcase',
    region: 'UK',
    description:
      "An accessible fictional Outpatient Appointment with clear appointment details, plain-language actions, an accessibility contact, and prominent sample-data disclaimers. Inspired by UK public-health information-design principles without copying any specific provider's branding. PDF/A-2a + PDF/UA-1.",
    filename: 'outpatient-appointment-letter.pdf',
    generate: outpatientAppointmentLetter,
    dotnetClass: 'OutpatientAppointmentLetterExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'outpatient-appointment-letter-classes',
    name: 'Outpatient Appointment (Class API)',
    category: 'Healthcare',
    tier: 'showcase',
    region: 'UK',
    description:
      "An accessible fictional Outpatient Appointment with clear appointment details, plain-language actions, an accessibility contact, and prominent sample-data disclaimers. Inspired by UK public-health information-design principles without copying any specific provider's branding. PDF/A-2a + PDF/UA-1.",
    filename: 'outpatient-appointment-letter-classes.pdf',
    generate: outpatientAppointmentLetterClasses,
    dotnetClass: 'OutpatientAppointmentLetterExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'outpatient-appointment-letter',
    variantLabel: 'Class API',
  },
  {
    id: 'product-roadmap',
    name: 'Product Roadmap',
    category: 'Operations',
    tier: 'showcase',
    description:
      'Landscape A4 Gantt-style product roadmap: a six-month timeline header over team swimlanes (Development, Design, Marketing), with rounded task bars positioned by month using weighted horizontal stacks.',
    filename: 'product-roadmap.pdf',
    generate: productRoadmap,
    dotnetClass: 'ProductRoadmapExample',
    thumbnails: false,
    pdfUa1: false,
    variantLabel: 'Options API',
  },
  {
    id: 'product-roadmap-classes',
    name: 'Product Roadmap (Class API)',
    category: 'Operations',
    tier: 'showcase',
    description:
      'Landscape A4 Gantt-style product roadmap: a six-month timeline header over team swimlanes (Development, Design, Marketing), with rounded task bars positioned by month using weighted horizontal stacks.',
    filename: 'product-roadmap-classes.pdf',
    generate: productRoadmapClasses,
    dotnetClass: 'ProductRoadmapExample',
    thumbnails: false,
    pdfUa1: false,
    gallery: false,
    variantOf: 'product-roadmap',
    variantLabel: 'Class API',
  },
  // ── Vertical-market gallery follow-up ─────────────────────────────────────
  {
    id: 'saas-invoice',
    name: 'SaaS Invoice',
    category: 'Invoices',
    tier: 'showcase',
    description:
      'An accessible subscription-billing invoice: plan/seat line items, proration, a QR payment code, and totals. PDF/A-2a + PDF/UA-1.',
    filename: 'saas-invoice.pdf',
    generate: saasInvoice,
    dotnetClass: 'SaasInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'saas-invoice-classes',
    name: 'SaaS Invoice (Class API)',
    category: 'Invoices',
    tier: 'showcase',
    description:
      'The same accessible subscription invoice as SaaS Invoice, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'saas-invoice-classes.pdf',
    generate: saasInvoiceClasses,
    dotnetClass: 'SaasInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'saas-invoice',
    variantLabel: 'Class API',
  },
  {
    id: 'shipping-label',
    name: 'Shipping Label',
    category: 'Operations',
    tier: 'showcase',
    description:
      'A 4x6" carrier-style shipping label on a custom page size: routing band, a Code 128 tracking barcode, an ITF-14 carton barcode, and a QR tracking link. PDF/A-2a + PDF/UA-1.',
    filename: 'shipping-label.pdf',
    generate: shippingLabel,
    dotnetClass: 'ShippingLabelExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'shipping-label-classes',
    name: 'Shipping Label (Class API)',
    category: 'Operations',
    tier: 'showcase',
    description:
      'A 4x6" carrier-style shipping label on a custom page size: routing band, a Code 128 tracking barcode, an ITF-14 carton barcode, and a QR tracking link. PDF/A-2a + PDF/UA-1.',
    filename: 'shipping-label-classes.pdf',
    generate: shippingLabelClasses,
    dotnetClass: 'ShippingLabelExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'shipping-label',
    variantLabel: 'Class API',
  },
  {
    id: 'horizontal-bar-chart',
    name: 'Horizontal Bar Chart',
    category: 'Charting',
    description: 'Horizontal bars with value labels - the readable choice when category names are long.',
    filename: 'horizontal-bar-chart.pdf',
    generate: horizontalBarChart,
    dotnetClass: 'HorizontalBarChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'horizontal-bar-chart-classes',
    name: 'Horizontal Bar Chart (Class API)',
    category: 'Charting',
    description:
      'The same chart as Horizontal Bar Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'horizontal-bar-chart-classes.pdf',
    generate: horizontalBarChartClasses,
    dotnetClass: 'HorizontalBarChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'horizontal-bar-chart',
    variantLabel: 'Class API',
  },
  {
    id: 'horizontal-grouped-bar-chart',
    name: 'Horizontal Grouped Bar Chart',
    category: 'Charting',
    description: 'Grouped horizontal bars comparing multiple series per category with a colour legend.',
    filename: 'horizontal-grouped-bar-chart.pdf',
    generate: horizontalGroupedBarChart,
    dotnetClass: 'HorizontalGroupedBarChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'horizontal-grouped-bar-chart-classes',
    name: 'Horizontal Grouped Bar Chart (Class API)',
    category: 'Charting',
    description:
      'The same chart as Horizontal Grouped Bar Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'horizontal-grouped-bar-chart-classes.pdf',
    generate: horizontalGroupedBarChartClasses,
    dotnetClass: 'HorizontalGroupedBarChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'horizontal-grouped-bar-chart',
    variantLabel: 'Class API',
  },
  {
    id: 'horizontal-lollipop-chart',
    name: 'Horizontal Lollipop Chart',
    category: 'Charting',
    description: 'Horizontal stems with circular heads - a minimal, low-ink alternative to horizontal bars.',
    filename: 'horizontal-lollipop-chart.pdf',
    generate: horizontalLollipopChart,
    dotnetClass: 'HorizontalLollipopChartExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'horizontal-lollipop-chart-classes',
    name: 'Horizontal Lollipop Chart (Class API)',
    category: 'Charting',
    description:
      'The same chart as Horizontal Lollipop Chart, authored the long way: construct each chart model and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'horizontal-lollipop-chart-classes.pdf',
    generate: horizontalLollipopChartClasses,
    dotnetClass: 'HorizontalLollipopChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'horizontal-lollipop-chart',
    variantLabel: 'Class API',
  },
  {
    id: 'watermarking-confidential',
    name: 'Watermarking - Confidential',
    category: 'Security',
    description:
      'A CONFIDENTIAL variant of the diagonal watermark, tinted red and repeated behind a multi-section report body.',
    filename: 'watermarking-confidential.pdf',
    generate: watermarkingConfidential,
    dotnetClass: 'WatermarkConfidentialExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'watermarking-confidential-classes',
    name: 'Watermarking - Confidential (Class API)',
    category: 'Security',
    description:
      'The same red CONFIDENTIAL watermarked report as Watermarking - Confidential, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'watermarking-confidential-classes.pdf',
    generate: watermarkingConfidentialClasses,
    dotnetClass: 'WatermarkConfidentialExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'watermarking-confidential',
    variantLabel: 'Class API',
  },
  {
    id: 'edge-receipt',
    name: 'Point-of-Sale Receipt',
    category: 'Retail',
    tier: 'showcase',
    description:
      'The browser/edge flagship: a point-of-sale receipt on a custom 80mm thermal-printer page, in Courier with a native vector QR digital-receipt link and a Code 128 order barcode. Zero dependencies, no WASM - a few KB, generated client-side or in a Cloudflare Worker via generateBytesAsync(). PDF/A-2a + PDF/UA-1.',
    filename: 'edge-receipt.pdf',
    generate: edgeReceipt,
    dotnetClass: 'EdgeReceiptExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'edge-receipt-classes',
    name: 'Point-of-Sale Receipt (Class API)',
    category: 'Retail',
    tier: 'showcase',
    description:
      'The same 80mm thermal-printer receipt as Point-of-Sale Receipt, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'edge-receipt-classes.pdf',
    generate: edgeReceiptClasses,
    dotnetClass: 'EdgeReceiptExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'edge-receipt',
    variantLabel: 'Class API',
  },
  {
    id: 'public-library-membership-letter',
    name: 'Public Library Membership',
    category: 'Community',
    tier: 'showcase',
    region: 'UK',
    description:
      'A fictional UK public-library membership confirmation: local-service masthead, membership details, borrowing limits, branch opening hours, and an alternative-formats notice. Accessibility-first PDF/A-2a + PDF/UA-1.',
    filename: 'public-library-membership-letter.pdf',
    generate: publicLibraryMembershipLetter,
    dotnetClass: 'PublicLibraryMembershipLetterExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'public-library-membership-letter-classes',
    name: 'Public Library Membership (Class API)',
    category: 'Community',
    tier: 'showcase',
    region: 'UK',
    description:
      'The same accessible public-library membership letter as Public Library Membership, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'public-library-membership-letter-classes.pdf',
    generate: publicLibraryMembershipLetterClasses,
    dotnetClass: 'PublicLibraryMembershipLetterExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'public-library-membership-letter',
    variantLabel: 'Class API',
  },
  {
    id: 'audit-report',
    name: 'GDPR ISO 27001 Audit Report',
    category: 'Compliance',
    tier: 'showcase',
    region: 'EU/UK',
    description:
      'An enterprise data-protection & security audit (EU + UK GDPR and ISO/IEC 27001:2022): running CONFIDENTIAL header/footer, KPI tiles, a control-status donut, a findings-by-severity column chart, and a findings register that flows across pages with a repeating header. Archival PDF/A-2a + PDF/UA-1.',
    filename: 'audit-report.pdf',
    generate: auditReport,
    dotnetClass: 'AuditReportExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'audit-report-classes',
    name: 'GDPR ISO 27001 Audit Report (Class API)',
    category: 'Compliance',
    tier: 'showcase',
    region: 'EU/UK',
    description:
      'An enterprise data-protection & security audit (EU + UK GDPR and ISO/IEC 27001:2022): running CONFIDENTIAL header/footer, KPI tiles, a control-status donut, a findings-by-severity column chart, and a findings register that flows across pages with a repeating header. Archival PDF/A-2a + PDF/UA-1.',
    filename: 'audit-report-classes.pdf',
    generate: auditReportClasses,
    dotnetClass: 'AuditReportExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'audit-report',
    variantLabel: 'Class API',
  },
  {
    id: 'shelf-label',
    name: 'Retail Shelf Label (EU/UK)',
    category: 'Retail',
    tier: 'showcase',
    region: 'EU/UK',
    description:
      'An EU/UK retail shelf-edge label on a custom 110x75mm card: product details, promotional was/now pricing, mandatory unit price, shelf metadata, and an EAN-13 (GS1) barcode. PDF/A-2a + PDF/UA-1.',
    filename: 'shelf-label.pdf',
    generate: shelfLabel,
    dotnetClass: 'ShelfLabelExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'shelf-label-classes',
    name: 'Retail Shelf Label (EU/UK) (Class API)',
    category: 'Retail',
    tier: 'showcase',
    region: 'EU/UK',
    description:
      'The same EU/UK shelf-edge label as Retail Shelf Label, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'shelf-label-classes.pdf',
    generate: shelfLabelClasses,
    dotnetClass: 'ShelfLabelExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'shelf-label',
    variantLabel: 'Class API',
  },
  {
    id: 'uk-degree-transcript',
    name: 'UK Degree Transcript',
    category: 'Education',
    tier: 'showcase',
    region: 'UK',
    description:
      'An official UK university degree transcript: institution header, student details, a UK honours classification banner (2:1), a module register grouped by FHEQ level with credits and marks that flows across pages, and a QR verification link. PDF/A-2a + PDF/UA-1.',
    filename: 'uk-degree-transcript.pdf',
    generate: ukDegreeTranscript,
    dotnetClass: 'UkDegreeTranscriptExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'uk-degree-transcript-classes',
    name: 'UK Degree Transcript (Class API)',
    category: 'Education',
    tier: 'showcase',
    region: 'UK',
    description:
      'An official UK university degree transcript: institution header, student details, a UK honours classification banner (2:1), a module register grouped by FHEQ level with credits and marks that flows across pages, and a QR verification link. PDF/A-2a + PDF/UA-1.',
    filename: 'uk-degree-transcript-classes.pdf',
    generate: ukDegreeTranscriptClasses,
    dotnetClass: 'UkDegreeTranscriptExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'uk-degree-transcript',
    variantLabel: 'Class API',
  },
  {
    id: 'financial-statement',
    name: 'IFRS Financial Statements',
    category: 'Reports',
    tier: 'showcase',
    region: 'UK/EU',
    description:
      'A UK/EU statutory financial statement in the IFRS / Companies House idiom: a Statement of Comprehensive Income and a Statement of Financial Position with prior-year comparatives, note references, accounting-style bracketed negatives, and subtotal/total rules. Amounts in £000. PDF/A-2a + PDF/UA-1.',
    filename: 'financial-statement.pdf',
    generate: financialStatement,
    dotnetClass: 'FinancialStatementExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'financial-statement-classes',
    name: 'IFRS Financial Statements (Class API)',
    category: 'Reports',
    tier: 'showcase',
    region: 'UK/EU',
    description:
      'A UK/EU statutory financial statement in the IFRS / Companies House idiom: a Statement of Comprehensive Income and a Statement of Financial Position with prior-year comparatives, note references, accounting-style bracketed negatives, and subtotal/total rules. Amounts in £000. PDF/A-2a + PDF/UA-1.',
    filename: 'financial-statement-classes.pdf',
    generate: financialStatementClasses,
    dotnetClass: 'FinancialStatementExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'financial-statement',
    variantLabel: 'Class API',
  },
  {
    id: 'lab-report',
    name: 'Pathology Lab Report',
    category: 'Healthcare',
    tier: 'showcase',
    region: 'UK',
    description:
      'A fictional UK/EU pathology laboratory report: patient demographics, specimen timestamps, grouped result panels (FBC, U&E) with units, reference ranges and High/Low flags, a clinical interpretation, and an authorising clinician. Privacy-sensitive and client-side-generated. PDF/A-2a + PDF/UA-1.',
    filename: 'lab-report.pdf',
    generate: labReport,
    dotnetClass: 'LabReportExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'lab-report-classes',
    name: 'Pathology Lab Report (Class API)',
    category: 'Healthcare',
    tier: 'showcase',
    region: 'UK',
    description:
      'A fictional UK/EU pathology laboratory report: patient demographics, specimen timestamps, grouped result panels (FBC, U&E) with units, reference ranges and High/Low flags, a clinical interpretation, and an authorising clinician. Privacy-sensitive and client-side-generated. PDF/A-2a + PDF/UA-1.',
    filename: 'lab-report-classes.pdf',
    generate: labReportClasses,
    dotnetClass: 'LabReportExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'lab-report',
    variantLabel: 'Class API',
  },
  {
    id: 'grant-award-letter',
    name: 'Grant Award Letter',
    category: 'Community',
    tier: 'showcase',
    region: 'UK',
    description:
      'A fictional public-sector grant funding decision: fund masthead, a headline "Awarded" decision block with key dates, a tagged award-breakdown table, next steps, a review route, contact options, and an alternative-formats notice. Bookmarked, accessibility-first PDF/A-2a + PDF/UA-1.',
    filename: 'grant-award-letter.pdf',
    generate: grantAwardLetter,
    dotnetClass: 'GrantAwardLetterExample',
    thumbnails: false,
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'grant-award-letter-classes',
    name: 'Grant Award Letter (Class API)',
    category: 'Community',
    tier: 'showcase',
    region: 'UK',
    description:
      'The same accessible grant award letter as Grant Award Letter, authored the long way: construct each element and assign properties. Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'grant-award-letter-classes.pdf',
    generate: grantAwardLetterClasses,
    dotnetClass: 'GrantAwardLetterExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'grant-award-letter',
    variantLabel: 'Class API',
  },
  // ── HR / payroll pack (vertical: HR; security-sensitive transactional output) ─
  {
    id: 'payslip',
    name: 'Payslip',
    category: 'HR',
    tier: 'showcase',
    description:
      'A high-volume, security-sensitive transactional document: earnings, deductions, taxes, employer contributions, ' +
      'and year-to-date totals, with masked employee identifiers and AES-256 encryption. Privacy-sensitive and ' +
      'client-side-generated — generate payslips without sending payroll data to a conversion service. PDF/UA-1 tagged ' +
      '(no PDF/A: archival output cannot be encrypted).',
    filename: 'payslip.pdf',
    generate: payslip,
    dotnetClass: 'PayslipExample',
    thumbnails: false,
    pdfUa1: true,
    password: 'demo123',
    industries: ['HR'],
    documentType: 'payslip',
    capabilities: ['encryption', 'clientSide', 'longTables'],
    compliance: ['pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    series: 'hr-pack',
    variantLabel: 'Options API',
  },
  {
    id: 'payslip-classes',
    name: 'Payslip (Class API)',
    category: 'HR',
    tier: 'showcase',
    description:
      'The same encrypted payslip as Payslip, authored the long way: construct each element and assign properties. ' +
      'Shows the class surface the options-object front door desugars to - and renders byte-for-byte identically.',
    filename: 'payslip-classes.pdf',
    generate: payslipClasses,
    dotnetClass: 'PayslipExample',
    thumbnails: false,
    pdfUa1: true,
    password: 'demo123',
    gallery: false,
    variantOf: 'payslip',
    variantLabel: 'Class API',
  },
];

/**
 * The subset of {@link examples} that is public-facing - shown on the website
 * sidebar, gallery grid, per-example pages, and playground. Excludes
 * conformance-corpus entries (`gallery: false`), which are still generated and
 * validated in CI but are not marketing/documentation. Website consumers should
 * enumerate this; CI/validation/smoke tooling should use the full {@link examples}.
 */
export const galleryExamples: ExampleDef[] = examples.filter(e => e.gallery !== false);
