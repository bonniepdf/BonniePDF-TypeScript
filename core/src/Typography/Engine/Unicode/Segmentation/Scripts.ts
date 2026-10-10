// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { FontError } from '../../Api/FontError';
import { UnicodeText } from '../UnicodeText';
import * as U from '../Generated/LayoutUnicodeData';
import { Graphemes } from './Graphemes';
import { ScriptRun } from './ScriptRun';
// UAX #24 properties with a documented consumer policy for weak characters.
// Extensions intersect; weak characters prefer the preceding run, leading weak
// characters follow the first strong script. Paired punctuation keeps its opener's
// script. No run boundary splits an extended grapheme cluster.
export class Scripts {
  static runs(text: string, maxTextLength = 65536): readonly ScriptRun[] {
    const input = new UnicodeText(text, maxTextLength), boundaries = new Set(Graphemes.boundaries(text, maxTextLength));
    const stack: { close: number; script: string | null }[] = [], result: ScriptRun[] = [];
    let candidates: string[] = [], preferred = '', start = 0, anchored = false;
    const choose = () => !anchored ? 'Zyyy' : candidates.includes(preferred) ? preferred : candidates.length ? candidates[0] : 'Zyyy';
    for (let i = 0; i < input.points.length; i++) {
      const cp = input.points[i], offset = input.offsets[i], kind = U.bracket(cp, true), primary = U.script(cp), ext = U.scriptExtensions(cp);
      let next = (ext ? ext.split(',') : [primary]).filter(s => s !== 'Zyyy' && s !== 'Zinh');
      if (kind === 2) for (let j = stack.length-1; j >= 0; j--) {
        const close = stack[j].close;
        if ((close === 0x232a ? 0x3009 : close) === (cp === 0x232a ? 0x3009 : cp)) {
          if (stack[j].script) next = [stack[j].script!]; stack.length = j; break;
        }
      }
      if (next.length) {
        const intersection = candidates.filter(s => next.includes(s));
        if (!candidates.length) candidates = next;
        else if (intersection.length) candidates = intersection;
        else if (!anchored) candidates = next;
        else if (boundaries.has(offset)) { preferred = choose(); result.push(new ScriptRun(start, offset, preferred)); start = offset; candidates = next; anchored = false; }
        if (primary !== 'Zinh') anchored = true;
        const selected = choose(); if (anchored) for (const entry of stack) if (entry.script === null) entry.script = selected;
      }
      if (kind === 1) {
        if (stack.length === 128) throw new FontError('InvalidOperationException', 'Script bracket nesting limit exceeded.');
        stack.push({ close: U.bracket(cp), script: anchored ? choose() : null });
      }
    }
    if (input.points.length) result.push(new ScriptRun(start, text.length, choose()));
    return Object.freeze(result);
  }
}
