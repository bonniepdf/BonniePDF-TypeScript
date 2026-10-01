import { describe, it, expect } from 'vitest';
import { OrderedList, ORDERED_LIST_OPTION_KEYS } from '../../src/Elements/Lists/OrderedList';
import { UnorderedList, UNORDERED_LIST_OPTION_KEYS } from '../../src/Elements/Lists/UnorderedList';
import { Hyperlink, HYPERLINK_OPTION_KEYS } from '../../src/Core/Hyperlink';
import { SectionLink, SECTION_LINK_OPTION_KEYS } from '../../src/Core/SectionLink';
import { VisualToc, VISUAL_TOC_OPTION_KEYS } from '../../src/Elements/Text/VisualToc';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Thickness } from '../../src/Core/Thickness';
import { NumberFormat } from '../../src/Elements/Lists/NumberFormat';
import { BulletStyle } from '../../src/Elements/Lists/BulletStyle';

const INTERNAL = {
  elementBase: ['startingY'],
  // `render*` bounds + linkedStructElement are layout output, not options; `text`
  // is set in the ctor. `items` is the private list backing addItem.
  hyperlink: ['renderX', 'renderY', 'renderWidth', 'renderHeight', 'linkedStructElement'],
  list: ['items', 'nestedLists'], // both private readonly backing lists
  visualToc: ['lastRenderedIndex'],
} as const;

function settableSurface(instance: object, internal: readonly string[] = []): string[] {
  const skip = new Set<string>([...INTERNAL.elementBase, ...internal]);
  const names = new Set<string>();
  for (const k of Object.keys(instance)) {
    if (!k.startsWith('_') && !skip.has(k)) names.add(k);
  }
  let proto: object | null = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
      if (typeof d.set === 'function' && !k.startsWith('_') && !skip.has(k)) names.add(k);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return [...names].sort();
}

describe('List options (09a Phase 2.H)', () => {
  it('OrderedList: numberFormat token + items sugar + inherited text options', () => {
    const l = new OrderedList({
      numberFormat: 'upper-roman',
      startNumber: 5,
      fontSize: 11,
      color: 'slate-700',
      indent: 24,
      items: ['a', 'b', 'c'],
    });
    expect(l.numberFormat).toBe(NumberFormat.UpperRoman);
    expect(l.startNumber).toBe(5);
    expect(l.fontSize).toBe(11);
    expect(l.color).toBe(ColorPalette.slate[700]);
    expect(l.indent).toBe(24);
    // items added through addItem — assert via getChildren-independent height > 0
    expect(l.measureHeight(400)).toBeGreaterThan(0);
  });

  it('UnorderedList: bulletStyle + bulletColor tokens + items', () => {
    const l = new UnorderedList({
      bulletStyle: 'square',
      bulletColor: 'rose-500',
      customBullet: '–',
      itemSpacing: 8,
      items: ['x', 'y'],
    });
    expect(l.bulletStyle).toBe(BulletStyle.Square);
    expect(l.bulletColor).toBe(ColorPalette.rose[500]);
    expect(l.customBullet).toBe('–');
    expect(l.itemSpacing).toBe(8);
  });

  it('bulletColor now accepts tokens (Phase 2.H widening) and defaults to color', () => {
    const l = new UnorderedList({ color: 'indigo-700' });
    expect(l.bulletColor).toBe(ColorPalette.indigo[700]); // falls back to color
    l.bulletColor = '#123456';
    expect(l.bulletColor).not.toBe(ColorPalette.indigo[700]);
  });

  it('lists stay usable empty', () => {
    expect(new OrderedList().startNumber).toBe(1);
    expect(new UnorderedList().customBullet).toBe('•');
  });

  it('cover their property surfaces (items is sugar)', () => {
    expect(settableSurface(new OrderedList(), INTERNAL.list)).toEqual([...ORDERED_LIST_OPTION_KEYS].sort());
    expect(settableSurface(new UnorderedList(), INTERNAL.list)).toEqual([...UNORDERED_LIST_OPTION_KEYS].sort());
  });
});

describe('Hyperlink / SectionLink options (required text)', () => {
  it('Hyperlink keeps positional forms and accepts options', () => {
    expect(new Hyperlink('click').text).toBe('click');
    expect(new Hyperlink('click', 'https://x.dev').uri).toBe('https://x.dev');

    const h = new Hyperlink('click', 'https://x.dev', { color: 'blue-600', fontSize: 10, margin: { bottom: 2 } });
    expect(h.uri).toBe('https://x.dev');
    expect(h.color).toBe(ColorPalette.blue[600]);
    expect(h.fontSize).toBe(10);
    expect(h.margin).toEqual(new Thickness(0, 0, 0, 2));

    const o = new Hyperlink({ text: 'click', uri: 'https://x.dev', targetPageIndex: 3 });
    expect(o.text).toBe('click');
    expect(o.targetPageIndex).toBe(3);
  });

  it('Hyperlink still validates required text through both forms', () => {
    expect(() => new Hyperlink('')).toThrow(/text/);
    expect(() => new Hyperlink({ text: '' })).toThrow(/text/);
    expect(() => new Hyperlink('t', '')).toThrow(/URI/);
  });

  it('SectionLink keeps positional and validates anchorTarget', () => {
    const s = new SectionLink('See ch.1', 'ch1', { color: 'blue-700' });
    expect(s.text).toBe('See ch.1');
    expect(s.anchorTarget).toBe('ch1');
    expect(s.color).toBe(ColorPalette.blue[700]);

    const o = new SectionLink({ text: 'See ch.1', anchorTarget: 'ch1' });
    expect(o.anchorTarget).toBe('ch1');

    expect(() => new SectionLink('t', '')).toThrow(/anchorTarget/);
    expect(() => new SectionLink({ text: 't', anchorTarget: '' })).toThrow(/anchorTarget/);
  });

  it('cover their authoring surfaces (render bounds excluded)', () => {
    expect(settableSurface(new Hyperlink('x'), INTERNAL.hyperlink)).toEqual([...HYPERLINK_OPTION_KEYS].sort());
    expect(settableSurface(new SectionLink('x', 'a'), INTERNAL.hyperlink)).toEqual(
      [...SECTION_LINK_OPTION_KEYS].sort()
    );
  });
});

describe('VisualToc options', () => {
  it('configures in one expression', () => {
    const toc = new VisualToc({
      headingIdentifiers: ['intro', 'methods'],
      fontSize: 13,
      color: 'slate-800',
      margin: { top: 4 },
    });
    expect(toc.headingIdentifiers).toEqual(['intro', 'methods']);
    expect(toc.fontSize).toBe(13);
    expect(toc.color).toBe(ColorPalette.slate[800]);
    expect(toc.margin).toEqual(new Thickness(0, 4, 0, 0));
  });

  it('covers its surface', () => {
    expect(settableSurface(new VisualToc(), INTERNAL.visualToc)).toEqual([...VISUAL_TOC_OPTION_KEYS].sort());
  });
});
