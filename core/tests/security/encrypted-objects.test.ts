import { readFileSync } from 'node:fs';
import { createDecipheriv } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { encryptPdfStrings } from '../../src/Rendering/Pdf/PdfStringEncryption';
import { PdfWriter } from '../../src/Rendering/Writers/PdfWriter';
import { AsyncPdfWriter } from '../../src/Rendering/Writers/AsyncPdfWriter';
import { MetadataWriter } from '../../src/Rendering/Writers/MetadataWriter';
import { PdfEncryptor } from '../../src/Security/Encryption/pdfEncryptor';
import { Aes256EncryptionKey } from '../../src/Security/Encryption/aes256EncryptionKey';
import { EncryptionSettings } from '../../src/Security/Models/EncryptionSettings';
import { EncryptionAlgorithm } from '../../src/Security/Models/EncryptionAlgorithm';
import { DocumentMetadata } from '../../src/Configuration/DocumentMetadata';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';

const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString('hex').toUpperCase();
describe('Encrypted PDF objects', () => {
  it('decodes string tokens using shared vectors', () => {
    const fixture = JSON.parse(readFileSync(new URL('./fixtures/string-tokens.json', import.meta.url), 'utf8'));
    for (const item of fixture.cases) {
      const decoded: string[] = [];
      expect(
        encryptPdfStrings(item.fragment, bytes => {
          decoded.push(hex(bytes));
          return bytes;
        })
      ).toBe(item.expected);
      expect(decoded).toEqual(item.decodedHex);
    }
    for (const fragment of fixture.invalid) expect(() => encryptPdfStrings(fragment, bytes => bytes)).toThrow();
  });

  it.each([false, true])('encrypts nested strings with their object key (async=%s)', async asynchronous => {
    const settings = new EncryptionSettings();
    settings.userPassword = 'reader';
    settings.ownerPassword = 'owner';
    const encryptor = new PdfEncryptor(settings, new Uint8Array(16));
    const dict = new Map([
      ['/Lang', '(en-GB)'],
      ['/Action', '<< /URI (https://example.com) >>'],
    ]);
    let bytes: Uint8Array;
    if (asynchronous) {
      const writer = new AsyncPdfWriter();
      writer.encryptor = encryptor;
      await writer.writeEncryptDictionaryAsync(writer.getNewId());
      await writer.writeObjectAsync(writer.getNewId(), dict);
      await writer.writeRawObjectAsync(writer.getNewId(), '[<FEFF03A9> (title)]');
      await writer.writeBinaryObjectAsync(writer.getNewId(), dict, new Uint8Array([1, 2]));
      bytes = writer.toUint8Array();
    } else {
      const writer = new PdfWriter();
      writer.encryptor = encryptor;
      writer.writeEncryptDictionary(writer.getNewId());
      writer.writeObject(writer.getNewId(), dict);
      writer.writeRawObject(writer.getNewId(), '[<FEFF03A9> (title)]');
      writer.writeBinaryObject(writer.getNewId(), dict, new Uint8Array([1, 2]));
      bytes = writer.toUint8Array();
    }
    const pdf = Buffer.from(bytes).toString('latin1');
    expect(pdf).toContain(encryptor.getEncryptDictionary().get('/O'));
    for (const id of [2, 4]) {
      expect(pdf).toContain('/Lang <' + hex(encryptor.encryptData(Buffer.from('en-GB'), id)) + '>');
      expect(pdf).toContain('/URI <' + hex(encryptor.encryptData(Buffer.from('https://example.com'), id)) + '>');
    }
    expect(pdf).toContain('<' + hex(encryptor.encryptData(Buffer.from('FEFF03A9', 'hex'), 3)) + '>');
    expect(pdf).not.toContain('(title)');
  });

  it.each([
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ])('XMP matches the AES metadata flag (%s, async=%s)', async (encryptMetadata, asynchronous) => {
    const settings = new EncryptionSettings();
    settings.algorithm = EncryptionAlgorithm.AES_256;
    settings.userPassword = 'reader';
    settings.ownerPassword = 'owner';
    settings.encryptMetadata = encryptMetadata;
    const encryptor = await PdfEncryptor.create(settings);
    expect(encryptor.getEncryptDictionary().get('/EncryptMetadata')).toBe(String(encryptMetadata));
    const key = await Aes256EncryptionKey.create(settings);
    const cipher = createDecipheriv('aes-256-ecb', key.fileEncryptionKey, null);
    cipher.setAutoPadding(false);
    const permissions = Buffer.concat([cipher.update(key.permsEntry), cipher.final()]);
    expect(permissions[8]).toBe(encryptMetadata ? 0x54 : 0x46);
    const metadata = new DocumentMetadata();
    metadata.title = 'Metadata Ω';
    const documentSettings = new DocumentSettings();
    documentSettings.accessibility = AccessibilityMode.PdfUa1;
    let bytes: Uint8Array;
    if (asynchronous) {
      const writer = new AsyncPdfWriter();
      writer.encryptor = encryptor;
      await new MetadataWriter(writer.syncWriter, writer).writeXmpMetadataAsync(
        writer.getNewId(),
        metadata,
        documentSettings
      );
      bytes = writer.toUint8Array();
    } else {
      const writer = new PdfWriter();
      writer.encryptor = encryptor;
      new MetadataWriter(writer).writeXmpMetadata(writer.getNewId(), metadata, documentSettings);
      bytes = writer.toUint8Array();
    }
    const pdf = Buffer.from(bytes).toString('utf8');
    expect(pdf.includes('Metadata Ω')).toBe(!encryptMetadata);
    expect(pdf.includes('<?xpacket')).toBe(!encryptMetadata);
  });

  it('legacy RC4 ignores the metadata flag for key derivation', () => {
    const settings = new EncryptionSettings();
    settings.userPassword = 'reader';
    settings.ownerPassword = 'owner';
    const id = new Uint8Array(16),
      bytes = new Uint8Array([1, 2, 3]);
    const expected = new PdfEncryptor(settings, id).encryptData(bytes, 1);
    settings.encryptMetadata = false;
    expect(new PdfEncryptor(settings, id).encryptData(bytes, 1)).toEqual(expected);
  });
});
