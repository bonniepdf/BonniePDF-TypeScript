/** Provides the encryption algorithms supported by document security settings. */
export class EncryptionAlgorithm {
  /** RC4 with a 40-bit key. Weak; for compatibility with very old readers only. */
  static readonly RC4_40 = 'RC4_40' as const;
  /** RC4 with a 128-bit key. Weak; prefer AES-256. */
  static readonly RC4_128 = 'RC4_128' as const;
  /** AES with a 256-bit key. The recommended choice; it is asynchronous-only. */
  static readonly AES_256 = 'AES_256' as const;
}
