import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { Container } from '../../src/Elements/Layout/Container';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { Spacer } from '../../src/Elements/Layout/Spacer';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Image } from '../../src/Elements/Media/Image';
import { Table } from '../../src/Elements/Tables/Table';
import { Line } from '../../src/Elements/Shapes/Line';
import { Unit } from '../../src/Core/Unit';
import { StandardFonts } from '../../src/Typography/StandardFonts';

/**
 * Units reach real layout, not just the normaliser: a unit-qualified value
 * produces exactly the same geometry as the equivalent number of points, in
 * every kind of authoring position.
 *
 * Mirrors the .NET LengthUnitsEndToEndTests.
 */

describe('unit-qualified measurements in authoring positions', () => {
  it('normalises a container size on write', () => {
    expect(new Container({ width: '1in', height: '2.54cm' }).width).toBeCloseTo(72, 6);
    expect(new Container({ height: { value: 1, unit: Unit.Inch } }).height).toBeCloseTo(72, 6);
  });

  it('normalises padding and margin sides on write', () => {
    const c = new Container({ padding: { top: '0.5in' }, margin: ['1in', 0] });
    expect(c.padding.top).toBeCloseTo(36, 6);
    expect(c.margin.left).toBeCloseTo(72, 6);
  });

  it('normalises text metrics on write', () => {
    const t = new TextBlock('x', { fontSize: '12pt', letterSpacing: '1mm', wordSpacing: 2 });
    expect(t.fontSize).toBeCloseTo(12, 6);
    expect(t.letterSpacing).toBeCloseTo(2.83465, 3);
    expect(t.wordSpacing).toBe(2);
  });

  it('normalises spacing, spacers, tables, images and shapes on write', () => {
    expect(new VerticalStack({ spacing: '10mm' }).spacing).toBeCloseTo(28.3465, 3);
    expect(new Spacer('1in').height).toBeCloseTo(72, 6);
    expect(new Spacer({ height: '1in' }).height).toBeCloseTo(72, 6);
    expect(new Table({ cellPadding: '2mm' }).cellPadding).toBeCloseTo(5.6693, 3);
    expect(new Image({ width: '8cm' }).width).toBeCloseTo(226.7717, 3);
    expect(new Line({ thickness: '0.5mm', length: '5cm' }).thickness).toBeCloseTo(1.4173, 3);
  });

  it('normalises the document margin on write', () => {
    const doc = new Document();
    doc.settings.margin = '2cm';
    expect(doc.settings.margin).toBeCloseTo(56.6929, 3);
  });

  it('produces byte-identical output to the equivalent points', async () => {
    const build = (inches: boolean) => {
      const doc = new Document();
      doc.settings.pageSize = PdfSize.a4;
      doc.settings.margin = inches ? '0.5in' : 36;
      const stack = new VerticalStack({ spacing: inches ? '0.25in' : 18 });
      stack.add(
        new Container({
          height: inches ? '1in' : 72,
          padding: inches ? '0.125in' : 9,
          cornerRadius: inches ? '0.0625in' : 4.5,
          backgroundColor: 'slate-100',
          child: new TextBlock('units', {
            fontSize: inches ? { value: 14, unit: Unit.Point } : 14,
            fontName: StandardFonts.Helvetica,
          }),
        })
      );
      stack.add(new Spacer(inches ? '0.5in' : 36));
      doc.add(stack);
      return doc;
    };

    const [a, b] = await Promise.all([build(true).generateBytesAsync(), build(false).generateBytesAsync()]);
    expect(a.length).toBe(b.length);
    // Everything but the document /ID, which is derived from the generation
    // time and so differs between any two runs of the same document.
    expect(withoutDocumentId(a)).toBe(withoutDocumentId(b));
  });
});

/** PDF bytes as text, with the time-derived document /ID masked out. */
function withoutDocumentId(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString('latin1')
    .replace(/\/ID \[[^\]]*\]/g, '/ID [MASKED]');
}
