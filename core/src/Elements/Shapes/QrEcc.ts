/**
 * The error correction level in a QR Code symbol.
 * Higher levels provide more redundancy at the cost of reduced data capacity.
 *
 * Copyright (c) Project Nayuki. (MIT License)
 * https://www.nayuki.io/page/qr-code-generator-library
 * Ported to TypeScript for BonniePDF.
 */
export class QrEcc {
  /** Low error correction: ~7% of codewords can be restored. */
  public static readonly Low = new QrEcc(0, 1);

  /** Medium error correction: ~15% of codewords can be restored. */
  public static readonly Medium = new QrEcc(1, 0);

  /** Quartile error correction: ~25% of codewords can be restored. */
  public static readonly Quartile = new QrEcc(2, 3);

  /** High error correction: ~30% of codewords can be restored. */
  public static readonly High = new QrEcc(3, 2);

  /** Ordinal index used for table lookups (0=Low, 1=Medium, 2=Quartile, 3=High). */
  public readonly ordinal: number;

  /** The 2-bit format info value for this ECC level, used in the format information area. */
  public readonly formatBits: number;

  private constructor(ordinal: number, formatBits: number) {
    this.ordinal = ordinal;
    this.formatBits = formatBits;
  }
}

/**
 * Error correction levels for QR codes.
 */
export enum QrErrorCorrection {
  /** ~7% of codewords can be restored. */
  Low = 0,

  /** ~15% of codewords can be restored. */
  Medium = 1,

  /** ~25% of codewords can be restored. */
  Quartile = 2,

  /** ~30% of codewords can be restored. */
  High = 3,
}
