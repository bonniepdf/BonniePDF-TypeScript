import * as PdfKeys from '../../Rendering/Pdf/PdfKeys';
import { PdfEncryptionKey } from './PdfEncryptionKey';
import { Aes256EncryptionKey } from './Aes256EncryptionKey';
import { AesCipher } from './AesCipher';
import { SyncAesCipher } from './SyncAesCipher';
import { RC4Cipher } from './RC4Cipher';
import { EncryptionSettings } from '../Models/EncryptionSettings';
import { EncryptionAlgorithm } from '../Models/EncryptionAlgorithm';

/**
 * Encrypts PDF strings and streams and builds the document encryption
 * dictionary. Supports RC4 (40/128-bit) and AES-256.
 *
 * Sync construction (`new PdfEncryptor(settings)`) fully initialises RC4
 * encryption. For AES-256, use `await PdfEncryptor.create(settings)` to get
 * correct key material; sync construction for AES-256 leaves the keys
 * uninitialised and is not safe to use.
 */
export class PdfEncryptor {
  private readonly key?: PdfEncryptionKey;
  private aesKey?: Aes256EncryptionKey;
  private readonly isAes256: boolean;
  public readonly settings: EncryptionSettings;

  /**
   * Sync constructor. Fully functional for RC4.
   * For AES-256 prefer `PdfEncryptor.create(settings)`.
   */
  constructor(settings: EncryptionSettings, documentId?: Uint8Array) {
    if (!settings) throw new Error('Encryption settings cannot be null');
    settings.validate();
    this.settings = settings;
    this.isAes256 = settings.algorithm === EncryptionAlgorithm.AES_256;

    if (!this.isAes256) {
      this.key = new PdfEncryptionKey(settings, documentId ?? PdfEncryptionKey.generateDocumentId());
    }
    // AES-256: aesKey intentionally null until create() is called
  }

  /**
   * Async factory - correctly initialises AES-256 key material via SubtleCrypto.
   * For RC4 this is equivalent to `new PdfEncryptor(settings, documentId)`.
   */
  public static async create(settings: EncryptionSettings, documentId?: Uint8Array): Promise<PdfEncryptor> {
    const encryptor = new PdfEncryptor(settings, documentId);
    if (encryptor.isAes256) {
      encryptor.aesKey = await Aes256EncryptionKey.create(settings);
    }
    return encryptor;
  }

  /** Gets the document ID used in encryption. */
  public get documentId(): Uint8Array {
    return this.isAes256 ? this.aesKey!.documentId : this.key!.documentId;
  }

  /**
   * Encrypts binary data for a specific PDF object - synchronous path.
   * RC4: uses per-object key derivation. AES-256: uses the file encryption key
   * with a pure-JS sync AES-CBC cipher (requires prior async init via create()).
   */
  public encryptData(data: Uint8Array, objectNumber: number, generationNumber = 0): Uint8Array {
    if (!data || data.length === 0) return data;

    if (this.isAes256) {
      if (!this.aesKey) throw new Error('PdfEncryptor: AES-256 key not initialised - use PdfEncryptor.create()');
      return new SyncAesCipher(this.aesKey.fileEncryptionKey).encrypt(data);
    }

    const objectKey = this.key!.getObjectKey(objectNumber, generationNumber);
    return RC4Cipher.forObject(objectKey).transformCopy(data);
  }

  /**
   * Encrypts binary data asynchronously - works for both RC4 and AES-256.
   */
  public async encryptDataAsync(data: Uint8Array, objectNumber: number, generationNumber = 0): Promise<Uint8Array> {
    if (!data || data.length === 0) return data;

    if (this.isAes256) {
      if (!this.aesKey) throw new Error('PdfEncryptor: AES-256 key not initialised - use PdfEncryptor.create()');
      const cipher = new AesCipher(this.aesKey.fileEncryptionKey);
      return cipher.encrypt(data);
    }

    const objectKey = this.key!.getObjectKey(objectNumber, generationNumber);
    return RC4Cipher.forObject(objectKey).transformCopy(data);
  }

  /**
   * Encrypts a string for a specific PDF object (sync RC4 path only).
   */
  public encryptString(text: string, objectNumber: number, generationNumber = 0): Uint8Array {
    if (!text) return new Uint8Array(0);
    // ISO-8859-1: each char maps to its code point
    const data = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) data[i] = text.charCodeAt(i) & 0xff;
    return this.encryptData(data, objectNumber, generationNumber);
  }

  /**
   * Encrypts data in-place - RC4 only. AES-256 changes the output length
   * (IV + padding), so in-place is not possible; use encryptData instead.
   */
  public encryptInPlace(data: Uint8Array, objectNumber: number, generationNumber = 0): void {
    if (!data || data.length === 0) return;
    if (this.isAes256) {
      throw new Error('PdfEncryptor: AES-256 in-place encryption not supported - use encryptData().');
    }
    const objectKey = this.key!.getObjectKey(objectNumber, generationNumber);
    RC4Cipher.forObject(objectKey).transform(data);
  }

  /**
   * Returns the /Encrypt dictionary entries for the PDF trailer.
   */
  public getEncryptDictionary(): Map<string, string> {
    return this.isAes256 ? this.getAes256EncryptDictionary() : this.getRc4EncryptDictionary();
  }

  private getRc4EncryptDictionary(): Map<string, string> {
    const dict = new Map<string, string>([
      [PdfKeys.Encryption.Handler, '/Standard'],
      [PdfKeys.Encryption.AlgorithmVersion, this.settings.versionValue.toString()],
      [PdfKeys.Encryption.HandlerRevision, this.settings.revisionValue.toString()],
      [PdfKeys.Encryption.OwnerEntry, PdfEncryptor.fmtHex(this.key!.ownerEntry)],
      [PdfKeys.Encryption.UserEntry, PdfEncryptor.fmtHex(this.key!.userEntry)],
      [PdfKeys.Encryption.Permissions, this.key!.permissionsValue.toString()],
    ]);
    if (this.settings.revisionValue >= 3)
      dict.set(PdfKeys.Encryption.KeyLength, this.settings.keyLengthBits.toString());
    return dict;
  }

  private getAes256EncryptDictionary(): Map<string, string> {
    if (!this.aesKey) throw new Error('PdfEncryptor: AES-256 key not initialised - use PdfEncryptor.create()');
    return new Map<string, string>([
      [PdfKeys.Encryption.Handler, '/Standard'],
      [PdfKeys.Encryption.AlgorithmVersion, '5'],
      [PdfKeys.Encryption.HandlerRevision, '6'],
      [PdfKeys.Encryption.KeyLength, '256'],
      [PdfKeys.Encryption.OwnerEntry, PdfEncryptor.fmtHex(this.aesKey.ownerEntry)],
      [PdfKeys.Encryption.UserEntry, PdfEncryptor.fmtHex(this.aesKey.userEntry)],
      [PdfKeys.Encryption.OwnerEncryptionEntry, PdfEncryptor.fmtHex(this.aesKey.ownerEncryptionEntry)],
      [PdfKeys.Encryption.UserEncryptionEntry, PdfEncryptor.fmtHex(this.aesKey.userEncryptionEntry)],
      [PdfKeys.Encryption.EncryptedPermissions, PdfEncryptor.fmtHex(this.aesKey.permsEntry)],
      [PdfKeys.Encryption.Permissions, this.aesKey.permissionsValue.toString()],
      [PdfKeys.Encryption.CryptFilters, '<< /StdCF << /CFM /AESV3 /AuthEvent /DocOpen /Length 32 >> >>'],
      [PdfKeys.Encryption.StreamFilter, '/StdCF'],
      [PdfKeys.Encryption.StringFilter, '/StdCF'],
      [PdfKeys.Encryption.EncryptMetadata, this.settings.encryptMetadata ? 'true' : 'false'],
    ]);
  }

  /** Returns the /ID array string for the PDF trailer. */
  public getIdArray(): string {
    const docId = this.isAes256 ? this.aesKey!.documentId : this.key!.documentId;
    const hex = PdfEncryptor.fmtHex(docId);
    return `[ ${hex} ${hex} ]`;
  }

  private static fmtHex(data: Uint8Array): string {
    if (!data || data.length === 0) return '<>';
    let s = '<';
    for (const b of data) s += b.toString(16).padStart(2, '0').toUpperCase();
    return s + '>';
  }
}
