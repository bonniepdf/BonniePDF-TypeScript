import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Container } from '../../src/Elements/Layout/Container';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { Color } from '../../src/Core/Color';
import { LAYOUT_SNAPSHOT_VERSION } from '../../src/Rendering/LayoutRecorder';
import { evaluateCompliance } from '../../src/Compliance/ComplianceEvaluator';
import { SVG_DOCUMENT_EXPORT_VERSION, type SvgDocumentExport } from '../../src/Export/SvgPageExporter';

// Mirrors the shared conformance fixtures svg-document-export/with-layout and
// svg-document-export/without-layout, and the shared JSON conventions the
// export is serialized under. The .NET suite asserts the same facts.

/** The fixture document: tagged, titled, one light card holding mid-grey text.
 * It is the compliance-preflight/contrast-insufficient document, so its report
 * is already pinned by that fixture. */
function fixtureDocument(): Document {
  const doc = new Document();
  doc.metadata.title = 'Contrast fixture';
  doc.settings.accessibility = AccessibilityMode.PdfUa1;
  doc.settings.language = 'en-GB';
  const caption = new TextBlock('Muted caption', { fontSize: 11, fontName: StandardFonts.Helvetica });
  caption.textColor = new Color(0x99, 0x99, 0x99);
  const card = new Container({ child: caption });
  card.backgroundColor = new Color(0xf1, 0xf5, 0xf9);
  doc.add(card);
  return doc;
}

/** Serializes through the export's JSON route, then parses it back. */
function wire(result: SvgDocumentExport): Record<string, unknown> {
  return JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
}

/** Every value in a parsed JSON tree, depth first. */
function everyValue(value: unknown, visit: (v: unknown) => void): void {
  visit(value);
  if (Array.isArray(value)) for (const item of value) everyValue(item, visit);
  else if (value && typeof value === 'object') for (const item of Object.values(value)) everyValue(item, visit);
}

function rootAttributes(svg: string): { width: number; height: number; viewBox: string } {
  const root = /<svg\b[^>]*>/.exec(svg)![0];
  const attr = (name: string): string => new RegExp(`\\b${name}="([^"]*)"`).exec(root)![1];
  return { width: Number(attr('width')), height: Number(attr('height')), viewBox: attr('viewBox') };
}

describe('SVG document export envelope (with layout)', () => {
  let doc: Document;
  afterEach(() => doc?.dispose());

  it('carries version 1, one page with its size in the root element, and empty font CSS', async () => {
    doc = fixtureDocument();
    const result = await doc.generateSvgDocumentAsync({ captureLayout: true });

    expect(SVG_DOCUMENT_EXPORT_VERSION).toBe(1);
    expect(result.version).toBe(1);
    expect(result.pages).toHaveLength(1);
    expect(rootAttributes(result.pages[0])).toEqual({ width: 595.276, height: 841.89, viewBox: '0 0 595.276 841.89' });
    // Helvetica only, and standard-14 faces are viewer-supplied in SVG output.
    expect(result.fontFaceCss).toBe('');
  });

  it('carries the snapshot with its own version and document meta', async () => {
    doc = fixtureDocument();
    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });

    expect(snapshot).toBeDefined();
    expect(snapshot!.version).toBe(LAYOUT_SNAPSHOT_VERSION);
    expect(snapshot!.root.type).toBe('Document');
    expect(snapshot!.meta).toEqual({
      accessibilityMode: 1,
      conformance: 'None',
      language: 'en-GB',
      title: 'Contrast fixture',
    });
  });

  it('attaches the report the evaluator produces for that snapshot, with default options', async () => {
    doc = fixtureDocument();
    const { snapshot, report } = await doc.generateSvgDocumentAsync({ captureLayout: true });

    expect(report).toEqual(evaluateCompliance(snapshot!));
    // The contrast-insufficient fixture's expected report.
    expect(report).toMatchObject({ passed: true, errorCount: 0, warningCount: 1, infoCount: 1 });
    const findings = report!.findings.map(f => ({
      code: f.code,
      severity: f.severity,
      standard: f.standard,
      clause: f.clause,
      nodeId: f.nodeId,
    }));
    expect(findings).toEqual(
      expect.arrayContaining([
        {
          code: 'contrast-insufficient',
          severity: 'warning',
          standard: 'WCAG 2.2',
          clause: 'WCAG 2.2 SC 1.4.3 (AA)',
          nodeId: 'n3',
        },
        {
          code: 'doc-no-headings',
          severity: 'info',
          standard: 'PDF/UA-1',
          clause: 'ISO 14289-1:2014 §7.4',
          nodeId: undefined,
        },
      ])
    );
  });
});

describe('SVG document export envelope (without layout)', () => {
  let doc: Document;
  afterEach(() => doc?.dispose());

  it('omits both snapshot and report rather than setting them', async () => {
    doc = fixtureDocument();
    const result = await doc.generateSvgDocumentAsync();

    expect(result.version).toBe(1);
    expect(result.pages).toHaveLength(1);
    expect(result.fontFaceCss).toBe('');
    expect('snapshot' in result).toBe(false);
    expect('report' in result).toBe(false);

    const json = wire(result);
    expect(Object.keys(json).sort()).toEqual(['fontFaceCss', 'pages', 'version']);
  });
});

describe('SVG document export JSON form', () => {
  let doc: Document;
  afterEach(() => doc?.dispose());

  it('is plain data: a JSON round trip reproduces it exactly', async () => {
    doc = fixtureDocument();
    const result = await doc.generateSvgDocumentAsync({ captureLayout: true });
    // toStrictEqual also fails on class instances and undefined-valued keys,
    // which the JSON form cannot carry.
    expect(wire(result)).toStrictEqual(result);
  });

  it('uses camelCase keys at the root and never writes null', async () => {
    doc = fixtureDocument();
    const json = wire(await doc.generateSvgDocumentAsync({ captureLayout: true }));

    expect(Object.keys(json).sort()).toEqual(['fontFaceCss', 'pages', 'report', 'snapshot', 'version']);
    everyValue(json, v => expect(v).not.toBeNull());
  });

  it('writes severities as lower-case strings', async () => {
    doc = fixtureDocument();
    const json = wire(await doc.generateSvgDocumentAsync({ captureLayout: true }));
    const findings = (json.report as { findings: { severity: unknown }[] }).findings;

    expect(findings.length).toBeGreaterThan(0);
    for (const finding of findings) expect(['error', 'warning', 'info']).toContain(finding.severity);
  });

  it('writes only finite numbers', async () => {
    doc = fixtureDocument();
    const result = await doc.generateSvgDocumentAsync({ captureLayout: true });
    everyValue(result, v => {
      if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
    });
  });
});
