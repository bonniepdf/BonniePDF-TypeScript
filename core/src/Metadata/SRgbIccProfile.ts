/**
 * Generates a minimal valid sRGB ICC v2 profile for PDF/A-1b compliance.
 * Mirrors the .NET implementation in `BonniePDF/Metadata/SRgbIccProfile.cs`
 * byte-for-byte (same tag set, same colorimetry, same fixed-point
 * math). Required for the /OutputIntent /DestOutputProfile stream
 * referenced by the compliance writer.
 */

const IccSizes = {
  HeaderSize: 128,
  TagTableEntrySize: 12,
  TagTableHeaderSize: 4,
} as const;

const IccSignatures = {
  ProfileSignature: 'acsp',
  DeviceClassMonitor: 'mntr',
  ColorSpaceRgb: 'RGB ',
  PcsXyz: 'XYZ ',
  PlatformNone: 'NONE',

  // Tag signatures
  Desc: 'desc',
  Copyright: 'cprt',
  WhitePoint: 'wtpt',
  RedMatrix: 'rXYZ',
  GreenMatrix: 'gXYZ',
  BlueMatrix: 'bXYZ',
  RedTrc: 'rTRC',
  GreenTrc: 'gTRC',
  BlueTrc: 'bTRC',

  // Data-type signatures
  TypeXyz: 'XYZ ',
  TypeCurve: 'curv',
  TypeText: 'text',
} as const;

const SrgbColorimetry = {
  // Media white point (D50)
  WhiteX: 0.9505,
  WhiteY: 1.0,
  WhiteZ: 1.089,

  // D50 PCS illuminant (for header)
  PcsIlluminantX: 0.9642,
  PcsIlluminantY: 1.0,
  PcsIlluminantZ: 0.8249,

  // Matrix columns
  RedX: 0.436,
  RedY: 0.2225,
  RedZ: 0.0139,
  GreenX: 0.3851,
  GreenY: 0.7169,
  GreenZ: 0.0971,
  BlueX: 0.1431,
  BlueY: 0.0606,
  BlueZ: 0.7141,

  Gamma: 2.2,
} as const;

const FixedPointMath = {
  S15Fixed16Multiplier: 65536.0,
  U8Fixed8Multiplier: 256.0,
} as const;

export class SRgbIccProfile {
  /** Generates a minimal sRGB ICC v2 profile. */
  public static generate(): Uint8Array {
    // Tag data blocks
    const whitePointData = buildXyzTag(SrgbColorimetry.WhiteX, SrgbColorimetry.WhiteY, SrgbColorimetry.WhiteZ);
    const redMatrixData = buildXyzTag(SrgbColorimetry.RedX, SrgbColorimetry.RedY, SrgbColorimetry.RedZ);
    const greenMatrixData = buildXyzTag(SrgbColorimetry.GreenX, SrgbColorimetry.GreenY, SrgbColorimetry.GreenZ);
    const blueMatrixData = buildXyzTag(SrgbColorimetry.BlueX, SrgbColorimetry.BlueY, SrgbColorimetry.BlueZ);
    const trcData = buildCurveTag(SrgbColorimetry.Gamma);
    const descData = buildTextDescriptionTag('sRGB IEC61966-2.1');
    const copyrightData = buildTextTag('Public Domain');

    // Layout calculations
    const tagCount = 9;
    const tagTableSize = IccSizes.TagTableHeaderSize + tagCount * IccSizes.TagTableEntrySize;
    const dataOffset = align4(IccSizes.HeaderSize + tagTableSize);

    // Per-tag offsets
    const descOffset = dataOffset;
    const copyrightOffset = descOffset + align4(descData.length);
    const whitePointOffset = copyrightOffset + align4(copyrightData.length);
    const redMatrixOffset = whitePointOffset + align4(whitePointData.length);
    const greenMatrixOffset = redMatrixOffset + align4(redMatrixData.length);
    const blueMatrixOffset = greenMatrixOffset + align4(greenMatrixData.length);
    const redTrcOffset = blueMatrixOffset + align4(blueMatrixData.length);
    const greenTrcOffset = redTrcOffset; // Shared TRC data
    const blueTrcOffset = redTrcOffset; // Shared TRC data

    const totalSize = redTrcOffset + align4(trcData.length);

    // Header (128 bytes)
    const header = new Uint8Array(IccSizes.HeaderSize);
    writeUInt32BE(header, 0, totalSize);
    writeBytes(header, 4, IccSignatures.ProfileSignature);
    writeUInt32BE(header, 8, 0x02100000); // Version 2.1.0
    writeBytes(header, 12, IccSignatures.DeviceClassMonitor);
    writeBytes(header, 16, IccSignatures.ColorSpaceRgb);
    writeBytes(header, 20, IccSignatures.PcsXyz);

    // Date/time: 2000-01-01 00:00:00
    writeUInt16BE(header, 24, 2000);
    writeUInt16BE(header, 26, 1);
    writeUInt16BE(header, 28, 1);

    writeBytes(header, 36, IccSignatures.ProfileSignature);
    writeBytes(header, 40, IccSignatures.PlatformNone);

    // PCS illuminant (D50)
    writeS15Fixed16(header, 68, SrgbColorimetry.PcsIlluminantX);
    writeS15Fixed16(header, 72, SrgbColorimetry.PcsIlluminantY);
    writeS15Fixed16(header, 76, SrgbColorimetry.PcsIlluminantZ);

    // Tag table
    const tagTable = new Uint8Array(tagTableSize);
    writeUInt32BE(tagTable, 0, tagCount);
    const idx = { value: 4 };
    writeTagEntry(tagTable, idx, IccSignatures.Desc, descOffset, descData.length);
    writeTagEntry(tagTable, idx, IccSignatures.Copyright, copyrightOffset, copyrightData.length);
    writeTagEntry(tagTable, idx, IccSignatures.WhitePoint, whitePointOffset, whitePointData.length);
    writeTagEntry(tagTable, idx, IccSignatures.RedMatrix, redMatrixOffset, redMatrixData.length);
    writeTagEntry(tagTable, idx, IccSignatures.GreenMatrix, greenMatrixOffset, greenMatrixData.length);
    writeTagEntry(tagTable, idx, IccSignatures.BlueMatrix, blueMatrixOffset, blueMatrixData.length);
    writeTagEntry(tagTable, idx, IccSignatures.RedTrc, redTrcOffset, trcData.length);
    writeTagEntry(tagTable, idx, IccSignatures.GreenTrc, greenTrcOffset, trcData.length);
    writeTagEntry(tagTable, idx, IccSignatures.BlueTrc, blueTrcOffset, trcData.length);

    // Assemble: header || tag table || pad || tag data blocks
    const out = new Uint8Array(totalSize);
    out.set(header, 0);
    out.set(tagTable, IccSizes.HeaderSize);
    out.set(descData, descOffset);
    out.set(copyrightData, copyrightOffset);
    out.set(whitePointData, whitePointOffset);
    out.set(redMatrixData, redMatrixOffset);
    out.set(greenMatrixData, greenMatrixOffset);
    out.set(blueMatrixData, blueMatrixOffset);
    out.set(trcData, redTrcOffset);
    return out;
  }
}

// ── Tag builders ───────────────────────────────────────────────────

function buildXyzTag(x: number, y: number, z: number): Uint8Array {
  const data = new Uint8Array(20);
  writeBytes(data, 0, IccSignatures.TypeXyz);
  writeS15Fixed16(data, 8, x);
  writeS15Fixed16(data, 12, y);
  writeS15Fixed16(data, 16, z);
  return data;
}

function buildCurveTag(gamma: number): Uint8Array {
  // curv type: 4-byte sig + 4 bytes reserved + 4-byte count + count*2 bytes payload.
  // For a single u8.8 gamma, count = 1 and payload is 2 bytes.
  const data = new Uint8Array(14);
  writeBytes(data, 0, IccSignatures.TypeCurve);
  writeUInt32BE(data, 8, 1); // count = 1
  const gammaFixed = Math.round(gamma * FixedPointMath.U8Fixed8Multiplier);
  data[12] = (gammaFixed >> 8) & 0xff;
  data[13] = gammaFixed & 0xff;
  return data;
}

function buildTextDescriptionTag(text: string): Uint8Array {
  // desc type (ICC v2): sig(4) + reserved(4) + asciiCount(4) + ascii(N+1)
  //                    + uniCode(4) + uniCount(4) + macScriptCode(2)
  //                    + macCount(1) + macDesc(67) - pad to fixed total.
  const textBytes = asciiBytes(text);
  const size = 12 + textBytes.length + 1 + 4 + 4 + 2 + 1 + 67;
  const data = new Uint8Array(size);
  writeBytes(data, 0, IccSignatures.Desc);
  writeUInt32BE(data, 8, textBytes.length + 1);
  data.set(textBytes, 12);
  return data;
}

function buildTextTag(text: string): Uint8Array {
  const textBytes = asciiBytes(text);
  const data = new Uint8Array(8 + textBytes.length + 1);
  writeBytes(data, 0, IccSignatures.TypeText);
  data.set(textBytes, 8);
  return data;
}

// ── Low-level helpers ──────────────────────────────────────────────

function writeTagEntry(
  table: Uint8Array,
  idx: { value: number },
  sig: string,
  dataOffset: number,
  dataSize: number
): void {
  writeBytes(table, idx.value, sig);
  writeUInt32BE(table, idx.value + 4, dataOffset);
  writeUInt32BE(table, idx.value + 8, dataSize);
  idx.value += IccSizes.TagTableEntrySize;
}

function writeUInt32BE(data: Uint8Array, offset: number, value: number): void {
  // Coerce to unsigned 32-bit without using bitwise ops on >32-bit ints.
  const v = value >>> 0;
  data[offset] = (v >>> 24) & 0xff;
  data[offset + 1] = (v >>> 16) & 0xff;
  data[offset + 2] = (v >>> 8) & 0xff;
  data[offset + 3] = v & 0xff;
}

function writeUInt16BE(data: Uint8Array, offset: number, value: number): void {
  data[offset] = (value >> 8) & 0xff;
  data[offset + 1] = value & 0xff;
}

function writeS15Fixed16(data: Uint8Array, offset: number, value: number): void {
  // s15.16 fixed point: signed 32-bit with 16 fractional bits.
  const fixedValue = Math.round(value * FixedPointMath.S15Fixed16Multiplier);
  writeUInt32BE(data, offset, fixedValue);
}

function writeBytes(data: Uint8Array, offset: number, ascii: string): void {
  for (let i = 0; i < ascii.length && offset + i < data.length; i++) {
    data[offset + i] = ascii.charCodeAt(i) & 0xff;
  }
}

function asciiBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

function align4(n: number): number {
  return (n + 3) & ~3;
}
