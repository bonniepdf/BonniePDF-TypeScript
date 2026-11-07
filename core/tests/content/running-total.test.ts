import { describe, it, expect } from 'vitest';
import { inflateSync } from 'node:zlib';
import { Document } from '../../src/Document';
import { Table } from '../../src/Elements/Tables/Table';
import { TableRow } from '../../src/Elements/Tables/TableRow';
import { TableCell } from '../../src/Elements/Tables/TableCell';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';

/** Spec 03, Table running total: carried- and brought-forward rows across page breaks. */
describe('table running total', () => {
  const value = (i: number) => 12.5 + i;

  function table(running: boolean): Table {
    const t = new Table({ columns: [4, 1, 1.4] });
    if (running) {
      t.runningTotalColumn = 2;
      t.runningTotalPrefix = '£';
    }
    t.addHeader('Item', 'Qty', 'Net');
    for (let i = 0; i < 60; i++) {
      const row = new TableRow([
        new TableCell({ content: new TextBlock(`Line ${i + 1}`) }),
        new TableCell({ content: new TextBlock('1') }),
        new TableCell({ content: new TextBlock(value(i).toFixed(2)) }),
      ]);
      row.runningValue = value(i);
      t.addRow(row);
    }
    return t;
  }

  async function pageTexts(running: boolean): Promise<string[]> {
    const doc = new Document();
    doc.add(table(running));
    try {
      return (await doc.generateSvgPagesAsync()).map(svg => [...svg.matchAll(/>([^<]*)</g)].map(m => m[1]).join(' '));
    } finally {
      doc.dispose();
    }
  }

  it('ends each continuing page with the total so far and opens the next with it', async () => {
    const pages = await pageTexts(true);
    expect(pages.length).toBeGreaterThan(1);
    const linesOnFirst = [...pages[0].matchAll(/Line (\d+)/g)].length;
    const sum = Array.from({ length: linesOnFirst }, (_, i) => value(i)).reduce((a, b) => a + b, 0);
    const figure = `£${sum.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    expect(pages[0]).toContain('Carried forward');
    expect(pages[0]).toContain(figure);
    expect(pages[1]).toContain('Brought forward');
    expect(pages[1]).toContain(figure);
    expect(pages[1].indexOf('Brought forward')).toBeLessThan(pages[1].indexOf(`Line ${linesOnFirst + 1}`));
    expect(pages.at(-1)).not.toContain('Carried forward');
  });

  it('adds no table rows to the structure: the running rows are artifacts', () => {
    const rowsTagged = (running: boolean) => {
      const doc = new Document();
      doc.settings.accessibility = AccessibilityMode.PdfUa1;
      doc.settings.language = 'en-GB';
      doc.metadata.title = 'Running total';
      doc.add(table(running));
      try {
        const bytes = doc.generateBytes();
        const raw = Buffer.from(bytes).toString('latin1');
        let text = raw;
        for (const m of raw.matchAll(/stream\r?\n/g)) {
          const start = m.index! + m[0].length;
          try {
            text += inflateSync(bytes.subarray(start, raw.indexOf('endstream', start))).toString('latin1');
          } catch {
            // Not a deflated stream.
          }
        }
        return { trs: (text.match(/\/S \/TR\b/g) ?? []).length, artifacts: (text.match(/\/Artifact\b/g) ?? []).length };
      } finally {
        doc.dispose();
      }
    };
    const without = rowsTagged(false);
    const withTotal = rowsTagged(true);
    expect(withTotal.trs).toBe(without.trs);
    expect(withTotal.artifacts).toBeGreaterThan(without.artifacts);
  });

  it('sets the running rows in the document default text style', async () => {
    const doc = new Document({ settings: { defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9 } } });
    doc.add(table(true));
    try {
      const svg = (await doc.generateSvgPagesAsync())[0];
      const label = svg.match(/<text[^>]*>Carried forward</)?.[0] ?? '';
      expect(label).toMatch(/font-size="9(px)?"/);
      expect(label).toMatch(/font-weight="(bold|700)"|Bold/);
    } finally {
      doc.dispose();
    }
  });

  it('rejects a running-total column that leaves no room for the label', async () => {
    const t = table(true);
    t.runningTotalColumn = 0;
    const doc = new Document();
    doc.add(t);
    await expect(doc.generateBytesAsync()).rejects.toThrow(/runningTotalColumn/);
    doc.dispose();
  });
});
