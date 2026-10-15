import { MockCanvas } from '../helpers/mock-canvas';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { TtfFont } from '../../src/Typography/TrueType/TtfFont';
import { TextFlow } from '../../src/Typography/TextFlow';
import { ContentDirection } from '../../src/Configuration/ContentDirection';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { Container } from '../../src/Elements/Layout/Container';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { ElementBase } from '../../src/Elements/ElementBase';
import { Table } from '../../src/Elements/Tables/Table';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { applyContentDirection } from '../../src/Elements/ContentDirectionResolver';
import { records } from '../helpers/glyph-records';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/rtl.json', import.meta.url), 'utf8')) as {
  row: { ltrX: number[]; rtlX: number[] };
  table: { ltrX: number[]; rtlX: number[] };
  shaping: { id: string; font: string; sha256: string; text: string; glyphs: number[][] }[];
};
class Probe extends ElementBase {
  x = 0;
  constructor(private readonly preferredWidth: number) {
    super();
  }
  protected getPreferredContentWidth(): number {
    return this.preferredWidth;
  }
  protected measureContentHeight(): number {
    return 10;
  }
  protected renderContent(ctx: RenderContext): void {
    this.x = ctx.currentX;
    ctx.currentY += 10;
  }
}
describe('content direction', () => {
  for (const sample of fixture.shaping)
    it(sample.id, () => {
      const bytes = readFileSync(new URL('./fixtures/' + sample.font, import.meta.url));
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(sample.sha256);
      const font = TtfFont.loadFromBytes(new Uint8Array(bytes));
      const restore = TextFlow.enter(ContentDirection.RightToLeft);
      try {
        expect(
          records(font.shape(sample.text)).map(g => [
            g.id,
            g.cluster,
            g.advanceX,
            g.advanceY,
            g.offsetX,
            g.offsetY,
            g.sourceLength,
          ])
        ).toEqual(sample.glyphs);
      } finally {
        restore();
      }
    });

  it('keeps direction out of neighbouring shaping operations and cache entries', () => {
    const font = TtfFont.loadFromBytes(
      new Uint8Array(readFileSync(new URL('./fixtures/NotoSansHebrew-Regular.ttf', import.meta.url)))
    );
    const text = 'שלום ',
      ltr = records(font.shape(text)).map(g => g.cluster);
    const restore = TextFlow.enter(ContentDirection.RightToLeft);
    try {
      expect(records(font.shape(text)).map(g => g.cluster)).toEqual([4, 3, 2, 1, 0]);
    } finally {
      restore();
    }
    expect(ltr).toEqual([3, 2, 1, 0, 4]);
    expect(records(font.shape(text)).map(g => g.cluster)).toEqual(ltr);
  });

  for (const rtl of [false, true])
    it(`mirrors row/table positions while retaining source order: ${rtl}`, () => {
      const direction = rtl ? ContentDirection.RightToLeft : ContentDirection.LeftToRight;
      const row = new HorizontalStack({ contentDirection: direction, spacing: 10, widthDistribution: 'auto' });
      const first = new Probe(80),
        second = new Probe(210);
      row.add(first);
      row.add(second);
      row.render(new RenderContext(new PdfSize(500, 500), 0), 300);
      expect([first.x, second.x]).toEqual(rtl ? fixture.row.rtlX : fixture.row.ltrX);
      expect(row.children[0]).toBe(first);
      const cells = [new Probe(0), new Probe(0), new Probe(0)];
      const table = new Table({ columns: [3, 1, 1], contentDirection: direction, cellPadding: 0 });
      table.addRow(...cells);
      table.render(new RenderContext(new PdfSize(500, 500), 0), 300);
      expect(cells.map(c => c.x)).toEqual(rtl ? fixture.table.rtlX : fixture.table.ltrX);
    });

  it('retains local overrides and the paragraph of each wrapped line', () => {
    const text = new TextBlock('שלום');
    const island = new Container({ contentDirection: 'leftToRight', child: text });
    const outer = new VerticalStack({ contentDirection: 'rightToLeft', children: [island] });
    applyContentDirection(outer, ContentDirection.LeftToRight);
    expect(text.effectiveContentDirection).toBe(ContentDirection.LeftToRight);
    expect(outer.effectiveContentDirection).toBe(ContentDirection.RightToLeft);
    const lines = TextFlow.mapLines('שלום 123\nمرحبا ERP', ['שלום', '123', 'مرحبا ERP']);
    expect(lines[1]).toEqual({ paragraph: 'שלום 123', start: 5, end: 8 });
    expect(lines[2]?.paragraph).toBe('مرحبا ERP');
  });
  it('indents the first RTL line from the right and aligns a justified last line to start', () => {
    const block = new TextBlock('abc', { contentDirection: 'rightToLeft', firstLineIndent: 20, alignment: 'justify' });
    const ctx = new RenderContext(new PdfSize(500, 500), 0);
    const canvas = new MockCanvas();
    ctx.setCanvas(canvas);
    block.render(ctx, 300);
    expect(canvas.operations.find(op => op.startsWith('DrawText('))).toBe(
      `DrawText(280,0,'abc',12,Helvetica,${TextAlignment.Right})`
    );
  });
  for (const explicitLeft of [false, true])
    it(`retains coloured table text alignment: ${explicitLeft}`, () => {
      const block = new TextBlock('abc');
      if (explicitLeft) block.alignment = 'left';
      const table = new Table({
        columns: [1],
        contentDirection: 'rightToLeft',
        cellPadding: 0,
        rowTextColor: '#ff0000',
      });
      table.addRow(block);
      applyContentDirection(table, ContentDirection.LeftToRight);
      const ctx = new RenderContext(new PdfSize(500, 500), 0);
      const canvas = new MockCanvas();
      ctx.setCanvas(canvas);
      table.render(ctx, 100);
      expect(canvas.operations.find(op => op.startsWith('DrawText('))).toBe(
        `DrawText(${explicitLeft ? 0 : 100},0,'abc',12,Helvetica,${explicitLeft ? TextAlignment.Left : TextAlignment.Right})`
      );
    });
});
