/**
 * Pure-JS synchronous AES-CBC cipher with PKCS7 padding.
 *
 * SubtleCrypto is async-only, but the PDF serializer pipeline is synchronous.
 * Key derivation uses SubtleCrypto (async, in PdfEncryptor.create()), but once
 * the 32-byte file encryption key is ready, per-object stream/string encryption
 * uses this class synchronously - matching the .NET System.Security.Cryptography.Aes
 * behaviour.
 *
 * Implements AES-256 only (14 rounds). Not a general-purpose crypto library.
 */

// AES S-box
const SBOX = new Uint8Array([
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9,
  0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f,
  0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07,
  0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3,
  0x29, 0xe3, 0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58,
  0xcf, 0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3,
  0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c, 0x13, 0xec, 0x5f,
  0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73, 0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88,
  0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac,
  0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a,
  0xae, 0x08, 0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a, 0x70,
  0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11,
  0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42,
  0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
]);

// Round constants
const RCON = new Uint8Array([0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d]);

// GF(2^8) multiplication helpers for MixColumns
function gmul2(a: number): number {
  return ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff;
}
function gmul3(a: number): number {
  return gmul2(a) ^ a;
}

function keyExpansion256(key: Uint8Array): Uint32Array {
  const Nk = 8; // 256-bit key = 8 words
  const Nr = 14; // 14 rounds
  const words = (Nr + 1) * 4; // 60 words
  const w = new Uint32Array(words);

  for (let i = 0; i < Nk; i++) {
    w[i] = (key[4 * i] << 24) | (key[4 * i + 1] << 16) | (key[4 * i + 2] << 8) | key[4 * i + 3];
  }

  for (let i = Nk; i < words; i++) {
    let temp = w[i - 1];
    if (i % Nk === 0) {
      // RotWord + SubWord + Rcon
      temp =
        ((SBOX[(temp >>> 16) & 0xff] << 24) |
          (SBOX[(temp >>> 8) & 0xff] << 16) |
          (SBOX[temp & 0xff] << 8) |
          SBOX[(temp >>> 24) & 0xff]) ^
        (RCON[i / Nk - 1] << 24);
    } else if (i % Nk === 4) {
      // SubWord only (AES-256 specific)
      temp =
        (SBOX[(temp >>> 24) & 0xff] << 24) |
        (SBOX[(temp >>> 16) & 0xff] << 16) |
        (SBOX[(temp >>> 8) & 0xff] << 8) |
        SBOX[temp & 0xff];
    }
    w[i] = w[i - Nk] ^ temp;
  }
  return w;
}

function aesEncryptBlock(block: Uint8Array, expandedKey: Uint32Array): Uint8Array {
  const Nr = 14;
  // State is column-major: state[col][row]
  const s = new Uint8Array(16);
  for (let i = 0; i < 16; i++) s[i] = block[i];

  // AddRoundKey - round 0
  addRoundKey(s, expandedKey, 0);

  for (let round = 1; round < Nr; round++) {
    subBytes(s);
    shiftRows(s);
    mixColumns(s);
    addRoundKey(s, expandedKey, round);
  }

  // Final round (no MixColumns)
  subBytes(s);
  shiftRows(s);
  addRoundKey(s, expandedKey, Nr);

  return s;
}

function addRoundKey(state: Uint8Array, w: Uint32Array, round: number): void {
  for (let c = 0; c < 4; c++) {
    const word = w[round * 4 + c];
    state[c * 4] ^= (word >>> 24) & 0xff;
    state[c * 4 + 1] ^= (word >>> 16) & 0xff;
    state[c * 4 + 2] ^= (word >>> 8) & 0xff;
    state[c * 4 + 3] ^= word & 0xff;
  }
}

function subBytes(state: Uint8Array): void {
  for (let i = 0; i < 16; i++) state[i] = SBOX[state[i]];
}

function shiftRows(state: Uint8Array): void {
  // Row 0: no shift
  // Row 1: shift left 1 (in column-major: indices 1,5,9,13)
  let t = state[1];
  state[1] = state[5];
  state[5] = state[9];
  state[9] = state[13];
  state[13] = t;
  // Row 2: shift left 2 (indices 2,6,10,14)
  t = state[2];
  state[2] = state[10];
  state[10] = t;
  t = state[6];
  state[6] = state[14];
  state[14] = t;
  // Row 3: shift left 3 = shift right 1 (indices 3,7,11,15)
  t = state[15];
  state[15] = state[11];
  state[11] = state[7];
  state[7] = state[3];
  state[3] = t;
}

function mixColumns(state: Uint8Array): void {
  for (let c = 0; c < 4; c++) {
    const i = c * 4;
    const a0 = state[i],
      a1 = state[i + 1],
      a2 = state[i + 2],
      a3 = state[i + 3];
    state[i] = gmul2(a0) ^ gmul3(a1) ^ a2 ^ a3;
    state[i + 1] = a0 ^ gmul2(a1) ^ gmul3(a2) ^ a3;
    state[i + 2] = a0 ^ a1 ^ gmul2(a2) ^ gmul3(a3);
    state[i + 3] = gmul3(a0) ^ a1 ^ a2 ^ gmul2(a3);
  }
}

export class SyncAesCipher {
  private readonly expandedKey: Uint32Array;

  constructor(key: Uint8Array) {
    if (!key || key.length !== 32) throw new Error('SyncAesCipher: requires a 32-byte key');
    this.expandedKey = keyExpansion256(key);
  }

  /**
   * AES-256-CBC encrypt with random IV and PKCS7 padding.
   * Returns IV (16 bytes) ‖ ciphertext - same format as the async AesCipher.
   */
  encrypt(data: Uint8Array): Uint8Array {
    if (!data || data.length === 0) return data ?? new Uint8Array(0);

    const iv = crypto.getRandomValues(new Uint8Array(16));
    const padded = pkcs7Pad(data);
    const numBlocks = padded.length / 16;
    const ciphertext = new Uint8Array(padded.length);

    let prev: Uint8Array<ArrayBufferLike> = iv;
    for (let b = 0; b < numBlocks; b++) {
      const plainBlock = padded.subarray(b * 16, b * 16 + 16);
      const xored = new Uint8Array(16);
      for (let i = 0; i < 16; i++) xored[i] = plainBlock[i] ^ prev[i];
      const encrypted = aesEncryptBlock(xored, this.expandedKey);
      ciphertext.set(encrypted, b * 16);
      prev = encrypted;
    }

    const result = new Uint8Array(16 + ciphertext.length);
    result.set(iv, 0);
    result.set(ciphertext, 16);
    return result;
  }
}

function pkcs7Pad(data: Uint8Array): Uint8Array {
  const padLen = 16 - (data.length % 16);
  const padded = new Uint8Array(data.length + padLen);
  padded.set(data);
  for (let i = data.length; i < padded.length; i++) padded[i] = padLen;
  return padded;
}
