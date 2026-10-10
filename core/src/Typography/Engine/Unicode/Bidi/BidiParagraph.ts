// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { FontError } from '../../Api/FontError';
import { UnicodeText } from '../UnicodeText';
import { mirror } from '../Generated/UnicodeData';
import { BidiLine } from './BidiLine';
export class BidiParagraph {
  readonly levels: readonly number[];
  readonly originalTypes: readonly string[];
  constructor(readonly input: UnicodeText, readonly paragraphLevel: number, levels: number[], types: string[]) {
    this.levels = Object.freeze(levels); this.originalTypes = Object.freeze(types); Object.freeze(this);
  }
  reorderLine(start = 0, end = this.input.text.length): BidiLine {
    const first = this.input.offsets.indexOf(start), last = this.input.offsets.indexOf(end);
    if (first < 0 || last < first) throw new FontError('ArgumentException', 'Line range must contain complete scalars inside the paragraph.');
    const levels = this.levels.slice(first, last), types = this.originalTypes;
    // L1: X9 characters are absent. Whitespace/isolate resets use ORIGINAL types.
    const white = (i: number) => ['WS','FSI','LRI','RLI','PDI'].includes(types[i]);
    for (let i = first; i < last; i++) if (types[i] === 'S' || types[i] === 'B') {
      levels[i-first] = this.paragraphLevel;
      for (let j = i-1; j >= first; j--) { if (levels[j-first] < 0) continue; if (!white(j)) break; levels[j-first] = this.paragraphLevel; }
    }
    for (let j = last-1; j >= first; j--) { if (levels[j-first] < 0) continue; if (!white(j)) break; levels[j-first] = this.paragraphLevel; }
    const map: number[] = []; let max = 0, minOdd = 127;
    for (let i = first; i < last; i++) if (levels[i-first] >= 0) {
      map.push(i); max = Math.max(max, levels[i-first]); if (levels[i-first] % 2) minOdd = Math.min(minOdd, levels[i-first]);
    }
    for (let level = max; level >= minOdd; level--) for (let i = 0; i < map.length;) {
      if (levels[map[i]-first] < level) { i++; continue; }
      let endRun = i; while (endRun < map.length && levels[map[endRun]-first] >= level) endRun++;
      for (let a = i, b = endRun-1; a < b; a++, b--) { const temp = map[a]; map[a] = map[b]; map[b] = temp; }
      i = endRun;
    }
    return new BidiLine(levels, map.map(i => this.input.offsets[i]), map.map(i => levels[i-first] % 2 ? mirror(this.input.points[i]) : this.input.points[i]));
  }
}
