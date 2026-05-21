import { Document } from '@bonniepdf/core';
import { generate as simpleDocument } from './basic/simple-document';
import { generate as margins } from './basic/margins';
import { generate as pageSettings } from './basic/page-settings';
import { generate as headersFooters } from './layout/headers-footers';
import { generate as horizontalStacks } from './layout/horizontal-stacks';
import { generate as textBlockOverflow } from './layout/text-block-overflow';
import { generate as verticalStackOverflow } from './layout/vertical-stack-overflow';
import { generate as multiPageFlow } from './layout/multi-page-flow';
import { generate as textAlignment } from './typography/text-alignment';
import { generate as bookPageLayout } from './typography/book-page-layout';
import { generate as richTextStyles } from './typography/rich-text-styles';
import { generate as textDecorations } from './typography/text-decorations';
import { generate as customFonts } from './typography/custom-fonts';
import { generate as emojisAndUnicode } from './typography/emojis-and-unicode';
import { generate as dickensNovel } from './typography/dickens-novel';
import { generate as lists } from './elements/lists';
import { generate as hyperlinks } from './elements/hyperlinks';
import { generate as shapesAndBorders } from './elements/shapes-and-borders';
import { generate as qrCodes } from './elements/qr-codes';
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

export interface ExampleDef {
  id: string;
  name: string;
  category: string;
  description: string;
  filename: string;
  generate: () => Document;
  thumbnailsOpen?: boolean;
  /** Corresponding .NET class name in BonniePDF-NET/Examples/. null = TypeScript-only. */
  dotnetClass?: string | null;
}

export const examples: ExampleDef[] = [
  // ── Basics ────────────────────────────────────────────────────────────────
  {
    id: 'simple-document',
    name: 'Simple Document',
    category: 'Basic',
    description: '3-page document demonstrating the core Document API — text, spacers, and custom page sizes.',
    filename: 'simple-document.pdf',
    generate: simpleDocument,
    dotnetClass: 'SimpleDocumentExample',
  },
  {
    id: 'margins',
    name: 'Margins & Units',
    category: 'Basic',
    description: 'How to apply margins and padding to text, containers, tables, and stacks.',
    filename: 'margins.pdf',
    generate: margins,
    dotnetClass: 'MarginExample',
  },
  {
    id: 'page-settings',
    name: 'Page Settings',
    category: 'Basic',
    description: 'Gallery of every standard page size in both portrait and landscape orientation.',
    filename: 'page-settings.pdf',
    generate: pageSettings,
    dotnetClass: 'PageSettingsExample',
  },

  // ── Layout ────────────────────────────────────────────────────────────────
  {
    id: 'headers-footers',
    name: 'Headers & Footers',
    category: 'Layout',
    description: 'Page templates with dynamic header and footer content on every page.',
    filename: 'headers-footers.pdf',
    generate: headersFooters,
    dotnetClass: 'HeadersFootersExample',
  },
  {
    id: 'horizontal-stacks',
    name: 'Horizontal Stacks',
    category: 'Layout',
    description: 'Flex-like horizontal layout with equal, weighted, and centre-aligned distributions.',
    filename: 'horizontal-stacks.pdf',
    generate: horizontalStacks,
    thumbnailsOpen: false,
    dotnetClass: 'HorizontalStacksExample',
  },
  {
    id: 'text-block-overflow',
    name: 'TextBlock Overflow',
    category: 'Layout',
    description: 'Long text content flowing automatically across multiple pages with a page-count footer.',
    filename: 'text-block-overflow.pdf',
    generate: textBlockOverflow,
    dotnetClass: 'TextBlockOverflowExample',
  },
  {
    id: 'vertical-stack-overflow',
    name: 'VerticalStack Overflow',
    category: 'Layout',
    description: '75-item card list inside a VerticalStack that paginates automatically.',
    filename: 'vertical-stack-overflow.pdf',
    generate: verticalStackOverflow,
    dotnetClass: 'VerticalStackOverflowExample',
  },
  {
    id: 'multi-page-flow',
    name: 'Multi-Page Flow',
    category: 'Layout',
    description: 'Landscape document combining a 150-row table with repeating headers and multi-page text sections.',
    filename: 'multi-page-flow.pdf',
    generate: multiPageFlow,
    dotnetClass: 'MultiPageFlowExample',
  },

  // ── Typography ────────────────────────────────────────────────────────────
  {
    id: 'text-alignment',
    name: 'Text Alignment',
    category: 'Typography',
    description: 'Left, center, right and justified text alignment including book-style paragraphs.',
    filename: 'text-alignment.pdf',
    generate: textAlignment,
    thumbnailsOpen: false,
    dotnetClass: null,
  },
  {
    id: 'book-page-layout',
    name: 'Book Page Layout',
    category: 'Typography',
    description: 'Advanced book-style typography with Times family fonts, pull-quote block, and a chapter footer.',
    filename: 'book-page-layout.pdf',
    generate: bookPageLayout,
    thumbnailsOpen: false,
    dotnetClass: 'BookPageLayoutExample',
  },
  {
    id: 'rich-text-styles',
    name: 'Rich Text Styles',
    category: 'Typography',
    description:
      'Mixed inline formatting — bold, italic, colored, highlighted, underlined, and sized spans within flowing paragraphs.',
    filename: 'rich-text-styles.pdf',
    generate: richTextStyles,
    dotnetClass: 'RichTextExample',
  },
  {
    id: 'text-decorations',
    name: 'Text Decorations',
    category: 'Typography',
    description:
      'Underline and strikethrough decorations applied individually, combined, and across all text alignments and font sizes.',
    filename: 'text-decorations.pdf',
    generate: textDecorations,
    thumbnailsOpen: false,
    dotnetClass: 'TextDecorationExample',
  },
  {
    id: 'custom-fonts',
    name: 'Custom Fonts',
    category: 'Typography',
    description:
      'TrueType font embedding with full Unicode symbol coverage — currency, Greek, mathematical, and arrow characters.',
    filename: 'custom-fonts.pdf',
    generate: customFonts,
    thumbnailsOpen: false,
    dotnetClass: 'CustomFontExample',
  },
  {
    id: 'emojis-and-unicode',
    name: 'Emojis & Unicode',
    category: 'Typography',
    description: 'Supplementary Unicode plane support with emoji sections and mixed text/emoji status lines.',
    filename: 'emojis-and-unicode.pdf',
    generate: emojisAndUnicode,
    thumbnailsOpen: false,
    dotnetClass: 'EmojiExample',
  },
  {
    id: 'dickens-novel',
    name: 'Dickens: A Tale of Two Cities',
    category: 'Typography',
    description:
      'Multi-hundred-page book layout with VisualToc, alternating running headers, footer page numbers, and justified body text across three books and fourteen chapters.',
    filename: 'dickens-novel.pdf',
    generate: dickensNovel,
    dotnetClass: 'DickensNovelExample',
  },

  // ── Elements ──────────────────────────────────────────────────────────────
  {
    id: 'lists',
    name: 'Lists',
    category: 'Elements',
    description:
      'Ordered (decimal, roman, alpha) and unordered (disc, circle, square, dash, custom) lists including nested lists.',
    filename: 'lists.pdf',
    generate: lists,
    dotnetClass: 'ListsExample',
  },
  {
    id: 'hyperlinks',
    name: 'Hyperlinks',
    category: 'Elements',
    description: 'External hyperlinks with custom font, size, and colour styling.',
    filename: 'hyperlinks.pdf',
    generate: hyperlinks,
    thumbnailsOpen: false,
    dotnetClass: 'HyperlinksExample',
  },
  {
    id: 'shapes-and-borders',
    name: 'Shapes & Borders',
    category: 'Elements',
    description: 'Rounded rectangles, bordered containers, card layouts, and status banners.',
    filename: 'shapes-and-borders.pdf',
    generate: shapesAndBorders,
    dotnetClass: 'ShapesAndBordersExample',
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
  },
  {
    id: 'images',
    name: 'Images',
    category: 'Elements',
    description: 'PNG embedding with contain, cover, and fill fit modes, plus alpha transparency support.',
    filename: 'images.pdf',
    generate: images,
    dotnetClass: 'ImagesExample',
  },

  // ── Charting ──────────────────────────────────────────────────────────────
  {
    id: 'chart-showcase',
    name: 'Chart Showcase',
    category: 'Charting',
    description:
      'Eight-page landscape showcase of all chart types: bar, grouped bar, line, area, lollipop, dot plot, pie, and multi-series line.',
    filename: 'chart-showcase.pdf',
    generate: chartShowcase,
    dotnetClass: 'ChartShowcaseExample',
  },
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    category: 'Charting',
    description: 'Vertical bar chart showing monthly sales with grid lines and value labels.',
    filename: 'bar-chart.pdf',
    generate: barChart,
    dotnetClass: 'BarChartExample',
  },
  {
    id: 'grouped-bar-chart',
    name: 'Grouped Bar Chart',
    category: 'Charting',
    description: 'Side-by-side bars comparing three product lines across 12 months with a colour legend.',
    filename: 'grouped-bar-chart.pdf',
    generate: groupedBarChart,
    dotnetClass: 'GroupedBarChartExample',
  },
  {
    id: 'line-chart',
    name: 'Line Chart',
    category: 'Charting',
    description: 'Connected data points with circular markers and value labels showing monthly revenue trends.',
    filename: 'line-chart.pdf',
    generate: lineChart,
    dotnetClass: 'LineChartExample',
  },
  {
    id: 'area-chart',
    name: 'Area Chart',
    category: 'Charting',
    description: 'Filled area under a line with configurable opacity showing monthly sales performance.',
    filename: 'area-chart.pdf',
    generate: areaChart,
    dotnetClass: 'AreaChartExample',
  },
  {
    id: 'lollipop-chart',
    name: 'Lollipop Chart',
    category: 'Charting',
    description: 'Stems with circular heads — a clear, minimal alternative to bar charts for quarterly metrics.',
    filename: 'lollipop-chart.pdf',
    generate: lollipopChart,
    dotnetClass: 'LollipopChartExample',
  },
  {
    id: 'dot-plot-chart',
    name: 'Dot Plot Chart',
    category: 'Charting',
    description: 'Circular markers positioned along a value axis to compare product performance at a glance.',
    filename: 'dot-plot-chart.pdf',
    generate: dotPlotChart,
    dotnetClass: 'DotPlotChartExample',
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    category: 'Charting',
    description: 'Donut chart with a colour legend and total value in the centre showing monthly sales share.',
    filename: 'pie-chart.pdf',
    generate: pieChart,
    dotnetClass: 'PieChartExample',
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
  },

  // ── Security ──────────────────────────────────────────────────────────────
  {
    id: 'watermarking',
    name: 'Watermarking',
    category: 'Security',
    description: 'Semi-transparent diagonal DRAFT watermark rendered behind page content on every page.',
    filename: 'watermarking.pdf',
    generate: watermarking,
    // .NET has three variants; Draft is canonical
    dotnetClass: 'WatermarkDraftExample',
  },
  {
    id: 'encryption',
    name: 'Encryption',
    category: 'Security',
    description:
      'Three encryption scenarios: simple password, user/owner passwords with permissions, and owner-only restrictions.',
    filename: 'encryption.pdf',
    generate: encryption,
    // .NET has three variants; Password is canonical
    dotnetClass: 'EncryptionPasswordExample',
  },

  // ── Templates ─────────────────────────────────────────────────────────────
  {
    id: 'business-invoice',
    name: 'Business Invoice',
    category: 'Templates',
    description: 'Professional invoice with company branding, line-items table, totals, and payment details.',
    filename: 'business-invoice.pdf',
    generate: businessInvoice,
    dotnetClass: 'BusinessInvoiceExample',
  },
  {
    id: 'user-directory',
    name: 'User Directory',
    category: 'Templates',
    description: 'Landscape A4, 50-row table with alternating row colors, status badges, and repeated headers.',
    filename: 'user-directory.pdf',
    generate: userDirectory,
    dotnetClass: 'UserDirectoryExample',
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
  },
  {
    id: 'financial-dashboard',
    name: 'Financial Dashboard',
    category: 'Templates',
    description:
      'Single-page A4 quarterly report with a full-bleed header, four KPI metrics, a 12-month bar chart, and a top-products table — all styled with a warm earth-tone palette.',
    filename: 'financial-dashboard.pdf',
    generate: financialDashboard,
    dotnetClass: null,
  },
];
