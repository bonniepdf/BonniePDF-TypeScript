import { generate as multilingualCustomerLetter } from './industry-templates/sales-supply-chain/multilingual-customer-letter';
import { generate as longBasketReceipt } from './industry-templates/retail-events/long-basket-receipt';
import { generate as largeOrderInvoice } from './industry-templates/invoices/large-order-invoice';
import { generate as documentDiagnostics } from './code-recipes/compliance-archival/document-diagnostics';
import { generate as fontFallback } from './code-recipes/fonts/font-fallback';
import { generate as practicalTables } from './code-recipes/tables-lists/practical-tables';
import { generate as pageBreakControl } from './code-recipes/layout-flow/page-break-control';
import { generate as browserDownload } from './code-recipes/getting-started/browser-download';
import { Document } from '@bonniepdf/core';
// ── Recipes (technical primitives) ──────────────────────────────────────────
import { generate as firstPdf } from './code-recipes/getting-started/first-pdf';
import { generate as simpleDocument } from './code-recipes/getting-started/simple-document';
import { generate as simpleDocumentClasses } from './code-recipes/getting-started/simple-document-classes';
import { generate as pdfCompliance } from './code-recipes/compliance-archival/pdf-compliance';
import { generate as pdfComplianceClasses } from './code-recipes/compliance-archival/pdf-compliance-classes';
import { generate as margins } from './code-recipes/page-setup/margins';
import { generate as marginsClasses } from './code-recipes/page-setup/margins-classes';
import { generate as headersFooters } from './code-recipes/page-setup/headers-footers';
import { generate as headersFootersClasses } from './code-recipes/page-setup/headers-footers-classes';
import { generate as horizontalStacks } from './code-recipes/layout-flow/horizontal-stacks';
import { generate as horizontalStacksClasses } from './code-recipes/layout-flow/horizontal-stacks-classes';
import { generate as multiColumnLayouts } from './code-recipes/layout-flow/multi-column-layouts';
import { generate as multiColumnLayoutsClasses } from './code-recipes/layout-flow/multi-column-layouts-classes';
import { generate as textBlockOverflow } from './conformance/text-block-overflow';
import { generate as verticalStackOverflow } from './code-recipes/layout-flow/vertical-stack-overflow';
import { generate as verticalStackOverflowClasses } from './code-recipes/layout-flow/vertical-stack-overflow-classes';
import { generate as tables } from './code-recipes/tables-lists/tables';
import { generate as tablesClasses } from './code-recipes/tables-lists/tables-classes';
import { generate as textAlignment } from './code-recipes/text-styling/text-alignment';
import { generate as textAlignmentClasses } from './code-recipes/text-styling/text-alignment-classes';
import { generate as embeddedFontMetrics } from './code-recipes/fonts/embedded-font-metrics';
import { generate as embeddedFontMetricsClasses } from './code-recipes/fonts/embedded-font-metrics-classes';
import { generate as bookPageLayout } from './code-recipes/long-form-typesetting/book-page-layout';
import { generate as bookPageLayoutClasses } from './code-recipes/long-form-typesetting/book-page-layout-classes';
import { generate as richTextStyles } from './code-recipes/text-styling/rich-text-styles';
import { generate as richTextStylesClasses } from './code-recipes/text-styling/rich-text-styles-classes';
import { generate as textDecorations } from './code-recipes/text-styling/text-decorations';
import { generate as textDecorationsClasses } from './code-recipes/text-styling/text-decorations-classes';
import { generate as customFonts } from './code-recipes/fonts/custom-fonts';
import { generate as customFontsClasses } from './code-recipes/fonts/custom-fonts-classes';
import { generate as colourEmojis } from './code-recipes/scripts-emoji/colour-emojis';
import { generate as internationalTypography } from './code-recipes/scripts-emoji/international-typography';
import { generate as emojisAndUnicode } from './code-recipes/scripts-emoji/emojis-and-unicode';
import { generate as emojisAndUnicodeClasses } from './code-recipes/scripts-emoji/emojis-and-unicode-classes';
import { generate as advancedTypography } from './code-recipes/text-styling/advanced-typography';
import { generate as advancedTypographyClasses } from './code-recipes/text-styling/advanced-typography-classes';
import { generate as dickensNovel } from './code-recipes/long-form-typesetting/dickens-novel';
import { generate as dickensNovelClasses } from './code-recipes/long-form-typesetting/dickens-novel-classes';
import { generate as lists } from './code-recipes/tables-lists/lists';
import { generate as listsClasses } from './code-recipes/tables-lists/lists-classes';
import { generate as hyperlinks } from './code-recipes/links-references/hyperlinks';
import { generate as hyperlinksClasses } from './code-recipes/links-references/hyperlinks-classes';
import { generate as crossReferences } from './code-recipes/links-references/cross-references';
import { generate as crossReferencesClasses } from './code-recipes/links-references/cross-references-classes';
import { generate as shapesAndBorders } from './code-recipes/images-svg-colour/shapes-and-borders';
import { generate as shapesAndBordersClasses } from './code-recipes/images-svg-colour/shapes-and-borders-classes';
import { generate as colorPalette } from './code-recipes/images-svg-colour/color-palette';
import { generate as colorPaletteClasses } from './code-recipes/images-svg-colour/color-palette-classes';
import { generate as qrCodes } from './code-recipes/barcodes-qr-codes/qr-codes';
import { generate as qrCodesClasses } from './code-recipes/barcodes-qr-codes/qr-codes-classes';
import { generate as barcodes } from './code-recipes/barcodes-qr-codes/barcodes';
import { generate as barcodesClasses } from './code-recipes/barcodes-qr-codes/barcodes-classes';
import { generate as dataMatrix } from './code-recipes/barcodes-qr-codes/data-matrix';
import { generate as dataMatrixClasses } from './code-recipes/barcodes-qr-codes/data-matrix-classes';
import { generate as flagsOfTheWorld } from './code-recipes/images-svg-colour/flags-of-the-world';
import { generate as flagsOfTheWorldClasses } from './code-recipes/images-svg-colour/flags-of-the-world-classes';
import { generate as images } from './code-recipes/images-svg-colour/images';
import { generate as imagesClasses } from './code-recipes/images-svg-colour/images-classes';
import { generate as chartShowcase } from './code-recipes/comparison-charts/chart-showcase';
import { generate as chartShowcaseClasses } from './code-recipes/comparison-charts/chart-showcase-classes';
import { generate as barChart } from './code-recipes/comparison-charts/bar-chart';
import { generate as barChartClasses } from './code-recipes/comparison-charts/bar-chart-classes';
import { generate as groupedBarChart } from './code-recipes/comparison-charts/grouped-bar-chart';
import { generate as groupedBarChartClasses } from './code-recipes/comparison-charts/grouped-bar-chart-classes';
import { generate as lineChart } from './code-recipes/trend-charts/line-chart';
import { generate as lineChartClasses } from './code-recipes/trend-charts/line-chart-classes';
import { generate as areaChart } from './code-recipes/trend-charts/area-chart';
import { generate as areaChartClasses } from './code-recipes/trend-charts/area-chart-classes';
import { generate as lollipopChart } from './code-recipes/share-ranking-charts/lollipop-chart';
import { generate as lollipopChartClasses } from './code-recipes/share-ranking-charts/lollipop-chart-classes';
import { generate as dotPlotChart } from './code-recipes/share-ranking-charts/dot-plot-chart';
import { generate as dotPlotChartClasses } from './code-recipes/share-ranking-charts/dot-plot-chart-classes';
import { generate as pieChart } from './code-recipes/share-ranking-charts/pie-chart';
import { generate as pieChartClasses } from './code-recipes/share-ranking-charts/pie-chart-classes';
import { generate as multiSeriesLineChart } from './code-recipes/trend-charts/multi-series-line-chart';
import { generate as multiSeriesLineChartClasses } from './code-recipes/trend-charts/multi-series-line-chart-classes';
import { generate as watermarking } from './code-recipes/security/watermarking';
import { generate as watermarkingClasses } from './code-recipes/security/watermarking-classes';
import { generate as encryption } from './code-recipes/security/encryption';
import { generate as encryptionClasses } from './code-recipes/security/encryption-classes';
import { generate as attachedData } from './code-recipes/compliance-archival/attached-data';
import { generate as attachedDataClasses } from './code-recipes/compliance-archival/attached-data-classes';
// ── Industry Templates (industry / vertical-market documents) ────────────────────────
import { generate as businessInvoice } from './industry-templates/invoices/business-invoice';
import { generate as businessInvoiceClasses } from './industry-templates/invoices/business-invoice-classes';
import { generate as usSalesInvoice } from './industry-templates/invoices/us-sales-invoice';
import { generate as usSalesInvoiceClasses } from './industry-templates/invoices/us-sales-invoice-classes';
import { generate as ukVatInvoice } from './industry-templates/invoices/uk-vat-invoice';
import { generate as ukVatInvoiceClasses } from './industry-templates/invoices/uk-vat-invoice-classes';
import { generate as facturXInvoice } from './industry-templates/invoices/factur-x-invoice';
import { generate as facturXInvoiceClasses } from './industry-templates/invoices/factur-x-invoice-classes';
import { generate as indiaGstInvoice } from './industry-templates/invoices/india-gst-invoice';
import { generate as indiaGstInvoiceClasses } from './industry-templates/invoices/india-gst-invoice-classes';
import { generate as productPhotoGallery } from './industry-templates/retail-events/product-photo-gallery';
import { generate as productPhotoGalleryClasses } from './industry-templates/retail-events/product-photo-gallery-classes';
import { generate as financialDashboard } from './industry-templates/finance-reporting/financial-dashboard';
import { generate as financialDashboardClasses } from './industry-templates/finance-reporting/financial-dashboard-classes';
import { generate as complianceFindingsRegister } from './industry-templates/compliance-audit/compliance-findings-register';
import { generate as complianceFindingsRegisterClasses } from './industry-templates/compliance-audit/compliance-findings-register-classes';
import { generate as annualReport } from './industry-templates/finance-reporting/annual-report';
import { generate as annualReportClasses } from './industry-templates/finance-reporting/annual-report-classes';
import { generate as annualReportGradientCover } from './industry-templates/finance-reporting/annual-report-gradient-cover';
import { generate as annualReportGradientCoverClasses } from './industry-templates/finance-reporting/annual-report-gradient-cover-classes';
import { generate as annualReportMaskedCover } from './industry-templates/finance-reporting/annual-report-masked-cover';
import { generate as annualReportMaskedCoverClasses } from './industry-templates/finance-reporting/annual-report-masked-cover-classes';
import { generate as annualReportGeometricCover } from './industry-templates/finance-reporting/annual-report-geometric-cover';
import { generate as annualReportGeometricCoverClasses } from './industry-templates/finance-reporting/annual-report-geometric-cover-classes';
import { generate as eventTicket } from './industry-templates/retail-events/event-ticket';
import { generate as eventTicketClasses } from './industry-templates/retail-events/event-ticket-classes';
import { generate as patientSummary } from './industry-templates/healthcare/patient-summary';
import { generate as patientSummaryClasses } from './industry-templates/healthcare/patient-summary-classes';
import { generate as outpatientAppointmentLetter } from './industry-templates/healthcare/outpatient-appointment-letter';
import { generate as outpatientAppointmentLetterClasses } from './industry-templates/healthcare/outpatient-appointment-letter-classes';
// ── Vertical-market gallery follow-up (registrations + new exampless) ────────
import { generate as saasInvoice } from './industry-templates/invoices/saas-invoice';
import { generate as saasInvoiceClasses } from './industry-templates/invoices/saas-invoice-classes';
import { generate as shippingLabel } from './industry-templates/sales-supply-chain/shipping-label';
import { generate as shippingLabelClasses } from './industry-templates/sales-supply-chain/shipping-label-classes';
import { generate as horizontalBarChart } from './code-recipes/comparison-charts/horizontal-bar-chart';
import { generate as horizontalBarChartClasses } from './code-recipes/comparison-charts/horizontal-bar-chart-classes';
import { generate as horizontalGroupedBarChart } from './code-recipes/comparison-charts/horizontal-grouped-bar-chart';
import { generate as horizontalGroupedBarChartClasses } from './code-recipes/comparison-charts/horizontal-grouped-bar-chart-classes';
import { generate as horizontalLollipopChart } from './code-recipes/share-ranking-charts/horizontal-lollipop-chart';
import { generate as horizontalLollipopChartClasses } from './code-recipes/share-ranking-charts/horizontal-lollipop-chart-classes';
import { generate as watermarkingConfidential } from './code-recipes/security/watermarking-confidential';
import { generate as watermarkingConfidentialClasses } from './code-recipes/security/watermarking-confidential-classes';
import { generate as edgeReceipt } from './industry-templates/retail-events/edge-receipt';
import { generate as edgeReceiptClasses } from './industry-templates/retail-events/edge-receipt-classes';
import { generate as publicLibraryMembershipLetter } from './industry-templates/education-public-sector/public-library-membership-letter';
import { generate as publicLibraryMembershipLetterClasses } from './industry-templates/education-public-sector/public-library-membership-letter-classes';
import { generate as grantAwardLetter } from './industry-templates/education-public-sector/grant-award-letter';
import { generate as grantAwardLetterClasses } from './industry-templates/education-public-sector/grant-award-letter-classes';
import { generate as auditReport } from './industry-templates/compliance-audit/audit-report';
import { generate as auditReportClasses } from './industry-templates/compliance-audit/audit-report-classes';
import { generate as statutoryComplianceReport } from './industry-templates/compliance-audit/statutory-compliance-report';
import { generate as shelfLabel } from './industry-templates/retail-events/shelf-label';
import { generate as shelfLabelClasses } from './industry-templates/retail-events/shelf-label-classes';
import { generate as ukDegreeTranscript } from './industry-templates/education-public-sector/uk-degree-transcript';
import { generate as ukDegreeTranscriptClasses } from './industry-templates/education-public-sector/uk-degree-transcript-classes';
import { generate as financialStatement } from './industry-templates/finance-reporting/financial-statement';
import { generate as financialStatementClasses } from './industry-templates/finance-reporting/financial-statement-classes';
import { generate as labReport } from './industry-templates/healthcare/lab-report';
import { generate as labReportClasses } from './industry-templates/healthcare/lab-report-classes';
import { generate as payslip } from './industry-templates/people-hr/payslip';
import { generate as payslipClasses } from './industry-templates/people-hr/payslip-classes';
import { generate as quotation } from './industry-templates/sales-supply-chain/quotation';
import { generate as quotationClasses } from './industry-templates/sales-supply-chain/quotation-classes';
import { generate as employmentContract } from './industry-templates/people-hr/employment-contract';
import { generate as employmentContractClasses } from './industry-templates/people-hr/employment-contract-classes';
import { generate as policySchedule } from './industry-templates/legal-insurance/policy-schedule';
import { generate as utilityBill } from './industry-templates/billing-payments/utility-bill';
import { generate as utilityBillClasses } from './industry-templates/billing-payments/utility-bill-classes';
import { generate as courseCertificate } from './industry-templates/education-public-sector/course-certificate';
import { generate as courseCertificateClasses } from './industry-templates/education-public-sector/course-certificate-classes';
import { generate as jobSheet } from './industry-templates/field-service-property/job-sheet';
import { generate as jobSheetClasses } from './industry-templates/field-service-property/job-sheet-classes';
import { generate as reactiveWorkOrder } from './industry-templates/field-service-property/reactive-work-order';
import { generate as siteInspectionReport } from './industry-templates/field-service-property/site-inspection-report';
import { generate as siteInspectionReportClasses } from './industry-templates/field-service-property/site-inspection-report-classes';
import { generate as permitToWork } from './industry-templates/field-service-property/permit-to-work';
import { generate as permitToWorkClasses } from './industry-templates/field-service-property/permit-to-work-classes';
import { generate as inventoryScheduleOfCondition } from './industry-templates/field-service-property/inventory-schedule-of-condition';
import { generate as inventoryScheduleOfConditionClasses } from './industry-templates/field-service-property/inventory-schedule-of-condition-classes';
import { generate as customerAccountStatement } from './industry-templates/billing-payments/customer-account-statement';
import { generate as customerAccountStatementClasses } from './industry-templates/billing-payments/customer-account-statement-classes';
import { generate as purchaseOrder } from './industry-templates/sales-supply-chain/purchase-order';
import { generate as purchaseOrderClasses } from './industry-templates/sales-supply-chain/purchase-order-classes';
import { generate as creditNote } from './industry-templates/billing-payments/credit-note';
import { generate as creditNoteClasses } from './industry-templates/billing-payments/credit-note-classes';
import { generate as deliveryNote } from './industry-templates/sales-supply-chain/delivery-note';
import { generate as deliveryNoteClasses } from './industry-templates/sales-supply-chain/delivery-note-classes';
import { generate as dischargeSummary } from './industry-templates/healthcare/discharge-summary';
import { generate as dischargeSummaryClasses } from './industry-templates/healthcare/discharge-summary-classes';
import { generate as exhibitBundleIndex } from './industry-templates/legal-insurance/exhibit-bundle-index';
import { generate as exhibitBundleIndexClasses } from './industry-templates/legal-insurance/exhibit-bundle-index-classes';
import { generate as propertyParticulars } from './industry-templates/field-service-property/property-particulars';
import { generate as propertyParticularsClasses } from './industry-templates/field-service-property/property-particulars-classes';
import { generate as serverEndpoint } from './code-recipes/server-batch/server-endpoint';
import { generate as batchGeneration } from './code-recipes/server-batch/batch-generation';
import { generate as billOfCosts } from './industry-templates/legal-insurance/bill-of-costs';
import { generate as billOfCostsClasses } from './industry-templates/legal-insurance/bill-of-costs-classes';
import { generate as remittanceAdvice } from './industry-templates/billing-payments/remittance-advice';
import { generate as remittanceAdviceClasses } from './industry-templates/billing-payments/remittance-advice-classes';
import { generate as dunningLetter } from './industry-templates/billing-payments/dunning-letter';
import { generate as dunningLetterClasses } from './industry-templates/billing-payments/dunning-letter-classes';
import { generate as timesheet } from './industry-templates/people-hr/timesheet';
import { generate as timesheetClasses } from './industry-templates/people-hr/timesheet-classes';
import { generate as bankStatement } from './industry-templates/finance-reporting/bank-statement';
import { generate as bookingConfirmation } from './industry-templates/retail-events/booking-confirmation';
import { generate as expenseReport } from './industry-templates/people-hr/expense-report';
import { generate as tenancyAgreement } from './industry-templates/field-service-property/tenancy-agreement';
import { generate as commercialInvoice } from './industry-templates/sales-supply-chain/commercial-invoice';
import { generate as boardMinutes } from './industry-templates/compliance-audit/board-minutes';

export * from './svg';

// ── Structured taxonomy (gallery filters, capability search) ─────────────────
// These axes are orthogonal to the free-text {@link ExampleDef.category}: an
// invoice is `documentType: 'invoice'` but can serve any {@link Industry}.
// They power gallery facets ("PDF/UA", "Browser-only", "Barcodes", "Multi-page
// tables", "PDF/A-3 attachments") without each examples re-deriving them from
// its own description.

/** Vertical market / buyer context a document serves. */
export type Industry =
  | 'Legal'
  | 'Insurance'
  | 'Property'
  | 'Construction'
  | 'Facilities'
  | 'FieldService'
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
  | 'quote'
  | 'bill'
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
  | 'chart'
  | 'worksheet'
  | 'permit';

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
  /** Paired host/setup guide under /docs/{language}/. */
  guideSlug?: string;
  id: string;
  name: string;
  category: string;
  description: string;
  /**
   * Which layer of the gallery this belongs to (see the example-gallery revenue
   * strategy). `'examples'` = a finished industry/vertical
   * document for the public gallery; `'recipe'` = a technical primitive demo for
   * the docs cookbook. Defaults to `'recipe'` when omitted.
   */
  tier?: 'examples' | 'recipe';
  /** Target market for market-specific templates (e.g. 'US', 'UK', 'EU', 'India'). */
  region?: string;
  filename: string;
  /**
   * Builds the document. Callers always pass the asset map (empty when the
   * example declares no `requiredAssets`), so an example that needs a file can
   * declare a required parameter and fail loudly when it is absent rather than
   * quietly rendering a stand-in. Examples needing nothing simply declare
   * `generate()` and ignore the argument.
   */
  generate: (assets: ReadonlyMap<string, Uint8Array>) => Document;
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

/** The SVG flags the Flags of the World examples draw, as asset paths (relative to examples/assets/). */
const FLAG_ASSETS = ['mx', 'gs', 'es', 'pt', 'gr', 'nl', 'hk', 'kz', 'co', 'is', 'lb', 'my'].map(
  code => `flags/4x3/${code}.svg`
);

/** The product photographs the Product Gallery examples embed, as asset paths (relative to examples/assets/). */
const PRODUCT_GALLERY_ASSETS = [
  'terracotta-planter',
  'linen-throw',
  'brass-reading-lamp',
  'ceramic-pour-over',
  'wool-floor-cushion',
  'smoked-glass-carafe',
  'oak-wall-shelf',
  'rattan-pendant-shade',
].map(slug => `images/products/${slug}.jpg`);

/**
 * Every example, in the order consumers list them: recipes, then industry templates.
 * Within a tier the categories follow a deliberate teaching order (see the
 * section comments), not the alphabet, and the examples within a category are
 * alphabetical by name. A variant sits directly after the example it is a
 * variant of. Keep new entries in this order - galleries and pickers list the
 * registry as-is rather than sorting it. A category's URL id is its name
 * slugified (`Billing & Payments` -> `billing-payments`).
 */
export const examples: ExampleDef[] = [
  // Recipes - Getting Started
  {
    id: 'browser-download',
    name: 'Download a PDF from a Browser',
    category: 'Getting Started',
    description:
      'A product card on an A5 page, built from explicit font and photo bytes, with a runnable browser download companion.',
    filename: 'browser-download.pdf',
    generate: browserDownload,
    dotnetClass: 'BrowserDownloadExample',
    requiredAssets: ['fonts/NotoSans-Regular.ttf', 'images/products/terracotta-planter.jpg'],
    guideSlug: 'browser-download',
  },
  {
    id: 'simple-document',
    name: 'Simple Document',
    category: 'Getting Started',
    description:
      'A three-page tour of the core Document API: a title block, a feature panel, a QR code with alt text, a summary table and a custom square page. A good first example.',
    filename: 'simple-document.pdf',
    generate: simpleDocument,
    dotnetClass: 'SimpleDocumentExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'simple-document-classes',
    name: 'Simple Document (Class API)',
    category: 'Getting Started',
    description:
      'The same document as Simple Document, built with the class API: construct each object with `new`, then set properties. The output is identical.',
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
    id: 'first-pdf',
    name: 'Your First PDF',
    category: 'Getting Started',
    description:
      'Create a short invoice with a title and language, a heading, a table and a total, and export it as PDF.',
    filename: 'first-pdf.pdf',
    generate: firstPdf,
    dotnetClass: 'FirstPdfExample',
  },

  // Recipes - Page Setup
  {
    id: 'headers-footers',
    name: 'Headers & Footers',
    category: 'Page Setup',
    description:
      'A three-page report with a distinct first-page header, mirrored odd and even headers with a brand mark and rule, and page numbers on the outer edge. Screen readers skip the headers and footers.',
    filename: 'headers-footers.pdf',
    generate: headersFooters,
    dotnetClass: 'HeadersFootersExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'headers-footers-classes',
    name: 'Headers & Footers (Class API)',
    category: 'Page Setup',
    description:
      'The same running-header/footer document as Headers & Footers, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'headers-footers-classes.pdf',
    generate: headersFootersClasses,
    dotnetClass: 'HeadersFootersExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'headers-footers',
    variantLabel: 'Class API',
  },
  {
    id: 'margins',
    name: 'Margins and Padding',
    category: 'Page Setup',
    description:
      'Margin is the space outside an element; padding is the space inside its border. Both are shown side by side on text, containers, tables, and stacks.',
    filename: 'margins.pdf',
    generate: margins,
    dotnetClass: 'MarginsAndPadding',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'margins-classes',
    name: 'Margins and Padding (Class API)',
    category: 'Page Setup',
    description:
      'The same margins-and-padding tour as Margins and Padding, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'margins-classes.pdf',
    generate: marginsClasses,
    dotnetClass: 'MarginsAndPadding',
    pdfUa1: true,
    gallery: false,
    variantOf: 'margins',
    variantLabel: 'Class API',
  },

  // Recipes - Layout & Flow
  {
    id: 'page-break-control',
    name: 'Control Page Breaks',
    category: 'Layout & Flow',
    description:
      'A supply agreement: clause headings never stranded at the foot of a page, a signature panel kept in one piece, and a handover checklist that continues across pages.',
    filename: 'page-break-control.pdf',
    generate: pageBreakControl,
    dotnetClass: 'PageBreakControlExample',
  },
  {
    id: 'horizontal-stacks',
    name: 'Horizontal Stacks',
    category: 'Layout & Flow',
    description:
      'Horizontal layout with equal and weighted widths, vertical alignment, key-value pairs, and two-column text, all structured for screen readers.',
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
    category: 'Layout & Flow',
    description:
      'The same HorizontalStack tour as Horizontal Stacks, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'multi-column-layouts',
    name: 'Multi-Column Layouts',
    category: 'Layout & Flow',
    description:
      'Newspaper-style columns built from stacks: a three-story community newsletter with images, two text columns sharing a divider, and balanced versus ragged column heights.',
    filename: 'multi-column-layouts.pdf',
    generate: multiColumnLayouts,
    thumbnails: false,
    dotnetClass: 'MultiColumnLayoutsExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'multi-column-layouts-classes',
    name: 'Multi-Column Layouts (Class API)',
    category: 'Layout & Flow',
    description:
      'The same multi-column tour as Multi-Column Layouts, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'multi-column-layouts-classes.pdf',
    generate: multiColumnLayoutsClasses,
    thumbnails: false,
    dotnetClass: 'MultiColumnLayoutsExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'multi-column-layouts',
    variantLabel: 'Class API',
  },
  {
    id: 'text-block-overflow',
    name: 'TextBlock Overflow',
    category: 'Layout & Flow',
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
    category: 'Layout & Flow',
    description:
      'A sheet of Code 128 asset labels in a VerticalStack. Barcodes do not split across pages, so the stack moves labels that would fall off the page onto the next one.',
    filename: 'vertical-stack-overflow.pdf',
    generate: verticalStackOverflow,
    dotnetClass: 'VerticalStackOverflowExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'vertical-stack-overflow-classes',
    name: 'VerticalStack Overflow (Class API)',
    category: 'Layout & Flow',
    description:
      'The same warehouse asset-label sheet as VerticalStack Overflow, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'vertical-stack-overflow-classes.pdf',
    generate: verticalStackOverflowClasses,
    dotnetClass: 'VerticalStackOverflowExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'vertical-stack-overflow',
    variantLabel: 'Class API',
  },

  // Recipes - Text Styling
  {
    id: 'advanced-typography',
    name: 'Advanced Typography',
    category: 'Text Styling',
    description:
      'Superscript and subscript with baseline shift (H₂O, E=mc²), plus decoration styling: overlines, and coloured or thick underlines and strikethroughs.',
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
    category: 'Text Styling',
    description:
      'The same super/subscript + decoration-styling tour as Advanced Typography, built with the class API: construct each element and assign properties, per-span TextStyles via the fluent builders. The output is identical.',
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
    id: 'rich-text-styles',
    name: 'Rich Text Styles',
    category: 'Text Styling',
    description:
      'Bold, italic, coloured, highlighted, and mixed-size spans within flowing paragraphs. Reusable style objects, justified alignment, and a practical legal disclaimer.',
    filename: 'rich-text-styles.pdf',
    generate: richTextStyles,
    dotnetClass: 'RichTextExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'rich-text-styles-classes',
    name: 'Rich Text Styles (Class API)',
    category: 'Text Styling',
    description:
      'The same inline mixed-style RichText tour as Rich Text Styles, built with the class API: fluent per-span TextStyle builders and construct-then-mutate. The output is identical.',
    filename: 'rich-text-styles-classes.pdf',
    generate: richTextStylesClasses,
    dotnetClass: 'RichTextExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'rich-text-styles',
    variantLabel: 'Class API',
  },
  {
    id: 'text-alignment',
    name: 'Text Alignment',
    category: 'Text Styling',
    description:
      'Left, centre, right, and justified text, from short sentences to book-style paragraphs where word spacing stretches to both margins, readable by screen readers.',
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
    category: 'Text Styling',
    description:
      'The same alignment tour as Text Alignment, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'text-decorations',
    name: 'Text Decorations',
    category: 'Text Styling',
    description:
      'Underline and strikethrough decorations applied individually, combined, and across all text alignments and font sizes, with a practical price-list example.',
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
    category: 'Text Styling',
    description:
      'The same underline/strikethrough tour as Text Decorations, built with the class API: construct each element and assign properties, using the TextDecoration flag enum. The output is identical.',
    filename: 'text-decorations-classes.pdf',
    generate: textDecorationsClasses,
    thumbnails: false,
    dotnetClass: 'TextDecorationExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'text-decorations',
    variantLabel: 'Class API',
  },

  // Recipes - Fonts
  {
    id: 'custom-fonts',
    requiredAssets: [
      'fonts/NotoSans-Regular.ttf',
      'fonts/NotoSansMath-Regular.ttf',
      'fonts/NotoSansSymbols2-Regular.ttf',
    ],
    name: 'Custom Fonts',
    category: 'Fonts',
    description:
      'TrueType font embedding with Unicode coverage: symbols, currency, arrows, maths, dingbats, and Greek across NotoSans, NotoSansMath, and NotoSansSymbols2.',
    filename: 'custom-fonts.pdf',
    generate: customFonts,
    thumbnails: false,
    dotnetClass: 'CustomFontExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'custom-fonts-classes',
    requiredAssets: [
      'fonts/NotoSans-Regular.ttf',
      'fonts/NotoSansMath-Regular.ttf',
      'fonts/NotoSansSymbols2-Regular.ttf',
    ],
    name: 'Custom Fonts (Class API)',
    category: 'Fonts',
    description:
      'The same TrueType-embedding / Unicode-coverage tour as Custom Fonts, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'font-fallback',
    name: 'Font Fallback & Missing Characters',
    category: 'Fonts',
    description:
      'An international customer list in Helvetica: Polish, Greek, Cyrillic and Hebrew names fall back to Liberation Sans, Arabic and maths symbols to registered fonts, under strict missing-character checks.',
    filename: 'font-fallback.pdf',
    generate: fontFallback,
    dotnetClass: 'FontFallbackExample',
    requiredAssets: ['fonts/NotoNaskhArabic-Regular.ttf', 'fonts/NotoSansMath-Regular.ttf'],
    guideSlug: 'font-fallback',
  },
  {
    id: 'embedded-font-metrics',
    name: 'Embedded-Font Metrics',
    category: 'Fonts',
    description:
      'Alignment measured from the embedded font’s own advance widths: four framed samples whose rules mark the measure, so every left, centre, right and justified edge can be seen landing on them. Set in Liberation Sans.',
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
    category: 'Fonts',
    description:
      'The same framed alignment samples as Embedded-Font Metrics, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'embedded-font-metrics-classes.pdf',
    generate: embeddedFontMetricsClasses,
    thumbnails: false,
    dotnetClass: 'EmbeddedFontMetricsExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'embedded-font-metrics',
    variantLabel: 'Class API',
  },

  // Recipes - Scripts & Emoji
  {
    id: 'colour-emojis',
    name: 'Colour Emojis',
    category: 'Scripts & Emoji',
    description:
      'Colour emoji alongside regular text, including joined families, skin tones, flags and keycaps. PDF/A-2b and PDF/UA-1.',
    filename: 'colour-emojis.pdf',
    generate: colourEmojis,
    requiredAssets: [
      'fonts/NotoSans-Regular.ttf',
      'fonts/TwemojiMozilla.ttf',
      'fonts/TwemojiMozilla-LICENSE.md',
      'fonts/TwemojiMozilla-CC-BY-4.0.txt',
      'fonts/TwemojiMozilla-APACHE-2.0.txt',
    ],
    dotnetClass: 'ColourEmojiExample',
    pdfUa1: true,
  },
  {
    id: 'emojis-and-unicode',
    name: 'Emojis & Unicode',
    category: 'Scripts & Emoji',
    description:
      'Full Unicode range: BMP symbols, Greek, Cyrillic, dingbats, and supplementary emoji across multiple embedded fonts, with a mixed text and emoji status line.',
    filename: 'emojis-and-unicode.pdf',
    generate: emojisAndUnicode,
    requiredAssets: [
      'fonts/NotoSans-Regular.ttf',
      'fonts/NotoSansMath-Regular.ttf',
      'fonts/NotoSansSymbols2-Regular.ttf',
      'fonts/NotoEmoji-Regular.ttf',
    ],
    thumbnails: false,
    dotnetClass: 'EmojiExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'emojis-and-unicode-classes',
    name: 'Emojis & Unicode (Class API)',
    category: 'Scripts & Emoji',
    description:
      'The same full-Unicode / emoji tour as Emojis & Unicode, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'emojis-and-unicode-classes.pdf',
    generate: emojisAndUnicodeClasses,
    requiredAssets: [
      'fonts/NotoSans-Regular.ttf',
      'fonts/NotoSansMath-Regular.ttf',
      'fonts/NotoSansSymbols2-Regular.ttf',
      'fonts/NotoEmoji-Regular.ttf',
    ],
    thumbnails: false,
    dotnetClass: 'EmojiExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'emojis-and-unicode',
    variantLabel: 'Class API',
  },
  {
    id: 'international-typography',
    name: 'International Typography',
    category: 'Scripts & Emoji',
    description:
      'OpenType kerning and ligatures compared on and off, Arabic and Hebrew set right to left, one table in two directions, and opt-in colour flag emoji. PDF/A-2b and PDF/UA-1.',
    filename: 'international-typography.pdf',
    generate: internationalTypography,
    requiredAssets: [
      'fonts/SourceSerif4-Regular.ttf',
      'fonts/NotoNaskhArabic-Regular.ttf',
      'fonts/NotoSerifHebrew-Regular.ttf',
      'fonts/TwemojiMozilla.ttf',
      'fonts/SourceSerif4-OFL.txt',
      'fonts/NotoNaskhArabic-OFL.txt',
      'fonts/NotoSerifHebrew-OFL.txt',
      'fonts/TwemojiMozilla-LICENSE.md',
      'fonts/TwemojiMozilla-CC-BY-4.0.txt',
      'fonts/TwemojiMozilla-APACHE-2.0.txt',
    ],
    dotnetClass: 'InternationalTypographyExample',
    pdfUa1: true,
  },

  // Recipes - Long-form Typesetting
  {
    id: 'book-page-layout',
    name: 'Book Page Layout',
    category: 'Long-form Typesetting',
    description:
      'A typeset monograph chapter page: Times fonts, justified body text, an inset bordered pull-quote, a bold/italic emphasis break, and a chapter footer with imprint.',
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
    category: 'Long-form Typesetting',
    description:
      'The same typeset chapter page as Book Page Layout, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'dickens-novel',
    name: 'Dickens: A Tale of Two Cities',
    category: 'Long-form Typesetting',
    description:
      'The complete public-domain novel with a visual table of contents, chapter headings, running headers, page numbers, and justified text.',
    filename: 'dickens-novel.pdf',
    generate: dickensNovel,
    requiredAssets: ['novels/pg98.txt'],
    dotnetClass: 'DickensNovelExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'dickens-novel-classes',
    name: 'Dickens: A Tale of Two Cities (Class API)',
    category: 'Long-form Typesetting',
    description:
      'The same multi-page book layout as Dickens: A Tale of Two Cities, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'dickens-novel-classes.pdf',
    generate: dickensNovelClasses,
    requiredAssets: ['novels/pg98.txt'],
    dotnetClass: 'DickensNovelExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'dickens-novel',
    variantLabel: 'Class API',
  },

  // Recipes - Tables & Lists
  {
    id: 'lists',
    name: 'Lists',
    category: 'Tables & Lists',
    description:
      'Ordered (decimal, roman, alpha, custom start) and unordered (disc, circle, square, dash, coloured) lists with nesting, each item structured for screen readers.',
    filename: 'lists.pdf',
    generate: lists,
    dotnetClass: 'ListsExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'lists-classes',
    name: 'Lists (Class API)',
    category: 'Tables & Lists',
    description:
      'The same ordered/unordered list tour as Lists, built with the class API: construct each list and assign properties. The output is identical.',
    filename: 'lists-classes.pdf',
    generate: listsClasses,
    dotnetClass: 'ListsExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'lists',
    variantLabel: 'Class API',
  },
  {
    id: 'practical-tables',
    name: 'Tables with Real-World Content',
    category: 'Tables & Lists',
    description: 'Column spans, wrapping descriptions, aligned numbers, repeated headers, and empty results.',
    filename: 'practical-tables.pdf',
    generate: practicalTables,
    dotnetClass: 'PracticalTablesExample',
  },
  {
    id: 'tables',
    name: 'Tables',
    category: 'Tables & Lists',
    description:
      'A 45-row employee directory table with portrait photos, running by name, role, and department, with repeating column headers and alternating row colours.',
    filename: 'tables.pdf',
    generate: tables,
    requiredAssets: Array.from({ length: 45 }, (_, i) => `images/employees/employee-${i + 1}.jpg`),
    dotnetClass: 'TablesExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'tables-classes',
    name: 'Tables (Class API)',
    category: 'Tables & Lists',
    description:
      'The same multi-page employee table + prose as Tables, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'tables-classes.pdf',
    generate: tablesClasses,
    requiredAssets: Array.from({ length: 45 }, (_, i) => `images/employees/employee-${i + 1}.jpg`),
    dotnetClass: 'TablesExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'tables',
    variantLabel: 'Class API',
  },

  // Recipes - Images, SVG & Colour
  {
    id: 'color-palette',
    name: 'Colour Palette',
    category: 'Images, SVG & Colour',
    description:
      'The full ColorPalette drawn as a swatch grid: all 22 Tailwind v4 ramps × 11 shades, each addressed in code as ColorPalette[name][shade] for consistent colours.',
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
    category: 'Images, SVG & Colour',
    description:
      'The same 22-ramp swatch grid as Colour Palette, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'flags-of-the-world',
    name: 'Flags of the World',
    category: 'Images, SVG & Colour',
    description:
      'SVG import: twelve national flags drawn as vector content, from a few shapes to a coat of arms with eight gradients, and one flag at full page width that stays sharp at any zoom. Every flag carries alt text.',
    filename: 'flags-of-the-world.pdf',
    generate: flagsOfTheWorld,
    requiredAssets: FLAG_ASSETS,
    dotnetClass: 'FlagsOfTheWorldExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'flags-of-the-world-classes',
    name: 'Flags of the World (Class API)',
    category: 'Images, SVG & Colour',
    description:
      'The same SVG flag tour as Flags of the World, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'flags-of-the-world-classes.pdf',
    generate: flagsOfTheWorldClasses,
    requiredAssets: FLAG_ASSETS,
    dotnetClass: 'FlagsOfTheWorldExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'flags-of-the-world',
    variantLabel: 'Class API',
  },
  {
    id: 'images',
    requiredAssets: [
      'images/products/ceramic-pour-over.jpg',
      'images/products/linen-throw.jpg',
      'images/products/brass-reading-lamp.jpg',
      'images/products/smoked-glass-carafe.jpg',
      'images/products/oak-wall-shelf.jpg',
      'images/recipes/alpha.png',
      'images/recipes/divider.png',
    ],
    name: 'Images',
    category: 'Images, SVG & Colour',
    description:
      'JPEG and PNG embedding: contain, cover and fill in clipping frames, a product photo row, and alpha transparency on light and dark panels. Informative images carry alt text; the decorative divider is skipped.',
    filename: 'images.pdf',
    generate: images,
    dotnetClass: 'ImagesExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'images-classes',
    requiredAssets: [
      'images/products/ceramic-pour-over.jpg',
      'images/products/linen-throw.jpg',
      'images/products/brass-reading-lamp.jpg',
      'images/products/smoked-glass-carafe.jpg',
      'images/products/oak-wall-shelf.jpg',
      'images/recipes/alpha.png',
      'images/recipes/divider.png',
    ],
    name: 'Images (Class API)',
    category: 'Images, SVG & Colour',
    description:
      'The same raster-image tour as Images, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'images-classes.pdf',
    generate: imagesClasses,
    dotnetClass: 'ImagesExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'images',
    variantLabel: 'Class API',
  },
  {
    id: 'shapes-and-borders',
    name: 'Shapes & Borders',
    category: 'Images, SVG & Colour',
    description:
      'Rounded rectangles at several corner radii, bordered containers with and without fills, card layouts, and alert-style status banners.',
    filename: 'shapes-and-borders.pdf',
    generate: shapesAndBorders,
    dotnetClass: 'ShapesAndBordersExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'shapes-and-borders-classes',
    name: 'Shapes & Borders (Class API)',
    category: 'Images, SVG & Colour',
    description:
      'The same rounded-rectangle / borders / cards / banners tour as Shapes & Borders, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'shapes-and-borders-classes.pdf',
    generate: shapesAndBordersClasses,
    dotnetClass: 'ShapesAndBordersExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'shapes-and-borders',
    variantLabel: 'Class API',
  },

  // Recipes - Barcodes & QR Codes
  {
    id: 'barcodes',
    name: 'Barcodes',
    category: 'Barcodes & QR Codes',
    description:
      'Native vector 1D barcodes (Code 128, EAN-13, UPC-A, ITF-14) for UK, EU, and US retail and logistics, with automatic check digits and readable labels.',
    filename: 'barcodes.pdf',
    generate: barcodes,
    dotnetClass: 'BarcodesExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'barcodes-classes',
    name: 'Barcodes (Class API)',
    category: 'Barcodes & QR Codes',
    description:
      'The same native 1D-barcode tour as Barcodes, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'barcodes-classes.pdf',
    generate: barcodesClasses,
    dotnetClass: 'BarcodesExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'barcodes',
    variantLabel: 'Class API',
  },
  {
    id: 'data-matrix',
    name: 'Data Matrix',
    category: 'Barcodes & QR Codes',
    description:
      'Native vector Data Matrix (ECC200) symbols with automatic encodation, Reed-Solomon error correction, square and rectangular sizes, and custom colours.',
    filename: 'data-matrix.pdf',
    generate: dataMatrix,
    dotnetClass: 'DataMatrixExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'data-matrix-classes',
    name: 'Data Matrix (Class API)',
    category: 'Barcodes & QR Codes',
    description:
      'The same native Data Matrix tour as Data Matrix, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'data-matrix-classes.pdf',
    generate: dataMatrixClasses,
    dotnetClass: 'DataMatrixExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'data-matrix',
    variantLabel: 'Class API',
  },
  {
    id: 'qr-codes',
    name: 'QR Codes',
    category: 'Barcodes & QR Codes',
    description:
      'Native vector QR codes from a full ISO/IEC 18004 encoder: all four error correction levels, custom colours, and transparent backgrounds, sharp at any zoom.',
    filename: 'qr-codes.pdf',
    generate: qrCodes,
    // .NET ships the Fluent variant as the canonical source
    dotnetClass: 'QRCodesExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'qr-codes-classes',
    name: 'QR Codes (Class API)',
    category: 'Barcodes & QR Codes',
    description:
      'The same native vector-QR tour as QR Codes, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'qr-codes-classes.pdf',
    generate: qrCodesClasses,
    dotnetClass: 'QRCodesExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'qr-codes',
    variantLabel: 'Class API',
  },

  // Recipes - Links & References
  {
    id: 'cross-references',
    name: 'Cross-References',
    category: 'Links & References',
    description:
      'A short staff handbook: a linked contents page with live page numbers, chapters that flow across pages, “see page N” references and back-links, all resolved automatically.',
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
    category: 'Links & References',
    description:
      'The same staff handbook as Cross-References, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'hyperlinks',
    name: 'Hyperlinks',
    category: 'Links & References',
    description:
      'A resources page: web links with descriptions, an underlined link inside a sentence, a button-style link, and email and phone links, all in one link colour. Every link is tagged for screen readers.',
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
    category: 'Links & References',
    description:
      'The same hyperlink tour as Hyperlinks, built with the class API: construct each link and assign properties. The output is identical.',
    filename: 'hyperlinks-classes.pdf',
    generate: hyperlinksClasses,
    thumbnails: false,
    dotnetClass: 'HyperlinksExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'hyperlinks',
    variantLabel: 'Class API',
  },

  // Recipes - Comparison Charts
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    category: 'Comparison Charts',
    description:
      'A vertical bar chart of monthly sales from January to December, with grid lines, value labels, a running page footer, and alt text describing the trend.',
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
    category: 'Comparison Charts',
    description:
      'The same monthly-sales bar chart as Bar Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
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
    id: 'chart-showcase',
    name: 'Chart Showcase',
    category: 'Comparison Charts',
    description:
      'Eight landscape pages with the modern chart theme, rounded gradient bars, coordinated comparison colours and a product-mix doughnut. Every chart includes alt text.',
    filename: 'chart-showcase.pdf',
    generate: chartShowcase,
    dotnetClass: 'ChartShowcaseExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'chart-showcase-classes',
    name: 'Chart Showcase (Class API)',
    category: 'Comparison Charts',
    description:
      'The same eight-page all-chart-types showcase as Chart Showcase, built with the class API: construct each chart model and assign properties. The output is identical.',
    filename: 'chart-showcase-classes.pdf',
    generate: chartShowcaseClasses,
    dotnetClass: 'ChartShowcaseExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'chart-showcase',
    variantLabel: 'Class API',
  },
  {
    id: 'grouped-bar-chart',
    name: 'Grouped Bar Chart',
    category: 'Comparison Charts',
    description:
      'Side-by-side bars comparing Electronics, Clothing, and Home and Garden revenue in each quarter of 2026, with a colour legend and alt text.',
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
    category: 'Comparison Charts',
    description:
      'The same three-series grouped bar chart as Grouped Bar Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
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
    id: 'horizontal-bar-chart',
    name: 'Horizontal Bar Chart',
    category: 'Comparison Charts',
    description:
      'Horizontal bars ranking full-year sales across six UK regions, with value labels. The orientation reads better when category names are long.',
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
    category: 'Comparison Charts',
    description:
      'The same chart as Horizontal Bar Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
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
    category: 'Comparison Charts',
    description:
      'Grouped horizontal bars comparing three product lines across four quarters of sales, with grid lines and a colour legend.',
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
    category: 'Comparison Charts',
    description:
      'The same chart as Horizontal Grouped Bar Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
    filename: 'horizontal-grouped-bar-chart-classes.pdf',
    generate: horizontalGroupedBarChartClasses,
    dotnetClass: 'HorizontalGroupedBarChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'horizontal-grouped-bar-chart',
    variantLabel: 'Class API',
  },

  // Recipes - Trend Charts
  {
    id: 'area-chart',
    name: 'Area Chart',
    category: 'Trend Charts',
    description:
      'A filled area under the line with configurable opacity, showing monthly sales performance through the year, with a legend and alt text.',
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
    category: 'Trend Charts',
    description:
      'The same chart as Area Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
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
    id: 'line-chart',
    name: 'Line Chart',
    category: 'Trend Charts',
    description:
      'A line chart of monthly revenue trends: connected data points with circular markers and value labels, a legend, and alt text describing the series.',
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
    category: 'Trend Charts',
    description:
      'The same monthly-revenue line chart as Line Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
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
    id: 'multi-series-line-chart',
    name: 'Multi-Series Line Chart',
    category: 'Trend Charts',
    description:
      'Two overlapping line series comparing this year’s monthly revenue with last year’s on a shared axis, with a legend and alt text.',
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
    category: 'Trend Charts',
    description:
      'The same chart as Multi-Series Line Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
    filename: 'multi-series-line-chart-classes.pdf',
    generate: multiSeriesLineChartClasses,
    dotnetClass: 'MultiSeriesLineChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'multi-series-line-chart',
    variantLabel: 'Class API',
  },

  // Recipes - Share & Ranking Charts
  {
    id: 'dot-plot-chart',
    name: 'Dot Plot Chart',
    category: 'Share & Ranking Charts',
    description:
      'Circular markers positioned along a value axis to compare the sales of eight products at a glance, with a legend and alt text for screen readers.',
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
    category: 'Share & Ranking Charts',
    description:
      'The same chart as Dot Plot Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
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
    id: 'horizontal-lollipop-chart',
    name: 'Horizontal Lollipop Chart',
    category: 'Share & Ranking Charts',
    description:
      'Horizontal stems with circular heads ranking year-to-date revenue for eight product lines: less ink than bars without losing clarity.',
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
    category: 'Share & Ranking Charts',
    description:
      'The same chart as Horizontal Lollipop Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
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
    id: 'lollipop-chart',
    name: 'Lollipop Chart',
    category: 'Share & Ranking Charts',
    description:
      'Stems with circular heads, a lighter alternative to bar charts, showing twelve months of revenue rising through 2026, with a legend and alt text.',
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
    category: 'Share & Ranking Charts',
    description:
      'The same chart as Lollipop Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
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
    id: 'pie-chart',
    name: 'Pie Chart',
    category: 'Share & Ranking Charts',
    description:
      'A donut chart of revenue by sales channel, with each channel’s share in the legend, the total in the centre, a summary table alongside, and alt text for screen readers.',
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
    category: 'Share & Ranking Charts',
    description:
      'The same chart as Pie Chart, built with the class API: construct each chart model and assign properties. The output is identical.',
    filename: 'pie-chart-classes.pdf',
    generate: pieChartClasses,
    dotnetClass: 'PieChartExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'pie-chart',
    variantLabel: 'Class API',
  },

  // Recipes - Security
  {
    id: 'encryption',
    name: 'Encryption',
    category: 'Security',
    description:
      'Three AES-256 encryption scenarios: a simple password, user and owner passwords with printing and copying allowed, and an owner-only lock that blocks printing.',
    filename: 'encryption.pdf',
    generate: encryption,
    pdfUa1: true,
    password: 'demo123',
    // .NET has three variants; Password is canonical
    dotnetClass: 'EncryptionExample',
    variantLabel: 'Options API',
  },
  {
    id: 'encryption-classes',
    name: 'Encryption (Class API)',
    category: 'Security',
    description:
      'The same AES-256 encrypted document as Encryption, built with the class API: construct settings/elements and assign properties (encryption uses the same preset builder). The output is identical.',
    filename: 'encryption-classes.pdf',
    generate: encryptionClasses,
    pdfUa1: true,
    password: 'demo123',
    dotnetClass: 'EncryptionExample',
    gallery: false,
    variantOf: 'encryption',
    variantLabel: 'Class API',
  },
  {
    id: 'watermarking',
    name: 'Watermarking',
    category: 'Security',
    description:
      'A semi-transparent diagonal DRAFT watermark behind the content of every page of a multi-section strategy proposal. The watermark is skipped by screen readers.',
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
      'The same DRAFT-watermarked draft document as Watermarking, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'watermarking-classes.pdf',
    generate: watermarkingClasses,
    dotnetClass: 'WatermarkDraftExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'watermarking',
    variantLabel: 'Class API',
  },
  {
    id: 'watermarking-confidential',
    name: 'Watermarking: Confidential',
    category: 'Security',
    description:
      'A CONFIDENTIAL variant of the diagonal watermark, tinted red and repeated behind every page of a multi-section quarterly financial report.',
    filename: 'watermarking-confidential.pdf',
    generate: watermarkingConfidential,
    dotnetClass: 'WatermarkConfidentialExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'watermarking-confidential-classes',
    name: 'Watermarking: Confidential (Class API)',
    category: 'Security',
    description:
      'The same red CONFIDENTIAL watermarked report as Watermarking: Confidential, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'watermarking-confidential-classes.pdf',
    generate: watermarkingConfidentialClasses,
    dotnetClass: 'WatermarkConfidentialExample',
    pdfUa1: true,
    gallery: false,
    variantOf: 'watermarking-confidential',
    variantLabel: 'Class API',
  },

  // Recipes - Compliance & Archival
  {
    id: 'document-diagnostics',
    name: 'Check the Generated Document',
    category: 'Compliance & Archival',
    description:
      'A generation-check report: the real warnings a draft build raised, shown as a table with severity labels, what the corrected build changed, and why diagnostics are not external validation.',
    filename: 'document-diagnostics.pdf',
    generate: documentDiagnostics,
    dotnetClass: 'DocumentDiagnosticsExample',
    guideSlug: 'document-diagnostics',
  },
  {
    id: 'pdf-compliance',
    name: 'Archival & Accessible PDF',
    category: 'Compliance & Archival',
    description:
      'A concise archival and accessible document: the PDF/A-2a and PDF/UA-1 settings it uses, what BonniePDF handles for you, and what the author must supply to keep the claim true.',
    filename: 'pdf-compliance.pdf',
    generate: pdfCompliance,
    dotnetClass: 'PdfComplianceExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'pdf-compliance-classes',
    name: 'Archival & Accessible PDF (Class API)',
    category: 'Compliance & Archival',
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
    id: 'attached-data',
    name: 'Report with Embedded Data',
    category: 'Compliance & Archival',
    description:
      'A PDF/A-3 report that carries its source CSV inside the file, so a reader can check the numbers without re-keying them. Built with the general-purpose attachment API.',
    filename: 'attached-data.pdf',
    generate: attachedData,
    dotnetClass: 'AttachedDataExample',
    pdfUa1: false,
    variantLabel: 'Options API',
  },
  {
    id: 'attached-data-classes',
    name: 'Report with Embedded Data (Class API)',
    category: 'Compliance & Archival',
    description:
      'The same PDF/A-3 report with embedded CSV as Report with Embedded Data, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'attached-data-classes.pdf',
    generate: attachedDataClasses,
    dotnetClass: 'AttachedDataExample',
    pdfUa1: false,
    gallery: false,
    variantOf: 'attached-data',
    variantLabel: 'Class API',
  },

  // Recipes - Server & Batch
  {
    id: 'batch-generation',
    guideSlug: 'server-batch',
    name: 'Batch Generation',
    category: 'Server & Batch',
    tier: 'recipe',
    description:
      'Generating 250 documents in one process. The output reports the timings of its own run and covers per-document lifecycle, disposal in the loop, and one-time setup.',
    filename: 'batch-generation.pdf',
    generate: batchGeneration,
    dotnetClass: 'BatchGenerationExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Technology'],
    documentType: 'report',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node'],
    dataDensity: 'scale',
  },
  {
    id: 'server-endpoint',
    guideSlug: 'server-batch',
    name: 'Server Endpoint',
    category: 'Server & Batch',
    tier: 'recipe',
    description:
      'Generating a PDF in an API handler: a receipt built from the request body, covering process-wide setup, the async path, disposal in a finally block, and content length.',
    filename: 'server-endpoint.pdf',
    generate: serverEndpoint,
    dotnetClass: 'ServerEndpointExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Technology'],
    documentType: 'receipt',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node'],
    dataDensity: 'low',
  },

  // Industry Templates - Billing & Payments
  {
    id: 'credit-note',
    name: 'Credit Note',
    category: 'Billing & Payments',
    tier: 'examples',
    region: 'UK',
    description:
      'A credit note: which invoice lines were wrong and why, how the VAT is reversed, and whether money is refunded or offset, in the layout of the invoice it corrects.',
    filename: 'credit-note.pdf',
    generate: creditNote,
    dotnetClass: 'CreditNoteExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Finance', 'General'],
    documentType: 'invoice',
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'low',
    variantLabel: 'Options API',
  },
  {
    id: 'credit-note-classes',
    name: 'Credit Note (Class API)',
    category: 'Billing & Payments',
    tier: 'examples',
    region: 'UK',
    description:
      'The same credit note as Credit note, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'credit-note-classes.pdf',
    generate: creditNoteClasses,
    dotnetClass: 'CreditNoteExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'credit-note',
    variantLabel: 'Class API',
  },
  {
    id: 'customer-account-statement',
    name: 'Customer Account Statement',
    category: 'Billing & Payments',
    tier: 'examples',
    region: 'UK',
    description:
      'A customer statement: opening balance, every invoice, payment, and credit, a running balance calculated from the rows, ageing, and a remittance slip.',
    filename: 'customer-account-statement.pdf',
    generate: customerAccountStatement,
    dotnetClass: 'CustomerAccountStatementExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Finance', 'General'],
    documentType: 'statement',
    capabilities: ['longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'high',
    variantLabel: 'Options API',
  },
  {
    id: 'customer-account-statement-classes',
    name: 'Customer Account Statement (Class API)',
    category: 'Billing & Payments',
    tier: 'examples',
    region: 'UK',
    description:
      'The same customer account statement as Customer account statement, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'customer-account-statement-classes.pdf',
    generate: customerAccountStatementClasses,
    dotnetClass: 'CustomerAccountStatementExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'customer-account-statement',
    variantLabel: 'Class API',
  },
  {
    id: 'dunning-letter',
    name: 'Dunning Letter',
    category: 'Billing & Payments',
    tier: 'examples',
    region: 'UK',
    description:
      'A collections letter with a schedule of overdue items. Days overdue come from the due dates, and one escalation stage sets the tone and deadline.',
    filename: 'dunning-letter.pdf',
    generate: dunningLetter,
    dotnetClass: 'DunningLetterExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Finance', 'General'],
    documentType: 'letter',
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'low',
    variantLabel: 'Options API',
  },
  {
    id: 'dunning-letter-classes',
    name: 'Dunning Letter (Class API)',
    category: 'Billing & Payments',
    tier: 'examples',
    region: 'UK',
    description:
      'The same dunning letter as Dunning letter, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'dunning-letter-classes.pdf',
    generate: dunningLetterClasses,
    dotnetClass: 'DunningLetterExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'dunning-letter',
    variantLabel: 'Class API',
  },
  {
    id: 'remittance-advice',
    name: 'Remittance Advice',
    category: 'Billing & Payments',
    tier: 'examples',
    region: 'UK',
    description:
      'A remittance advice: which invoices a payment settles, which credits were applied, and a reconciliation to the amount paid, stating whether it reconciles.',
    filename: 'remittance-advice.pdf',
    generate: remittanceAdvice,
    dotnetClass: 'RemittanceAdviceExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Finance', 'General'],
    documentType: 'statement',
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'low',
    variantLabel: 'Options API',
  },
  {
    id: 'remittance-advice-classes',
    name: 'Remittance Advice (Class API)',
    category: 'Billing & Payments',
    tier: 'examples',
    region: 'UK',
    description:
      'The same remittance advice as Remittance advice, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'remittance-advice-classes.pdf',
    generate: remittanceAdviceClasses,
    dotnetClass: 'RemittanceAdviceExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'remittance-advice',
    variantLabel: 'Class API',
  },
  {
    id: 'utility-bill',
    name: 'Utility Bill',
    category: 'Billing & Payments',
    tier: 'examples',
    region: 'UK',
    description:
      'A domestic energy bill calculated from meter readings: the amount due, a tariff breakdown, a twelve-month usage chart, and a detachable payment slip.',
    filename: 'utility-bill.pdf',
    generate: utilityBill,
    dotnetClass: 'UtilityBillExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Utilities', 'General'],
    documentType: 'bill',
    capabilities: ['barcodes', 'charts', 'longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'high',
    variantLabel: 'Options API',
  },
  {
    id: 'utility-bill-classes',
    name: 'Utility Bill (Class API)',
    category: 'Billing & Payments',
    tier: 'examples',
    region: 'UK',
    description:
      'The same energy bill as Utility Bill, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'utility-bill-classes.pdf',
    generate: utilityBillClasses,
    dotnetClass: 'UtilityBillExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'utility-bill',
    variantLabel: 'Class API',
  },

  // Industry Templates - Compliance & Audit
  {
    id: 'board-minutes',
    name: 'Board Minutes',
    category: 'Compliance & Audit',
    tier: 'examples',
    region: 'UK',
    description:
      'The minutes of a board meeting, built to be kept for years: attendance and quorum, numbered agenda items with their resolutions, a vote table whose outcomes are worked out from the votes, an action register, and sign-off by the Chair and the Secretary.',
    filename: 'board-minutes.pdf',
    generate: boardMinutes,
    dotnetClass: 'BoardMinutesExample',
    thumbnails: false,
    pdfUa1: false,
    industries: ['Legal', 'Finance'],
    documentType: 'report',
    capabilities: ['longTables'],
    compliance: ['pdf/a-4'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },

  {
    id: 'compliance-findings-register',
    name: 'Compliance Findings Register',
    category: 'Compliance & Audit',
    tier: 'examples',
    description:
      'A GRC audit findings register: 18 severity-coloured finding cards, each with a badge, heading, and remediation steps, paginating cleanly across pages.',
    filename: 'compliance-findings-register.pdf',
    generate: complianceFindingsRegister,
    dotnetClass: 'ComplianceFindingsRegisterExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Compliance', 'Legal'],
    documentType: 'report',
    capabilities: ['longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'high',
    variantLabel: 'Options API',
  },
  {
    id: 'compliance-findings-register-classes',
    name: 'Compliance Findings Register (Class API)',
    category: 'Compliance & Audit',
    tier: 'examples',
    description:
      'A GRC / audit findings register: 18 severity-coloured finding cards (badge + heading + remediation) paginating across pages.',
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
    id: 'audit-report',
    name: 'GDPR ISO 27001 Audit Report',
    category: 'Compliance & Audit',
    tier: 'examples',
    region: 'EU/UK',
    description:
      'A GDPR and ISO/IEC 27001 audit: a CONFIDENTIAL running header, KPI tiles, a control-status donut, a severity chart, and a findings register across pages.',
    filename: 'audit-report.pdf',
    generate: auditReport,
    dotnetClass: 'AuditReportExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Compliance', 'Legal'],
    documentType: 'report',
    capabilities: ['charts', 'longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'high',
    variantLabel: 'Options API',
  },
  {
    id: 'audit-report-classes',
    name: 'GDPR ISO 27001 Audit Report (Class API)',
    category: 'Compliance & Audit',
    tier: 'examples',
    region: 'EU/UK',
    description:
      'An enterprise data-protection and security audit (EU + UK GDPR and ISO/IEC 27001:2022): running CONFIDENTIAL header/footer, KPI tiles, a control-status donut, a findings-by-severity column chart, and a findings register that flows across pages with a repeating header.',
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
    id: 'statutory-compliance-report',
    name: 'Statutory Compliance Report',
    category: 'Compliance & Audit',
    tier: 'examples',
    region: 'UK',
    description:
      'A two-page quarterly compliance report for a managed site: KPI tiles, an inspection-status donut, a compliance-by-category bar chart, colour-coded key findings, an inspection register, a priority action plan, and sign-off.',
    filename: 'statutory-compliance-report.pdf',
    generate: statutoryComplianceReport,
    dotnetClass: 'StatutoryComplianceReportExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Facilities', 'Compliance'],
    documentType: 'report',
    capabilities: ['charts', 'longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'high',
  },

  // Industry Templates - Education & Public Sector
  {
    id: 'course-certificate',
    name: 'Course Certificate',
    category: 'Education & Public Sector',
    tier: 'examples',
    description:
      'A landscape course certificate: a triple-ruled frame behind the wording, a vector monogram crest, a gold foil-style seal between the signatures, centred serif type, and a verification code. Decoration stays out of reading order.',
    filename: 'course-certificate.pdf',
    generate: courseCertificate,
    dotnetClass: 'CourseCertificateExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Education'],
    documentType: 'certificate',
    capabilities: ['qr'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'low',
    variantLabel: 'Options API',
  },
  {
    id: 'course-certificate-classes',
    name: 'Course Certificate (Class API)',
    category: 'Education & Public Sector',
    tier: 'examples',
    description:
      'The same certificate as Course Certificate, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'course-certificate-classes.pdf',
    generate: courseCertificateClasses,
    dotnetClass: 'CourseCertificateExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'course-certificate',
    variantLabel: 'Class API',
  },
  {
    id: 'grant-award-letter',
    name: 'Grant Award Letter',
    category: 'Education & Public Sector',
    tier: 'examples',
    region: 'UK',
    description:
      'A fictional grant funding decision: a headline “Awarded” block with key dates, an award-breakdown table, next steps, and an alternative-formats notice.',
    filename: 'grant-award-letter.pdf',
    generate: grantAwardLetter,
    dotnetClass: 'GrantAwardLetterExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Government'],
    documentType: 'letter',
    capabilities: ['longTables', 'bookmarks', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'grant-award-letter-classes',
    name: 'Grant Award Letter (Class API)',
    category: 'Education & Public Sector',
    tier: 'examples',
    region: 'UK',
    description:
      'The same accessible grant award letter as Grant Award Letter, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'grant-award-letter-classes.pdf',
    generate: grantAwardLetterClasses,
    dotnetClass: 'GrantAwardLetterExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'grant-award-letter',
    variantLabel: 'Class API',
  },
  {
    id: 'public-library-membership-letter',
    name: 'Public Library Membership',
    category: 'Education & Public Sector',
    tier: 'examples',
    region: 'UK',
    description:
      "A fictional UK library membership letter: a teal library masthead, the member's library card with a scannable number, borrowing limits, branch opening hours, and an alternative-formats notice.",
    filename: 'public-library-membership-letter.pdf',
    generate: publicLibraryMembershipLetter,
    dotnetClass: 'PublicLibraryMembershipLetterExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Government', 'Education'],
    documentType: 'letter',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'low',
    variantLabel: 'Options API',
  },
  {
    id: 'public-library-membership-letter-classes',
    name: 'Public Library Membership (Class API)',
    category: 'Education & Public Sector',
    tier: 'examples',
    region: 'UK',
    description:
      'The same accessible public-library membership letter as Public Library Membership, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'uk-degree-transcript',
    name: 'UK Degree Transcript',
    category: 'Education & Public Sector',
    tier: 'examples',
    region: 'UK',
    description:
      'A UK degree transcript: institution header, student details, a 2:1 honours banner, a module register by FHEQ level, how the award was calculated against the honours bands, and a QR verification link.',
    filename: 'uk-degree-transcript.pdf',
    generate: ukDegreeTranscript,
    dotnetClass: 'UkDegreeTranscriptExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Education'],
    documentType: 'transcript',
    capabilities: ['qr', 'longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'uk-degree-transcript-classes',
    name: 'UK Degree Transcript (Class API)',
    category: 'Education & Public Sector',
    tier: 'examples',
    region: 'UK',
    description:
      'An official UK university degree transcript: institution header, student details, a UK honours classification banner (2:1), a module register grouped by FHEQ level with credits and marks that flows across pages, and a QR verification link.',
    filename: 'uk-degree-transcript-classes.pdf',
    generate: ukDegreeTranscriptClasses,
    dotnetClass: 'UkDegreeTranscriptExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'uk-degree-transcript',
    variantLabel: 'Class API',
  },

  // Industry Templates - Field Service & Property
  {
    id: 'job-sheet',
    name: 'Field Service Job Sheet',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'A field-service job sheet: the reported fault, work carried out, labour and parts, defects left unfixed, and a customer signature block kept whole on one page.',
    filename: 'job-sheet.pdf',
    generate: jobSheet,
    dotnetClass: 'JobSheetExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['FieldService', 'Facilities', 'Construction'],
    documentType: 'worksheet',
    capabilities: ['longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'job-sheet-classes',
    name: 'Job Sheet (Class API)',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'The same job sheet as Job sheet, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'job-sheet-classes.pdf',
    generate: jobSheetClasses,
    dotnetClass: 'JobSheetExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'job-sheet',
    variantLabel: 'Class API',
  },
  {
    id: 'inventory-schedule-of-condition',
    name: 'Inventory and Schedule of Condition',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'A tenancy check-in inventory: a room-by-room register grading condition and cleanliness, meter readings, keys issued, and declarations from both parties.',
    filename: 'inventory-schedule-of-condition.pdf',
    generate: inventoryScheduleOfCondition,
    dotnetClass: 'InventoryScheduleOfConditionExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Property', 'Facilities'],
    documentType: 'schedule',
    capabilities: ['longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser'],
    dataDensity: 'high',
    variantLabel: 'Options API',
  },
  {
    id: 'inventory-schedule-of-condition-classes',
    name: 'Inventory and Schedule of Condition (Class API)',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'The same inventory and schedule of condition as Inventory and schedule of condition, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'inventory-schedule-of-condition-classes.pdf',
    generate: inventoryScheduleOfConditionClasses,
    dotnetClass: 'InventoryScheduleOfConditionExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'inventory-schedule-of-condition',
    variantLabel: 'Class API',
  },
  {
    id: 'permit-to-work',
    name: 'Permit to Work',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'A hot works permit: the work authorised, hazards and controls, the atmospheric test, a precautions checklist, and signatures for issue, acceptance, and cancellation.',
    filename: 'permit-to-work.pdf',
    generate: permitToWork,
    dotnetClass: 'PermitToWorkExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Construction', 'Facilities', 'FieldService'],
    documentType: 'permit',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'permit-to-work-classes',
    name: 'Permit to Work (Class API)',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'The same permit to work as Permit to work, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'permit-to-work-classes.pdf',
    generate: permitToWorkClasses,
    dotnetClass: 'PermitToWorkExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'permit-to-work',
    variantLabel: 'Class API',
  },
  {
    id: 'property-particulars',
    name: 'Property Particulars',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'Estate agency particulars: guide price, key features, a metric and imperial room schedule, floor plans drawn as SVG from the room data, tenure, and an energy-rating graphic drawn from layout primitives.',
    filename: 'property-particulars.pdf',
    generate: propertyParticulars,
    dotnetClass: 'PropertyParticularsExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Property'],
    documentType: 'catalog',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'property-particulars-classes',
    name: 'Property Particulars (Class API)',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'The same property particulars as Property particulars, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'property-particulars-classes.pdf',
    generate: propertyParticularsClasses,
    dotnetClass: 'PropertyParticularsExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'property-particulars',
    variantLabel: 'Class API',
  },
  {
    id: 'reactive-work-order',
    name: 'Reactive Work Order',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'An emergency facilities work order on one page: a priority banner with SLA times, a barcode and QR code for the job number, site and job cards, work carried out, a parts table, a cost summary, and engineer and client sign-off.',
    filename: 'reactive-work-order.pdf',
    generate: reactiveWorkOrder,
    dotnetClass: 'ReactiveWorkOrderExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Facilities', 'FieldService'],
    documentType: 'worksheet',
    capabilities: ['barcodes', 'qr'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
  },
  {
    id: 'site-inspection-report',
    name: 'Site Inspection Report',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'A site inspection snagging register: each defect with location, trade, severity, owner, target date, and evidence, in a long table whose header repeats.',
    filename: 'site-inspection-report.pdf',
    generate: siteInspectionReport,
    dotnetClass: 'SiteInspectionReportExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Construction', 'Property', 'Facilities'],
    documentType: 'report',
    capabilities: ['longTables', 'charts', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser'],
    dataDensity: 'high',
    variantLabel: 'Options API',
  },
  {
    id: 'site-inspection-report-classes',
    name: 'Site Inspection Report (Class API)',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'The same site inspection report as Site inspection report, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'site-inspection-report-classes.pdf',
    generate: siteInspectionReportClasses,
    dotnetClass: 'SiteInspectionReportExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'site-inspection-report',
    variantLabel: 'Class API',
  },
  {
    id: 'tenancy-agreement',
    name: 'Tenancy Agreement',
    category: 'Field Service & Property',
    tier: 'examples',
    region: 'UK',
    description:
      'An assured shorthold tenancy agreement: key terms up front, numbered clauses, a deposit calculated from the rent, a twelve-month rent schedule, and signature blocks for landlord, tenants, and witnesses.',
    filename: 'tenancy-agreement.pdf',
    generate: tenancyAgreement,
    dotnetClass: 'TenancyAgreementExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Property', 'Legal'],
    documentType: 'contract',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },

  // Industry Templates - Finance & Reporting
  {
    id: 'annual-report',
    name: 'Annual Report: Classic',
    category: 'Finance & Reporting',
    tier: 'examples',
    description:
      'An A4 annual-report template: a full-bleed navy cover with a hero photograph, then inner pages framed by blue header and footer bands with the logo, generation time, and page numbers.',
    filename: 'annual-report.pdf',
    generate: annualReport,
    requiredAssets: ['images/sean-pollock-PhYq704ffdA-unsplash.jpg'],
    dotnetClass: 'AnnualReportExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Finance', 'Media'],
    documentType: 'report',
    capabilities: ['images', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node'],
    dataDensity: 'high',
    series: 'annual-report',
    variantLabel: 'Options API',
  },
  {
    id: 'annual-report-classes',
    name: 'Annual Report: Classic (Class API)',
    category: 'Finance & Reporting',
    tier: 'examples',
    description:
      'A4 portrait annual-report template: a full-bleed navy front cover with a hero photograph, then inner pages whose page-background slot paints blue header/footer bands carrying the BonniePDF mark, generation time, and page numbers around the flowing report content.',
    filename: 'annual-report-classes.pdf',
    generate: annualReportClasses,
    requiredAssets: ['images/sean-pollock-PhYq704ffdA-unsplash.jpg'],
    dotnetClass: 'AnnualReportExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'annual-report',
    variantLabel: 'Class API',
  },
  {
    id: 'annual-report-geometric-cover',
    name: 'Annual Report: Geometric',
    category: 'Finance & Reporting',
    tier: 'examples',
    description:
      'A two-page annual report. Page 1 is a light, modern cover built from vector primitives (radial sun, translucent rotated polygons and a star via affine transforms, a photo cropped to a circular badge ringed in gold). Page 2 is the “inside the report” spread: a KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-geometric-cover.pdf',
    generate: annualReportGeometricCover,
    requiredAssets: ['images/sean-pollock-PhYq704ffdA-unsplash.jpg'],
    dotnetClass: 'AnnualReportGeometricCoverExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Finance', 'Media'],
    documentType: 'report',
    capabilities: ['images', 'numbering'],
    compliance: ['pdf/ua-1'],
    runtime: ['browser', 'node'],
    dataDensity: 'high',
    series: 'annual-report',
    variantLabel: 'Options API',
  },
  {
    id: 'annual-report-geometric-cover-classes',
    name: 'Annual Report: Geometric (Class API)',
    category: 'Finance & Reporting',
    tier: 'examples',
    description:
      'A two-page annual report. Page 1 is a light, modern cover built from vector primitives (radial sun, translucent rotated polygons and a star via affine transforms, a photo cropped to a circular badge ringed in gold). Page 2 is the “inside the report” spread: a KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-geometric-cover-classes.pdf',
    generate: annualReportGeometricCoverClasses,
    requiredAssets: ['images/sean-pollock-PhYq704ffdA-unsplash.jpg'],
    dotnetClass: 'AnnualReportGeometricCoverExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'annual-report-geometric-cover',
    variantLabel: 'Class API',
  },
  {
    id: 'annual-report-gradient-cover',
    name: 'Annual Report: Gradient',
    category: 'Finance & Reporting',
    tier: 'examples',
    description:
      'A two-page annual report. Page 1 is a full-bleed cover drawn entirely on the vector surface (indigo-to-fuchsia gradient, radial glow, diagonal accent rules, rotated brand mark, canvas-drawn type); page 2 is the “inside the report” spread: a KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-gradient-cover.pdf',
    generate: annualReportGradientCover,
    dotnetClass: 'AnnualReportGradientCoverExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Finance', 'Media'],
    documentType: 'report',
    capabilities: ['images', 'numbering'],
    compliance: ['pdf/ua-1'],
    runtime: ['browser', 'node'],
    dataDensity: 'high',
    series: 'annual-report',
    variantLabel: 'Options API',
  },
  {
    id: 'annual-report-gradient-cover-classes',
    name: 'Annual Report: Gradient (Class API)',
    category: 'Finance & Reporting',
    tier: 'examples',
    description:
      'A two-page annual report. Page 1 is a full-bleed cover drawn entirely on the vector surface (indigo-to-fuchsia gradient, radial glow, diagonal accent rules, rotated brand mark, canvas-drawn type); page 2 is the “inside the report” spread: a KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-gradient-cover-classes.pdf',
    generate: annualReportGradientCoverClasses,
    dotnetClass: 'AnnualReportGradientCoverExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'annual-report-gradient-cover',
    variantLabel: 'Class API',
  },
  {
    id: 'annual-report-masked-cover',
    name: 'Annual Report: Masked',
    category: 'Finance & Reporting',
    tier: 'examples',
    description:
      'A two-page annual report. Page 1 is the classic photographic cover: a full-width hero image clipped to an angled mask cutting into a green title band with a gold seam. Page 2 is the “inside the report” spread: a KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-masked-cover.pdf',
    generate: annualReportMaskedCover,
    requiredAssets: ['images/sean-pollock-PhYq704ffdA-unsplash.jpg'],
    dotnetClass: 'AnnualReportMaskedCoverExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Finance', 'Media'],
    documentType: 'report',
    capabilities: ['images', 'numbering'],
    compliance: ['pdf/ua-1'],
    runtime: ['browser', 'node'],
    dataDensity: 'high',
    series: 'annual-report',
    variantLabel: 'Options API',
  },
  {
    id: 'annual-report-masked-cover-classes',
    name: 'Annual Report: Masked (Class API)',
    category: 'Finance & Reporting',
    tier: 'examples',
    description:
      'A two-page annual report. Page 1 is the classic photographic cover: a full-width hero image clipped to an angled mask cutting into a green title band with a gold seam. Page 2 is the “inside the report” spread: a KPI band, a quarterly-revenue column chart, a revenue-by-segment donut, and a financial-summary table.',
    filename: 'annual-report-masked-cover-classes.pdf',
    generate: annualReportMaskedCoverClasses,
    requiredAssets: ['images/sean-pollock-PhYq704ffdA-unsplash.jpg'],
    dotnetClass: 'AnnualReportMaskedCoverExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'annual-report-masked-cover',
    variantLabel: 'Class API',
  },
  {
    id: 'bank-statement',
    name: 'Bank Statement',
    category: 'Finance & Reporting',
    tier: 'examples',
    region: 'UK',
    description:
      'A current-account statement: opening and closing balances, money in and out, spending by category, and a 34-row transaction list with a running balance whose header repeats across pages.',
    filename: 'bank-statement.pdf',
    generate: bankStatement,
    dotnetClass: 'BankStatementExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Banking', 'Finance'],
    documentType: 'statement',
    capabilities: ['longTables', 'charts'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'high',
    variantLabel: 'Options API',
  },
  {
    id: 'financial-dashboard',
    name: 'Financial Dashboard',
    category: 'Finance & Reporting',
    tier: 'examples',
    description:
      'A landscape annual review with four KPIs, rounded gradient revenue bars, a revenue-mix doughnut and a product table, in a navy, blue and teal palette.',
    filename: 'financial-dashboard.pdf',
    generate: financialDashboard,
    dotnetClass: 'FinancialDashboardExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Finance'],
    documentType: 'dashboard',
    capabilities: ['charts', 'longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'high',
    variantLabel: 'Options API',
  },
  {
    id: 'financial-dashboard-classes',
    name: 'Financial Dashboard (Class API)',
    category: 'Finance & Reporting',
    tier: 'examples',
    description:
      'A landscape annual review with four KPIs, rounded gradient revenue bars, a revenue-mix doughnut and a product table, in a navy, blue and teal palette.',
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
    id: 'financial-statement',
    name: 'IFRS Financial Statements',
    category: 'Finance & Reporting',
    tier: 'examples',
    region: 'UK/EU',
    description:
      'IFRS-style statutory accounts: income and financial-position statements with prior-year comparatives, note references, bracketed negatives, and total rules.',
    filename: 'financial-statement.pdf',
    generate: financialStatement,
    dotnetClass: 'FinancialStatementExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Finance', 'Banking'],
    documentType: 'statement',
    capabilities: ['numbering', 'longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'high',
    variantLabel: 'Options API',
  },
  {
    id: 'financial-statement-classes',
    name: 'IFRS Financial Statements (Class API)',
    category: 'Finance & Reporting',
    tier: 'examples',
    region: 'UK/EU',
    description:
      'A UK/EU statutory financial statement in the IFRS / Companies House style: a Statement of Comprehensive Income and a Statement of Financial Position with prior-year comparatives, note references, accounting-style bracketed negatives, and subtotal/total rules. Amounts in £000.',
    filename: 'financial-statement-classes.pdf',
    generate: financialStatementClasses,
    dotnetClass: 'FinancialStatementExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'financial-statement',
    variantLabel: 'Class API',
  },

  // Industry Templates - Healthcare
  {
    id: 'discharge-summary',
    name: 'Hospital Discharge Summary',
    category: 'Healthcare',
    tier: 'examples',
    region: 'UK',
    description:
      'A hospital discharge summary: diagnoses, key investigations with reference ranges, a medication reconciliation flagging every change, and actions for the GP.',
    filename: 'discharge-summary.pdf',
    generate: dischargeSummary,
    dotnetClass: 'DischargeSummaryExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Healthcare'],
    documentType: 'report',
    capabilities: ['longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'discharge-summary-classes',
    name: 'Discharge Summary (Class API)',
    category: 'Healthcare',
    tier: 'examples',
    region: 'UK',
    description:
      'The same discharge summary as Discharge summary, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'discharge-summary-classes.pdf',
    generate: dischargeSummaryClasses,
    dotnetClass: 'DischargeSummaryExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'discharge-summary',
    variantLabel: 'Class API',
  },
  {
    id: 'outpatient-appointment-letter',
    name: 'Outpatient Appointment',
    category: 'Healthcare',
    tier: 'examples',
    region: 'UK',
    description:
      'A fictional outpatient appointment letter: clear appointment details, plain-language actions, an accessibility contact, and prominent sample-data notices.',
    filename: 'outpatient-appointment-letter.pdf',
    generate: outpatientAppointmentLetter,
    dotnetClass: 'OutpatientAppointmentLetterExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Healthcare'],
    documentType: 'letter',
    capabilities: ['numbering'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'low',
    variantLabel: 'Options API',
  },
  {
    id: 'outpatient-appointment-letter-classes',
    name: 'Outpatient Appointment (Class API)',
    category: 'Healthcare',
    tier: 'examples',
    region: 'UK',
    description:
      'An accessible fictional Outpatient Appointment with clear appointment details, plain-language actions, an accessibility contact, and prominent sample-data disclaimers. Inspired by UK public-health information-design principles without copying any specific provider’s branding.',
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
    id: 'lab-report',
    name: 'Pathology Lab Report',
    category: 'Healthcare',
    tier: 'examples',
    region: 'UK',
    description:
      'A fictional pathology report: patient details, specimen times, FBC and U&E panels with reference ranges and High/Low flags, and trend charts for the flagged kidney results, generated client-side so data never leaves the browser.',
    filename: 'lab-report.pdf',
    generate: labReport,
    dotnetClass: 'LabReportExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Healthcare'],
    documentType: 'report',
    capabilities: ['longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'lab-report-classes',
    name: 'Pathology Lab Report (Class API)',
    category: 'Healthcare',
    tier: 'examples',
    region: 'UK',
    description:
      'A fictional UK/EU pathology laboratory report: patient demographics, specimen timestamps, grouped result panels (FBC, U&E) with units, reference ranges and High/Low flags, a clinical interpretation, and an authorising clinician. It is generated entirely client-side, so patient data never leaves the browser.',
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
    id: 'patient-summary',
    name: 'Patient Summary',
    category: 'Healthcare',
    tier: 'examples',
    description:
      'An A4 patient-summary sheet built from rounded cards, each clipping a full-bleed coloured header band to its outline: a teal patient card, an indigo vitals grid, and a rose allergies panel.',
    filename: 'patient-summary.pdf',
    generate: patientSummary,
    dotnetClass: 'PatientSummaryExample',
    thumbnails: false,
    pdfUa1: false,
    industries: ['Healthcare'],
    documentType: 'report',
    capabilities: ['longTables'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'patient-summary-classes',
    name: 'Patient Summary (Class API)',
    category: 'Healthcare',
    tier: 'examples',
    description:
      'A4 portrait healthcare patient-summary sheet built from rounded-corner cards. Each card clips a full-bleed coloured header band to its rounded outline: a teal patient card, an indigo vitals grid, and a rose allergies panel.',
    filename: 'patient-summary-classes.pdf',
    generate: patientSummaryClasses,
    dotnetClass: 'PatientSummaryExample',
    thumbnails: false,
    pdfUa1: false,
    gallery: false,
    variantOf: 'patient-summary',
    variantLabel: 'Class API',
  },

  // Industry Templates - Invoices
  {
    id: 'business-invoice',
    series: 'business-invoice',
    name: 'Business Invoice',
    category: 'Invoices',
    tier: 'examples',
    description:
      'A US business invoice with company branding, customer addresses, a line-items table, an early-payment discount, and bank and online payment details.',
    filename: 'business-invoice.pdf',
    generate: businessInvoice,
    dotnetClass: 'BusinessInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['General', 'Finance'],
    documentType: 'invoice',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'business-invoice-classes',
    name: 'Business Invoice (Class API)',
    category: 'Invoices',
    tier: 'examples',
    description:
      'The same branded invoice as Business Invoice, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'factur-x-invoice',
    name: 'EU E-Invoice (Factur-X / ZUGFeRD, EN 16931)',
    category: 'Invoices',
    tier: 'examples',
    region: 'EU',
    description:
      'An EN 16931 / Factur-X e-invoice: a PDF/A-3 invoice carrying its machine-readable CII XML, with printed totals that match it exactly. Checked in CI by veraPDF and Mustang.',
    filename: 'factur-x_invoice.pdf',
    generate: facturXInvoice,
    requiredAssets: ['factur-x/en16931-invoice.xml'],
    dotnetClass: 'FacturXInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['General', 'Finance', 'Compliance'],
    documentType: 'invoice',
    capabilities: ['attachments', 'longTables'],
    compliance: ['pdf/a-3b', 'pdf/ua-1'],
    runtime: ['browser', 'node'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'factur-x-invoice-classes',
    name: 'EU E-Invoice (Factur-X / ZUGFeRD, EN 16931) (Class API)',
    category: 'Invoices',
    tier: 'examples',
    region: 'EU',
    description:
      'The same EU Factur-X e-invoice as EU E-Invoice, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'factur-x_invoice-classes.pdf',
    generate: facturXInvoiceClasses,
    requiredAssets: ['factur-x/en16931-invoice.xml'],
    dotnetClass: 'FacturXInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'factur-x-invoice',
    variantLabel: 'Class API',
  },
  {
    id: 'india-gst-invoice',
    name: 'India GST E-Invoice',
    category: 'Invoices',
    tier: 'examples',
    region: 'India',
    description:
      'An India GST e-invoice: GSTIN for both parties, HSN/SAC codes, a CGST + SGST split, IRN and acknowledgement details, and a signed QR in INR.',
    filename: 'india-gst-invoice.pdf',
    generate: indiaGstInvoice,
    dotnetClass: 'IndiaGstInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['General', 'Finance'],
    documentType: 'invoice',
    capabilities: ['qr', 'longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'india-gst-invoice-classes',
    name: 'India GST E-Invoice (Class API)',
    category: 'Invoices',
    tier: 'examples',
    region: 'India',
    description:
      'The same India GST e-invoice as India GST E-Invoice, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'large-order-invoice',
    name: 'Business Invoice: Large Order',
    category: 'Invoices',
    description:
      'A 72-line, three-page invoice: a styled header row repeated on every page, the net subtotal carried forward at each page break, line discounts and mixed VAT rates, and a VAT summary and total due kept together on the last page.',
    filename: 'large-order-invoice.pdf',
    generate: largeOrderInvoice,
    dotnetClass: 'LargeOrderInvoiceExample',
    tier: 'examples',
    series: 'business-invoice',
    pdfUa1: true,
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    capabilities: ['longTables'],
  },
  {
    id: 'saas-invoice',
    name: 'SaaS Invoice',
    category: 'Invoices',
    tier: 'examples',
    description:
      'An accessible subscription invoice for a Pro plan: billing period and status, per-seat and storage line items, a proration line, VAT, a prominent total and a QR payment code, in a clean UK layout.',
    filename: 'saas-invoice.pdf',
    generate: saasInvoice,
    dotnetClass: 'SaasInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Technology', 'Finance'],
    documentType: 'invoice',
    capabilities: ['qr', 'longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'saas-invoice-classes',
    name: 'SaaS Invoice (Class API)',
    category: 'Invoices',
    tier: 'examples',
    description:
      'The same accessible subscription invoice as SaaS Invoice, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'uk-vat-invoice',
    name: 'UK VAT Invoice',
    category: 'Invoices',
    tier: 'examples',
    region: 'UK',
    description:
      'An HMRC-style VAT invoice: supplier VAT number, tax point, standard, reduced, and zero-rated lines, and a per-rate VAT summary (net, VAT, gross) in GBP.',
    filename: 'uk-vat-invoice.pdf',
    generate: ukVatInvoice,
    dotnetClass: 'UkVatInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['General', 'Finance'],
    documentType: 'invoice',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'uk-vat-invoice-classes',
    name: 'UK VAT Invoice (Class API)',
    category: 'Invoices',
    tier: 'examples',
    region: 'UK',
    description:
      'The same UK VAT invoice as UK VAT Invoice, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'us-sales-invoice',
    name: 'US Sales-Tax Invoice',
    category: 'Invoices',
    tier: 'examples',
    region: 'US',
    description:
      'A US commercial invoice: a destination-based state and county sales-tax breakdown, a purchase-order reference, USD amounts, and ACH/check remittance.',
    filename: 'us-sales-invoice.pdf',
    generate: usSalesInvoice,
    dotnetClass: 'UsSalesInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['General', 'Finance'],
    documentType: 'invoice',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'us-sales-invoice-classes',
    name: 'US Sales-Tax Invoice (Class API)',
    category: 'Invoices',
    tier: 'examples',
    region: 'US',
    description:
      'The same US sales-tax invoice as US Sales-Tax Invoice, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'us-sales-invoice-classes.pdf',
    generate: usSalesInvoiceClasses,
    dotnetClass: 'UsSalesInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'us-sales-invoice',
    variantLabel: 'Class API',
  },

  // Industry Templates - Legal & Insurance
  {
    id: 'bill-of-costs',
    name: 'Bill of Costs',
    category: 'Legal & Insurance',
    tier: 'examples',
    region: 'UK',
    description:
      'A legal bill of costs: time by phase and fee-earner grade, disbursements with their VAT treatment, and a summary calculated from the time entries.',
    filename: 'bill-of-costs.pdf',
    generate: billOfCosts,
    dotnetClass: 'BillOfCostsExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Legal', 'Finance'],
    documentType: 'statement',
    capabilities: ['longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser'],
    dataDensity: 'high',
    variantLabel: 'Options API',
  },
  {
    id: 'bill-of-costs-classes',
    name: 'Bill of Costs (Class API)',
    category: 'Legal & Insurance',
    tier: 'examples',
    region: 'UK',
    description:
      'The same bill of costs as Bill of costs, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'bill-of-costs-classes.pdf',
    generate: billOfCostsClasses,
    dotnetClass: 'BillOfCostsExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'bill-of-costs',
    variantLabel: 'Class API',
  },
  {
    id: 'exhibit-bundle-index',
    name: 'Exhibit Bundle Index',
    category: 'Legal & Insurance',
    tier: 'examples',
    region: 'UK',
    description:
      'The generated parts of a court bundle: a cover sheet, a hyperlinked index with page references resolved after layout, and section separators with continuous numbering.',
    filename: 'exhibit-bundle-index.pdf',
    generate: exhibitBundleIndex,
    dotnetClass: 'ExhibitBundleIndexExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Legal'],
    documentType: 'report',
    capabilities: ['crossReferences', 'numbering', 'longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'exhibit-bundle-index-classes',
    name: 'Exhibit Bundle Index (Class API)',
    category: 'Legal & Insurance',
    tier: 'examples',
    region: 'UK',
    description:
      'The same exhibit bundle index as Exhibit bundle index, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'exhibit-bundle-index-classes.pdf',
    generate: exhibitBundleIndexClasses,
    dotnetClass: 'ExhibitBundleIndexExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'exhibit-bundle-index',
    variantLabel: 'Class API',
  },
  {
    id: 'policy-schedule',
    name: 'Policy Schedule',
    category: 'Legal & Insurance',
    tier: 'examples',
    region: 'UK',
    description:
      'An insurance policy schedule: property details, coverage limits and deductibles, a premium breakdown, endorsements, and a QR link to a self-service portal.',
    filename: 'policy-schedule.pdf',
    generate: policySchedule,
    dotnetClass: 'PolicyScheduleExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Insurance'],
    documentType: 'schedule',
    capabilities: ['qr', 'longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
  },

  // Industry Templates - People & HR
  {
    id: 'employment-contract',
    name: 'Employment Contract',
    category: 'People & HR',
    tier: 'examples',
    region: 'UK',
    description:
      'A written statement of employment particulars: numbered clauses, defined terms, a running header, a schedule page, and signature and witness fields.',
    filename: 'employment-contract.pdf',
    generate: employmentContract,
    dotnetClass: 'EmploymentContractExample',
    thumbnails: true,
    pdfUa1: true,
    industries: ['HR', 'Legal'],
    documentType: 'contract',
    capabilities: ['bookmarks', 'longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'employment-contract-classes',
    name: 'Employment Contract (Class API)',
    category: 'People & HR',
    tier: 'examples',
    region: 'UK',
    description:
      'The same statement of employment particulars as Employment Contract, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'employment-contract-classes.pdf',
    generate: employmentContractClasses,
    dotnetClass: 'EmploymentContractExample',
    thumbnails: true,
    pdfUa1: true,
    gallery: false,
    variantOf: 'employment-contract',
    variantLabel: 'Class API',
  },
  {
    id: 'expense-report',
    name: 'Expense Report',
    category: 'People & HR',
    tier: 'examples',
    region: 'UK',
    description:
      'An employee expense claim: foreign-currency lines converted at a stated rate, policy checks that flag over-limit meals and missing receipts, totals by category, and approval slots for the employee, manager, and finance.',
    filename: 'expense-report.pdf',
    generate: expenseReport,
    dotnetClass: 'ExpenseReportExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['HR', 'Finance'],
    documentType: 'worksheet',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'payslip',
    name: 'Payslip',
    category: 'People & HR',
    tier: 'examples',
    description:
      'A payslip run: earnings, deductions, taxes, employer contributions, and year-to-date totals, with masked identifiers and AES-256 encryption, generated in the browser.',
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
    category: 'People & HR',
    tier: 'examples',
    description:
      'The same encrypted payslip as Payslip, built with the class API: construct each element and assign properties. The output is identical.',
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
  {
    id: 'timesheet',
    name: 'Timesheet',
    category: 'People & HR',
    tier: 'examples',
    region: 'UK',
    description:
      'A landscape weekly timesheet: hours by project and day, billable value, utilisation against target, expenses, and approval, with totals that reconcile.',
    filename: 'timesheet.pdf',
    generate: timesheet,
    dotnetClass: 'TimesheetExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['HR', 'Technology', 'General'],
    documentType: 'worksheet',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'timesheet-classes',
    name: 'Timesheet (Class API)',
    category: 'People & HR',
    tier: 'examples',
    region: 'UK',
    description:
      'The same timesheet as Timesheet, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'timesheet-classes.pdf',
    generate: timesheetClasses,
    dotnetClass: 'TimesheetExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'timesheet',
    variantLabel: 'Class API',
  },

  // Industry Templates - Retail & Events
  {
    id: 'booking-confirmation',
    name: 'Booking Confirmation',
    category: 'Retail & Events',
    tier: 'examples',
    region: 'UK',
    description:
      'A travel booking confirmation: outbound and return flights as segment cards, a hotel stay, travellers with seats, a priced breakdown that adds up, and a QR code to manage the booking.',
    filename: 'booking-confirmation.pdf',
    generate: bookingConfirmation,
    dotnetClass: 'BookingConfirmationExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Events', 'Retail'],
    documentType: 'ticket',
    capabilities: ['qr'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'event-ticket',
    name: 'Event Ticket',
    category: 'Retail & Events',
    tier: 'examples',
    description:
      'A concert ticket in boarding-pass style: a background image, a QR entry pass, a Code 128 ticket-id barcode, and a tear-off stub on a custom page size.',
    filename: 'event-ticket.pdf',
    generate: eventTicket,
    requiredAssets: ['images/danny-howe-bn-D2bCvpik-unsplash.jpg'],
    dotnetClass: 'EventTicketExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Events'],
    documentType: 'ticket',
    capabilities: ['qr', 'barcodes', 'images'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'low',
    variantLabel: 'Options API',
  },
  {
    id: 'event-ticket-classes',
    name: 'Event Ticket (Class API)',
    category: 'Retail & Events',
    tier: 'examples',
    description:
      'Event ticket / boarding-pass style card with a concert background image, a QR entry pass, a Code 128 ticket-id barcode, and a perforation-style tear-off stub on a custom ticket page size.',
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
    id: 'edge-receipt',
    series: 'edge-receipt',
    name: 'Point-of-Sale Receipt',
    category: 'Retail & Events',
    tier: 'examples',
    description:
      'A point-of-sale receipt on an 80 mm thermal page, in Courier with a vector QR link and a Code 128 barcode. Generated locally with fonts embedded for archival and accessible output.',
    filename: 'edge-receipt.pdf',
    generate: edgeReceipt,
    dotnetClass: 'EdgeReceiptExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Retail'],
    documentType: 'receipt',
    capabilities: ['qr', 'barcodes'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'low',
    variantLabel: 'Options API',
  },
  {
    id: 'edge-receipt-classes',
    name: 'Point-of-Sale Receipt (Class API)',
    category: 'Retail & Events',
    tier: 'examples',
    description:
      'The same 80 mm thermal-printer receipt as Point-of-Sale Receipt, built with the class API: construct each element and assign properties. The output is identical.',
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
    id: 'long-basket-receipt',
    name: 'Point-of-Sale Receipt: Long Basket',
    category: 'Retail & Events',
    description:
      'An 80 mm till receipt on one continuous roll: a long basket, accented names, per-line discounts, a return, and scannable receipt codes.',
    filename: 'long-basket-receipt.pdf',
    generate: longBasketReceipt,
    dotnetClass: 'LongBasketReceiptExample',
    tier: 'examples',
    series: 'edge-receipt',
    capabilities: ['qr', 'barcodes', 'longTables'],
  },
  {
    id: 'product-photo-gallery',
    name: 'Product Gallery',
    category: 'Retail & Events',
    tier: 'examples',
    description:
      'A retail catalogue: products two per row as cards with studio photography, name, SKU, price, and description, paginating automatically. Each photograph is clipped to a rounded frame and carries alt text.',
    filename: 'product-photo-gallery.pdf',
    generate: productPhotoGallery,
    requiredAssets: PRODUCT_GALLERY_ASSETS,
    dotnetClass: 'ProductPhotoGalleryExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Retail', 'Media'],
    documentType: 'catalog',
    capabilities: ['images', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'product-photo-gallery-classes',
    name: 'Product Gallery (Class API)',
    category: 'Retail & Events',
    tier: 'examples',
    description:
      'The same retail catalogue as Product Gallery, built with the class API: construct each element and assign properties. Each card starts with a clipped studio photograph and carries alt text.',
    filename: 'product-photo-gallery-classes.pdf',
    generate: productPhotoGalleryClasses,
    requiredAssets: PRODUCT_GALLERY_ASSETS,
    dotnetClass: 'ProductPhotoGalleryExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'product-photo-gallery',
    variantLabel: 'Class API',
  },
  {
    id: 'shelf-label',
    name: 'Retail Shelf Label (EU/UK)',
    category: 'Retail & Events',
    tier: 'examples',
    region: 'EU/UK',
    description:
      'An EU/UK shelf-edge label on a custom 110 × 75 mm card: product details, was/now promotional pricing, the mandatory unit price, and an EAN-13 barcode.',
    filename: 'shelf-label.pdf',
    generate: shelfLabel,
    dotnetClass: 'ShelfLabelExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Retail'],
    documentType: 'label',
    capabilities: ['barcodes'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'low',
    variantLabel: 'Options API',
  },
  {
    id: 'shelf-label-classes',
    name: 'Retail Shelf Label (EU/UK) (Class API)',
    category: 'Retail & Events',
    tier: 'examples',
    region: 'EU/UK',
    description:
      'The same EU/UK shelf-edge label as Retail Shelf Label, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'shelf-label-classes.pdf',
    generate: shelfLabelClasses,
    dotnetClass: 'ShelfLabelExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'shelf-label',
    variantLabel: 'Class API',
  },

  // Industry Templates - Sales & Supply Chain
  {
    id: 'commercial-invoice',
    name: 'Commercial Invoice',
    category: 'Sales & Supply Chain',
    tier: 'examples',
    region: 'UK',
    description:
      'An export commercial invoice for customs: exporter, consignee, and delivery details, Incoterms, goods by tariff code and country of origin, weights, totals that add up, an air waybill barcode, and a signed declaration.',
    filename: 'commercial-invoice.pdf',
    generate: commercialInvoice,
    dotnetClass: 'CommercialInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Logistics', 'Manufacturing'],
    documentType: 'invoice',
    capabilities: ['barcodes'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'delivery-note',
    name: 'Delivery Note',
    category: 'Sales & Supply Chain',
    tier: 'examples',
    region: 'UK',
    description:
      'A one-page delivery note: ordered, despatched, and to-follow quantities for part-shipments, a package breakdown, items to follow beside the discrepancy period, and a goods-received signature.',
    filename: 'delivery-note.pdf',
    generate: deliveryNote,
    dotnetClass: 'DeliveryNoteExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Logistics', 'Retail', 'Manufacturing'],
    documentType: 'schedule',
    capabilities: ['longTables'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'delivery-note-classes',
    name: 'Delivery Note (Class API)',
    category: 'Sales & Supply Chain',
    tier: 'examples',
    region: 'UK',
    description:
      'The same delivery note as Delivery note, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'delivery-note-classes.pdf',
    generate: deliveryNoteClasses,
    dotnetClass: 'DeliveryNoteExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'delivery-note',
    variantLabel: 'Class API',
  },
  {
    id: 'multilingual-customer-letter',
    name: 'Multilingual Customer Letter',
    category: 'Sales & Supply Chain',
    description:
      'One order confirmation in French, Greek, Arabic and Hebrew under the same letterhead, with the Arabic and Hebrew letters and their order tables mirrored right to left.',
    filename: 'multilingual-customer-letter.pdf',
    generate: multilingualCustomerLetter,
    dotnetClass: 'MultilingualCustomerLetterExample',
    tier: 'examples',
    requiredAssets: [
      'fonts/NotoSans-Regular.ttf',
      'fonts/NotoNaskhArabic-Regular.ttf',
      'fonts/NotoSerifHebrew-Regular.ttf',
    ],
  },
  {
    id: 'purchase-order',
    name: 'Purchase Order',
    category: 'Sales & Supply Chain',
    tier: 'examples',
    region: 'UK',
    description:
      'A purchase order: a line schedule with required dates, separate order, invoice, and delivery addresses, conditions of purchase, and an authorisation block.',
    filename: 'purchase-order.pdf',
    generate: purchaseOrder,
    dotnetClass: 'PurchaseOrderExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['General', 'Manufacturing', 'Retail'],
    documentType: 'quote',
    capabilities: ['longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['node', 'browser', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'purchase-order-classes',
    name: 'Purchase Order (Class API)',
    category: 'Sales & Supply Chain',
    tier: 'examples',
    region: 'UK',
    description:
      'The same purchase order as Purchase order, built with the class API: construct each element and assign its properties. The output is identical.',
    filename: 'purchase-order-classes.pdf',
    generate: purchaseOrderClasses,
    dotnetClass: 'PurchaseOrderExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'purchase-order',
    variantLabel: 'Class API',
  },
  {
    id: 'quotation',
    name: 'Quotation',
    category: 'Sales & Supply Chain',
    tier: 'examples',
    description:
      'A B2B sales quotation: a three-tier pricing comparison with the recommended tier highlighted, a scope of work, optional add-ons, and an acceptance block.',
    filename: 'quotation.pdf',
    generate: quotation,
    dotnetClass: 'QuotationExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['General', 'Technology', 'Finance'],
    documentType: 'quote',
    capabilities: ['longTables', 'numbering'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'medium',
    variantLabel: 'Options API',
  },
  {
    id: 'quotation-classes',
    name: 'Quotation (Class API)',
    category: 'Sales & Supply Chain',
    tier: 'examples',
    description:
      'The same tiered quotation as Quotation, built with the class API: construct each element and assign properties. The output is identical.',
    filename: 'quotation-classes.pdf',
    generate: quotationClasses,
    dotnetClass: 'QuotationExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'quotation',
    variantLabel: 'Class API',
  },
  {
    id: 'shipping-label',
    name: 'Shipping Label',
    category: 'Sales & Supply Chain',
    tier: 'examples',
    description:
      'A 4 × 6 in carrier shipping label on a custom page size: a routing band, a Code 128 tracking barcode, an ITF-14 carton barcode, and a QR tracking link.',
    filename: 'shipping-label.pdf',
    generate: shippingLabel,
    dotnetClass: 'ShippingLabelExample',
    thumbnails: false,
    pdfUa1: true,
    industries: ['Logistics', 'Retail'],
    documentType: 'label',
    capabilities: ['qr', 'barcodes'],
    compliance: ['pdf/a-2a', 'pdf/ua-1'],
    runtime: ['browser', 'node', 'edge'],
    dataDensity: 'low',
    variantLabel: 'Options API',
  },
  {
    id: 'shipping-label-classes',
    name: 'Shipping Label (Class API)',
    category: 'Sales & Supply Chain',
    tier: 'examples',
    description:
      'A 4 × 6 in carrier-style shipping label on a custom page size: routing band, a Code 128 tracking barcode, an ITF-14 carton barcode, and a QR tracking link.',
    filename: 'shipping-label-classes.pdf',
    generate: shippingLabelClasses,
    dotnetClass: 'ShippingLabelExample',
    thumbnails: false,
    pdfUa1: true,
    gallery: false,
    variantOf: 'shipping-label',
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

// An authoring-style variant renders the *same document* as its parent, so it
// necessarily has the same industry, document type, capabilities, and
// compliance profile. Carrying those by hand on both entries invites drift, so
// a variant inherits any taxonomy field it does not set for itself. Applied
// once, at module load, over the same objects `examples` exposes.
for (const variant of examples) {
  if (!variant.variantOf) continue;
  const parent = examples.find(e => e.id === variant.variantOf);
  if (!parent) continue;
  variant.industries ??= parent.industries;
  variant.documentType ??= parent.documentType;
  variant.capabilities ??= parent.capabilities;
  variant.compliance ??= parent.compliance;
  variant.runtime ??= parent.runtime;
  variant.dataDensity ??= parent.dataDensity;
  variant.series ??= parent.series;
}
