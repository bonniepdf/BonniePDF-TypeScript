import { AesCipher } from './aesCipher';
import { EncryptionSettings } from '../Models/EncryptionSettings';
import { PermissionEncoder } from '../Permissions/PermissionEncoder';

function asBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

/**
 * Generates encryption keys for PDF AES-256 encryption (V5, R6).
 * Implements the key derivation algorithm from PDF 2.0 / Extension Level 3.
 *
 * Construction is async because SHA-256 (SubtleCrypto) and AES-CBC (SubtleCrypto)
 * are strictly Promise-based in the Web Crypto API.
 * Use `Aes256EncryptionKey.create(settings)` instead of `new Aes256EncryptionKey(settings)`.
 */
export class Aes256EncryptionKey {
  /** The 32-byte file encryption key (randomly generated). */
  public fileEncryptionKey!: Uint8Array;
  /** /U entry: SHA-256(password + validation_salt) + validation_salt + key_salt (48 bytes). */
  public userEntry!: Uint8Array;
  /** /UE entry: AES-CBC encrypt of file key using SHA-256(password + key_salt) (32 bytes). */
  public userEncryptionEntry!: Uint8Array;
  /** /O entry: SHA-256(password + validation_salt + /U) + validation_salt + key_salt (48 bytes). */
  public ownerEntry!: Uint8Array;
  /** /OE entry: AES-CBC encrypt of file key using SHA-256(password + key_salt + /U) (32 bytes). */
  public ownerEncryptionEntry!: Uint8Array;
  /** /Perms entry: AES-ECB encrypt of permissions block using file key (16 bytes). */
  public permsEntry!: Uint8Array;
  /** 16-byte random document identifier. */
  public documentId!: Uint8Array;
  /** Encoded permissions value for the /P entry. */
  public permissionsValue!: number;

  // Private constructor - use the static async factory.
  private constructor() {}

  /**
   * Asynchronously creates and fully initialises an Aes256EncryptionKey.
   * All key derivation uses SubtleCrypto (SHA-256 + AES-CBC/ECB).
   */
  public static async create(settings: EncryptionSettings): Promise<Aes256EncryptionKey> {
    const instance = new Aes256EncryptionKey();

    instance.permissionsValue = PermissionEncoder.encode(settings.permissions);
    instance.fileEncryptionKey = crypto.getRandomValues(new Uint8Array(32));
    instance.documentId = crypto.getRandomValues(new Uint8Array(16));

    await instance.computeUserEntries(settings.userPassword ?? '');
    await instance.computeOwnerEntries(settings.ownerPassword ?? '');
    await instance.computePermsEntry();

    return instance;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async computeUserEntries(password: string): Promise<void> {
    const passwordBytes = Aes256EncryptionKey.truncatePassword(password);
    const validationSalt = crypto.getRandomValues(new Uint8Array(8));
    const keySalt = crypto.getRandomValues(new Uint8Array(8));

    // /U = Algorithm2B(password, validation_salt, "") + validation_salt + key_salt
    const hash = await algorithm2B(passwordBytes, validationSalt, new Uint8Array(0));
    this.userEntry = new Uint8Array(48);
    this.userEntry.set(hash, 0);
    this.userEntry.set(validationSalt, 32);
    this.userEntry.set(keySalt, 40);

    // /UE = AES-CBC(no-padding) encrypt of file key using Algorithm2B(password, key_salt, ""), IV=0
    const ueKey = await algorithm2B(passwordBytes, keySalt, new Uint8Array(0));
    const cipher = new AesCipher(ueKey);
    this.userEncryptionEntry = await cipher.encryptNoPadding(this.fileEncryptionKey, new Uint8Array(16));
  }

  private async computeOwnerEntries(password: string): Promise<void> {
    const passwordBytes = Aes256EncryptionKey.truncatePassword(password);
    const validationSalt = crypto.getRandomValues(new Uint8Array(8));
    const keySalt = crypto.getRandomValues(new Uint8Array(8));

    // /O = Algorithm2B(password, validation_salt, /U) + validation_salt + key_salt
    const hash = await algorithm2B(passwordBytes, validationSalt, this.userEntry);
    this.ownerEntry = new Uint8Array(48);
    this.ownerEntry.set(hash, 0);
    this.ownerEntry.set(validationSalt, 32);
    this.ownerEntry.set(keySalt, 40);

    // /OE = AES-CBC(no-padding) encrypt of file key using Algorithm2B(password, key_salt, /U), IV=0
    const oeKey = await algorithm2B(passwordBytes, keySalt, this.userEntry);
    const cipher = new AesCipher(oeKey);
    this.ownerEncryptionEntry = await cipher.encryptNoPadding(this.fileEncryptionKey, new Uint8Array(16));
  }

  private async computePermsEntry(): Promise<void> {
    const permsBlock = new Uint8Array(16);
    // Bytes 0-3: permissions (little-endian)
    permsBlock[0] = this.permissionsValue & 0xff;
    permsBlock[1] = (this.permissionsValue >> 8) & 0xff;
    permsBlock[2] = (this.permissionsValue >> 16) & 0xff;
    permsBlock[3] = (this.permissionsValue >> 24) & 0xff;
    // Bytes 4-7: 0xFFFFFFFF
    permsBlock[4] = permsBlock[5] = permsBlock[6] = permsBlock[7] = 0xff;
    // Byte 8: 'T' (always encrypt metadata)
    permsBlock[8] = 0x54;
    // Bytes 9-11: 'adb'
    permsBlock[9] = 0x61;
    permsBlock[10] = 0x64;
    permsBlock[11] = 0x62;
    // Bytes 12-15: random
    permsBlock.set(crypto.getRandomValues(new Uint8Array(4)), 12);

    const cipher = new AesCipher(this.fileEncryptionKey);
    this.permsEntry = await cipher.encryptEcb(permsBlock);
  }

  private static truncatePassword(password: string): Uint8Array {
    if (!password) return new Uint8Array(0);
    const bytes = new TextEncoder().encode(password);
    return bytes.length > 127 ? bytes.slice(0, 127) : bytes;
  }

  /** Generates a random 16-byte document ID. */
  public static generateDocumentId(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }
}

/**
 * Algorithm 2.B from ISO 32000-2:2020 §7.6.4.3.4.
 * Iterative hash used by R=6 for password validation and key derivation.
 * Uses SHA-256, SHA-384, or SHA-512 depending on the round, with AES-CBC
 * encryption mixed in. Runs at least 64 rounds.
 */
async function algorithm2B(password: Uint8Array, salt: Uint8Array, userKey: Uint8Array): Promise<Uint8Array> {
  let K = new Uint8Array(await crypto.subtle.digest('SHA-256', asBuffer(concat(password, salt, userKey))));

  let round = 0;
  while (true) {
    // K1 = (password + K + userKey) repeated 64 times
    const sequence = concat(password, K, userKey);
    const K1 = new Uint8Array(sequence.length * 64);
    for (let i = 0; i < 64; i++) K1.set(sequence, i * sequence.length);

    // E = AES-128-CBC encrypt K1 (no padding) using first 16 bytes of K as key, next 16 as IV.
    // SubtleCrypto always appends a PKCS7 padding block; discard it.
    const cbcKey = asBuffer(K.slice(0, 16));
    const cbcIv = asBuffer(K.slice(16, 32));
    const aesKey = await crypto.subtle.importKey('raw', cbcKey, 'AES-CBC', false, ['encrypt']);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: cbcIv }, aesKey, asBuffer(K1));
    const E = new Uint8Array(encrypted, 0, K1.length);

    // Sum the first 16 bytes of E modulo 3 to pick the hash algorithm
    let sum = 0;
    for (let i = 0; i < 16; i++) sum += E[i];
    const mod3 = sum % 3;

    const hashName = mod3 === 0 ? 'SHA-256' : mod3 === 1 ? 'SHA-384' : 'SHA-512';
    K = new Uint8Array(await crypto.subtle.digest(hashName, asBuffer(E)));

    if (round >= 63 && E[E.length - 1] <= round - 32) break;
    round++;
  }

  return K.slice(0, 32);
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((n, a) => n + (a?.length ?? 0), 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) {
    if (a?.length) {
      result.set(a, offset);
      offset += a.length;
    }
  }
  return result;
}
