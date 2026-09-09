import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Container } from '../../src/Elements/Layout/Container';
import { Table } from '../../src/Elements/Tables/Table';
import { Hyperlink } from '../../src/Core/Hyperlink';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { Color } from '../../src/Core/Color';
import { LayoutNode, paintOf, LAYOUT_SNAPSHOT_VERSION } from '../../src/Rendering/LayoutRecorder';
import { evaluateCompliance, ComplianceSeverity } from '../../src/Compliance/ComplianceEvaluator';
import type { ComplianceReport } from '../../src/Compliance/ComplianceEvaluator';
import { contrastRatio, relativeLuminance, requiredRatio, parseHexRgb } from '../../src/Compliance/Contrast';

function findAll(node: LayoutNode, pred: (n: LayoutNode) => boolean): LayoutNode[] {
  const hits: LayoutNode[] = [];
  const walk = (n: LayoutNode): void => {
    if (pred(n)) hits.push(n);
    for (const c of n.children) walk(c);
  };
  walk(node);
  return hits;
}

/** Builds a tagged document with a title and language, so only contrast findings remain. */
function baselineDocument(): Document {
  const doc = new Document();
  doc.metadata.title = 'Contrast fixture';
  doc.settings.accessibility = AccessibilityMode.PdfUa1;
  doc.settings.language = 'en-GB';
  return doc;
}

describe('WCAG contrast maths', () => {
  it('computes the reference luminances for black and white', () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10);
  });

  it('gives 21:1 for black on white, in either order', () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 10);
    expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 10);
  });

  it('gives 1:1 for a colour against itself', () => {
    expect(contrastRatio([18, 52, 86], [18, 52, 86])).toBeCloseTo(1, 10);
  });

  it('matches the WCAG worked example for #767676 on white', () => {
    // #767676 is the canonical "just passes 4.5:1 on white" grey.
    const ratio = contrastRatio([0x76, 0x76, 0x76], [255, 255, 255]);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeLessThan(4.6);
  });

  it('applies the large-text threshold at 18pt, or 14pt when bold', () => {
    expect(requiredRatio(12, false)).toBe(4.5);
    expect(requiredRatio(14, false)).toBe(4.5);
    expect(requiredRatio(14, true)).toBe(3);
    expect(requiredRatio(18, false)).toBe(3);
    expect(requiredRatio(undefined, false)).toBe(4.5);
  });

  it('rejects malformed hex rather than guessing', () => {
    expect(parseHexRgb('#ffffff')).toEqual([255, 255, 255]);
    expect(parseHexRgb('#fff')).toBeUndefined();
    expect(parseHexRgb('ffffff')).toBeUndefined();
    expect(parseHexRgb('#gggggg')).toBeUndefined();
  });
});

describe('paintOf — intrinsic paint capture', () => {
  it('captures text colour, size and boldness from a text element', () => {
    const tb = new TextBlock('Body', { fontSize: 11, fontName: StandardFonts.Helvetica });
    tb.textColor = new Color(0x33, 0x33, 0x33);
    expect(paintOf(tb, 'TextBlock')).toMatchObject({ text: '#333333', fontSize: 11 });
  });

  it('captures a container background', () => {
    const c = new Container();
    c.backgroundColor = new Color(0xee, 0xee, 0xee);
    expect(paintOf(c, 'Container')).toMatchObject({ background: '#eeeeee' });
  });

  it('omits alpha entirely when a colour is opaque', () => {
    const c = new Container();
    c.backgroundColor = new Color(0, 0, 0);
    expect(paintOf(c, 'Container')!.backgroundAlpha).toBeUndefined();
  });

  it('records alpha when a colour is translucent', () => {
    const c = new Container();
    c.backgroundColor = new Color(0, 0, 0, 128);
    expect(paintOf(c, 'Container')!.backgroundAlpha).toBeLessThan(1);
  });

  it('marks layered and freely drawn types as unmodellable backdrops', () => {
    expect(paintOf({}, 'Layers')).toMatchObject({ backdropUnknown: true });
    expect(paintOf({}, 'CanvasElement')).toMatchObject({ backdropUnknown: true });
  });

  it('returns undefined for an element that paints nothing relevant', () => {
    expect(paintOf({}, 'VerticalStack')).toBeUndefined();
  });
});

describe('contrast preflight — end to end', () => {
  it('emits schema v4 snapshots', async () => {
    const doc = baselineDocument();
    doc.add(new TextBlock('Body', { fontSize: 11, fontName: StandardFonts.Helvetica }));
    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    expect(snapshot!.version).toBe(LAYOUT_SNAPSHOT_VERSION);
    expect(snapshot!.version).toBeGreaterThanOrEqual(4);
  });

  it('passes dark text on the default white page with no findings', async () => {
    const doc = baselineDocument();
    doc.add(new TextBlock('Readable body text', { fontSize: 11, fontName: StandardFonts.Helvetica }));

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const report = evaluateCompliance(snapshot!);

    expect(report.findings.filter(f => f.code === 'contrast-insufficient')).toHaveLength(0);
    expect(report.findings.filter(f => f.code === 'contrast-unknown')).toHaveLength(0);
  });

  it('flags pale grey text on the default white page', async () => {
    const doc = baselineDocument();
    const faint = new TextBlock('Barely visible', { fontSize: 11, fontName: StandardFonts.Helvetica });
    faint.textColor = new Color(0xcc, 0xcc, 0xcc);
    doc.add(faint);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const report = evaluateCompliance(snapshot!);

    const finding = report.findings.find(f => f.code === 'contrast-insufficient');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe(ComplianceSeverity.Warning);
    expect(finding!.standard).toBe('WCAG 2.2');
    expect(finding!.clause).toBe('WCAG 2.2 SC 1.4.3 (AA)');
    expect(finding!.page).toBe(0);
    // The measured ratio and the threshold must both be in the message, so the
    // fix is a colour change rather than an investigation.
    expect(finding!.message).toMatch(/1\.6\d:1/);
    expect(finding!.message).toContain('4.5:1');
  });

  it('does not fail the report — contrast is a warning, not an error', async () => {
    const doc = baselineDocument();
    const faint = new TextBlock('Barely visible', { fontSize: 11, fontName: StandardFonts.Helvetica });
    faint.textColor = new Color(0xcc, 0xcc, 0xcc);
    doc.add(faint);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const report = evaluateCompliance(snapshot!);

    expect(report.errorCount).toBe(0);
    expect(report.passed).toBe(true);
  });

  it('measures against a container background rather than the page', async () => {
    const doc = baselineDocument();
    // White text: fine on the dark container it actually sits on, and hopeless
    // against the white page it would be measured against if the ancestor walk
    // did not work.
    const label = new TextBlock('On a dark card', { fontSize: 11, fontName: StandardFonts.Helvetica });
    label.textColor = new Color(255, 255, 255);
    const card = new Container({ child: label });
    card.backgroundColor = new Color(0x11, 0x22, 0x33);
    doc.add(card);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });

    // Guard against the test going vacuous: an empty container would also report
    // no findings, so assert the text really is nested under the painted card.
    const container = findAll(snapshot!.root, n => n.type === 'Container')[0];
    expect(container?.paint?.background).toBe('#112233');
    expect(findAll(container, n => n.paint?.text === '#ffffff')).toHaveLength(1);

    const report = evaluateCompliance(snapshot!);
    expect(report.findings.filter(f => f.code === 'contrast-insufficient')).toHaveLength(0);
  });

  it('uses the resolved table row background for a cell, not the page', async () => {
    const doc = baselineDocument();
    const table = new Table();
    // A dark row fill set on the table, which the cell element itself never carries.
    table.rowBackgroundColor = new Color(0x1f, 0x2a, 0x37);
    const white = new TextBlock('Light on dark', { fontSize: 11, fontName: StandardFonts.Helvetica });
    white.textColor = new Color(255, 255, 255);
    table.addRow(white, new TextBlock('Second', { fontSize: 11, fontName: StandardFonts.Helvetica }));
    doc.add(table);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const report = evaluateCompliance(snapshot!);

    // The white cell text passes only if the row cascade reached the snapshot.
    const findings = report.findings.filter(
      f => f.code === 'contrast-insufficient' && f.message.includes('Light on dark')
    );
    expect(findings).toHaveLength(0);

    const cells = findAll(snapshot!.root, n => n.type === 'TableCell');
    expect(cells.length).toBeGreaterThan(0);
    expect(cells[0].paint?.background).toBe('#1f2a37');
  });

  // Hyperlink paints text but is not a text element, so paint capture has to reach it on its own terms.
  it('captures paint from a hyperlink, which is not a text element', async () => {
    const doc = baselineDocument();
    doc.add(
      new Hyperlink('Terms and conditions', 'https://example.com', {
        fontSize: 11,
        textColor: new Color(0x99, 0x99, 0x99),
      })
    );

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });

    const links = findAll(snapshot!.root, n => n.type === 'Hyperlink');
    expect(links.length).toBeGreaterThan(0);
    expect(links[0].paint?.text).toBe('#999999');
    expect(links[0].paint?.fontSize).toBe(11);
    // Hyperlink exposes no weight, so it is never reported bold.
    expect(links[0].paint?.bold).toBeUndefined();
  });

  it('flags low-contrast hyperlink text', async () => {
    const doc = baselineDocument();
    doc.add(
      new Hyperlink('Terms and conditions', 'https://example.com', {
        fontSize: 11,
        textColor: new Color(0x99, 0x99, 0x99),
      })
    );

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const report = evaluateCompliance(snapshot!);

    const finding = report.findings.find(f => f.code === 'contrast-insufficient');
    expect(finding).toBeDefined();
    expect(finding!.severity).toBe(ComplianceSeverity.Warning);
    expect(finding!.standard).toBe('WCAG 2.2');
  });

  it('reports unknown rather than guessing when the page paints a background element', async () => {
    const doc = baselineDocument();
    const page = doc.pages[0];
    const backdrop = new Container();
    backdrop.backgroundColor = new Color(0x80, 0x80, 0x80);
    page.pageBackground = backdrop;
    doc.add(new TextBlock('Over an unknown backdrop', { fontSize: 11, fontName: StandardFonts.Helvetica }));

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    expect(snapshot!.pages[0].backdropUnknown).toBe(true);

    const report = evaluateCompliance(snapshot!);
    const unknown = report.findings.find(f => f.code === 'contrast-unknown');
    expect(unknown).toBeDefined();
    expect(unknown!.severity).toBe(ComplianceSeverity.Info);
    expect(report.findings.filter(f => f.code === 'contrast-insufficient')).toHaveLength(0);
  });

  it('reports unknown for translucent text instead of compositing it', async () => {
    const doc = baselineDocument();
    const ghost = new TextBlock('Half there', { fontSize: 11, fontName: StandardFonts.Helvetica });
    ghost.textColor = new Color(0x33, 0x33, 0x33, 100);
    doc.add(ghost);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const report = evaluateCompliance(snapshot!);

    expect(report.findings.some(f => f.code === 'contrast-unknown')).toBe(true);
    expect(report.findings.filter(f => f.code === 'contrast-insufficient')).toHaveLength(0);
  });

  it('resolves the page colour when no ancestor paints a background', async () => {
    const doc = baselineDocument();
    doc.settings.pageColor = new Color(0x22, 0x22, 0x22);
    // Near-black text on a near-black page: only detectable via the page colour.
    doc.add(new TextBlock('Dark on dark', { fontSize: 11, fontName: StandardFonts.Helvetica }));

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    expect(snapshot!.pages[0].color).toBe('#222222');

    const report = evaluateCompliance(snapshot!);
    expect(report.findings.some(f => f.code === 'contrast-insufficient')).toBe(true);
  });

  it('applies the large-text threshold, so 18pt grey passes where 11pt fails', async () => {
    const grey = new Color(0x94, 0x94, 0x94); // ~3.1:1 on white

    const small = baselineDocument();
    const smallText = new TextBlock('Small grey', { fontSize: 11, fontName: StandardFonts.Helvetica });
    smallText.textColor = grey;
    small.add(smallText);

    const large = baselineDocument();
    const largeText = new TextBlock('Large grey', { fontSize: 24, fontName: StandardFonts.Helvetica });
    largeText.textColor = grey;
    large.add(largeText);

    const smallReport = evaluateCompliance((await small.generateSvgDocumentAsync({ captureLayout: true })).snapshot!);
    const largeReport = evaluateCompliance((await large.generateSvgDocumentAsync({ captureLayout: true })).snapshot!);

    expect(smallReport.findings.some(f => f.code === 'contrast-insufficient')).toBe(true);
    expect(largeReport.findings.some(f => f.code === 'contrast-insufficient')).toBe(false);
  });

  it('evaluates nothing when the snapshot predates schema v4', () => {
    // A v2 consumer's snapshot carries no `paint`, so the contrast rules must
    // emit nothing rather than assume a white page and a black text colour.
    const report = evaluateCompliance({
      version: 2,
      pages: [{ width: 595.276, height: 841.89 }],
      root: {
        id: 'n0',
        type: 'Document',
        rects: [],
        children: [
          { id: 'n1', type: 'TextBlock', rects: [{ page: 0, x: 0, y: 0, width: 10, height: 10 }], children: [] },
        ],
      },
      meta: { accessibilityMode: 1, conformance: 'None', language: 'en', title: 'T' },
    });

    expect(report.findings.some(f => f.standard === 'WCAG 2.2')).toBe(false);
  });
});

// Mirrors the shared fixture compliance-preflight/contrast-suppressed: the WCAG
// family is a rule family the caller can switch off, and switching it off must
// remove the findings from the counts too — not merely from a rendered list.
describe('includeWcag option', () => {
  /** The fixture document: mid-grey text on a light container fill. */
  async function suppressedFixture(): Promise<{ on: ComplianceReport; off: ComplianceReport }> {
    const build = (): Document => {
      const doc = baselineDocument();
      const caption = new TextBlock('Muted caption', { fontSize: 11, fontName: StandardFonts.Helvetica });
      caption.textColor = new Color(0x99, 0x99, 0x99);
      const card = new Container({ child: caption });
      card.backgroundColor = new Color(0xf1, 0xf5, 0xf9);
      doc.add(card);
      return doc;
    };
    const { snapshot } = await build().generateSvgDocumentAsync({ captureLayout: true });
    return { on: evaluateCompliance(snapshot!), off: evaluateCompliance(snapshot!, { includeWcag: false }) };
  }

  it('runs the WCAG rules by default, so the one-argument call is unchanged', async () => {
    const { on } = await suppressedFixture();
    expect(on.findings.filter(f => f.code === 'contrast-insufficient')).toHaveLength(1);
    expect(on.warningCount).toBe(1);
  });

  it('suppresses every WCAG finding and its contribution to the counts', async () => {
    const { off } = await suppressedFixture();
    expect(off.findings.filter(f => f.standard === 'WCAG 2.2')).toHaveLength(0);
    expect(off.warningCount).toBe(0);
  });

  it('leaves the PDF/UA-1 findings and `passed` untouched', async () => {
    const { on, off } = await suppressedFixture();
    const ua = (report: ComplianceReport): string[] =>
      report.findings.filter(f => f.standard === 'PDF/UA-1').map(f => f.code);
    expect(ua(off)).toEqual(ua(on));
    expect(off.errorCount).toBe(on.errorCount);
    expect(off.passed).toBe(on.passed);
  });

  it('is exactly the unfiltered report minus its WCAG findings', async () => {
    const { on, off } = await suppressedFixture();
    expect(off.findings).toEqual(on.findings.filter(f => f.standard !== 'WCAG 2.2'));
  });
});

describe('capture stays observational', () => {
  it('produces byte-identical SVG with and without capture', async () => {
    const build = (): Document => {
      const doc = baselineDocument();
      const label = new TextBlock('On a card', { fontSize: 11, fontName: StandardFonts.Helvetica });
      label.textColor = new Color(0x33, 0x33, 0x33);
      const card = new Container({ child: label });
      card.backgroundColor = new Color(0xee, 0xee, 0xee);
      doc.add(card);
      return doc;
    };

    const withCapture = await build().generateSvgDocumentAsync({ captureLayout: true });
    const without = await build().generateSvgDocumentAsync({});

    expect(withCapture.pages).toEqual(without.pages);
    expect(withCapture.snapshot).toBeDefined();
    expect(without.snapshot).toBeUndefined();
  });
});
