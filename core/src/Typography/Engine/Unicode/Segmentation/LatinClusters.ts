// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { scalars as textScalars } from './TextScalars';
import { unsupported } from '../../Api/FontError';
import * as Unicode from '../Generated/UnicodeData';
import type { ScalarCluster } from './ScalarCluster';
/** Opt-in small bundle: Latin letters, combining marks and ordinary common punctuation.
 * Selectors/joiners and characters outside these documented blocks require Shaper.
 * These are the entry point's supported blocks, not an emoji classification table.
 */
export function scalars(text: string): number[] {
  const result = textScalars(text);
  for (const cp of result) {
    const accepted = cp <= 0x36f || (cp >= 0x1d00 && cp <= 0x1eff) ||
      (cp >= 0x2000 && cp <= 0x200b) || (cp >= 0x2010 && cp <= 0x2029) || (cp >= 0x202f && cp <= 0x2065) ||
      (cp >= 0x20a0 && cp <= 0x20cf) || (cp >= 0x2100 && cp <= 0x214f) || (cp >= 0x2c60 && cp <= 0x2c7f) ||
      (cp >= 0xa720 && cp <= 0xa7ff) || (cp >= 0xab30 && cp <= 0xab6f) || (cp >= 0xfb00 && cp <= 0xfb06) || cp === 0xfeff;
    if (!accepted) unsupported('Character is outside the Latin bundle scope; use the full Shaper.');
  }
  return result;
}
export function split(points: readonly number[]): ScalarCluster[] {
  const result: ScalarCluster[] = [];
  for (let i = 0; i < points.length; i++) {
    if (i > 0 && Unicode.isMark(points[i])) result[result.length - 1].end = i + 1;
    else result.push({ start: i, end: i + 1, emoji: false, textPresentation: false, sequenceKind: 0 });
  }
  return result;
}
