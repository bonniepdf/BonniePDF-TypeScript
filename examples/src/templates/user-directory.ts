import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  PageOrientation,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  Table,
  TableRow,
  Color,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  Placeholders,
  asCell,
  cellBackground,
  cellPadding,
  cellBorder,
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

function getMockUsers(): User[] {
  const statuses: User['status'][] = ['Active', 'Active', 'Active', 'Inactive', 'Pending'];
  const source = Placeholders.withSeed(100);

  return Array.from({ length: 50 }, (_, i): User => {
    const first = source.firstName();
    const last = source.lastName();
    return {
      id: `USR-${String(i + 1).padStart(3, '0')}`,
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@company.com`,
      department: source.department(),
      role: source.role(),
      location: source.location(),
      status: statuses[i % statuses.length],
    };
  });
}

// ── Helper ────────────────────────────────────────────────────────────────────

function hdr(text: string, center = false): TextBlock {
  const b = new TextBlock(text);
  b.fontName = StandardFonts.HelveticaBold;
  b.fontSize = 9;
  if (center) b.alignment = TextAlignment.Center;
  return b;
}

// ── Generator ─────────────────────────────────────────────────────────────────

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape, 40);
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  const metadata = new DocumentMetadata();
  metadata.title = 'User Directory';
  metadata.author = 'Company HR';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(9).withColor(Color.slate600);

  // Title
  const title = new TextBlock('User Directory');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.textColor = Color.slate800;

  const subtitle = new TextBlock(`Generated on ${dateStr} | Total Users: 50`);
  subtitle.fontName = StandardFonts.Helvetica;
  subtitle.fontSize = 11;
  subtitle.textColor = Color.slate600;
  subtitle.margin = new Thickness(0, 0, 0, 5);

  const headerStack = new VerticalStack();
  headerStack.addChild(title);
  headerStack.addChild(subtitle);

  // Table
  const usersTable = new Table(1, 2, 2.5, 2, 1.5, 2, 2);
  usersTable.cellPadding = 8;
  usersTable.border = new Border(0.5);
  usersTable.borderColors = new BorderColors(Color.slate300);
  usersTable.headerBackgroundColor = Color.slate800;
  usersTable.headerTextColor = Color.white;
  usersTable.repeatHeadersOnNewPage = true;

  usersTable.addHeader(
    hdr('ID', true),
    hdr('Name'),
    hdr('Email'),
    hdr('Department'),
    hdr('Role'),
    hdr('Location'),
    hdr('Status', true)
  );

  const users = getMockUsers();
  users.forEach((user, rowIndex) => {
    const statusColor =
      user.status === 'Active' ? Color.green600 : user.status === 'Inactive' ? Color.gray500 : Color.amber600;
    const statusBgColor =
      user.status === 'Active' ? Color.green50 : user.status === 'Inactive' ? Color.gray100 : Color.amber50;
    const rowBgColor = rowIndex % 2 === 0 ? Color.white : Color.slate50;

    const statusText = new TextBlock(user.status);
    statusText.fontName = StandardFonts.HelveticaBold;
    statusText.fontSize = 8;
    statusText.textColor = statusColor;
    statusText.alignment = TextAlignment.Center;
    const statusCell = cellBorder(
      cellPadding(cellBackground(asCell(statusText), statusBgColor), 4),
      Color.slate300,
      0.5
    );

    const idCell = new TextBlock(user.id);
    idCell.fontName = StandardFonts.Courier;
    idCell.fontSize = 9;
    idCell.textColor = Color.slate700;

    const nameCell = new TextBlock(user.name);
    nameCell.fontName = StandardFonts.Helvetica;
    nameCell.fontSize = 9;
    nameCell.textColor = Color.slate800;

    const emailCell = new TextBlock(user.email);
    emailCell.fontName = StandardFonts.Helvetica;
    emailCell.fontSize = 8;
    emailCell.textColor = Color.slate600;

    const deptCell = new TextBlock(user.department);
    deptCell.fontName = StandardFonts.Helvetica;
    deptCell.fontSize = 9;
    deptCell.textColor = Color.slate700;

    const roleCell = new TextBlock(user.role);
    roleCell.fontName = StandardFonts.Helvetica;
    roleCell.fontSize = 9;
    roleCell.textColor = Color.slate700;

    const locCell = new TextBlock(user.location);
    locCell.fontName = StandardFonts.Helvetica;
    locCell.fontSize = 9;
    locCell.textColor = Color.slate600;

    const row = TableRow.fromElements(idCell, nameCell, emailCell, deptCell, roleCell, locCell, statusCell);
    row.backgroundColor = rowBgColor;
    usersTable.addRowRow(row);
  });

  const footerNote = new TextBlock('* This is a confidential document. For internal use only.');
  footerNote.fontName = StandardFonts.HelveticaOblique;
  footerNote.fontSize = 8;
  footerNote.textColor = Color.slate400;

  const mainStack = new VerticalStack();
  mainStack.addChild(headerStack);
  mainStack.addChild(usersTable);
  mainStack.addChild(footerNote);

  doc.add(mainStack);
  return doc;
}
