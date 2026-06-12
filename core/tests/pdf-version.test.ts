import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { EncryptionSettings } from '../src/Security/Models/EncryptionSettings';
import { PdfAConformance } from '../src/Configuration/PdfAConformance';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { asPdf17, asPdf20, asPdfA, asPdfA4 } from '../src/Extensions/DocumentSettingsExtensions';
import { pdfToText } from './helpers/test-base';

describe('PdfVersion', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('default document has Pdf14 version', () => {
    doc = new Document();
    expect(doc.settings.version).toBe(PdfVersion.Pdf14);
  });

  it('asPdf17 sets version to Pdf17', () => {
    doc = new Document();
    asPdf17(doc.settings);
    expect(doc.settings.version).toBe(PdfVersion.Pdf17);
  });

  it('asPdf20 sets version to Pdf20 without enabling conformance claims', () => {
    doc = new Document();
    asPdf20(doc.settings);
    expect(doc.settings.version).toBe(PdfVersion.Pdf20);
    expect(doc.settings.pdfAEnabled).toBe(false);
  });

  it('asPdfA sets pdfAEnabled and version to Pdf17', () => {
    doc = new Document();
    asPdfA(doc.settings);
    expect(doc.settings.version).toBe(PdfVersion.Pdf17);
    expect(doc.settings.pdfAEnabled).toBe(true);
  });

  it('asPdfA4 sets PdfA4 conformance and version to Pdf20', () => {
    doc = new Document();
    asPdfA4(doc.settings);
    expect(doc.settings.version).toBe(PdfVersion.Pdf20);
    expect(doc.settings.conformance).toBe(PdfAConformance.PdfA4);
    expect(doc.settings.pdfAEnabled).toBe(true);
  });

  it('Pdf14_GeneratesCorrectHeader', () => {
    doc = new Document();
    const bytes = doc.generateBytes();
    const header = new TextDecoder('latin1').decode(bytes.slice(0, 8));
    expect(header.startsWith('%PDF-1.4')).toBe(true);
  });

  it('Pdf17_GeneratesCorrectHeader', () => {
    doc = new Document();
    asPdf17(doc.settings);
    const bytes = doc.generateBytes();
    const header = new TextDecoder('latin1').decode(bytes.slice(0, 8));
    expect(header.startsWith('%PDF-1.7')).toBe(true);
  });

  it('Pdf20_GeneratesCorrectHeader', () => {
    doc = new Document();
    asPdf20(doc.settings);
    const bytes = doc.generateBytes();
    const header = new TextDecoder('latin1').decode(bytes.slice(0, 8));
    expect(header.startsWith('%PDF-2.0')).toBe(true);
  });

  it('Pdf20_IncludesPdf17MetadataFeaturesWithoutConformanceClaims', () => {
    doc = new Document();
    asPdf20(doc.settings);
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/Metadata');
    expect(text).not.toContain('pdfaid:part');
    expect(text).not.toContain('pdfuaid:part');
  });

  it('Pdf20_WithPdfUa1_ThrowsInsteadOfSilentlySuppressingAccessibility', () => {
    doc = new Document();
    asPdf20(doc.settings);
    doc.settings.accessibility = AccessibilityMode.PdfUa1;

    expect(() => doc.generateBytes()).toThrow(
      'PDF/UA-1 output is only supported with PdfVersion.Pdf17. PDF/UA-2 for PdfVersion.Pdf20 is not implemented yet.'
    );
  });

  it('PdfA4_DirectConformanceAutoUpgradesToPdf20', () => {
    doc = new Document();
    doc.settings.conformance = PdfAConformance.PdfA4;
    const text = pdfToText(doc.generateBytes());
    expect(doc.settings.version).toBe(PdfVersion.Pdf20);
    expect(text.startsWith('%PDF-2.0')).toBe(true);
  });

  it('PdfA_ContainsOutputIntents', () => {
    doc = new Document();
    asPdfA(doc.settings);
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/OutputIntents');
    expect(text).toContain('/GTS_PDFA1');
  });

  it('PdfA4_WithEncryption_ThrowsInvalidOperation', () => {
    doc = new Document();
    asPdfA4(doc.settings);
    const enc = new EncryptionSettings();
    enc.ownerPassword = 'owner';
    enc.userPassword = '';
    doc.settings.encryption = enc;
    expect(() => doc.generateBytes()).toThrow();
  });

  it('PdfA_WithEncryption_ThrowsInvalidOperation', () => {
    doc = new Document();
    asPdfA(doc.settings);
    const enc = new EncryptionSettings();
    enc.ownerPassword = 'owner';
    enc.userPassword = '';
    doc.settings.encryption = enc;
    expect(() => doc.generateBytes()).toThrow();
  });
});
