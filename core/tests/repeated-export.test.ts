import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { TextBlock } from '../src/Elements/Text/TextBlock';
import { VerticalStack } from '../src/Elements/Layout/VerticalStack';
import { Container } from '../src/Elements/Layout/Container';
import { Table } from '../src/Elements/Tables/Table';

// Regression: exporting the same Document more than once must produce identical,
// non-empty output. Stateful elements (TextBlock, …) track continuation state
// for cross-page flow; the render pipeline must reset that state once an element
// completes, otherwise a second pass skips already-"rendered" content and emits a
// near-empty PDF. This previously broke the website's "SVG preview then PDF
// download" flow, where both outputs come from one Document. Mirrors the .NET
// reference pipeline, which resets state after each stateful element completes.
function richDoc(): Document {
  const doc = new Document();
  doc.add(new TextBlock('Hello, Document API!'));
  doc.add(new TextBlock('This is a second paragraph with some content.'));
  const stack = new VerticalStack();
  for (const line of ['- one', '- two', '- three']) {
    stack.addChild(new TextBlock(line));
  }
  doc.add(stack);
  doc.addPage();
  doc.add(new TextBlock('Page two content.'));
  return doc;
}

// A document whose stateful content (TextBlock, Table) is nested inside a
// non-stateful Container/VerticalStack — the structure the template examples
// (annual-report, patient-summary, …) use. Nested children must render
// statelessly so a second export pass does not collapse them. Mirrors the .NET
// reference, where Container/VerticalStack render nested children via Render().
function containerWrappedDoc(): Document {
  const doc = new Document();
  const stack = new VerticalStack();
  stack.addChild(new TextBlock('Card title'));
  const table = new Table(1, 1);
  table.addRow(new TextBlock('Label'), new TextBlock('Value'));
  stack.addChild(table);

  const card = new Container();
  card.child = stack;
  doc.add(card);
  return doc;
}

describe('Repeated export idempotency', () => {
  let doc: Document;
  afterEach(() => doc?.dispose());

  it('generateBytes() twice yields identical, non-empty output', () => {
    doc = richDoc();
    const first = doc.generateBytes();
    const second = doc.generateBytes();
    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBe(first.length);
  });

  it('matches a freshly-built document on the second pass', () => {
    doc = richDoc();
    doc.generateBytes(); // consume once
    const reExported = doc.generateBytes();
    const fresh = richDoc().generateBytes();
    expect(reExported.length).toBe(fresh.length);
  });

  it('renders text content on the SVG pass and the following PDF pass', async () => {
    doc = richDoc();
    const svg = await doc.generateSvgPagesAsync();
    expect(svg[0]).toContain('Hello, Document API!');

    // The PDF pass runs after the SVG pass on the same Document; it must not be
    // collapsed by stale continuation state.
    const afterSvg = doc.generateBytes();
    const clean = richDoc().generateBytes();
    expect(afterSvg.length).toBe(clean.length);
  });

  it('does not collapse content nested inside non-stateful containers', () => {
    doc = containerWrappedDoc();
    const first = doc.generateBytes();
    const second = doc.generateBytes();
    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBe(first.length);
    expect(second.length).toBe(containerWrappedDoc().generateBytes().length);
  });

  it('renders container-wrapped content on SVG-then-PDF (website flow)', async () => {
    doc = containerWrappedDoc();
    await doc.generateSvgPagesAsync();
    const afterSvg = doc.generateBytes();
    const clean = containerWrappedDoc().generateBytes();
    expect(afterSvg.length).toBe(clean.length);
  });
});
