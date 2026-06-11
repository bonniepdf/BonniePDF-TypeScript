import { describe, expect, it } from 'vitest';
import { Color } from '../src/Core/Color';
import { Container } from '../src/Elements/Layout/Container';
import {
  borderHorizontal,
  borderVertical,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  marginHorizontal,
  marginVertical,
  size,
} from '../src/Fluent/Extensions/ContainerStyleExtensions';
import { TextDescriptor } from '../src/Fluent/Descriptors/TextDescriptor';
import { TextAlignment } from '../src/Elements/Text/TextAlignment';

describe('borderHorizontal / borderVertical (migrated from BorderExtensions)', () => {
  it('borderHorizontal sets left and right borders (matching paddingHorizontal convention)', () => {
    const c = borderHorizontal(new Container(), 2, Color.red) as Container;

    expect(c.border!.left).toBe(2);
    expect(c.border!.right).toBe(2);
    expect(c.border!.top).toBe(0);
    expect(c.border!.bottom).toBe(0);
    expect(c.borderColors!.left).toBe(Color.red);
  });

  it('borderVertical sets top and bottom borders (matching paddingVertical convention)', () => {
    const c = borderVertical(new Container(), 3) as Container;

    expect(c.border!.top).toBe(3);
    expect(c.border!.bottom).toBe(3);
    expect(c.border!.left).toBe(0);
    expect(c.border!.right).toBe(0);
    // defaults to black when no colour supplied
    expect(c.borderColors!.top).toBe(Color.black);
  });
});

describe('per-side margin + size (migrated from MarginExtensions / SizeExtensions)', () => {
  it('per-side margin helpers set only their own edge', () => {
    expect((marginTop(new Container(), 5) as Container).margin!.top).toBe(5);
    expect((marginBottom(new Container(), 5) as Container).margin!.bottom).toBe(5);
    expect((marginLeft(new Container(), 5) as Container).margin!.left).toBe(5);
    expect((marginRight(new Container(), 5) as Container).margin!.right).toBe(5);
  });

  it('marginHorizontal sets left+right, marginVertical sets top+bottom', () => {
    const h = marginHorizontal(new Container(), 7) as Container;
    expect([h.margin!.left, h.margin!.right]).toEqual([7, 7]);
    expect([h.margin!.top, h.margin!.bottom]).toEqual([0, 0]);

    const v = marginVertical(new Container(), 9) as Container;
    expect([v.margin!.top, v.margin!.bottom]).toEqual([9, 9]);
    expect([v.margin!.left, v.margin!.right]).toEqual([0, 0]);
  });

  it('size sets both width and height', () => {
    const c = size(new Container(), 120, 80) as Container;
    expect(c.width).toBe(120);
    expect(c.height).toBe(80);
  });
});

describe('TextDescriptor paragraph alignment (migrated from TextBlockExtensions)', () => {
  it('defaults to left alignment', () => {
    expect(new TextDescriptor().richText.alignment).toBe(TextAlignment.Left);
  });

  it('align() and the convenience methods set the paragraph alignment and chain', () => {
    const td = new TextDescriptor();

    expect(td.alignCenter()).toBe(td);
    expect(td.richText.alignment).toBe(TextAlignment.Center);

    td.alignRight();
    expect(td.richText.alignment).toBe(TextAlignment.Right);

    td.justify();
    expect(td.richText.alignment).toBe(TextAlignment.Justify);

    td.align(TextAlignment.Left);
    expect(td.richText.alignment).toBe(TextAlignment.Left);
  });
});
