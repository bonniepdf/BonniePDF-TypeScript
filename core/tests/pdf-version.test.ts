import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { EncryptionSettings } from '../src/Security/Models/EncryptionSettings';
import { asPdf17, asPdfA } from '../src/Extensions/DocumentSettingsExtensions';
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

  it('asPdfA sets pdfAEnabled and version to Pdf17', () => {
    doc = new Document();
    asPdfA(doc.settings);
    expect(doc.settings.version).toBe(PdfVersion.Pdf17);
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

  it('PdfA_ContainsOutputIntents', () => {
    doc = new Document();
    asPdfA(doc.settings);
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/OutputIntents');
    expect(text).toContain('/GTS_PDFA1');
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
