import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  Table,
  TableRow,
  Heading,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

const EMPLOYEES: [string, string, string][] = [
  ['Alice Chen', 'Engineering', 'Senior Developer'],
  ['Bob Martinez', 'Marketing', 'Brand Manager'],
  ['Carol Johnson', 'Human Resources', 'HR Specialist'],
  ['David Kim', 'Finance', 'Financial Analyst'],
  ['Eva Patel', 'Engineering', 'QA Lead'],
  ['Frank Wilson', 'Sales', 'Account Executive'],
  ['Grace Taylor', 'Operations', 'Project Manager'],
  ['Henry Brown', 'R&D', 'Research Scientist'],
  ['Isabel Garcia', 'Customer Support', 'Support Lead'],
  ['James Lee', 'Engineering', 'DevOps Engineer'],
  ['Karen White', 'Legal', 'Compliance Officer'],
  ['Liam Moore', 'IT', 'Systems Administrator'],
  ['Mia Anderson', 'Engineering', 'Frontend Developer'],
  ['Noah Thomas', 'Finance', 'Budget Analyst'],
  ['Olivia Jackson', 'Marketing', 'Content Strategist'],
  ['Peter Harris', 'Sales', 'Sales Manager'],
  ['Quinn Robinson', 'Engineering', 'Backend Developer'],
  ['Rachel Clark', 'Operations', 'Supply Chain Lead'],
  ['Samuel Lewis', 'R&D', 'Data Scientist'],
  ['Tara Walker', 'Customer Support', 'CX Analyst'],
  ['Uma Hall', 'Human Resources', 'Recruiter'],
  ['Victor Allen', 'Finance', 'Controller'],
  ['Wendy Young', 'Engineering', 'Platform Architect'],
  ['Xavier King', 'Legal', 'IP Counsel'],
  ['Yara Wright', 'IT', 'Security Engineer'],
  ['Zack Scott', 'Marketing', 'Digital Strategist'],
  ['Amy Green', 'Sales', 'Business Developer'],
  ['Brian Adams', 'Operations', 'Logistics Manager'],
  ['Chloe Baker', 'R&D', 'UX Researcher'],
  ['Dylan Carter', 'Engineering', 'Mobile Developer'],
];

const OVERVIEW_SECTIONS: [string, string][] = [
  [
    'Our Mission',
    'We are dedicated to creating sustainable value for our stakeholders through innovation, operational excellence, and responsible business practices. Our mission guides every decision we make, from product development to customer service.',
  ],
  [
    'Corporate Values',
    'Integrity, innovation, and inclusivity form the foundation of our corporate culture. We believe in doing the right thing, even when no one is watching, and we encourage creative thinking across every level of the organisation.',
  ],
  [
    'Strategic Vision',
    'Looking ahead, we envision a future where technology seamlessly integrates with everyday life to enhance human potential. Our strategic initiatives focus on emerging markets, sustainable technologies, and digital transformation.',
  ],
  [
    'Sustainability',
    'Environmental responsibility is a core value that influences everything we do. We have committed to achieving carbon neutrality and have implemented comprehensive sustainability programmes across all our facilities.',
  ],
  [
    'Conclusion',
    'This document demonstrates the pagination capabilities of BonniePDF. The table automatically spans multiple pages with headers repeating on each page, while text sections flow naturally across page boundaries.',
  ],
];

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.version = PdfVersion.Pdf17;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';

  const metadata = new DocumentMetadata();
  metadata.title = 'Employee Directory - Tagged (PDF/UA-1)';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Multi-page flow demonstration with tagged table and prose sections.';
  metadata.keywords = 'pdf, pdf/ua, accessibility, table, multi-page';

  const doc = new Document(settings, metadata);
  doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(Color.slate700);

  // ── Part 1: Employee table ─────────────────────────────────────────────────

  const h1Dir = new Heading('Part 1: Employee Directory');
  h1Dir.tocIdentifier = 'directory';
  h1Dir.level = 1;
  h1Dir.fontName = StandardFonts.HelveticaBold;
  h1Dir.fontSize = 20;
  h1Dir.textColor = Color.slate800;
  h1Dir.margin = new Thickness(0, 0, 0, 10);
  doc.add(h1Dir);

  const tableIntro = new TextBlock(
    'The table below lists team members by department. Column headers repeat on every page for easy reference. Each cell is tagged as /TH (header) or /TD (data) within the /Table structure tree.'
  );
  tableIntro.margin = new Thickness(0, 0, 0, 10);
  doc.add(tableIntro);

  const table = new Table(100, 160, 140);
  table.repeatHeadersOnNewPage = true;
  table.headerBackgroundColor = Color.blue600;
  table.headerTextColor = Color.white;

  const mkHeader = (text: string): TextBlock => {
    const b = new TextBlock(text);
    b.fontName = StandardFonts.HelveticaBold;
    b.fontSize = 10;
    return b;
  };

  table.addHeader(mkHeader('Department'), mkHeader('Name'), mkHeader('Role'));

  let row = 0;
  for (const [name, dept, role] of EMPLOYEES) {
    const bg = row++ % 2 === 0 ? Color.white : Color.slate50;
    const deptCell = new TextBlock(dept);
    deptCell.fontSize = 10;
    deptCell.textColor = Color.slate600;
    const nameCell = new TextBlock(name);
    nameCell.fontSize = 10;
    nameCell.textColor = Color.slate800;
    const roleCell = new TextBlock(role);
    roleCell.fontSize = 10;
    roleCell.textColor = Color.slate600;
    table.addRowRow(TableRow.fromElements(deptCell, nameCell, roleCell).withBackground(bg));
  }

  doc.add(table);

  // ── Part 2: Prose sections ─────────────────────────────────────────────────

  const h1Overview = new Heading('Part 2: Company Overview');
  h1Overview.tocIdentifier = 'overview';
  h1Overview.level = 1;
  h1Overview.fontName = StandardFonts.HelveticaBold;
  h1Overview.fontSize = 20;
  h1Overview.textColor = Color.slate800;
  h1Overview.margin = new Thickness(0, 20, 0, 10);
  doc.add(h1Overview);

  for (const [title, body] of OVERVIEW_SECTIONS) {
    const h2 = new Heading(title);
    h2.tocIdentifier = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    h2.level = 2;
    h2.fontName = StandardFonts.HelveticaBold;
    h2.fontSize = 14;
    h2.textColor = Color.slate700;
    h2.margin = new Thickness(0, 14, 0, 6);
    doc.add(h2);

    const p = new TextBlock(body);
    p.margin = new Thickness(0, 0, 0, 6);
    doc.add(p);
  }

  return doc;
}
