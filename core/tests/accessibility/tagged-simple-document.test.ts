import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { fileURLToPath } from 'node:url';
import { FontManager } from '../../src/Typography/FontManager';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { DocumentMetadata } from '../../src/Configuration/DocumentMetadata';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { Heading } from '../../src/Elements/Text/Heading';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { QRCode } from '../../src/Elements/Shapes/QRCode';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Thickness } from '../../src/Core/Thickness';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { pdfToText } from '../helpers/test-base';

/**
 * stage-0 closeout. Mirrors the .NET TaggedSimpleDocumentTests:
 * builds the tagged simple-document fixture inline and asserts the
 * byte-level shape VeraPDF profile `ua1` verifies (catalog refs, XMP
 * conformance claim, structure tree shape, per-page BDC/EMC balance).
 *
 * VeraPDF verification itself lives only on the .NET side (Q-V2 - the
 * BonniePDF.Validation tool validates PDFs from either repo, so the
 * developer runs it against TS-generated output out-of-band).
 */
describe('Tagged simple-document (stage-0 closeout)', () => {
  let doc: Document;

  // PDF/UA-1 requires embedded fonts, so the claim is only made when the
  // Liberation substitutes are available, as the Node entry point registers them.
  beforeEach(() => FontManager.autoRegisterBundledFonts(fileURLToPath(new URL('../../assets/fonts', import.meta.url))));

  afterEach(() => {
    doc?.dispose();
    FontManager.clear();
  });

  function buildTaggedDocument(): Document {
    const d = new Document();
    d.metadata = new DocumentMetadata();
    d.metadata.title = 'Simple Document - Tagged (PDF/UA-1)';
    d.metadata.author = 'BonniePDF';
    d.metadata.subject = 'this feature stage-0 closeout fixture.';
    d.metadata.keywords = 'pdf, pdf/ua, accessibility';

    d.settings = new DocumentSettings();
    d.settings.version = PdfVersion.Pdf17;
    d.settings.accessibility = AccessibilityMode.PdfUa1;
    d.settings.language = 'en-GB';

    const h1 = new Heading('Accessible PDF Demo');
    h1.tocIdentifier = 'intro';
    h1.level = 1;
    h1.fontName = StandardFonts.HelveticaBold;
    h1.fontSize = 24;
    h1.textColor = ColorPalette.slate[800];
    h1.margin = new Thickness(0, 0, 0, 12);
    d.add(h1);

    const p1 = new TextBlock();
    p1.text = 'This document opts into PDF/UA-1 tagging by setting Settings.Accessibility = AccessibilityMode.PdfUa1.';
    p1.fontName = StandardFonts.Helvetica;
    p1.fontSize = 12;
    p1.textColor = ColorPalette.slate[700];
    p1.margin = new Thickness(0, 0, 0, 8);
    d.add(p1);

    const p2 = new TextBlock();
    p2.text = 'Existing elements tag themselves automatically - no semantic verbs required.';
    p2.fontName = StandardFonts.Helvetica;
    p2.fontSize = 12;
    p2.textColor = ColorPalette.slate[700];
    p2.margin = new Thickness(0, 0, 0, 12);
    d.add(p2);

    const h2 = new Heading('Scan to verify');
    h2.tocIdentifier = 'qr';
    h2.level = 2;
    h2.fontName = StandardFonts.HelveticaBold;
    h2.fontSize = 16;
    h2.textColor = ColorPalette.slate[800];
    h2.margin = new Thickness(0, 0, 0, 8);
    d.add(h2);

    const qr = new QRCode();
    qr.data = 'https://github.com/bonniepdf/BonniePDF-TypeScript';
    qr.size = 100;
    qr.altText = 'QR code linking to the BonniePDF GitHub repository';
    d.add(qr);

    return d;
  }

  it('catalog references StructTreeRoot, MarkInfo, and Lang', () => {
    doc = buildTaggedDocument();
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/StructTreeRoot');
    expect(text).toContain('/MarkInfo << /Marked true >>');
    expect(text).toContain('/Lang (en-GB)');
  });

  it('XMP packet declares PDF/UA-1 conformance', () => {
    doc = buildTaggedDocument();
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/"');
    expect(text).toContain('<pdfuaid:part>1</pdfuaid:part>');
  });

  it('structure tree has Document root and heading hierarchy', () => {
    doc = buildTaggedDocument();
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/Type /StructTreeRoot');
    expect(text).toContain('/S /Document');
    expect(text).toContain('/S /H1');
    expect(text).toContain('/S /H2');
    expect(text).toContain('/S /P');
    expect(text).toContain('/S /Figure');
  });

  it('Figure carries alt text', () => {
    doc = buildTaggedDocument();
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/Alt (QR code linking to the BonniePDF GitHub repository)');
  });

  it('every page stream has balanced BDC/EMC', () => {
    doc = buildTaggedDocument();
    const text = pdfToText(doc.generateBytes());
    const streams = splitPageContentStreams(text);
    expect(streams.length).toBeGreaterThanOrEqual(1);
    for (const s of streams) {
      const bdc = countSubstring(s, 'BDC');
      const emc = countSubstring(s, 'EMC');
      expect(bdc).toBe(emc);
    }
  });

  it('produces a non-empty PDF with the 1.7 header', () => {
    doc = buildTaggedDocument();
    const bytes = doc.generateBytes();
    expect(bytes.length).toBeGreaterThan(1000);
    const header = new TextDecoder('ascii').decode(bytes.slice(0, 8));
    expect(header).toMatch(/^%PDF-1\.7/);
  });
});

function splitPageContentStreams(pdf: string): string[] {
  const result: string[] = [];
  let idx = 0;
  while (true) {
    const streamStart = pdf.indexOf('stream\n', idx);
    if (streamStart < 0) break;
    const contentStart = streamStart + 'stream\n'.length;
    const streamEnd = pdf.indexOf('endstream', contentStart);
    if (streamEnd < 0) break;
    const content = pdf.substring(contentStart, streamEnd);
    if (content.includes('BT') && content.includes('ET')) {
      result.push(content);
    }
    idx = streamEnd + 'endstream'.length;
  }
  return result;
}

function countSubstring(source: string, needle: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = source.indexOf(needle, idx)) >= 0) {
    count++;
    idx += needle.length;
  }
  return count;
}
