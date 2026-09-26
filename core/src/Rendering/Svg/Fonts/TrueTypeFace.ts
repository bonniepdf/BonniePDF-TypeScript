// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { FontFace, GlyphSegment } from './FontFace';
import { readKerning, type KerningTable } from './Kerning';

/**
 * A `FontFace` read from a TrueType (`glyf`-outline) font file.
 *
 * The reference implementation of the font seam, written from the public
 * OpenType specification. It reads only what outlining text needs: `head`,
 * `maxp`, `hhea`, `hmtx`, `cmap` (formats 4 and 12), `loca` and `glyf`, including
 * composite glyphs, plus pair kerning from `GPOS` or `kern` (see `Kerning.ts`).
 * CFF-flavoured OpenType fonts (`.otf` with a `CFF ` table) are refused rather
 * than half-read.
 *
 * No hinting, and no shaping beyond pair kerning: glyphs are drawn at the scale
 * the document asks for, so hinting would move points away from the outline the
 * design intends.
 */
export class TrueTypeFace implements FontFace {
  readonly family: string;
  readonly unitsPerEm: number;

  private readonly view: DataView;
  private readonly numGlyphs: number;
  private readonly numberOfHMetrics: number;
  private readonly hmtx: number;
  private readonly glyf: number;
  private readonly glyphOffsets: Uint32Array;
  private readonly cmapLookup: (codePoint: number) => number;
  private readonly kerningTable: KerningTable;
  private readonly outlines = new Map<number, readonly GlyphSegment[]>();

  constructor(bytes: Uint8Array, family: string) {
    this.family = family;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const tables = readTableDirectory(this.view);
    if (tables.has('CFF ') || tables.has('CFF2')) {
      throw new Error(`${family}: CFF outlines are not supported; only TrueType (glyf) fonts are`);
    }
    const table = (tag: string): number => {
      const offset = tables.get(tag);
      if (offset === undefined) throw new Error(`${family}: missing required '${tag}' table`);
      return offset;
    };

    const head = table('head');
    this.unitsPerEm = this.view.getUint16(head + 18);
    const longLoca = this.view.getInt16(head + 50) === 1;

    this.numGlyphs = this.view.getUint16(table('maxp') + 4);
    this.numberOfHMetrics = this.view.getUint16(table('hhea') + 34);
    this.hmtx = table('hmtx');
    this.glyf = table('glyf');

    const loca = table('loca');
    this.glyphOffsets = new Uint32Array(this.numGlyphs + 1);
    for (let i = 0; i <= this.numGlyphs; i++) {
      this.glyphOffsets[i] = longLoca ? this.view.getUint32(loca + i * 4) : this.view.getUint16(loca + i * 2) * 2;
    }

    this.cmapLookup = readCmap(this.view, table('cmap'), family);
    this.kerningTable = readKerning(this.view, tables.get('GPOS'), tables.get('kern'));
  }

  glyphIndex(codePoint: number): number {
    const glyph = this.cmapLookup(codePoint);
    return glyph < this.numGlyphs ? glyph : 0;
  }

  advanceWidth(glyph: number): number {
    // Glyphs past the last long metric share its advance - monospaced tails.
    const index = Math.min(glyph, this.numberOfHMetrics - 1);
    return this.view.getUint16(this.hmtx + index * 4);
  }

  kerning(left: number, right: number): number {
    return this.kerningTable(left, right);
  }

  outline(glyph: number): readonly GlyphSegment[] {
    let cached = this.outlines.get(glyph);
    if (cached === undefined) {
      cached = contoursToSegments(this.glyphContours(glyph, 0));
      this.outlines.set(glyph, cached);
    }
    return cached;
  }

  /** The glyph's contours as points, composites resolved. */
  private glyphContours(glyph: number, depth: number): Point[][] {
    if (glyph < 0 || glyph >= this.numGlyphs) return [];
    const start = this.glyf + this.glyphOffsets[glyph]!;
    const end = this.glyf + this.glyphOffsets[glyph + 1]!;
    if (end <= start) return [];

    const contourCount = this.view.getInt16(start);
    return contourCount >= 0
      ? readSimpleGlyph(this.view, start, contourCount)
      : this.readCompositeGlyph(start, depth);
  }

  private readCompositeGlyph(start: number, depth: number): Point[][] {
    // A composite that nests more deeply than any real font does is a cycle in a
    // damaged file, not a design; stop rather than recurse without end.
    if (depth >= MAX_COMPOSITE_DEPTH) return [];

    const contours: Point[][] = [];
    let offset = start + 10;
    let flags: number;

    do {
      flags = this.view.getUint16(offset);
      const component = this.view.getUint16(offset + 2);
      offset += 4;

      let arg1: number;
      let arg2: number;
      if (flags & ARG_1_AND_2_ARE_WORDS) {
        arg1 = this.view.getInt16(offset);
        arg2 = this.view.getInt16(offset + 2);
        offset += 4;
      } else if (flags & ARGS_ARE_XY_VALUES) {
        arg1 = this.view.getInt8(offset);
        arg2 = this.view.getInt8(offset + 1);
        offset += 2;
      } else {
        // Point numbers are unsigned.
        arg1 = this.view.getUint8(offset);
        arg2 = this.view.getUint8(offset + 1);
        offset += 2;
      }

      let a = 1;
      let b = 0;
      let c = 0;
      let d = 1;
      if (flags & WE_HAVE_A_SCALE) {
        a = d = f2dot14(this.view, offset);
        offset += 2;
      } else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) {
        a = f2dot14(this.view, offset);
        d = f2dot14(this.view, offset + 2);
        offset += 4;
      } else if (flags & WE_HAVE_A_TWO_BY_TWO) {
        a = f2dot14(this.view, offset);
        b = f2dot14(this.view, offset + 2);
        c = f2dot14(this.view, offset + 4);
        d = f2dot14(this.view, offset + 6);
        offset += 8;
      }

      const transformed = this.glyphContours(component, depth + 1).map((contour) =>
        contour.map((p) => ({ x: a * p.x + c * p.y, y: b * p.x + d * p.y, on: p.on }))
      );

      let dx: number;
      let dy: number;
      if (flags & ARGS_ARE_XY_VALUES) {
        dx = arg1;
        dy = arg2;
        // Offsets are unscaled unless the font asks otherwise; this is the
        // Microsoft reading, which the flag exists to make explicit.
        if (flags & SCALED_COMPONENT_OFFSET) {
          const sx = a * dx + c * dy;
          const sy = b * dx + d * dy;
          dx = sx;
          dy = sy;
        }
      } else {
        // Point matching: move the component so its point arg2 lands on point
        // arg1 of the glyph assembled so far. Both are counted across contours.
        const parent = contours.flat()[arg1];
        const child = transformed.flat()[arg2];
        dx = parent && child ? parent.x - child.x : 0;
        dy = parent && child ? parent.y - child.y : 0;
      }

      for (const contour of transformed) {
        contours.push(contour.map((p) => ({ x: p.x + dx, y: p.y + dy, on: p.on })));
      }
    } while (flags & MORE_COMPONENTS);

    return contours;
  }
}

interface Point {
  readonly x: number;
  readonly y: number;
  readonly on: boolean;
}

const MAX_COMPOSITE_DEPTH = 16;

// Composite glyph flags.
const ARG_1_AND_2_ARE_WORDS = 0x0001;
const ARGS_ARE_XY_VALUES = 0x0002;
const WE_HAVE_A_SCALE = 0x0008;
const MORE_COMPONENTS = 0x0020;
const WE_HAVE_AN_X_AND_Y_SCALE = 0x0040;
const WE_HAVE_A_TWO_BY_TWO = 0x0080;
const SCALED_COMPONENT_OFFSET = 0x0800;

// Simple glyph flags.
const ON_CURVE = 0x01;
const X_SHORT = 0x02;
const Y_SHORT = 0x04;
const REPEAT = 0x08;
const X_SAME_OR_POSITIVE = 0x10;
const Y_SAME_OR_POSITIVE = 0x20;

function f2dot14(view: DataView, offset: number): number {
  return view.getInt16(offset) / 16384;
}

function readTableDirectory(view: DataView): Map<string, number> {
  const tables = new Map<string, number>();
  const count = view.getUint16(4);
  for (let i = 0; i < count; i++) {
    const record = 12 + i * 16;
    const tag = String.fromCharCode(
      view.getUint8(record),
      view.getUint8(record + 1),
      view.getUint8(record + 2),
      view.getUint8(record + 3)
    );
    tables.set(tag, view.getUint32(record + 8));
  }
  return tables;
}

/**
 * Chooses the best Unicode subtable and returns a lookup over it.
 *
 * Format 12 (full Unicode) is preferred when present, since format 4 cannot
 * address code points past the Basic Multilingual Plane.
 */
function readCmap(view: DataView, cmap: number, family: string): (codePoint: number) => number {
  const count = view.getUint16(cmap + 2);
  let format4: number | undefined;
  let format12: number | undefined;

  for (let i = 0; i < count; i++) {
    const record = cmap + 4 + i * 8;
    const platform = view.getUint16(record);
    const encoding = view.getUint16(record + 2);
    const subtable = cmap + view.getUint32(record + 4);
    const unicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (!unicode) continue;

    const format = view.getUint16(subtable);
    if (format === 12) format12 ??= subtable;
    else if (format === 4) format4 ??= subtable;
  }

  if (format12 !== undefined) return (codePoint) => lookupFormat12(view, format12!, codePoint);
  if (format4 !== undefined) return (codePoint) => lookupFormat4(view, format4!, codePoint);
  throw new Error(`${family}: no Unicode cmap subtable in format 4 or 12`);
}

function lookupFormat4(view: DataView, subtable: number, codePoint: number): number {
  if (codePoint > 0xffff) return 0;
  const segCount = view.getUint16(subtable + 6) / 2;
  const endCodes = subtable + 14;
  const startCodes = endCodes + segCount * 2 + 2;
  const idDeltas = startCodes + segCount * 2;
  const idRangeOffsets = idDeltas + segCount * 2;

  for (let i = 0; i < segCount; i++) {
    if (view.getUint16(endCodes + i * 2) < codePoint) continue;
    const startCode = view.getUint16(startCodes + i * 2);
    if (startCode > codePoint) return 0;

    const idDelta = view.getInt16(idDeltas + i * 2);
    const rangeOffsetAt = idRangeOffsets + i * 2;
    const idRangeOffset = view.getUint16(rangeOffsetAt);
    if (idRangeOffset === 0) return (codePoint + idDelta) & 0xffff;

    const glyph = view.getUint16(rangeOffsetAt + idRangeOffset + (codePoint - startCode) * 2);
    return glyph === 0 ? 0 : (glyph + idDelta) & 0xffff;
  }
  return 0;
}

function lookupFormat12(view: DataView, subtable: number, codePoint: number): number {
  const groups = view.getUint32(subtable + 12);
  for (let i = 0; i < groups; i++) {
    const group = subtable + 16 + i * 12;
    const startChar = view.getUint32(group);
    if (codePoint < startChar) return 0;
    if (codePoint <= view.getUint32(group + 4)) return view.getUint32(group + 8) + (codePoint - startChar);
  }
  return 0;
}

function readSimpleGlyph(view: DataView, start: number, contourCount: number): Point[][] {
  let offset = start + 10;
  const endPoints: number[] = [];
  for (let i = 0; i < contourCount; i++) {
    endPoints.push(view.getUint16(offset));
    offset += 2;
  }
  const pointCount = contourCount === 0 ? 0 : endPoints[contourCount - 1]! + 1;

  const instructionLength = view.getUint16(offset);
  offset += 2 + instructionLength;

  const flags: number[] = [];
  while (flags.length < pointCount) {
    const flag = view.getUint8(offset++);
    flags.push(flag);
    if (flag & REPEAT) {
      const repeats = view.getUint8(offset++);
      for (let r = 0; r < repeats && flags.length < pointCount; r++) flags.push(flag);
    }
  }

  const xs: number[] = [];
  let x = 0;
  for (const flag of flags) {
    if (flag & X_SHORT) {
      const delta = view.getUint8(offset++);
      x += flag & X_SAME_OR_POSITIVE ? delta : -delta;
    } else if (!(flag & X_SAME_OR_POSITIVE)) {
      x += view.getInt16(offset);
      offset += 2;
    }
    xs.push(x);
  }

  const ys: number[] = [];
  let y = 0;
  for (const flag of flags) {
    if (flag & Y_SHORT) {
      const delta = view.getUint8(offset++);
      y += flag & Y_SAME_OR_POSITIVE ? delta : -delta;
    } else if (!(flag & Y_SAME_OR_POSITIVE)) {
      y += view.getInt16(offset);
      offset += 2;
    }
    ys.push(y);
  }

  const contours: Point[][] = [];
  let first = 0;
  for (const last of endPoints) {
    const contour: Point[] = [];
    for (let i = first; i <= last; i++) contour.push({ x: xs[i]!, y: ys[i]!, on: (flags[i]! & ON_CURVE) !== 0 });
    contours.push(contour);
    first = last + 1;
  }
  return contours;
}

/**
 * Turns TrueType contours into segments.
 *
 * Two consecutive off-curve points imply an on-curve point midway between them,
 * so those are inserted first; after that every off-curve point is a quadratic
 * control point between two on-curve neighbours, and the contour is started at an
 * on-curve point. A contour of only off-curve points is legal and still works:
 * the implied midpoints supply its on-curve points.
 */
function contoursToSegments(contours: readonly Point[][]): GlyphSegment[] {
  const segments: GlyphSegment[] = [];

  for (const contour of contours) {
    if (contour.length < 2) continue;

    const expanded: Point[] = [];
    for (let i = 0; i < contour.length; i++) {
      const current = contour[i]!;
      const next = contour[(i + 1) % contour.length]!;
      expanded.push(current);
      if (!current.on && !next.on) {
        expanded.push({ x: (current.x + next.x) / 2, y: (current.y + next.y) / 2, on: true });
      }
    }

    const startIndex = expanded.findIndex((p) => p.on);
    if (startIndex === -1) continue;
    const points = [...expanded.slice(startIndex), ...expanded.slice(0, startIndex)];

    segments.push({ kind: 'move', x: points[0]!.x, y: points[0]!.y });
    let i = 1;
    while (i < points.length) {
      const point = points[i]!;
      if (point.on) {
        segments.push({ kind: 'line', x: point.x, y: point.y });
        i += 1;
      } else {
        // The contour is cyclic, so the control point after the last on-curve
        // point closes onto the start.
        const end = points[(i + 1) % points.length]!;
        segments.push({ kind: 'quad', cx: point.x, cy: point.y, x: end.x, y: end.y });
        i += 2;
      }
    }
    segments.push({ kind: 'close' });
  }

  return segments;
}
