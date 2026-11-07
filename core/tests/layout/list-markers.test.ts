import { describe, it, expect } from 'vitest';
import { inflateSync } from 'node:zlib';
import { Document } from '../../src/Document';
import { OrderedList } from '../../src/Elements/Lists/OrderedList';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';

/** Spec 03 §3, Markers: an item's marker is drawn beside its first line only (fixtures/layout/list-markers.json). */
describe('list markers', () => {
  const LONG =
    'This is a long list item that will certainly wrap onto a second line because it keeps going and going well past the right margin of the page.';

  function pageContent(tagged: boolean): string {
    const doc = new Document();
    if (tagged) {
      doc.settings.accessibility = AccessibilityMode.PdfUa1;
      doc.settings.language = 'en-GB';
    }
    doc.add(new OrderedList({ items: [LONG, 'Short item'] }));
    try {
      const bytes = doc.generateBytes();
      const raw = Buffer.from(bytes).toString('latin1');
      const start = raw.indexOf('stream\n') + 'stream\n'.length;
      return inflateSync(bytes.subarray(start, raw.indexOf('endstream', start))).toString('latin1');
    } finally {
      doc.dispose();
    }
  }

  for (const tagged of [false, true]) {
    it(`draws each number once when an item wraps (${tagged ? 'tagged' : 'untagged'})`, () => {
      const content = pageContent(tagged);
      expect(content).toContain('(and going well past the right margin of the page.) Tj');
      expect(content.match(/\(1\.\) Tj/g)).toHaveLength(1);
      expect(content.match(/\(2\.\) Tj/g)).toHaveLength(1);
    });
  }
});
