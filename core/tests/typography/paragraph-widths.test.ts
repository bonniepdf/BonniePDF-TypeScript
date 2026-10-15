import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FontMetrics } from '../../src/Typography/FontMetrics';
import { ParagraphWidths } from '../../src/Typography/ParagraphWidths';
import { primaryCovers } from '../../src/Typography/TextRunShaper';
import { records } from '../helpers/glyph-records';

// Word wrapping reads candidate-line widths from one shaping of the paragraph where both ends
// of a line are safe-to-break boundaries. Those widths, and the line's glyphs, must be exactly
// what measuring or shaping the line on its own returns, or line breaks would change.
// Mirrored by the .NET ParagraphWidthsTests.

// Kerning pairs (AV, To, LT), ligature triggers (fi, ffl), punctuation, digits and quotes.
const vocabulary = [
  'office',
  'affluent',
  'fjord',
  'Wave',
  'AVATAR',
  'To.',
  'Yes,',
  'LT',
  'P.',
  '"quoted"',
  '(paren)',
  "don't",
  '1,234.56',
  '--',
  'e-mail',
  'ff',
  'fi',
  'fl',
  'ffi',
  'ffl',
  'The',
  'first',
  'staff',
  'lorem',
  'ipsum',
  'Tyre',
  'VAT',
  'y.',
  'r.',
  'f/',
  'W,',
  'Fly',
  'awkward',
  'kV',
  'T-',
  'rv',
  'Yo',
  'LY',
  'a',
  'I',
  'x',
  '#42',
  '100%',
];

const assets = fileURLToPath(new URL('../../assets/fonts/', import.meta.url));

function fontPaths(): string[] {
  const paths = [
    'LiberationSans-Regular',
    'LiberationSans-Bold',
    'LiberationSerif-Regular',
    'LiberationSerif-BoldItalic',
    'LiberationMono-Regular',
  ].map(name => join(assets, name + '.ttf'));
  paths.push(fileURLToPath(new URL('./fixtures/NotoSans-Regular.ttf', import.meta.url)));
  // A wider sweep, when a caller points at more fonts.
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ttf|otf)$/i.test(entry)) paths.push(path);
    }
  };
  for (const dir of (process.env.BONNIEPDF_EXTRA_FONT_DIRS ?? '').split(delimiter).filter(Boolean)) walk(dir);
  return paths;
}

function paragraph(random: () => number, words: number): string {
  let text = '';
  for (let i = 0; i < words; i++) {
    if (i > 0) text += Math.floor(random() * 12) === 0 ? '  ' : ' ';
    text += vocabulary[Math.floor(random() * vocabulary.length)];
  }
  return text;
}

describe('paragraph widths', () => {
  it('reads span widths and glyphs that equal measuring and shaping the span', () => {
    const featureSets: (Readonly<Record<string, number>> | undefined)[] = [undefined, { liga: 0 }, { tnum: 1 }];
    let fonts = 0;
    for (const font of fontPaths()) {
      const parsed = FontMetrics.resolveShapingFont(font).font;
      if (!parsed || !primaryCovers('AVfi"', parsed)) continue;
      fonts++;
      let seed = 11;
      const random = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
      let answered = 0;
      for (const features of featureSets) {
        for (let p = 0; p < 4; p++) {
          const text = paragraph(random, 24);
          const widths = ParagraphWidths.tryCreate(text, font, 11, features);
          expect(widths).not.toBeNull();
          const starts = [0],
            ends: number[] = [];
          for (let i = 0; i < text.length; i++)
            if (text[i] === ' ') {
              ends.push(i);
              starts.push(i + 1);
            }
          ends.push(text.length);
          for (const s of starts) {
            for (const e of ends) {
              if (e <= s) continue;
              const width = widths!.tryGetWidth(s, e);
              if (width === undefined) continue;
              answered++;
              const span = text.substring(s, e);
              expect(width, `${font} "${span}"`).toBe(FontMetrics.getStringWidth(span, font, 11, features));
              expect(records(widths!.tryGetGlyphs(s, e)!), `${font} "${span}" glyphs`).toEqual(
                records(parsed.shape(span, features))
              );
            }
          }
        }
      }
      expect(answered).toBeGreaterThan(0);
    }
    expect(fonts).toBeGreaterThanOrEqual(6);
    // Every span is measured and shaped on its own, so this takes seconds rather than milliseconds.
  }, 120_000);

  it('declines what one shaping cannot answer', () => {
    const font = fontPaths()[0];
    expect(ParagraphWidths.tryCreate('café au lait', font, 11)).toBeNull(); // outside printable ASCII
    expect(ParagraphWidths.tryCreate('tab\there', font, 11)).toBeNull(); // control character
    expect(ParagraphWidths.tryCreate('plain text here', 'Helvetica', 11)).toBeNull(); // standard font: width table
    expect(ParagraphWidths.tryCreate('plain text here', font, 11)).not.toBeNull();
  });
});
