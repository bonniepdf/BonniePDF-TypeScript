// The **class / construct-then-mutate** companion to `user-directory.ts`.
// Same 50-row user directory table, authored the long way: `new` each
// element and assign properties. It renders **byte-for-byte identically** to
// the options-style `user-directory.ts` (an equivalence test binds the two).
// Reach for the options form first; this variant exists to show what it
// desugars to.

import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PageOrientation,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  Table,
  TableRow,
  Color,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  Placeholders,
  TableCell,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

// ── Mock user data ─────────────────────────────────────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  location: string;
  status: 'Active' | 'Inactive' | 'Pending';
}

// ── Generator ─────────────────────────────────────────────────────────────────

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape, 40);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(ColorPalette.slate[600]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  const metadata = new DocumentMetadata();
  metadata.title = 'User Directory';
  metadata.author = 'Company HR';

  const doc = new Document(settings, metadata);

  // Title
  const title = new TextBlock('User Directory');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = ColorPalette.slate[800];

  const subtitle = new TextBlock(`Generated on ${dateStr} | Total Users: 50`);
  subtitle.fontName = StandardFonts.Helvetica;
  subtitle.fontSize = 11;
  subtitle.textColor = ColorPalette.slate[600];
  subtitle.margin = new Thickness(0, 0, 0, 5);

  const headerStack = new VerticalStack();
  headerStack.addChild(title);
  headerStack.addChild(subtitle);

  // Table
  const usersTable = new Table(1, 2, 2.5, 2, 1.5, 2, 2);
  usersTable.cellPadding = 8;
  usersTable.border = new Border(0.5);
  usersTable.borderColors = new BorderColors(ColorPalette.slate[300]);
  usersTable.headerBackgroundColor = ColorPalette.slate[800];
  usersTable.headerTextColor = Color.white;
  usersTable.repeatHeadersOnNewPage = true;

  const idText = new TextBlock('ID');
  idText.fontName = StandardFonts.HelveticaBold;
  idText.fontSize = 9;
  idText.alignment = TextAlignment.Center;
  const nameText = new TextBlock('Name');
  nameText.fontName = StandardFonts.HelveticaBold;
  nameText.fontSize = 9;
  const emailText = new TextBlock('Email');
  emailText.fontName = StandardFonts.HelveticaBold;
  emailText.fontSize = 9;
  const departmentText = new TextBlock('Department');
  departmentText.fontName = StandardFonts.HelveticaBold;
  departmentText.fontSize = 9;
  const roleText = new TextBlock('Role');
  roleText.fontName = StandardFonts.HelveticaBold;
  roleText.fontSize = 9;
  const locationText = new TextBlock('Location');
  locationText.fontName = StandardFonts.HelveticaBold;
  locationText.fontSize = 9;
  const statusHeaderText = new TextBlock('Status');
  statusHeaderText.fontName = StandardFonts.HelveticaBold;
  statusHeaderText.fontSize = 9;
  statusHeaderText.alignment = TextAlignment.Center;
  usersTable.addHeader(idText, nameText, emailText, departmentText, roleText, locationText, statusHeaderText);

  const statuses: User['status'][] = ['Active', 'Active', 'Active', 'Inactive', 'Pending'];
  const source = Placeholders.withSeed(100);
  const users: User[] = [];
  for (let i = 0; i < 50; i++) {
    const first = source.firstName();
    const last = source.lastName();
    users.push({
      id: `USR-${String(i + 1).padStart(3, '0')}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@company.com`,
      department: source.department(),
      role: source.role(),
      location: source.location(),
      status: statuses[i % statuses.length],
    });
  }

  users.forEach((user, rowIndex) => {
    const statusColor =
      user.status === 'Active'
        ? ColorPalette.green[600]
        : user.status === 'Inactive'
          ? ColorPalette.gray[500]
          : ColorPalette.amber[600];
    const statusBgColor =
      user.status === 'Active'
        ? ColorPalette.green[50]
        : user.status === 'Inactive'
          ? ColorPalette.gray[100]
          : ColorPalette.amber[50];
    const rowBgColor = rowIndex % 2 === 0 ? Color.white : ColorPalette.slate[50];

    const statusText = new TextBlock(user.status);
    statusText.fontName = StandardFonts.HelveticaBold;
    statusText.fontSize = 8;
    statusText.textColor = statusColor;
    statusText.alignment = TextAlignment.Center;
    const statusCell = TableCell.from(statusText)
      .withBackground(statusBgColor)
      .withPadding(4)
      .withBorder(ColorPalette.slate[300], 0.5);

    const idCell = new TextBlock(user.id);
    idCell.fontName = StandardFonts.Courier;
    idCell.fontSize = 9;
    idCell.textColor = ColorPalette.slate[700];

    const nameCell = new TextBlock(user.name);
    nameCell.fontName = StandardFonts.Helvetica;
    nameCell.fontSize = 9;
    nameCell.textColor = ColorPalette.slate[800];

    const emailCell = new TextBlock(user.email);
    emailCell.fontName = StandardFonts.Helvetica;
    emailCell.fontSize = 8;
    emailCell.textColor = ColorPalette.slate[600];

    const deptCell = new TextBlock(user.department);
    deptCell.fontName = StandardFonts.Helvetica;
    deptCell.fontSize = 9;
    deptCell.textColor = ColorPalette.slate[700];

    const roleCell = new TextBlock(user.role);
    roleCell.fontName = StandardFonts.Helvetica;
    roleCell.fontSize = 9;
    roleCell.textColor = ColorPalette.slate[700];

    const locCell = new TextBlock(user.location);
    locCell.fontName = StandardFonts.Helvetica;
    locCell.fontSize = 9;
    locCell.textColor = ColorPalette.slate[600];

    const row = TableRow.fromElements(idCell, nameCell, emailCell, deptCell, roleCell, locCell, statusCell);
    row.backgroundColor = rowBgColor;
    usersTable.addRow(row);
  });

  const footerNote = new TextBlock('* This is a confidential document. For internal use only.');
  footerNote.fontName = StandardFonts.HelveticaOblique;
  footerNote.fontSize = 8;
  footerNote.textColor = ColorPalette.slate[400];

  doc.add(headerStack);
  doc.add(usersTable);
  doc.add(footerNote);
  return doc;
}
