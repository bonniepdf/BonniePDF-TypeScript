import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { FontManager } from '../../src/Typography/FontManager';
import { applyFacturX } from '../../src/EInvoice/FacturX';
import { FacturXProfile, facturXConformanceLevel } from '../../src/EInvoice/FacturXProfile';
import { pdfToText } from '../helpers/test-base';

const invoiceXml = () =>
  new TextEncoder().encode('<rsm:CrossIndustryInvoice><total>42.00</total></rsm:CrossIndustryInvoice>');

// The fx block only survives when the PDF/A-3 claim survives, which requires
// an embeddable font (PDF/A forces standard-14 embedding). Register Liberation
// Sans so the honest-claim guard does not suppress the claim.
const fontsDir = join(__dirname, '../../assets/fonts');

describe('Factur-X / ZUGFeRD e-invoice', () => {
  let doc: Document;

  beforeEach(() => {
    FontManager.clear();
    FontManager.registerFont(new Uint8Array(readFileSync(join(fontsDir, 'LiberationSans-Regular.ttf'))));
  });

  afterEach(() => {
    doc?.dispose();
    FontManager.clear();
  });

  it('forces PDF/A-3, attaches the XML, and writes the fx: XMP block', () => {
    doc = new Document();
    doc.add(new TextBlock('Invoice #1001'));
    applyFacturX(doc, invoiceXml(), { profile: FacturXProfile.En16931 });

    expect(doc.settings.conformance).toBe(PdfAConformance.PdfA3b);

    const out = pdfToText(doc.generateBytes());
    // PDF/A-3 claim survived the honest-claim guard.
    expect(out).toContain('pdfaid:part');
    // Embedded XML as an associated file with the Data relationship.
    expect(out).toContain('/Type /EmbeddedFile');
    expect(out).toContain('/AFRelationship /Data');
    expect(out).toContain('(factur-x.xml)');
    // fx: XMP block + values.
    expect(out).toContain('urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#');
    expect(out).toContain('EN 16931');
    expect(out).toContain('INVOICE');
    // fx namespace is non-predefined -> extension schema present.
    expect(out).toContain('Factur-X PDFA Extension Schema');
  });

  it('keeps an existing PDF/A-3a (tagged) choice', () => {
    doc = new Document();
    doc.settings.conformance = PdfAConformance.PdfA3a;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';
    applyFacturX(doc, invoiceXml(), { profile: FacturXProfile.Basic });
    expect(doc.settings.conformance).toBe(PdfAConformance.PdfA3a);
  });

  it('maps every profile to its conformance-level string', () => {
    expect(facturXConformanceLevel(FacturXProfile.Minimum)).toBe('MINIMUM');
    expect(facturXConformanceLevel(FacturXProfile.BasicWl)).toBe('BASIC WL');
    expect(facturXConformanceLevel(FacturXProfile.Basic)).toBe('BASIC');
    expect(facturXConformanceLevel(FacturXProfile.En16931)).toBe('EN 16931');
    expect(facturXConformanceLevel(FacturXProfile.Extended)).toBe('EXTENDED');
    expect(facturXConformanceLevel(FacturXProfile.XRechnung)).toBe('XRECHNUNG');
  });

  it('rejects empty XML', () => {
    doc = new Document();
    expect(() => applyFacturX(doc, new Uint8Array(0))).toThrow();
  });

  it('flows a custom file name to both the attachment and the XMP', () => {
    doc = new Document();
    doc.add(new TextBlock('ZUGFeRD'));
    applyFacturX(doc, invoiceXml(), { fileName: 'zugferd-invoice.xml' });
    const out = pdfToText(doc.generateBytes());
    expect(out).toContain('(zugferd-invoice.xml)');
    expect(out).not.toContain('(factur-x.xml)');
  });

  it('withholds the fx block on a non-PDF/A-3 document even with fx metadata set', () => {
    // PDF/A-2b emits a pdfaid claim but must NOT carry the fx block: Factur-X
    // requires PDF/A-3. This proves the A-3 gate, not just the guard.
    doc = new Document();
    doc.settings.conformance = PdfAConformance.PdfA2b;
    doc.settings.facturX = {
      documentType: 'INVOICE',
      documentFileName: 'factur-x.xml',
      version: '1.0',
      conformanceLevel: 'EN 16931',
    };
    doc.add(new TextBlock('archival, not an einvoice'));
    const out = pdfToText(doc.generateBytes());
    expect(out).toContain('pdfaid:part');
    expect(out).not.toContain('urn:factur-x:pdfa:CrossIndustryDocument');
  });
});
