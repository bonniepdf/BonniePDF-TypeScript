// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { BigEndianData } from '../../Data/BigEndianData';
import { invalid, unsupported } from '../../Api/FontError';
import { ShapeOptions } from '../../Api/ShapeOptions';
import { TextDirection } from '../../Api/TextDirection';
import { LookupRule } from './LookupRule';
import { OpenTypeLayout } from './OpenTypeLayout';
export class ShapePlan {
  readonly rules: LookupRule[] = []; readonly lookups: number[] = []; readonly kerningLookups: number[] = [];
  private operations = 0;
  private tick(): void { if (++this.operations > 1000000) invalid(this.kind + ' feature-selection operation limit exceeded.'); }
  private find(data: BigEndianData, list: number, tag: string, origin = -1): number {
    const count = data.u16(list); data.check(list + 2, count * 6);
    for (let i = 0; i < count; i++) { this.tick(); const p = list + 2 + i * 6; if (data.tag(p) === tag) return OpenTypeLayout.offset16(data, origin < 0 ? list : origin, p + 4); }
    return -1;
  }
  constructor(bytes: Uint8Array | null, private readonly kind: string, options = new ShapeOptions()) {
    if (bytes === null) return;
    const data = new BigEndianData(bytes), minor = data.u16(2);
    if (data.u16(0) !== 1 || minor > 1) unsupported('Unsupported ' + kind + ' version.');
    if (minor === 1 && data.u32(10) !== 0) unsupported(kind + ' feature variations are unsupported.');
    const scripts = OpenTypeLayout.offset16(data, 0, 4), features = OpenTypeLayout.offset16(data, 0, 6), lookupList = OpenTypeLayout.offset16(data, 0, 8);
    let script = this.find(data, scripts, options.script);
    if (script < 0) script = this.find(data, scripts, 'DFLT'); if (script < 0) return;
    let language = options.language === 'dflt' ? -1 : this.find(data, script + 2, options.language, script);
    if (language < 0 && data.u16(script) !== 0) language = OpenTypeLayout.offset16(data, script, script);
    if (language < 0) return;
    if (data.u16(language) !== 0) invalid('Invalid ' + kind + ' language lookup order.');
    const required = data.u16(language + 2), count = data.u16(language + 4); data.check(language + 6, count * 2);
    const indices: number[] = []; if (required !== 65535) indices.push(required);
    for (let i = 0; i < count; i++) indices.push(data.u16(language + 6 + i * 2));
    const rules = new Map<string, LookupRule>(), kern = new Set<number>();
    for (const index of indices) {
      this.tick(); if (index >= data.u16(features)) invalid('Invalid ' + kind + ' feature index.');
      const record = features + 2 + index * 6, tag = data.tag(record);
      const arabic = options.script === 'arab' && kind === 'GSUB';
      const value = arabic && ['isol','fina','medi','init','mset','mark'].includes(tag) ? 1 : ShapePlan.defaultValue(tag, kind, options.direction);
      const stage = arabic ? ShapePlan.arabicStage(tag) : 0;
      let requested = false;
      for (const feature of options.features) { this.tick(); requested = (feature.tag === tag && feature.value !== 0) || requested; }
      if (index !== required && value === 0 && !requested) continue;
      const featureOffset = OpenTypeLayout.offset16(data, features, record + 4), lookups = data.u16(featureOffset + 2); data.check(featureOffset + 4, lookups * 2);
      for (let i = 0; i < lookups; i++) {
        this.tick(); const lookup = data.u16(featureOffset + 4 + i * 2);
        if (lookup >= data.u16(lookupList)) invalid('Invalid ' + kind + ' lookup index.');
        const key = stage+':'+lookup;
        let rule = rules.get(key); if (!rule) { rule = new LookupRule(lookup, options, stage); rules.set(key, rule); }
        rule.add(tag, value, index === required); if (tag === 'kern') kern.add(lookup);
      }
    }
    this.rules = [...rules.values()].sort((a, b) => a.stage-b.stage || a.index - b.index); this.lookups = this.rules.map(rule => rule.index); this.kerningLookups = [...kern].sort((a, b) => a - b);
  }
  private static arabicStage(tag: string): number {
    if (['rtlm','rtla','ltra','ltrm'].includes(tag)) return 0;
    if (tag === 'ccmp' || tag === 'locl') return 1;
    const form = ['isol','fina','medi','init','rlig','calt'].indexOf(tag);
    return form >= 0 ? form+2 : 8;
  }
  private static defaultValue(tag: string, kind: string, direction: TextDirection): number {
    if (kind === 'GSUB') return ['ccmp', 'locl', 'rlig', 'liga', 'clig', 'calt', 'rclt', ...(direction === TextDirection.LeftToRight ? ['ltra', 'ltrm'] : ['rtla', 'rtlm'])].includes(tag) ? 1 : 0;
    return ['kern', 'mark', 'mkmk', 'curs', 'dist', 'abvm', 'blwm'].includes(tag) ? 1 : 0;
  }
}
