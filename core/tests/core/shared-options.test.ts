import { describe, it, expect } from 'vitest';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { TableCell } from '../../src/Elements/Tables/TableCell';
import { Container } from '../../src/Elements/Layout/Container';
import { Color } from '../../src/Core/Color';

// Elements styled alike share one options object. Sharing must never let a change to one
// element reach another, and must keep values exactly as they were set.
// Mirrored by the .NET SharedOptionsTests.

const textOptionsOf = (element: TextBlock): unknown => element['_text'];

describe('shared element options', () => {
  it('shares options between elements styled alike', () => {
    const a = new TextBlock('one', { fontSize: 10, color: 'red-500', alignment: 'right' });
    const b = new TextBlock('two', { fontSize: 10, color: 'red-500', alignment: 'right' });
    expect(textOptionsOf(a)).toBe(textOptionsOf(b));

    // The same values reached in another order are still the same options.
    const c = new TextBlock('three');
    c.alignment = 'right';
    c.color = 'red-500';
    c.fontSize = 10;
    expect(textOptionsOf(c)).toBe(textOptionsOf(a));
  });

  it('leaves other elements unchanged when one changes', () => {
    const a = new TextBlock('one', { fontSize: 10, letterSpacing: 1 });
    const b = new TextBlock('two', { fontSize: 10, letterSpacing: 1 });
    b.fontSize = 14;
    b.maxLines = 2;
    expect(a.fontSize).toBe(10);
    expect(a.maxLines).toBeUndefined();
    expect(a.letterSpacing).toBe(1);
    expect(b.fontSize).toBe(14);

    const cellA = new TableCell({ content: new TextBlock('c'), padding: 2 });
    const cellB = new TableCell({ content: new TextBlock('c'), padding: 2 });
    cellB.padding = 5;
    expect(cellA.padding?.left).toBe(2);

    const boxA = new Container({ margin: 3, backgroundColor: Color.blue });
    const boxB = new Container({ margin: 3, backgroundColor: Color.blue });
    boxB.margin = 4;
    boxB.backgroundColor = undefined;
    expect(boxA.margin.left).toBe(3);
    expect(boxA.backgroundColor?.equals(Color.blue)).toBe(true);
  });

  it('keeps values exactly as set', () => {
    const positive = new TextBlock('a', { letterSpacing: 0 });
    const negative = new TextBlock('b', { letterSpacing: -0 });
    expect(Object.is(negative.letterSpacing, -0)).toBe(true);
    expect(Object.is(positive.letterSpacing, 0)).toBe(true);
    expect(textOptionsOf(positive)).not.toBe(textOptionsOf(negative));

    // A remembered change to +0 must not answer a change to -0.
    const again = new TextBlock('c', { letterSpacing: -0 });
    expect(Object.is(again.letterSpacing, -0)).toBe(true);
  });
});
