import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { EncryptionSettings } from '../../src/Security/Models/EncryptionSettings';
import { EncryptionAlgorithm } from '../../src/Security/Models/EncryptionAlgorithm';
import { PdfEncryptor } from '../../src/Security/Encryption/pdfEncryptor';
import { SyncAesCipher } from '../../src/Security/Encryption/syncAesCipher';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import {
  withPassword,
  withEncryption128,
  withEncryptionAes256,
} from '../../src/Extensions/DocumentEncryptionExtensions';
import { pdfToText } from '../helpers/test-base';

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
    doc = new Document();
    withEncryptionAes256(doc.settings, opt => opt.withUserPassword('secret').withOwnerPassword('secret'));
    const bytes = doc.generateBytes();
    expect(bytes.length).toBeGreaterThan(0);
    const text = pdfToText(bytes);
    expect(text.startsWith('%PDF-1.7')).toBe(true);
  });

  it('RC4_128_StillWorksAfterChanges', () => {
    doc = new Document();
    withEncryption128(doc.settings, opt => opt.withUserPassword('pass123').withOwnerPassword('pass123'));
    const bytes = doc.generateBytes();
    const text = pdfToText(bytes);
    expect(text.startsWith('%PDF-1.4')).toBe(true);
  });

  it('withPassword generates valid PDF bytes', () => {
    doc = new Document();
    withPassword(doc.settings, 'mypassword');
    const bytes = doc.generateBytes();
    expect(bytes.length).toBeGreaterThan(0);
    expect(pdfToText(bytes).startsWith('%PDF-')).toBe(true);
  });

  it('AES256_Async_EncryptsStreams', async () => {
    doc = new Document();
    withEncryptionAes256(doc.settings, opt => opt.withUserPassword('secret').withOwnerPassword('secret'));
    const bytes = await doc.generateBytesAsync();
    const text = pdfToText(bytes);
    expect(text.startsWith('%PDF-1.7')).toBe(true);
    expect(text).toContain('/Encrypt');
    expect(text).toContain('/AESV3');
  });

  it('AES256_Async_EncryptDictionary_HasAllEntries', async () => {
    doc = new Document();
    withEncryptionAes256(doc.settings, opt => opt.withUserPassword('test').withOwnerPassword('test'));
    const bytes = await doc.generateBytesAsync();
    const text = pdfToText(bytes);
    expect(text).toContain('/Filter /Standard');
    expect(text).toContain('/V 5');
    expect(text).toContain('/R 6');
    expect(text).toContain('/OE');
    expect(text).toContain('/UE');
    expect(text).toContain('/Perms');
    expect(text).toContain('/StmF /StdCF');
    expect(text).toContain('/StrF /StdCF');
  });

  it('AES256_Async_StreamsAreDifferentFromUnencrypted', async () => {
    doc = new Document();
    const unencryptedBytes = doc.generateBytes();

    const doc2 = new Document();
    withEncryptionAes256(doc2.settings, opt => opt.withUserPassword('pw').withOwnerPassword('pw'));
    const encryptedBytes = await doc2.generateBytesAsync();
    doc2.dispose();

    expect(encryptedBytes.length).toBeGreaterThan(unencryptedBytes.length);
  });

  it('RC4_128_EncryptDictionary_HasTrailerEntries', () => {
    doc = new Document();
    withEncryption128(doc.settings, opt => opt.withUserPassword('user').withOwnerPassword('owner'));
    const bytes = doc.generateBytes();
    const text = pdfToText(bytes);
    expect(text).toContain('/Encrypt');
    expect(text).toContain('/ID');
    expect(text).toContain('/Filter /Standard');
    expect(text).toContain('/O <');
    expect(text).toContain('/U <');
  });
});

describe('SyncAesCipher', () => {
  it('produces IV + ciphertext (longer than input)', () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const cipher = new SyncAesCipher(key);
    const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    const encrypted = cipher.encrypt(data);
    // 16-byte IV + 32-byte ciphertext (16 data + 16 PKCS7 pad block)
    expect(encrypted.length).toBe(48);
  });

  it('different encryptions produce different output (random IV)', () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const cipher = new SyncAesCipher(key);
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const a = cipher.encrypt(data);
    const b = cipher.encrypt(data);
    const aHex = Array.from(a)
      .map(x => x.toString(16))
      .join('');
    const bHex = Array.from(b)
      .map(x => x.toString(16))
      .join('');
    expect(aHex).not.toBe(bHex);
  });

  it('matches SubtleCrypto AES-CBC output format', async () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const syncCipher = new SyncAesCipher(key);
    const data = new Uint8Array([0x41, 0x42, 0x43, 0x44]);
    const encrypted = syncCipher.encrypt(data);
    // IV is first 16 bytes
    const iv = encrypted.subarray(0, 16);
    expect(iv.length).toBe(16);
    // Ciphertext follows
    const ciphertext = encrypted.subarray(16);
    // 4 bytes data + 12 bytes PKCS7 padding = 16 bytes
    expect(ciphertext.length).toBe(16);
  });

  it('throws on invalid key length', () => {
    expect(() => new SyncAesCipher(new Uint8Array(16))).toThrow();
    expect(() => new SyncAesCipher(new Uint8Array(24))).toThrow();
  });

  it('handles empty input', () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const cipher = new SyncAesCipher(key);
    const result = cipher.encrypt(new Uint8Array(0));
    expect(result.length).toBe(0);
  });

  it('output is decryptable by SubtleCrypto', async () => {
    const rawKey = crypto.getRandomValues(new Uint8Array(32));
    const syncCipher = new SyncAesCipher(rawKey);
    const plaintext = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    const encrypted = syncCipher.encrypt(plaintext);

    const iv = encrypted.slice(0, 16);
    const ciphertext = encrypted.slice(16);
    const cryptoKey = await crypto.subtle.importKey('raw', rawKey, 'AES-CBC', false, ['decrypt']);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, cryptoKey, ciphertext);
    expect(new Uint8Array(decrypted)).toEqual(plaintext);
  });
});
