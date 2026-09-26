// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
/**
 * Pair kerning, read from the public OpenType specification.
 *
 * Kerning is the one piece of shaping Latin text cannot do without: both reference
 * renderers apply it, and without it a word like "AVAWATYo" is visibly loose. It
 * is read from GPOS `kern` pair adjustments (lookup type 2, formats 1 and 2, also
 * inside type-9 extension lookups), falling back to a legacy `kern` table (format
 * 0) only when GPOS has no `kern` feature - the same precedence HarfBuzz applies.
 *
 * Deliberately narrow:
 *
 * - Lookups come from the `latn` script's default language system, else `DFLT`.
 *   A font whose Greek or Cyrillic kerning differs from its Latin kerning is
 *   kerned as Latin.
 * - Only the first glyph's XAdvance is applied. Placement adjustments and the
 *   second glyph's value record move a glyph without moving the pen; they are
 *   rare in kerning and are ignored.
 * - Lookup flags (ignore marks, and so on) are not honoured: a pair is two
 *   adjacent glyphs.
 */

/** A pair-kerning table: the pen adjustment between two glyphs, in font units. */
export type KerningTable = (left: number, right: number) => number;

const NO_KERNING: KerningTable = () => 0;

/** Reads a face's kerning from its GPOS or kern table offsets, when present. */
export function readKerning(view: DataView, gpos: number | undefined, kern: number | undefined): KerningTable {
  const subtables = gpos !== undefined ? gposPairSubtables(view, gpos) : undefined;
  if (subtables !== undefined) {
    if (subtables.length === 0) return NO_KERNING;
    const cache = new Map<number, number>();
    return (left, right) => {
      const key = left * 65536 + right;
      let value = cache.get(key);
      if (value === undefined) {
        value = 0;
        // One adjustment per lookup: the first subtable that covers the pair.
        for (const lookup of subtables) {
          for (const subtable of lookup) {
            const adjustment = pairAdjustment(view, subtable, left, right);
            if (adjustment !== undefined) {
              value += adjustment;
              break;
            }
          }
        }
        cache.set(key, value);
      }
      return value;
    };
  }
  return kern !== undefined ? legacyKern(view, kern) : NO_KERNING;
}

/**
 * The PairPos subtables of each `kern` lookup, in lookup-list order; an empty
 * list when the feature exists but has nothing usable, and undefined when GPOS
 * has no `kern` feature for the script at all - which is what lets a legacy
 * `kern` table apply.
 */
function gposPairSubtables(view: DataView, gpos: number): number[][] | undefined {
  const scriptList = gpos + view.getUint16(gpos + 4);
  const featureList = gpos + view.getUint16(gpos + 6);
  const lookupList = gpos + view.getUint16(gpos + 8);

  const langSys = defaultLangSys(view, scriptList, 'latn') ?? defaultLangSys(view, scriptList, 'DFLT');
  if (langSys === undefined) return undefined;

  const lookups = new Set<number>();
  let found = false;
  const featureCount = view.getUint16(langSys + 4);
  for (let i = 0; i < featureCount; i++) {
    const featureIndex = view.getUint16(langSys + 6 + i * 2);
    const record = featureList + 2 + featureIndex * 6;
    if (tag(view, record) !== 'kern') continue;
    found = true;
    const feature = featureList + view.getUint16(record + 4);
    const lookupCount = view.getUint16(feature + 2);
    for (let j = 0; j < lookupCount; j++) lookups.add(view.getUint16(feature + 4 + j * 2));
  }
  if (!found) return undefined;

  const result: number[][] = [];
  for (const index of [...lookups].sort((a, b) => a - b)) {
    const lookup = lookupList + view.getUint16(lookupList + 2 + index * 2);
    const type = view.getUint16(lookup);
    const count = view.getUint16(lookup + 4);
    const subtables: number[] = [];
    for (let i = 0; i < count; i++) {
      let subtable = lookup + view.getUint16(lookup + 6 + i * 2);
      let subtableType = type;
      if (type === 9) {
        subtableType = view.getUint16(subtable + 2);
        subtable += view.getUint32(subtable + 4);
      }
      if (subtableType === 2) subtables.push(subtable);
    }
    if (subtables.length > 0) result.push(subtables);
  }
  return result;
}

function defaultLangSys(view: DataView, scriptList: number, script: string): number | undefined {
  const count = view.getUint16(scriptList);
  for (let i = 0; i < count; i++) {
    const record = scriptList + 2 + i * 6;
    if (tag(view, record) !== script) continue;
    const table = scriptList + view.getUint16(record + 4);
    const offset = view.getUint16(table);
    return offset === 0 ? undefined : table + offset;
  }
  return undefined;
}

/** The first glyph's XAdvance adjustment from one PairPos subtable, or undefined if it does not cover the pair. */
function pairAdjustment(view: DataView, subtable: number, left: number, right: number): number | undefined {
  const format = view.getUint16(subtable);
  const coverageIndex = coverage(view, subtable + view.getUint16(subtable + 2), left);
  if (coverageIndex < 0) return undefined;
  const format1 = view.getUint16(subtable + 4);
  const format2 = view.getUint16(subtable + 6);
  const size1 = valueRecordSize(format1);
  const size2 = valueRecordSize(format2);

  if (format === 1) {
    const pairSet = subtable + view.getUint16(subtable + 10 + coverageIndex * 2);
    const count = view.getUint16(pairSet);
    const recordSize = 2 + size1 + size2;
    // PairValueRecords are sorted by second glyph.
    let low = 0;
    let high = count - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      const record = pairSet + 2 + middle * recordSize;
      const second = view.getUint16(record);
      if (second === right) return xAdvance(view, record + 2, format1);
      if (second < right) low = middle + 1;
      else high = middle - 1;
    }
    return undefined;
  }

  if (format === 2) {
    const class1 = classOf(view, subtable + view.getUint16(subtable + 8), left);
    const class2 = classOf(view, subtable + view.getUint16(subtable + 10), right);
    const class1Count = view.getUint16(subtable + 12);
    const class2Count = view.getUint16(subtable + 14);
    if (class1 >= class1Count || class2 >= class2Count) return undefined;
    const record = subtable + 16 + (class1 * class2Count + class2) * (size1 + size2);
    return xAdvance(view, record, format1);
  }
  return undefined;
}

/** A ValueRecord's size: two bytes per bit set in the low byte of its format. */
function valueRecordSize(format: number): number {
  let size = 0;
  for (let bit = 0; bit < 8; bit++) if (format & (1 << bit)) size += 2;
  return size;
}

/** The XAdvance field of a ValueRecord, which follows XPlacement and YPlacement when present. */
function xAdvance(view: DataView, record: number, format: number): number {
  if ((format & 0x0004) === 0) return 0;
  let offset = record;
  if (format & 0x0001) offset += 2;
  if (format & 0x0002) offset += 2;
  return view.getInt16(offset);
}

/** A glyph's index in a Coverage table, or -1. */
function coverage(view: DataView, table: number, glyph: number): number {
  const format = view.getUint16(table);
  const count = view.getUint16(table + 2);
  let low = 0;
  let high = count - 1;
  if (format === 1) {
    while (low <= high) {
      const middle = (low + high) >> 1;
      const value = view.getUint16(table + 4 + middle * 2);
      if (value === glyph) return middle;
      if (value < glyph) low = middle + 1;
      else high = middle - 1;
    }
  } else if (format === 2) {
    while (low <= high) {
      const middle = (low + high) >> 1;
      const record = table + 4 + middle * 6;
      const start = view.getUint16(record);
      const end = view.getUint16(record + 2);
      if (glyph < start) high = middle - 1;
      else if (glyph > end) low = middle + 1;
      else return view.getUint16(record + 4) + glyph - start;
    }
  }
  return -1;
}

/** A glyph's class in a ClassDef table; 0 when unlisted. */
function classOf(view: DataView, table: number, glyph: number): number {
  const format = view.getUint16(table);
  if (format === 1) {
    const start = view.getUint16(table + 2);
    const count = view.getUint16(table + 4);
    return glyph >= start && glyph < start + count ? view.getUint16(table + 6 + (glyph - start) * 2) : 0;
  }
  if (format === 2) {
    const count = view.getUint16(table + 2);
    let low = 0;
    let high = count - 1;
    while (low <= high) {
      const middle = (low + high) >> 1;
      const record = table + 4 + middle * 6;
      const start = view.getUint16(record);
      const end = view.getUint16(record + 2);
      if (glyph < start) high = middle - 1;
      else if (glyph > end) low = middle + 1;
      else return view.getUint16(record + 4);
    }
  }
  return 0;
}

/** A legacy `kern` table: horizontal format-0 subtables, summed. */
function legacyKern(view: DataView, kern: number): KerningTable {
  const subtables: number[] = [];
  const count = view.getUint16(kern + 2);
  let offset = kern + 4;
  for (let i = 0; i < count; i++) {
    const length = view.getUint16(offset + 2);
    const coverageBits = view.getUint16(offset + 4);
    // Format 0, horizontal, kerning values rather than minimums, not cross-stream.
    if (coverageBits >> 8 === 0 && (coverageBits & 0x0007) === 0x0001) subtables.push(offset + 6);
    offset += length;
  }
  if (subtables.length === 0) return NO_KERNING;

  return (left, right) => {
    const key = left * 65536 + right;
    let total = 0;
    for (const table of subtables) {
      const pairs = view.getUint16(table);
      let low = 0;
      let high = pairs - 1;
      while (low <= high) {
        const middle = (low + high) >> 1;
        const record = table + 8 + middle * 6;
        const pair = view.getUint16(record) * 65536 + view.getUint16(record + 2);
        if (pair === key) {
          total += view.getInt16(record + 4);
          break;
        }
        if (pair < key) low = middle + 1;
        else high = middle - 1;
      }
    }
    return total;
  };
}

function tag(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}
