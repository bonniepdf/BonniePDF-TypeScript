import { Md5Hash } from './md5';
import { RC4Cipher } from './rc4Cipher';
import { EncryptionSettings } from '../Models/EncryptionSettings';
import { PermissionEncoder } from '../Permissions/PermissionEncoder';

/**
 * Generates encryption keys for PDF documents following PDF Reference 1.4.
 * Implements Algorithms 3.2, 3.3, 3.4, 3.5 from the PDF specification.
 */
export class PdfEncryptionKey {
  /**
   * Standard 32-byte padding string used in PDF encryption (from PDF spec).
   */
  private static readonly PADDING_BYTES: Uint8Array = new Uint8Array([
    0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41,
    0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
    0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80,
    0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A
  ]);

  private readonly keyLength: number;
  private readonly revision: number;

  /**
   * The master encryption key derived from passwords.
   */
  public readonly encryptionKey: Uint8Array;

  /**
   * The /O entry for the encryption dictionary (owner password hash).
   */
  public readonly ownerEntry: Uint8Array;

  /**
   * The /U entry for the encryption dictionary (user password hash).
   */
  public readonly userEntry: Uint8Array;

  /**
   * The encoded permissions value for the /P entry.
   */
  public readonly permissionsValue: number;

  /**
   * The document ID used in encryption.
   */
  public readonly documentId: Uint8Array;

  /**
   * Creates encryption keys for a PDF document.
   * @param settings The encryption settings
   * @param documentId The document ID (first element of /ID array)
   */
  constructor(settings: EncryptionSettings, documentId: Uint8Array) {
    if (!documentId || documentId.length === 0) {
      throw new Error('Document ID is required for encryption');
    }

    this.keyLength = settings.keyLengthBytes;
    this.revision = settings.revisionValue;
    this.documentId = documentId;
    this.permissionsValue = PermissionEncoder.encode(settings.permissions);

    // Step 1: Compute the O entry (Algorithm 3.3)
    this.ownerEntry = this.computeOwnerEntry(settings.ownerPassword ?? '', settings.userPassword ?? '');

    // Step 2: Compute the encryption key (Algorithm 3.2)
    this.encryptionKey = this.computeEncryptionKey(
      settings.userPassword ?? '',
      this.ownerEntry,
      this.permissionsValue,
      documentId,
      settings.encryptMetadata
    );

    // Step 3: Compute the U entry (Algorithm 3.4 or 3.5)
    this.userEntry = this.computeUserEntry(this.encryptionKey, documentId);
  }

  /**
   * Pads or truncates a password to 32 bytes using the standard padding.
   */
  private static padPassword(password: string): Uint8Array {
    const padded = new Uint8Array(32);

    if (!password) {
      // Use only padding bytes
      padded.set(PdfEncryptionKey.PADDING_BYTES, 0);
    } else {
      // Convert password to bytes (PDF uses Latin-1 encoding)
      const passwordBytes = new TextEncoder().encode(password);
      const length = Math.min(passwordBytes.length, 32);

      padded.set(passwordBytes.subarray(0, length), 0);

      // Fill remainder with padding
      if (length < 32) {
        padded.set(PdfEncryptionKey.PADDING_BYTES.subarray(0, 32 - length), length);
      }
    }

    return padded;
  }

  /**
   * Algorithm 3.3: Computing the O (owner) entry.
   */
  private computeOwnerEntry(ownerPassword: string, userPassword: string): Uint8Array {
    // Step a: Pad or truncate owner password
    const ownerPadded = PdfEncryptionKey.padPassword(ownerPassword);

    // Step b: Hash the padded owner password
    let hash = Md5Hash.compute(ownerPadded);

    // Step c: For revision 3+, iterate the hash 50 times
    if (this.revision >= 3) {
      for (let i = 0; i < 50; i++) {
        hash = Md5Hash.computeRange(hash, 0, this.keyLength);
      }
    }

    // Step d: Create RC4 key from first n bytes
    const rc4Key = hash.slice(0, this.keyLength);

    // Step e: Pad the user password
    const userPadded = PdfEncryptionKey.padPassword(userPassword);

    // Step f: Encrypt the padded user password
    const result = new Uint8Array(userPadded);
    const cipher = new RC4Cipher(rc4Key);
    cipher.transform(result);

    // Step g: For revision 3+, do 19 additional encryption rounds
    if (this.revision >= 3) {
      for (let i = 1; i <= 19; i++) {
        const newKey = new Uint8Array(this.keyLength);
        for (let j = 0; j < this.keyLength; j++) {
          newKey[j] = rc4Key[j] ^ i;
        }
        const iterCipher = new RC4Cipher(newKey);
        iterCipher.transform(result);
      }
    }

    return result;
  }

  /**
   * Algorithm 3.2: Computing the encryption key.
   */
  private computeEncryptionKey(
    userPassword: string,
    oEntry: Uint8Array,
    permissions: number,
    documentId: Uint8Array,
    encryptMetadata: boolean
  ): Uint8Array {
    // Step a: Pad the user password
    const userPadded = PdfEncryptionKey.padPassword(userPassword);

    // Step b: Concatenate: password + O + P + ID + (metadata flag)
    const permBytes = new Uint8Array(4);
    permBytes[0] = permissions & 0xFF;
    permBytes[1] = (permissions >> 8) & 0xFF;
    permBytes[2] = (permissions >> 16) & 0xFF;
    permBytes[3] = (permissions >> 24) & 0xFF;

    let toHash: Uint8Array;
    if (this.revision >= 3 && !encryptMetadata) {
      // Add 0xFFFFFFFF if not encrypting metadata
      const noEncryptFlag = new Uint8Array([0xFF, 0xFF, 0xFF, 0xFF]);
      toHash = PdfEncryptionKey.concatenate(userPadded, oEntry, permBytes, documentId, noEncryptFlag);
    } else {
      toHash = PdfEncryptionKey.concatenate(userPadded, oEntry, permBytes, documentId);
    }

    // Step c: Hash the concatenated data
    let hash = Md5Hash.compute(toHash);

    // Step d: For revision 3+, iterate the hash 50 times
    if (this.revision >= 3) {
      for (let i = 0; i < 50; i++) {
        const keyPortion = hash.slice(0, this.keyLength);
        hash = Md5Hash.compute(keyPortion);
      }
    }

    // Step e: Return first n bytes as the key
    return hash.slice(0, this.keyLength);
  }

  /**
   * Computes the U entry using Algorithm 3.4 (revision 2) or 3.5 (revision 3+).
   */
  private computeUserEntry(encryptionKey: Uint8Array, documentId: Uint8Array): Uint8Array {
    if (this.revision === 2) {
      // Algorithm 3.4: Simple RC4 encryption of padding
      const result = new Uint8Array(PdfEncryptionKey.PADDING_BYTES);
      const cipher = new RC4Cipher(encryptionKey);
      cipher.transform(result);
      return result;
    } else {
      // Algorithm 3.5: More complex for revision 3+
      // Step a: Create hash of padding + document ID
      const toHash = PdfEncryptionKey.concatenate(PdfEncryptionKey.PADDING_BYTES, documentId);
      let hash = Md5Hash.compute(toHash);

      // Step b: Encrypt with RC4
      const cipher = new RC4Cipher(encryptionKey);
      cipher.transform(hash);

      // Step c: Do 19 more rounds with XOR'd keys
      for (let i = 1; i <= 19; i++) {
        const newKey = new Uint8Array(this.keyLength);
        for (let j = 0; j < this.keyLength; j++) {
          newKey[j] = encryptionKey[j] ^ i;
        }
        const iterCipher = new RC4Cipher(newKey);
        iterCipher.transform(hash);
      }

      // Step d: Append 16 arbitrary bytes to make 32-byte result
      const result = new Uint8Array(32);
      result.set(hash.subarray(0, 16), 0);
      // Fill remaining with zeros (or any value)
      return result;
    }
  }

  /**
   * Computes the per-object encryption key for a specific object.
   * @param objectNumber The PDF object number
   * @param generationNumber The PDF generation number (usually 0)
   * @returns The object-specific encryption key
   */
  public getObjectKey(objectNumber: number, generationNumber = 0): Uint8Array {
    // Concatenate: encryption key + object number (3 bytes LE) + generation (2 bytes LE)
    const data = new Uint8Array(this.keyLength + 5);
    data.set(this.encryptionKey, 0);

    data[this.keyLength] = objectNumber & 0xFF;
    data[this.keyLength + 1] = (objectNumber >> 8) & 0xFF;
    data[this.keyLength + 2] = (objectNumber >> 16) & 0xFF;
    data[this.keyLength + 3] = generationNumber & 0xFF;
    data[this.keyLength + 4] = (generationNumber >> 8) & 0xFF;

    // Hash and use first n+5 bytes (max 16)
    const hash = Md5Hash.compute(data);
    const keyLen = Math.min(this.keyLength + 5, 16);
    return hash.slice(0, keyLen);
  }

  /**
   * Concatenates multiple byte arrays.
   */
  private static concatenate(...arrays: Uint8Array[]): Uint8Array {
    const totalLength = arrays.reduce((sum, arr) => sum + (arr?.length || 0), 0);
    const result = new Uint8Array(totalLength);
    
    let offset = 0;
    for (const arr of arrays) {
      if (arr && arr.length > 0) {
        result.set(arr, offset);
        offset += arr.length;
      }
    }

    return result;
  }

  /**
   * Generates a random document ID.
   */
  public static generateDocumentId(): Uint8Array {
    // Use Web Crypto if available, otherwise fallback to Math.random
    if (typeof globalThis !== 'undefined' && (globalThis as any).crypto && (globalThis as any).crypto.getRandomValues) {
      return (globalThis as any).crypto.getRandomValues(new Uint8Array(16));
    }

    // Fallback for environments without crypto
    const id = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      id[i] = Math.floor(Math.random() * 256);
    }
    return id;
  }
}
