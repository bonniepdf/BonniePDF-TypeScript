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
import { generate as lists } from './recipes/elements/lists';
import { generate as hyperlinks } from './recipes/elements/hyperlinks';
import { generate as crossReferences } from './recipes/elements/cross-references';
import { generate as shapesAndBorders } from './recipes/elements/shapes-and-borders';
import { generate as colorPalette } from './recipes/elements/color-palette';
import { generate as qrCodes } from './recipes/elements/qr-codes';
import { generate as barcodes } from './recipes/elements/barcodes';
import { generate as dataMatrix } from './recipes/elements/data-matrix';
import { generate as images } from './recipes/elements/images';
import { generate as chartShowcase } from './recipes/charting/chart-showcase';
import { generate as barChart } from './recipes/charting/bar-chart';
import { generate as groupedBarChart } from './recipes/charting/grouped-bar-chart';
import { generate as lineChart } from './recipes/charting/line-chart';
import { generate as areaChart } from './recipes/charting/area-chart';
import { generate as lollipopChart } from './recipes/charting/lollipop-chart';
import { generate as dotPlotChart } from './recipes/charting/dot-plot-chart';
import { generate as pieChart } from './recipes/charting/pie-chart';
import { generate as multiSeriesLineChart } from './recipes/charting/multi-series-line-chart';
import { generate as watermarking } from './recipes/security/watermarking';
import { generate as encryption } from './recipes/security/encryption';
import { generate as attachedData } from './recipes/security/attached-data';
// ── Showcases (industry / vertical-market documents) ────────────────────────
import { generate as businessInvoice } from './showcases/invoices/business-invoice';
import { generate as usSalesInvoice } from './showcases/invoices/us-sales-invoice';
import { generate as ukVatInvoice } from './showcases/invoices/uk-vat-invoice';
import { generate as facturXInvoice } from './showcases/invoices/factur-x-invoice';
import { generate as indiaGstInvoice } from './showcases/invoices/india-gst-invoice';
import { generate as userDirectory } from './showcases/catalogs/user-directory';
import { generate as movieCatalog } from './showcases/catalogs/movie-catalog';
import { generate as productPhotoGallery } from './showcases/catalogs/product-photo-gallery';
import { generate as financialDashboard } from './showcases/reports/financial-dashboard';
import { generate as complianceFindingsRegister } from './showcases/reports/compliance-findings-register';
import { generate as annualReport } from './showcases/reports/annual-report';
import { generate as annualReportGradientCover } from './showcases/reports/annual-report-gradient-cover';
import { generate as annualReportMaskedCover } from './showcases/reports/annual-report-masked-cover';
import { generate as annualReportGeometricCover } from './showcases/reports/annual-report-geometric-cover';
import { generate as eventTicket } from './showcases/operations/event-ticket';
import { generate as patientSummary } from './showcases/healthcare/patient-summary';
import { generate as outpatientAppointmentLetter } from './showcases/healthcare/outpatient-appointment-letter';
import { generate as productRoadmap } from './showcases/operations/product-roadmap';
// ── Vertical-market gallery follow-up (registrations + new showcases) ────────
import { generate as saasInvoice } from './showcases/invoices/saas-invoice';
import { generate as shippingLabel } from './showcases/operations/shipping-label';
import { generate as horizontalBarChart } from './recipes/charting/horizontal-bar-chart';
import { generate as horizontalGroupedBarChart } from './recipes/charting/horizontal-grouped-bar-chart';
import { generate as horizontalLollipopChart } from './recipes/charting/horizontal-lollipop-chart';
import { generate as watermarkingConfidential } from './recipes/security/watermarking-confidential';
import { generate as edgeReceipt } from './showcases/edge/edge-receipt';
import { generate as publicLibraryMembershipLetter } from './showcases/community/public-library-membership-letter';
import { generate as auditReport } from './showcases/compliance/audit-report';
import { generate as shelfLabel } from './showcases/retail/shelf-label';
import { generate as ukDegreeTranscript } from './showcases/education/uk-degree-transcript';
import { generate as financialStatement } from './showcases/reports/financial-statement';
import { generate as labReport } from './showcases/healthcare/lab-report';

export * from './recipes/svg';

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
    name: 'PDF/A + PDF/UA',
    category: 'Basic',
    description:
      "The modern archival + accessible baseline every example in this gallery uses, explained: settings.conformance = 'pdf/a-2a' alongside accessibility = 'pdf/ua-1' - validated by veraPDF against profile 2a.",
    filename: 'pdf-compliance.pdf',
    generate: pdfCompliance,
    dotnetClass: 'PdfComplianceExample',
    pdfUa1: true,
    variantLabel: 'Options API',
  },
  {
    id: 'pdf-compliance-classes',
    name: 'PDF/A + PDF/UA (Class API)',
    category: 'Basic',
    description:
      'The same PDF/A-2a + PDF/UA-1 baseline as PDF/A + PDF/UA, authored the long way: construct settings and metadata objects and assign each property. Shows the class/mutation surface the options-object front door desugars to - and renders byte-for-byte identically.',
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
      'Dynamic running header and footer templates on every page. The templates are tagged as Artifacts (skipped by screen readers) while the numbered body sections use /H2 headings and /P paragraphs.',
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
      'Flex-like horizontal layout - equal and weighted width distribution, cross-axis (vertical) alignment, key-value pairs, and two-column text, all with /H2 section headings.',
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
      'Long-form text flowing automatically across page boundaries. Three self-documenting /H2 sections stay tagged as they paginate, with an Artifact "Page N of M" footer on every page.',
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
      'Left, centre, right, and justified text alignment including book-style paragraphs, tagged as /H2 headings and /P paragraphs. PDF/A-2a + PDF/UA-1.',
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
      'A typeset chapter page in the style of an academic monograph: Times family fonts throughout, justified body text, a bordered pull-quote block inset from the text column, a mixed bold/italic emphasis break, and a chapter footer with page number and imprint. Chapter title is /H1; all body paragraphs are /P. PDF/A-2a + PDF/UA-1.',
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
      'PDF/UA-1 tagged book layout with VisualToc, artifacted running headers, footer page numbers, and justified body text across three books and fourteen chapters.',
    filename: 'dickens-novel.pdf',
    generate: dickensNovel,
    dotnetClass: 'DickensNovelExample',
    pdfUa1: true,
  },
  // Elements
  {
    id: 'tables',
    name: 'Tables',
    category: 'Elements',
    description:
      'A 45-row employee table with repeating /TH column headers across pages, alternating row colours, and a "Page N of M" footer — all tagged /TH and /TD within the /Table structure tree. PDF/A-2a + PDF/UA-1.',
    filename: 'tables.pdf',
    generate: tables,
    dotnetClass: 'TablesExample',
    pdfUa1: true,
  },
  {
    id: 'lists',
    name: 'Lists',
    category: 'Elements',
    description:
      'Ordered (decimal, roman, alpha, custom start) and unordered (disc, circle, square, dash, custom, coloured) lists including nested sub-lists. Each item is tagged as L > LI > Lbl + LBody. PDF/A-2a + PDF/UA-1.',
    filename: 'lists.pdf',
    generate: lists,
    dotnetClass: 'ListsExample',
    pdfUa1: true,
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
  },
  {
    id: 'images',
    name: 'Images',
    category: 'Elements',
    description:
      'PNG embedding with contain, cover, and fill fit modes, bordered containers, and alpha transparency. Every informative image carries alt text (Figure + /Alt) and a decorative divider is marked as an artifact. PDF/A-2a + PDF/UA-1.',
    filename: 'images.pdf',
    generate: images,
    dotnetClass: 'ImagesExample',
    pdfUa1: true,
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
  },
  {
    id: 'attached-data',
    name: 'Report with Embedded Source Data',
    category: 'Security',
    description:
      'A PDF/A-3 report that embeds its underlying CSV data as an associated file (/AFRelationship /Source) for reproducibility, using the generic file-attachment API.',
    filename: 'attached-data.pdf',
    generate: attachedData,
    dotnetClass: 'AttachedDataExample',
    pdfUa1: false,
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
  },
  {
    id: 'factur-x-invoice',
    name: 'EU E-Invoice (Factur-X / ZUGFeRD, EN 16931)',
    category: 'Invoices',
    tier: 'showcase',
    region: 'EU',
    description:
      'A cross-border EU e-invoice in the EN 16931 / Factur-X idiom: a polished PDF/A-3 invoice - both parties, EUR amounts, IBAN/BIC - carrying the machine-readable CII invoice XML embedded as an associated file (/AFRelationship /Data) with the fx: XMP metadata. The visible totals mirror the embedded XML exactly. Validated in CI with veraPDF (PDF/A-3b) and the Mustang project (ZUGFeRD / EN 16931).',
    filename: 'factur-x_invoice.pdf',
    generate: facturXInvoice,
    requiredAssets: ['factur-x/en16931-invoice.xml'],
    dotnetClass: 'FacturXInvoiceExample',
    thumbnails: false,
    pdfUa1: false,
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
  },
  {
    id: 'user-directory',
    name: 'User Directory',
    category: 'Catalogs',
    tier: 'showcase',
    description: 'Landscape A4, 50-row table with alternating row colors, status badges, and repeated headers.',
    filename: 'user-directory.pdf',
    generate: userDirectory,
    dotnetClass: 'UserDirectoryExample',
    pdfUa1: true,
    thumbnails: false,
  },
  {
    id: 'movie-catalog',
    name: 'Movie Catalog',
    category: 'Catalogs',
    tier: 'showcase',
    description:
      'Landscape A4 classic film catalog with a 47-row table, colour-coded ratings, alternating rows, and repeating headers.',
    filename: 'movie-catalog.pdf',
    generate: movieCatalog,
    dotnetClass: 'MovieCatalogExample',
    pdfUa1: true,
    thumbnails: false,
  },
  {
    id: 'product-photo-gallery',
    name: 'Product Photo Gallery',
    category: 'Catalogs',
    tier: 'showcase',
    description:
      'A retail look-book: products laid out two-per-row as photo cards with name, SKU, price, and blurb, paginating automatically. PDF/A-2a + PDF/UA-1. Product photographs are pending - cards show a labelled placeholder until the images are supplied.',
    filename: 'product-photo-gallery.pdf',
    generate: productPhotoGallery,
    requiredAssets: [
      'images/products/terracotta-planter.jpg',
      'images/products/linen-throw.jpg',
      'images/products/brass-reading-lamp.jpg',
      'images/products/ceramic-pour-over.jpg',
      'images/products/wool-floor-cushion.jpg',
      'images/products/smoked-glass-carafe.jpg',
      'images/products/oak-wall-shelf.jpg',
      'images/products/rattan-pendant-shade.jpg',
    ],
    dotnetClass: 'ProductPhotoGalleryExample',
    thumbnails: false,
    pdfUa1: true,
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
    dotnetClass: null,
    thumbnails: false,
    pdfUa1: true,
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
