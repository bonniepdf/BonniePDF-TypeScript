import { Document } from '@bonniepdf/core';
import { generate as simpleDocument } from './basic/simple-document';
import { generate as simpleDocumentTagged } from './basic/simple-document-tagged';
import { generate as pdfa2aCompliant } from './basic/pdfa2a-compliant';
import { generate as margins } from './basic/margins';
import { generate as pageSettings } from './basic/page-settings';
import { generate as headersFooters } from './layout/headers-footers';
import { generate as headersFootersTagged } from './layout/headers-footers-tagged';
import { generate as horizontalStacks } from './layout/horizontal-stacks';
import { generate as horizontalStacksTagged } from './layout/horizontal-stacks-tagged';
import { generate as textBlockOverflow } from './layout/text-block-overflow';
import { generate as textBlockOverflowTagged } from './layout/text-block-overflow-tagged';
import { generate as verticalStackOverflow } from './layout/vertical-stack-overflow';
import { generate as verticalStackOverflowTagged } from './layout/vertical-stack-overflow-tagged';
import { generate as multiPageFlow } from './layout/multi-page-flow';
import { generate as multiPageFlowTagged } from './layout/multi-page-flow-tagged';
import { generate as textAlignment } from './typography/text-alignment';
import { generate as textAlignmentTagged } from './typography/text-alignment-tagged';
import { generate as textAlignmentLiberation } from './typography/text-alignment-liberation';
import { generate as bookPageLayout } from './typography/book-page-layout';
import { generate as bookPageLayoutTagged } from './typography/book-page-layout-tagged';
import { generate as richTextStyles } from './typography/rich-text-styles';
import { generate as richTextStylesTagged } from './typography/rich-text-styles-tagged';
import { generate as textDecorations } from './typography/text-decorations';
import { generate as textDecorationsTagged } from './typography/text-decorations-tagged';
import { generate as customFonts } from './typography/custom-fonts';
import { generate as customFontsTagged } from './typography/custom-fonts-tagged';
import { generate as emojisAndUnicode } from './typography/emojis-and-unicode';
import { generate as emojisAndUnicodeTagged } from './typography/emojis-and-unicode-tagged';
import { generate as dickensNovel } from './typography/dickens-novel';
import { generate as lists } from './elements/lists';
import { generate as listsTagged } from './elements/lists-tagged';
import { generate as imagesTagged } from './elements/images-tagged';
import { generate as hyperlinks } from './elements/hyperlinks';
import { generate as shapesAndBorders } from './elements/shapes-and-borders';
import { generate as colorPalette } from './elements/color-palette';
import { generate as qrCodes } from './elements/qr-codes';
import { generate as barcodes } from './elements/barcodes';
import { generate as images } from './elements/images';
import { generate as chartShowcase } from './charting/chart-showcase';
import { generate as barChart } from './charting/bar-chart';
import { generate as groupedBarChart } from './charting/grouped-bar-chart';
import { generate as lineChart } from './charting/line-chart';
import { generate as areaChart } from './charting/area-chart';
import { generate as lollipopChart } from './charting/lollipop-chart';
import { generate as dotPlotChart } from './charting/dot-plot-chart';
import { generate as pieChart } from './charting/pie-chart';
import { generate as multiSeriesLineChart } from './charting/multi-series-line-chart';
import { generate as watermarking } from './security/watermarking';
import { generate as encryption } from './security/encryption';
import { generate as businessInvoice } from './templates/business-invoice';
import { generate as userDirectory } from './templates/user-directory';
import { generate as movieCatalog } from './templates/movie-catalog';
import { generate as financialDashboard } from './templates/financial-dashboard';

export * from './svg';

export interface ExampleDef {
  id: string;
  name: string;
  category: string;
  description: string;
  filename: string;
  generate: () => Document;
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
      'The full ColorPalette as a swatch grid - all 22 Tailwind v4 ramps × 11 shades, drawn as little squares.',
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
  // Templates
  {
    id: 'business-invoice',
    name: 'Business Invoice',
    category: 'Templates',
    description:
      'Professional PDF/UA-1 tagged invoice with company branding, line-items table, totals, and payment details.',
    filename: 'business-invoice.pdf',
    generate: businessInvoice,
    dotnetClass: 'BusinessInvoiceExample',
    thumbnails: false,
    pdfUa1: true,
  },
  {
    id: 'user-directory',
    name: 'User Directory',
    category: 'Templates',
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
    category: 'Templates',
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
    category: 'Templates',
    description:
      'Single-page A4 quarterly report with a full-bleed header, four KPI metrics, a 12-month bar chart, and a top-products table - all styled with a warm earth-tone palette.',
    filename: 'financial-dashboard.pdf',
    generate: financialDashboard,
    dotnetClass: null,
    thumbnails: false,
    pdfUa1: true,
  },
];
