import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Heading } from '../../src/Elements/Text/Heading';
import { QRCode } from '../../src/Elements/Shapes/QRCode';
import { Table } from '../../src/Elements/Tables/Table';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { accessibilityOf, LayoutNode } from '../../src/Rendering/LayoutRecorder';
import { evaluateCompliance, ComplianceSeverity } from '../../src/Compliance/ComplianceEvaluator';

function find(node: LayoutNode, pred: (n: LayoutNode) => boolean): LayoutNode | undefined {
  if (pred(node)) return node;
  for (const c of node.children) {
    const hit = find(c, pred);
    if (hit) return hit;
  }
  return undefined;
}

describe('accessibilityOf — intrinsic a11y derivation', () => {
  it('derives heading level and tagged=true for a Heading', () => {
    const h = new Heading('Title');
    h.level = 2;
    const a11y = accessibilityOf(h, 'Heading');
    expect(a11y).toEqual({ role: 'H2', tagged: true, artifact: false, headingLevel: 2 });
  });

  it('marks an alt-less QR code as an image-like artifact', () => {
    const qr = new QRCode();
    qr.data = 'https://example.com';
    const a11y = accessibilityOf(qr, 'QRCode');
    expect(a11y).toMatchObject({ role: 'Artifact', tagged: false, artifact: true, imageLike: true });
    expect(a11y!.alt).toBeUndefined();
  });

  it('carries alt text through for a described QR code (Figure)', () => {
    const qr = new QRCode();
    qr.data = 'x';
    qr.altText = 'Ticket QR code';
    const a11y = accessibilityOf(qr, 'QRCode');
    expect(a11y).toMatchObject({ role: 'Figure', tagged: true, imageLike: true, alt: 'Ticket QR code' });
  });

  it('returns undefined for a role-less object', () => {
    expect(accessibilityOf({}, 'Container')).toBeUndefined();
  });
});

describe('Compliance preflight evaluator', () => {
  let doc: Document;
  afterEach(() => doc?.dispose());

  it('captures a11y into the snapshot and flags an alt-less figure as an error', async () => {
    doc = new Document();
    doc.metadata.title = 'Report';
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';
    const h = new Heading('Overview');
    h.level = 1;
    doc.add(h);
    const qr = new QRCode();
    qr.data = 'https://example.com';
    doc.add(qr);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    expect(snapshot).toBeDefined();

    // a11y is captured on the nodes.
    const qrNode = find(snapshot!.root, n => n.type === 'QRCode')!;
    expect(qrNode.a11y).toMatchObject({ role: 'Artifact', imageLike: true, artifact: true });
    const headingNode = find(snapshot!.root, n => n.a11y?.role === 'H1')!;
    expect(headingNode).toBeDefined();

    // meta reflects document context.
    expect(snapshot!.meta).toMatchObject({
      accessibilityMode: AccessibilityMode.PdfUa1,
      language: 'en-GB',
      title: 'Report',
    });

    const report = evaluateCompliance(snapshot!);
    const figure = report.findings.find(f => f.code === 'figure-missing-alt');
    expect(figure).toBeDefined();
    expect(figure!.severity).toBe(ComplianceSeverity.Error);
    expect(figure!.nodeId).toBe(qrNode.id);
    expect(figure!.page).toBe(0);
    expect(report.passed).toBe(false);
  });

  it('passes a described figure with title, language and an H1', async () => {
    doc = new Document();
    doc.metadata.title = 'Accessible';
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en';
    const h = new Heading('Intro');
    h.level = 1;
    doc.add(h);
    const qr = new QRCode();
    qr.data = 'x';
    qr.altText = 'Scan to open the portal';
    doc.add(qr);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const report = evaluateCompliance(snapshot!);
    expect(report.findings.find(f => f.code === 'figure-missing-alt')).toBeUndefined();
    expect(report.errorCount).toBe(0);
    expect(report.passed).toBe(true);
  });

  it('flags missing language and title for an untagged document (as warnings)', async () => {
    doc = new Document();
    doc.add(new TextBlock('Body text', { fontSize: 12, fontName: StandardFonts.Helvetica }));

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const report = evaluateCompliance(snapshot!);

    expect(report.findings.find(f => f.code === 'doc-not-tagged')?.severity).toBe(ComplianceSeverity.Info);
    expect(report.findings.find(f => f.code === 'doc-lang-missing')?.severity).toBe(ComplianceSeverity.Warning);
    expect(report.findings.find(f => f.code === 'doc-title-missing')?.severity).toBe(ComplianceSeverity.Warning);
    // No headings present.
    expect(report.findings.find(f => f.code === 'doc-no-headings')).toBeDefined();
  });

  it('captures TR/TH/TD nodes and does NOT flag a table that has header cells', async () => {
    doc = new Document();
    doc.metadata.title = 'T';
    doc.settings.language = 'en';
    const table = new Table(1, 1);
    table.addHeader(new TextBlock('Property'), new TextBlock('Description'));
    table.addRow(new TextBlock('Margin.Top'), new TextBlock('Space above'));
    doc.add(table);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });

    // The table's semantic structure is now captured (not just the cell text).
    const roles = new Set<string>();
    const collectRoles = (node: LayoutNode): void => {
      if (node.a11y?.role) roles.add(node.a11y.role);
      for (const c of node.children) collectRoles(c);
    };
    collectRoles(snapshot!.root);
    expect(roles).toContain('TH');
    expect(roles).toContain('TD');
    expect(roles).toContain('TR');

    const report = evaluateCompliance(snapshot!);
    expect(report.findings.find(f => f.code === 'table-no-header')).toBeUndefined();
  });

  it('does NOT flag a presentation (layout) table, capturing it as a Div', async () => {
    doc = new Document();
    doc.metadata.title = 'T';
    doc.settings.language = 'en';
    const table = new Table(1, 1);
    table.presentation = true; // layout grid, not tabular data
    table.addRow(new TextBlock('Bill to'), new TextBlock('Ship to'));
    table.addRow(new TextBlock('Acme Inc'), new TextBlock('42 Road'));
    doc.add(table);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });

    // The table node is captured as a Div grouping; no TH/TD roles are recorded.
    const roles = new Set<string>();
    const collectRoles = (node: LayoutNode): void => {
      if (node.a11y?.role) roles.add(node.a11y.role);
      for (const c of node.children) collectRoles(c);
    };
    collectRoles(snapshot!.root);
    expect(roles).toContain('Div');
    expect(roles).not.toContain('Table');
    expect(roles).not.toContain('TD');
    expect(roles).not.toContain('TH');

    const report = evaluateCompliance(snapshot!);
    expect(report.findings.find(f => f.code === 'table-no-header')).toBeUndefined();
  });

  it('flags a table that has no header cells', async () => {
    doc = new Document();
    doc.metadata.title = 'T';
    doc.settings.language = 'en';
    const table = new Table(1, 1);
    table.addRow(new TextBlock('a'), new TextBlock('b'));
    table.addRow(new TextBlock('c'), new TextBlock('d'));
    doc.add(table);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const report = evaluateCompliance(snapshot!);
    const finding = report.findings.find(f => f.code === 'table-no-header');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe(ComplianceSeverity.Warning);
  });

  it('flags a skipped heading level', async () => {
    doc = new Document();
    doc.metadata.title = 'T';
    doc.settings.language = 'en';
    const h1 = new Heading('One');
    h1.level = 1;
    const h3 = new Heading('Three');
    h3.level = 3;
    doc.add(h1);
    doc.add(h3);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const report = evaluateCompliance(snapshot!);
    const skip = report.findings.find(f => f.code === 'heading-skip');
    expect(skip).toBeDefined();
    expect(skip!.role).toBe('H3');
    expect(skip!.severity).toBe(ComplianceSeverity.Warning);
  });
});
