import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  AccessibilityMode,
  PageOrientation,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  Container,
  Table,
  Grid,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  ChartData,
  ChartSeries,
  ChartDataPoint,
  BarChart,
  PdfAConformance,
} from '@bonniepdf/core';

// ── Brand colours - drawn from the BonniePDF logo palette ────────────────────
const ESPRESSO = Color.fromHex('#442714');
const TERRA = Color.fromHex('#956b51');
const BROWN = Color.fromHex('#805e48');
const SAND = Color.fromHex('#d2c8b7');
const CREAM = Color.fromHex('#f4f1ef');
const HEADER_MUTE = Color.fromHex('#b99a88');
const ROW_ALT = Color.fromHex('#e8e0d8');
const DELTA_POS = Color.fromHex('#2d7a3a');
const DELTA_NEG = Color.fromHex('#b94040');

// ── Main ──────────────────────────────────────────────────────────────────────
export function generate(): Document {
  // Landscape, zero margin - layout elements carry their own padding
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape, 0);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(ColorPalette.slate[600]);
  settings.pageColor = CREAM;

  const today = new Date();
  const currentQuarter = Math.floor(today.getMonth() / 3) + 1;
  const quarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
  const year = currentQuarter === 1 ? today.getFullYear() - 1 : today.getFullYear();
  const quarterLabel = `Q${quarter} ${year}`;
  const title = `${quarterLabel} Financial Report`;
  const generated = `Generated ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(today)}`;

  const metadata = new DocumentMetadata();
  metadata.title = title;
  metadata.author = 'Sample Company';
  metadata.subject = `${quarterLabel} financial dashboard - KPIs, monthly revenue chart, and product breakdown`;

  const doc = new Document(settings, metadata);

  // ════════════════════════════════════════════════════════════════════════════
  // 1.  Header bar
  // ════════════════════════════════════════════════════════════════════════════

  const companyStack = new VerticalStack();
  const companyText = new TextBlock('Sample Company');
  companyText.fontName = StandardFonts.HelveticaBold;
  companyText.fontSize = 14;
  companyText.textColor = CREAM;
  companyStack.addChild(companyText);
  const confidentialInternalUseOnlyText = new TextBlock('Confidential - Internal Use Only');
  confidentialInternalUseOnlyText.fontName = StandardFonts.Helvetica;
  confidentialInternalUseOnlyText.fontSize = 8;
  confidentialInternalUseOnlyText.textColor = HEADER_MUTE;
  confidentialInternalUseOnlyText.margin = new Thickness(0, 5, 0, 0);
  companyStack.addChild(confidentialInternalUseOnlyText);

  const reportTitle = new TextBlock(title);
  reportTitle.fontName = StandardFonts.HelveticaBold;
  reportTitle.fontSize = 13;
  reportTitle.textColor = CREAM;
  reportTitle.alignment = TextAlignment.Right;

  const reportDate = new TextBlock(generated);
  reportDate.fontName = StandardFonts.Helvetica;
  reportDate.fontSize = 8;
  reportDate.textColor = HEADER_MUTE;
  reportDate.alignment = TextAlignment.Right;
  reportDate.margin = new Thickness(0, 5, 0, 0);

  const reportStack = new VerticalStack();
  reportStack.addChild(reportTitle);
  reportStack.addChild(reportDate);

  const headerLayout = new Grid(1, 1);
  headerLayout.border = Border.none;
  headerLayout.cellPadding = 0;

  headerLayout.addRow(companyStack, reportStack);

  const header = new Container();
  header.backgroundColor = ESPRESSO;
  header.padding = new Thickness(24, 20, 24, 20);
  header.child = headerLayout;

  doc.add(header);

  // ════════════════════════════════════════════════════════════════════════════
  // 2.  KPI strip - four equal-width metric cards
  // ════════════════════════════════════════════════════════════════════════════

  const totalRevenueStack = new VerticalStack();
  const totalRevenueValueText = new TextBlock('£2.41M');
  totalRevenueValueText.fontName = StandardFonts.HelveticaBold;
  totalRevenueValueText.fontSize = 18;
  totalRevenueValueText.textColor = ESPRESSO;
  totalRevenueStack.addChild(totalRevenueValueText);
  const totalRevenueText = new TextBlock('TOTAL REVENUE');
  totalRevenueText.fontName = StandardFonts.Helvetica;
  totalRevenueText.fontSize = 7;
  totalRevenueText.textColor = BROWN;
  totalRevenueText.margin = new Thickness(0, 4, 0, 0);
  totalRevenueStack.addChild(totalRevenueText);
  const totalRevenueDeltaText = new TextBlock('↑ 18.3% YoY');
  totalRevenueDeltaText.fontName = StandardFonts.HelveticaBold;
  totalRevenueDeltaText.fontSize = 7;
  totalRevenueDeltaText.textColor = DELTA_POS;
  totalRevenueDeltaText.margin = new Thickness(0, 4, 0, 0);
  totalRevenueStack.addChild(totalRevenueDeltaText);
  const totalRevenueCell = new Container();
  totalRevenueCell.child = totalRevenueStack;
  totalRevenueCell.padding = new Thickness(20, 16, 20, 16);

  const grossProfitStack = new VerticalStack();
  const grossProfitValueText = new TextBlock('£640K');
  grossProfitValueText.fontName = StandardFonts.HelveticaBold;
  grossProfitValueText.fontSize = 18;
  grossProfitValueText.textColor = ESPRESSO;
  grossProfitStack.addChild(grossProfitValueText);
  const grossProfitText = new TextBlock('GROSS PROFIT');
  grossProfitText.fontName = StandardFonts.Helvetica;
  grossProfitText.fontSize = 7;
  grossProfitText.textColor = BROWN;
  grossProfitText.margin = new Thickness(0, 4, 0, 0);
  grossProfitStack.addChild(grossProfitText);
  const grossProfitDeltaText = new TextBlock('↑ 11.7% YoY');
  grossProfitDeltaText.fontName = StandardFonts.HelveticaBold;
  grossProfitDeltaText.fontSize = 7;
  grossProfitDeltaText.textColor = DELTA_POS;
  grossProfitDeltaText.margin = new Thickness(0, 4, 0, 0);
  grossProfitStack.addChild(grossProfitDeltaText);
  const grossProfitCell = new Container();
  grossProfitCell.child = grossProfitStack;
  grossProfitCell.padding = new Thickness(20, 16, 20, 16);
  grossProfitCell.border = Border.leftOnly(0.75);
  grossProfitCell.borderColors = BorderColors.leftOnly(SAND);

  const newCustomersStack = new VerticalStack();
  const newCustomersValueText = new TextBlock('3,814');
  newCustomersValueText.fontName = StandardFonts.HelveticaBold;
  newCustomersValueText.fontSize = 18;
  newCustomersValueText.textColor = ESPRESSO;
  newCustomersStack.addChild(newCustomersValueText);
  const newCustomersText = new TextBlock('NEW CUSTOMERS');
  newCustomersText.fontName = StandardFonts.Helvetica;
  newCustomersText.fontSize = 7;
  newCustomersText.textColor = BROWN;
  newCustomersText.margin = new Thickness(0, 4, 0, 0);
  newCustomersStack.addChild(newCustomersText);
  const newCustomersDeltaText = new TextBlock('↑ 24.1% YoY');
  newCustomersDeltaText.fontName = StandardFonts.HelveticaBold;
  newCustomersDeltaText.fontSize = 7;
  newCustomersDeltaText.textColor = DELTA_POS;
  newCustomersDeltaText.margin = new Thickness(0, 4, 0, 0);
  newCustomersStack.addChild(newCustomersDeltaText);
  const newCustomersCell = new Container();
  newCustomersCell.child = newCustomersStack;
  newCustomersCell.padding = new Thickness(20, 16, 20, 16);
  newCustomersCell.border = Border.leftOnly(0.75);
  newCustomersCell.borderColors = BorderColors.leftOnly(SAND);

  const satisfactionStack = new VerticalStack();
  const satisfactionValueText = new TextBlock('94.2%');
  satisfactionValueText.fontName = StandardFonts.HelveticaBold;
  satisfactionValueText.fontSize = 18;
  satisfactionValueText.textColor = ESPRESSO;
  satisfactionStack.addChild(satisfactionValueText);
  const satisfactionText = new TextBlock('SATISFACTION');
  satisfactionText.fontName = StandardFonts.Helvetica;
  satisfactionText.fontSize = 7;
  satisfactionText.textColor = BROWN;
  satisfactionText.margin = new Thickness(0, 4, 0, 0);
  satisfactionStack.addChild(satisfactionText);
  const satisfactionDeltaText = new TextBlock('↓ 0.8%');
  satisfactionDeltaText.fontName = StandardFonts.HelveticaBold;
  satisfactionDeltaText.fontSize = 7;
  satisfactionDeltaText.textColor = DELTA_NEG;
  satisfactionDeltaText.margin = new Thickness(0, 4, 0, 0);
  satisfactionStack.addChild(satisfactionDeltaText);
  const satisfactionCell = new Container();
  satisfactionCell.child = satisfactionStack;
  satisfactionCell.padding = new Thickness(20, 16, 20, 16);
  satisfactionCell.border = Border.leftOnly(0.75);
  satisfactionCell.borderColors = BorderColors.leftOnly(SAND);

  const kpiTable = new Grid(1, 1, 1, 1);
  kpiTable.border = Border.none;
  kpiTable.cellPadding = 0;
  kpiTable.addRow(totalRevenueCell, grossProfitCell, newCustomersCell, satisfactionCell);

  doc.add(kpiTable);

  const kpiRuleSpacer = new TextBlock(' ');
  kpiRuleSpacer.fontSize = 1;
  const kpiRule = new Container();
  kpiRule.backgroundColor = SAND;
  kpiRule.padding = new Thickness(0, 0.75, 0, 0);
  kpiRule.child = kpiRuleSpacer;
  doc.add(kpiRule);

  // ════════════════════════════════════════════════════════════════════════════
  // 3.  Monthly revenue bar chart
  // ════════════════════════════════════════════════════════════════════════════

  const chartTitleCell = new Container();
  chartTitleCell.padding = new Thickness(24, 14, 24, 6);
  const monthlyRevenueTitleText = new TextBlock('MONTHLY REVENUE  (£000s)');
  monthlyRevenueTitleText.fontName = StandardFonts.HelveticaBold;
  monthlyRevenueTitleText.fontSize = 7;
  monthlyRevenueTitleText.textColor = TERRA;
  chartTitleCell.child = monthlyRevenueTitleText;
  doc.add(chartTitleCell);

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenue = [125, 146, 140, 175, 163, 190, 197, 182, 211, 226, 240, 233];

  const series = new ChartSeries();
  series.color = TERRA;
  series.dataPoints = MONTHS.map((label, i) => {
    const p = new ChartDataPoint();
    p.label = label;
    p.value = revenue[i];
    return p;
  });

  const chartData = new ChartData();
  chartData.series = [series];
  chartData.yAxis.prefix = '£';
  chartData.yAxis.maxValue = 250;
  chartData.yAxis.stepCount = 5;

  const barChart = new BarChart({
    data: chartData,
    altText: 'Bar chart of monthly revenue in thousands, ranging from 125 in January to 233 in December.',
  });
  barChart.height = 200;
  barChart.stretchToFit = true;
  barChart.barColor = TERRA;
  barChart.fontFamily = StandardFonts.Helvetica;
  barChart.labelFontSize = 8;
  doc.add(barChart);

  // ════════════════════════════════════════════════════════════════════════════
  // 4.  Top products table
  // ════════════════════════════════════════════════════════════════════════════

  const productRuleSpacer = new TextBlock(' ');
  productRuleSpacer.fontSize = 1;
  const productRule = new Container();
  productRule.backgroundColor = SAND;
  productRule.padding = new Thickness(0, 0.75, 0, 0);
  productRule.child = productRuleSpacer;
  doc.add(productRule);

  const tableTitleCell = new Container();
  tableTitleCell.padding = new Thickness(24, 14, 24, 6);
  const topProductsText = new TextBlock('TOP PRODUCTS');
  topProductsText.fontName = StandardFonts.HelveticaBold;
  topProductsText.fontSize = 7;
  topProductsText.textColor = TERRA;
  tableTitleCell.child = topProductsText;
  doc.add(tableTitleCell);

  const productTable = new Table(2.2, 1, 1.4, 0.8);
  productTable.border = new Border(0.5);
  productTable.borderColors = new BorderColors(SAND);
  productTable.cellPadding = 8;
  productTable.headerBackgroundColor = ROW_ALT;
  productTable.headerTextColor = ESPRESSO;

  const productText = new TextBlock('Product');
  productText.fontName = StandardFonts.HelveticaBold;
  productText.fontSize = 8;
  productText.textColor = ESPRESSO;
  productText.alignment = TextAlignment.Left;
  const unitsText = new TextBlock('Units');
  unitsText.fontName = StandardFonts.HelveticaBold;
  unitsText.fontSize = 8;
  unitsText.textColor = ESPRESSO;
  unitsText.alignment = TextAlignment.Right;
  const revenueText = new TextBlock('Revenue');
  revenueText.fontName = StandardFonts.HelveticaBold;
  revenueText.fontSize = 8;
  revenueText.textColor = ESPRESSO;
  revenueText.alignment = TextAlignment.Right;
  const marginText = new TextBlock('Margin');
  marginText.fontName = StandardFonts.HelveticaBold;
  marginText.fontSize = 8;
  marginText.textColor = ESPRESSO;
  marginText.alignment = TextAlignment.Right;
  productTable.addHeader(productText, unitsText, revenueText, marginText);

  const products = [
    { name: 'Enterprise Plan', units: '142', revenue: '£890,400', margin: '71%' },
    { name: 'Pro Plan', units: '1,204', revenue: '£722,400', margin: '64%' },
    { name: 'Starter Plan', units: '2,468', revenue: '£493,600', margin: '58%' },
    { name: 'Add-ons', units: '-', revenue: '£304,000', margin: '82%' },
  ];

  for (const p of products) {
    const pNameText = new TextBlock(p.name);
    pNameText.fontName = StandardFonts.Helvetica;
    pNameText.fontSize = 8;
    pNameText.textColor = ESPRESSO;
    pNameText.alignment = TextAlignment.Left;
    const pUnitsText = new TextBlock(p.units);
    pUnitsText.fontName = StandardFonts.Helvetica;
    pUnitsText.fontSize = 8;
    pUnitsText.textColor = BROWN;
    pUnitsText.alignment = TextAlignment.Right;
    const pRevenueText = new TextBlock(p.revenue);
    pRevenueText.fontName = StandardFonts.HelveticaBold;
    pRevenueText.fontSize = 8;
    pRevenueText.textColor = ESPRESSO;
    pRevenueText.alignment = TextAlignment.Right;
    const pMarginText = new TextBlock(p.margin);
    pMarginText.fontName = StandardFonts.Helvetica;
    pMarginText.fontSize = 8;
    pMarginText.textColor = BROWN;
    pMarginText.alignment = TextAlignment.Right;
    productTable.addRow(pNameText, pUnitsText, pRevenueText, pMarginText);
  }

  const tableCell = new Container();
  tableCell.padding = new Thickness(24, 0, 24, 20);
  tableCell.child = productTable;
  doc.add(tableCell);

  return doc;
}
