import { describe, it, expect } from 'vitest';
import { Container, CONTAINER_OPTION_KEYS } from '../../src/Elements/Layout/Container';
import { HorizontalStack, HORIZONTAL_STACK_OPTION_KEYS } from '../../src/Elements/Layout/HorizontalStack';
import { VerticalStack, VERTICAL_STACK_OPTION_KEYS } from '../../src/Elements/Layout/VerticalStack';
import { Page, PAGE_OPTION_KEYS } from '../../src/Elements/Layout/Page';
import { Spacer, SPACER_OPTION_KEYS } from '../../src/Elements/Layout/Spacer';
import { Layers, LAYERS_OPTION_KEYS } from '../../src/Elements/Layout/Layers';
import { PageBreak, PAGE_BREAK_OPTION_KEYS } from '../../src/Elements/Layout/PageBreak';
import { SemanticGroup } from '../../src/Elements/Layout/SemanticGroup';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Thickness } from '../../src/Core/Thickness';
import { Border } from '../../src/Core/Border';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { HorizontalAlignment } from '../../src/Core/HorizontalAlignment';
import { WidthDistribution } from '../../src/Elements/Layout/WidthDistribution';
import { SemanticRole } from '../../src/Rendering/Tagging/SemanticRole';

/**
 * Non-public data fields visible to runtime reflection (no `_` prefix and not a
 * public accessor). Listed per class so an exclusion here can never mask a
 * genuinely public property of the same name elsewhere.
 */
const INTERNAL = {
  elementBase: ['startingY'],
  // `widths` parallels the private children list; not a public property.
  horizontalStack: ['rendered', 'widths'],
  verticalStack: ['lastChildRendered'],
  pageBreak: ['triggered'],
  // Internal children list, plus the readonly identity fields (constructor-only,
  // never options).
  page: ['elements', 'size', 'margin'],
  layers: ['backgroundLayersList', 'foregroundLayersList'],
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

describe('Container options (09a Phase 2.E)', () => {
  it('stays usable with no arguments', () => {
    const c = new Container();
    expect(c.padding).toEqual(new Thickness(0));
    expect(c.child).toBeUndefined();
  });

  it('applies own + bordered + element options in one expression', () => {
    const child = new TextBlock('hi');
    const c = new Container({
      child,
      padding: 12,
      width: 200,
      clipContent: true,
      horizontalAlignment: 'center',
      backgroundColor: 'slate-50',
      cornerRadius: 4,
      margin: { bottom: 8 },
    });
    expect(c.child).toBe(child);
    expect(c.padding).toEqual(new Thickness(12));
    expect(c.width).toBe(200);
    expect(c.clipContent).toBe(true);
    expect(c.horizontalAlignment).toBe(HorizontalAlignment.Center);
    expect(c.backgroundColor).toBe(ColorPalette.slate[50]);
    expect(c.cornerRadius).toBe(4);
    expect(c.margin).toEqual(new Thickness(0, 0, 0, 8));
  });

  it('expands the { width, color } border form across border + borderColors', () => {
    const c = new Container({ border: { width: 2, color: 'slate-300' } });
    expect(c.border).toEqual(new Border(2));
    expect(c.borderColors.left).toBe(ColorPalette.slate[300]);
  });

  it('covers its whole settable surface', () => {
    expect(settableSurface(new Container())).toEqual([...CONTAINER_OPTION_KEYS].sort());
  });
});

describe('HorizontalStack / VerticalStack options', () => {
  it('adds children through the synthetic sugar, in order', () => {
    const a = new TextBlock('a');
    const b = new TextBlock('b');
    const h = new HorizontalStack({ spacing: 4, alignment: 'center', children: [a, b] });
    expect(h.spacing).toBe(4);
    expect(h.alignment).toBe(HorizontalAlignment.Center);
    expect(h.children).toEqual([a, b]);

    const v = new VerticalStack({ spacing: 2, children: [a, b] });
    expect(v.spacing).toBe(2);
    expect(v.children).toEqual([a, b]);
  });

  it('accepts widthDistribution tokens', () => {
    const h = new HorizontalStack({ widthDistribution: 'equal' });
    expect(h.widthDistribution).toBe(WidthDistribution.Equal);
  });

  it('stays usable empty', () => {
    expect(new HorizontalStack().children).toEqual([]);
    expect(new VerticalStack().children).toEqual([]);
  });

  it('covers their property surfaces (children is sugar, not a property)', () => {
    expect(settableSurface(new HorizontalStack(), INTERNAL.horizontalStack)).toEqual(
      [...HORIZONTAL_STACK_OPTION_KEYS].sort()
    );
    expect(settableSurface(new VerticalStack(), INTERNAL.verticalStack)).toEqual(
      [...VERTICAL_STACK_OPTION_KEYS].sort()
    );
  });
});

describe('Page options', () => {
  it('keeps both positional forms and accepts trailing options', () => {
    const a = new Page(PdfSize.a4, 40);
    expect(a.size).toEqual(PdfSize.a4);
    expect(a.margin).toBe(40);

    const b = new Page(PdfSize.a4, 40, { pageColor: 'slate-50' });
    expect(b.margin).toBe(40);
    expect(b.pageColor).toBe(ColorPalette.slate[50]);

    const c = new Page(200, 300, 10, { pageColor: '#ff00aa' });
    expect(c.width).toBe(200);
    expect(c.margin).toBe(10);
    expect(c.pageColor).toBeDefined();
  });

  it('covers its settable surface (size/margin are readonly, not options)', () => {
    expect(settableSurface(new Page(PdfSize.a4, 0), INTERNAL.page)).toEqual([...PAGE_OPTION_KEYS].sort());
  });
});

describe('Spacer / Layers / PageBreak options', () => {
  it('Spacer keeps the positional height and accepts options', () => {
    expect(new Spacer(16).height).toBe(16);
    expect(new Spacer({ height: 20, margin: 2 }).height).toBe(20);
    expect(new Spacer({ margin: 2 }).margin).toEqual(new Thickness(2));
  });

  it('Layers adds background/foreground through sugar', () => {
    const bg = new TextBlock('bg');
    const primary = new TextBlock('main');
    const fg = new TextBlock('fg');
    const l = new Layers({ primaryLayer: primary, background: [bg], foreground: [fg] });
    expect(l.primaryLayer).toBe(primary);
    expect(l.backgroundLayers).toEqual([bg]);
    expect(l.foregroundLayers).toEqual([fg]);
  });

  it('PageBreak accepts element options', () => {
    const pb = new PageBreak({ breakAllowed: false });
    expect(pb.breakAllowed).toBe(false);
    expect(new PageBreak().breakAllowed).toBe(true);
  });

  it('covers their surfaces', () => {
    expect(settableSurface(new Spacer())).toEqual([...SPACER_OPTION_KEYS].sort());
    expect(settableSurface(new Layers(), INTERNAL.layers)).toEqual([...LAYERS_OPTION_KEYS].sort());
    expect(settableSurface(new PageBreak(), INTERNAL.pageBreak)).toEqual([...PAGE_BREAK_OPTION_KEYS].sort());
  });
});

describe('SemanticGroup options (required role)', () => {
  it('accepts the role positionally or in the bag', () => {
    expect(new SemanticGroup(SemanticRole.Sect).semanticRole).toBe(SemanticRole.Sect);
    expect(new SemanticGroup({ role: SemanticRole.Art }).semanticRole).toBe(SemanticRole.Art);
  });

  it('applies inherited stack options alongside the role', () => {
    const a = new TextBlock('a');
    const g = new SemanticGroup(SemanticRole.Sect, { spacing: 6, children: [a] });
    expect(g.spacing).toBe(6);
    expect(g.children).toEqual([a]);
  });
});
