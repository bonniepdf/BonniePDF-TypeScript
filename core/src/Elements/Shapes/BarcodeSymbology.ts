import { BonniePdfError } from '../../Core/BonniePdfError';

/**
 * The 1D barcode symbologies supported natively by BonniePDF. These four
 * cover retail (EAN-13, UPC-A) and logistics (Code 128, ITF-14) across the
 * UK, EU, and US. Additional symbologies (Code 39/93, DataMatrix, PDF417,
 * Aztec, …) are provided by the optional extension package.
 */
export enum BarcodeSymbology {
  /** Code 128 (ISO/IEC 15417) - the universal logistics barcode. Full ASCII. */
  Code128 = 'Code128',
  /** EAN-13 (ISO/IEC 15420) - the EU/UK retail product barcode. 12 digits + check. */
  Ean13 = 'Ean13',
  /** UPC-A (ISO/IEC 15420) - the US/Canada retail product barcode. 11 digits + check. */
  UpcA = 'UpcA',
  /** ITF-14 (ISO/IEC 16390 + GS1) - the outer-case/shipping barcode. 13 digits + check. */
  Itf14 = 'Itf14',
}

/**
 * Raised when a value cannot be encoded in the requested {@link BarcodeSymbology}
 * (wrong length, invalid characters, etc.).
 */
export class BarcodeContentException extends BonniePdfError {
  /** The symbology that rejected the value. */
  public readonly symbology: BarcodeSymbology;

  constructor(symbology: BarcodeSymbology, message: string) {
    super(message);
    this.name = 'BarcodeContentException';
    this.symbology = symbology;
  }
}
