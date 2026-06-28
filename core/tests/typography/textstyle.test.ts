import { describe, expect, it } from 'vitest';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { TextDecoration } from '../../src/Elements/Text/TextDecoration';
import { FontWeight } from '../../src/Typography/FontWeight';
import { Color } from '../../src/Core/Color';
import { ColorPalette } from '../../src/Core/ColorPalette';

// TextStyle.mergeWith(base) returns a new style where THIS style's explicitly-set
// values win, and unset (undefined/Normal/None) values fall back to `base`. These
// tests pin the non-obvious precedence rules around weight/italic/decoration.

function base(configure: (s: TextStyle) => void): TextStyle {
  const s = new TextStyle();
  configure(s);
  return s;
}

describe('TextStyle.mergeWith — size and colour inheritance', () => {
  it('an explicit font size overrides the base size', () => {
    const span = base(s => (s.fontSize = 20));
    const merged = span.mergeWith(base(s => (s.fontSize = 12)));
    expect(merged.fontSize).toBe(20);
  });

  it('an unset font size inherits the base size', () => {
    const merged = new TextStyle().mergeWith(base(s => (s.fontSize = 12)));
    expect(merged.fontSize).toBe(12);
  });

  it('colour and background inherit from the base when unset, and override when set', () => {
    const baseStyle = base(s => {
      s.color = Color.black;
      s.backgroundColor = ColorPalette.amber[400];
    });

    const inherits = new TextStyle().mergeWith(baseStyle);
    expect(inherits.color).toBe(Color.black);
    expect(inherits.backgroundColor).toBe(ColorPalette.amber[400]);

    const overrides = base(s => (s.color = Color.red)).mergeWith(baseStyle);
    expect(overrides.color).toBe(Color.red);
    expect(overrides.backgroundColor).toBe(ColorPalette.amber[400]); // still inherited
  });
});

describe('TextStyle.mergeWith — weight precedence', () => {
  it('an explicit non-normal weight wins', () => {
    const span = base(s => (s.fontWeight = FontWeight.Bold));
    const merged = span.mergeWith(new TextStyle());
    expect(merged.fontWeight).toBe(FontWeight.Bold);
  });

  it('a normal weight with no family inherits the base weight', () => {
    // span is "unstyled" for weight => should pick up the base's bold.
    const merged = new TextStyle().mergeWith(base(s => (s.fontWeight = FontWeight.Bold)));
    expect(merged.fontWeight).toBe(FontWeight.Bold);
  });

  it('setting a family pins the span weight and blocks weight inheritance', () => {
    // Specifying a family means "use my own weight" — even if it is Normal —
    // so a bold base must NOT bleed into a span that picked a different family.
    const span = base(s => (s.fontFamily = 'Times'));
    const merged = span.mergeWith(base(s => (s.fontWeight = FontWeight.Bold)));
    expect(merged.fontWeight).toBe(FontWeight.Normal);
  });
});

describe('TextStyle.mergeWith — italic precedence', () => {
  it('explicit italic wins', () => {
    const merged = base(s => (s.italic = true)).mergeWith(new TextStyle());
    expect(merged.italic).toBe(true);
  });

  it('italic is inherited only when the span sets no family', () => {
    const italicBase = base(s => (s.italic = true));
    expect(new TextStyle().mergeWith(italicBase).italic).toBe(true); // inherits
    expect(base(s => (s.fontFamily = 'Times')).mergeWith(italicBase).italic).toBe(false); // family blocks
  });
});

describe('TextStyle.mergeWith — decoration is replace-not-combine', () => {
  it('an unset decoration inherits the base decoration', () => {
    const merged = new TextStyle().mergeWith(base(s => (s.decoration = TextDecoration.Underline)));
    expect(merged.decoration).toBe(TextDecoration.Underline);
  });

  it('a set decoration replaces the base decoration entirely (does not OR them)', () => {
    const span = base(s => (s.decoration = TextDecoration.Strikethrough));
    const merged = span.mergeWith(base(s => (s.decoration = TextDecoration.Underline)));
    expect(merged.decoration).toBe(TextDecoration.Strikethrough);
    expect(merged.decoration & TextDecoration.Underline).toBe(0); // underline did NOT survive
  });
});

describe('TextStyle.mergeWith — family and edge cases', () => {
  it('family overrides when set and inherits when unset', () => {
    expect(base(s => (s.fontFamily = 'Times')).mergeWith(base(s => (s.fontFamily = 'Courier'))).fontFamily).toBe(
      'Times'
    );
    expect(new TextStyle().mergeWith(base(s => (s.fontFamily = 'Courier'))).fontFamily).toBe('Courier');
  });

  it('merging with a null base returns the style unchanged', () => {
    const span = base(s => (s.fontSize = 9));
    expect(span.mergeWith(undefined as unknown as TextStyle)).toBe(span);
  });
});

describe('TextStyle — effective getters and font resolution', () => {
  it('defaults are Helvetica / 12pt / black', () => {
    const s = new TextStyle();
    expect(s.effectiveFontSize).toBe(12);
    expect(s.effectiveColor).toBe(Color.black);
    expect(s.effectiveFontName).toBe('Helvetica');
  });

  it('weight and italic map to the standard-14 variant names even with no family', () => {
    expect(base(s => (s.fontWeight = FontWeight.Bold)).effectiveFontName).toBe('Helvetica-Bold');
    expect(base(s => (s.italic = true)).effectiveFontName).toBe('Helvetica-Oblique');
    expect(
      base(s => {
        s.fontWeight = FontWeight.Bold;
        s.italic = true;
      }).effectiveFontName
    ).toBe('Helvetica-BoldOblique');
  });

  it('resolvedFontName is undefined until a family is chosen', () => {
    expect(new TextStyle().resolvedFontName).toBeUndefined();
    expect(base(s => (s.fontFamily = 'Helvetica')).resolvedFontName).toBe('Helvetica');
  });
});

describe('TextStyle — fluent setters', () => {
  it('weight shortcuts set the corresponding weight', () => {
    expect(new TextStyle().bold().fontWeight).toBe(FontWeight.Bold);
    expect(new TextStyle().light().fontWeight).toBe(FontWeight.Light);
    expect(new TextStyle().thin().fontWeight).toBe(FontWeight.Thin);
  });

  it('value setters assign their field', () => {
    expect(new TextStyle().withItalic().italic).toBe(true);
    expect(new TextStyle().withSize(18).fontSize).toBe(18);
    expect(new TextStyle().withColor(Color.red).color).toBe(Color.red);
    expect(new TextStyle().withBackground(ColorPalette.amber[400]).backgroundColor).toBe(ColorPalette.amber[400]);
    expect(new TextStyle().withWeight(FontWeight.Bold).fontWeight).toBe(FontWeight.Bold);
    expect(new TextStyle().withFamily('Times').fontFamily).toBe('Times');
    expect(new TextStyle().withLineHeight(1.5).lineHeightMultiplier).toBe(1.5);
  });

  it('decoration setters are additive (OR), unlike mergeWith which replaces', () => {
    expect(new TextStyle().underline().decoration).toBe(TextDecoration.Underline);
    const both = new TextStyle().underline().strikethrough().decoration;
    expect(both & TextDecoration.Underline).toBe(TextDecoration.Underline);
    expect(both & TextDecoration.Strikethrough).toBe(TextDecoration.Strikethrough);
  });

  it('every fluent setter returns the same instance for chaining', () => {
    const s = new TextStyle();
    expect(s.bold()).toBe(s);
    expect(s.withSize(10)).toBe(s);
    expect(s.withColor(Color.red)).toBe(s);
    expect(s.underline()).toBe(s);
  });
});
