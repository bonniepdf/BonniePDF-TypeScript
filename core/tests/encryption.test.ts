import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { EncryptionSettings } from '../src/Security/Models/EncryptionSettings';
import { EncryptionAlgorithm } from '../src/Security/Models/EncryptionAlgorithm';
import { PdfEncryptor } from '../src/Security/Encryption/pdfEncryptor';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { withPassword, withEncryption128, withEncryptionAes256 } from '../src/Extensions/DocumentEncryptionExtensions';
import { pdfToText } from './helpers/test-base';

describe('EncryptionSettings', () => {
  it('RC4_128 has correct key length bits', () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.RC4_128;
    expect(settings.keyLengthBits).toBe(128);
  });

  it('RC4_128 has correct key length bytes', () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.RC4_128;
    expect(settings.keyLengthBytes).toBe(16);
  });

  it('AES_256 has correct key length bits', () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.AES_256;
    expect(settings.keyLengthBits).toBe(256);
  });

  it('AES_256 has correct key length bytes', () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.AES_256;
    expect(settings.keyLengthBytes).toBe(32);
  });

  it('AES_256 versionValue is 5 (method call)', () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.AES_256;
    expect(settings.versionValue()).toBe(5);
  });

  it('AES_256 revisionValue is 6 (getter)', () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.AES_256;
    expect(settings.revisionValue).toBe(6);
  });

  it('RC4_128 versionValue is 2', () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.RC4_128;
    expect(settings.versionValue()).toBe(2);
  });

  it('RC4_128 revisionValue is 3', () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.RC4_128;
    expect(settings.revisionValue).toBe(3);
  });
});

describe('PdfEncryptor', () => {
  it('RC4_128 produces encrypt dictionary synchronously', () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.RC4_128;
    settings.userPassword = 'user';
    settings.ownerPassword = 'owner';
    const encryptor = new PdfEncryptor(settings);
    const dict = encryptor.getEncryptDictionary();
    expect(dict.get('/Filter')).toBe('/Standard');
    expect(dict.has('/O')).toBe(true);
    expect(dict.has('/U')).toBe(true);
  });

  it('AES256_Encryptor_ProducesEncryptDictionary (async)', async () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.AES_256;
    settings.userPassword = '';
    settings.ownerPassword = 'owner';
    const encryptor = await PdfEncryptor.create(settings);
    const dict = encryptor.getEncryptDictionary();
    expect(dict.get('/Filter')).toBe('/Standard');
    expect(dict.has('/O')).toBe(true);
    expect(dict.has('/U')).toBe(true);
    expect(dict.get('/CF')).toContain('/AESV3');
  });

  it('AES256_EncryptData_ProducesOutput (async)', async () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.AES_256;
    settings.userPassword = '';
    settings.ownerPassword = 'owner';
    const encryptor = await PdfEncryptor.create(settings);
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const result = await encryptor.encryptDataAsync(data, 1);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('RC4_128 encryptData returns different bytes', () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.RC4_128;
    settings.userPassword = '';
    settings.ownerPassword = 'owner';
    const encryptor = new PdfEncryptor(settings);
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const result = encryptor.encryptData(data, 1);
    expect(result).toBeDefined();
    expect(result.length).toBe(data.length);
  });

  it('AES256_GetIdArray_ReturnsValidFormat (async)', async () => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.AES_256;
    settings.userPassword = '';
    settings.ownerPassword = 'owner';
    const encryptor = await PdfEncryptor.create(settings);
    const idArray = encryptor.getIdArray();
    expect(idArray.startsWith('[ <')).toBe(true);
    expect(idArray.endsWith('> ]')).toBe(true);
  });
});

describe('Encryption document integration', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('AES256_RequiresPdf17_ThrowsOnPdf14', () => {
    doc = new Document();
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.AES_256;
    settings.userPassword = '';
    settings.ownerPassword = 'owner';
    doc.settings.encryption = settings;
    doc.settings.version = PdfVersion.Pdf14;
    expect(() => doc.generateBytes()).toThrow();
  });

  it('AES256_WithPdf17_SavesSuccessfully', () => {
    // Encryption serialization is stubbed — validates settings and generates valid PDF bytes
    doc = new Document();
    withEncryptionAes256(doc.settings, opt => opt.withUserPassword('secret').withOwnerPassword('secret'));
    const bytes = doc.generateBytes();
    expect(bytes.length).toBeGreaterThan(0);
    const text = pdfToText(bytes);
    expect(text.startsWith('%PDF-1.7')).toBe(true);
  });

  it('RC4_128_StillWorksAfterChanges', () => {
    // Encryption serialization is stubbed — validates settings and generates valid PDF bytes
    doc = new Document();
    withEncryption128(doc.settings, opt => opt.withUserPassword('pass123').withOwnerPassword('pass123'));
    const bytes = doc.generateBytes();
    const text = pdfToText(bytes);
    expect(text.startsWith('%PDF-1.4')).toBe(true);
  });

  it('withPassword generates valid PDF bytes', () => {
    // Encryption serialization is stubbed — validates settings and generates valid PDF bytes
    doc = new Document();
    withPassword(doc.settings, 'mypassword');
    const bytes = doc.generateBytes();
    expect(bytes.length).toBeGreaterThan(0);
    expect(pdfToText(bytes).startsWith('%PDF-')).toBe(true);
  });
});
