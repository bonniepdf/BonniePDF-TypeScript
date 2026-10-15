// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { LookupRule } from './LookupRule';
import { FirstGlyphSet } from './FirstGlyphSet';
import { ContextFormat3 } from './ContextFormat3';

// What GSUB and GPOS work out for one selected lookup before walking the run. It depends only
// on the font, the options and the limits, which a program fixes, so a program keeps one per
// selected lookup instead of recomputing it on every shape call. The operations spent working
// it out (the feature rule search in GPOS, the reverse-chaining test in GSUB) are recorded and
// charged again on each later call, so a call's charges are unchanged. A step whose working
// out throws is never kept.
export class LookupStep {
  rule: LookupRule | null = null;
  first: FirstGlyphSet | null = null;
  rejectedCharge = -1;
  inputCharge = 0;
  charged: (ContextFormat3 | null)[] | null = null;
  reverse = false;
  ticks = 0;
}
