import { Document } from '@bonniepdf/core';
// ── Recipes (technical primitives) ──────────────────────────────────────────
import { generate as simpleDocument } from './recipes/basics/simple-document';
import { generate as simpleDocumentTagged } from './recipes/basics/simple-document-tagged';
import { generate as pdfa2aCompliant } from './recipes/basics/pdfa2a-compliant';
import { generate as margins } from './recipes/basics/margins';
import { generate as pageSettings } from './recipes/basics/page-settings';
import { generate as headersFooters } from './recipes/layout/headers-footers';
import { generate as headersFootersTagged } from './recipes/layout/headers-footers-tagged';
import { generate as horizontalStacks } from './recipes/layout/horizontal-stacks';
import { generate as horizontalStacksTagged } from './recipes/layout/horizontal-stacks-tagged';
import { generate as textBlockOverflow } from './recipes/layout/text-block-overflow';
import { generate as textBlockOverflowTagged } from './recipes/layout/text-block-overflow-tagged';
import { generate as verticalStackOverflow } from './recipes/layout/vertical-stack-overflow';
import { generate as verticalStackOverflowTagged } from './recipes/layout/vertical-stack-overflow-tagged';
import { generate as multiPageFlow } from './recipes/layout/multi-page-flow';
import { generate as multiPageFlowTagged } from './recipes/layout/multi-page-flow-tagged';
import { generate as textAlignment } from './recipes/typography/text-alignment';
import { generate as textAlignmentTagged } from './recipes/typography/text-alignment-tagged';
import { generate as textAlignmentLiberation } from './recipes/typography/text-alignment-liberation';
import { generate as bookPageLayout } from './recipes/typography/book-page-layout';
import { generate as bookPageLayoutTagged } from './recipes/typography/book-page-layout-tagged';
import { generate as richTextStyles } from './recipes/typography/rich-text-styles';
import { generate as richTextStylesTagged } from './recipes/typography/rich-text-styles-tagged';
import { generate as textDecorations } from './recipes/typography/text-decorations';
import { generate as textDecorationsTagged } from './recipes/typography/text-decorations-tagged';
import { generate as customFonts } from './recipes/typography/custom-fonts';
import { generate as customFontsTagged } from './recipes/typography/custom-fonts-tagged';
import { generate as emojisAndUnicode } from './recipes/typography/emojis-and-unicode';
import { generate as emojisAndUnicodeTagged } from './recipes/typography/emojis-and-unicode-tagged';
import { generate as dickensNovel } from './recipes/typography/dickens-novel';
import { generate as lists } from './recipes/elements/lists';
import { generate as listsTagged } from './recipes/elements/lists-tagged';
import { generate as imagesTagged } from './recipes/elements/images-tagged';
import { generate as hyperlinks } from './recipes/elements/hyperlinks';
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
// ── Showcases (industry / vertical-market documents) ────────────────────────
import { generate as businessInvoice } from './showcases/invoices/business-invoice';
import { generate as usSalesInvoice } from './showcases/invoices/us-sales-invoice';
import { generate as ukVatInvoice } from './showcases/invoices/uk-vat-invoice';
import { generate as euEInvoice } from './showcases/invoices/eu-einvoice';
import { generate as indiaGstInvoice } from './showcases/invoices/india-gst-invoice';
import { generate as userDirectory } from './showcases/catalogs/user-directory';
import { generate as movieCatalog } from './showcases/catalogs/movie-catalog';
import { generate as financialDashboard } from './showcases/reports/financial-dashboard';
import { generate as annualReport } from './showcases/reports/annual-report';
import { generate as annualReportGradientCover } from './showcases/reports/annual-report-gradient-cover';
import { generate as annualReportMaskedCover } from './showcases/reports/annual-report-masked-cover';
import { generate as annualReportGeometricCover } from './showcases/reports/annual-report-geometric-cover';
import { generate as eventTicket } from './showcases/operations/event-ticket';
import { generate as patientSummary } from './showcases/healthcare/patient-summary';
import { generate as productRoadmap } from './showcases/operations/product-roadmap';

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
  /** User password for encrypted PDFs - passed to the viewer so it can open the document. */
  password?: string;
}

export const examples: ExampleDef[] = [
  // Basic
  {
    id: 'simple-document',
    name: 'Simple Document',
    category: 'Basic',
    description: '3-page document demonstrating the core Document API - text, spacers, and custom page sizes.',
    filename: 'simple-document.pdf',
    generate: simpleDocument,
    dotnetClass: 'SimpleDocumentExample',
    pdfUa1: true,
  },
  {
    id: 'simple-document-tagged',
    name: 'Simple Document (PDF/UA-1)',
    category: 'Basic',
    description:
      'PDF/UA-1 tagged variant of Simple Document - screen-reader friendly with headings, paragraphs, and a Figure with alt-text.',
    filename: 'simple-document-tagged.pdf',
    generate: simpleDocumentTagged,
    dotnetClass: 'SimpleDocumentTaggedExample',
    pdfUa1: true,
  },
  {
    id: 'pdfa2a-compliant',
    name: 'PDF/A-2a + PDF/UA-1',
    category: 'Basic',
    description:
      'The modern archival + accessible baseline. Sets settings.conformance = PdfAConformance.PdfA2a alongside AccessibilityMode.PdfUa1 - validated by veraPDF against profile 2a.',
    filename: 'pdfa2a-compliant.pdf',
    generate: pdfa2aCompliant,
    dotnetClass: 'PdfA2aCompliantExample',
    pdfUa1: true,
  },
  {
    id: 'margins',
    name: 'Margins & Units',
    category: 'Basic',
    description: 'How to apply margins and padding to text, containers, tables, and stacks.',
    filename: 'margins.pdf',
    generate: margins,
    dotnetClass: 'MarginExample',
    pdfUa1: true,
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
  },
  // Layout
  {
    id: 'headers-footers',
    name: 'Headers & Footers',
    category: 'Layout',
    description: 'Page templates with dynamic header and footer content on every page.',
    filename: 'headers-footers.pdf',
    generate: headersFooters,
    dotnetClass: 'HeadersFootersExample',
    pdfUa1: true,
  },
  {
    id: 'headers-footers-tagged',
    name: 'Headers & Footers (PDF/UA-1)',
    category: 'Layout',
    description:
      'PDF/UA-1 tagged variant - running header and footer are Artifacts; body sections use /H2 headings and /P paragraphs.',
    filename: 'headers-footers-tagged.pdf',
    generate: headersFootersTagged,
    dotnetClass: 'HeadersFootersTaggedExample',
    pdfUa1: true,
  },
  {
    id: 'horizontal-stacks',
    name: 'Horizontal Stacks',
    category: 'Layout',
    description: 'Flex-like horizontal layout with equal, weighted, and centre-aligned distributions.',
    filename: 'horizontal-stacks.pdf',
    generate: horizontalStacks,
    thumbnails: false,
    dotnetClass: 'HorizontalStacksExample',
    pdfUa1: true,
  },
  {
    id: 'horizontal-stacks-tagged',
    name: 'Horizontal Stacks (PDF/UA-1)',
    category: 'Layout',
    description:
      'PDF/UA-1 tagged variant - equal-width, weighted, key-value pair, and two-column stack layouts, all with /H2 section headings.',
    filename: 'horizontal-stacks-tagged.pdf',
    generate: horizontalStacksTagged,
    thumbnails: false,
    dotnetClass: 'HorizontalStacksTaggedExample',
    pdfUa1: true,
  },
  {
    id: 'text-block-overflow',
    name: 'TextBlock Overflow',
    category: 'Layout',
    description: 'Long text content flowing automatically across multiple pages with a page-count footer.',
    filename: 'text-block-overflow.pdf',
    generate: textBlockOverflow,
    dotnetClass: 'TextBlockOverflowExample',
    pdfUa1: true,
  },
  {
    id: 'text-block-overflow-tagged',
    name: 'TextBlock Overflow (PDF/UA-1)',
    category: 'Layout',
    description:
      'PDF/UA-1 tagged variant - twenty /H2-headed sections of body text flowing across pages with an Artifact page-number footer.',
    filename: 'text-block-overflow-tagged.pdf',
    generate: textBlockOverflowTagged,
    dotnetClass: 'TextBlockOverflowTaggedExample',
    pdfUa1: true,
  },
  {
    id: 'vertical-stack-overflow',
    name: 'VerticalStack Overflow',
    category: 'Layout',
    description: '75-item card list inside a VerticalStack that paginates automatically.',
    filename: 'vertical-stack-overflow.pdf',
    generate: verticalStackOverflow,
    dotnetClass: 'VerticalStackOverflowExample',
    pdfUa1: true,
  },
  {
    id: 'vertical-stack-overflow-tagged',
    name: 'VerticalStack Overflow (PDF/UA-1)',
    category: 'Layout',
    description:
      'PDF/UA-1 tagged variant - 75-item catalogue, each item with a /H3 heading and /P description inside a paginating VerticalStack.',
    filename: 'vertical-stack-overflow-tagged.pdf',
    generate: verticalStackOverflowTagged,
    dotnetClass: 'VerticalStackOverflowTaggedExample',
    pdfUa1: true,
  },
  {
    id: 'multi-page-flow',
    name: 'Multi-Page Flow',
    category: 'Layout',
    description:
      'PDF/UA-1 tagged landscape document combining a 150-row table with repeating headers and multi-page text sections.',
    filename: 'multi-page-flow.pdf',
    generate: multiPageFlow,
    dotnetClass: 'MultiPageFlowExample',
    pdfUa1: true,
  },
  {
    id: 'multi-page-flow-tagged',
    name: 'Multi-Page Flow (PDF/UA-1)',
    category: 'Layout',
    description:
      'PDF/UA-1 tagged document with a 30-row employee table (repeating /TH headers) followed by /H2-headed company overview sections.',
    filename: 'multi-page-flow-tagged.pdf',
    generate: multiPageFlowTagged,
    dotnetClass: 'MultiPageFlowTaggedExample',
    pdfUa1: true,
  },
  // Typography
  {
    id: 'text-alignment',
    name: 'Text Alignment',
    category: 'Typography',
    description: 'Left, center, right and justified text alignment including book-style paragraphs.',
    filename: 'text-alignment.pdf',
    generate: textAlignment,
    thumbnails: false,
    dotnetClass: null,
    pdfUa1: true,
  },
  {
    id: 'text-alignment-tagged',
    name: 'Text Alignment (PDF/UA-1)',
    category: 'Typography',
    description:
      'PDF/UA-1 tagged variant - all four alignments demonstrated with /H2 section headings and /P paragraphs.',
    filename: 'text-alignment-tagged.pdf',
    generate: textAlignmentTagged,
    thumbnails: false,
    dotnetClass: 'TextAlignmentTaggedExample',
    pdfUa1: true,
  },
  {
    id: 'text-alignment-liberation',
    name: 'Text Alignment (Liberation Sans)',
    category: 'Typography',
    description:
      "PDF/UA-1 tagged variant rendered entirely in embedded Liberation Sans - alignment is measured from the font's own glyph metrics, so right/centre/justified edges are exact.",
    filename: 'text-alignment-liberation.pdf',
    generate: textAlignmentLiberation,
    thumbnails: false,
    dotnetClass: null,
    pdfUa1: true,
  },
  {
    id: 'book-page-layout',
    name: 'Book Page Layout',
    category: 'Typography',
    description: 'Advanced book-style typography with Times family fonts, pull-quote block, and a chapter footer.',
    filename: 'book-page-layout.pdf',
    generate: bookPageLayout,
    thumbnails: false,
    dotnetClass: 'BookPageLayoutExample',
    pdfUa1: true,
  },
  {
    id: 'book-page-layout-tagged',
    name: 'Book Page Layout (PDF/UA-1)',
    category: 'Typography',
    description:
      'PDF/UA-1 tagged variant - chapter title as /H1, body paragraphs as /P, and a pull-quote block with bordered container.',
    filename: 'book-page-layout-tagged.pdf',
    generate: bookPageLayoutTagged,
    thumbnails: false,
    dotnetClass: 'BookPageLayoutTaggedExample',
    pdfUa1: true,
  },
  {
    id: 'rich-text-styles',
    name: 'Rich Text Styles',
    category: 'Typography',
    description:
      'Mixed inline formatting - bold, italic, colored, highlighted, underlined, and sized spans within flowing paragraphs.',
    filename: 'rich-text-styles.pdf',
    generate: richTextStyles,
    dotnetClass: 'RichTextExample',
    pdfUa1: true,
  },
  {
    id: 'rich-text-styles-tagged',
    name: 'Rich Text Styles (PDF/UA-1)',
    category: 'Typography',
    description:
      'PDF/UA-1 tagged variant - bold, italic, coloured, underlined, and strikethrough spans with /H2 section headings.',
    filename: 'rich-text-styles-tagged.pdf',
    generate: richTextStylesTagged,
    dotnetClass: 'RichTextTaggedExample',
    pdfUa1: true,
  },
  {
    id: 'text-decorations',
    name: 'Text Decorations',
    category: 'Typography',
    description:
      'Underline and strikethrough decorations applied individually, combined, and across all text alignments and font sizes.',
    filename: 'text-decorations.pdf',
    generate: textDecorations,
    thumbnails: false,
    dotnetClass: 'TextDecorationExample',
    pdfUa1: true,
  },
  {
    id: 'text-decorations-tagged',
    name: 'Text Decorations (PDF/UA-1)',
    category: 'Typography',
    description:
      'PDF/UA-1 tagged variant - underline, strikethrough, and combined decorations with /H2 section headings and /P paragraphs.',
    filename: 'text-decorations-tagged.pdf',
    generate: textDecorationsTagged,
    thumbnails: false,
    dotnetClass: 'TextDecorationTaggedExample',
    pdfUa1: true,
  },
  {
    id: 'custom-fonts',
    name: 'Custom Fonts',
    category: 'Typography',
    description:
      'TrueType font embedding with full Unicode symbol coverage - currency, Greek, mathematical, and arrow characters.',
    filename: 'custom-fonts.pdf',
    generate: customFonts,
    thumbnails: false,
    dotnetClass: 'CustomFontExample',
    pdfUa1: true,
  },
  {
    id: 'custom-fonts-tagged',
    name: 'Custom Fonts (PDF/UA-1)',
    category: 'Typography',
    description:
      'PDF/UA-1 tagged variant - TrueType Unicode coverage (symbols, currency, math, Greek) with /H2 section headings.',
    filename: 'custom-fonts-tagged.pdf',
    generate: customFontsTagged,
    thumbnails: false,
    dotnetClass: 'CustomFontTaggedExample',
    pdfUa1: true,
  },
  {
    id: 'emojis-and-unicode',
    name: 'Emojis & Unicode',
    category: 'Typography',
    description: 'Supplementary Unicode plane support with emoji sections and mixed text/emoji status lines.',
    filename: 'emojis-and-unicode.pdf',
    generate: emojisAndUnicode,
    thumbnails: false,
    dotnetClass: 'EmojiExample',
    pdfUa1: true,
  },
  {
    id: 'emojis-and-unicode-tagged',
    name: 'Emojis & Unicode (PDF/UA-1)',
    category: 'Typography',
    description:
      'PDF/UA-1 tagged variant - emoji and supplementary Unicode sections with /H2 headings. PDF/A disabled; PDF/UA-1 enabled.',
    filename: 'emojis-and-unicode-tagged.pdf',
    generate: emojisAndUnicodeTagged,
    thumbnails: false,
    dotnetClass: 'EmojiTaggedExample',
    pdfUa1: true,
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
    id: 'lists',
    name: 'Lists',
    category: 'Elements',
    description:
      'Ordered (decimal, roman, alpha) and unordered (disc, circle, square, dash, custom) lists including nested lists.',
    filename: 'lists.pdf',
    generate: lists,
    dotnetClass: 'ListsExample',
    pdfUa1: true,
  },
  {
    id: 'lists-tagged',
    name: 'Lists (PDF/UA-1)',
    category: 'Elements',
    description:
      'PDF/UA-1 tagged ordered and unordered lists - each item is structured as L > LI > Lbl + LBody for full screen-reader compatibility.',
    filename: 'lists-tagged.pdf',
    generate: listsTagged,
    dotnetClass: null,
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
    description: 'PNG embedding with contain, cover, and fill fit modes, plus alpha transparency support.',
    filename: 'images.pdf',
    generate: images,
    dotnetClass: 'ImagesExample',
    pdfUa1: true,
  },
  {
    id: 'images-tagged',
    name: 'Images (PDF/UA-1)',
    category: 'Elements',
    description:
      'PDF/UA-1 tagged image example - an informative image with alt text becomes a Figure structure element; a decorative image is marked as an artifact.',
    filename: 'images-tagged.pdf',
    generate: imagesTagged,
    dotnetClass: null,
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
    // .NET implements this as a private method inside ChartShowcaseExample
    dotnetClass: null,
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
    id: 'eu-einvoice',
    name: 'EU E-Invoice (PDF/A-3, EN 16931)',
    category: 'Invoices',
    tier: 'showcase',
    region: 'EU',
    description:
      'A cross-border EU e-invoice in the EN 16931 / Factur-X idiom: a PDF/A-3b container, both parties’ VAT IDs, an intra-Community reverse-charge notice, IBAN/BIC, and EUR amounts. The structured XML half is shown as a placeholder pending an embedded-file API.',
    filename: 'eu-einvoice.pdf',
    generate: euEInvoice,
    dotnetClass: 'EuEInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
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
    id: 'financial-dashboard',
    name: 'Financial Dashboard',
    category: 'Reports',
    tier: 'showcase',
    description:
      'Single-page A4 quarterly report with a full-bleed header, four KPI metrics, a 12-month bar chart, and a top-products table - all styled with a warm earth-tone palette.',
    filename: 'financial-dashboard.pdf',
    generate: financialDashboard,
    dotnetClass: null,
    thumbnails: false,
    pdfUa1: true,
  },
  {
    id: 'annual-report',
    name: 'Annual Report',
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
    name: 'Annual Report Cover - Gradient',
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
    name: 'Annual Report Cover - Masked Image',
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
    name: 'Annual Report Cover - Geometric',
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
];
