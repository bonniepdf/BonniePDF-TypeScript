// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { FontFace } from '../../Fonts/FontFace';
import type { SourceScalar } from '../../Unicode/Normalization/SourceScalar';
import { compose } from '../../Unicode/Generated/HebrewData';
import { combiningClass } from '../../Unicode/Generated/UnicodeData';
// Rendering order established through the public HarfBuzz API, not source code.
// Preserve standard CCC outside the fixed-position Hebrew points.
export function hebrewClass(cp: number): number {
  const c = combiningClass(cp);
  return c >= 10 && c <= 25 ? '\u0016\u000f\u0010\u0011\u0017\u0012\u0013\u0014\u0015\u000e\u0018\u000c\u0019\u000d\u000a\u000b'.charCodeAt(c-10) : c;
}
// Presentation composition is a font fallback, not Unicode NFC.
export function composeHebrew(face: FontFace, input: SourceScalar[]): SourceScalar[] {
  if (face.font.hasTable('GPOS')) return input;
  const out: SourceScalar[] = [];
  let starter = -1, lastClass = 0;
  for (let i = 0; i < input.length; i++) {
    let item = { ...input[i] };
    if (item.scalar === 0x5e9 && [0x5c1,0x5c2].includes(input[i+1]?.scalar) && input[i+2]?.scalar === 0x5bc) {
      const cp = input[i+1].scalar === 0x5c1 ? 0xfb2c : 0xfb2d;
      if (face.covers(cp)) { item = { scalar: cp,start: Math.min(item.start,input[i+1].start,input[i+2].start),end: Math.max(item.end,input[i+1].end,input[i+2].end) }; i += 2; }
    }
    const ccc = hebrewClass(item.scalar), prior = starter >= 0 ? out[starter] : undefined;
    const cp = prior && (lastClass < ccc || lastClass === 0) ? compose(prior.scalar,item.scalar) : -1;
    if (prior && cp >= 0 && face.covers(cp)) { prior.scalar = cp; prior.start = Math.min(prior.start,item.start); prior.end = Math.max(prior.end,item.end); }
    else { if (ccc === 0) starter = out.length; out.push(item); lastClass = ccc; }
  }
  return out;
}
