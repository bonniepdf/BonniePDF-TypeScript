import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Document } from '../../src/Document';
import { DocumentFonts } from '../../src/Typography/DocumentFonts';
import { FontManager } from '../../src/Typography/FontManager';
import { FontMetrics } from '../../src/Typography/FontMetrics';
import { beginDocumentFontMetricScope } from '../../src/Typography/DocumentFontMetricScope';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { pdfToText } from '../helpers/test-base';
import { embeddedFontFamily } from '../../src/Drawing/SvgCanvas';

/**
 * Document fonts - shared conformance fixture `fonts/document-font-resolution`.
 * A document owns its faces: several families, several weights and styles each, resolved by
 * style then CSS weight matching, ahead of the global registries and invisible to any other
 * document.
 *
 * Mirrors the .NET DocumentFontsTests.
 */

const FONTS = resolve(__dirname, '../../assets/fonts');
const load = (file: string): Uint8Array => new Uint8Array(readFileSync(resolve(FONTS, file)));

const sansRegular = load('LiberationSans-Regular.ttf');
const sansBold = load('LiberationSans-Bold.ttf');
const sansItalic = load('LiberationSans-Italic.ttf');
const sansBoldItalic = load('LiberationSans-BoldItalic.ttf');
const serifRegular = load('LiberationSerif-Regular.ttf');

/** The base font names of every embedded font in a PDF, subset prefix removed. */
function embeddedFonts(pdf: Uint8Array): string[] {
  const names = [...pdfToText(pdf).matchAll(/\/BaseFont \/(?:[A-Z]{6}\+)?([A-Za-z0-9-]+)/g)].map(m => m[1]);
  return [...new Set(names)].sort();
}

/** Adds one face per spec ('400', '700', '400I'), each from the same font file. */
function facesOf(fonts: DocumentFonts, family: string, specs: string[]): void {
  for (const spec of specs) {
    const italic = spec.endsWith('I');
    fonts.add(sansRegular, { family, weight: Number(spec.replace('I', '')), italic });
  }
}

function name(face: { weight: number; italic: boolean } | undefined): string | null {
  return face ? `${face.weight}${face.italic ? 'I' : ''}` : null;
}

describe('DocumentFonts resolution', () => {
  const cases: {
    id: string;
    faces: string[];
    expect: [string, number, boolean, string | null][];
  }[] = [
    {
      id: 'exact-match',
      faces: ['400', '700', '400I', '700I'],
      expect: [
        ['Inter', 400, false, '400'],
        ['Inter', 700, false, '700'],
        ['Inter', 400, true, '400I'],
        ['Inter', 700, true, '700I'],
      ],
    },
    {
      id: 'case and space',
      faces: ['400'],
      expect: [
        ['inter', 400, false, '400'],
        ['  INTER ', 400, false, '400'],
      ],
    },
    {
      id: 'unknown family',
      faces: ['400'],
      expect: [
        ['Roboto', 400, false, null],
        ['Arial', 400, false, null],
      ],
    },
    {
      id: 'above 500 prefers heavier',
      faces: ['400', '700'],
      expect: [
        ['Inter', 600, false, '700'],
        ['Inter', 800, false, '700'],
        ['Inter', 900, false, '700'],
      ],
    },
    {
      id: 'below 400 prefers lighter',
      faces: ['300', '400', '700'],
      expect: [
        ['Inter', 200, false, '300'],
        ['Inter', 100, false, '300'],
        ['Inter', 350, false, '300'],
      ],
    },
    {
      id: '400 to 500',
      faces: ['400', '700'],
      expect: [
        ['Inter', 500, false, '400'],
        ['Inter', 450, false, '400'],
      ],
    },
    {
      id: '400 to 500 takes medium',
      faces: ['400', '500', '700'],
      expect: [
        ['Inter', 450, false, '500'],
        ['Inter', 400, false, '400'],
        ['Inter', 500, false, '500'],
      ],
    },
    { id: 'only heavier available', faces: ['700'], expect: [['Inter', 400, false, '700']] },
    {
      id: 'italic preferred',
      faces: ['400', '700', '400I'],
      expect: [
        ['Inter', 400, true, '400I'],
        ['Inter', 700, true, '400I'],
      ],
    },
    {
      id: 'no italic falls back to upright',
      faces: ['400', '700'],
      expect: [
        ['Inter', 400, true, '400'],
        ['Inter', 700, true, '700'],
      ],
    },
    { id: 'italic-only serves upright', faces: ['400I'], expect: [['Inter', 400, false, '400I']] },
  ];

  for (const c of cases) {
    it(c.id, () => {
      const fonts = new DocumentFonts();
      facesOf(fonts, 'Inter', c.faces);
      for (const [family, weight, italic, face] of c.expect) {
        expect(name(fonts.resolve(family, weight, italic)), `${family} ${weight}${italic ? 'I' : ''}`).toBe(face);
      }
    });
  }

  it('replaces a face with the same identity and keeps its place', () => {
    const fonts = new DocumentFonts();
    facesOf(fonts, 'Inter', ['400', '700']);
    fonts.add(sansBold, { family: 'inter', weight: 400 });
    expect(fonts.faces.map(f => f.weight)).toEqual([400, 700]);
    expect(fonts.faces[0].bytes).toBe(sansBold);
  });

  it('holds several families, each resolving within itself', () => {
    const fonts = new DocumentFonts();
    facesOf(fonts, 'Inter', ['400', '700']);
    facesOf(fonts, 'Lora', ['400', '400I']);
    expect(name(fonts.resolve('Inter', 700, false))).toBe('700');
    expect(name(fonts.resolve('Lora', 400, true))).toBe('400I');
    expect(name(fonts.resolve('Lora', 700, false))).toBe('400');
  });
});

describe('DocumentFonts.add', () => {
  it('reads family, weight and italic from the font', () => {
    const fonts = new DocumentFonts();
    const regular = fonts.add(sansRegular);
    const bold = fonts.add(sansBold);
    const italic = fonts.add(sansItalic);
    const boldItalic = fonts.add(sansBoldItalic);

    expect(regular.family).toBe('Liberation Sans');
    expect([regular.weight, regular.italic]).toEqual([400, false]);
    expect([bold.weight, bold.italic]).toEqual([700, false]);
    expect([italic.weight, italic.italic]).toEqual([400, true]);
    expect([boldItalic.weight, boldItalic.italic]).toEqual([700, true]);
  });

  it('lets explicit values win over the font, and accepts weight tokens', () => {
    const face = new DocumentFonts().add(sansRegular, { family: 'Inter', weight: 'semi-bold', italic: true });
    expect([face.family, face.weight, face.italic]).toEqual(['Inter', 600, true]);
  });

  it('rejects bytes that are not a font, and weights outside 1-1000', () => {
    const fonts = new DocumentFonts();
    expect(() => fonts.add(new Uint8Array([1, 2, 3, 4]))).toThrow();
    expect(() => fonts.add(sansRegular, { family: 'Inter', weight: 0 })).toThrow();
    expect(() => fonts.add(sansRegular, { family: 'Inter', weight: 1001 })).toThrow();
    expect(fonts.isEmpty).toBe(true);
  });
});

describe('document fonts in a document', () => {
  it('embeds the face a family, weight and style resolve to', async () => {
    const doc = new Document();
    doc.fonts.add(sansRegular, { family: 'Inter' });
    doc.fonts.add(sansBold, { family: 'Inter', weight: 'bold' });
    doc.fonts.add(sansItalic, { family: 'Inter', italic: true });
    doc.add(new TextBlock({ text: 'Plain', fontFamily: 'Inter' }));
    doc.add(new TextBlock({ text: 'Strong', fontFamily: 'Inter', fontWeight: 'bold' }));
    doc.add(new TextBlock({ text: 'Slanted', fontFamily: 'Inter', italic: true }));

    const fonts = embeddedFonts(await doc.generateBytesAsync());

    expect(fonts).toEqual(['LiberationSans', 'LiberationSans-Bold', 'LiberationSans-Italic']);
    doc.dispose();
  });

  it('applies whatever order the family and the fonts were set in', async () => {
    const doc = new Document();
    const text = new TextBlock({ text: 'Set first', fontFamily: 'Inter' });
    doc.add(text);
    doc.fonts.add(serifRegular, { family: 'Inter' }); // added after the element named it

    expect(embeddedFonts(await doc.generateBytesAsync())).toEqual(['LiberationSerif']);
    doc.dispose();
  });

  it('lets two documents use different files under the same family name', async () => {
    const a = new Document();
    a.fonts.add(sansRegular, { family: 'Inter' });
    a.add(new TextBlock({ text: 'A', fontFamily: 'Inter' }));
    const b = new Document();
    b.fonts.add(serifRegular, { family: 'Inter' });
    b.add(new TextBlock({ text: 'B', fontFamily: 'Inter' }));
    const neither = new Document();
    neither.add(new TextBlock({ text: 'C', fontFamily: 'Inter' }));

    const [pdfA, pdfB, pdfNeither] = [
      await a.generateBytesAsync(),
      await b.generateBytesAsync(),
      await neither.generateBytesAsync(),
    ];

    expect(embeddedFonts(pdfA)).toEqual(['LiberationSans']);
    expect(embeddedFonts(pdfB)).toEqual(['LiberationSerif']);
    // A document with no fonts of its own is unaffected by the others.
    expect(embeddedFonts(pdfNeither)).not.toContain('LiberationSerif');
    expect(FontManager.getBytesForFamily('Inter', 'Regular')).toBeNull();
    [a, b, neither].forEach(d => d.dispose());
  });

  it('shadows a standard family for that document only', async () => {
    const own = new Document();
    own.fonts.add(serifRegular, { family: 'Helvetica' });
    own.add(new TextBlock({ text: 'Mine', fontFamily: 'Helvetica' }));
    const plain = new Document();
    plain.add(new TextBlock({ text: 'Standard', fontFamily: 'Helvetica' }));

    const ownFonts = embeddedFonts(await own.generateBytesAsync());
    const plainPdf = pdfToText(await plain.generateBytesAsync());

    expect(ownFonts).toEqual(['LiberationSerif']);
    expect(plainPdf).toContain('/BaseFont /Helvetica'); // the neighbour still gets the standard font
    own.dispose();
    plain.dispose();
  });

  it('measures with the face it draws with', () => {
    const fonts = new DocumentFonts();
    const bold = fonts.add(sansBold, { family: 'Inter', weight: 'bold' });
    const scope = beginDocumentFontMetricScope(false, undefined, undefined, fonts);
    try {
      const measured = FontMetrics.getStringWidth('Measure me', bold.fontName, 12);
      expect(measured).toBeCloseTo(FontMetrics.getKernedStringWidth('Measure me', bold.font, 12), 6);
      // The standard-font table would give a different answer for the same words.
      expect(measured).not.toBeCloseTo(FontMetrics.getStringWidth('Measure me', 'Helvetica-Bold', 12), 3);
    } finally {
      scope.dispose();
    }
  });

  it('uses document fonts in the SVG export as well', async () => {
    const doc = new Document();
    doc.fonts.add(serifRegular, { family: 'Inter' });
    doc.add(new TextBlock({ text: 'Serif please', fontFamily: 'Inter' }));

    const { fontFaceCss } = await doc.generateSvgDocumentAsync();

    expect(fontFaceCss).toContain('@font-face');
    doc.dispose();
  });

  it.each([
    ['virtual:docfont/1/inter:400:n', 'bpf-docfont-inter-400-n'],
    ['virtual:docfont/999/inter:400:n', 'bpf-docfont-inter-400-n'],
    ['virtual:docfont/2/inter:700:i', 'bpf-docfont-inter-700-i'],
    ['virtual:fallback:virtual:docfont/3/inter:400:n', 'bpf-virtual-fallback-docfont-inter-400-n'],
    ['Helvetica-Bold', 'bpf-helvetica-bold'],
  ])('uses a stable SVG face alias for %s', (input, expected) => {
    expect(embeddedFontFamily(input)).toBe(expected);
  });

  it('exports the same SVG references for independently created documents', async () => {
    const build = () => {
      const doc = new Document();
      const face = doc.fonts.add(sansRegular, { family: 'Inter' });
      doc.add(new TextBlock({ text: 'Same face', fontName: face.fontName }));
      return doc;
    };
    const a = build();
    const b = build();
    const first = await a.generateSvgDocumentAsync();
    const second = await b.generateSvgDocumentAsync();
    expect(first.pages).toEqual(second.pages);
    expect(first.fontFaceCss).toContain("font-family:'bpf-docfont-inter-400-n'");
    expect(second.fontFaceCss).toContain("font-family:'bpf-docfont-inter-400-n'");
    expect(first.pages.join('')).not.toContain('virtual:docfont/');
    a.dispose();
    b.dispose();
  });

  it('embeds document-owned bytes before async PDF preloading', async () => {
    const doc = new Document();
    const face = doc.fonts.add(sansRegular, { family: 'Inter' });
    doc.add(new TextBlock({ text: 'Owned font', fontName: face.fontName }));
    expect(pdfToText(await doc.generateBytesAsync())).toContain('/FontFile2');
    doc.dispose();
  });

  it('generates identical bytes twice', async () => {
    const build = () => {
      const doc = new Document();
      doc.fonts.add(sansRegular, { family: 'Inter' });
      doc.fonts.add(sansBold, { family: 'Inter', weight: 'bold' });
      doc.add(new TextBlock({ text: 'Same', fontFamily: 'Inter', fontWeight: 'bold' }));
      return doc;
    };
    // The trailer's /ID and the subset prefixes are random per generation.
    const mask = (b: Uint8Array) =>
      pdfToText(b)
        .replace(/\/ID \[[^\]]*\]/, '/ID []')
        .replace(/\/(CreationDate|ModDate) \([^)]*\)/g, '')
        .replace(/[A-Z]{6}\+/g, 'SUBSET+');
    const a = build();
    const b = build();
    expect(mask(await a.generateBytesAsync())).toBe(mask(await b.generateBytesAsync()));
    a.dispose();
    b.dispose();
  });

  it('leaves a document without fonts of its own exactly as before', async () => {
    const doc = new Document();
    doc.add(new TextBlock({ text: 'No document fonts' }));
    expect(doc.fonts.isEmpty).toBe(true);
    expect(embeddedFonts(await doc.generateBytesAsync())).toEqual(['Helvetica']); // the standard font, unembedded
    doc.dispose();
  });
  it('resolves a face added after an earlier miss for the same family', () => {
    const doc = new Document();
    doc.fonts.add(sansRegular, { family: 'Inter', weight: 400 });
    expect(name(doc.fonts.resolve('Inter', 700, true))).toBe('400');

    doc.fonts.add(sansBoldItalic, { family: 'Inter', weight: 700, italic: true });

    expect(name(doc.fonts.resolve('Inter', 700, true))).toBe('700I');
    doc.dispose();
  });

  it('shares one parse between documents given the same bytes', () => {
    // A service that keeps its font bytes in memory parses each font once, and the PDF
    // writer reuses that parse for the bytes it embeds.
    const a = new Document();
    const b = new Document();
    expect(a.fonts.add(sansRegular, { family: 'Inter' }).font).toBe(b.fonts.add(sansRegular, { family: 'Inter' }).font);
    a.dispose();
    b.dispose();
  });
});
