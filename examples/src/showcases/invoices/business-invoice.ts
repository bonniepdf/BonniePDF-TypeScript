import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  TextBlock,
  TextStyle,
  TextAlignment,
  Heading,
  VerticalStack,
  Container,
  Table,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  Placeholders,
  PdfAConformance,
} from '@bonniepdf/core';

// ── Brand colors ──────────────────────────────────────────────────────────────
const ACCENT_GREEN = Color.fromHex('#0B9444');
const ACCENT_GREEN_LIGHT = Color.fromHex('#E8F5EC');
const HEADER_GRAY = Color.fromHex('#F5F5F5');
const BORDER_GRAY = Color.fromHex('#D9D9D9');
const TEXT_DARK = Color.fromHex('#333333');
const TEXT_MEDIUM = Color.fromHex('#555555');
const TEXT_LIGHT = Color.fromHex('#888888');

export function generate(): Document {
  const now = new Date();
  const year = now.getFullYear();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${year}`;
  const dueDate = new Date(now.getTime() + 14 * 86400000);
  const dueDateStr = `${String(dueDate.getMonth() + 1).padStart(2, '0')}/${String(dueDate.getDate()).padStart(2, '0')}/${dueDate.getFullYear()}`;

  const settings = new DocumentSettings(PdfSize.a4, 36);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-US';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(TEXT_MEDIUM);

  const metadata = new DocumentMetadata();
  metadata.title = `Invoice INV-${year}-001`;
  metadata.author = 'Studio Eleven';
  metadata.subject = 'Invoice for design and development services.';

  const doc = new Document(settings, metadata);
  const mainStack = new VerticalStack();

  // ── Green accent bar ──────────────────────────────────────────────────────
  const accentBar = new Container();
  accentBar.backgroundColor = ACCENT_GREEN;
  accentBar.padding = new Thickness(0, 4, 0, 4);
  accentBar.child = new TextBlock(' ');
  (accentBar.child as TextBlock).fontSize = 1;
  mainStack.addChild(accentBar);

  // ── Header: Company | Invoice title ──────────────────────────────────────
  const headerTable = new Table(1.2, 1);
  headerTable.cellPadding = 0;
  headerTable.border = Border.none;
  headerTable.margin = new Thickness(0, 16, 0, 16);

  const companyStack = new VerticalStack();
  const studioElevenText = new TextBlock('STUDIO ELEVEN');
  studioElevenText.fontName = StandardFonts.HelveticaBold;
  studioElevenText.fontSize = 20;
  studioElevenText.textColor = TEXT_DARK;
  studioElevenText.margin = new Thickness(0, 0, 0, 4);
  companyStack.addChild(studioElevenText);
  const designDistrictText = new TextBlock('42 Design District');
  designDistrictText.fontName = StandardFonts.Helvetica;
  designDistrictText.fontSize = 9;
  designDistrictText.textColor = TEXT_MEDIUM;
  companyStack.addChild(designDistrictText);
  const brooklynNyText = new TextBlock('Brooklyn, NY 11201');
  brooklynNyText.fontName = StandardFonts.Helvetica;
  brooklynNyText.fontSize = 9;
  brooklynNyText.textColor = TEXT_MEDIUM;
  companyStack.addChild(brooklynNyText);
  const phoneText = new TextBlock('Phone  (555) 123-4567');
  phoneText.fontName = StandardFonts.Helvetica;
  phoneText.fontSize = 9;
  phoneText.textColor = TEXT_MEDIUM;
  companyStack.addChild(phoneText);
  const emailHelloStudioelevenCoText = new TextBlock('Email  hello@studioeleven.co');
  emailHelloStudioelevenCoText.fontName = StandardFonts.Helvetica;
  emailHelloStudioelevenCoText.fontSize = 9;
  emailHelloStudioelevenCoText.textColor = TEXT_MEDIUM;
  companyStack.addChild(emailHelloStudioelevenCoText);

  // H1 heading - visually identical to a styled TextBlock but carries
  // the semantic role for screen readers (PDF/UA-1 Matterhorn §14-1).
  const invoiceTitle = new Heading('Invoice');
  invoiceTitle.level = 1;
  invoiceTitle.fontName = StandardFonts.HelveticaBold;
  invoiceTitle.fontSize = 28;
  invoiceTitle.textColor = ACCENT_GREEN;
  invoiceTitle.alignment = TextAlignment.Right;

  const titleStack = new VerticalStack();
  titleStack.addChild(invoiceTitle);

  const companyCell = new Container();
  companyCell.child = companyStack;
  const titleCell = new Container();
  titleCell.child = titleStack;
  headerTable.addRow(companyCell, titleCell);
  mainStack.addChild(headerTable);

  // ── Bill To / Ship To / Details ───────────────────────────────────────────
  const addressTable = new Table(1, 1, 1.1);
  addressTable.cellPadding = 10;
  addressTable.border = new Border(0.5);
  addressTable.borderColors = new BorderColors(BORDER_GRAY);
  addressTable.margin = new Thickness(0, 0, 0, 16);

  const billToStack = new VerticalStack();
  const billToText = new TextBlock('Bill to');
  billToText.fontName = StandardFonts.HelveticaBold;
  billToText.fontSize = 9;
  billToText.textColor = TEXT_DARK;
  billToText.margin = new Thickness(0, 0, 0, 4);
  billToStack.addChild(billToText);
  const meridianLabsText = new TextBlock('Meridian Labs');
  meridianLabsText.fontName = StandardFonts.Helvetica;
  meridianLabsText.fontSize = 9;
  meridianLabsText.textColor = TEXT_MEDIUM;
  billToStack.addChild(meridianLabsText);
  const sarahChenText = new TextBlock('Sarah Chen');
  sarahChenText.fontName = StandardFonts.Helvetica;
  sarahChenText.fontSize = 9;
  sarahChenText.textColor = TEXT_MEDIUM;
  billToStack.addChild(sarahChenText);
  const innovationWayText = new TextBlock('88 Innovation Way');
  innovationWayText.fontName = StandardFonts.Helvetica;
  innovationWayText.fontSize = 9;
  innovationWayText.textColor = TEXT_MEDIUM;
  billToStack.addChild(innovationWayText);
  const austinTxText = new TextBlock('Austin, TX 78701');
  austinTxText.fontName = StandardFonts.Helvetica;
  austinTxText.fontSize = 9;
  austinTxText.textColor = TEXT_MEDIUM;
  billToStack.addChild(austinTxText);

  const shipToStack = new VerticalStack();
  const shipToText = new TextBlock('Ship to');
  shipToText.fontName = StandardFonts.HelveticaBold;
  shipToText.fontSize = 9;
  shipToText.textColor = TEXT_DARK;
  shipToText.margin = new Thickness(0, 0, 0, 4);
  shipToStack.addChild(shipToText);
  const meridianLabsText2 = new TextBlock('Meridian Labs');
  meridianLabsText2.fontName = StandardFonts.Helvetica;
  meridianLabsText2.fontSize = 9;
  meridianLabsText2.textColor = TEXT_MEDIUM;
  shipToStack.addChild(meridianLabsText2);
  const sarahChenText2 = new TextBlock('Sarah Chen');
  sarahChenText2.fontName = StandardFonts.Helvetica;
  sarahChenText2.fontSize = 9;
  sarahChenText2.textColor = TEXT_MEDIUM;
  shipToStack.addChild(sarahChenText2);
  const innovationWayText2 = new TextBlock('88 Innovation Way');
  innovationWayText2.fontName = StandardFonts.Helvetica;
  innovationWayText2.fontSize = 9;
  innovationWayText2.textColor = TEXT_MEDIUM;
  shipToStack.addChild(innovationWayText2);
  const austinTxText2 = new TextBlock('Austin, TX 78701');
  austinTxText2.fontName = StandardFonts.Helvetica;
  austinTxText2.fontSize = 9;
  austinTxText2.textColor = TEXT_MEDIUM;
  shipToStack.addChild(austinTxText2);

  const detailsStack = new VerticalStack();
  const detailsText = new TextBlock('Details');
  detailsText.fontName = StandardFonts.HelveticaBold;
  detailsText.fontSize = 9;
  detailsText.textColor = TEXT_DARK;
  detailsText.margin = new Thickness(0, 0, 0, 4);
  detailsStack.addChild(detailsText);

  const invoiceNumberRow = new Table(0.9, 1);
  invoiceNumberRow.cellPadding = 0;
  invoiceNumberRow.border = Border.none;
  const invoiceText = new TextBlock('Invoice #');
  invoiceText.fontName = StandardFonts.HelveticaBold;
  invoiceText.fontSize = 9;
  invoiceText.textColor = TEXT_DARK;
  invoiceText.alignment = TextAlignment.Left;
  const yearText = new TextBlock(`${year}-001`);
  yearText.fontName = StandardFonts.Helvetica;
  yearText.fontSize = 9;
  yearText.textColor = TEXT_MEDIUM;
  yearText.alignment = TextAlignment.Left;
  invoiceNumberRow.addRow(invoiceText, yearText);
  detailsStack.addChild(invoiceNumberRow);

  const invoiceDateRow = new Table(0.9, 1);
  invoiceDateRow.cellPadding = 0;
  invoiceDateRow.border = Border.none;
  const invoiceDateText = new TextBlock('Invoice date');
  invoiceDateText.fontName = StandardFonts.HelveticaBold;
  invoiceDateText.fontSize = 9;
  invoiceDateText.textColor = TEXT_DARK;
  invoiceDateText.alignment = TextAlignment.Left;
  const datestrText = new TextBlock(dateStr);
  datestrText.fontName = StandardFonts.Helvetica;
  datestrText.fontSize = 9;
  datestrText.textColor = TEXT_MEDIUM;
  datestrText.alignment = TextAlignment.Left;
  invoiceDateRow.addRow(invoiceDateText, datestrText);
  detailsStack.addChild(invoiceDateRow);

  const termsRow = new Table(0.9, 1);
  termsRow.cellPadding = 0;
  termsRow.border = Border.none;
  const termsText = new TextBlock('Terms');
  termsText.fontName = StandardFonts.HelveticaBold;
  termsText.fontSize = 9;
  termsText.textColor = TEXT_DARK;
  termsText.alignment = TextAlignment.Left;
  const netText = new TextBlock('Net 14');
  netText.fontName = StandardFonts.Helvetica;
  netText.fontSize = 9;
  netText.textColor = TEXT_MEDIUM;
  netText.alignment = TextAlignment.Left;
  termsRow.addRow(termsText, netText);
  detailsStack.addChild(termsRow);

  const dueDateRow = new Table(0.9, 1);
  dueDateRow.cellPadding = 0;
  dueDateRow.border = Border.none;
  const dueDateText = new TextBlock('Due date');
  dueDateText.fontName = StandardFonts.HelveticaBold;
  dueDateText.fontSize = 9;
  dueDateText.textColor = TEXT_DARK;
  dueDateText.alignment = TextAlignment.Left;
  const duedatestrText = new TextBlock(dueDateStr);
  duedatestrText.fontName = StandardFonts.Helvetica;
  duedatestrText.fontSize = 9;
  duedatestrText.textColor = TEXT_MEDIUM;
  duedatestrText.alignment = TextAlignment.Left;
  dueDateRow.addRow(dueDateText, duedatestrText);
  detailsStack.addChild(dueDateRow);

  const billCell = new Container();
  billCell.child = billToStack;
  const shipCell = new Container();
  shipCell.child = shipToStack;
  const detailsCell = new Container();
  detailsCell.child = detailsStack;
  addressTable.addRow(billCell, shipCell, detailsCell);
  mainStack.addChild(addressTable);

  // ── Line Items Table ──────────────────────────────────────────────────────
  const lineItemsTable = new Table(2.2, 2.5, 0.8, 0.8, 1);
  lineItemsTable.cellPadding = 8;
  lineItemsTable.border = Border.none;
  lineItemsTable.headerBackgroundColor = HEADER_GRAY;
  lineItemsTable.headerTextColor = TEXT_DARK;
  lineItemsTable.margin = new Thickness(0, 0, 0, 0);

  const productServiceText = new TextBlock('Product / Service');
  productServiceText.fontName = StandardFonts.HelveticaBold;
  productServiceText.fontSize = 9;
  productServiceText.textColor = TEXT_DARK;
  productServiceText.alignment = TextAlignment.Left;
  const descriptionText = new TextBlock('Description');
  descriptionText.fontName = StandardFonts.HelveticaBold;
  descriptionText.fontSize = 9;
  descriptionText.textColor = TEXT_DARK;
  descriptionText.alignment = TextAlignment.Left;
  const qtyHrsText = new TextBlock('Qty / Hrs');
  qtyHrsText.fontName = StandardFonts.HelveticaBold;
  qtyHrsText.fontSize = 9;
  qtyHrsText.textColor = TEXT_DARK;
  qtyHrsText.alignment = TextAlignment.Center;
  const rateText = new TextBlock('Rate');
  rateText.fontName = StandardFonts.HelveticaBold;
  rateText.fontSize = 9;
  rateText.textColor = TEXT_DARK;
  rateText.alignment = TextAlignment.Right;
  const amountText = new TextBlock('Amount');
  amountText.fontName = StandardFonts.HelveticaBold;
  amountText.fontSize = 9;
  amountText.textColor = TEXT_DARK;
  amountText.alignment = TextAlignment.Right;
  lineItemsTable.addHeader(productServiceText, descriptionText, qtyHrsText, rateText, amountText);

  const invoiceSource = Placeholders.withSeed(42);
  const lineItems = invoiceSource.invoiceLines(5);
  const items = lineItems.map(li => ({
    service: li.service,
    desc: li.description,
    qty: li.quantity,
    price: li.unitPrice,
  }));

  let subtotal = 0;
  for (const item of items) {
    const lineTotal = item.qty * item.price;
    subtotal += lineTotal;
    const itemServiceText = new TextBlock(item.service);
    itemServiceText.fontName = StandardFonts.Helvetica;
    itemServiceText.fontSize = 9;
    itemServiceText.textColor = TEXT_MEDIUM;
    itemServiceText.alignment = TextAlignment.Left;
    const itemDescText = new TextBlock(item.desc);
    itemDescText.fontName = StandardFonts.Helvetica;
    itemDescText.fontSize = 9;
    itemDescText.textColor = TEXT_LIGHT;
    itemDescText.alignment = TextAlignment.Left;
    const stringItemQtyText = new TextBlock(String(item.qty));
    stringItemQtyText.fontName = StandardFonts.Helvetica;
    stringItemQtyText.fontSize = 9;
    stringItemQtyText.textColor = TEXT_MEDIUM;
    stringItemQtyText.alignment = TextAlignment.Center;
    const itemPriceTolocalestringEnUsText = new TextBlock(
      `$${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    );
    itemPriceTolocalestringEnUsText.fontName = StandardFonts.Helvetica;
    itemPriceTolocalestringEnUsText.fontSize = 9;
    itemPriceTolocalestringEnUsText.textColor = TEXT_MEDIUM;
    itemPriceTolocalestringEnUsText.alignment = TextAlignment.Right;
    const linetotalTolocalestringEnUsMinimumfractiondigitsText = new TextBlock(
      `$${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    );
    linetotalTolocalestringEnUsMinimumfractiondigitsText.fontName = StandardFonts.Helvetica;
    linetotalTolocalestringEnUsMinimumfractiondigitsText.fontSize = 9;
    linetotalTolocalestringEnUsMinimumfractiondigitsText.textColor = TEXT_DARK;
    linetotalTolocalestringEnUsMinimumfractiondigitsText.alignment = TextAlignment.Right;
    lineItemsTable.addRow(
      itemServiceText,
      itemDescText,
      stringItemQtyText,
      itemPriceTolocalestringEnUsText,
      linetotalTolocalestringEnUsMinimumfractiondigitsText
    );
  }
  mainStack.addChild(lineItemsTable);

  // Divider line
  const divider = new Container();
  divider.backgroundColor = ACCENT_GREEN;
  divider.padding = new Thickness(0, 0.75, 0, 0);
  divider.margin = new Thickness(0, 0, 0, 12);
  divider.child = new TextBlock(' ');
  (divider.child as TextBlock).fontSize = 1;
  mainStack.addChild(divider);

  // ── Footer: message + totals ──────────────────────────────────────────────
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;
  const totalDue = total - 1400;

  const footerTable = new Table(1.3, 1);
  footerTable.cellPadding = 0;
  footerTable.border = Border.none;

  const messageStack = new VerticalStack();
  const customerMessageText = new TextBlock('Customer message');
  customerMessageText.fontName = StandardFonts.HelveticaBold;
  customerMessageText.fontSize = 9;
  customerMessageText.textColor = TEXT_DARK;
  customerMessageText.margin = new Thickness(0, 0, 0, 4);
  messageStack.addChild(customerMessageText);
  const helloText = new TextBlock('Hello!');
  helloText.fontName = StandardFonts.Helvetica;
  helloText.fontSize = 9;
  helloText.textColor = TEXT_MEDIUM;
  messageStack.addChild(helloText);
  const thankChoosingStudioElevenText = new TextBlock('Thank you for choosing Studio Eleven.');
  thankChoosingStudioElevenText.fontName = StandardFonts.Helvetica;
  thankChoosingStudioElevenText.fontSize = 9;
  thankChoosingStudioElevenText.textColor = TEXT_MEDIUM;
  messageStack.addChild(thankChoosingStudioElevenText);
  const pleaseReturnInvoicePaymentText = new TextBlock('Please return this invoice with payment.');
  pleaseReturnInvoicePaymentText.fontName = StandardFonts.Helvetica;
  pleaseReturnInvoicePaymentText.fontSize = 9;
  pleaseReturnInvoicePaymentText.textColor = TEXT_MEDIUM;
  messageStack.addChild(pleaseReturnInvoicePaymentText);
  const thanksText = new TextBlock('Thanks!');
  thanksText.fontName = StandardFonts.Helvetica;
  thanksText.fontSize = 9;
  thanksText.textColor = TEXT_MEDIUM;
  thanksText.margin = new Thickness(0, 4, 0, 0);
  messageStack.addChild(thanksText);

  const totalsStack = new VerticalStack();

  const subtotalRow = new Table(1, 1);
  subtotalRow.cellPadding = 6;
  subtotalRow.border = Border.none;
  const subtotalText = new TextBlock('Subtotal');
  subtotalText.fontName = StandardFonts.Helvetica;
  subtotalText.fontSize = 9;
  subtotalText.textColor = TEXT_MEDIUM;
  subtotalText.alignment = TextAlignment.Left;
  const subtotalTolocalestringEnUsMinimumfractiondigitsText = new TextBlock(
    `$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );
  subtotalTolocalestringEnUsMinimumfractiondigitsText.fontName = StandardFonts.Helvetica;
  subtotalTolocalestringEnUsMinimumfractiondigitsText.fontSize = 9;
  subtotalTolocalestringEnUsMinimumfractiondigitsText.textColor = TEXT_DARK;
  subtotalTolocalestringEnUsMinimumfractiondigitsText.alignment = TextAlignment.Right;
  subtotalRow.addRow(subtotalText, subtotalTolocalestringEnUsMinimumfractiondigitsText);
  totalsStack.addChild(subtotalRow);

  const taxRow = new Table(1, 1);
  taxRow.cellPadding = 6;
  taxRow.border = Border.none;
  const salesTaxText = new TextBlock('Sales tax (8.25%)');
  salesTaxText.fontName = StandardFonts.Helvetica;
  salesTaxText.fontSize = 9;
  salesTaxText.textColor = TEXT_MEDIUM;
  salesTaxText.alignment = TextAlignment.Left;
  const taxTolocalestringEnUsMinimumfractiondigitsText = new TextBlock(
    `$${tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );
  taxTolocalestringEnUsMinimumfractiondigitsText.fontName = StandardFonts.Helvetica;
  taxTolocalestringEnUsMinimumfractiondigitsText.fontSize = 9;
  taxTolocalestringEnUsMinimumfractiondigitsText.textColor = TEXT_DARK;
  taxTolocalestringEnUsMinimumfractiondigitsText.alignment = TextAlignment.Right;
  taxRow.addRow(salesTaxText, taxTolocalestringEnUsMinimumfractiondigitsText);
  totalsStack.addChild(taxRow);

  const discountRow = new Table(1, 1);
  discountRow.cellPadding = 6;
  discountRow.border = Border.none;
  const discountEarlyPaymentText = new TextBlock('Discount (early payment)');
  discountEarlyPaymentText.fontName = StandardFonts.Helvetica;
  discountEarlyPaymentText.fontSize = 9;
  discountEarlyPaymentText.textColor = ACCENT_GREEN;
  discountEarlyPaymentText.alignment = TextAlignment.Left;
  const discountAmountText = new TextBlock('-$1,400.00');
  discountAmountText.fontName = StandardFonts.Helvetica;
  discountAmountText.fontSize = 9;
  discountAmountText.textColor = ACCENT_GREEN;
  discountAmountText.alignment = TextAlignment.Right;
  discountRow.addRow(discountEarlyPaymentText, discountAmountText);
  totalsStack.addChild(discountRow);

  // Thin divider before total
  const totalDivider = new Container();
  totalDivider.backgroundColor = TEXT_DARK;
  totalDivider.padding = new Thickness(0, 0.5, 0, 0);
  totalDivider.margin = new Thickness(0, 4, 0, 4);
  totalDivider.child = new TextBlock(' ');
  (totalDivider.child as TextBlock).fontSize = 1;
  totalsStack.addChild(totalDivider);

  const totalRow = new Table(1, 1);
  totalRow.cellPadding = 6;
  totalRow.border = Border.none;
  const totalText = new TextBlock('Total');
  totalText.fontName = StandardFonts.HelveticaBold;
  totalText.fontSize = 14;
  totalText.textColor = TEXT_DARK;
  totalText.alignment = TextAlignment.Left;
  const totaldueTolocalestringEnUsMinimumfractiondigitsText = new TextBlock(
    `$${totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  );
  totaldueTolocalestringEnUsMinimumfractiondigitsText.fontName = StandardFonts.HelveticaBold;
  totaldueTolocalestringEnUsMinimumfractiondigitsText.fontSize = 14;
  totaldueTolocalestringEnUsMinimumfractiondigitsText.textColor = TEXT_DARK;
  totaldueTolocalestringEnUsMinimumfractiondigitsText.alignment = TextAlignment.Right;
  totalRow.addRow(totalText, totaldueTolocalestringEnUsMinimumfractiondigitsText);
  totalsStack.addChild(totalRow);

  const msgContainer = new Container();
  msgContainer.child = messageStack;
  msgContainer.padding = new Thickness(0, 0, 40, 0);

  const totContainer = new Container();
  totContainer.child = totalsStack;

  footerTable.addRow(msgContainer, totContainer);
  mainStack.addChild(footerTable);

  // ── Payment details ───────────────────────────────────────────────────────
  const paymentTable = new Table(1, 1, 1);
  paymentTable.cellPadding = 0;
  paymentTable.border = Border.none;

  // Bank
  const bankStack = new VerticalStack();
  const bankTransferText = new TextBlock('Bank Transfer');
  bankTransferText.fontName = StandardFonts.HelveticaBold;
  bankTransferText.fontSize = 8;
  bankTransferText.textColor = ACCENT_GREEN;
  bankTransferText.margin = new Thickness(0, 0, 0, 4);
  bankStack.addChild(bankTransferText);
  const chaseBankText = new TextBlock('Chase Bank');
  chaseBankText.fontName = StandardFonts.Helvetica;
  chaseBankText.fontSize = 8;
  chaseBankText.textColor = TEXT_MEDIUM;
  bankStack.addChild(chaseBankText);
  const routingText = new TextBlock('Routing: 021000021');
  routingText.fontName = StandardFonts.Helvetica;
  routingText.fontSize = 8;
  routingText.textColor = TEXT_MEDIUM;
  bankStack.addChild(routingText);
  const accountText = new TextBlock('Account: ****7842');
  accountText.fontName = StandardFonts.Helvetica;
  accountText.fontSize = 8;
  accountText.textColor = TEXT_MEDIUM;
  bankStack.addChild(accountText);

  // Other
  const otherStack = new VerticalStack();
  const otherMethodsText = new TextBlock('Other Methods');
  otherMethodsText.fontName = StandardFonts.HelveticaBold;
  otherMethodsText.fontSize = 8;
  otherMethodsText.textColor = ACCENT_GREEN;
  otherMethodsText.margin = new Thickness(0, 0, 0, 4);
  otherStack.addChild(otherMethodsText);
  const paypalPayStudioelevenCoText = new TextBlock('PayPal: pay@studioeleven.co');
  paypalPayStudioelevenCoText.fontName = StandardFonts.Helvetica;
  paypalPayStudioelevenCoText.fontSize = 8;
  paypalPayStudioelevenCoText.textColor = TEXT_MEDIUM;
  otherStack.addChild(paypalPayStudioelevenCoText);
  const wiseStudioelevenText = new TextBlock('Wise: @studioeleven');
  wiseStudioelevenText.fontName = StandardFonts.Helvetica;
  wiseStudioelevenText.fontSize = 8;
  wiseStudioelevenText.textColor = TEXT_MEDIUM;
  otherStack.addChild(wiseStudioelevenText);

  // Reference
  const refStack = new VerticalStack();
  const referenceText = new TextBlock('Reference');
  referenceText.fontName = StandardFonts.HelveticaBold;
  referenceText.fontSize = 8;
  referenceText.textColor = ACCENT_GREEN;
  referenceText.margin = new Thickness(0, 0, 0, 4);
  refStack.addChild(referenceText);
  const pleaseIncludeInvoiceText = new TextBlock('Please include invoice');
  pleaseIncludeInvoiceText.fontName = StandardFonts.Helvetica;
  pleaseIncludeInvoiceText.fontSize = 8;
  pleaseIncludeInvoiceText.textColor = TEXT_MEDIUM;
  refStack.addChild(pleaseIncludeInvoiceText);
  const numberPaymentText = new TextBlock('number with payment');
  numberPaymentText.fontName = StandardFonts.Helvetica;
  numberPaymentText.fontSize = 8;
  numberPaymentText.textColor = TEXT_MEDIUM;
  refStack.addChild(numberPaymentText);

  const bankContainer = new Container();
  bankContainer.child = bankStack;
  const otherContainer = new Container();
  otherContainer.child = otherStack;
  const refContainer = new Container();
  refContainer.child = refStack;
  paymentTable.addRow(bankContainer, otherContainer, refContainer);

  const paymentSection = new Container();
  paymentSection.backgroundColor = ACCENT_GREEN_LIGHT;
  paymentSection.padding = new Thickness(16, 12, 16, 12);
  paymentSection.margin = new Thickness(0, 20, 0, 0);
  paymentSection.border = Border.leftOnly(3);
  paymentSection.borderColors = BorderColors.leftOnly(ACCENT_GREEN);
  paymentSection.child = paymentTable;
  mainStack.addChild(paymentSection);

  // ── Footer bar ────────────────────────────────────────────────────────────
  const footerBar = new Container();
  footerBar.backgroundColor = ACCENT_GREEN;
  footerBar.padding = new Thickness(0, 0.5, 0, 0);
  footerBar.margin = new Thickness(0, 20, 0, 0);
  footerBar.child = new TextBlock(' ');
  (footerBar.child as TextBlock).fontSize = 1;
  mainStack.addChild(footerBar);

  const footerNote = new TextBlock('Thank you for your business  |  hello@studioeleven.co  |  www.studioeleven.co');
  footerNote.fontName = StandardFonts.Helvetica;
  footerNote.fontSize = 8;
  footerNote.textColor = TEXT_LIGHT;
  footerNote.margin = new Thickness(0, 8, 0, 0);
  footerNote.alignment = TextAlignment.Center;
  mainStack.addChild(footerNote);

  doc.add(mainStack);
  return doc;
}
