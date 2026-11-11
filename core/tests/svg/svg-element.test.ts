import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { Document } from '../../src/Document';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { BonniePdfFontProvider } from '../../src/Drawing/BonniePdfFontProvider';
import { Svg, SvgUnsupportedFeatureError } from '../../src/Elements/Media/Svg';
import { ImageFitMode } from '../../src/Elements/Media/ImageFitMode';
import { Heading } from '../../src/Elements/Text/Heading';
import { evaluateCompliance } from '../../src/Compliance/ComplianceEvaluator';
import { TextFontFaceAdapter } from '../../src/Drawing/TextFontFaceAdapter';
import { FontManager } from '../../src/Typography/FontManager';
import { SemanticRole } from '../../src/Rendering/Tagging/SemanticRole';
import { firstContentStream, pdfToText } from '../helpers/test-base';

/**
 * The Svg element, against spec/fixtures/svg-import/svg-element.json.
 * Mirrors BonniePDF.Tests/Elements/SvgElementTests.cs, including the expected bytes.
 */
const fontsDir = join(__dirname, '../../assets/fonts');
const NS = 'xmlns="http://www.w3.org/2000/svg"';
const FILTERED =
  `<svg ${NS} viewBox="0 0 20 10"><defs><filter id="blur"><feGaussianBlur stdDeviation="1"/></filter></defs>` +
  '<rect width="10" height="10" fill="#ff0000" filter="url(#blur)"/><rect x="10" width="10" height="10" fill="#0000ff"/></svg>';
const RICH =
  `<svg ${NS} width="120" height="80" viewBox="0 0 120 80">` +
  '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1d4ed8"/>' +
  '<stop offset="1" stop-color="#f59e0b" stop-opacity="0.6"/></linearGradient>' +
  '<clipPath id="c"><circle cx="60" cy="40" r="36"/></clipPath></defs>' +
  '<g transform="rotate(-8 60 40)" clip-path="url(#c)"><rect x="4" y="4" width="112" height="72" rx="9" fill="url(#g)"/></g>' +
  '<path d="M10 70 A 25 18 0 0 1 60 60 Q 85 45 110 70" stroke="#111827" stroke-width="2.5" stroke-dasharray="4 2" fill="none" stroke-linecap="round"/>' +
  '<text x="60" y="46" text-anchor="middle" font-family="Arial" font-size="15" font-weight="bold" fill="#ffffff" opacity="0.9">AVAWATYo</text></svg>';
/** A 1x1 PNG, standing in for what a real rasterizer returns. */
const PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='),
  c => c.charCodeAt(0)
);

/** The preferred width, and the height at that width: the element's natural box. */
function naturalBox(svg: Svg): [number, number] {
  const width = svg.getPreferredWidth();
  return [width, svg.measureHeight(width)];
}

function page(...elements: Svg[]): Document {
  const doc = new Document();
  doc.settings.margin = 0;
  for (const element of elements) doc.add(element);
  return doc;
}

beforeEach(() => {
  FontManager.clear();
  FontManager.autoRegisterBundledFonts(fontsDir);
});

afterEach(() => {
  FontManager.clear();
  FontManager.autoRegisterBundledFonts(fontsDir);
});

describe('Svg element: intrinsic size', () => {
  it.each([
    ['unitless-is-px', `<svg ${NS} width="100" height="50"/>`, 75, 37.5],
    ['absolute-units', `<svg ${NS} width="1in" height="2cm"/>`, 72, 56.69291338582677],
    ['viewbox-stands-in', `<svg ${NS} viewBox="0 0 40 20"/>`, 30, 15],
    ['percentage-defers-to-viewbox', `<svg ${NS} width="50%" viewBox="0 0 40 20"/>`, 30, 15],
  ])('%s', (_id, svgData, width, height) => {
    const [w, h] = naturalBox(new Svg({ svgData }));
    expect(w).toBeCloseTo(width, 4);
    expect(h).toBeCloseTo(height, 4);
  });

  it('no-intrinsic-size: reported unless the element sets both width and height', () => {
    const unsized = page(new Svg({ svgData: `<svg ${NS}/>` }));
    unsized.generateBytes();
    expect(unsized.diagnostics.some(d => d.severity === 'error' && d.message.includes('no intrinsic size'))).toBe(true);

    expect(naturalBox(new Svg({ svgData: `<svg ${NS}/>`, width: 40, height: 20 }))).toEqual([40, 20]);
  });
});

describe('Svg element: the box', () => {
  it('width-only-keeps-aspect', () => {
    const svg = new Svg({ svgData: `<svg ${NS} width="100" height="50"/>`, width: 150, fitMode: 'contain' });
    expect(naturalBox(svg)).toEqual([150, 75]);
  });

  it('fill-stretches-box-not-content', () => {
    const svg = new Svg({
      svgData: `<svg ${NS} viewBox="0 0 10 10"><rect width="10" height="10"/></svg>`,
      width: 200,
      height: 100,
      fitMode: ImageFitMode.Fill,
    });
    expect(naturalBox(svg)).toEqual([200, 100]);
    // The 10x10 viewBox is centred in the 200x100 box: 100 pt square, 50 pt in.
    const ops = firstContentStream(page(svg).generateBytes());
    expect(ops.slice(ops.indexOf('W n'))).toContain('50 841.89 m\n150 841.89 l\n150 741.89 l\n50 741.89 l\n');
  });

  it('aspect-none-distorts', () => {
    const svg = new Svg({
      svgData: `<svg ${NS} viewBox="0 0 10 10" preserveAspectRatio="none"><rect width="10" height="10"/></svg>`,
      width: 200,
      height: 100,
      fitMode: 'fill',
    });
    expect(naturalBox(svg)).toEqual([200, 100]);
    const ops = firstContentStream(page(svg).generateBytes());
    expect(ops.slice(ops.indexOf('W n'))).toContain('0 841.89 m\n200 841.89 l\n200 741.89 l\n0 741.89 l\n');
  });

  it('cover scales past the requested box and draws at that size, as Image does', () => {
    const svg = new Svg({ svgData: `<svg ${NS} viewBox="0 0 10 20"/>`, width: 100, height: 100, fitMode: 'cover' });
    expect(naturalBox(svg)).toEqual([100, 200]);
  });

  it('a generator is given the box, and needs both width and height', () => {
    const seen: { width: number; height: number }[] = [];
    const svg = new Svg({
      svgGenerator: size => {
        seen.push(size);
        return `<svg ${NS} viewBox="0 0 ${size.width} ${size.height}"><rect width="10" height="10"/></svg>`;
      },
      width: 120,
      height: 60,
    });
    page(svg).generateBytes();
    expect(seen[0]).toEqual({ width: 120, height: 60 });
    expect(() => page(new Svg({ svgGenerator: () => '<svg/>', width: 10 })).generateBytes()).toThrow(
      /needs both width and height/
    );
  });
});

describe('Svg element: fonts', () => {
  function outlineOf(face: { glyphIndex(c: number): number; outline(g: number): readonly unknown[] }): string {
    return JSON.stringify(face.outline(face.glyphIndex(0x41)));
  }
  const liberation = (file: string): string =>
    outlineOf(new TextFontFaceAdapter(readFileSync(join(fontsDir, file)), 'reference'));

  it('alias-resolves: Arial is Helvetica, drawn from Liberation Sans', () => {
    const face = new BonniePdfFontProvider().resolve('Arial', 400, false);
    expect(face).toBeDefined();
    expect(outlineOf(face!)).toBe(liberation('LiberationSans-Regular.ttf'));
  });

  it('generic-resolves: monospace is Courier, drawn from Liberation Mono', () => {
    const face = new BonniePdfFontProvider().resolve('monospace', 700, false);
    expect(outlineOf(face!)).toBe(liberation('LiberationMono-Bold.ttf'));
  });

  it('a registered font resolves by its own family name', () => {
    const face = new BonniePdfFontProvider().resolve('Liberation Serif', 400, true);
    expect(outlineOf(face!)).toBe(liberation('LiberationSerif-Italic.ttf'));
  });

  it('an unknown family resolves to nothing, rather than to Helvetica', () => {
    expect(new BonniePdfFontProvider().resolve('No Such Font', 400, false)).toBeUndefined();
    expect(new BonniePdfFontProvider().resolve('cursive', 400, false)).toBeUndefined();
  });

  const text = (family: string): Svg =>
    new Svg({
      svgData: `<svg ${NS} viewBox="0 0 100 20"><text x="0" y="15" font-family="${family}" font-size="12">Ho</text></svg>`,
      strictUnsupportedFeatures: false,
    });

  it('falls-down-the-list: nothing reported', () => {
    const doc = page(text('No Such Font, sans-serif'));
    const ops = firstContentStream(doc.generateBytes());
    expect(doc.diagnostics.filter(d => d.source === 'svg')).toEqual([]);
    expect(ops).toMatch(/ c\n/); // glyph outlines
  });

  it('draws text in a registered CFF (OpenType) font', () => {
    // A CFF font's glyphs are cubic outlines. Before the font seam carried cubic
    // segments, this text was silently drawn as nothing.
    const corpus = JSON.parse(readFileSync(join(__dirname, '../typography/fixtures/cff.json'), 'utf8')) as {
      fonts: { id: string; fontBase64: string }[];
    };
    const bytes = new Uint8Array(Buffer.from(corpus.fonts.find(f => f.id === 'SourceSans3')!.fontBase64, 'base64'));
    FontManager.registerFont(bytes, { family: 'Source Sans CFF' });
    const face = new TextFontFaceAdapter(bytes, 'Source Sans CFF');
    const contours = [...'office'].reduce(
      (n, c) => n + face.outline(face.glyphIndex(c.codePointAt(0)!)).filter(s => s.kind === 'close').length,
      0
    );
    expect(contours).toBeGreaterThanOrEqual(6);

    const drawing = (content: string) => page(new Svg({ svgData: `<svg ${NS} viewBox="0 0 100 20">${content}</svg>` }));
    const closes = (ops: string) => (ops.match(/^h$/gm) ?? []).length;
    const doc = drawing('<text x="0" y="15" font-family="Source Sans CFF" font-size="12">office</text>');
    const ops = firstContentStream(doc.generateBytes());
    expect(doc.diagnostics.filter(d => d.source === 'svg')).toEqual([]);
    expect(ops).toMatch(/ c\n/);
    // Every contour of every glyph is drawn: the closes beyond the empty drawing's own.
    expect(closes(ops) - closes(firstContentStream(drawing('').generateBytes()))).toBe(contours);
  });

  it('nothing-resolves: text not drawn; reported, naming the family', () => {
    const doc = page(text('No Such Font'));
    doc.generateBytes();
    const reported = doc.diagnostics.filter(d => d.source === 'svg');
    expect(reported).toHaveLength(1);
    expect(reported[0].message).toContain('No Such Font');
  });
});

describe('Svg element: unsupported features', () => {
  it('strict-fails, naming filter', () => {
    expect(() => page(new Svg({ svgData: FILTERED })).generateBytes()).toThrow(SvgUnsupportedFeatureError);
    try {
      page(new Svg({ svgData: FILTERED })).generateBytes();
    } catch (error) {
      expect((error as SvgUnsupportedFeatureError).features.map(f => f.feature)).toEqual(['filter']);
    }
  });

  it('lenient-draws-subset: the rect drawn without its filter; one diagnostic naming filter', () => {
    const doc = page(new Svg({ svgData: FILTERED, strictUnsupportedFeatures: false }));
    const ops = firstContentStream(doc.generateBytes());
    const reported = doc.diagnostics.filter(d => d.source === 'svg');
    expect(reported).toHaveLength(1);
    expect(reported[0].message).toContain('filter');
    expect(ops).toContain('1 0 0 rg');
    expect(ops).toContain('0 0 1 rg');
  });

  it('lenient-rasterizes: drawn as an image in its place, on the async path', async () => {
    const doc = page(new Svg({ svgData: FILTERED, strictUnsupportedFeatures: false }));
    const snippets: string[] = [];
    doc.registerSvgRasterizer(async svg => {
      snippets.push(svg);
      return PNG;
    });
    const bytes = await doc.generateBytesAsync();
    expect(snippets).toHaveLength(1);
    expect(snippets[0]).toContain('filter');
    const ops = firstContentStream(bytes);
    expect(ops).toMatch(/\/I\d+ Do/);
    expect(ops).not.toContain('1 0 0 rg');
    expect(ops.indexOf(' Do')).toBeLessThan(ops.indexOf('0 0 1 rg'));
    expect(doc.diagnostics.filter(d => d.source === 'svg')).toEqual([]);
  });

  it('a synchronous generate that would need the rasterizer fails, naming the async path', () => {
    const doc = page(new Svg({ svgData: FILTERED, strictUnsupportedFeatures: false }));
    doc.registerSvgRasterizer(async () => PNG);
    expect(() => doc.generateBytes()).toThrow(/async/);
  });

  it('a rasterizer that is not needed does not affect the synchronous path', () => {
    const plain = `<svg ${NS} viewBox="0 0 10 10"><rect width="10" height="10" fill="#0000ff"/></svg>`;
    const without = firstContentStream(
      page(new Svg({ svgData: plain, strictUnsupportedFeatures: false })).generateBytes()
    );
    const doc = page(new Svg({ svgData: plain, strictUnsupportedFeatures: false }));
    doc.registerSvgRasterizer(async () => PNG);
    expect(firstContentStream(doc.generateBytes())).toBe(without);
  });
});

describe('Svg element: tagging', () => {
  let doc: Document;
  afterEach(() => doc?.dispose());

  function tagged(svg: Svg): Document {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en';
    doc.metadata.title = 'Svg';
    doc.add(svg);
    return doc;
  }
  const logo = (extra = ''): string => `<svg ${NS} viewBox="0 0 10 10">${extra}<rect width="10" height="10"/></svg>`;

  it('alt-text: Figure with /Alt (Company logo)', () => {
    const text = pdfToText(tagged(new Svg({ svgData: logo(), altText: 'Company logo' })).generateBytes());
    expect(text).toContain('/S /Figure');
    expect(text).toContain('/Alt (Company logo)');
  });

  it("title-as-alt: Figure with /Alt from the document's <title>", () => {
    const svg = new Svg({ svgData: logo('<title>Logo</title>') });
    expect(svg.semanticRole).toBe(SemanticRole.Figure);
    const text = pdfToText(tagged(svg).generateBytes());
    expect(text).toContain('/Alt (Logo)');
  });

  it('no-alt: Artifact; preflight reports figure-missing-alt', async () => {
    const d = tagged(new Svg({ svgData: logo() }));
    const heading = new Heading('Title');
    heading.level = 1;
    d.add(heading);
    expect(pdfToText(d.generateBytes())).not.toContain('/S /Figure');
    const { snapshot } = await d.generateSvgDocumentAsync({ captureLayout: true });
    expect(evaluateCompliance(snapshot!).findings.some(f => f.code === 'figure-missing-alt')).toBe(true);
  });

  it('decorative: Artifact; no preflight finding', async () => {
    const d = tagged(new Svg({ svgData: logo(), isDecorative: true }));
    const { snapshot } = await d.generateSvgDocumentAsync({ captureLayout: true });
    expect(evaluateCompliance(snapshot!).findings.some(f => f.code === 'figure-missing-alt')).toBe(false);
  });
});

describe('Svg element: compliance', () => {
  it('pdfa1-forces-opaque', () => {
    const doc = page(
      new Svg({ svgData: `<svg ${NS} viewBox="0 0 10 10"><rect width="10" height="10" fill-opacity="0.5"/></svg>` })
    );
    doc.settings.conformance = PdfAConformance.PdfA1b;
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/ca 1.0000');
    expect(text).not.toContain('/ca 0.5000');
  });
});

describe('Svg element: output', () => {
  it('draws at the flow position in CSS px scaled onto points, clipped to its box (same bytes as .NET)', () => {
    const doc = page(
      new Svg({
        svgData: `<svg ${NS} width="40" height="20" viewBox="0 0 4 2"><rect x="1" width="2" height="2" fill="#ff0000"/></svg>`,
        width: 30,
        margin: { left: 10, top: 20 },
      })
    );
    expect(firstContentStream(doc.generateBytes())).toBe(
      'q\nq\n10 821.89 m\n40 821.89 l\n40 806.89 l\n10 806.89 l\nh\nW n\n' +
        'q\nq\n1 0 0 rg\n17.5 821.89 m\n32.5 821.89 l\n32.5 806.89 l\n17.5 806.89 l\nh\nf\nQ\nQ\nQ\nQ\n'
    );
  });

  // Gradient, rotated clip, dashed arc and kerned bold text, fitted at the
  // natural size and at an arbitrary width. The hashes are asserted in both
  // suites: the operators must be byte-identical across the implementations.
  // A page given in points, since the two implementations' A4 differ in the
  // last float digit.
  it.each([
    [undefined, '9296848b18978881ef6f4e9ed3179ec40e2c36a7767f63a2c5b82a07269fa51e'],
    [173.3, '9c314747a63c584c830785d826952564fcd01be9d16240380c71e09886abb1d7'],
  ])('draws a rich document byte-identically to .NET (width %s)', (width, hash) => {
    const doc = new Document({ settings: { margin: 36, pageSize: new PdfSize(600, 800) } });
    doc.add(new Svg({ svgData: RICH, width }));
    const ops = firstContentStream(doc.generateBytes());
    expect(createHash('sha256').update(ops).digest('hex')).toBe(hash);
  });
});
