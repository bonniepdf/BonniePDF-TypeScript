import { describe, it, expect } from 'vitest';
import { TextBlock, TEXT_BLOCK_OPTION_KEYS } from '../../src/Elements/Text/TextBlock';
import { Heading, HEADING_OPTION_KEYS } from '../../src/Elements/Text/Heading';
import { PageNumberOf, PAGE_NUMBER_OF_OPTION_KEYS } from '../../src/Elements/Text/PageNumberOf';
import { Section, SECTION_OPTION_KEYS } from '../../src/Elements/Text/Section';
import { RichText, RICH_TEXT_OPTION_KEYS } from '../../src/Elements/Text/RichText';
import { TextSpan, TEXT_SPAN_OPTION_KEYS } from '../../src/Elements/Text/TextSpan';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Thickness } from '../../src/Core/Thickness';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { FontWeight } from '../../src/Typography/FontWeight';
import { SemanticRole } from '../../src/Rendering/Tagging/SemanticRole';

/**
 * Non-public data fields that are visible to runtime reflection.
 *
 * TypeScript's `private`/`protected` have no runtime representation, and these
 * fields predate the codebase's `_`-prefix convention for private state, so they
 * must be named explicitly. Listed **per class** rather than as one flat set, so
 * an exclusion here can never mask a genuinely public property of the same name
 * on a different type.
 *
 * A newly added non-public field fails these tests until it is listed, which is
 * the intended prompt to confirm it is really internal and not a forgotten
 * option.
 */
const INTERNAL_FIELDS = {
  elementBase: ['startingY'],
  textBlock: ['cachedContentWidth', 'cachedLines', 'lastLineRendered', 'cachedIndents', 'cachedSpaceBefore'],
  heading: ['tocRegistered'],
  richText: ['spans', 'cachedContentWidth', 'cachedLines', 'lastLineRendered'],
} as const;

/** Runtime settable surface: prototype setters + own data fields, minus internals. */
function settableSurface(instance: object, internal: readonly string[] = []): string[] {
  const skip = new Set<string>([...INTERNAL_FIELDS.elementBase, ...internal]);
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

describe('TextBlock options (09a Phase 2.C)', () => {
  it('keeps the positional text form working', () => {
    expect(new TextBlock('hello').text).toBe('hello');
    expect(new TextBlock().text).toBeUndefined();
  });

  it('accepts an options bag, including inherited text/element keys', () => {
    const b = new TextBlock({
      text: 'hello',
      alignment: 'center',
      fontSize: 11,
      color: 'slate-600',
      margin: { bottom: 6 },
      maxLines: 3,
      ellipsis: '…more',
      breakAllowed: false,
    });
    expect(b.text).toBe('hello');
    expect(b.alignment).toBe(TextAlignment.Center);
    expect(b.fontSize).toBe(11);
    expect(b.color).toBe(ColorPalette.slate[600]);
    expect(b.margin).toEqual(new Thickness(0, 0, 0, 6));
    expect(b.maxLines).toBe(3);
    expect(b.ellipsis).toBe('…more');
    expect(b.breakAllowed).toBe(false);
  });

  it('accepts text positionally with options following', () => {
    const b = new TextBlock('hi', { alignment: 'right', fontSize: 9 });
    expect(b.text).toBe('hi');
    expect(b.alignment).toBe(TextAlignment.Right);
    expect(b.fontSize).toBe(9);
  });

  it('lets an options `text` override the positional payload', () => {
    // Last write wins, matching assignment order.
    const b = new TextBlock('first', { text: 'second' });
    expect(b.text).toBe('second');
  });

  it('covers its whole settable surface', () => {
    expect(settableSurface(new TextBlock(), INTERNAL_FIELDS.textBlock)).toEqual([...TEXT_BLOCK_OPTION_KEYS].sort());
  });
});

describe('Heading options — the deepest chain (28 properties)', () => {
  it('exposes 30 option keys spanning three levels', () => {
    expect(HEADING_OPTION_KEYS).toHaveLength(30);
  });

  it('applies own, TextBlock, TextElement and Element keys together', () => {
    const h = new Heading({
      text: 'Hello, Document API!',
      level: 1,
      tocIdentifier: 'intro',
      anchorId: 'top',
      fontSize: 24,
      color: 'slate-800',
      fontWeight: 'bold',
      alignment: 'center',
      margin: { bottom: 12 },
    });
    expect(h.text).toBe('Hello, Document API!');
    expect(h.level).toBe(1);
    expect(h.tocIdentifier).toBe('intro');
    expect(h.anchorId).toBe('top');
    expect(h.fontSize).toBe(24);
    expect(h.color).toBe(ColorPalette.slate[800]);
    expect(h.fontWeight).toBe(FontWeight.Bold);
    expect(h.alignment).toBe(TextAlignment.Center);
    expect(h.margin).toEqual(new Thickness(0, 0, 0, 12));
    expect(h.semanticRole).toBe(SemanticRole.H1);
  });

  it('applies options after the level field initialiser', () => {
    expect(new Heading({ level: 3 }).level).toBe(3);
    expect(new Heading('x').level).toBe(1);
  });

  it('keeps both positional forms', () => {
    expect(new Heading('t').text).toBe('t');
    expect(new Heading('t', { level: 2 }).level).toBe(2);
  });

  it('covers its whole settable surface', () => {
    expect(settableSurface(new Heading(), [...INTERNAL_FIELDS.textBlock, ...INTERNAL_FIELDS.heading])).toEqual(
      [...HEADING_OPTION_KEYS].sort()
    );
  });
});

describe('PageNumberOf / Section — required payloads', () => {
  it('accepts the payload positionally or in the bag', () => {
    expect(new PageNumberOf('ch1').anchorTarget).toBe('ch1');
    expect(new PageNumberOf({ anchorTarget: 'ch1' }).anchorTarget).toBe('ch1');
    expect(new Section('s1').anchorId).toBe('s1');
    expect(new Section({ anchorId: 's1' }).anchorId).toBe('s1');
  });

  it('still validates the required payload through the options form', () => {
    expect(() => new PageNumberOf('')).toThrow(/anchorTarget/);
    expect(() => new PageNumberOf({ anchorTarget: '' })).toThrow(/anchorTarget/);
    expect(() => new Section('')).toThrow(/anchorId/);
    expect(() => new Section({ anchorId: '' })).toThrow(/anchorId/);
  });

  it('applies inherited options alongside the payload', () => {
    const p = new PageNumberOf('ch1', { placeholder: '--', fontSize: 8, color: 'gray-500' });
    expect(p.placeholder).toBe('--');
    expect(p.fontSize).toBe(8);
    expect(p.color).toBe(ColorPalette.gray[500]);

    const s = new Section('s1', { margin: 4 });
    expect(s.margin).toEqual(new Thickness(4));
  });

  it('covers their whole settable surfaces', () => {
    expect(settableSurface(new PageNumberOf('x'), INTERNAL_FIELDS.textBlock)).toEqual(
      [...PAGE_NUMBER_OF_OPTION_KEYS].sort()
    );
    expect(settableSurface(new Section('x'))).toEqual([...SECTION_OPTION_KEYS].sort());
  });
});

describe('RichText / TextSpan options', () => {
  it('configures RichText in one expression', () => {
    const style = new TextStyle({ fontSize: 11 });
    const r = new RichText({ alignment: 'justify', defaultStyle: style, minLinesAfterBreak: 3 });
    expect(r.alignment).toBe(TextAlignment.Justify);
    expect(r.defaultStyle).toBe(style);
    expect(r.minLinesAfterBreak).toBe(3);
  });

  it('keeps RichText usable with no arguments', () => {
    const r = new RichText();
    expect(r.alignment).toBe(TextAlignment.Left);
    expect(r.defaultStyle).toBeInstanceOf(TextStyle);
  });

  it('configures TextSpan in one expression', () => {
    const style = new TextStyle({ color: 'rose-500' });
    const span = new TextSpan({ text: 'hi', style, isLineBreak: false });
    expect(span.text).toBe('hi');
    expect(span.style).toBe(style);
    expect(span.isLineBreak).toBe(false);
    expect(new TextSpan().text).toBeUndefined();
  });

  it('covers their whole settable surfaces', () => {
    expect(settableSurface(new RichText(), INTERNAL_FIELDS.richText)).toEqual([...RICH_TEXT_OPTION_KEYS].sort());
    expect(settableSurface(new TextSpan())).toEqual([...TEXT_SPAN_OPTION_KEYS].sort());
  });
});
