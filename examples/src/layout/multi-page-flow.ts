import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  PdfSize,
  PageOrientation,
  TextBlock,
  TextStyle,
  TextAlignment,
  Table,
  TableRow,
  Spacer,
  Color,
  Thickness,
  StandardFonts,
  PdfAConformance,
} from '@bonniepdf/core';

const FIRST_NAMES = [
  'James',
  'Mary',
  'Robert',
  'Patricia',
  'John',
  'Jennifer',
  'Michael',
  'Linda',
  'David',
  'Elizabeth',
  'William',
  'Barbara',
  'Richard',
  'Susan',
  'Joseph',
  'Jessica',
  'Thomas',
  'Sarah',
  'Charles',
  'Karen',
];
const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
];
const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'Research & Development',
  'Legal',
  'IT',
];
const POSITIONS = [
  'Manager',
  'Senior Analyst',
  'Developer',
  'Coordinator',
  'Specialist',
  'Director',
  'Associate',
  'Lead',
  'Consultant',
  'Administrator',
];

const SECTIONS: [string, string][] = [
  [
    'About Our Company',
    "Founded in 2005, our company has grown from a small startup to a global enterprise with operations in over 40 countries. Our commitment to innovation and excellence has driven our success, and we continue to push the boundaries of what's possible in our industry.",
  ],
  [
    'Our Mission',
    'We are dedicated to creating sustainable value for our stakeholders through innovation, operational excellence, and responsible business practices. Our mission guides every decision we make, from product development to customer service.',
  ],
  [
    'Corporate Values',
    'Integrity, innovation, and inclusivity form the foundation of our corporate culture. We believe in doing the right thing, even when no one is watching. We encourage creative thinking and embrace new ideas.',
  ],
  [
    'Strategic Vision',
    'Looking ahead to 2030, we envision a future where technology seamlessly integrates with everyday life to enhance human potential. Our strategic initiatives focus on emerging markets, sustainable technologies, and digital transformation.',
  ],
  [
    'Innovation & Research',
    'Our R&D team comprises world-class scientists, engineers, and designers who are passionate about solving complex problems. We allocate significant resources to research initiatives that explore new frontiers in technology.',
  ],
  [
    'Sustainability Commitment',
    "Environmental responsibility is not just a corporate policy - it's a core value that influences everything we do. We have committed to achieving carbon neutrality by 2030 and have implemented comprehensive sustainability programs across all our facilities.",
  ],
  [
    'Community Engagement',
    'We believe in giving back to the communities where we operate. Through our foundation and employee volunteer programs, we support education, healthcare, and environmental initiatives around the world.',
  ],
  [
    'Financial Performance',
    'Despite challenging market conditions, our company has demonstrated remarkable resilience and adaptability. We have maintained strong revenue growth while improving operational efficiency.',
  ],
  [
    'Employee Development',
    'Our people are our greatest asset. We invest significantly in training and development programs to help our employees reach their full potential. From leadership academies to technical certification programs, we provide numerous opportunities for career growth.',
  ],
  [
    'Customer Focus',
    'Customer satisfaction is at the heart of everything we do. We continuously gather feedback and use it to improve our products and services. Our customer success teams work closely with clients to understand their needs and deliver solutions that exceed expectations.',
  ],
];

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, PageOrientation.Landscape, 50);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(Color.slate600);

  const metadata = new DocumentMetadata();
  metadata.title = 'Flow Architecture Demo';
  metadata.author = 'BonniePDF';
  metadata.subject = 'Demonstrates tables with repeating headers and text overflow';

  const doc = new Document(settings, metadata);

  // === Section 1: Title ===
  const mainTitle = new TextBlock('Employee Directory & Company Overview');
  mainTitle.fontName = StandardFonts.HelveticaBold;
  mainTitle.fontSize = 28;
  mainTitle.textColor = Color.slate800;
  mainTitle.alignment = TextAlignment.Center;
  mainTitle.margin = new Thickness(0, 0, 0, 10);
  doc.add(mainTitle);

  const yearSub = new TextBlock(`Annual Report ${new Date().getFullYear()}`);
  yearSub.fontName = StandardFonts.Helvetica;
  yearSub.fontSize = 14;
  yearSub.textColor = Color.slate500;
  yearSub.alignment = TextAlignment.Center;
  yearSub.margin = new Thickness(0, 0, 0, 30);
  doc.add(yearSub);

  // === Section 2: Employee table ===
  const tableHeading = new TextBlock('Part 1: Complete Employee Directory');
  tableHeading.fontName = StandardFonts.HelveticaBold;
  tableHeading.fontSize = 18;
  tableHeading.textColor = Color.slate700;
  tableHeading.margin = new Thickness(0, 0, 0, 15);
  doc.add(tableHeading);

  const tableIntro = new TextBlock(
    'The following table lists all employees across all departments. Headers repeat on each page for easy reference.'
  );
  tableIntro.margin = new Thickness(0, 0, 0, 15);
  doc.add(tableIntro);

  const table = new Table(0.5, 1.5, 1, 1, 1);
  table.repeatHeadersOnNewPage = true;
  table.headerBackgroundColor = Color.blue600;
  table.headerTextColor = Color.white;
  table.cellPadding = 8;

  const idText = new TextBlock('ID');
  idText.fontName = StandardFonts.HelveticaBold;
  idText.fontSize = 10;
  const fullNameText = new TextBlock('Full Name');
  fullNameText.fontName = StandardFonts.HelveticaBold;
  fullNameText.fontSize = 10;
  const departmentText = new TextBlock('Department');
  departmentText.fontName = StandardFonts.HelveticaBold;
  departmentText.fontSize = 10;
  const positionText = new TextBlock('Position');
  positionText.fontName = StandardFonts.HelveticaBold;
  positionText.fontSize = 10;
  const startDateText = new TextBlock('Start Date');
  startDateText.fontName = StandardFonts.HelveticaBold;
  startDateText.fontSize = 10;
  table.addHeader(idText, fullNameText, departmentText, positionText, startDateText);

  for (let i = 1; i <= 150; i++) {
    const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const department = DEPARTMENTS[(i - 1) % DEPARTMENTS.length];
    const position = POSITIONS[(i * 3) % POSITIONS.length];
    const startYear = 2015 + (i % 10);
    const startMonth = ((i * 5) % 12) + 1;
    const rowBg = i % 2 === 0 ? Color.slate50 : Color.white;

    const id = new TextBlock(String(i).padStart(4, '0'));
    id.fontName = StandardFonts.Helvetica;
    id.fontSize = 9;
    id.textColor = Color.slate600;
    const name = new TextBlock(`${firstName} ${lastName}`);
    name.fontName = StandardFonts.Helvetica;
    name.fontSize = 9;
    name.textColor = Color.slate800;
    const dept = new TextBlock(department);
    dept.fontName = StandardFonts.Helvetica;
    dept.fontSize = 9;
    dept.textColor = Color.slate600;
    const pos = new TextBlock(position);
    pos.fontName = StandardFonts.Helvetica;
    pos.fontSize = 9;
    pos.textColor = Color.slate600;
    const date = new TextBlock(`${String(startMonth).padStart(2, '0')}/${startYear}`);
    date.fontName = StandardFonts.Helvetica;
    date.fontSize = 9;
    date.textColor = Color.slate500;

    table.addRowRow(TableRow.fromElements(id, name, dept, pos, date).withBackground(rowBg));
  }

  doc.add(table);

  // === Section 3: Company text ===
  doc.add(new Spacer(30));

  const textHeading = new TextBlock('Part 2: Company Overview & History');
  textHeading.fontName = StandardFonts.HelveticaBold;
  textHeading.fontSize = 18;
  textHeading.textColor = Color.slate700;
  textHeading.margin = new Thickness(0, 0, 0, 15);
  doc.add(textHeading);

  for (const [sectionTitle, content] of SECTIONS) {
    const h = new TextBlock(sectionTitle);
    h.fontName = StandardFonts.HelveticaBold;
    h.fontSize = 14;
    h.textColor = Color.slate700;
    h.margin = new Thickness(0, 20, 0, 8);
    doc.add(h);

    const p = new TextBlock(content);
    p.margin = new Thickness(0, 0, 0, 8);
    doc.add(p);

    const detail = new TextBlock(
      `This section highlights the importance of ${sectionTitle.toLowerCase()} in our organization. ` +
        'We continuously evaluate our practices and seek opportunities for improvement. ' +
        'Through regular assessments and stakeholder engagement, we ensure that our strategies ' +
        'remain relevant and effective in an ever-changing business environment.'
    );
    detail.margin = new Thickness(0, 0, 0, 12);
    doc.add(detail);
  }

  // === Section 4: Closing ===
  doc.add(new Spacer(30));

  const conclusion = new TextBlock('Conclusion');
  conclusion.fontName = StandardFonts.HelveticaBold;
  conclusion.fontSize = 18;
  conclusion.textColor = Color.slate700;
  conclusion.margin = new Thickness(0, 0, 0, 15);
  doc.add(conclusion);

  const closing = new TextBlock(
    'This document demonstrates the powerful pagination capabilities of BonniePDF. ' +
      'The employee table automatically spans multiple pages with headers repeating on each page, ' +
      'making it easy to reference column names regardless of where you are in the document. ' +
      'The text sections that follow flow naturally across page boundaries, maintaining readability ' +
      'and professional formatting throughout.'
  );
  closing.margin = new Thickness(0, 0, 0, 20);
  doc.add(closing);

  const footer = new TextBlock('Generated with BonniePDF - Flow Architecture Demo');
  footer.fontName = StandardFonts.HelveticaOblique;
  footer.fontSize = 10;
  footer.textColor = Color.slate400;
  footer.alignment = TextAlignment.Center;
  footer.margin = new Thickness(0, 20, 0, 0);
  doc.add(footer);

  return doc;
}
