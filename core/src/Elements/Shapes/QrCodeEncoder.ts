import { QrEcc } from './QrEcc';
import { QrSegment } from './QrSegment';

/**
 * QR Code encoder implementing ISO/IEC 18004.
 * Based on Project Nayuki's qrcodegen library (MIT License).
 * https://www.nayuki.io/page/qr-code-generator-library
 */
export class QrCodeEncoder {
  public readonly version: number;
  public readonly size: number;
  public readonly errorCorrectionLevel: QrEcc;
  public readonly mask: number;

  private readonly modules: boolean[][];
  private readonly isFunction: boolean[][];

  private static readonly MIN_VERSION = 1;
  private static readonly MAX_VERSION = 40;

  // EC codewords per block, indexed [ecl.ordinal][version] (index 0 unused, sentinel -1)
  private static readonly ECC_CODEWORDS_PER_BLOCK: readonly (readonly number[])[] = [
    [
      -1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30,
      30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    ],
    [
      -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28,
      28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
    ],
    [
      -1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30,
      30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    ],
    [
      -1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30,
      30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
    ],
  ];

  // Number of EC blocks, indexed [ecl.ordinal][version] (index 0 unused, sentinel -1)
  private static readonly NUM_ERROR_CORRECTION_BLOCKS: readonly (readonly number[])[] = [
    [
      -1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18,
      19, 19, 20, 21, 22, 24, 25,
    ],
    [
      -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31,
      33, 35, 37, 38, 40, 43, 45, 47, 49,
    ],
    [
      -1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 19, 22, 25, 26, 28, 31, 33, 35, 37, 38,
      40, 43, 45, 48, 51, 53, 56, 59, 62, 65,
    ],
    [
      -1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48,
      51, 54, 57, 60, 63, 66, 70, 74, 77, 81,
    ],
  ];

  private constructor(version: number, ecl: QrEcc, dataCodewords: Uint8Array, msk: number) {
    this.version = version;
    this.size = version * 4 + 17;
    this.errorCorrectionLevel = ecl;

    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.isFunction = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));

    this.drawFunctionPatterns();
    const allCodewords = this.addEccAndInterleave(dataCodewords);
    this.drawCodewords(allCodewords);

    if (msk === -1) {
      let minPenalty = Infinity;
      let bestMsk = 0;
      for (let m = 0; m < 8; m++) {
        this.applyMask(m);
        this.drawFormatBits(m);
        const penalty = this.getPenaltyScore();
        if (penalty < minPenalty) {
          bestMsk = m;
          minPenalty = penalty;
        }
        this.applyMask(m); // undo
      }
      msk = bestMsk;
    }

    this.mask = msk;
    this.applyMask(msk);
    this.drawFormatBits(msk);
  }

  // ---- Public static factory methods ----

  public static encodeText(text: string, ecl: QrEcc): QrCodeEncoder {
    return QrCodeEncoder.encodeSegments(QrSegment.makeSegments(text), ecl);
  }

  public static encodeBinary(data: Uint8Array, ecl: QrEcc): QrCodeEncoder {
    return QrCodeEncoder.encodeSegments([QrSegment.makeBytes(data)], ecl);
  }

  public static encodeSegments(
    segs: QrSegment[],
    ecl: QrEcc,
    minVersion: number = QrCodeEncoder.MIN_VERSION,
    maxVersion: number = QrCodeEncoder.MAX_VERSION,
    mask: number = -1,
    boostEcl: boolean = true
  ): QrCodeEncoder {
    // Find minimum version that fits all segments
    let version: number;
    let dataUsedBits = 0;
    for (version = minVersion; ; version++) {
      const dataCapacityBits = QrCodeEncoder.getNumDataCodewords(version, ecl) * 8;
      const usedBits = QrSegment.getTotalBits(segs, version);
      if (usedBits !== -1 && usedBits <= dataCapacityBits) {
        dataUsedBits = usedBits;
        break;
      }
      if (version >= maxVersion) {
        throw new RangeError('Data too long to fit in any QR Code version');
      }
    }

    // Optionally boost ECC while data still fits in chosen version
    if (boostEcl) {
      for (const newEcl of [QrEcc.Medium, QrEcc.Quartile, QrEcc.High]) {
        if (dataUsedBits <= QrCodeEncoder.getNumDataCodewords(version, newEcl) * 8) ecl = newEcl;
      }
    }

    // Build bit string
    const bb: boolean[] = [];
    for (const seg of segs) {
      QrSegment.appendBits(seg.segmentMode.modeBits, 4, bb);
      QrSegment.appendBits(seg.numChars, seg.segmentMode.numCharCountBits(version), bb);
      for (const b of seg.getData()) bb.push(b);
    }
    const dataCapacityBits = QrCodeEncoder.getNumDataCodewords(version, ecl) * 8;
    QrSegment.appendBits(0, Math.min(4, dataCapacityBits - bb.length), bb);
    QrSegment.appendBits(0, (8 - (bb.length % 8)) % 8, bb);
    for (let padByte = 0xec; bb.length < dataCapacityBits; padByte ^= 0xec ^ 0x11) {
      QrSegment.appendBits(padByte, 8, bb);
    }

    const dataCodewords = new Uint8Array(bb.length / 8);
    for (let i = 0; i < bb.length; i++) {
      if (bb[i]) dataCodewords[i >> 3] |= 1 << (7 - (i & 7));
    }

    return new QrCodeEncoder(version, ecl, dataCodewords, mask);
  }

  // ---- Public instance methods ----

  public getModule(x: number, y: number): boolean {
    return x >= 0 && x < this.size && y >= 0 && y < this.size && this.modules[y][x];
  }

  public toMatrix(): boolean[][] {
    return this.modules;
  }

  // ---- Private drawing methods ----

  private drawFunctionPatterns(): void {
    // Timing patterns
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }
    // Finder patterns (with separators via the dy/dx range extending to ±4)
    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);
    // Alignment patterns
    const alignPos = QrCodeEncoder.getAlignmentPatternPositions(this.version);
    const n = alignPos.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        // Skip positions that overlap finder patterns
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        this.drawAlignmentPattern(alignPos[i], alignPos[j]);
      }
    }
    this.drawFormatBits(0); // placeholder; overwritten later
    this.drawVersion();
  }

  private drawFormatBits(msk: number): void {
    const ecl = this.errorCorrectionLevel;
    const data = (ecl.formatBits << 3) | msk;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;

    // Copy 1 - around top-left finder
    for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));

    // Copy 2 - bottom-left and top-right finders
    for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
    this.setFunctionModule(8, this.size - 8, true); // always-dark module
  }

  private drawVersion(): void {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  }

  private drawFinderPattern(cx: number, cy: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = cx + dx,
          yy = cy + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  private drawAlignmentPattern(cx: number, cy: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  private setFunctionModule(x: number, y: number, isDark: boolean): void {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  // ---- ECC and interleaving ----

  private addEccAndInterleave(data: Uint8Array): Uint8Array {
    const ver = this.version;
    const ecl = this.errorCorrectionLevel;
    const numBlocks = QrCodeEncoder.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
    const blockEccLen = QrCodeEncoder.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][ver];
    const rawCodewords = Math.floor(QrCodeEncoder.getNumRawDataModules(ver) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortDataLen = Math.floor(rawCodewords / numBlocks) - blockEccLen;

    const blocks: number[][] = [];
    const rsDiv = QrCodeEncoder.reedSolomonComputeDivisor(blockEccLen);

    for (let i = 0, k = 0; i < numBlocks; i++) {
      const datLen = shortDataLen + (i < numShortBlocks ? 0 : 1);
      const dat = Array.from(data.slice(k, k + datLen));
      k += datLen;
      const ecc = Array.from(QrCodeEncoder.reedSolomonComputeRemainder(new Uint8Array(dat), rsDiv));
      // Short blocks get a placeholder at position shortDataLen for correct interleaving
      blocks.push(i < numShortBlocks ? [...dat, 0, ...ecc] : [...dat, ...ecc]);
    }

    // Interleave: take one byte from each block in turn; skip placeholder column in short blocks
    const result: number[] = [];
    const maxLen = blocks[blocks.length - 1].length;
    for (let col = 0; col < maxLen; col++) {
      for (let i = 0; i < blocks.length; i++) {
        if (col === shortDataLen && i < numShortBlocks) continue;
        result.push(blocks[i][col]);
      }
    }
    return new Uint8Array(result);
  }

  // ---- Codeword placement (zigzag scan) ----

  private drawCodewords(data: Uint8Array): void {
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // skip vertical timing column
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  // ---- Masking ----

  private applyMask(msk: number): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.isFunction[y][x]) continue;
        let inv: boolean;
        switch (msk) {
          case 0:
            inv = (x + y) % 2 === 0;
            break;
          case 1:
            inv = y % 2 === 0;
            break;
          case 2:
            inv = x % 3 === 0;
            break;
          case 3:
            inv = (x + y) % 3 === 0;
            break;
          case 4:
            inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
            break;
          case 5:
            inv = ((x * y) % 2) + ((x * y) % 3) === 0;
            break;
          case 6:
            inv = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
          default:
            inv = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
            break;
        }
        if (inv) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  private getPenaltyScore(): number {
    let result = 0;
    const size = this.size;

    // A seven-run history detects scaled finder-like patterns and includes the
    // light border beyond each edge, which a fixed eleven-module window misses.
    const scoreLine = (read: (index: number) => boolean): number => {
      const history = new Array<number>(7).fill(0);
      const remember = (length: number): void => {
        if (history[0] === 0) length += size;
        history.pop();
        history.unshift(length);
      };
      const finderPatterns = (): number => {
        const unit = history[1];
        const core =
          unit > 0 && history[2] === unit && history[3] === 3 * unit && history[4] === unit && history[5] === unit;
        return (
          Number(core && history[0] >= 4 * unit && history[6] >= unit) +
          Number(core && history[6] >= 4 * unit && history[0] >= unit)
        );
      };
      let score = 0;
      let color = false;
      let length = 0;
      for (let index = 0; index < size; index++) {
        const next = read(index);
        if (next === color) {
          length++;
          if (length === 5) score += 3;
          else if (length > 5) score++;
        } else {
          remember(length);
          if (!color) score += 40 * finderPatterns();
          color = next;
          length = 1;
        }
      }
      if (color) {
        remember(length);
        length = 0;
      }
      remember(length + size);
      return score + 40 * finderPatterns();
    };
    for (let index = 0; index < size; index++) {
      result += scoreLine(position => this.modules[index][position]);
      result += scoreLine(position => this.modules[position][index]);
    }

    for (let y = 0; y < size - 1; y++) {
      for (let x = 0; x < size - 1; x++) {
        const color = this.modules[y][x];
        if (
          color === this.modules[y][x + 1] &&
          color === this.modules[y + 1][x] &&
          color === this.modules[y + 1][x + 1]
        )
          result += 3;
      }
    }
    let dark = 0;
    for (const row of this.modules) for (const color of row) if (color) dark++;
    const total = size * size;
    return result + (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
  }

  // ---- Reed-Solomon GF(256) ----

  private static reedSolomonComputeDivisor(degree: number): Uint8Array {
    const result = new Uint8Array(degree);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < degree; j++) {
        result[j] = QrCodeEncoder.reedSolomonMultiply(result[j], root);
        if (j + 1 < degree) result[j] ^= result[j + 1];
      }
      root = QrCodeEncoder.reedSolomonMultiply(root, 0x02);
    }
    return result;
  }

  private static reedSolomonComputeRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
    const result = new Uint8Array(divisor.length);
    for (const b of data) {
      const factor = b ^ result[0];
      result.copyWithin(0, 1);
      result[divisor.length - 1] = 0;
      for (let i = 0; i < divisor.length; i++) {
        result[i] ^= QrCodeEncoder.reedSolomonMultiply(divisor[i], factor);
      }
    }
    return result;
  }

  private static reedSolomonMultiply(x: number, y: number): number {
    let z = 0;
    for (let i = 7; i >= 0; i--) {
      z = (z << 1) ^ ((z >>> 7) * 0x11d);
      z ^= ((y >>> i) & 1) * x;
    }
    return z;
  }

  // ---- Static geometry helpers ----

  public static getNumDataCodewords(version: number, ecl: QrEcc): number {
    return (
      Math.floor(QrCodeEncoder.getNumRawDataModules(version) / 8) -
      QrCodeEncoder.ECC_CODEWORDS_PER_BLOCK[ecl.ordinal][version] *
        QrCodeEncoder.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][version]
    );
  }

  private static getNumRawDataModules(ver: number): number {
    let result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }

  private static getAlignmentPatternPositions(ver: number): number[] {
    if (ver === 1) return [];
    const numAlign = Math.floor(ver / 7) + 2;
    const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (numAlign * 2 - 2)) * 2;
    const result: number[] = [6];
    for (let pos = ver * 4 + 10; result.length < numAlign; pos -= step) {
      result.splice(1, 0, pos);
    }
    return result;
  }

  public static getMaxVersion(): number {
    return QrCodeEncoder.MAX_VERSION;
  }
}

function getBit(x: number, i: number): boolean {
  return ((x >>> i) & 1) !== 0;
}
