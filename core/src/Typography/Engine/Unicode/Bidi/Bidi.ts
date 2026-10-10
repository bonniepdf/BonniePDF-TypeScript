// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { FontError } from '../../Api/FontError';
import { UnicodeText } from '../UnicodeText';
import * as U from '../Generated/LayoutUnicodeData';
import { BidiParagraph } from './BidiParagraph';
export type BaseDirection = 'auto' | 'ltr' | 'rtl';
// Independently implemented from UAX #9 rev. 51. Explicit depth is fixed at 125.
export class Bidi {
  static resolveParagraph(text: string, baseDirection: BaseDirection = 'auto', maxTextLength = 65536, maxOperations = 10000000): BidiParagraph {
    if (!['auto','ltr','rtl'].includes(baseDirection) || !Number.isInteger(maxOperations) || maxOperations < 1 || maxOperations > 2147483647) throw new FontError('ArgumentException', 'Invalid bidi options.');
    const input = new UnicodeText(text, maxTextLength), points = input.points, n = points.length;
    const original = points.map(U.bidiClass), types = original.slice();
    for (let i = 0; i < n-1; i++) if (original[i] === 'B' && !(i === n-2 && points[i] === 13 && points[i+1] === 10)) throw new FontError('ArgumentException', 'Resolve one paragraph at a time, including its final separator.');
    let operations = 0;
    const tick = () => { if (++operations > maxOperations) throw new FontError('InvalidOperationException', 'Unicode operation limit exceeded.'); };
    const isolate = (t: string) => ['FSI','LRI','RLI'].includes(t);
    const removed = (t: string) => ['LRE','RLE','LRO','RLO','PDF','BN'].includes(t);
    const direction = (level: number) => level % 2 ? 'R' : 'L';
    const strong = (t: string) => ['EN','AN'].includes(t) ? 'R' : t;
    const matching = new Array<number>(n).fill(-1), isolateStack: number[] = [];
    for (let i = 0; i < n; i++) { tick(); if (isolate(original[i])) isolateStack.push(i); else if (original[i] === 'PDI' && isolateStack.length) { const open = isolateStack.pop()!; matching[open] = i; matching[i] = open; } }
    const firstStrong = (start: number, end: number): string => {
      for (let i = start; i < end; i++) { tick(); const t = original[i];
        if (t === 'L') return 'L'; if (t === 'R' || t === 'AL') return 'R';
        if (isolate(t)) i = matching[i] >= 0 ? matching[i] : end;
      } return 'L';
    };
    const paragraphLevel = baseDirection === 'rtl' ? 1 : baseDirection === 'ltr' ? 0 : firstStrong(0, n) === 'R' ? 1 : 0;
    const levels = new Array<number>(n).fill(paragraphLevel);
    const stack: { level: number; override: string; isolated: boolean }[] = [{ level: paragraphLevel, override: '', isolated: false }];
    let overflowIsolate = 0, overflowEmbedding = 0, validIsolate = 0;
    for (let i = 0; i < n; i++) {
      tick(); const t = original[i]; let top = stack[stack.length-1]; levels[i] = top.level;
      if (['RLE','LRE','RLO','LRO'].includes(t) || isolate(t)) {
        const iso = isolate(t), right = t === 'FSI' ? firstStrong(i+1, matching[i] < 0 ? n : matching[i]) === 'R' : ['RLE','RLO','RLI'].includes(t);
        const next = top.level + (right ? (top.level % 2 ? 2 : 1) : (top.level % 2 ? 1 : 2));
        if (iso && top.override) types[i] = top.override;
        if (next <= 125 && overflowIsolate === 0 && overflowEmbedding === 0) {
          stack.push({ level: next, override: t === 'RLO' ? 'R' : t === 'LRO' ? 'L' : '', isolated: iso });
          if (iso) validIsolate++;
        } else if (iso) overflowIsolate++; else if (!overflowIsolate) overflowEmbedding++;
      } else if (t === 'PDI') {
        if (overflowIsolate) overflowIsolate--;
        else if (validIsolate) {
          overflowEmbedding = 0; while (!stack[stack.length-1].isolated) stack.pop(); stack.pop(); validIsolate--;
        }
        top = stack[stack.length-1]; levels[i] = top.level; if (top.override) types[i] = top.override;
      } else if (t === 'PDF') {
        if (!overflowIsolate) { if (overflowEmbedding) overflowEmbedding--; else if (stack.length > 1 && !top.isolated) stack.pop(); }
      } else if (t === 'B') levels[i] = paragraphLevel;
      else if (t !== 'BN' && top.override) types[i] = top.override;
    }
    // X9/X10: construct level runs, then link valid isolate initiators to PDIs.
    const active: number[] = [], positions = new Array<number>(n).fill(-1);
    for (let i = 0; i < n; i++) if (!removed(original[i])) { positions[i] = active.length; active.push(i); } else levels[i] = -1;
    const runs: number[][] = [], runOf = new Array<number>(n).fill(-1);
    for (const i of active) {
      if (!runs.length || levels[i] !== levels[runs[runs.length-1][0]]) runs.push([]);
      runOf[i] = runs.length-1; runs[runs.length-1].push(i);
    }
    const links = new Array<number>(runs.length).fill(-1), incoming = new Array<boolean>(runs.length).fill(false);
    for (let r = 0; r < runs.length; r++) {
      const end = runs[r][runs[r].length-1], close = matching[end];
      if (isolate(original[end]) && close >= 0 && runOf[close] !== r && levels[end] === levels[close]) { links[r] = runOf[close]; incoming[runOf[close]] = true; }
    }
    const explicit = levels.slice();
    for (let r = 0; r < runs.length; r++) if (!incoming[r]) {
      const seq: number[] = [];
      for (let at = r; at >= 0; at = links[at]) for (const i of runs[at]) seq.push(i);
      const first = seq[0], last = seq[seq.length-1], before = positions[first]-1, after = positions[last]+1;
      const sos = direction(Math.max(explicit[first], before < 0 ? paragraphLevel : explicit[active[before]]));
      const eos = direction(Math.max(explicit[last], after >= active.length || isolate(original[last]) ? paragraphLevel : explicit[active[after]]));
      const t = seq.map(i => types[i]), embedding = direction(explicit[first]);
      let prev = sos;
      for (let j = 0; j < t.length; j++) { tick(); if (t[j] === 'NSM') t[j] = isolate(prev) || prev === 'PDI' ? 'ON' : prev; prev = t[j]; }
      prev = sos;
      for (let j = 0; j < t.length; j++) { if (['R','L','AL'].includes(t[j])) prev = t[j]; else if (t[j] === 'EN' && prev === 'AL') t[j] = 'AN'; }
      for (let j = 0; j < t.length; j++) if (t[j] === 'AL') t[j] = 'R';
      for (let j = 1; j+1 < t.length; j++) {
        if (t[j] === 'ES' && t[j-1] === 'EN' && t[j+1] === 'EN') t[j] = 'EN';
        else if (t[j] === 'CS' && t[j-1] === t[j+1] && ['EN','AN'].includes(t[j-1])) t[j] = t[j-1];
      }
      for (let j = 0; j < t.length;) {
        if (t[j] !== 'ET') { j++; continue; } let end = j+1; while (end < t.length && t[end] === 'ET') end++;
        if ((j > 0 && t[j-1] === 'EN') || (end < t.length && t[end] === 'EN')) for (let k = j; k < end; k++) t[k] = 'EN'; j = end;
      }
      for (let j = 0; j < t.length; j++) if (['ES','ET','CS'].includes(t[j])) t[j] = 'ON';
      prev = sos;
      for (let j = 0; j < t.length; j++) { if (t[j] === 'R' || t[j] === 'L') prev = t[j]; else if (t[j] === 'EN' && prev === 'L') t[j] = 'L'; }
      // BD16/N0: bounded bracket stack, pairs processed in opening order.
      const opens: number[] = [], pairs: [number,number][] = [];
      for (let j = 0; j < t.length; j++) if (t[j] === 'ON') {
        const cp = points[seq[j]], kind = U.bracket(cp, true);
        if (kind === 1) { if (opens.length === 63) { pairs.length = 0; break; } opens.push(j); }
        else if (kind === 2) for (let k = opens.length-1; k >= 0; k--) {
          tick(); const pair = U.bracket(points[seq[opens[k]]]);
          if ((pair === 0x232a ? 0x3009 : pair) === (cp === 0x232a ? 0x3009 : cp)) { pairs.push([opens[k],j]); opens.length = k; break; }
        }
      }
      pairs.sort((a,b) => a[0]-b[0]);
      for (const [open,close] of pairs) {
        let found = '', context = sos;
        for (let j = open+1; j < close; j++) { tick(); const v = strong(t[j]); if (v === embedding) { found = embedding; break; } if (v === 'L' || v === 'R') found = v; }
        if (!found) continue;
        if (found !== embedding) {
          for (let j = open-1; j >= 0; j--) { tick(); const v = strong(t[j]); if (v === 'L' || v === 'R') { context = v; break; } }
          found = context;
        }
        t[open] = found; t[close] = found;
        for (const bracket of [open,close]) for (let j = bracket+1; j < t.length && original[seq[j]] === 'NSM'; j++) { tick(); t[j] = found; }
      }
      const neutral = (v: string) => ['B','S','WS','ON','FSI','LRI','RLI','PDI'].includes(v);
      for (let j = 0; j < t.length;) {
        if (!neutral(t[j])) { j++; continue; } let end = j+1; while (end < t.length && neutral(t[end])) end++;
        const left = j ? strong(t[j-1]) : sos, right = end < t.length ? strong(t[end]) : eos, result = left === right ? left : embedding;
        for (let k = j; k < end; k++) t[k] = result; j = end;
      }
      for (let j = 0; j < seq.length; j++) { const i = seq[j], odd = explicit[i] % 2; levels[i] += odd ? (t[j] === 'R' ? 0 : 1) : t[j] === 'R' ? 1 : ['EN','AN'].includes(t[j]) ? 2 : 0; }
    }
    return new BidiParagraph(input, paragraphLevel, levels, original);
  }
}
