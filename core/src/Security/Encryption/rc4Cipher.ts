/**
 * RC4 stream cipher implementation for PDF encryption.
 * RC4 is a symmetric stream cipher used in PDF 1.4 encryption.
 */
export class RC4Cipher {
  private readonly state: Uint8Array;
  private i = 0;
  private j = 0;

  /**
   * Creates a new RC4 cipher with the specified key.
   * @param key The encryption key (5-16 bytes)
   */
  constructor(key: Uint8Array) {
    if (!key || key.length === 0) {
      throw new Error('Key cannot be null or empty');
    }

    this.state = new Uint8Array(256);

    // Key Scheduling Algorithm (KSA)
    this.initialize(key);
  }

  /**
   * Key Scheduling Algorithm - initializes the permutation state.
   */
  private initialize(key: Uint8Array): void {
    // Initialize state array with identity permutation
    for (let i = 0; i < 256; i++) {
      this.state[i] = i;
    }

    // Key scheduling
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.state[i] + key[i % key.length]) & 0xFF;
      this.swap(i, j);
    }
  }

  /**
   * Swaps two elements in the state array.
   */
  private swap(i: number, j: number): void {
    const temp = this.state[i];
    this.state[i] = this.state[j];
    this.state[j] = temp;
  }

  /**
   * Generates the next byte in the keystream.
   * Pseudo-Random Generation Algorithm (PRGA).
   */
  private nextByte(): number {
    this.i = (this.i + 1) & 0xFF;
    this.j = (this.j + this.state[this.i]) & 0xFF;
    this.swap(this.i, this.j);
    return this.state[(this.state[this.i] + this.state[this.j]) & 0xFF];
  }

  /**
   * Encrypts or decrypts data in place.
   * RC4 encryption and decryption are the same operation (XOR with keystream).
   * @param data The data to transform
   */
  public transform(data: Uint8Array): void {
    if (!data) return;

    for (let k = 0; k < data.length; k++) {
      data[k] ^= this.nextByte();
    }
  }

  /**
   * Encrypts or decrypts data and returns a new array.
   * @param data The data to transform
   * @returns Transformed data
   */
  public transformCopy(data: Uint8Array): Uint8Array {
    if (!data) return new Uint8Array(0);

    const result = new Uint8Array(data);
    this.transform(result);
    return result;
  }

  /**
   * Encrypts or decrypts a portion of data.
   * @param data The data buffer
   * @param offset Starting offset
   * @param length Number of bytes to transform
   */
  public transformRange(data: Uint8Array, offset: number, length: number): void {
    if (!data) return;

    for (let k = 0; k < length; k++) {
      data[offset + k] ^= this.nextByte();
    }
  }

  /**
   * Creates a fresh RC4 cipher for the given object key.
   * Used for per-object encryption in PDF.
   * @param key The object-specific encryption key
   * @returns A new RC4 cipher instance
   */
  public static forObject(key: Uint8Array): RC4Cipher {
    return new RC4Cipher(key);
  }
}
