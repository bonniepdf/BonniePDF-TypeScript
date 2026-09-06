/** Describes a QR Code encoding mode and its version-dependent character-count width. */
export class Mode {
  public static readonly Numeric = new Mode(0x1, [10, 12, 14]);
  public static readonly Alphanumeric = new Mode(0x2, [9, 11, 13]);
  public static readonly Byte = new Mode(0x4, [8, 16, 16]);
  public static readonly Kanji = new Mode(0x8, [8, 10, 12]);
  public static readonly Eci = new Mode(0x7, [0, 0, 0]);

  private constructor(
    public readonly modeBits: number,
    private readonly numBitsCharCount: number[]
  ) {}

  public numCharCountBits(ver: number): number {
    return this.numBitsCharCount[Math.floor((ver + 7) / 17)];
  }
}
/**
 * A segment of character/binary/control data in a QR Code symbol.
 * Each segment has an encoding mode and a sequence of data bits.
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/qr-code-generator-library
 * Ported to TypeScript for BonniePDF.
 */
export class QrSegment {
  /** The encoding mode of this segment */
  public segmentMode: Mode;

  /** The number of characters in the original data (not bits) */
  public numChars: number;

  private readonly data: boolean[];

  constructor(mode: Mode, numChars: number, data: boolean[]) {
    this.segmentMode = mode;
    this.numChars = numChars;
    this.data = data;
  }

  /** Gets the data bits for this segment */
  public getData(): boolean[] {
    return this.data;
  }

  // ---- Static factory methods ----

  /**
   * Creates an optimal list of segments to represent the given Unicode text string.
   */
  public static makeSegments(text: string): QrSegment[] {
    const result: QrSegment[] = [];
    if (!text) return result;

    if (/^\d*$/.test(text)) {
      result.push(this.makeNumeric(text));
    } else if (/^[0-9A-Z $%*+./:-]*$/.test(text)) {
      // Case-sensitive on purpose: QR alphanumeric mode has no lowercase. A
      // string with lowercase must fall through to byte mode (below) so its
      // case is preserved, rather than being silently upper-cased.
      result.push(this.makeAlphanumeric(text));
    } else {
      const encoder = new TextEncoder();
      result.push(this.makeBytes(encoder.encode(text)));
    }

    return result;
  }

  /**
   * Creates a segment encoding the given binary data in byte mode.
   */
  public static makeBytes(data: Uint8Array): QrSegment {
    const bits: boolean[] = [];
    for (const b of data) {
      this.appendBits(b, 8, bits);
    }
    return new QrSegment(Mode.Byte, data.length, bits);
  }

  /**
   * Creates a segment encoding the given string of decimal digits in numeric mode.
   */
  public static makeNumeric(digits: string): QrSegment {
    const bits: boolean[] = [];
    let i = 0;
    while (i < digits.length) {
      const n = Math.min(digits.length - i, 3);
      const value = parseInt(digits.substring(i, i + n), 10);
      this.appendBits(value, n * 3 + 1, bits);
      i += n;
    }
    return new QrSegment(Mode.Numeric, digits.length, bits);
  }

  /**
   * Creates a segment encoding the given string in alphanumeric mode.
   * Valid characters: 0-9, A-Z, space, $, %, *, +, -, ., /, :
   */
  public static makeAlphanumeric(text: string): QrSegment {
    const bits: boolean[] = [];
    let i = 0;
    while (i + 1 < text.length) {
      const val = this.alphanumericCharset.indexOf(text[i]) * 45 + this.alphanumericCharset.indexOf(text[i + 1]);
      this.appendBits(val, 11, bits);
      i += 2;
    }
    if (i < text.length) {
      this.appendBits(this.alphanumericCharset.indexOf(text[i]), 6, bits);
    }
    return new QrSegment(Mode.Alphanumeric, text.length, bits);
  }

  /**
   * Calculates the total number of bits needed to encode all segments for a given version.
   * Returns -1 if a segment's character count doesn't fit its field.
   */
  public static getTotalBits(segs: QrSegment[], version: number): number {
    let result = 0;
    for (const seg of segs) {
      const ccbits = seg.segmentMode.numCharCountBits(version);
      const maxChars = 1 << ccbits;
      if (seg.numChars >= maxChars) {
        return -1; // Segment's character count doesn't fit
      }
      result += 4 + ccbits + seg.data.length;
    }
    return result;
  }

  // ---- Helpers ----

  public static appendBits(val: number, len: number, buffer: boolean[]): void {
    if (len < 0 || len > 31 || val >>> len !== 0) {
      throw new Error('Value out of range');
    }
    for (let i = len - 1; i >= 0; i--) {
      buffer.push(((val >>> i) & 1) !== 0);
    }
  }

  private static readonly alphanumericCharset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:';
}
