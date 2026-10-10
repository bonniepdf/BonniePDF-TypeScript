// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { UnicodeText } from '../UnicodeText';
import * as U from '../Generated/LayoutUnicodeData';
export type BreakOpportunity = Readonly<{ offset: number; mandatory: boolean }>;
export type LineBreakTailoring = (offset: number, defaultAllowed: boolean) => boolean;
// UAX #14 rev. 55. Tailoring is applied only after non-tailorable rules LB2–12.
export class LineBreak {
  static opportunities(text: string, tailoring?: LineBreakTailoring, maxTextLength = 65536): readonly BreakOpportunity[] {
    const input = new UnicodeText(text, maxTextLength), points = input.points, n = points.length;
    if (!n) return Object.freeze([Object.freeze({ offset: 0, mandatory: true })]);
    const raw = points.map(cp => {
      const c = U.lineClass(cp);
      if (['AI','SG','XX'].includes(c)) return 'AL';
      if (c === 'SA') return ['Mn','Mc'].includes(U.lineCategory(cp)) ? 'CM' : 'AL';
      return c === 'CJ' ? 'NS' : c;
    });
    const classes: string[] = [], categories: string[] = [], east: boolean[] = [], cps: number[] = [];
    const significant: number[] = [], inherited: boolean[] = [];
    for (let i = 0; i < n; i++) {
      const cm = raw[i] === 'CM' || raw[i] === 'ZWJ';
      inherited[i] = cm && classes.length > 0 && !['BK','CR','LF','NL','SP','ZW'].includes(classes[classes.length - 1]);
      if (!inherited[i]) {
        classes.push(cm ? 'AL' : raw[i]); cps.push(cm ? 65 : points[i]); categories.push(cm ? 'Lu' : U.lineCategory(points[i]));
        east.push(!cm && U.eastAsianFlag(points[i]) === 'Y');
      }
      significant[i] = classes.length - 1;
    }
    const nonspace: number[] = [], numeric: boolean[] = [], ri: number[] = [];
    for (let j = 0; j < classes.length; j++) {
      const c = classes[j]; nonspace[j] = c === 'SP' ? (j ? nonspace[j-1] : -1) : j;
      numeric[j] = c === 'NU' || (['SY','IS'].includes(c) && j > 0 && numeric[j-1]);
      ri[j] = c === 'RI' ? (j ? ri[j-1] : 0) + 1 : 0;
    }
    const at = (j: number) => j < 0 || j >= classes.length ? 'sot' : classes[j];
    const brahmic = (j: number) => ['AK','AS'].includes(at(j)) || cps[j] === 0x25cc;
    const out: BreakOpportunity[] = [];
    for (let i = 1; i < n; i++) {
      const a0 = raw[i-1], b0 = raw[i], j = significant[i-1], k = significant[i];
      const a = at(j), b = at(k), prev = at(j-1), next = at(k+1), ns = nonspace[j], s = at(ns);
      let allowed = false, mandatory = false, fixed = true;
      if (a0 === 'BK' || (['CR','LF','NL'].includes(a0) && !(a0 === 'CR' && b0 === 'LF'))) { allowed = true; mandatory = true; }
      else if (a0 === 'CR' && b0 === 'LF') allowed = false;
      else if (['BK','CR','LF','NL','SP','ZW'].includes(b0)) allowed = false;
      else if (s === 'ZW') allowed = true; // LB8, before LB9
      else if (a0 === 'ZWJ' || inherited[i]) allowed = false;
      else if (a === 'WJ' || b === 'WJ' || a === 'GL') allowed = false;
      else {
        fixed = false;
        if (b === 'GL' && !['SP','BA','HY','HH'].includes(a)) allowed = false;
        else if (['CL','CP','EX','SY'].includes(b) || s === 'OP') allowed = false;
        else if (s === 'QU' && categories[ns] === 'Pi' && (ns === 0 || ['BK','CR','LF','NL','OP','QU','GL','SP','ZW'].includes(at(ns-1)))) allowed = false;
        else if (b === 'QU' && categories[k] === 'Pf' && (k + 1 === classes.length || ['SP','GL','WJ','CL','QU','CP','EX','IS','SY','BK','CR','LF','NL','ZW'].includes(next))) allowed = false;
        else if (a === 'SP' && b === 'IS' && next === 'NU') allowed = true;
        else if (b === 'IS') allowed = false;
        else if ((['CL','CP'].includes(s) && b === 'NS') || (s === 'B2' && b === 'B2')) allowed = false;
        else if (a === 'SP') allowed = true;
        else if ((b === 'QU' && categories[k] !== 'Pi') || (a === 'QU' && categories[j] !== 'Pf')) allowed = false;
        else if ((b === 'QU' && (!east[j] || k + 1 === classes.length || !east[k+1])) || (a === 'QU' && (!east[k] || j === 0 || !east[j-1]))) allowed = false;
        else if (a === 'CB' || b === 'CB') allowed = true;
        else if (['HY','HH'].includes(a) && ['AL','HL'].includes(b) && (j === 0 || ['BK','CR','LF','NL','SP','ZW','CB','GL'].includes(prev))) allowed = false;
        else if (['BA','HH','HY','NS'].includes(b) || a === 'BB') allowed = false;
        else if ((prev === 'HL' && ['HY','HH'].includes(a) && b !== 'HL') || (a === 'SY' && b === 'HL') || b === 'IN') allowed = false;
        else if ((['AL','HL'].includes(a) && b === 'NU') || (a === 'NU' && ['AL','HL'].includes(b))) allowed = false;
        else if ((a === 'PR' && ['ID','EB','EM'].includes(b)) || (['ID','EB','EM'].includes(a) && b === 'PO')) allowed = false;
        else if ((['PR','PO'].includes(a) && ['AL','HL'].includes(b)) || (['AL','HL'].includes(a) && ['PR','PO'].includes(b))) allowed = false;
        else if ((['PO','PR'].includes(b) && (numeric[j] || (['CL','CP'].includes(a) && j > 0 && numeric[j-1]))) ||
          (['PO','PR'].includes(a) && (b === 'NU' || (b === 'OP' && (next === 'NU' || (next === 'IS' && at(k+2) === 'NU'))))) ||
          (['HY','IS'].includes(a) && b === 'NU') || (numeric[j] && b === 'NU')) allowed = false;
        else if ((a === 'JL' && ['JL','JV','H2','H3'].includes(b)) || (['JV','H2'].includes(a) && ['JV','JT'].includes(b)) || (['JT','H3'].includes(a) && b === 'JT')) allowed = false;
        else if ((['JL','JV','JT','H2','H3'].includes(a) && b === 'PO') || (a === 'PR' && ['JL','JV','JT','H2','H3'].includes(b))) allowed = false;
        else if (['AL','HL'].includes(a) && ['AL','HL'].includes(b)) allowed = false;
        else if ((a === 'AP' && brahmic(k)) || (brahmic(j) && ['VF','VI'].includes(b)) || (brahmic(j-1) && a === 'VI' && (b === 'AK' || cps[k] === 0x25cc)) || (brahmic(j) && brahmic(k) && next === 'VF')) allowed = false;
        else if (a === 'IS' && ['AL','HL'].includes(b)) allowed = false;
        else if ((['AL','HL','NU'].includes(a) && b === 'OP' && !east[k]) || (a === 'CP' && !east[j] && ['AL','HL','NU'].includes(b))) allowed = false;
        else if (a === 'RI' && b === 'RI' && ri[j] % 2 === 1) allowed = false;
        else if (b === 'EM' && (a === 'EB' || (U.extendedPictographic(cps[j]) === 'Y' && categories[j] === 'Cn'))) allowed = false;
        else allowed = true;
      }
      if (!fixed && tailoring) allowed = tailoring(input.offsets[i], allowed);
      if (allowed) out.push(Object.freeze({ offset: input.offsets[i], mandatory }));
    }
    out.push(Object.freeze({ offset: text.length, mandatory: true }));
    return Object.freeze(out);
  }
}
