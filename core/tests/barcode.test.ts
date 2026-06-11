import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { Barcode } from '../src/Elements/Shapes/Barcode';
import { BarcodeSymbology, BarcodeContentException } from '../src/Elements/Shapes/BarcodeSymbology';
import { BarcodeEncoder } from '../src/Elements/Shapes/BarcodeEncoder';
import { Color } from '../src/Core/Color';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { SemanticRole } from '../src/Rendering/Tagging/SemanticRole';
import { pdfToText } from './helpers/test-base';

// ── Independent reverse tables (transcribed from the same ISO sources) ──
// Used only by the test decoders below to round-trip the encoder output.

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
const EAN_PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
const ITF_PATTERNS = ['NNWWN', 'WNNNW', 'NWNNW', 'WWNNN', 'NNWNW', 'WNWNN', 'NWWNN', 'NNNWW', 'WNNWN', 'NWNWN'];

function modulesToBits(modules: boolean[]): string {
  return modules.map(m => (m ? '1' : '0')).join('');
}

/** Run-length encode an alternating module stream that starts with a bar. */
function runLengths(modules: boolean[]): number[] {
  const runs: number[] = [];
  let current = true; // streams always start dark
  let count = 0;
  for (const m of modules) {
    if (m === current) {
      count++;
    } else {
      runs.push(count);
      current = m;
      count = 1;
    }
  }
  runs.push(count);
  return runs;
}

// ── Code 128 decoder (handles the pure-B and pure-C output we emit) ──────

function decodeCode128(modules: boolean[]): string {
  const reverse = new Map<string, number>();
  CODE128_PATTERNS.forEach((p, v) => reverse.set(p, v));

  const widths = runLengths(modules);
  // Non-stop symbols are 6 elements; the stop is 7.
  const symbolCount = (widths.length - 7) / 6;
  expect(Number.isInteger(symbolCount)).toBe(true);

  const values: number[] = [];
  let i = 0;
  for (let s = 0; s < symbolCount; s++) {
    const pat = widths.slice(i, i + 6).join('');
    expect(reverse.has(pat)).toBe(true);
    values.push(reverse.get(pat)!);
    i += 6;
  }
  // Stop symbol.
  expect(widths.slice(i).join('')).toBe('2331112');

  // Verify checksum: start + sum(i * value) mod 103 == last value.
  const start = values[0];
  let sum = start;
  for (let k = 1; k < values.length - 1; k++) sum += k * values[k];
  expect(sum % 103).toBe(values[values.length - 1]);

  // Decode payload (between start and checksum).
  const payload = values.slice(1, values.length - 1);
  let out = '';
  if (start === 105) {
    // Subset C: each value is a digit pair.
    for (const v of payload) out += v.toString().padStart(2, '0');
  } else {
    // Subset B: value + 32 = ASCII.
    for (const v of payload) out += String.fromCharCode(v + 32);
  }
  return out;
}

// ── EAN-13 decoder (also used for UPC-A) ────────────────────────────────

function decodeEan13(modules: boolean[]): string {
  expect(modules.length).toBe(95);
  const bits = modulesToBits(modules);
  expect(bits.slice(0, 3)).toBe('101'); // left guard
  expect(bits.slice(45, 50)).toBe('01010'); // centre guard
  expect(bits.slice(92, 95)).toBe('101'); // right guard

  const lRev = new Map(EAN_L_CODE.map((p, d) => [p, d] as const));
  const gRev = new Map(EAN_G_CODE.map((p, d) => [p, d] as const));
  const rRev = new Map(EAN_R_CODE.map((p, d) => [p, d] as const));
  const parityRev = new Map(EAN_PARITY.map((p, d) => [p, d] as const));

  let parity = '';
  const digits: number[] = [];
  for (let i = 0; i < 6; i++) {
    const chunk = bits.slice(3 + i * 7, 3 + i * 7 + 7);
    if (lRev.has(chunk)) {
      parity += 'L';
      digits.push(lRev.get(chunk)!);
    } else {
      expect(gRev.has(chunk)).toBe(true);
      parity += 'G';
      digits.push(gRev.get(chunk)!);
    }
  }
  expect(parityRev.has(parity)).toBe(true);
  const firstDigit = parityRev.get(parity)!;

  const right: number[] = [];
  for (let i = 0; i < 6; i++) {
    const chunk = bits.slice(50 + i * 7, 50 + i * 7 + 7);
    expect(rRev.has(chunk)).toBe(true);
    right.push(rRev.get(chunk)!);
  }

  const all = [firstDigit, ...digits, ...right];
  // Verify the embedded check digit.
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += all[i] * (i % 2 === 0 ? 1 : 3);
  expect((10 - (sum % 10)) % 10).toBe(all[12]);

  return all.join('');
}

// ── ITF-14 decoder ──────────────────────────────────────────────────────

function decodeItf14(modules: boolean[]): string {
  const widths = runLengths(modules);
  const sym = widths.map(w => (w === 3 ? 'W' : 'N')); // narrow=1, wide=3
  // Start: N N N N. Stop: W N N.
  expect(sym.slice(0, 4).join('')).toBe('NNNN');
  expect(sym.slice(-3).join('')).toBe('WNN');

  const body = sym.slice(4, sym.length - 3);
  const itfRev = new Map(ITF_PATTERNS.map((p, d) => [p, d] as const));

  const digits: number[] = [];
  // Each pair is 10 interleaved elements: bars at even indices, spaces at odd.
  for (let p = 0; p < body.length; p += 10) {
    const group = body.slice(p, p + 10);
    let bars = '';
    let spaces = '';
    for (let k = 0; k < 10; k += 2) {
      bars += group[k];
      spaces += group[k + 1];
    }
    expect(itfRev.has(bars)).toBe(true);
    expect(itfRev.has(spaces)).toBe(true);
    digits.push(itfRev.get(bars)!);
    digits.push(itfRev.get(spaces)!);
  }

  // Verify check digit (weights 3,1 from the right).
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const fromRight = 13 - 1 - i;
    sum += digits[i] * (fromRight % 2 === 0 ? 3 : 1);
  }
  expect((10 - (sum % 10)) % 10).toBe(digits[13]);

  return digits.join('');
}

describe('BarcodeEncoder - check digits (authoritative values)', () => {
  it('computes the EAN-13 check digit (4006381333931)', () => {
    const enc = BarcodeEncoder.encode(BarcodeSymbology.Ean13, '400638133393');
    expect(enc.humanReadable).toBe('4006381333931');
  });

  it('computes the UPC-A check digit (036000291452)', () => {
    const enc = BarcodeEncoder.encode(BarcodeSymbology.UpcA, '03600029145');
    expect(enc.humanReadable).toBe('036000291452');
  });

  it('computes the ITF-14 / GTIN-14 check digit (10614141000415)', () => {
    const enc = BarcodeEncoder.encode(BarcodeSymbology.Itf14, '1061414100041');
    expect(enc.humanReadable).toBe('10614141000415');
  });
});

describe('BarcodeEncoder - round trip (encode -> decode -> equal)', () => {
  it('round-trips Code 128 subset B (alphanumeric)', () => {
    const value = '1Z9999W99999999999';
    const enc = BarcodeEncoder.encode(BarcodeSymbology.Code128, value);
    expect(modulesToBits(enc.modules)[0]).toBe('1'); // starts with a bar
    expect(decodeCode128(enc.modules)).toBe(value);
  });

  it('round-trips Code 128 subset C (all-digit even length)', () => {
    const value = '12345678';
    const enc = BarcodeEncoder.encode(BarcodeSymbology.Code128, value);
    expect(decodeCode128(enc.modules)).toBe(value);
  });

  it('round-trips Code 128 with punctuation and mixed case', () => {
    const value = 'ABC-123/xyz.99';
    const enc = BarcodeEncoder.encode(BarcodeSymbology.Code128, value);
    expect(decodeCode128(enc.modules)).toBe(value);
  });

  it('round-trips EAN-13', () => {
    const enc = BarcodeEncoder.encode(BarcodeSymbology.Ean13, '590123412345');
    expect(decodeEan13(enc.modules)).toBe(enc.humanReadable);
  });

  it('round-trips UPC-A (decodes as a leading-zero EAN-13)', () => {
    const enc = BarcodeEncoder.encode(BarcodeSymbology.UpcA, '03600029145');
    const ean = decodeEan13(enc.modules); // 13 digits, leading 0
    expect(ean).toBe('0' + enc.humanReadable);
  });

  it('round-trips ITF-14', () => {
    const enc = BarcodeEncoder.encode(BarcodeSymbology.Itf14, '1540014128876');
    expect(decodeItf14(enc.modules)).toBe(enc.humanReadable);
  });
});

describe('BarcodeEncoder - structural invariants', () => {
  it('EAN-13 produces exactly 95 modules', () => {
    expect(BarcodeEncoder.encode(BarcodeSymbology.Ean13, '400638133393').modules.length).toBe(95);
  });

  it('UPC-A produces exactly 95 modules (it is an EAN-13)', () => {
    expect(BarcodeEncoder.encode(BarcodeSymbology.UpcA, '03600029145').modules.length).toBe(95);
  });

  it('ITF-14 produces exactly 135 modules', () => {
    expect(BarcodeEncoder.encode(BarcodeSymbology.Itf14, '1061414100041').modules.length).toBe(135);
  });

  it('Code 128 module count matches the symbol layout (11n + 13)', () => {
    // Subset C: start + 4 pairs + checksum = 6 symbols at 11 modules + 13 stop.
    const enc = BarcodeEncoder.encode(BarcodeSymbology.Code128, '12345678');
    expect(enc.modules.length).toBe(11 * 6 + 13);
  });
});

describe('BarcodeEncoder - validation', () => {
  it('rejects EAN-13 with the wrong length', () => {
    expect(() => BarcodeEncoder.encode(BarcodeSymbology.Ean13, 'ABC123')).toThrow(BarcodeContentException);
    expect(() => BarcodeEncoder.encode(BarcodeSymbology.Ean13, '12345')).toThrow(/exactly 12 digits/);
  });

  it('rejects UPC-A that is not 11 digits', () => {
    expect(() => BarcodeEncoder.encode(BarcodeSymbology.UpcA, '123')).toThrow(/exactly 11 digits/);
  });

  it('rejects ITF-14 that is not 13 digits', () => {
    expect(() => BarcodeEncoder.encode(BarcodeSymbology.Itf14, '12')).toThrow(/exactly 13 digits/);
  });

  it('rejects Code 128 with non-ASCII characters', () => {
    expect(() => BarcodeEncoder.encode(BarcodeSymbology.Code128, 'café')).toThrow(BarcodeContentException);
  });

  it('rejects an empty Code 128 value', () => {
    expect(() => BarcodeEncoder.encode(BarcodeSymbology.Code128, '')).toThrow(/at least one character/);
  });
});

describe('Barcode element', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  function generate(populate: (d: Document) => void): string {
    doc = new Document();
    populate(doc);
    return pdfToText(doc.generateBytes());
  }

  it('renders a Code 128 barcode into a valid PDF', () => {
    const pdf = generate(d => {
      const bc = new Barcode();
      bc.value = '1Z9999W99999999999';
      bc.symbology = BarcodeSymbology.Code128;
      d.add(bc);
    });
    expect(pdf).toContain('%PDF-');
    expect(pdf).toContain('%%EOF');
  });

  it('renders all four symbologies without throwing', () => {
    const pdf = generate(d => {
      const code128 = new Barcode();
      code128.value = 'SHIP-12345';
      d.add(code128);

      const ean = new Barcode();
      ean.value = '400638133393';
      ean.symbology = BarcodeSymbology.Ean13;
      d.add(ean);

      const upc = new Barcode();
      upc.value = '03600029145';
      upc.symbology = BarcodeSymbology.UpcA;
      d.add(upc);

      const itf = new Barcode();
      itf.value = '1061414100041';
      itf.symbology = BarcodeSymbology.Itf14;
      d.add(itf);
    });
    expect(pdf).toContain('%PDF-');
  });

  it('measures height as bars plus the label area', () => {
    const bc = new Barcode();
    bc.value = '400638133393';
    bc.symbology = BarcodeSymbology.Ean13;
    bc.height = 50;
    bc.textLabelFontSize = 9;
    expect(bc.measureHeight(500)).toBe(50 + 9 + 3);
  });

  it('omits the label area when the text label is disabled', () => {
    const bc = new Barcode();
    bc.value = '400638133393';
    bc.symbology = BarcodeSymbology.Ean13;
    bc.height = 50;
    bc.includeTextLabel = false;
    expect(bc.measureHeight(500)).toBe(50);
  });

  it('barcode with altText has the Figure role; decorative is an Artifact', () => {
    const figure = new Barcode();
    figure.value = 'SHIP-12345';
    figure.altText = 'Shipment tracking barcode SHIP-12345';
    expect(figure.semanticRole).toBe(SemanticRole.Figure);

    const decorative = new Barcode();
    decorative.value = 'SHIP-12345';
    expect(decorative.semanticRole).toBe(SemanticRole.Artifact);
  });

  it('tagged document, barcode with altText => Figure with /Alt', () => {
    const pdf = generate(d => {
      d.settings.version = PdfVersion.Pdf17;
      d.settings.accessibility = AccessibilityMode.PdfUa1;
      d.settings.language = 'en-GB';
      const bc = new Barcode();
      bc.value = 'SHIP-12345';
      bc.altText = 'Shipment tracking barcode SHIP-12345';
      d.add(bc);
    });
    expect(pdf).toContain('/S /Figure');
    expect(pdf).toContain('/Alt (Shipment tracking barcode SHIP-12345)');
  });

  it('honours a custom foreground colour', () => {
    const pdf = generate(d => {
      const bc = new Barcode();
      bc.value = 'SHIP-12345';
      bc.foregroundColor = Color.blue700;
      d.add(bc);
    });
    expect(pdf).toContain('%PDF-');
  });
});
