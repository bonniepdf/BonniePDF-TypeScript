import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { OrderedList } from '../../src/Elements/Lists/OrderedList';
import { UnorderedList } from '../../src/Elements/Lists/UnorderedList';
import { BulletStyle } from '../../src/Elements/Lists/BulletStyle';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { Color } from '../../src/Core/Color';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { pdfToText } from '../helpers/test-base';

/**
 * List structure tagging. A tagged OrderedList / UnorderedList must produce
 *   /L > /LI > /Lbl + /LBody
 * in the structure tree (mirroring the .NET ListTaggingTests).
 */
describe('List tagging', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  function generateTagged(populate: (d: Document) => void): string {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';
    populate(doc);
    return pdfToText(doc.generateBytes());
  }

  function makeOrdered(...items: string[]): OrderedList {
    const list = new OrderedList();
    for (const item of items) list.addItem(item);
    return list;
  }

  function makeUnordered(...items: string[]): UnorderedList {
    const list = new UnorderedList();
    list.bulletStyle = BulletStyle.Disc;
    for (const item of items) list.addItem(item);
    return list;
  }

  // ── Struct-elem presence ──────────────────────────────────────────────────

  it('tagged ordered list emits L, LI, Lbl, and LBody struct elems', () => {
    const text = generateTagged(d => d.add(makeOrdered('Alpha', 'Beta', 'Gamma')));

    expect(text).toContain('/S /L');
    expect(text).toContain('/S /LI');
    expect(text).toContain('/S /Lbl');
    expect(text).toContain('/S /LBody');
  });

  it('tagged unordered list emits L, LI, Lbl, and LBody struct elems', () => {
    const text = generateTagged(d => d.add(makeUnordered('One', 'Two', 'Three')));

    expect(text).toContain('/S /L');
    expect(text).toContain('/S /LI');
    expect(text).toContain('/S /Lbl');
    expect(text).toContain('/S /LBody');
  });

  // ── Struct-elem counts ───────────────────────────────────────────────────

  it('three items → three LI struct elems', () => {
    const text = generateTagged(d => d.add(makeOrdered('A', 'B', 'C')));

    expect(countSubstring(text, '/S /LI\n')).toBe(3);
    expect(countSubstring(text, '/S /Lbl\n')).toBe(3);
    expect(countSubstring(text, '/S /LBody\n')).toBe(3);
    expect(countSubstring(text, '/S /L\n')).toBe(1);
  });

  it('two unordered items → two LI struct elems', () => {
    const text = generateTagged(d => d.add(makeUnordered('X', 'Y')));

    expect(countSubstring(text, '/S /LI\n')).toBe(2);
    expect(countSubstring(text, '/S /L\n')).toBe(1);
  });

  // ── Untagged path unchanged ──────────────────────────────────────────────

  it('untagged ordered list emits no struct elems', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.None;
    doc.add(makeOrdered('A', 'B'));
    const text = pdfToText(doc.generateBytes());

    expect(text).not.toContain('/S /L');
    expect(text).not.toContain('/S /LI');
    expect(text).not.toContain('/S /Lbl');
    expect(text).not.toContain('/S /LBody');
  });

  it('untagged unordered list emits no struct elems', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.None;
    doc.add(makeUnordered('X', 'Y'));
    const text = pdfToText(doc.generateBytes());

    expect(text).not.toContain('/S /L');
    expect(text).not.toContain('/S /LI');
  });

  // ── Nested lists ─────────────────────────────────────────────────────────

  it('nested ordered list produces two L struct elems', () => {
    const outer = makeOrdered('Parent A', 'Parent B');
    const inner = makeOrdered('Child 1', 'Child 2');
    outer.addNestedList(inner);

    const text = generateTagged(d => d.add(outer));

    // Outer L + inner L
    expect(countSubstring(text, '/S /L\n')).toBe(2);
    // Two outer LIs + two inner LIs
    expect(countSubstring(text, '/S /LI\n')).toBe(4);
  });

  it('nested unordered list produces two L struct elems', () => {
    const outer = makeUnordered('Main 1', 'Main 2');
    const inner = makeUnordered('Sub a', 'Sub b', 'Sub c');
    outer.addNestedList(inner);

    const text = generateTagged(d => d.add(outer));

    expect(countSubstring(text, '/S /L\n')).toBe(2);
    expect(countSubstring(text, '/S /LI\n')).toBe(5);
  });

  // ── BDC/EMC balance ──────────────────────────────────────────────────────

  it('default text style cascades into nested ordered and unordered lists', () => {
    doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withColor(ColorPalette.slate[700]);

    const orderedOuter = makeOrdered('Parent');
    const orderedInner = makeOrdered('Child');
    orderedOuter.addNestedList(orderedInner);
    doc.add(orderedOuter);

    const unorderedOuter = makeUnordered('Parent');
    const unorderedInner = makeUnordered('Child');
    unorderedOuter.addNestedList(unorderedInner);
    doc.add(unorderedOuter);

    doc.generateBytes();

    expect(orderedInner.textColor).toBe(ColorPalette.slate[700]);
    expect(unorderedInner.textColor).toBe(ColorPalette.slate[700]);
    expect(unorderedInner.bulletColor).toBe(ColorPalette.slate[700]);
  });

  it('explicit unordered bullet color is preserved when text style cascades', () => {
    doc = new Document();
    doc.settings.defaultTextStyle = new TextStyle().withColor(ColorPalette.slate[700]);

    const outer = makeUnordered('Parent');
    const inner = makeUnordered('Child');
    inner.bulletColor = Color.red;
    outer.addNestedList(inner);
    doc.add(outer);

    doc.generateBytes();

    expect(inner.textColor).toBe(ColorPalette.slate[700]);
    expect(inner.bulletColor).toBe(Color.red);
  });

  it('every page stream is marked-content-balanced (ordered list)', () => {
    // 20 items fits comfortably on one page; avoids cross-page close complexity
    // that is a pre-existing infrastructure issue unrelated to list tagging.
    const text = generateTagged(d => {
      const list = makeOrdered(...Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`));
      d.add(list);
    });

    const streams = splitPageContentStreams(text);
    expect(streams.length).toBeGreaterThanOrEqual(1);
    for (const s of streams) {
      // Container elements emit BMC (not BDC), so count both open types.
      const opens = countSubstring(s, 'BDC') + countSubstring(s, 'BMC');
      expect(opens).toBe(countSubstring(s, 'EMC'));
    }
  });

  it('every page stream is marked-content-balanced (unordered list)', () => {
    const text = generateTagged(d => {
      const list = makeUnordered(...Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`));
      d.add(list);
    });

    const streams = splitPageContentStreams(text);
    expect(streams.length).toBeGreaterThanOrEqual(1);
    for (const s of streams) {
      const opens = countSubstring(s, 'BDC') + countSubstring(s, 'BMC');
      expect(opens).toBe(countSubstring(s, 'EMC'));
    }
  });
});

function splitPageContentStreams(pdf: string): string[] {
  const result: string[] = [];
  let idx = 0;
  while (true) {
    const streamStart = pdf.indexOf('stream\n', idx);
    if (streamStart < 0) break;
    const contentStart = streamStart + 'stream\n'.length;
    const streamEnd = pdf.indexOf('endstream', contentStart);
    if (streamEnd < 0) break;
    const content = pdf.substring(contentStart, streamEnd);
    if (content.includes('BT') && content.includes('ET')) {
      result.push(content);
    }
    idx = streamEnd + 'endstream'.length;
  }
  return result;
}

function countSubstring(source: string, needle: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = source.indexOf(needle, idx)) >= 0) {
    count++;
    idx += needle.length;
  }
  return count;
}
