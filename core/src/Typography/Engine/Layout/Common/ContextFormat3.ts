// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { checked } from '../../Data/Integer';
import { CoverageMap } from './CoverageMap';
import type { LayoutReadCache } from './OpenTypeLayout';

// A context subtable of format 3 (GSUB 5/6, GPOS 7/8), read and checked once. Such a
// subtable names a coverage table per position, and a glyph its first input coverage does
// not list cannot start a match. Matching it anyway walks back over the backtrack before
// reaching that test, so the lookup charges the walk; the caller charges the same steps
// from this plan without reading the subtable. Built only when every count, array and
// coverage table a failed match reads is in bounds and maps exactly (CoverageMap), so a
// skipped match could not have thrown.
export class ContextFormat3 {
  private constructor(
    readonly chained: boolean,
    readonly backtrack: CoverageMap[],
    readonly firstInput: CoverageMap,
    readonly firstInputOffset: number,
    readonly inputCount: number) {}

  // The plan for the format 3 subtable at sub, or null for any other subtable or one whose
  // failed match reads something that could throw.
  static tryBuild(data: BigEndianData, reads: LayoutReadCache, sub: number, chained: boolean): ContextFormat3 | null {
    try {
      if (data.u16(sub) !== 3) return null;
      let p = sub + 2;
      const backtrack: CoverageMap[] = [];
      if (chained) {
        const back = data.u16(p);
        p += 2;
        data.check(p, back * 2);
        for (let i = 0; i < back; i++) {
          const map = reads.coverageMap(data, checked(sub + data.u16(p + i * 2)));
          if (map === null) return null;
          backtrack.push(map);
        }
        p += back * 2;
      }
      const input = data.u16(p);
      p += 2;
      if (!chained) { data.u16(p); p += 2; }
      if (input < 1) return null;
      data.check(p, input * 2);
      const firstOffset = checked(sub + data.u16(p));
      const first = reads.coverageMap(data, firstOffset);
      if (first === null) return null;
      p += input * 2;
      if (chained) {
        const ahead = data.u16(p);
        p += 2;
        data.check(p, ahead * 2);
        p += ahead * 2;
        data.u16(p);
      }
      return new ContextFormat3(chained, backtrack, first, firstOffset, input);
    } catch {
      return null;
    }
  }
}

// The number of planned contexts whose input is no longer than the run.
export function inputsWithin(plans: (ContextFormat3 | null)[] | null, count: number): number {
  if (plans === null) return 0;
  let within = 0;
  for (const plan of plans) if (plan !== null && plan.inputCount <= count) within++;
  return within;
}

// What the backtrack tests of a context with a longer backtrack charge for a rejected glyph,
// without glyph filtering: each step back is one walk step, and the tests stop at the first
// glyph the backtrack coverage does not list. The walk to the first backtrack glyph is part
// of the lookup's constant charge.
export function backtrackCharge(plans: (ContextFormat3 | null)[] | null, glyphs: { readonly id: number }[], at: number): number {
  if (plans === null) return 0;
  let ticks = 0;
  for (const plan of plans) {
    if (plan === null || plan.backtrack.length < 2 || plan.backtrack.length > glyphs.length) continue;
    const backtrack = plan.backtrack;
    for (let j = 0, position = at - 1; j < backtrack.length; j++) {
      ticks++;
      if (position < 0 || !backtrack[j].covers(glyphs[position].id)) break;
      if (j + 1 < backtrack.length) { ticks++; position--; }
    }
  }
  return ticks;
}
