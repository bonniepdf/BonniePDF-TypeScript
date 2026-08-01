import { Document, Heading, TextBlock, TextElementBase, Table, TableRow, StandardFonts } from '@bonniepdf/core';

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
  ['Eleanor Price', 'Marketing', 'Events Manager'],
  ['Felix Nguyen', 'Engineering', 'Cloud Architect'],
  ['Georgia Moss', 'Finance', 'Treasury Analyst'],
  ['Hugo Reyes', 'R&D', 'AI Researcher'],
  ['Iris Chambers', 'Legal', 'Contract Specialist'],
  ['Jordan Holt', 'Sales', 'Sales Engineer'],
  ['Kira Okafor', 'Operations', 'Process Analyst'],
  ['Leo Novak', 'IT', 'Network Engineer'],
  ['Maya Singh', 'Customer Support', 'Escalations Lead'],
  ['Nate Callahan', 'Engineering', 'Site Reliability Engineer'],
  ['Ophelia Dunn', 'Human Resources', 'L&D Manager'],
  ['Patrick Stern', 'Finance', 'Risk Analyst'],
  ['Rosa Tanaka', 'Marketing', 'SEO Specialist'],
  ['Stefan Mehta', 'Engineering', 'Data Engineer'],
  ['Talia Burns', 'Operations', 'Fleet Coordinator'],
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
    'This document demonstrates the pagination capabilities of BonniePDF. The table automatically spans multiple pages with column headers repeating on each page, while text sections flow naturally across page boundaries.',
  ],
];

/**
 * A multi-page table with repeating headers and zebra-striped rows, followed by
 * flowing prose - authored through the options-object front door.
 *
 * The `Table` is configured in one expression (`columns`, `repeatHeadersOnNewPage`,
 * header colours as tokens); rows are built in a loop because their zebra fill
 * alternates. Each cell is tagged `/TH` or `/TD` within the `/Table` structure
 * tree. Colours are palette tokens (`'slate-600'`) or hex (`'#ffffff'`).
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' },
      footerTemplate: (pageNumber: number) =>
        new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`, {
          fontSize: 9,
          textColor: 'slate-400',
          alignment: 'right',
        }),
    },
    metadata: {
      title: 'Employee Directory',
      author: 'BonniePDF',
      subject: 'Table with repeating headers spanning multiple pages. PDF/A-2a + PDF/UA-1.',
      keywords: 'pdf, table, accessibility, pdf/ua, pdf/a, multi-page, BonniePDF',
    },
  });

  // ── Part 1: Employee table ─────────────────────────────────────────────────

  doc.add(
    new Heading('Part 1: Employee Directory', {
      tocIdentifier: 'directory',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 20,
      textColor: 'slate-800',
      margin: { bottom: 10 },
    })
  );

  doc.add(
    new TextBlock(
      'The table below lists team members by department. Column headers repeat on every page for easy reference. Each cell is tagged as /TH (header) or /TD (data) within the /Table structure tree.',
      { margin: { bottom: 10 } }
    )
  );

  const table = new Table({
    columns: [100, 160, 140],
    repeatHeadersOnNewPage: true,
    headerBackgroundColor: 'blue-600',
    headerTextColor: '#ffffff',
  });

  const headerCell = (text: string): TextBlock =>
    new TextBlock(text, { fontName: StandardFonts.HelveticaBold, fontSize: 10 });
  table.addHeader(headerCell('Department'), headerCell('Name'), headerCell('Role'));

  let rowIndex = 0;
  for (const [name, dept, role] of EMPLOYEES) {
    const bg = rowIndex++ % 2 === 0 ? '#ffffff' : 'slate-50';
    const row = TableRow.fromElements(
      new TextBlock(dept, { fontSize: 10, textColor: 'slate-600' }),
      new TextBlock(name, { fontSize: 10, textColor: 'slate-800' }),
      new TextBlock(role, { fontSize: 10, textColor: 'slate-600' })
    );
    row.backgroundColor = bg;
    table.addRow(row);
  }

  doc.add(table);

  // ── Part 2: Prose sections ─────────────────────────────────────────────────

  doc.add(
    new Heading('Part 2: Company Overview', {
      tocIdentifier: 'overview',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 20,
      textColor: 'slate-800',
      margin: { top: 20, bottom: 10 },
    })
  );

  for (const [title, body] of OVERVIEW_SECTIONS) {
    doc.add(
      new Heading(title, {
        tocIdentifier: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        level: 2,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 14,
        textColor: 'slate-700',
        margin: { top: 14, bottom: 6 },
      })
    );

    doc.add(new TextBlock(body, { margin: { bottom: 6 } }));
  }

  return doc;
}
