import { BarcodeSymbology, BarcodeContentException } from './BarcodeSymbology';

/**
 * The result of encoding a value into a 1D barcode: a flat array of
 * equal-width modules (dark/light, left to right, with no quiet zone)
 * plus the human-readable text (including any computed check digit).
 */
export interface EncodedBarcode {
  /** Dark (true) / light (false) modules, left to right, no quiet zone. */
  readonly modules: boolean[];
  /** The human-readable value, including the computed check digit. */
  readonly humanReadable: string;
}

/**
 * Pure, dependency-free encoders for the tier-1 1D barcode symbologies
 * (Code 128, EAN-13, UPC-A, ITF-14). Every symbology reduces to a flat
 * array of equal-width modules so the `Barcode` element can render any of
 * them with a single coalescing draw loop.
 *
 * This mirrors the .NET implementation module-for-module so the two
 * libraries emit identical bar patterns for identical input. All encoding
 * is string/array based - there are no bitwise operations, so JavaScript's
 * 32-bit signed bitwise semantics never come into play.
 */
export const BarcodeEncoder = {
  encode(symbology: BarcodeSymbology, value: string, gs1 = false): EncodedBarcode {
    if (value === null || value === undefined) {
      throw new BarcodeContentException(symbology, 'Barcode value must not be null.');
    }

    if (gs1 && symbology !== BarcodeSymbology.Code128) {
      throw new BarcodeContentException(symbology, 'GS1 mode is supported for Code 128 only.');
    }
    switch (symbology) {
      case BarcodeSymbology.Code128:
        return encodeCode128(value, gs1);
      case BarcodeSymbology.Ean13:
        return encodeEan13(value);
      case BarcodeSymbology.UpcA:
        return encodeUpcA(value);
      case BarcodeSymbology.Itf14:
        return encodeItf14(value);
      default:
        throw new BarcodeContentException(symbology, `Unsupported symbology '${symbology}'.`);
    }
  },

  /** Recommended quiet zone (light margin) in narrow modules per side. */
  defaultQuietZone(symbology: BarcodeSymbology): number {
    switch (symbology) {
      case BarcodeSymbology.Ean13:
      case BarcodeSymbology.UpcA:
        return 9;
      default:
        return 10;
    }
  },
};

// ── Code 128 (ISO/IEC 15417) ────────────────────────────────────────────

// The 107 symbol patterns (values 0-106). Each is a 6-element (values
// 0-105) or 7-element (value 106, the stop) sequence of bar/space widths
// starting with a bar. Widths sum to 11 modules (13 for stop).
const CODE128_PATTERNS = [
  '212222',
  '222122',
  '222221',
  '121223',
  '121322',
  '131222',
  '122213',
  '122312',
  '132212',
  '221213',
  '221312',
  '231212',
  '112232',
  '122132',
  '122231',
  '113222',
  '123122',
  '123221',
  '223211',
  '221132',
  '221231',
  '213212',
  '223112',
  '312131',
  '311222',
  '321122',
  '321221',
  '312212',
  '322112',
  '322211',
  '212123',
  '212321',
  '232121',
  '111323',
  '131123',
  '131321',
  '112313',
  '132113',
  '132311',
  '211313',
  '231113',
  '231311',
  '112133',
  '112331',
  '132131',
  '113123',
  '113321',
  '133121',
  '313121',
  '211331',
  '231131',
  '213113',
  '213311',
  '213131',
  '311123',
  '311321',
  '331121',
  '312113',
  '312311',
  '332111',
  '314111',
  '221411',
  '431111',
  '111224',
  '111422',
  '121124',
  '121421',
  '141122',
  '141221',
  '112214',
  '112412',
  '122114',
  '122411',
  '142112',
  '142211',
  '241211',
  '221114',
  '413111',
  '241112',
  '134111',
  '111242',
  '121142',
  '121241',
  '114212',
  '124112',
  '124211',
  '411212',
  '421112',
  '421211',
  '212141',
  '214121',
  '412121',
  '111143',
  '111341',
  '131141',
  '114113',
  '114311',
  '411113',
  '411311',
  '113141',
  '114131',
  '311141',
  '411131',
  '211412',
  '211214',
  '211232',
  '2331112',
];

const CODE128_START_B = 104;
const CODE128_START_C = 105;
const CODE128_STOP = 106;

function encodeCode128(value: string, gs1: boolean): EncodedBarcode {
  if (value.length === 0) {
    throw new BarcodeContentException(BarcodeSymbology.Code128, 'Code 128 requires at least one character.');
  }

  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (!(gs1 && code === 29) && (code < 32 || code > 126)) {
      throw new BarcodeContentException(
        BarcodeSymbology.Code128,
        `Code 128 (subset B) supports ASCII 32-126 only. Got character U+${code.toString(16).toUpperCase().padStart(4, '0')}.`
      );
    }
  }

  const fields = gs1 ? value.split('\x1d') : [value];
  if (gs1 && (fields.some(field => field.length === 0) || value.length - fields.length + 1 > 48)) {
    throw new BarcodeContentException(
      BarcodeSymbology.Code128,
      'Invalid GS1 separators or more than 48 data characters.'
    );
  }
  const codes = gs1 ? buildGs1Code128Values(fields) : buildCode128Values(value);

  // Modulo-103 weighted checksum: start value + sum(i * value_i).
  let sum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    sum += i * codes[i];
  }
  codes.push(sum % 103);
  codes.push(CODE128_STOP);

  const modules: boolean[] = [];
  for (const code of codes) {
    appendCode128Symbol(modules, code);
  }

  return { modules, humanReadable: gs1 ? fields.join(' ') : value };
}

function buildCode128Values(value: string): number[] {
  // Subset C (digit pairs) is used when the whole payload is digits and
  // even-length; otherwise subset B encodes every character. Both are valid
  // and scannable; C is purely a density optimisation.
  const allDigits = /^[0-9]+$/.test(value);
  const codes: number[] = [];

  if (allDigits && value.length % 2 === 0) {
    codes.push(CODE128_START_C);
    for (let i = 0; i < value.length; i += 2) {
      codes.push((value.charCodeAt(i) - 48) * 10 + (value.charCodeAt(i + 1) - 48));
    }
  } else {
    codes.push(CODE128_START_B);
    for (const ch of value) {
      codes.push(ch.charCodeAt(0) - 32);
    }
  }

  return codes;
}

function buildGs1Code128Values(fields: string[]): number[] {
  const codes: number[] = [];
  let set = 0;
  for (const field of fields) {
    const [start, ...data] = buildCode128Values(field);
    if (set === 0) {
      codes.push(start, 102); // FNC1 following the start character
    } else {
      codes.push(102); // FNC1 field separator
      if (start !== set) codes.push(start === CODE128_START_C ? 99 : 100);
    }
    set = start;
    codes.push(...data);
  }
  return codes;
}

function appendCode128Symbol(modules: boolean[], code: number): void {
  const pattern = CODE128_PATTERNS[code];
  let dark = true; // every symbol starts with a bar
  for (const widthChar of pattern) {
    const width = widthChar.charCodeAt(0) - 48;
    for (let i = 0; i < width; i++) {
      modules.push(dark);
    }
    dark = !dark;
  }
}

// ── EAN-13 / UPC-A (ISO/IEC 15420) ──────────────────────────────────────

const EAN_L_CODE = [
  '0001101',
  '0011001',
  '0010011',
  '0111101',
  '0100011',
  '0110001',
  '0101111',
  '0111011',
  '0110111',
  '0001011',
];

const EAN_G_CODE = [
  '0100111',
  '0110011',
  '0011011',
  '0100001',
  '0011101',
  '0111001',
  '0000101',
  '0010001',
  '0001001',
  '0010111',
];

const EAN_R_CODE = [
  '1110010',
  '1100110',
  '1101100',
  '1000010',
  '1011100',
  '1001110',
  '1010000',
  '1000100',
  '1001000',
  '1110100',
];

// For each leading digit, the L/G parity pattern of the six left-half
// digits. 'L' selects EAN_L_CODE, 'G' selects EAN_G_CODE.
const EAN_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];

function encodeUpcA(value: string): EncodedBarcode {
  requireDigits(BarcodeSymbology.UpcA, value, 11, 'UPC-A requires exactly 11 digits (excluding the check digit).');

  // UPC-A is structurally EAN-13 with an implicit leading zero.
  const twelve = toDigits('0' + value);
  const check = ean13CheckDigit(twelve);
  const modules = buildEan13Modules(twelve, check);

  // Human-readable form shows the 12-digit UPC-A (11 data + check).
  return { modules, humanReadable: value + check.toString() };
}

function encodeEan13(value: string): EncodedBarcode {
  requireDigits(BarcodeSymbology.Ean13, value, 12, 'EAN-13 requires exactly 12 digits (excluding the check digit).');

  const twelve = toDigits(value);
  const check = ean13CheckDigit(twelve);
  const modules = buildEan13Modules(twelve, check);

  return { modules, humanReadable: value + check.toString() };
}

function buildEan13Modules(twelve: number[], check: number): boolean[] {
  let bits = '';

  // Left guard.
  bits += '101';

  // First digit is encoded implicitly by the L/G parity of the next six.
  const parity = EAN_PARITY[twelve[0]];
  for (let i = 0; i < 6; i++) {
    const digit = twelve[1 + i];
    bits += parity[i] === 'L' ? EAN_L_CODE[digit] : EAN_G_CODE[digit];
  }

  // Centre guard.
  bits += '01010';

  // Right half: digits 8-12 plus the check digit, all R-code.
  for (let i = 0; i < 5; i++) {
    bits += EAN_R_CODE[twelve[7 + i]];
  }
  bits += EAN_R_CODE[check];

  // Right guard.
  bits += '101';

  return bitsToModules(bits);
}

function ean13CheckDigit(twelve: number[]): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += twelve[i] * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10;
}

// ── ITF-14 (ISO/IEC 16390 + GS1) ────────────────────────────────────────

// Interleaved 2 of 5: each digit is five elements, exactly two wide.
// true = wide, false = narrow.
const ITF_PATTERNS: boolean[][] = [
  [false, false, true, true, false], // 0
  [true, false, false, false, true], // 1
  [false, true, false, false, true], // 2
  [true, true, false, false, false], // 3
  [false, false, true, false, true], // 4
  [true, false, true, false, false], // 5
  [false, true, true, false, false], // 6
  [false, false, false, true, true], // 7
  [true, false, false, true, false], // 8
  [false, true, false, true, false], // 9
];

const ITF_NARROW = 1;
const ITF_WIDE = 3;

function encodeItf14(value: string): EncodedBarcode {
  requireDigits(BarcodeSymbology.Itf14, value, 13, 'ITF-14 requires exactly 13 digits (excluding the check digit).');

  const data = toDigits(value);
  const check = itfCheckDigit(data);
  const all = [...data, check];

  const modules: boolean[] = [];

  // Start pattern: narrow bar, narrow space, narrow bar, narrow space.
  appendRun(modules, true, ITF_NARROW);
  appendRun(modules, false, ITF_NARROW);
  appendRun(modules, true, ITF_NARROW);
  appendRun(modules, false, ITF_NARROW);

  // Interleave digit pairs: first digit drives the five bars, the second
  // drives the five spaces, alternating bar/space.
  for (let i = 0; i < all.length; i += 2) {
    const bars = ITF_PATTERNS[all[i]];
    const spaces = ITF_PATTERNS[all[i + 1]];
    for (let k = 0; k < 5; k++) {
      appendRun(modules, true, bars[k] ? ITF_WIDE : ITF_NARROW);
      appendRun(modules, false, spaces[k] ? ITF_WIDE : ITF_NARROW);
    }
  }

  // Stop pattern: wide bar, narrow space, narrow bar.
  appendRun(modules, true, ITF_WIDE);
  appendRun(modules, false, ITF_NARROW);
  appendRun(modules, true, ITF_NARROW);

  return { modules, humanReadable: all.join('') };
}

function itfCheckDigit(data: number[]): number {
  // Weights alternate 3,1,... starting from the rightmost data digit.
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const fromRight = data.length - 1 - i;
    sum += data[i] * (fromRight % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10;
}

// ── Shared helpers ──────────────────────────────────────────────────────

function appendRun(modules: boolean[], dark: boolean, count: number): void {
  for (let i = 0; i < count; i++) {
    modules.push(dark);
  }
}

function bitsToModules(bits: string): boolean[] {
  const modules: boolean[] = new Array(bits.length);
  for (let i = 0; i < bits.length; i++) {
    modules[i] = bits[i] === '1';
  }
  return modules;
}

function toDigits(value: string): number[] {
  const digits: number[] = new Array(value.length);
  for (let i = 0; i < value.length; i++) {
    digits[i] = value.charCodeAt(i) - 48;
  }
  return digits;
}

function requireDigits(symbology: BarcodeSymbology, value: string, expectedLength: number, message: string): void {
  if (value.length !== expectedLength || !/^[0-9]+$/.test(value)) {
    throw new BarcodeContentException(symbology, `${message} Got: '${value}' (length ${value.length}).`);
  }
}
