import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { Table } from '../../src/Elements/Tables/Table';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Container } from '../../src/Elements/Layout/Container';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { Color } from '../../src/Core/Color';
import { pdfToText } from '../helpers/test-base';

/**
 * A border or background applied to a table cell's content spans the whole row, not just the cell's own
 * text: a short cell beside a tall one is drawn as tall as the tall one.
 * Mirrors BonniePDF.Tests/Layout/TableCellStretchTests.cs.
 */

const LONG = 'a much longer piece of text that has to wrap onto several lines inside its narrow column';

async function firstRow(cells: (text: string) => Container, texts: string[]): Promise<string> {
  const table = new Table(...texts.map(() => 1));
  table.addRow(...texts.map(cells));
  const doc = new Document(new DocumentSettings({ margin: 50 }));
  doc.add(table);
  const out = pdfToText(await doc.generateBytesAsync());
  doc.dispose();
  return out;
}

describe('table cell stretch', () => {
  it('draws cell borders the height of the row', async () => {
    const text = await firstRow(
      t => new Container({ padding: { top: 4, bottom: 4 }, border: 1, child: new TextBlock({ text: t }) }),
      ['short', LONG, '']
    );

    // The left edge of each of the three cells: same length.
    const heights = [...text.matchAll(/([\d.]+) ([\d.]+) m \1 ([\d.]+) l S/g)]
      .map(m => Math.abs(Number(m[2]) - Number(m[3])))
      .filter(h => h > 1);

    expect(heights.length).toBeGreaterThan(0);
    for (const h of heights) expect(h).toBeCloseTo(heights[0], 2);
    expect(heights[0]).toBeGreaterThan(40); // the wrapped cell makes the row tall
  });

  it('fills cell backgrounds the height of the row', async () => {
    const colours = [Color.red, Color.blue];
    let i = 0;
    const text = await firstRow(
      t =>
        new Container({
          padding: { top: 4, bottom: 4 },
          backgroundColor: colours[i++],
          child: new TextBlock({ text: t }),
        }),
      ['short', LONG]
    );

    const heights = [...text.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re\s*f/g)].map(m => Number(m[4]));

    expect(heights).toHaveLength(2);
    expect(heights[0]).toBeCloseTo(heights[1], 2);
  });

  it('leaves a container nested inside the cell at its natural height', async () => {
    const table = new Table(1, 1);
    table.addRow(
      new VerticalStack({
        children: [new Container({ backgroundColor: Color.red, child: new TextBlock({ text: 'short' }) })],
      }),
      new TextBlock({ text: LONG })
    );
    const doc = new Document(new DocumentSettings({ margin: 50 }));
    doc.add(table);
    const text = pdfToText(await doc.generateBytesAsync());
    doc.dispose();

    const red = [...text.matchAll(/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re\s*f/g)].map(m => Number(m[4]));

    // The red block sits in a stack inside the cell, so it is not the cell's own container: one line tall.
    expect(red).toHaveLength(1);
    expect(red[0]).toBeLessThan(20);
  });
});
