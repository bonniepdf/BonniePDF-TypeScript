import { describe, it, expect, afterEach } from 'vitest';
import { fileURLToPath } from 'node:url';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { FontManager } from '../../src/Typography/FontManager';
import { pdfToText } from '../helpers/test-base';

// Mirrors the shared fixture honest-claim/unembedded-standard-fonts: the
// honest-claim guard withholds the PDF/A and PDF/UA-1 claims when the
// standard-14 fonts cannot be embedded, keeps the tagging, reports one
// compliance warning per withheld claim, and never changes the document.
//
// Tests import from src/, so no Liberation faces are registered unless a test
// registers them: exactly the "no fonts available" state the fixture needs.

const BUNDLED_FONTS = fileURLToPath(new URL('../../assets/fonts', import.meta.url));

function fixtureDocument(conformance: PdfAConformance, accessibility: AccessibilityMode): Document {
  const doc = new Document();
  doc.metadata.title = 'Honest claims';
  doc.settings.language = 'en-GB';
  doc.settings.conformance = conformance;
  doc.settings.accessibility = accessibility;
  doc.add(new TextBlock('Honest claims', { fontSize: 12 }));
  return doc;
}

function inspect(bytes: Uint8Array) {
  const pdf = pdfToText(bytes);
  return {
    pdfaidClaim: pdf.includes('pdfaid:part'),
    pdfuaidClaim: pdf.includes('pdfuaid:part'),
    outputIntent: pdf.includes('/OutputIntents'),
    structTreeRoot: pdf.includes('/StructTreeRoot'),
    markInfo: pdf.includes('/MarkInfo'),
    embeddedFonts: (pdf.match(/\/FontFile2/g) ?? []).length,
  };
}

function complianceDiagnostics(doc: Document) {
  return doc.diagnostics
    .filter(d => d.category === 'compliance')
    .map(d => ({ category: d.category, severity: d.severity, source: d.source }));
}

describe('honest-claim guard without embeddable fonts', () => {
  let doc: Document;
  afterEach(() => {
    doc?.dispose();
    FontManager.clear();
  });

  it('withholds both claims, keeps the tagging, and reports each once (PDF/A-2a + PDF/UA-1)', async () => {
    doc = fixtureDocument(PdfAConformance.PdfA2a, AccessibilityMode.PdfUa1);
    const result = inspect(await doc.generateBytesAsync());

    expect(result).toEqual({
      pdfaidClaim: false,
      pdfuaidClaim: false,
      outputIntent: false,
      structTreeRoot: true,
      markInfo: true,
      embeddedFonts: 0,
    });
    expect(complianceDiagnostics(doc)).toEqual([
      { category: 'compliance', severity: 'warning', source: 'pdf/a-2a' },
      { category: 'compliance', severity: 'warning', source: 'pdf/ua-1' },
    ]);
  });

  it('keeps the OutputIntent of a PDF/UA-only document, which is not a claim', async () => {
    doc = fixtureDocument(PdfAConformance.None, AccessibilityMode.PdfUa1);
    const result = inspect(await doc.generateBytesAsync());

    expect(result).toEqual({
      pdfaidClaim: false,
      pdfuaidClaim: false,
      outputIntent: true,
      structTreeRoot: true,
      markInfo: true,
      embeddedFonts: 0,
    });
    expect(complianceDiagnostics(doc)).toEqual([{ category: 'compliance', severity: 'warning', source: 'pdf/ua-1' }]);
  });

  it('leaves the document unchanged, so a later generation with fonts carries the full claims', async () => {
    doc = fixtureDocument(PdfAConformance.PdfA2a, AccessibilityMode.PdfUa1);
    await doc.generateBytesAsync();
    expect(doc.settings.conformance).toBe(PdfAConformance.PdfA2a);
    expect(doc.settings.accessibility).toBe(AccessibilityMode.PdfUa1);

    FontManager.autoRegisterBundledFonts(BUNDLED_FONTS);
    const result = inspect(await doc.generateBytesAsync());

    expect(result.pdfaidClaim).toBe(true);
    expect(result.pdfuaidClaim).toBe(true);
    expect(result.outputIntent).toBe(true);
    expect(result.structTreeRoot).toBe(true);
    expect(result.embeddedFonts).toBeGreaterThanOrEqual(1);
    expect(complianceDiagnostics(doc)).toEqual([]);
  });

  it('reports nothing when no claim was requested', async () => {
    doc = fixtureDocument(PdfAConformance.None, AccessibilityMode.None);
    await doc.generateBytesAsync();
    expect(complianceDiagnostics(doc)).toEqual([]);
  });
});
