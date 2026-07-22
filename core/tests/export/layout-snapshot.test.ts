import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { Hyperlink } from '../../src/Core/Hyperlink';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { LAYOUT_SNAPSHOT_VERSION, LayoutNode } from '../../src/Rendering/LayoutRecorder';
import { markDebugSource } from '../../src/Rendering/DebugSource';

/** Depth-first walk of the snapshot tree. */
function walk(node: LayoutNode, visit: (n: LayoutNode) => void): void {
  visit(node);
  for (const c of node.children) walk(c, visit);
}

function collect(node: LayoutNode): LayoutNode[] {
  const out: LayoutNode[] = [];
  walk(node, n => out.push(n));
  return out;
}

describe('Layout snapshot capture (this feature / structure view)', () => {
  let doc: Document;
  afterEach(() => doc?.dispose());

  it('does not produce a snapshot unless captureLayout is requested', async () => {
    doc = new Document();
    doc.add(new TextBlock('Hello', 14, StandardFonts.Helvetica));
    const result = await doc.generateSvgDocumentAsync();
    expect(result.snapshot).toBeUndefined();
  });

  it('carries opaque source ids only for preview-marked elements', async () => {
    doc = new Document();
    const marked = markDebugSource(
      markDebugSource(new TextBlock('Marked', 14, StandardFonts.Helvetica), 'src:test-title'),
      'src:outer-factory'
    );
    doc.add(marked);
    doc.add(new TextBlock('Unmarked', 11, StandardFonts.Helvetica));

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const nodes = collect(snapshot!.root).filter(n => n.type === 'TextBlock');
    expect(nodes[0].sourceId).toBe('src:test-title');
    expect(nodes[1].sourceId).toBeUndefined();
  });

  it('captures a Document → Page → content tree', async () => {
    doc = new Document();
    doc.add(new TextBlock('First', 14, StandardFonts.Helvetica));
    doc.add(new TextBlock('Second', 11, StandardFonts.Helvetica));

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    expect(snapshot).toBeDefined();
    expect(snapshot!.version).toBe(LAYOUT_SNAPSHOT_VERSION);
    expect(snapshot!.pages).toHaveLength(1);

    const root = snapshot!.root;
    expect(root.type).toBe('Document');
    expect(root.children).toHaveLength(1);

    const page = root.children[0];
    expect(page.type).toBe('Page');
    // Both text blocks are captured as children of the page.
    const types = page.children.map(c => c.type);
    expect(types).toEqual(['TextBlock', 'TextBlock']);
  });

  it('rectangles use a top-left, in-bounds, points coordinate space', async () => {
    doc = new Document();
    doc.add(new TextBlock('Measure me', 14, StandardFonts.Helvetica));

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const { width, height } = snapshot!.pages[0];

    const text = collect(snapshot!.root).find(n => n.type === 'TextBlock')!;
    expect(text.rects.length).toBeGreaterThan(0);
    const r = text.rects[0];
    expect(r.page).toBe(0);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
    // Near the top of the page (top-left origin), not the bottom.
    expect(r.y).toBeLessThan(height / 2);
    expect(r.x + r.width).toBeLessThanOrEqual(width + 0.5);
  });

  it('nests children under a VerticalStack', async () => {
    doc = new Document();
    const stack = new VerticalStack();
    stack.addChild(new TextBlock('A', 12, StandardFonts.Helvetica));
    stack.addChild(new TextBlock('B', 12, StandardFonts.Helvetica));
    doc.add(stack);

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const vstack = collect(snapshot!.root).find(n => n.type === 'VerticalStack');
    expect(vstack).toBeDefined();
    expect(vstack!.children.map(c => c.type)).toEqual(['TextBlock', 'TextBlock']);
  });

  it('captures Hyperlink nodes with the Link role', async () => {
    // Hyperlink implements IElement directly (not ElementBase), so it records
    // its own snapshot node - a regression here makes links invisible to the
    // previewer's structure and accessibility views.
    doc = new Document();
    doc.add(new TextBlock('Before', 12, StandardFonts.Helvetica));
    doc.add(new Hyperlink('Visit example', 'https://example.com'));

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const link = collect(snapshot!.root).find(n => n.type === 'Hyperlink');
    expect(link).toBeDefined();
    expect(link!.a11y?.role).toBe('Link');
    expect(link!.a11y?.tagged).toBe(true);
    expect(link!.rects.length).toBeGreaterThan(0);
  });

  it('splits a paginating element into one rect per page', async () => {
    doc = new Document();
    // Enough content to overflow a single A4 page several times over.
    for (let i = 0; i < 120; i++) {
      doc.add(new TextBlock(`Line ${i + 1}`, 14, StandardFonts.Helvetica));
    }

    const { snapshot, pages } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    expect(pages.length).toBeGreaterThan(1);
    expect(snapshot!.pages.length).toBe(pages.length);

    // The Page node spans every physical page it overflowed onto.
    const page = snapshot!.root.children[0];
    const touchedPages = new Set(page.rects.map(r => r.page));
    expect(touchedPages.size).toBe(pages.length);
    // Rects are ordered and reference valid pages.
    for (const r of page.rects) {
      expect(r.page).toBeGreaterThanOrEqual(0);
      expect(r.page).toBeLessThan(pages.length);
      expect(r.height).toBeGreaterThan(0);
    }
  });

  it('node ids are unique and deterministic across runs', async () => {
    const build = () => {
      const d = new Document();
      d.add(new TextBlock('X', 12, StandardFonts.Helvetica));
      d.add(new TextBlock('Y', 12, StandardFonts.Helvetica));
      return d;
    };
    const a = build();
    const b = build();
    const sa = (await a.generateSvgDocumentAsync({ captureLayout: true })).snapshot!;
    const sb = (await b.generateSvgDocumentAsync({ captureLayout: true })).snapshot!;
    a.dispose();
    b.dispose();

    const idsA = collect(sa.root).map(n => `${n.id}:${n.type}`);
    const idsB = collect(sb.root).map(n => `${n.id}:${n.type}`);
    expect(new Set(idsA.map(s => s.split(':')[0])).size).toBe(idsA.length); // unique
    expect(idsA).toEqual(idsB); // deterministic
  });

  it('byte-unchanged guard: captureLayout does not alter SVG output', async () => {
    const build = () => {
      const d = new Document();
      const stack = new VerticalStack();
      stack.addChild(new TextBlock('Alpha', 14, StandardFonts.Helvetica));
      stack.addChild(new TextBlock('Beta', 11, StandardFonts.Helvetica));
      d.add(stack);
      for (let i = 0; i < 60; i++) d.add(new TextBlock(`Row ${i}`, 12, StandardFonts.Helvetica));
      return d;
    };
    const plain = build();
    const captured = build();
    const off = await plain.generateSvgDocumentAsync();
    const on = await captured.generateSvgDocumentAsync({ captureLayout: true });
    plain.dispose();
    captured.dispose();

    expect(on.pages).toEqual(off.pages);
    expect(on.fontFaceCss).toEqual(off.fontFaceCss);
  });
});
