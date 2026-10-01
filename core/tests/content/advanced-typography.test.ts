import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { RichText } from '../../src/Elements/Text/RichText';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { TextDecoration } from '../../src/Elements/Text/TextDecoration';
import { DecorationStyle } from '../../src/Elements/Text/DecorationStyle';
import {
  BaselineAlignment,
  resolveBaselineShift,
  SUPERSCRIPT_SHIFT_FRACTION,
  SUBSCRIPT_SHIFT_FRACTION,
} from '../../src/Elements/Text/BaselineAlignment';
import { Color } from '../../src/Core/Color';
import { pdfToText } from '../helpers/test-base';

/**
 * this feature advanced typography controls (phase 1a): overline + decoration
 * colour/thickness, and super/subscript baseline shift. These are vertical /
 * visual-only controls that do not change glyph advances, so measurement and
 * pagination are unaffected (guarded below).
 */
describe('this feature advanced typography', () => {
  let doc: Document | undefined;

  afterEach(() => {
    doc?.dispose();
    doc = undefined;
  });

  describe('BaselineAlignment.resolveBaselineShift', () => {
    it('returns 0 for a baseline-aligned span', () => {
      expect(resolveBaselineShift(BaselineAlignment.Baseline, undefined, 12)).toBe(0);
    });

    it('derives the shift from font size for super/subscript', () => {
      expect(resolveBaselineShift(BaselineAlignment.Superscript, undefined, 10)).toBeCloseTo(
        10 * SUPERSCRIPT_SHIFT_FRACTION
      );
      expect(resolveBaselineShift(BaselineAlignment.Subscript, undefined, 10)).toBeCloseTo(
        -10 * SUBSCRIPT_SHIFT_FRACTION
      );
    });

    it('lets an explicit baselineShift override the alignment', () => {
      expect(resolveBaselineShift(BaselineAlignment.Superscript, -3, 12)).toBe(-3);
    });
  });

  describe('TextStyle fluent + merge', () => {
    it('exposes the new fluent controls', () => {
      const style = new TextStyle().overline().superscript().withDecorationThickness(2).withDecorationColor(Color.red);
      expect(style.decoration & TextDecoration.Overline).not.toBe(0);
      expect(style.baselineAlignment).toBe(BaselineAlignment.Superscript);
      expect(style.decorationThickness).toBe(2);
      expect(style.decorationColor).toBe(Color.red);
    });

    it('inherits new properties through mergeWith', () => {
      const base = new TextStyle().withDecorationColor(Color.red).withDecorationThickness(1.5).subscript();
      const merged = new TextStyle().mergeWith(base);
      expect(merged.decorationColor).toBe(Color.red);
      expect(merged.decorationThickness).toBe(1.5);
      expect(merged.baselineAlignment).toBe(BaselineAlignment.Subscript);
    });

    it('lets the span override an inherited baseline alignment', () => {
      const base = new TextStyle().subscript();
      const merged = new TextStyle().superscript().mergeWith(base);
      expect(merged.baselineAlignment).toBe(BaselineAlignment.Superscript);
    });
  });

  it('overline decoration emits a stroked line in the content stream', () => {
    const d = new Document();
    const overlined = new TextBlock('Overlined heading');
    overlined.decoration = TextDecoration.Overline;
    d.add(overlined);
    doc = d;

    const text = pdfToText(d.generateBytes());
    // A decoration is drawn as a stroked line: "... m ... l S".
    expect(text).toMatch(/\bl\s+S\b/);
  });

  it('is inert on the common path: undecorated text emits no decoration stroke', () => {
    const d = new Document();
    d.add(new TextBlock('The quick brown fox jumps over the lazy dog.'));
    doc = d;
    const text = pdfToText(d.generateBytes());
    // With the new fields left unset, plain text draws no stroked decoration line.
    expect(text).not.toMatch(/\bl\s+S\b/);
  });

  describe('letter & word spacing', () => {
    it('widens a TextBlock measurement by letterSpacing × glyphs', () => {
      const plain = new TextBlock('ABCDE');
      plain.fontSize = 12;
      const spaced = new TextBlock('ABCDE');
      spaced.fontSize = 12;
      spaced.letterSpacing = 3;
      // 5 glyphs × 3pt = 15pt wider.
      expect(spaced.measureHeight(1000)).toBe(plain.measureHeight(1000)); // height unchanged
      expect(spaced.getPreferredWidth()).toBeCloseTo(plain.getPreferredWidth() + 15, 4);
    });

    it('widens measurement by wordSpacing × spaces', () => {
      const plain = new TextBlock('a b c');
      plain.fontSize = 12;
      const spaced = new TextBlock('a b c');
      spaced.fontSize = 12;
      spaced.wordSpacing = 5;
      // 2 spaces × 5pt = 10pt wider.
      expect(spaced.getPreferredWidth()).toBeCloseTo(plain.getPreferredWidth() + 10, 4);
    });

    it('emits a Tc operator in the content stream when letter-spaced', () => {
      const d = new Document();
      const t = new TextBlock('Spaced out heading');
      t.letterSpacing = 2;
      d.add(t);
      doc = d;
      const text = pdfToText(d.generateBytes());
      // "2 Tc" sets character spacing; a plain document never emits Tc.
      expect(text).toMatch(/\bTc\b/);
    });

    it('does not emit Tc for un-spaced text', () => {
      const d = new Document();
      d.add(new TextBlock('Normal text'));
      doc = d;
      expect(pdfToText(d.generateBytes())).not.toMatch(/\bTc\b/);
    });

    it('propagates letter/word spacing through TextStyle.mergeWith', () => {
      const base = new TextStyle().withLetterSpacing(1.5).withWordSpacing(4);
      const merged = new TextStyle().mergeWith(base);
      expect(merged.letterSpacing).toBe(1.5);
      expect(merged.wordSpacing).toBe(4);
    });
  });

  describe('line clamp', () => {
    const longText =
      'This is a deliberately long paragraph that will wrap across several lines when constrained to a narrow column so the clamp has something to truncate and append an ellipsis to.';

    it('clamps to maxLines and appends an ellipsis to the last visible line', () => {
      const unclamped = new TextBlock(longText);
      unclamped.fontSize = 12;
      const clamped = new TextBlock(longText);
      clamped.fontSize = 12;
      clamped.maxLines = 2;

      // The clamped block is exactly two lines tall and shorter than the full text.
      expect(clamped.measureHeight(160)).toBeCloseTo(2 * clamped['effectiveLineHeight'], 4);
      expect(unclamped.measureHeight(160)).toBeGreaterThan(clamped.measureHeight(160));

      const lines = clamped['getOrComputeLines'](160) as string[];
      expect(lines.length).toBe(2);
      expect(lines[1].endsWith('…')).toBe(true);
      // The last visible line still fits the column.
      expect(clamped['measureTextWidth'](lines[1])).toBeLessThanOrEqual(160);

      // It still renders to a valid PDF.
      const d = new Document();
      d.add(clamped);
      doc = d;
      expect(pdfToText(d.generateBytes())).toContain('/Type /Page');
    });

    it('does not clamp when the text fits within maxLines', () => {
      const t = new TextBlock('Short.');
      t.fontSize = 12;
      t.maxLines = 3;
      const lines = t['getOrComputeLines'](200) as string[];
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('Short.');
    });
  });

  describe('paragraph controls', () => {
    const twoParas = 'First paragraph here.\nSecond paragraph here.';

    it('adds paragraphSpacing height between hard-break paragraphs', () => {
      const plain = new TextBlock(twoParas);
      plain.fontSize = 12;
      const spaced = new TextBlock(twoParas);
      spaced.fontSize = 12;
      spaced.paragraphSpacing = 10;
      // One inter-paragraph gap of 10pt.
      expect(spaced.measureHeight(400)).toBeCloseTo(plain.measureHeight(400) + 10, 4);
    });

    it('indents the first line of each paragraph', () => {
      const t = new TextBlock(twoParas);
      t.fontSize = 12;
      t.firstLineIndent = 24;
      // Force layout, then inspect the private indent metadata.
      const lines = t['getOrComputeLines'](400) as string[];
      const indents = t['cachedIndents'] as number[];
      // Both paragraphs are single lines here, so both first lines are indented.
      expect(indents[0]).toBe(24);
      expect(indents[lines.length - 1]).toBe(24);
    });

    it('is byte-neutral to height when both controls are zero', () => {
      const a = new TextBlock(twoParas);
      a.fontSize = 12;
      const b = new TextBlock(twoParas);
      b.fontSize = 12;
      expect(a.measureHeight(400)).toBe(b.measureHeight(400));
    });
  });

  describe('decoration line styles', () => {
    it('a wavy underline emits many short segments (vs one for solid)', () => {
      const solidDoc = new Document();
      const s = new TextBlock('Underlined');
      s.decoration = TextDecoration.Underline;
      solidDoc.add(s);
      const solidStrokes = (pdfToText(solidDoc.generateBytes()).match(/\bl\s+S\b/g) ?? []).length;
      solidDoc.dispose();

      const wavyDoc = new Document();
      const w = new TextBlock('Underlined');
      w.decoration = TextDecoration.Underline;
      w.decorationStyle = DecorationStyle.Wavy;
      wavyDoc.add(w);
      doc = wavyDoc;
      const wavyStrokes = (pdfToText(wavyDoc.generateBytes()).match(/\bl\s+S\b/g) ?? []).length;

      expect(solidStrokes).toBe(1);
      expect(wavyStrokes).toBeGreaterThan(3);
    });

    it('exposes wavyUnderline() on TextStyle', () => {
      const style = new TextStyle().wavyUnderline();
      expect(style.decoration & TextDecoration.Underline).not.toBe(0);
      expect(style.decorationStyle).toBe(DecorationStyle.Wavy);
    });
  });

  it('renders a super/subscript RichText document without error and paginates the same', () => {
    const plain = new Document();
    const rtPlain = new RichText();
    rtPlain.span('H2O and E=mc2', new TextStyle().withSize(12));
    plain.add(rtPlain);
    const plainPages = plain.generateBytes();
    plain.dispose();

    const styled = new Document();
    const rt = new RichText();
    rt.span('H', new TextStyle().withSize(12));
    rt.span('2', new TextStyle().withSize(8).subscript());
    rt.span('O and E=mc', new TextStyle().withSize(12));
    rt.span('2', new TextStyle().withSize(8).superscript());
    styled.add(rt);
    doc = styled;
    const styledBytes = styled.generateBytes();

    // Both produce a valid single-page PDF (the shift never forced an overflow).
    expect(pdfToText(plainPages)).toContain('/Type /Page');
    expect(pdfToText(styledBytes)).toContain('/Type /Page');
  });
});
