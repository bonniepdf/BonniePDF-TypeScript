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
