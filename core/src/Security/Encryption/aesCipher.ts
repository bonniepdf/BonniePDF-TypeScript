/**
 * AES-CBC/ECB encryption for PDF AES-256 encryption (V5, R6).
 * Uses the Web Crypto API (SubtleCrypto) — works in browser and Node.js 19+.
 * All methods are async because SubtleCrypto is strictly Promise-based.
 */

/** Extracts an `ArrayBuffer` slice exactly matching the Uint8Array's view. */
function asBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((t, a) => t + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

export class AesCipher {
  private readonly key: Uint8Array;

  constructor(key: Uint8Array) {
    if (!key || key.length === 0) throw new Error('AesCipher: key cannot be null or empty');
    this.key = new Uint8Array(key); // fresh copy — always plain ArrayBuffer-backed
  }

  /**
   * AES-CBC encrypt with a randomly generated IV and PKCS7 padding.
   * Returns IV (16 bytes) + ciphertext — matches the C# AesCipher.Encrypt output format.
   */
  async encrypt(data: Uint8Array): Promise<Uint8Array> {
    if (!data || data.length === 0) return data ?? new Uint8Array(0);
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const cryptoKey = await crypto.subtle.importKey('raw', asBuffer(this.key), 'AES-CBC', false, ['encrypt']);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: asBuffer(iv) }, cryptoKey, asBuffer(data)
    );
    return concatBytes(iv, new Uint8Array(ciphertext));
  }

  /**
   * AES-CBC encrypt with a caller-supplied IV and no PKCS7 padding.
   * SubtleCrypto always appends a PKCS7 padding block; we discard it by
   * taking only the first `data.length` bytes of the output.
   * Used for key wrapping (/UE, /OE entries) where the IV is the zero vector.
   */
  async encryptNoPadding(data: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey('raw', asBuffer(this.key), 'AES-CBC', false, ['encrypt']);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv: asBuffer(iv) }, cryptoKey, asBuffer(data)
    );
    // Drop the trailing PKCS7 padding block; keep only the real ciphertext
    return new Uint8Array(encrypted, 0, data.length);
  }

  /**
   * AES-ECB encrypt (simulated via AES-CBC with a zero IV, one 16-byte block at a time).
   * SubtleCrypto does not support ECB natively. AES-CBC on a single block with an all-zero
   * IV produces an output whose first 16 bytes are identical to AES-ECB of that block.
   * Used for the /Perms entry in the AES-256 encryption dictionary.
   */
  async encryptEcb(data: Uint8Array): Promise<Uint8Array> {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i += 16) {
      const block = new Uint8Array(data.buffer.slice(
        data.byteOffset + i, data.byteOffset + i + 16
      ) as ArrayBuffer);
      const zeroIv = new Uint8Array(16);
      const cryptoKey = await crypto.subtle.importKey('raw', asBuffer(this.key), 'AES-CBC', false, ['encrypt']);
      // CBC on one block with zero IV: encrypted[0..15] == ECB(block)
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv: asBuffer(zeroIv) }, cryptoKey, asBuffer(block)
      );
      result.set(new Uint8Array(encrypted, 0, 16), i);
    }
    return result;
  }

  static forObject(key: Uint8Array): AesCipher {
    return new AesCipher(key);
  }
}
