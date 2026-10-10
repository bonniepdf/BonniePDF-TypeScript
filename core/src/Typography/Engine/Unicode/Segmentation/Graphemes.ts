// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { UnicodeText } from '../UnicodeText';
import * as U from '../Generated/LayoutUnicodeData';
// UAX #29 rev. 47, extended grapheme clusters. Offsets are original UTF-16.
export class Graphemes {
  static boundaries(text: string, maxTextLength = 65536): readonly number[] {
    const input = new UnicodeText(text, maxTextLength), p = input.points, out = [0];
    let previous = '', regional = 0, pictographic = false, zwjAfterPictographic = false, conjunct = 0;
    for (let i = 0; i < p.length; i++) {
      const current = U.graphemeClass(p[i]), incb = U.indicConjunct(p[i]), ep = U.extendedPictographic(p[i]) === 'Y';
      let join = false;
      if (i > 0) {
        if (previous === 'CR' && current === 'LF') join = true; // GB3
        else if (['Control','CR','LF'].includes(previous) || ['Control','CR','LF'].includes(current)) join = false; // GB4/5
        else if (previous === 'L' && ['L','V','LV','LVT'].includes(current)) join = true;
        else if (['LV','V'].includes(previous) && ['V','T'].includes(current)) join = true;
        else if (['LVT','T'].includes(previous) && current === 'T') join = true;
        else if (['Extend','ZWJ','SpacingMark'].includes(current) || previous === 'Prepend') join = true;
        else if (incb === 'Consonant' && conjunct === 2) join = true; // GB9c
        else if (ep && previous === 'ZWJ' && zwjAfterPictographic) join = true; // GB11
        else if (previous === 'Regional_Indicator' && current === 'Regional_Indicator' && regional % 2 === 1) join = true;
        if (!join) out.push(input.offsets[i]);
      }
      zwjAfterPictographic = current === 'ZWJ' && pictographic;
      if (ep) pictographic = true; else if (current !== 'Extend') pictographic = false;
      if (incb === 'Consonant') conjunct = 1;
      else if (incb === 'Linker' && conjunct > 0) conjunct = 2;
      else if (incb !== 'Extend' && incb !== 'Linker') conjunct = 0;
      regional = current === 'Regional_Indicator' ? regional + 1 : 0; previous = current;
    }
    if (p.length) out.push(text.length);
    return Object.freeze(out);
  }
}
