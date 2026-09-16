import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { Container } from '../../src/Elements/Layout/Container';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import type { LayoutNode } from '../../src/Rendering/LayoutRecorder';

/**
 * Container `fillHeight` - shared conformance fixture `layout/fill-height`.
 * A container with `fillHeight` and no pinned height arranges to the body
 * content height left on the current page, never shrinking below its natural
 * content height, and resolves per page against that page's own chrome.
 *
 * Mirrors the .NET ContainerFillHeightTests.
 */

const PAGE = PdfSize.a4;
const MARGIN = 50;

function body(): TextBlock {
  return new TextBlock('band', { fontSize: 12, fontName: StandardFonts.Helvetica });
}

function findNode(node: LayoutNode, type: string): LayoutNode {
  const hit = search(node, type);
  if (!hit) throw new Error(`No ${type} node in the captured layout snapshot`);
  return hit;
}

function search(node: LayoutNode, type: string): LayoutNode | undefined {
  if (node.type === type) return node;
  for (const child of node.children) {
    const hit = search(child, type);
    if (hit) return hit;
  }
  return undefined;
}

/** Renders `doc` and returns the first Container node's captured rects. */
async function containerRects(doc: Document) {
  const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
  return findNode(snapshot!.root, 'Container').rects;
}

/** Renders `doc` and returns every Container node, in document order. */
async function containers(doc: Document): Promise<LayoutNode[]> {
  const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
  const found: LayoutNode[] = [];
  const visit = (node: LayoutNode): void => {
    if (node.type === 'Container') found.push(node);
    node.children.forEach(visit);
  };
  visit(snapshot!.root);
  return found;
}

function newDoc(): Document {
  const doc = new Document();
  doc.settings.pageSize = PAGE;
  doc.settings.margin = MARGIN;
  return doc;
}

describe('container fillHeight', () => {
  it('fills the whole body band when it starts at the top of the page', async () => {
    const doc = newDoc();
    doc.add(new Container({ fillHeight: true, child: body() }));

    const rect = (await containerRects(doc))[0];
    expect(rect.y).toBeCloseTo(MARGIN, 3);
    expect(rect.height).toBeCloseTo(PAGE.height - MARGIN * 2, 3);
  });

  it('fills only what is left below content already on the page', async () => {
    const doc = newDoc();
    const stack = new VerticalStack();
    stack.add(new Container({ height: 250, child: body() }));
    stack.add(new Container({ fillHeight: true, child: body() }));
    doc.add(stack);

    const filler = (await containers(doc))[1].rects[0];
    expect(filler.height).toBeCloseTo(PAGE.height - MARGIN - (MARGIN + 250), 3);
  });

  it('resolves against the reserved band, not the margin box', async () => {
    const doc = newDoc();
    doc.settings.headerTemplate = () => new Container({ height: 120 });
    doc.settings.footerTemplate = () => new Container({ height: 90 });
    doc.add(new Container({ fillHeight: true, child: body() }));

    const rect = (await containerRects(doc))[0];
    expect(rect.y).toBeCloseTo(120, 3);
    expect(rect.height).toBeCloseTo(PAGE.height - 90 - 120, 3);
  });

  it('never shrinks content below its natural height', async () => {
    const doc = newDoc();
    // Content taller than a whole content band (741.89pt), so no page break can
    // rescue it: fill must report the content's height, not the band's.
    doc.add(new Container({ fillHeight: true, child: tall(900) }));

    const filler = (await containers(doc))[0].rects[0];
    expect(filler.height).toBeCloseTo(900, 3);
  });

  it('lets an explicit height win outright', async () => {
    const doc = newDoc();
    doc.add(new Container({ fillHeight: true, height: 120, child: body() }));

    const rect = (await containerRects(doc))[0];
    expect(rect.height).toBeCloseTo(120, 3);
  });

  it('measures to its natural content height, ignoring fill', () => {
    const container = new Container({ fillHeight: true, child: body() });
    const plain = new Container({ child: body() });

    expect(container.measureHeight(400)).toBe(plain.measureHeight(400));
  });

  it('anchors content to the foot of the band with bottom alignment', async () => {
    const doc = newDoc();
    doc.add(new Container({ fillHeight: true, verticalAlignment: 'bottom', child: body() }));

    const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
    const text = findNode(snapshot!.root, 'TextBlock');

    // Bottom-anchored inside a band running to PAGE.height - MARGIN.
    expect(text.rects[0].y + text.rects[0].height).toBeCloseTo(PAGE.height - MARGIN, 1);
  });
});

/** A container tall enough to outgrow the space left on the page. */
function tall(height: number): Container {
  return new Container({ height, child: body() });
}
