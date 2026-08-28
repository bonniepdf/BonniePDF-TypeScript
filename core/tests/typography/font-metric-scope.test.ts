import { inflateSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { Container } from '../../src/Elements/Layout/Container';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Document } from '../../src/Document';
import { FontManager } from '../../src/Typography/FontManager';
import { FontMetrics } from '../../src/Typography/FontMetrics';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { TtfFont } from '../../src/Typography/TrueType/TtfFont';
import { beginDocumentFontMetricScope } from '../../src/Typography/DocumentFontMetricScope';

const fontsDir = join(__dirname, '../../assets/fonts');
const probeText = 'Revenue by segment';

describe('document-scoped font metrics', () => {
  beforeEach(() => {
    FontManager.clear();
    FontManager.autoRegisterBundledFonts(fontsDir);
  });

  afterEach(() => {
    FontManager.clear();
    FontManager.autoRegisterBundledFonts(fontsDir);
  });

  it('keeps PDF/UA layout identical across sequential documents without leaking aliases', () => {
    const baseline = FontMetrics.getStringWidth(probeText, StandardFonts.Helvetica, 11);
    const first = buildProbe().generateBytes();
    const second = buildProbe().generateBytes();

    expect(textShowCount(first)).toBe(2);
    expect(textShowCount(second)).toBe(2);
    expect(FontMetrics.getStringWidth(probeText, StandardFonts.Helvetica, 11)).toBe(baseline);
  });

  it('uses embedded metrics before the first PDF/A layout measurement', () => {
    const first = buildProbe(PdfAConformance.PdfA2b).generateBytes();
    const second = buildProbe(PdfAConformance.PdfA2b).generateBytes();

    expect(textShowCount(first)).toBe(2);
    expect(textShowCount(second)).toBe(2);
  });

  it('keeps SVG layout identical across sequential documents', async () => {
    const first = await buildProbe().generateSvgDocumentAsync();
    const second = await buildProbe().generateSvgDocumentAsync();

    expect(first.pages).toEqual(second.pages);
    expect(count(first.pages[0], '<text ')).toBe(2);
  });

  it('isolates overlapping asynchronous PDF renders', async () => {
    const pdfUa = buildProbe();
    const pdfA = buildProbe(PdfAConformance.PdfA2b);
    const [uaBytes, aBytes] = await Promise.all([pdfUa.generateBytesAsync(), pdfA.generateBytesAsync()]);

    expect(textShowCount(uaBytes)).toBe(2);
    expect(textShowCount(aBytes)).toBe(2);
  });

  it('restores nested document aliases and supports file-backed aliases', () => {
    const sans = TtfFont.fromFileSync(join(fontsDir, 'LiberationSans-Regular.ttf'));
    const serifPath = join(fontsDir, 'LiberationSerif-Regular.ttf');
    const serif = TtfFont.fromFileSync(serifPath);
    const expectedSans = FontMetrics.getKernedStringWidth(probeText, sans, 11);
    const expectedSerif = FontMetrics.getKernedStringWidth(probeText, serif, 11);

    const outer = beginDocumentFontMetricScope(false);
    try {
      FontMetrics.registerFontAlias('ScopedAlias', serifPath);
      expect(FontMetrics.getStringWidth(probeText, 'ScopedAlias', 11)).toBeCloseTo(expectedSerif, 6);

      const inner = beginDocumentFontMetricScope(false);
      try {
        FontMetrics.registerFontInstance('ScopedAlias', sans);
        expect(FontMetrics.getStringWidth(probeText, 'ScopedAlias', 11)).toBeCloseTo(expectedSans, 6);
      } finally {
        inner.dispose();
      }

      expect(FontMetrics.getStringWidth(probeText, 'ScopedAlias', 11)).toBeCloseTo(expectedSerif, 6);
    } finally {
      outer.dispose();
    }
  });

  it('reparses a font when an existing registration is replaced', () => {
    const serifBytes = new Uint8Array(readFileSync(join(fontsDir, 'LiberationSerif-Regular.ttf')));
    const sansBytes = new Uint8Array(readFileSync(join(fontsDir, 'LiberationSans-Regular.ttf')));
    const serif = TtfFont.loadFromBytes(serifBytes);
    const sans = TtfFont.loadFromBytes(sansBytes);

    FontManager.registerFont(serifBytes, { family: 'Liberation Sans', subfamily: 'Regular' });
    const registeredSerif = FontManager.getFallbackFonts().find(font => font.key === 'liberation sans:regular')!;
    expect(FontMetrics.getKernedStringWidth(probeText, registeredSerif.font, 11)).toBeCloseTo(
      FontMetrics.getKernedStringWidth(probeText, serif, 11),
      6
    );

    FontManager.registerFont(sansBytes, { family: 'Liberation Sans', subfamily: 'Regular' });
    const registeredSans = FontManager.getFallbackFonts().find(font => font.key === 'liberation sans:regular')!;
    expect(registeredSans.font).not.toBe(registeredSerif.font);
    expect(FontMetrics.getKernedStringWidth(probeText, registeredSans.font, 11)).toBeCloseTo(
      FontMetrics.getKernedStringWidth(probeText, sans, 11),
      6
    );
  });
});

function buildProbe(conformance = PdfAConformance.None): Document {
  const doc = new Document();
  doc.settings.margin = 20;
  doc.settings.accessibility = conformance === PdfAConformance.None ? AccessibilityMode.PdfUa1 : AccessibilityMode.None;
  doc.settings.conformance = conformance;
  doc.settings.language = 'en-GB';
  doc.add(
    new Container({
      width: 104.945,
      border: 0.5,
      child: new TextBlock(probeText, {
        fontName: StandardFonts.Helvetica,
        fontSize: 11,
      }),
    })
  );
  return doc;
}

function textShowCount(bytes: Uint8Array): number {
  const pdf = Buffer.from(bytes).toString('latin1');
  let total = 0;
  let index = 0;
  while (true) {
    const start = pdf.indexOf('stream', index);
    if (start < 0) break;
    let contentStart = start + 'stream'.length;
    if (pdf[contentStart] === '\r') contentStart++;
    if (pdf[contentStart] === '\n') contentStart++;
    const end = pdf.indexOf('endstream', contentStart);
    if (end < 0) break;

    const raw = Buffer.from(pdf.slice(contentStart, end), 'latin1');
    let stream: string;
    try {
      stream = inflateSync(raw).toString('latin1');
    } catch {
      stream = raw.toString('latin1');
    }
    total += count(stream, ' Tj') + count(stream, ' TJ');
    index = end + 'endstream'.length;
  }
  return total;
}

function count(source: string, needle: string): number {
  let total = 0;
  let index = 0;
  while ((index = source.indexOf(needle, index)) >= 0) {
    total++;
    index += needle.length;
  }
  return total;
}
