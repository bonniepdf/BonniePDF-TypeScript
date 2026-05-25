import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  Container,
  Table,
  TableRow,
  TableCell,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  asCell,
  cellBackground,
  cellPadding,
  cellBorder,
} from '@bonniepdf/core';

// ── Brand colors ──────────────────────────────────────────────────────────────
const AccentGreen = Color.fromHex('#0B9444');
const AccentGreenLight = Color.fromHex('#E8F5EC');
const HeaderGray = Color.fromHex('#F5F5F5');
const BorderGray = Color.fromHex('#D9D9D9');
const TextDark = Color.fromHex('#333333');
const TextMedium = Color.fromHex('#555555');
const TextLight = Color.fromHex('#888888');

// ── Helpers ───────────────────────────────────────────────────────────────────
function ta(b: TextBlock, a: TextAlignment): TextBlock {
  b.alignment = a;
  return b;
}
function alignLeft(b: TextBlock): TextBlock {
  return ta(b, TextAlignment.Left);
}
function alignCenter(b: TextBlock): TextBlock {
  return ta(b, TextAlignment.Center);
}
function alignRight(b: TextBlock): TextBlock {
  return ta(b, TextAlignment.Right);
}

function tb(text: string, font: string, size: number, color: Color, margin?: Thickness): TextBlock {
  const b = new TextBlock(text);
  b.fontName = font;
  b.fontSize = size;
  b.textColor = color;
  if (margin) b.margin = margin;
  return b;
}

function addDetailRow(stack: VerticalStack, label: string, value: string): void {
  const row = new Table(0.9, 1);
  row.cellPadding = 0;
  row.border = Border.none;
  row.addRow(
    alignLeft(tb(label, StandardFonts.HelveticaBold, 9, TextDark)),
    alignLeft(tb(value, StandardFonts.Helvetica, 9, TextMedium))
  );
  stack.addChild(row);
}

function createPaymentDetails(): Table {
  const paymentTable = new Table(1, 1, 1);
  paymentTable.cellPadding = 0;
  paymentTable.border = Border.none;

  // Bank
  const bankStack = new VerticalStack();
  bankStack.addChild(tb('Bank Transfer', StandardFonts.HelveticaBold, 8, AccentGreen, new Thickness(0, 0, 0, 4)));
  bankStack.addChild(tb('Chase Bank', StandardFonts.Helvetica, 8, TextMedium));
  bankStack.addChild(tb('Routing: 021000021', StandardFonts.Helvetica, 8, TextMedium));
  bankStack.addChild(tb('Account: ****7842', StandardFonts.Helvetica, 8, TextMedium));

  // Other
  const otherStack = new VerticalStack();
  otherStack.addChild(tb('Other Methods', StandardFonts.HelveticaBold, 8, AccentGreen, new Thickness(0, 0, 0, 4)));
  otherStack.addChild(tb('PayPal: pay@studioeleven.co', StandardFonts.Helvetica, 8, TextMedium));
  otherStack.addChild(tb('Wise: @studioeleven', StandardFonts.Helvetica, 8, TextMedium));

  // Reference
  const refStack = new VerticalStack();
  refStack.addChild(tb('Reference', StandardFonts.HelveticaBold, 8, AccentGreen, new Thickness(0, 0, 0, 4)));
  refStack.addChild(tb('Please include invoice', StandardFonts.Helvetica, 8, TextMedium));
  refStack.addChild(tb('number with payment', StandardFonts.Helvetica, 8, TextMedium));

  const bankContainer = new Container();
  bankContainer.child = bankStack;
  const otherContainer = new Container();
  otherContainer.child = otherStack;
  const refContainer = new Container();
  refContainer.child = refStack;
  paymentTable.addRow(bankContainer, otherContainer, refContainer);
  return paymentTable;
}

export function generate(): Document {
  const now = new Date();
  const year = now.getFullYear();
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const dateStr = `${pad2(now.getMonth() + 1)}/${pad2(now.getDate())}/${year}`;
  const dueDate = new Date(now.getTime() + 14 * 86400000);
  const dueDateStr = `${pad2(dueDate.getMonth() + 1)}/${pad2(dueDate.getDate())}/${dueDate.getFullYear()}`;

  const settings = new DocumentSettings(PdfSize.a4, 36);
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  const metadata = new DocumentMetadata();
  metadata.title = `Invoice INV-${year}-001`;
  metadata.author = 'Studio Eleven';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(TextMedium);
  const mainStack = new VerticalStack();

  // ── Green accent bar ──────────────────────────────────────────────────────
  const accentBar = new Container();
  accentBar.backgroundColor = AccentGreen;
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
  companyStack.addChild(tb('STUDIO ELEVEN', StandardFonts.HelveticaBold, 20, TextDark, new Thickness(0, 0, 0, 4)));
  companyStack.addChild(tb('42 Design District', StandardFonts.Helvetica, 9, TextMedium));
  companyStack.addChild(tb('Brooklyn, NY 11201', StandardFonts.Helvetica, 9, TextMedium));
  companyStack.addChild(tb('Phone  (555) 123-4567', StandardFonts.Helvetica, 9, TextMedium));
  companyStack.addChild(tb('Email  hello@studioeleven.co', StandardFonts.Helvetica, 9, TextMedium));

  const invoiceTitle = tb('Invoice', StandardFonts.HelveticaBold, 28, AccentGreen);
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
  addressTable.borderColors = new BorderColors(BorderGray);
  addressTable.margin = new Thickness(0, 0, 0, 16);

  const billToStack = new VerticalStack();
  billToStack.addChild(tb('Bill to', StandardFonts.HelveticaBold, 9, TextDark, new Thickness(0, 0, 0, 4)));
  billToStack.addChild(tb('Meridian Labs', StandardFonts.Helvetica, 9, TextMedium));
  billToStack.addChild(tb('Sarah Chen', StandardFonts.Helvetica, 9, TextMedium));
  billToStack.addChild(tb('88 Innovation Way', StandardFonts.Helvetica, 9, TextMedium));
  billToStack.addChild(tb('Austin, TX 78701', StandardFonts.Helvetica, 9, TextMedium));

  const shipToStack = new VerticalStack();
  shipToStack.addChild(tb('Ship to', StandardFonts.HelveticaBold, 9, TextDark, new Thickness(0, 0, 0, 4)));
  shipToStack.addChild(tb('Meridian Labs', StandardFonts.Helvetica, 9, TextMedium));
  shipToStack.addChild(tb('Sarah Chen', StandardFonts.Helvetica, 9, TextMedium));
  shipToStack.addChild(tb('88 Innovation Way', StandardFonts.Helvetica, 9, TextMedium));
  shipToStack.addChild(tb('Austin, TX 78701', StandardFonts.Helvetica, 9, TextMedium));

  const detailsStack = new VerticalStack();
  detailsStack.addChild(tb('Details', StandardFonts.HelveticaBold, 9, TextDark, new Thickness(0, 0, 0, 4)));
  addDetailRow(detailsStack, 'Invoice #', `${year}-001`);
  addDetailRow(detailsStack, 'Invoice date', dateStr);
  addDetailRow(detailsStack, 'Terms', 'Net 14');
  addDetailRow(detailsStack, 'Due date', dueDateStr);

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
  lineItemsTable.headerBackgroundColor = HeaderGray;
  lineItemsTable.headerTextColor = TextDark;
  lineItemsTable.margin = new Thickness(0, 0, 0, 0);

  lineItemsTable.addHeader(
    alignLeft(tb('Product / Service', StandardFonts.HelveticaBold, 9, TextDark)),
    alignLeft(tb('Description', StandardFonts.HelveticaBold, 9, TextDark)),
    alignCenter(tb('Qty / Hrs', StandardFonts.HelveticaBold, 9, TextDark)),
    alignRight(tb('Rate', StandardFonts.HelveticaBold, 9, TextDark)),
    alignRight(tb('Amount', StandardFonts.HelveticaBold, 9, TextDark))
  );

  const items = [
    { service: 'Strategy Workshop', desc: '2-day brand strategy intensive', qty: 1, price: 4500 },
    { service: 'Identity Design', desc: 'Logo, colors, typography system', qty: 1, price: 8000 },
    { service: 'Website Design', desc: 'Responsive website with animations', qty: 5, price: 1200 },
    { service: 'Development', desc: 'Next.js with CMS integration', qty: 1, price: 12000 },
    { service: 'Motion Graphics', desc: 'Hero animations, micro-interactions', qty: 1, price: 3500 },
  ];

  let subtotal = 0;
  for (const item of items) {
    const lineTotal = item.qty * item.price;
    subtotal += lineTotal;
    lineItemsTable.addRow(
      alignLeft(tb(item.service, StandardFonts.Helvetica, 9, TextMedium)),
      alignLeft(tb(item.desc, StandardFonts.Helvetica, 9, TextLight)),
      alignCenter(tb(String(item.qty), StandardFonts.Helvetica, 9, TextMedium)),
      alignRight(
        tb(
          `$${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          StandardFonts.Helvetica,
          9,
          TextMedium
        )
      ),
      alignRight(
        tb(`$${lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, StandardFonts.Helvetica, 9, TextDark)
      )
    );
  }
  mainStack.addChild(lineItemsTable);

  // Divider line
  const divider = new Container();
  divider.backgroundColor = AccentGreen;
  divider.padding = new Thickness(0, 0.75, 0, 0);
  divider.margin = new Thickness(0, 0, 0, 12);
  divider.child = new TextBlock(' ');
  (divider.child as TextBlock).fontSize = 1;
  mainStack.addChild(divider);

  // ── Footer: message + totals ──────────────────────────────────────────────
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;
  const totalDue = total - 1400;
  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const footerTable = new Table(1.3, 1);
  footerTable.cellPadding = 0;
  footerTable.border = Border.none;

  const messageStack = new VerticalStack();
  messageStack.addChild(tb('Customer message', StandardFonts.HelveticaBold, 9, TextDark, new Thickness(0, 0, 0, 4)));
  messageStack.addChild(tb('Hello!', StandardFonts.Helvetica, 9, TextMedium));
  messageStack.addChild(tb('Thank you for choosing Studio Eleven.', StandardFonts.Helvetica, 9, TextMedium));
  messageStack.addChild(tb('Please return this invoice with payment.', StandardFonts.Helvetica, 9, TextMedium));
  messageStack.addChild(tb('Thanks!', StandardFonts.Helvetica, 9, TextMedium, new Thickness(0, 4, 0, 0)));

  const totalsStack = new VerticalStack();

  const makeAmtRow = (
    label: string,
    value: string,
    labelColor = TextMedium,
    valueColor = TextDark,
    bold = false
  ): Table => {
    const t = new Table(1, 1);
    t.cellPadding = 6;
    t.border = Border.none;
    const labelFont = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
    const valueFont = bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
    const labelSize = bold ? 14 : 9;
    const valueSize = bold ? 14 : 9;
    t.addRow(
      alignLeft(tb(label, labelFont, labelSize, labelColor)),
      alignRight(tb(value, valueFont, valueSize, valueColor))
    );
    return t;
  };

  totalsStack.addChild(makeAmtRow('Subtotal', fmt(subtotal)));
  totalsStack.addChild(makeAmtRow('Sales tax (8.25%)', fmt(tax)));
  totalsStack.addChild(makeAmtRow('Discount (early payment)', '-$1,400.00', AccentGreen, AccentGreen));

  // Thin divider before total
  const totalDivider = new Container();
  totalDivider.backgroundColor = TextDark;
  totalDivider.padding = new Thickness(0, 0.5, 0, 0);
  totalDivider.margin = new Thickness(0, 4, 0, 4);
  totalDivider.child = new TextBlock(' ');
  (totalDivider.child as TextBlock).fontSize = 1;
  totalsStack.addChild(totalDivider);

  totalsStack.addChild(makeAmtRow('Total', fmt(totalDue), TextDark, TextDark, true));

  const msgContainer = new Container();
  msgContainer.child = messageStack;
  msgContainer.padding = new Thickness(0, 0, 40, 0);

  const totContainer = new Container();
  totContainer.child = totalsStack;

  footerTable.addRow(msgContainer, totContainer);
  mainStack.addChild(footerTable);

  // ── Payment details ───────────────────────────────────────────────────────
  const paymentSection = new Container();
  paymentSection.backgroundColor = AccentGreenLight;
  paymentSection.padding = new Thickness(16, 12, 16, 12);
  paymentSection.margin = new Thickness(0, 20, 0, 0);
  paymentSection.border = Border.leftOnly(3);
  paymentSection.borderColors = BorderColors.leftOnly(AccentGreen);
  paymentSection.child = createPaymentDetails();
  mainStack.addChild(paymentSection);

  // ── Footer bar ────────────────────────────────────────────────────────────
  const footerBar = new Container();
  footerBar.backgroundColor = AccentGreen;
  footerBar.padding = new Thickness(0, 0.5, 0, 0);
  footerBar.margin = new Thickness(0, 20, 0, 0);
  footerBar.child = new TextBlock(' ');
  (footerBar.child as TextBlock).fontSize = 1;
  mainStack.addChild(footerBar);

  const footerNote = tb(
    'Thank you for your business  |  hello@studioeleven.co  |  www.studioeleven.co',
    StandardFonts.Helvetica,
    8,
    TextLight,
    new Thickness(0, 8, 0, 0)
  );
  footerNote.alignment = TextAlignment.Center;
  mainStack.addChild(footerNote);

  doc.add(mainStack);
  return doc;
}
