import { describe, it, expect } from 'vitest';
import { ElementBase } from '../../src/Elements/ElementBase';
import { BorderedElementBase } from '../../src/Elements/Layout/BorderedElementBase';
import { TextElementBase } from '../../src/Elements/Text/TextElementBase';
import { ELEMENT_OPTION_KEYS } from '../../src/Elements/ElementOptions';
import {
  BORDERED_ELEMENT_OPTION_KEYS,
  applyBorderedElementOptions,
} from '../../src/Elements/Layout/BorderedElementOptions';
import { TEXT_ELEMENT_OPTION_KEYS } from '../../src/Elements/Text/TextElementOptions';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Thickness } from '../../src/Core/Thickness';
import { Border } from '../../src/Core/Border';
import { BorderColors } from '../../src/Core/BorderColors';
import type { RenderContext } from '../../src/Elements/IElement';

/** Minimal concrete subclasses so each base's settable surface can be observed. */
class ElementProbe extends ElementBase {
  protected measureContentHeight(): number {
    return 0;
  }
  protected renderContent(): void {
    /* no-op */
  }
}
class BorderedProbe extends BorderedElementBase {
  protected measureContentHeight(): number {
    return 0;
  }
  protected renderContent(): void {
    /* no-op */
  }
}
class TextProbe extends TextElementBase {
  protected measureContentHeight(): number {
    return 0;
  }
  protected renderContent(_ctx: RenderContext, _w: number): void {
    /* no-op */
  }
}

/**
 * Members that exist at runtime but are not public API.
 *
 * TypeScript's `protected` has no runtime representation, so reflection cannot
 * distinguish it from a public field. Anything listed here is deliberately
 * excluded; adding a new protected field will fail these tests until it is
 * added to this list, which is the intended prompt to confirm it really is
 * non-public rather than a forgotten option.
 */
const NON_PUBLIC = new Set(['startingY']);

/**
 * The settable surface actually present on an instance: prototype accessors with
 * a setter (walking to but not past `ElementBase`'s own prototype), plus own
 * enumerable data fields, minus private backing fields and {@link NON_PUBLIC}.
 */
function settableSurface(instance: object, stopAfter: object): string[] {
  const names = new Set<string>();

  for (const key of Object.keys(instance)) {
    if (!key.startsWith('_') && !NON_PUBLIC.has(key)) names.add(key);
  }

  let proto: object | null = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    for (const [key, d] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
      if (typeof d.set === 'function' && !key.startsWith('_') && !NON_PUBLIC.has(key)) names.add(key);
    }
    if (proto === stopAfter) break;
    proto = Object.getPrototypeOf(proto);
  }
  return [...names].sort();
}

describe('base element options (09a Phase 2.B)', () => {
  it('ELEMENT_OPTION_KEYS covers ElementBase exactly', () => {
    const surface = settableSurface(new ElementProbe(), ElementBase.prototype);
    expect(surface).toEqual([...ELEMENT_OPTION_KEYS].sort());
  });

  it('BORDERED_ELEMENT_OPTION_KEYS covers BorderedElementBase + ElementBase exactly', () => {
    const surface = settableSurface(new BorderedProbe(), ElementBase.prototype);
    expect(surface).toEqual([...BORDERED_ELEMENT_OPTION_KEYS].sort());
  });

  it('TEXT_ELEMENT_OPTION_KEYS covers TextElementBase + ElementBase exactly', () => {
    const surface = settableSurface(new TextProbe(), ElementBase.prototype);
    expect(surface).toEqual([...TEXT_ELEMENT_OPTION_KEYS].sort());
  });

  it('every declared key is genuinely settable (no stale or misspelled keys)', () => {
    const probe = new TextProbe();
    for (const key of TEXT_ELEMENT_OPTION_KEYS) {
      expect(key in probe, `${key} should exist on a text element`).toBe(true);
    }
    const bordered = new BorderedProbe();
    for (const key of BORDERED_ELEMENT_OPTION_KEYS) {
      expect(key in bordered, `${key} should exist on a bordered element`).toBe(true);
    }
  });
});

describe('applyBorderedElementOptions (border/borderColors pair)', () => {
  it('expands { width, color } across both properties', () => {
    const el = applyBorderedElementOptions(new BorderedProbe(), {
      border: { width: 2, color: 'slate-300' },
    });
    expect(el.border).toEqual(new Border(2));
    expect(el.borderColors.left).toBe(ColorPalette.slate[300]);
    expect(el.borderColors.top).toBe(ColorPalette.slate[300]);
  });

  it('does not touch borderColors when the border carries no colour', () => {
    const el = new BorderedProbe();
    const original = el.borderColors;
    applyBorderedElementOptions(el, { border: 1.5 });
    expect(el.border).toEqual(new Border(1.5));
    expect(el.borderColors).toBe(original);
  });

  it('lets an explicit borderColors win over a colour carried by border', () => {
    const explicit = new BorderColors(ColorPalette.rose[500]);
    const el = applyBorderedElementOptions(new BorderedProbe(), {
      border: { width: 1, color: 'slate-300' },
      borderColors: explicit,
    });
    expect(el.borderColors).toBe(explicit);
  });

  it('applies the inherited ElementOptions too', () => {
    const el = applyBorderedElementOptions(new BorderedProbe(), {
      margin: { bottom: 12 },
      backgroundColor: 'indigo-50',
      cornerRadius: 4,
      breakAllowed: false,
    });
    expect(el.margin).toEqual(new Thickness(0, 0, 0, 12));
    expect(el.backgroundColor).toBe(ColorPalette.indigo[50]);
    expect(el.cornerRadius).toBe(4);
    expect(el.breakAllowed).toBe(false);
  });
});
