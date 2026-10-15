// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { FontError, requireInteger, unsupported } from './FontError';
import { ShapeFeature, validateTag } from './ShapeFeature';
import { ShapingLimits, type ShapingLimitOptions } from './ShapingLimits';
import { TextDirection } from './TextDirection';
export interface ShapeOptionValues { script?: string; language?: string; direction?: TextDirection; features?: readonly ShapeFeature[]; limits?: ShapingLimitOptions; }
export class ShapeOptions {
  readonly script: string; readonly language: string; readonly direction: TextDirection; readonly features: readonly ShapeFeature[]; readonly limits: ShapingLimits | null;
  constructor(options: ShapeOptionValues = {}) {
    const script = options.script ?? 'latn', language = options.language ?? 'dflt'; validateTag(script, 'script'); validateTag(language, 'language');
    this.script = script === 'DFLT' ? script : script.toLowerCase(); this.language = language;
    this.direction = requireInteger(options.direction ?? TextDirection.LeftToRight, 'direction', 0, 3);
    if ((options.features?.length ?? 0) > 256) throw new FontError('ArgumentException', 'Feature count limit exceeded. (features)');
    this.features = Object.freeze((options.features ?? []).map(feature => {
      if (!feature) throw new FontError('ArgumentException', 'A feature cannot be null. (features)');
      return new ShapeFeature(feature.tag, feature);
    }));
    this.limits = options.limits ? new ShapingLimits(options.limits) : null; Object.freeze(this);
  }
  validateText(text: string): void {
    if (this.direction >= TextDirection.TopToBottom) unsupported('Vertical shaping is unsupported.');
    for (const feature of this.features) {
      const end = feature.end === 2147483647 ? text.length : feature.end;
      if (feature.start > text.length || end > text.length) throw new FontError('ArgumentException', 'A feature range exceeds the UTF-16 text length. (features)');
      const low = (at: number) => at < text.length && text.charCodeAt(at) >= 0xdc00 && text.charCodeAt(at) <= 0xdfff;
      if (low(feature.start) || low(end)) throw new FontError('ArgumentException', 'A feature range splits a surrogate pair. (features)');
    }
  }
  featureValue(tag: string, cluster: number, defaultValue: number, tick?: () => void): number {
    let value = defaultValue;
    // Indexed rather than for...of: this runs per glyph per lookup.
    for (let i = 0; i < this.features.length; i++) { const feature = this.features[i]; tick?.(); if (feature.tag === tag && cluster >= feature.start && cluster < feature.end) value = feature.value; }
    return value;
  }
}
