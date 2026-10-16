import { describe, expect, it } from 'vitest';
import { BorderColors } from '../../src/Core/BorderColors';
import { Color } from '../../src/Core/Color';
import { fromDefinition } from '../../src/definition';

const sides = (c: BorderColors) => [c.left, c.top, c.right, c.bottom].map(side => side !== undefined);

describe('BorderColors', () => {
  const red = Color.red;

  it('one argument colours every side', () => {
    expect(sides(new BorderColors(red))).toEqual([true, true, true, true]);
  });

  it('no arguments colours no side', () => {
    expect(sides(new BorderColors())).toEqual([false, false, false, false]);
  });

  it('four arguments name each side, so a single undefined-padded colour stays on its side', () => {
    expect(sides(new BorderColors(red, undefined, undefined, undefined))).toEqual([true, false, false, false]);
    expect(sides(new BorderColors(undefined, red, undefined, undefined))).toEqual([false, true, false, false]);
    expect(sides(new BorderColors(undefined, undefined, red, undefined))).toEqual([false, false, true, false]);
    expect(sides(new BorderColors(undefined, undefined, undefined, red))).toEqual([false, false, false, true]);
  });

  it('the single-side helpers colour one side only', () => {
    expect(sides(BorderColors.leftOnly(red))).toEqual([true, false, false, false]);
    expect(sides(BorderColors.rightOnly(red))).toEqual([false, false, true, false]);
    expect(sides(BorderColors.topOnly(red))).toEqual([false, true, false, false]);
    expect(sides(BorderColors.bottomOnly(red))).toEqual([false, false, false, true]);
    expect(sides(BorderColors.verticalSides(red))).toEqual([true, false, true, false]);
    expect(sides(BorderColors.horizontalSides(red))).toEqual([false, true, false, true]);
  });

  it('a definition that names one border colour keeps it on that side', async () => {
    const document = await fromDefinition({
      version: 1,
      minorVersion: 0,
      pages: [
        {
          content: [
            {
              type: 'Container',
              border: 1,
              borderColors: { left: '#ff0000' },
              child: { type: 'TextBlock', text: 'x' },
            },
          ],
        },
      ],
    });

    try {
      const container = document.pages[0]!.elements[0] as unknown as { borderColors: BorderColors };

      expect(sides(container.borderColors)).toEqual([true, false, false, false]);
    } finally {
      document.dispose();
    }
  });
});
