// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { ShapeOptions } from '../../Api/ShapeOptions';
export class LookupRule {
  private readonly tags: string[] = []; private readonly defaults: number[] = []; private required = false; private readonly added = new Set<string>();
  constructor(readonly index: number, private readonly options: ShapeOptions, readonly stage = 0) {}
  add(tag: string, value: number, isRequired: boolean): void {
    this.required ||= isRequired;
    if (!this.added.has(tag)) { this.added.add(tag); this.tags.push(tag); this.defaults.push(value); }
  }
  #constant: { value: number; ticks: number } | null | undefined = undefined;
  // The value and operation charge of value() when they cannot depend on the glyph: no
  // Arabic joining forms, no rtlm, and every feature override covering the whole text.
  constant(): { value: number; ticks: number } | null {
    if (this.#constant === undefined) this.#constant = this.#computeConstant();
    return this.#constant;
  }
  #computeConstant(): { value: number; ticks: number } | null {
    if (this.required) return { value: 1, ticks: 0 };
    if (this.options.script === 'arab' || this.tags.includes('rtlm')) return null;
    for (const feature of this.options.features) if (feature.start !== 0 || feature.end !== 2147483647) return null;
    let ticks = 0;
    for (let i = 0; i < this.tags.length; i++) {
      ticks++;
      let value = this.defaults[i];
      for (const feature of this.options.features) { ticks++; if (feature.tag === this.tags[i]) value = feature.value; }
      if (value !== 0) return { value, ticks };
    }
    return { value: 0, ticks };
  }
  value(cluster: number, tick: () => void, mirrored = false, joiningForm = ''): number {
    if (this.required) return 1;
    for (let i = 0; i < this.tags.length; i++) {
      tick(); const tag = this.tags[i];
      if (mirrored && tag === 'rtlm') continue;
      const fallback = this.options.script === 'arab' && ['isol','init','medi','fina'].includes(tag) && tag !== joiningForm ? 0 : this.defaults[i];
      const value = this.options.featureValue(tag, cluster, fallback, tick); if (value !== 0) return value;
    }
    return 0;
  }
}
