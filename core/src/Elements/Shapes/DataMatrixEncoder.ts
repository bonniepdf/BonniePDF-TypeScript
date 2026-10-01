import { BonniePdfError } from '../../Core/BonniePdfError';

/**
 * Data Matrix (ECC200) encoder.
 *
 * Produces a square or rectangular module matrix for an arbitrary message,
 * choosing the most compact of the ASCII, C40, Text, X12, EDIFACT and Base-256
 * encodation schemes and protecting the data with interleaved Reed-Solomon
 * error correction, exactly per ISO/IEC 16022.
 *
 * Ported from datalog/datamatrix-svg (MIT License, Copyright (c) 2020
 * Constantine - https://github.com/datalog/datamatrix-svg). The SVG/DOM
 * rendering layer of the original is intentionally dropped: BonniePDF draws the
 * matrix directly as vector rectangles in {@link DataMatrix}, mirroring the way
 * {@link QRCode} consumes {@link QrCodeEncoder}.
 */

/** Thrown when a message cannot fit in the largest Data Matrix symbol. */
export class DataMatrixContentException extends BonniePdfError {
  constructor(message: string) {
    super(message);
    this.name = 'DataMatrixContentException';
  }
}

/** The result of encoding a message: a dense grid of dark/light modules. */
export interface EncodedDataMatrix {
  /** Symbol width in modules, including the finder pattern (and any quiet zone is added by the caller). */
  readonly width: number;
  /** Symbol height in modules, including the finder pattern. */
  readonly height: number;
  /** Row-major grid of modules; `true` is a dark module. */
  readonly modules: readonly (readonly boolean[])[];
}

interface SymbolSize {
  readonly width: number;
  readonly height: number;
  readonly columns: number;
  readonly rows: number;
  readonly blocks: number;
  readonly symbolBytes: number;
  readonly checkwords: number;
}

// Code-set tables: [latch, then triples of (upperBound, shift, offset)].
const C40_SET = [
  230, 31, 0, 0, 32, 9, 29, 47, 1, 33, 57, 9, 44, 64, 1, 43, 90, 9, 51, 95, 1, 69, 127, 2, 96, 255, 1, 0,
] as const;
const TEXT_SET = [
  239, 31, 0, 0, 32, 9, 29, 47, 1, 33, 57, 9, 44, 64, 1, 43, 90, 2, 64, 95, 1, 69, 122, 9, 83, 127, 2, 96, 255, 1, 0,
] as const;
const X12_SET = [
  238, 12, 8, 0, 13, 9, 13, 31, 8, 0, 32, 9, 29, 41, 8, 0, 42, 9, 41, 47, 8, 0, 57, 9, 44, 64, 8, 0, 90, 9, 51, 255, 8,
  0,
] as const;
const NOMINAL_BYTE_LAYOUT = [0, 0, -1, 0, -2, 0, 0, -1, -1, -1, -2, -1, -1, -2, -2, -2] as const;

/**
 * Convert a UTF-16 string to a Latin-1 byte string, the input form every
 * encodation scheme operates on. Equivalent to the original's
 * `unescape(encodeURI(text))`: multi-byte characters become their UTF-8 bytes.
 */
function toLatin1Bytes(text: string): string {
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, byte => String.fromCharCode(byte)).join('');
}

/** The "255 state" randomising algorithm used by Base-256 encoding. */
function randomise255State(value: number, position: number): number {
  return (value + ((149 * position) % 255) + 1) & 255;
}

function encodeAscii(text: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const current = text.charCodeAt(i);
    const next = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
    if (current >= 48 && current <= 57 && next >= 48 && next <= 57) {
      result.push((current - 48) * 10 + next + 82); // two digits in one codeword
      i++;
    } else if (current > 127) {
      result.push(235, (current - 127) & 255); // upper-shift (extended char)
    } else {
      result.push(current + 1);
    }
  }
  return result;
}

function encodeBase256(text: string): number[] {
  const result = [231]; // latch to Base 256
  const length = text.length;
  if (length > 250) result.push((37 + Math.trunc(length / 250)) & 255); // length high byte
  result.push(randomise255State(length % 250, result.length + 1)); // length low byte
  for (let i = 0; i < length; i++) {
    result.push(randomise255State(text.charCodeAt(i), result.length + 1));
  }
  return result;
}

function encodeEdifact(text: string): number[] {
  const textLength = text.length;
  const packedLength = (textLength + 1) & -4;
  const result = packedLength > 0 ? [240] : []; // latch to EDIFACT
  let codeword = 0;

  for (let i = 0; i < packedLength; i++) {
    let charCode: number;
    if (i < packedLength - 1) {
      charCode = text.charCodeAt(i);
      if (charCode < 32 || charCode > 94) return []; // not representable in EDIFACT
    } else {
      charCode = 31; // unlatch back to ASCII
    }
    codeword = codeword * 64 + (charCode & 63);
    if ((i & 3) === 3) {
      result.push(codeword >> 16, (codeword >> 8) & 255, codeword & 255); // 4 chars -> 3 codewords
      codeword = 0;
    }
  }
  if (packedLength > textLength) return result;
  return result.concat(encodeAscii(text.substring(packedLength === 0 ? 0 : packedLength - 1)));
}

function encodeTextMode(text: string, set: readonly number[]): number[] {
  let charCount = 0;
  let codeword = 0;
  let i = 0;
  const result = [set[0]];

  const push = (value: number): void => {
    codeword = 40 * codeword + value; // pack 3 chars into 2 codewords
    if (charCount++ === 2) {
      codeword++;
      result.push(codeword >> 8, codeword & 255);
      charCount = 0;
      codeword = 0;
    }
  };

  for (i = 0; i < text.length; i++) {
    if (charCount === 0 && i === text.length - 1) break; // a trailing char is shorter in ASCII
    let charCode = text.charCodeAt(i);
    if (charCode > 127 && result[0] !== 238) {
      push(1); // upper shift
      push(30);
      charCode -= 128;
    }
    let j = 1;
    while (charCode > set[j]) j += 3; // select sub-set
    const shift = set[j + 1];
    const offset = set[j + 2];

    if (shift === 8 || (shift === 9 && charCount === 0 && i === text.length - 1)) return []; // not in set / padding fails
    if (shift < 5 && charCount === 2 && i === text.length - 1) break; // last char in ASCII
    if (shift < 5) push(shift);
    push(charCode - offset);
  }

  if (charCount === 2 && result[0] !== 238) push(0); // pad
  result.push(254); // unlatch to ASCII

  if (charCount > 0 || i < text.length) {
    result.push(...encodeAscii(text.substring(i - charCount)));
  }
  return result;
}

/** Pick whichever encodation scheme yields the fewest data codewords. */
function chooseBestEncoding(text: string): number[] {
  let encoded = encodeAscii(text);
  const candidates = [
    encodeTextMode(text, C40_SET),
    encodeTextMode(text, TEXT_SET),
    encodeTextMode(text, X12_SET),
    encodeEdifact(text),
    encodeBase256(text),
  ];

  for (const candidate of candidates) {
    if (candidate.length > 0 && candidate.length < encoded.length) {
      encoded = candidate;
    }
  }
  return encoded;
}

function setModule(matrix: boolean[][], x: number, y: number): void {
  matrix[y] ??= [];
  matrix[y][x] = true;
}

function createFilledMatrix(width: number, height: number, sparse: boolean[][]): boolean[][] {
  return Array.from({ length: height }, (_, y) => Array.from({ length: width }, (_, x) => sparse[y]?.[x] === true));
}

/** Choose the smallest symbol that can hold the encoded data. */
function calculateSymbolSize(dataLength: number, rectangular: boolean): SymbolSize {
  let width: number;
  let height: number;
  let columns = 1;
  let rows = 1;
  let blocks = 1;
  let symbolBytes: number;
  let checkwords: number;
  let tableIndex = -1;

  if (rectangular && dataLength < 50) {
    // [symbol width, checkwords] pairs for the six rectangular symbols.
    const symbolTable = [16, 7, 28, 11, 24, 14, 32, 18, 32, 24, 44, 28];
    do {
      width = symbolTable[++tableIndex];
      height = 6 + (tableIndex & 12);
      symbolBytes = (width * height) / 8;
      checkwords = symbolTable[++tableIndex];
    } while (symbolBytes - checkwords < dataLength);
    if (width > 25) columns = 2;
  } else {
    width = height = 6;
    let increment = 2;
    // Reed-Solomon checkwords for each successive square symbol.
    const symbolTable = [
      5, 7, 10, 12, 14, 18, 20, 24, 28, 36, 42, 48, 56, 68, 84, 112, 144, 192, 224, 272, 336, 408, 496, 620,
    ];
    do {
      if (++tableIndex === symbolTable.length)
        throw new DataMatrixContentException('Data Matrix message is too long to encode.');
      if (width > 11 * increment) increment = (4 + increment) & 12;
      width = height += increment;
      symbolBytes = (width * height) >> 3;
      checkwords = symbolTable[tableIndex];
    } while (symbolBytes - checkwords < dataLength);

    if (width > 27) rows = columns = 2 * Math.trunc(width / 54) + 2;
    if (symbolBytes > 255) blocks = 2 * (symbolBytes >> 9) + 2;
  }

  return { width, height, columns, rows, blocks, symbolBytes, checkwords };
}

/** Pad the data region and append interleaved Reed-Solomon correction codewords. */
function applyReedSolomonErrorCorrection(
  encoded: number[],
  dataLength: number,
  symbolBytes: number,
  checkwords: number,
  blocks: number
): void {
  if (dataLength < symbolBytes - checkwords) encoded[dataLength++] = 129; // first pad
  while (dataLength < symbolBytes - checkwords) {
    encoded[dataLength++] = (((149 * dataLength) % 253) + 130) % 254; // randomised "253 state" pad
  }

  const blockCheckwords = checkwords / blocks;
  const reedSolomon = new Array<number>(70).fill(0);
  const correction = new Array<number>(70).fill(0);
  const log = new Array<number>(256).fill(0);
  const exp = new Array<number>(255).fill(0);

  // Galois field GF(256) log/exp tables (primitive polynomial x^8 + x^5 + x^3 + x^2 + 1 = 301).
  for (let value = 1, i = 0; i < 255; i++) {
    exp[i] = value;
    log[value] = i;
    value += value;
    if (value > 255) value ^= 301;
  }

  // Reed-Solomon generator polynomial.
  reedSolomon[blockCheckwords] = 0;
  for (let i = 1; i <= blockCheckwords; i++) {
    reedSolomon[blockCheckwords - i] = 1;
    for (let j = blockCheckwords - i; j < blockCheckwords; j++) {
      reedSolomon[j] = reedSolomon[j + 1] ^ exp[(log[reedSolomon[j]] + i) % 255];
    }
  }

  // Correction codewords for each interleaved block.
  for (let c = 0; c < blocks; c++) {
    correction.fill(0, 0, blockCheckwords + 1);
    for (let i = c; i < dataLength; i += blocks) {
      const x = correction[0] ^ encoded[i];
      for (let j = 0; j < blockCheckwords; j++) {
        correction[j] = correction[j + 1] ^ (x ? exp[(log[reedSolomon[j]] + log[x]) % 255] : 0);
      }
    }
    for (let i = 0; i < blockCheckwords; i++) {
      encoded[dataLength + c + i * blocks] = correction[i];
    }
  }
}

/** Place codewords into the symbol following the ECC200 layout and finder pattern. */
function buildMatrixWithLayout(encoded: number[], symbolProps: SymbolSize): EncodedDataMatrix {
  const { width, height, columns, rows, symbolBytes } = symbolProps;
  const matrix: boolean[][] = [];
  const regionWidth = width / columns;
  const regionHeight = height / rows;

  // Finder pattern: horizontal borders (solid bottom, dashed top of each region).
  for (let y = 0; y < height + 2 * rows; y += regionHeight + 2) {
    for (let x = 0; x < width + 2 * columns; x++) {
      setModule(matrix, x, y + regionHeight + 1);
      if ((x & 1) === 0) setModule(matrix, x, y);
    }
  }

  // Finder pattern: vertical borders (solid left, dashed right of each region).
  for (let x = 0; x < width + 2 * columns; x += regionWidth + 2) {
    for (let y = 0; y < height; y++) {
      const regionOffset = Math.trunc(y / regionHeight) * 2;
      setModule(matrix, x, y + regionOffset + 1);
      if ((y & 1) === 1) setModule(matrix, x + regionWidth + 1, y + regionOffset);
    }
  }

  // Place each codeword's 8 bits along a diagonal utah-shaped path.
  let step = 2;
  let c = 0;
  let r = 4;
  for (let i = 0; i < symbolBytes; r -= step, c += step) {
    let layout: readonly number[];

    if (r === height - 3 && c === -1) {
      layout = [
        width,
        6 - height,
        width,
        5 - height,
        width,
        4 - height,
        width,
        3 - height,
        width - 1,
        3 - height,
        3,
        2,
        2,
        2,
        1,
        2,
      ]; // corner A
    } else if (r === height + 1 && c === 1 && (width & 7) === 0 && (height & 7) === 6) {
      layout = [
        width - 2,
        -height,
        width - 3,
        -height,
        width - 4,
        -height,
        width - 2,
        -1 - height,
        width - 3,
        -1 - height,
        width - 4,
        -1 - height,
        width - 2,
        -2,
        -1,
        -2,
      ]; // corner D
    } else {
      if (r === 0 && c === width - 2 && (width & 3) !== 0) continue; // corner B: skip
      if (r < 0 || c >= width || r >= height || c < 0) {
        step = -step; // turn around
        r += 2 + step / 2;
        c += 2 - step / 2;
        while (r < 0 || c >= width || r >= height || c < 0) {
          r -= step;
          c += step;
        }
      }
      if (r === height - 2 && c === 0 && (width & 3) !== 0) {
        layout = [
          width - 1,
          3 - height,
          width - 1,
          2 - height,
          width - 2,
          2 - height,
          width - 3,
          2 - height,
          width - 4,
          2 - height,
          0,
          1,
          0,
          0,
          0,
          -1,
        ]; // corner B
      } else if (r === height - 2 && c === 0 && (width & 7) === 4) {
        layout = [
          width - 1,
          5 - height,
          width - 1,
          4 - height,
          width - 1,
          3 - height,
          width - 1,
          2 - height,
          width - 2,
          2 - height,
          0,
          1,
          0,
          0,
          0,
          -1,
        ]; // corner C
      } else if (r === 1 && c === width - 1 && (width & 7) === 0 && (height & 7) === 6) {
        continue; // omit corner D
      } else {
        layout = NOMINAL_BYTE_LAYOUT;
      }
    }

    for (let word = encoded[i++], j = 0; word > 0; j += 2, word >>= 1) {
      if ((word & 1) === 0) continue;
      let x = c + layout[j];
      let y = r + layout[j + 1];

      if (x < 0) {
        x += width;
        y += 4 - ((width + 4) & 7);
      }
      if (y < 0) {
        y += height;
        x += 4 - ((height + 4) & 7);
      }

      // Map the data coordinate into the symbol, skipping finder-pattern columns/rows.
      setModule(matrix, x + 2 * Math.trunc(x / regionWidth) + 1, y + 2 * Math.trunc(y / regionHeight) + 1);
    }
  }

  // Fill the unused bottom-right corner of certain symbols with a fixed pattern.
  for (let i = width; (i & 3) !== 0; i--) {
    setModule(matrix, i, i);
  }

  const finalWidth = width + 2 * columns;
  const finalHeight = height + 2 * rows;

  return {
    width: finalWidth,
    height: finalHeight,
    modules: createFilledMatrix(finalWidth, finalHeight, matrix),
  };
}

/**
 * Data Matrix (ECC200) encoder. Static-only, mirroring {@link QrCodeEncoder} and
 * {@link BarcodeEncoder}.
 */
export class DataMatrixEncoder {
  /**
   * Encode {@link message} into a Data Matrix module grid.
   *
   * @param message     The text to encode. Any Unicode string is accepted;
   *                    non-Latin-1 characters are encoded as their UTF-8 bytes.
   * @param rectangular Request a rectangular symbol for short messages where one
   *                    is available; otherwise a square symbol is produced.
   * @throws {DataMatrixContentException} if the message is too long for the
   *         largest (144×144) symbol.
   */
  static encode(message: string, rectangular = false): EncodedDataMatrix {
    const bytes = toLatin1Bytes(message);
    const encoded = chooseBestEncoding(bytes);
    const sizeProps = calculateSymbolSize(encoded.length, rectangular);

    applyReedSolomonErrorCorrection(
      encoded,
      encoded.length,
      sizeProps.symbolBytes,
      sizeProps.checkwords,
      sizeProps.blocks
    );
    return buildMatrixWithLayout(encoded, sizeProps);
  }
}
