// User Directory
//
// Landscape A4, 50-row table with alternating row colors, status badges, and
// repeated headers. Authored through the options-object front door.

import {
  Document,
  TextBlock,
  VerticalStack,
  Table,
  TableRow,
  TableCell,
  ColorPalette,
  StandardFonts,
  Placeholders,
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
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });

  const doc = new Document({
    settings: {
      pageSize: 'a4',
      orientation: 'landscape',
      margin: 40,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9, color: ColorPalette.slate[600] },
    },
    metadata: {
      title: 'User Directory',
      author: 'Company HR',
    },
  });

  // Title
  const headerStack = new VerticalStack({
    children: [
      new TextBlock('User Directory', {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 24,
        textColor: ColorPalette.slate[800],
      }),
      new TextBlock(`Generated on ${dateStr} | Total Users: 50`, {
        fontName: StandardFonts.Helvetica,
        fontSize: 11,
        textColor: ColorPalette.slate[600],
        margin: { bottom: 5 },
      }),
    ],
  });

  // Table
  const usersTable = new Table({
    columns: [1, 2, 2.5, 2, 1.5, 2, 2],
    cellPadding: 8,
    border: { width: 0.5, color: ColorPalette.slate[300] },
    headerBackgroundColor: ColorPalette.slate[800],
    headerTextColor: '#ffffff',
    repeatHeadersOnNewPage: true,
  });

  usersTable.addHeader(
    new TextBlock('ID', { fontName: StandardFonts.HelveticaBold, fontSize: 9, alignment: 'center' }),
    new TextBlock('Name', { fontName: StandardFonts.HelveticaBold, fontSize: 9 }),
    new TextBlock('Email', { fontName: StandardFonts.HelveticaBold, fontSize: 9 }),
    new TextBlock('Department', { fontName: StandardFonts.HelveticaBold, fontSize: 9 }),
    new TextBlock('Role', { fontName: StandardFonts.HelveticaBold, fontSize: 9 }),
    new TextBlock('Location', { fontName: StandardFonts.HelveticaBold, fontSize: 9 }),
    new TextBlock('Status', { fontName: StandardFonts.HelveticaBold, fontSize: 9, alignment: 'center' })
  );

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
    const rowBgColor = rowIndex % 2 === 0 ? '#ffffff' : ColorPalette.slate[50];

    const statusCell = new TableCell({
      content: new TextBlock(user.status, {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 8,
        textColor: statusColor,
        alignment: 'center',
      }),
      backgroundColor: statusBgColor,
      padding: 4,
      border: { width: 0.5, color: ColorPalette.slate[300] },
    });

    const row = TableRow.fromElements(
      new TextBlock(user.id, { fontName: StandardFonts.Courier, fontSize: 9, textColor: ColorPalette.slate[700] }),
      new TextBlock(user.name, { fontName: StandardFonts.Helvetica, fontSize: 9, textColor: ColorPalette.slate[800] }),
      new TextBlock(user.email, { fontName: StandardFonts.Helvetica, fontSize: 8, textColor: ColorPalette.slate[600] }),
      new TextBlock(user.department, {
        fontName: StandardFonts.Helvetica,
        fontSize: 9,
        textColor: ColorPalette.slate[700],
      }),
      new TextBlock(user.role, { fontName: StandardFonts.Helvetica, fontSize: 9, textColor: ColorPalette.slate[700] }),
      new TextBlock(user.location, {
        fontName: StandardFonts.Helvetica,
        fontSize: 9,
        textColor: ColorPalette.slate[600],
      }),
      statusCell
    );
    row.backgroundColor = rowBgColor;
    usersTable.addRow(row);
  });

  const footerNote = new TextBlock('* This is a confidential document. For internal use only.', {
    fontName: StandardFonts.HelveticaOblique,
    fontSize: 8,
    textColor: ColorPalette.slate[400],
  });

  doc.add(headerStack);
  doc.add(usersTable);
  doc.add(footerNote);
  return doc;
}
