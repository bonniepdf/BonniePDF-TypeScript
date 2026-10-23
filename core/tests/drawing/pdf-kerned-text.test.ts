import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { FontManager } from '../../src/Typography/FontManager';
import { TtfFont } from '../../src/Typography/TrueType/TtfFont';
import { PdfSyntax } from '../../src/Rendering/Pdf/PdfSyntax';
import { pdfToText } from '../helpers/test-base';

/**
 * Kerned PDF text rendering (`Tj` -> `TJ`).
 *
 * Embedded fonts with kern pairs must paint with the `TJ` operator whose
 * array interleaves glyph hex runs with advance adjustments in thousandths
 * of an em, so the PDF ink matches the kerned widths the layout engine
 * reserves (and the kerned SVG export). Unkerned strings and
 * standard-14 fonts keep the plain `Tj` path, byte-identical to before.
 *
 * Liberation Serif reference values (2048 UPEM):
 *   A = gid 36 (0x0024), V = gid 57 (0x0039), kern(A,V) = -264 units.
 *   TJ adjustment = round(264 * 1000 / 2048) = 129 (positive: TJ subtracts).
 */

const SERIF = fileURLToPath(new URL('../../assets/fonts/LiberationSerif-Regular.ttf', import.meta.url));

describe('PdfSyntax.toKernedGlyphArray', () => {
  const font = TtfFont.loadFromBytes(new Uint8Array(readFileSync(SERIF)));

  it('interleaves the negated, em-scaled kern between a kerning pair', () => {
    expect(font.hasKerning).toBe(true);
    expect(PdfSyntax.toKernedGlyphArray('AV', font)).toBe('[<0024> 129 <0039>]');
  });

  it('groups un-kerned neighbours into a single hex run', () => {
    // "AVID": only A-V kerns; V-I and I-D do not, so the tail stays one run.
    const gid = (ch: string) => font.getGlyphId(ch.codePointAt(0)!).toString(16).toUpperCase().padStart(4, '0');
    expect(font.getKerning(font.getGlyphId(86), font.getGlyphId(73))).toBe(0);
    expect(PdfSyntax.toKernedGlyphArray('AVID', font)).toBe(`[<${gid('A')}> 129 <${gid('V')}${gid('I')}${gid('D')}>]`);
  });

  it('returns null when no pair kerns, keeping the Tj path byte-identical', () => {
    expect(PdfSyntax.toKernedGlyphArray('ll', font)).toBeNull();
    expect(PdfSyntax.toKernedGlyphArray('', font)).toBeNull();
    expect(PdfSyntax.toKernedGlyphArray('A', font)).toBeNull();
  });
});

describe('kerned PDF output', () => {
  let doc: Document;

  beforeEach(() => {
    FontManager.clear();
    FontManager.registerFont(new Uint8Array(readFileSync(SERIF)), {
      family: 'liberation serif',
      subfamily: 'regular',
    });
  });

  afterEach(() => {
    doc?.dispose();
    FontManager.clear();
  });

  it('paints an embedded-font kern pair with a TJ array', () => {
    doc = new Document();
    const t = new TextBlock('AV');
    t.fontName = SERIF;
    t.fontSize = 11;
    doc.add(t);

    const pdf = pdfToText(doc.generateBytes());
    expect(pdf).toContain('[<0024> 128.906 <0039>] TJ');
    expect(pdf).not.toContain('<00240039> Tj');
  });

  it('keeps unkerned embedded-font strings on the Tj path', () => {
    doc = new Document();
    const t = new TextBlock('ll');
    t.fontName = SERIF;
    doc.add(t);

    const pdf = pdfToText(doc.generateBytes());
    expect(pdf).not.toContain(' TJ');
    expect(pdf).toMatch(/<[0-9A-F]+> Tj/);
  });

  it('keeps standard-14 text on the literal-string Tj path, byte-identical', () => {
    doc = new Document();
    doc.add(new TextBlock('AVATAR Wave'));

    const pdf = pdfToText(doc.generateBytes());
    expect(pdf).toContain('(AVATAR Wave) Tj');
    expect(pdf).not.toContain(' TJ');
  });
});
