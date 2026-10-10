import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'url';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { Watermark } from '../../src/Configuration/Watermark';

/**
 * Every embedded-font text path must paint explicitly positioned glyphs, so the
 * preview places each glyph where the layout engine (and the PDF painter) put it
 * rather than leaving the spacing to whatever the viewer decides.
 *
 * These are the invariants the .NET implementation is held to as well
 * (`SvgGlyphPositioningTests`). They are pinned on both sides because the two
 * exporters drifted apart here once already — .NET emitted a `<tspan>` per glyph
 * on the straight path and left rotated and justified text unpositioned — and no
 * test on either side looked at these paths.
 */
const FONT = fileURLToPath(new URL('../../assets/fonts/LiberationSans-Regular.ttf', import.meta.url));

/** The per-glyph x list of the first glyph-positioned run on the page. */
function firstGlyphRun(svg: string): number[] {
  const m = /<text x="([^"]+)"/.exec(svg);
  expect(m, 'expected at least one glyph-positioned <text> element').not.toBeNull();
  return m![1].split(' ').filter(Boolean).map(Number);
}

function embeddedDoc(text: string, alignment = TextAlignment.Left): Document {
  const doc = new Document();
  const block = new TextBlock(text);
  block.fontName = FONT;
  block.fontSize = 12;
  block.alignment = alignment;
  doc.add(block);
  return doc;
}

function watermarkedDoc(): Document {
  const doc = new Document();
  doc.settings.watermark = new Watermark({
    text: 'DRAFT',
    fontName: FONT,
    fontSize: 48,
    rotationDegrees: -45,
  });
  const block = new TextBlock('Body');
  block.fontName = FONT;
  doc.add(block);
  return doc;
}

describe('SVG glyph positioning', () => {
  it('carries one x per glyph on the text element, not a tspan each', async () => {
    const doc = embeddedDoc('Positioned');
    try {
      const svg = await doc.generateFirstPageSvgAsync();
      // Positions belong on the <text> element's x list, not on a <tspan> per
      // glyph: same geometry, a fraction of the markup.
      expect(svg).not.toContain('<tspan');
      expect(firstGlyphRun(svg)).toHaveLength('Positioned'.length);
    } finally {
      doc.dispose();
    }
  });

  it('advances glyph origins strictly left to right', async () => {
    const doc = embeddedDoc('Advance');
    try {
      const xs = firstGlyphRun(await doc.generateFirstPageSvgAsync());
      for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    } finally {
      doc.dispose();
    }
  });

  it('positions rotated text rather than leaving it to the viewer', async () => {
    const doc = watermarkedDoc();
    try {
      const svg = await doc.generateFirstPageSvgAsync();
      expect(svg).toContain('rotate(');
      // A watermark left to the viewer's own layout drifts away from the PDF
      // it previews.
      expect(svg).not.toContain('<tspan');
    } finally {
      doc.dispose();
    }
  });

  it('negates the rotation so SVG turns the same way as the PDF', async () => {
    const doc = watermarkedDoc();
    try {
      const m = /rotate\((-?[\d.]+)/.exec(await doc.generateFirstPageSvgAsync());
      expect(m, 'expected a rotate() transform').not.toBeNull();
      // The PDF painter rotates counter-clockwise for a positive angle in PDF's
      // y-up space; SVG's y-down space turns that same sign into a clockwise
      // turn. Without the negation the preview mirrors the document it previews.
      expect(Number(m![1])).toBeCloseTo(45, 3);
    } finally {
      doc.dispose();
    }
  });

  it('bakes justification into the glyph origins, not a word-spacing attribute', async () => {
    // Long enough to wrap: only a non-final line is justified, so a single-line
    // string would show no difference at all.
    const text =
      'one two three four five six seven eight nine ten eleven twelve thirteen fourteen ' +
      'fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two';
    const ragged = embeddedDoc(text);
    const justified = embeddedDoc(text, TextAlignment.Justify);
    try {
      const plain = firstGlyphRun(await ragged.generateFirstPageSvgAsync());
      const spread = firstGlyphRun(await justified.generateFirstPageSvgAsync());
      expect(spread).toHaveLength(plain.length);
      expect(spread[spread.length - 1]).toBeGreaterThan(plain[plain.length - 1]);
    } finally {
      ragged.dispose();
      justified.dispose();
    }
  });

  it('binds the family in a style attribute with a generic fallback', async () => {
    const doc = embeddedDoc('Styled');
    try {
      const svg = await doc.generateFirstPageSvgAsync();
      // A style attribute outranks a host stylesheet's `* { font-family: inherit }`
      // reset, which a presentation attribute would lose to; the generic keeps text
      // broadly right if the @font-face never loads.
      expect(svg).toContain('style="font-family:\'bpf-');
      expect(svg).toMatch(
        /style="font-family:'bpf-[^']+',(serif|sans-serif|monospace);font-kerning:none;font-variant-ligatures:none"/
      );
    } finally {
      doc.dispose();
    }
  });
});
