// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { joiningType, isModifier } from '../../Unicode/Generated/ArabicData';
import * as Unicode from '../../Unicode/Generated/UnicodeData';
import type { SourceScalar } from '../../Unicode/Normalization/SourceScalar';
import type { ShapingGlyph } from '../../Layout/Common/ShapingGlyph';
import type { FontFace } from '../../Fonts/FontFace';
/** UAX #53 transient mark ordering; source text and standalone NFC stay unchanged. */
export function reorderArabic(face: FontFace, input: SourceScalar[]): SourceScalar[] {
  const out: SourceScalar[] = [];
  for (let i = 0; i < input.length;) {
    if (!Unicode.combiningClass(input[i].scalar)) { out.push({ ...input[i++] }); continue; }
    let end = i; while (end < input.length && Unicode.combiningClass(input[end].scalar)) end++;
    const segment = input.slice(i,end), before: SourceScalar[] = [], taken = new Set<number>();
    for (const c of [220,230]) {
      for (let j = 0; j < segment.length; j++) {
        if (Unicode.combiningClass(segment[j].scalar) !== c) continue;
        if (!isModifier(segment[j].scalar)) break;
        before.push(segment[j]); taken.add(j);
      }
    }
    for (let j = 0; j < segment.length; j++) if (Unicode.combiningClass(segment[j].scalar) === 33) { before.push(segment[j]); taken.add(j); }
    for (const token of before) out.push(token);
    for (let j = 0; j < segment.length; j++) if (!taken.has(j)) out.push(segment[j]);
    i = end;
  }
  const result: SourceScalar[] = [];
  for (const t of out) {
    const prior = result[result.length-1], cp = prior ? Unicode.compose(prior.scalar,t.scalar) : -1;
    if (prior && cp >= 0 && face.covers(cp)) { prior.scalar = cp; prior.start = Math.min(prior.start,t.start); prior.end = Math.max(prior.end,t.end); }
    else result.push({ ...t });
  }
  return result;
}
/** Unicode joining types: transparent marks do not break a connection. */
export function joinArabic(run: ShapingGlyph[]): void {
  let prior = -1, previous = 'U';
  for (let i = 0; i < run.length; i++) {
    const type = joiningType(run[i].scalar); if (type === 'T') continue;
    run[i].joiningForm = 'RDL'.includes(type) ? 'isol' : '';
    if (prior >= 0 && 'DLC'.includes(previous) && 'DRC'.includes(type)) {
      if (run[prior].joiningForm) run[prior].joiningForm = run[prior].joiningForm === 'fina' ? 'medi' : 'init';
      if (run[i].joiningForm) run[i].joiningForm = 'fina';
      for (let j = prior; j <= i; j++) if (run[j].cluster !== Math.min(run[prior].cluster,run[i].cluster)) run[j].unsafeBefore = true;
    }
    prior = i; previous = type;
  }
}
