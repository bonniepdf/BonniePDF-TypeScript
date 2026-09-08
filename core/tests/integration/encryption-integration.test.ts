import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { PdfPermissions } from '../../src/Security/Permissions/PdfPermissions';
import {
  withPassword,
  withPasswords,
  withEncryption128,
  withEncryptionAes256,
} from '../../src/Security/EncryptionPresets';
import { assertValidPdf, pdfToText } from '../helpers/test-base';

describe('Encryption integration', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('withPassword generates valid PDF', () => {
    doc = new Document();
    doc.add(new TextBlock('Encrypted content', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    withPassword(doc.settings, 'secret');
    assertValidPdf(doc.generateBytes());
  });

  it('withPasswords generates valid PDF', () => {
    doc = new Document();
    withPasswords(doc.settings, 'user', 'owner', PdfPermissions.All);
    assertValidPdf(doc.generateBytes());
  });

  it('withEncryption128 generates valid PDF with Pdf14 header', () => {
    doc = new Document();
    withEncryption128(doc.settings, opt => opt.withUserPassword('pass').withOwnerPassword('pass'));
    const text = pdfToText(doc.generateBytes());
    expect(text.startsWith('%PDF-1.4')).toBe(true);
  });

  it('withEncryptionAes256 generates valid PDF with Pdf17 header', () => {
    doc = new Document();
    withEncryptionAes256(doc.settings, opt => opt.withUserPassword('aes').withOwnerPassword('aes'));
    const text = pdfToText(doc.generateBytes());
    expect(text.startsWith('%PDF-1.7')).toBe(true);
  });

  it('RC4_128 document with metadata generates valid PDF', () => {
    doc = new Document();
    doc.metadata.title = 'Encrypted Document';
    doc.metadata.author = 'Test Author';
    withEncryption128(doc.settings, opt => opt.withUserPassword('pass').withOwnerPassword('pass'));
    assertValidPdf(doc.generateBytes());
  });

  it('AES256 document with content generates valid PDF', () => {
    doc = new Document();
    doc.add(new TextBlock('AES encrypted content', { fontSize: 12, fontName: StandardFonts.Helvetica }));
    withEncryptionAes256(doc.settings, opt => opt.withUserPassword('aes256').withOwnerPassword('aes256'));
    const bytes = doc.generateBytes();
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('encrypted document with restricted permissions generates valid PDF', () => {
    doc = new Document();
    withPasswords(doc.settings, '', 'owner', PdfPermissions.None);
    assertValidPdf(doc.generateBytes());
  });
});
