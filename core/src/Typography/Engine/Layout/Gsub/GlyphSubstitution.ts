// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import * as Unicode from '../../Unicode/Generated/UnicodeData';
import { BigEndianData } from '../../Data/BigEndianData';
import { checked, divide } from '../../Data/Integer';
import { invalid, unsupported } from '../../Api/FontError';
import { ShapingLimits } from '../../Api/ShapingLimits';
import { ShapeOptions } from '../../Api/ShapeOptions';
import { ShapingGlyph } from '../Common/ShapingGlyph';
import { LookupRule } from '../Common/LookupRule';
import { ShapePlan } from '../Common/ShapePlan';
import { UnsafeRange } from '../Common/UnsafeRange';
import { GlyphFilter } from '../Common/GlyphFilter';
import { OpenTypeLayout, LayoutReadCache } from '../Common/OpenTypeLayout';
import { LookupHeaderCache } from '../Common/LookupHeaderCache';

export class GlyphSubstitution {

  private readonly data!: BigEndianData;
  private readonly reads = new LayoutReadCache();
  private readonly filter!: GlyphFilter;
  private readonly lookupList: number = 0;
  private readonly headers!: LookupHeaderCache;
  private readonly glyphCount: number = 0;
  private readonly lookups!: number[];
  private readonly rules!: LookupRule[];
  private activeRule: LookupRule | null = null;
  private readonly arabic: boolean;
  private operations: number = 0;
  private readonly charge = () => this.tick();
  private readonly limits!: ShapingLimits;
  constructor(bytes: Uint8Array | null, glyphCount: number, gdef: Uint8Array | null, limits: ShapingLimits | null = null, options: ShapeOptions | null = null) {
    this.arabic = options?.script === 'arab';
    this.limits = limits ?? new ShapingLimits();
    this.glyphCount = glyphCount;
    this.filter = new GlyphFilter(gdef);
    let plan = new ShapePlan(bytes, "GSUB", options ?? undefined);
    this.lookups = plan.lookups; this.rules = plan.rules;
    if (bytes == null) return;
    this.data = new BigEndianData(bytes);
    this.lookupList = OpenTypeLayout.offset16(this.data, 0, 8);
    this.headers = new LookupHeaderCache(this.data, this.lookupList, this.filter, false);
  }
  apply(glyphs: ShapingGlyph[]): void {
    this.operations = 0;
    if (glyphs.length > this.limits.maxGlyphs)
      invalid("GSUB input exceeds the glyph limit.");
    for (let i = 0; i < this.lookups.length; i++)
    {
      this.activeRule = this.rules[i];
      let lookup = this.lookups[i];
      if (this.isReverse(lookup))
      {
        for (let at = glyphs.length - 1; at >= 0; at--) this.applyAt(lookup, glyphs, at, 0);
      }
      else
        for (let at = 0; at < glyphs.length;)
        {
          let consumed = this.applyAt(lookup, glyphs, at, 0);
          at += Math.max(consumed, 1);
          if (glyphs.length > this.limits.maxGlyphs)
            invalid("GSUB expansion exceeds the glyph limit.");
        }
    }
    this.activeRule = null;
  }

  private isReverse(index: number): boolean {
    let lookup = this.data.relative16(this.lookupList, this.lookupList + 2 + index * 2), type = this.data.u16(lookup);
    if (type == 8) return true;
    if (type != 7) return false;
    let count = this.data.u16(lookup + 4);
    for (let i = 0; i < count; i++)
    {
      this.tick();
      let sub = this.data.relative16(lookup, lookup + 6 + i * 2);
      if (this.data.u16(sub + 2) == 8) return true;
    }
    return false;
  }

  private ignored(glyph: ShapingGlyph, flags: number, set: number): boolean { return (this.arabic && glyph.scalar !== 0x200c && glyph.scalar !== 0x200d && Unicode.isIgnorable(glyph.scalar)) || this.filter.ignored(glyph.id,flags,set); }
  private enabled(glyph: ShapingGlyph): boolean { return this.activeRule == null || this.activeRule.value(glyph.featureCluster, this.charge, glyph.mirrored, glyph.joiningForm) != 0; }

  private applyAt(index: number, glyphs: ShapingGlyph[], at: number, depth: number): number {
    this.tick();
    if (depth > this.limits.maxNesting)
      invalid("GSUB recursion/operation limit exceeded.");
    if (at < 0 || at >= glyphs.length)
      return 0;
    if (depth == 0 && !this.enabled(glyphs[at])) return 0;
    const header = this.headers.get(index);
    let lookup = header.offset, type = header.type, flags = header.flags, count = header.count, markSet = header.markSet;
    if (this.ignored(glyphs[at], flags, markSet))
      return 0;
    for (let i = 0; i < count; i++)
    {
      this.tick();
      let sub = this.data.relative16(lookup, lookup + 6 + i * 2);
      let result = this.subtable(type, sub, glyphs, at, depth, flags, markSet);
      if (result != 0)
        return result;
    }
    return 0;
  }
  private setGlyph(glyph: ShapingGlyph, id: number): void {
    if (id < 0 || id >= this.glyphCount)
      invalid("GSUB references an invalid glyph.");
    glyph.id = id;
  }
  private subtable(type: number, sub: number, glyphs: ShapingGlyph[], at: number, depth: number, flags: number, markSet: number): number {
    let format = this.data.u16(sub);
    if (type == 7)
    {
      if (format != 1 || depth > this.limits.maxNesting)
        invalid("Invalid GSUB extension.");
      let extendedType = this.data.u16(sub + 2);
      if (extendedType == 7)
        invalid("Recursive GSUB extension.");
      return this.subtable(extendedType, checked(sub + this.data.offset32(sub + 4)), glyphs, at, depth + 1, flags, markSet);
    }
    if ((type == 5 || type == 6) && format == 3)
      return this.context(type, format, sub, 0, glyphs, at, depth, flags, markSet);
    let coverage = this.coverage(this.data.relative16(sub, sub + 2), glyphs[at].id);
    if (coverage < 0)
      return 0;
    if (type == 1)
    {
      if (format == 1)
        this.setGlyph(glyphs[at], (glyphs[at].id + this.data.i16(sub + 4)) & 0xffff);
      else if (format == 2 && coverage < this.data.u16(sub + 4))
        this.setGlyph(glyphs[at], this.data.u16(sub + 6 + coverage * 2));
      else
        invalid("Invalid single substitution.");
      return 1;
    }
    if (type == 2)
    {
      if (format != 1 || coverage >= this.data.u16(sub + 4))
        invalid("Invalid multiple substitution.");
      let sequence = this.data.relative16(sub, sub + 6 + coverage * 2), count = this.data.u16(sequence);
      if (count > this.limits.maxGlyphs)
        invalid("Excessive GSUB expansion.");
      let original = glyphs[at];
      if (glyphs.length - 1 + count > this.limits.maxGlyphs)
        invalid("GSUB expansion exceeds the glyph limit.");
      glyphs.splice(at, 1);
      for (let i = 0; i < count; i++)
      {
        this.tick();
        let next = Object.assign(i === 0 ? original : new ShapingGlyph(0, original.scalar, original.cluster), {
          markLigature: original.markLigature, markComponent: original.markComponent,
          featureCluster: original.featureCluster, unsafeBefore: original.unsafeBefore,
          advanceOverride: original.advanceOverride, mirrored: original.mirrored, joiningForm: original.joiningForm,
          ligature: original.ligature, componentCount: original.componentCount
        });
        this.setGlyph(next, this.data.u16(sequence + 2 + i * 2));
        glyphs.splice(at + i, 0, next);
      }
      for (const glyph of glyphs)
      {
        this.tick();
        if (glyph.markLigature == original)
          glyph.markLigature = count == 0 ? null : glyphs[at];
      }
      return Math.max(count, 1);
    }
    if (type == 3)
    {
      if (format != 1 || coverage >= this.data.u16(sub + 4))
        invalid("Invalid alternate substitution.");
      let set = this.data.relative16(sub, sub + 6 + coverage * 2), count = this.data.u16(set);
      this.data.check(set + 2, count * 2);
      let value = this.activeRule == null ? 1 : this.activeRule.value(glyphs[at].featureCluster, this.charge, glyphs[at].mirrored, glyphs[at].joiningForm);
      if (value < 1 || value > count) return 0;
      this.setGlyph(glyphs[at], this.data.u16(set + value * 2));
      return 1;
    }
    if (type == 8)
    {
      if (format != 1) invalid("Invalid reverse chaining substitution.");
      let p = sub + 4, back = this.data.u16(p);
      p += 2; this.data.check(p, back * 2);
      let position = at;
      for (let i = 0; i < back; i++)
      {
        position = this.walk(glyphs, position, -1, flags, markSet);
        if (position < 0 || this.coverage(this.data.relative16(sub, p + i * 2), glyphs[position].id) < 0) return 0;
      }
      let first = position;
      p += back * 2;
      let ahead = this.data.u16(p);
      p += 2; this.data.check(p, ahead * 2);
      position = at;
      for (let i = 0; i < ahead; i++)
      {
        position = this.walk(glyphs, position, 1, flags, markSet);
        if (position >= glyphs.length || this.coverage(this.data.relative16(sub, p + i * 2), glyphs[position].id) < 0) return 0;
      }
      p += ahead * 2;
      let count = this.data.u16(p);
      this.data.check(p + 2, count * 2);
      if (coverage >= count) invalid("Invalid reverse chaining coverage index.");
      UnsafeRange.mark(glyphs, first, position, this.charge);
      this.setGlyph(glyphs[at], this.data.u16(p + 2 + coverage * 2));
      return 1;
    }
    if (type == 4)
    {
      if (format != 1 || coverage >= this.data.u16(sub + 4))
        invalid("Invalid ligature substitution.");
      let set = this.data.relative16(sub, sub + 6 + coverage * 2), count = this.data.u16(set);
      for (let i = 0; i < count; i++)
      {
        this.tick();
        let ligature = this.data.relative16(set, set + 2 + i * 2), components = this.data.u16(ligature + 2);
        if (components < 1)
          invalid("Empty GSUB ligature.");
        this.data.check(ligature + 4, (components - 1) * 2);
        let matched = [ at ];
        let matches = true;
        let position = at;
        for (let j = 1; matches && j < components; j++)
        {
          position = this.walk(glyphs, position, 1, flags, markSet);
          matches = position < glyphs.length && this.enabled(glyphs[position]) && glyphs[position].id == this.data.u16(ligature + 2 + j * 2);
          if (matches)
            matched.push(position);
        }
        if (!matches)
          continue;
        this.associateComponents(glyphs, matched);
        // A ligature spanning skipped marks merges every source
        // cluster through its final component, including marks
        // already belonging to that component's cluster.
        let final = matched[matched.length - 1], finalCluster = glyphs[final].cluster;
        while (final + 1 < glyphs.length && glyphs[final + 1].cluster == finalCluster) final++;
        let firstCluster = glyphs[at].cluster;
        for (let j = at; j <= final; j++) { this.tick(); firstCluster = Math.min(firstCluster, glyphs[j].cluster); }
        const inherited = glyphs[at].cluster === firstCluster && glyphs[at].unsafeBefore;
        for (let j = at; j <= final; j++) { this.tick(); glyphs[j].cluster = firstCluster; if (this.arabic) glyphs[j].unsafeBefore = inherited; }
        this.setGlyph(glyphs[at], this.data.u16(ligature));
        glyphs[at].ligature = true;
        for (let j = matched.length - 1; j > 0; j--)
          glyphs.splice(matched[j], 1);
        return 1;
      }
      return 0;
    }
    if (type == 5 || type == 6)
      return this.context(type, format, sub, coverage, glyphs, at, depth, flags, markSet);
    unsupported("GSUB lookup type " + type + " is unsupported.");
  }
  private associateComponents(glyphs: ShapingGlyph[], matched: number[]): void {
    const offsets = new Map<ShapingGlyph, number>();
    let total = 0;
    for (const index of matched)
    {
      offsets.set(glyphs[index], total);
      total = checked(total + glyphs[index].componentCount);
      if (total > this.limits.maxGlyphs)
        invalid("GSUB ligature component limit exceeded.");
    }
    let component = 0;
    for (let i = matched[0] + 1; i < glyphs.length; i++)
    {
      this.tick();
      if (component + 1 < matched.length && i == matched[component + 1])
      {
        component++;
        continue;
      }
      let mark = glyphs[i];
      const oldOffset = mark.markLigature == null ? undefined : offsets.get(mark.markLigature);
      if (oldOffset !== undefined)
        mark.markComponent = checked(oldOffset + mark.markComponent);
      else if (this.filter.isMark(mark))
        mark.markComponent = offsets.get(glyphs[matched[component]])! + glyphs[matched[component]].componentCount - 1;
      else if (i > matched[matched.length - 1])
        break;
      else
        continue;
      mark.markLigature = glyphs[matched[0]];
    }
    glyphs[matched[0]].componentCount = total;
  }

  private coverage(offset: number, glyph: number): number {
    return this.reads.coverage(this.data, offset, glyph);
  }
  private class(offset: number, glyph: number): number {
    return this.reads.class(this.data, offset, glyph);
  }

  private tick(): void {
    if (++this.operations > this.limits.maxOperations)
      invalid("GSUB operation limit exceeded.");
  }


  private walk(glyphs: ShapingGlyph[], position: number, direction: number, flags: number, markSet: number): number {
    do
    {
      this.tick();
      position += direction;
    }
    while (position >= 0 && position < glyphs.length && this.ignored(glyphs[position], flags, markSet));
    return position;
  }

  // mode: glyph IDs (0), glyph classes (1), or coverage offsets (2).
  private match(glyphs: ShapingGlyph[], start: number, direction: number, count: number, record: number, mode: number, classDefinition: number, sub: number, flags: number, markSet: number, matched: ShapingGlyph[], requireFeature: boolean = false): boolean {
    this.data.check(record, count * 2);
    matched.length = 0;
    if (count > glyphs.length)
      return false;
    let position = start;
    for (let j = 0; j < count; j++)
    {
      this.tick();
      if (position < 0 || position >= glyphs.length)
        return false;
      if (requireFeature && !this.enabled(glyphs[position])) return false;
      let id = glyphs[position].id, expected = this.data.u16(record + j * 2);
      let same = mode == 2 ? this.coverage(checked(sub + expected), id) >= 0 :
        (mode == 1 ? this.class(classDefinition, id) : id) == expected;
      if (!same)
        return false;
      matched.push(glyphs[position]);
      if (j + 1 < count)
        position = this.walk(glyphs, position, direction, flags, markSet);
    }
    return true;
  }

  private context(type: number, format: number, sub: number, coverage: number, glyphs: ShapingGlyph[], at: number, depth: number, flags: number, markSet: number): number {
    let contextFirst = at, contextLast = at;
    let chained = type == 6;
    let ignored: ShapingGlyph[] = [], matched: ShapingGlyph[] = [];
    if (format == 3)
    {
      let p = sub + 2;
      let match = true;
      if (chained)
      {
        let back = this.data.u16(p);
        p += 2;
        match = this.match(glyphs, this.walk(glyphs, at, -1, flags, markSet), -1, back, p, 2, 0, sub, flags, markSet, ignored);
        if (match && ignored.length > 0) contextFirst = glyphs.indexOf(ignored[ignored.length - 1]);
        p += back * 2;
      }
      let input = this.data.u16(p);
      p += 2;
      let records = chained ? -1 : this.data.u16(p);
      if (!chained)
        p += 2;
      if (input < 1)
        invalid("Empty GSUB context.");
      match = Boolean(Number(match) & Number(this.match(glyphs, at, 1, input, p, 2, 0, sub, flags, markSet, matched, true)));
      p += input * 2;
      if (chained)
      {
        let ahead = this.data.u16(p);
        p += 2;
        this.data.check(p, ahead * 2);
        if (match)
        {
          let last = glyphs.indexOf(matched[matched.length - 1]);
          match = this.match(glyphs, this.walk(glyphs, last, 1, flags, markSet), 1, ahead, p, 2, 0, sub, flags, markSet, ignored);
          if (match && ignored.length > 0) contextLast = glyphs.indexOf(ignored[ignored.length - 1]);
        }
        p += ahead * 2;
        records = this.data.u16(p);
        p += 2;
      }
      if (match) UnsafeRange.mark(glyphs, contextFirst, Math.max(contextLast, glyphs.indexOf(matched[matched.length - 1])), this.charge);
      return match ? this.applyRecords(p, records, matched, glyphs, at, depth) : 0;
    }
    if (format != 1 && format != 2)
      unsupported("Unsupported GSUB context format.");
    let backClass = 0, inputClass = 0, aheadClass = 0, header = sub + 4;
    if (format == 2)
    {
      if (chained)
      {
        backClass = this.data.relative16(sub, header);
        header += 2;
      }
      inputClass = this.data.relative16(sub, header);
      header += 2;
      if (chained)
      {
        aheadClass = this.data.relative16(sub, header);
        header += 2;
      }
    }
    let setCount = this.data.u16(header), setIndex = format == 1 ? coverage : this.class(inputClass, glyphs[at].id);
    this.data.check(header + 2, setCount * 2);
    if (setIndex >= setCount)
      return 0;
    let relativeSet = this.data.u16(header + 2 + setIndex * 2);
    if (relativeSet == 0)
      return 0;
    let set = checked(sub + relativeSet), ruleCount = this.data.u16(set);
    this.data.check(set + 2, ruleCount * 2);
    for (let ruleIndex = 0; ruleIndex < ruleCount; ruleIndex++)
    {
      this.tick();
      let p = this.data.relative16(set, set + 2 + ruleIndex * 2), mode = format == 1 ? 0 : 1;
      let match = true;
      if (chained)
      {
        let back = this.data.u16(p);
        p += 2;
        match = this.match(glyphs, this.walk(glyphs, at, -1, flags, markSet), -1, back, p, mode, backClass, sub, flags, markSet, ignored);
        if (match && ignored.length > 0) contextFirst = glyphs.indexOf(ignored[ignored.length - 1]);
        p += back * 2;
      }
      let input = this.data.u16(p);
      p += 2;
      if (input < 1)
        invalid("Empty GSUB context.");
      let records = chained ? -1 : this.data.u16(p);
      if (!chained)
        p += 2;
      match = Boolean(Number(match) & Number(this.match(glyphs, this.walk(glyphs, at, 1, flags, markSet), 1, input - 1, p, mode, inputClass, sub, flags, markSet, matched, true)));
      matched.splice(0, 0, glyphs[at]);
      p += (input - 1) * 2;
      if (chained)
      {
        let ahead = this.data.u16(p);
        p += 2;
        this.data.check(p, ahead * 2);
        if (match)
        {
          let last = glyphs.indexOf(matched[matched.length - 1]);
          match = this.match(glyphs, this.walk(glyphs, last, 1, flags, markSet), 1, ahead, p, mode, aheadClass, sub, flags, markSet, ignored);
          if (match && ignored.length > 0) contextLast = glyphs.indexOf(ignored[ignored.length - 1]);
        }
        p += ahead * 2;
        records = this.data.u16(p);
        p += 2;
      }
      if (match)
      {
        UnsafeRange.mark(glyphs, contextFirst, Math.max(contextLast, glyphs.indexOf(matched[matched.length - 1])), this.charge);
        return this.applyRecords(p, records, matched, glyphs, at, depth);
      }
    }
    return 0;
  }

  private applyRecords(p: number, records: number, matched: ShapingGlyph[], glyphs: ShapingGlyph[], at: number, depth: number): number {
    // Records index filtered input glyphs, retaining identity through nested changes.
    this.data.check(p, records * 4);
    let last = glyphs.indexOf(matched[matched.length - 1]);
    let next: ShapingGlyph | null = last + 1 < glyphs.length ? glyphs[last + 1] : null;
    for (let i = 0; i < records; i++)
    {
      this.tick();
      let index = this.data.u16(p + i * 4), lookup = this.data.u16(p + i * 4 + 2);
      if (index >= matched.length)
        invalid("Invalid contextual sequence index.");
      let location = glyphs.indexOf(matched[index]);
      if (location >= 0) {
        const count = glyphs.length;
        this.applyAt(lookup, glyphs, location, depth + 1);
        if (this.arabic && glyphs.length > count) matched.splice(index+1,0,...glyphs.slice(location+1,location+1+glyphs.length-count));
      }
    }
    let end = next == null ? glyphs.length : glyphs.indexOf(next);
    return Math.max(1, end < 0 ? 1 : end - at);
  }
}
