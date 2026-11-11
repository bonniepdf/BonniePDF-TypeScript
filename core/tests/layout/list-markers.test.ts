import { describe, it, expect, beforeAll } from 'vitest';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { FontManager } from '../../src/Typography/FontManager';
import { Document } from '../../src/Document';
import { OrderedList } from '../../src/Elements/Lists/OrderedList';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';

/** Spec 03 §3, Markers: an item's marker is drawn beside its first line only (fixtures/layout/list-markers.json). */
describe('list markers', () => {
  const LONG =
    'This is a long list item that will certainly wrap onto a second line because it keeps going and going well past the right margin of the page.';

  // Tagged output embeds the standard font's Liberation substitute, as it does in an application.
  beforeAll(() => FontManager.autoRegisterBundledFonts(fileURLToPath(new URL('../../assets/fonts', import.meta.url))));

  /** The text of each run drawn on the page: literal strings untagged, their ActualText when tagged (embedded font). */
  function drawnRuns(content: string, tagged: boolean): string[] {
    const pattern = tagged ? /\/ActualText \((.*?)\) >>/g : /\((.*?)\) Tj/g;
    return [...content.matchAll(pattern)].map(m => m[1]);
  }

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
      expect(drawnRuns(pageContent(tagged), tagged)).toEqual([
        '1.',
        'This is a long list item that will certainly wrap onto a second line because it keeps going',
        'and going well past the right margin of the page.',
        '2.',
        'Short item',
      ]);
    });
  }
});
