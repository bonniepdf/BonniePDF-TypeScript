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
import { FirstGlyphSet } from '../Common/FirstGlyphSet';
import { GlyphAdjustment } from './GlyphAdjustment';
import { FontAnchor } from './FontAnchor';
import { LegacyKerning } from '../../Fonts/Tables/LegacyKerning';

export class GlyphPositioning {

  private readonly data!: BigEndianData;
  private readonly reads = new LayoutReadCache();
  private readonly filter!: GlyphFilter;
  private readonly lookupList: number = 0;
  private readonly headers!: LookupHeaderCache;
  private readonly firstGlyphs = new Map<number, FirstGlyphSet | null>();
  private readonly subtableMasks = new Map<number, Uint32Array | null>();
  private readonly lookups!: number[];
  private readonly rules!: LookupRule[];
  private readonly options!: ShapeOptions;
  private activeRule: LookupRule | null = null;
  private readonly kerningLookups!: number[];
  get hasKerning(): boolean { return this.kerningLookups.length != 0; }
  private operations: number = 0;
  private readonly adjustmentPool: GlyphAdjustment[] = [];
  private readonly charge = () => this.tick();
  private readonly limits!: ShapingLimits;
  get shapingLimits(): ShapingLimits { return this.limits; }

  constructor(bytes: Uint8Array | null, gdef: Uint8Array | null, limits: ShapingLimits | null = null, options: ShapeOptions | null = null) {
    this.limits = limits ?? new ShapingLimits();
    this.filter = new GlyphFilter(gdef);
    this.options = options ?? new ShapeOptions();
    let plan = new ShapePlan(bytes, "GPOS", this.options);
    this.lookups = plan.lookups; this.rules = plan.rules; this.kerningLookups = plan.kerningLookups;
    if (bytes == null) return;
    this.data = new BigEndianData(bytes);
    this.lookupList = OpenTypeLayout.offset16(this.data, 0, 8);
    this.headers = new LookupHeaderCache(this.data, this.lookupList, this.filter, true);
  }


  private offset(origin: number, field: number): number {
    return OpenTypeLayout.offset16(this.data, origin, field);
  }

  private tick(): void {
    if (++this.operations > this.limits.maxOperations)
      invalid("GPOS operation limit exceeded.");
  }


  apply(glyphs: ShapingGlyph[], advanceWidth: ((glyph: number) => number) | null = null, legacyKerning: LegacyKerning | null = null): GlyphAdjustment[] {
    return this.applySelected(glyphs, advanceWidth, this.lookups, this.hasKerning ? null : legacyKerning);
  }

  private applySelected(glyphs: ShapingGlyph[], advanceWidth: ((glyph: number) => number) | null, selection: number[], legacyKerning: LegacyKerning | null = null): GlyphAdjustment[] {
    if (glyphs.length > this.limits.maxGlyphs)
      invalid("GPOS glyph limit exceeded.");
    let adjustments = new Array<GlyphAdjustment>(glyphs.length);
    // The records are reused across calls: a program serves one shape call at a time
    // (operations is per-call state too), and callers read the adjustments before the
    // next call.
    while (this.adjustmentPool.length < glyphs.length) this.adjustmentPool.push(new GlyphAdjustment());
    for (let i = 0; i < glyphs.length; i++)
    {
      adjustments[i] = this.adjustmentPool[i].reset();
      if (advanceWidth != null && glyphs[i].advanceOverride != null)
        adjustments[i].xAdvance = glyphs[i].advanceOverride! - advanceWidth(glyphs[i].id);
      if (advanceWidth != null && this.filter.isMark(glyphs[i]) && !(this.options.script === 'arab' && Unicode.isIgnorable(glyphs[i].scalar)))
      {
        adjustments[i].xAdvance = -advanceWidth(glyphs[i].id);
        adjustments[i].zeroMarkAdvance = true;
      }
    }
    this.operations = 0;
    if (legacyKerning != null && legacyKerning.hasHorizontalKerning)
    {
      let previous = -1;
      for (let i = 0; i < glyphs.length; i++)
      {
        this.tick();
        if (this.filter.isMark(glyphs[i])) continue;
        if (previous >= 0)
        {
          if (this.options.featureValue("kern", glyphs[previous].featureCluster, 1, this.charge) == 0 ||
            this.options.featureValue("kern", glyphs[i].featureCluster, 1, this.charge) == 0) { previous = i; continue; }

          for (let step = 0; step < legacyKerning.workPerPair; step++) this.tick();
          const [first, second] = legacyKerning.split(glyphs[previous].id, glyphs[i].id);
          if (first != 0 || second != 0) UnsafeRange.mark(glyphs, previous, i, this.charge);
          adjustments[previous].xAdvance = checked(adjustments[previous].xAdvance + first);
          adjustments[i].xAdvance = checked(adjustments[i].xAdvance + second);
          adjustments[i].xPlacement = checked(adjustments[i].xPlacement + second);
        }
        previous = i;
      }
    }
    for (const index of selection)
    {
      this.activeRule = null;
      for (const rule of this.rules) { this.tick(); if (rule.index == index) { this.activeRule = rule; break; } }
      const first = this.firstGlyphSet(index);
      const rejectedCharge = first === null ? -1 : this.rejectedCharge(index);
      for (let at = 0; at < glyphs.length;) {
        const rejected = first !== null && !first.contains(glyphs[at].id);
        if (rejected && rejectedCharge >= 0) { this.chargeSubtables(rejectedCharge); at++; }
        else at += Math.max(1, this.applyAt(index, glyphs, adjustments, at, 0, advanceWidth, rejected));
      }
    }
    this.activeRule = null;
    this.resolve(glyphs, adjustments, advanceWidth);
    return adjustments;
  }

  // A lookup's first-glyph set, or null when any subtable reads before its coverage
  // test (contextual format 3) or fails the checks that precede it.
  private firstGlyphSet(index: number): FirstGlyphSet | null {
    let first = this.firstGlyphs.get(index);
    if (first === undefined) { first = this.buildFirstGlyphs(index); this.firstGlyphs.set(index, first); }
    return first;
  }

  private buildFirstGlyphs(index: number): FirstGlyphSet | null {
    try {
      const header = this.headers.get(index);
      const first = new FirstGlyphSet();
      for (let i = 0; i < header.count; i++) {
        let sub = this.offset(header.offset, header.offset + 6 + i * 2), type = header.type, format = this.data.u16(sub);
        if (type === 9) {
          const extended = this.data.u16(sub + 2), delta = this.data.offset32(sub + 4);
          if (format !== 1 || extended < 1 || extended > 8 || delta === 0) return null;
          type = extended; sub = checked(sub + delta); format = this.data.u16(sub);
        }
        if ((type === 7 || type === 8) && format === 3) return null;
        if (type === 3) {
          if (format !== 1) return null;
          this.data.check(sub + 6, this.data.u16(sub + 4) * 4);
        } else if (type >= 4 && type <= 6) {
          if (format !== 1) return null;
        } else if (type === 1 || type === 2) {
          if (format !== 1 && format !== 2) return null;
        } else if (type !== 7 && type !== 8) return null;
        if (!first.addCoverage(this.data, this.offset(sub, sub + 2))) return null;
      }
      return first;
    } catch {
      return null;
    }
  }

  // For a lookup of 4 to 32 single or pair adjustment subtables, which subtables' coverage
  // lists each glyph (bit i for subtable i), or null. These subtables read nothing and
  // charge nothing before their coverage test, which applyAt relies on to skip them.
  private subtableMaskSet(index: number): Uint32Array | null {
    let masks = this.subtableMasks.get(index);
    if (masks === undefined) { masks = this.buildSubtableMasks(index); this.subtableMasks.set(index, masks); }
    return masks;
  }

  private buildSubtableMasks(index: number): Uint32Array | null {
    try {
      const header = this.headers.get(index);
      if (header.count < 4 || header.count > 32) return null;
      let masks: Uint32Array | null = new Uint32Array(0);
      for (let i = 0; i < header.count; i++) {
        let sub = this.offset(header.offset, header.offset + 6 + i * 2), type = header.type, format = this.data.u16(sub);
        if (type === 9) {
          const extended = this.data.u16(sub + 2), delta = this.data.offset32(sub + 4);
          if (format !== 1 || extended < 1 || extended > 8 || delta === 0) return null;
          type = extended; sub = checked(sub + delta); format = this.data.u16(sub);
        }
        if ((type !== 1 && type !== 2) || (format !== 1 && format !== 2)) return null;
        masks = FirstGlyphSet.addCoverageBit(this.data, this.offset(sub, sub + 2), masks, i);
        if (masks === null) return null;
      }
      return masks;
    } catch {
      return null;
    }
  }

  // What applyAt charges for every rejected glyph of this lookup, when that cannot
  // depend on the glyph: a constant feature rule, no glyph filtering (so the walk to
  // the next glyph is one step) and no Arabic ignorables. Otherwise -1.
  private rejectedCharge(index: number): number {
    const header = this.headers.get(index);
    if (this.options.script === 'arab' || (header.flags & 0xff1e) !== 0 || this.limits.maxNesting < 0) return -1;
    let value = 1, ticks = 0;
    if (this.activeRule !== null) {
      const constant = this.activeRule.constant();
      if (constant === null) return -1;
      value = constant.value; ticks = constant.ticks;
    }
    return 1 + ticks + (value !== 0 ? 1 + header.count : 0);
  }

  // Charges what the subtable loop would charge for a glyph no subtable covers.
  private chargeSubtables(count: number): void {
    if (count > 0 && (this.operations += count) > this.limits.maxOperations)
      invalid("GPOS operation limit exceeded.");
  }

  private applyAt(index: number, glyphs: ShapingGlyph[], adjustments: GlyphAdjustment[], at: number, depth: number, advanceWidth: ((glyph: number) => number) | null, rejected = false): number {
    this.tick();
    if (this.options.script === 'arab' && Unicode.isIgnorable(glyphs[at].scalar)) return 0;
    if (depth > this.limits.maxNesting)
      invalid("GPOS recursion limit exceeded.");
    if (index < 0 || index >= this.headers.count)
      invalid("Invalid GPOS lookup index.");
    if (at < 0 || at >= glyphs.length)
      return 0;
    if (depth == 0 && this.activeRule != null && this.activeRule.value(glyphs[at].featureCluster, this.charge) == 0) return 0;
    const header = this.headers.get(index);
    let lookup = header.offset, type = header.type, flags = header.flags, count = header.count, markSet = header.markSet;
    if (this.filter.ignored(glyphs[at].id, flags, markSet))
      return 0;
    let next = this.walk(glyphs, at, 1, flags, markSet);
    if (rejected) { this.chargeSubtables(count); return 0; }
    const masks = this.subtableMaskSet(index);
    if (masks !== null) {
      // Only the subtables whose coverage lists this glyph can act on it; each of the others
      // would cost its loop tick and return at the coverage test, so they are charged that
      // tick without being read.
      const id = glyphs[at].id;
      let mask = id < masks.length ? masks[id] : 0, done = 0;
      for (let i = 0; mask !== 0; i++, mask >>>= 1) {
        if ((mask & 1) === 0) continue;
        this.chargeSubtables(i - done);
        this.tick();
        let consumed = this.subtable(type, this.offset(lookup, lookup + 6 + i * 2), glyphs, adjustments,
          at, next, flags, markSet, advanceWidth, depth);
        if (consumed != 0)
          return consumed == -1 ? next + 1 - at : consumed;
        done = i + 1;
      }
      this.chargeSubtables(count - done);
      return 0;
    }
    for (let i = 0; i < count; i++)
    {
      this.tick();
      let consumed = this.subtable(type, this.offset(lookup, lookup + 6 + i * 2), glyphs, adjustments,
        at, next, flags, markSet, advanceWidth, depth);
      if (consumed != 0)
        return consumed == -1 ? next + 1 - at : consumed;
    }
    return 0;
  }

  private subtable(type: number, sub: number, glyphs: ShapingGlyph[], adjustments: GlyphAdjustment[], at: number, next: number, flags: number, markSet: number, advanceWidth: ((glyph: number) => number) | null, depth: number): number {
    let format = this.data.u16(sub);
    if (type == 9)
    {
      let extended = this.data.u16(sub + 2), delta = this.data.offset32(sub + 4);
      if (format != 1 || extended < 1 || extended > 8 || delta == 0)
        invalid("Invalid GPOS extension.");
      return this.subtable(extended, checked(sub + delta), glyphs, adjustments, at, next, flags, markSet, advanceWidth, depth);
    }
    if (type == 7 || type == 8)
    {
      let covered = format == 3 ? 0 : this.coverage(this.offset(sub, sub + 2), glyphs[at].id);
      return covered < 0 ? 0 : this.context(type, format, sub, covered, glyphs, adjustments, at, depth, flags, markSet, advanceWidth);
    }
    if (type == 3)
      return this.cursive(sub, glyphs, adjustments, at, next, flags, advanceWidth);
    if (type == 4 || type == 5 || type == 6)
      return this.attach(type, sub, glyphs, adjustments, at, flags, markSet, advanceWidth);
    if (type != 1 && type != 2)
      unsupported("Unsupported GPOS lookup type " + type + ".");
    if (format != 1 && format != 2)
      invalid("Invalid GPOS adjustment format.");
    let coverage = this.reads.coverage(this.data, this.offset(sub, sub + 2), glyphs[at].id);
    if (coverage < 0)
      return 0;
    let firstFormat = this.data.u16(sub + 4), firstSize = GlyphPositioning.valueSize(firstFormat);
    if (type == 1)
    {
      let record = sub + 6;
      if (format == 2)
      {
        let count = this.data.u16(sub + 6);
        if (coverage >= count)
          invalid("Invalid GPOS single coverage index.");
        this.data.check(sub + 8, count * firstSize);
        record = sub + 8 + coverage * firstSize;
      }
      this.value(sub, record, firstFormat, adjustments[at]);
      return 1;
    }
    let secondFormat = this.data.u16(sub + 6), secondSize = GlyphPositioning.valueSize(secondFormat);
    if (next >= glyphs.length)
      return 0;
    if (this.activeRule != null && this.activeRule.value(glyphs[next].featureCluster, this.charge) == 0) return 0;
    let pair: number, valueOrigin = sub;
    if (format == 1)
    {
      let sets = this.data.u16(sub + 8);
      if (coverage >= sets)
        invalid("Invalid GPOS pair coverage index.");
      this.data.check(sub + 10, sets * 2);
      let set = this.offset(sub, sub + 10 + coverage * 2), count = this.data.u16(set);
      valueOrigin = set;
      let stride = 2 + firstSize + secondSize;
      this.data.check(set + 2, count * stride);
      let low = 0, high = count - 1;
      pair = -1;
      while (low <= high)
      {
        this.tick();
        let mid = divide(low + high, 2), record = set + 2 + mid * stride;
        let id = this.data.u16(record);
        if (id == glyphs[next].id)
        {
          pair = record + 2;
          break;
        }
        if (glyphs[next].id < id)
          high = mid - 1;
        else
          low = mid + 1;
      }
      if (pair < 0)
        return 0;
    }
    else
    {
      let c1 = this.reads.class(this.data, this.offset(sub, sub + 8), glyphs[at].id);
      let c2 = this.reads.class(this.data, this.offset(sub, sub + 10), glyphs[next].id);
      let rows = this.data.u16(sub + 12), columns = this.data.u16(sub + 14);
      if (c1 >= rows || c2 >= columns)
        invalid("Invalid GPOS pair class index.");
      let length = checked(rows * columns * (firstSize + secondSize));
      this.data.check(sub + 16, length);
      pair = checked(sub + 16 + (c1 * columns + c2) * (firstSize + secondSize));
    }
    let oldFirstAdvance = adjustments[at].xAdvance, oldFirstX = adjustments[at].xPlacement, oldFirstY = adjustments[at].yPlacement;
    let oldSecondAdvance = adjustments[next].xAdvance, oldSecondX = adjustments[next].xPlacement, oldSecondY = adjustments[next].yPlacement;
    this.value(valueOrigin, pair, firstFormat, adjustments[at]);
    this.value(valueOrigin, pair + firstSize, secondFormat, adjustments[next]);
    if (oldFirstAdvance != adjustments[at].xAdvance || oldFirstX != adjustments[at].xPlacement || oldFirstY != adjustments[at].yPlacement ||
      oldSecondAdvance != adjustments[next].xAdvance || oldSecondX != adjustments[next].xPlacement || oldSecondY != adjustments[next].yPlacement)
      UnsafeRange.mark(glyphs, at, next, this.charge);
    // A null second ValueRecord permits overlapping pairs (AV, VA in AVA).
    return secondFormat == 0 ? 1 : -1;
  }

  private attach(type: number, sub: number, glyphs: ShapingGlyph[], adjustments: GlyphAdjustment[], at: number, flags: number, markSet: number, advanceWidth: ((glyph: number) => number) | null): number {
    if (this.data.u16(sub) != 1)
      invalid("Invalid GPOS mark attachment format.");
    let markIndex = this.reads.coverage(this.data, this.offset(sub, sub + 2), glyphs[at].id);
    if (markIndex < 0)
      return 0;
    let parent = this.previous(glyphs, at, type != 6, flags, markSet);
    if (parent < 0 || (type == 6 && !this.filter.isMark(glyphs[parent])))
      return 0;
    if (type == 6 && glyphs[at].markLigature != null && glyphs[parent].markLigature == glyphs[at].markLigature &&
      glyphs[parent].markComponent != glyphs[at].markComponent)
      return 0;
    let baseIndex = this.reads.coverage(this.data, this.offset(sub, sub + 4), glyphs[parent].id);
    if (baseIndex < 0)
      return 0;
    let classes = this.data.u16(sub + 6), marks = this.offset(sub, sub + 8), bases = this.offset(sub, sub + 10);
    let markCount = this.data.u16(marks), baseCount = this.data.u16(bases);
    if (classes == 0 || markIndex >= markCount || baseIndex >= baseCount)
      invalid("Invalid GPOS mark attachment array index.");
    this.data.check(marks + 2, markCount * 4);
    this.data.check(bases + 2, checked(baseCount * (type == 5 ? 1 : classes) * 2));
    let record = marks + 2 + markIndex * 4, markClass = this.data.u16(record);
    if (markClass >= classes)
      invalid("Invalid GPOS mark class.");
    let anchorOrigin = bases;
    let baseField: number;
    if (type == 5)
    {
      anchorOrigin = this.offset(bases, bases + 2 + baseIndex * 2);
      let components = this.data.u16(anchorOrigin);
      if (components == 0)
        invalid("Empty GPOS ligature attachment.");
      this.data.check(anchorOrigin + 2, checked(components * classes * 2));
      // Unassociated marks (including directly encoded ligatures) use the last component.
      let component = glyphs[at].markLigature == glyphs[parent] ? glyphs[at].markComponent : components - 1;
      component = Math.min(component, components - 1);
      if (component < 0)
        invalid("Invalid ligature component association.");
      baseField = checked(anchorOrigin + 2 + (component * classes + markClass) * 2);
    }
    else
      baseField = checked(bases + 2 + (baseIndex * classes + markClass) * 2);
    if (this.data.u16(baseField) == 0)
      return 0; // This base/mark class has no attachment point.
    let markAnchor = this.anchor(this.offset(marks, record + 2));
    let baseAnchor = this.anchor(this.offset(anchorOrigin, baseField));
    let adjustment = adjustments[at];
    UnsafeRange.mark(glyphs, parent, at, this.charge);
    adjustment.parent = parent;
    adjustment.cursiveParent = -1;
    adjustment.xPlacement = checked(baseAnchor.x - markAnchor.x);
    adjustment.yPlacement = checked(baseAnchor.y - markAnchor.y);
    if (advanceWidth != null && !adjustment.zeroMarkAdvance)
    {
      adjustment.xAdvance = checked(adjustment.xAdvance - advanceWidth(glyphs[at].id));
      adjustment.zeroMarkAdvance = true;
    }
    return 1;
  }

  private previous(glyphs: ShapingGlyph[], at: number, skipMarks: boolean, flags: number, markSet: number): number {
    for (let parent = at - 1; parent >= 0; parent--)
    {
      this.tick();
      if (this.options.script === 'arab' && Unicode.isIgnorable(glyphs[parent].scalar)) continue;
      if (!this.filter.ignored(glyphs[parent].id, flags, markSet) && (!skipMarks || !this.filter.isMark(glyphs[parent])))
        return parent;
    }
    return -1;
  }

  private anchor(offset: number): FontAnchor {
    let format = this.data.u16(offset), x = this.data.i16(offset + 2), y = this.data.i16(offset + 4);
    if (format == 2)
      this.data.u16(offset + 6); // Contour-point hinting is deliberately not executed.
    else if (format == 3)
    {
      let xDevice = this.data.u16(offset + 6), yDevice = this.data.u16(offset + 8);
      if (xDevice != 0)
        this.device(checked(offset + xDevice));
      if (yDevice != 0)
        this.device(checked(offset + yDevice));
    }
    else if (format != 1)
      invalid("Invalid GPOS anchor format.");
    return new FontAnchor(x, y);
  }

  private device(offset: number): void {
    // Validate pixel corrections, but leave unhinted design coordinates unchanged.
    let start = this.data.u16(offset), end = this.data.u16(offset + 2), format = this.data.u16(offset + 4);
    if (format == 0x8000)
      unsupported("GPOS variation indices are unsupported.");
    if (format < 1 || format > 3 || end < start)
      invalid("Invalid GPOS device adjustment.");
    let bits = 1 << format;
    this.data.check(offset + 6, divide((end - start + 1) * bits + 15, 16) * 2);
  }

  private resolve(glyphs: ShapingGlyph[], adjustments: GlyphAdjustment[], advanceWidth: ((glyph: number) => number) | null): void {
    if (!adjustments.some(a => a.parent >= 0 || a.cursiveParent >= 0)) {
      // Independent placements already contain their final offsets.
      // Retain the pen overflow checks and exactly the same operation
      // charges as placements/resolveAxis, without their scratch arrays.
      let x = 0, y = 0;
      for (let i = 0; i < glyphs.length; i++) {
        this.tick();
        x = checked(x + (advanceWidth == null ? 0 : advanceWidth(glyphs[i].id)) + adjustments[i].xAdvance);
        y = checked(y + adjustments[i].yAdvance);
      }
      for (let axis = 0; axis < 2; axis++)
        for (let i = 0; i < glyphs.length; i++) { this.tick(); this.tick(); }
      return;
    }
    const [penX, penY, placedX, placedY] = this.placements(glyphs, adjustments, advanceWidth);
    for (let i = 0; i < adjustments.length; i++)
    {
      adjustments[i].xPlacement = placedX[i];
      adjustments[i].yPlacement = placedY[i];
    }
  }

  private placements(glyphs: ShapingGlyph[], adjustments: GlyphAdjustment[], advanceWidth: ((glyph: number) => number) | null): number[][] {
    let penX = new Array<number>(glyphs.length).fill(0), penY = new Array<number>(glyphs.length).fill(0);
    let x = 0, y = 0;
    for (let i = 0; i < glyphs.length; i++)
    {
      this.tick();
      penX[i] = x; penY[i] = y;
      x = checked(x + (advanceWidth == null ? 0 : advanceWidth(glyphs[i].id)) + adjustments[i].xAdvance);
      y = checked(y + adjustments[i].yAdvance);
      if ((this.options.script === 'hebr' || this.options.script === 'arab')) { penX[i] = -x; penY[i] = -y; }
    }
    const placedX = this.resolveAxis(adjustments, penX, false);
    const placedY = this.resolveAxis(adjustments, penY, true);
    return [penX, penY, placedX, placedY];
  }

  private resolveAxis(adjustments: GlyphAdjustment[], pen: number[], vertical: boolean): number[] {
    let result = new Array<number>(adjustments.length).fill(0);
    let state = new Array<number>(adjustments.length).fill(0);
    let path = new Array<number>();
    for (let i = 0; i < adjustments.length; i++)
    {
      path.length = 0;
      let at = i;
      while (at >= 0 && state[at] == 0)
      {
        this.tick();
        state[at] = 1;
        path.push(at);
        let a = adjustments[at];
        at = vertical && a.cursiveParent >= 0 ? a.cursiveParent : a.parent;
        if (at >= adjustments.length)
          invalid("Invalid GPOS attachment parent.");
      }
      if (at >= 0 && state[at] == 1)
        invalid("Cyclic GPOS attachment relationship.");
      for (let j = path.length - 1; j >= 0; j--)
      {
        this.tick();
        at = path[j];
        let a = adjustments[at];
        let parent = vertical && a.cursiveParent >= 0 ? a.cursiveParent : a.parent;
        let value = vertical ? a.yPlacement : a.xPlacement;
        result[at] = parent < 0 ? value : checked(value + result[parent] + pen[parent] - pen[at]);
        state[at] = 2;
      }
    }
    return result;
  }

  private cursive(sub: number, glyphs: ShapingGlyph[], adjustments: GlyphAdjustment[], at: number, next: number, flags: number, advanceWidth: ((glyph: number) => number) | null): number {
    if (this.data.u16(sub) != 1)
      invalid("Invalid GPOS cursive format.");
    let coverage = this.offset(sub, sub + 2), count = this.data.u16(sub + 4);
    this.data.check(sub + 6, count * 4);
    let first = this.coverage(coverage, glyphs[at].id);
    if (first < 0 || next >= glyphs.length)
      return 0;
    let second = this.coverage(coverage, glyphs[next].id);
    if (second < 0)
      return 0;
    if (first >= count || second >= count)
      invalid("Invalid GPOS cursive coverage index.");
    let exitField = sub + 8 + first * 4, entryField = sub + 6 + second * 4;
    if (this.data.u16(exitField) == 0 || this.data.u16(entryField) == 0)
      return 0;
    let exit = this.anchor(this.offset(sub, exitField)), entry = this.anchor(this.offset(sub, entryField));

    const [penX, penY, placedX, placedY] = this.placements(glyphs, adjustments, advanceWidth);
    // RTL removes the exit from the first logical glyph; LTR keeps it
    // on its advance. The complementary entry adjustment follows the next
    // glyph. Canonical LTR positioning keeps the exit on the first
    // glyph's advance, and removes the entry from both the next
    // glyph's placement and advance. Equal final ink positions alone
    // are insufficient: consumers also need the correct run width.
    if (this.options.script === 'arab') {
      const exitAdjustment = checked(placedX[at] + exit.x);
      adjustments[at].xAdvance = checked(adjustments[at].xAdvance - exitAdjustment);
      adjustments[at].xPlacement = checked(adjustments[at].xPlacement - exitAdjustment);
      adjustments[next].xAdvance = checked(placedX[next] + entry.x - (advanceWidth == null ? 0 : advanceWidth(glyphs[next].id)));
    } else {
      adjustments[at].xAdvance = checked(placedX[at] + exit.x -
        (advanceWidth == null ? 0 : advanceWidth(glyphs[at].id)));
      let entryAdjustment = checked(placedX[next] + entry.x);
      adjustments[next].xAdvance = checked(adjustments[next].xAdvance - entryAdjustment);
      adjustments[next].xPlacement = checked(adjustments[next].xPlacement - entryAdjustment);
    }
    UnsafeRange.mark(glyphs, at, next, this.charge);
    let child = (flags & 1) == 0 ? next : at, parent = (flags & 1) == 0 ? at : next;
    // Reversing an existing cursive connection must not create a cycle.
    // Keep the old parent's current baseline when breaking that connection.
    let ancestor = parent;
    for (let steps = 0; ancestor >= 0 && steps < adjustments.length; steps++)
    {
      this.tick();
      let previous = adjustments[ancestor].cursiveParent;
      if (previous == child)
      {
        adjustments[ancestor].cursiveParent = -1;
        adjustments[ancestor].yPlacement = placedY[ancestor];
        break;
      }
      ancestor = previous;
    }
    adjustments[child].cursiveParent = parent;
    adjustments[child].yPlacement = (flags & 1) == 0 ? checked(exit.y - entry.y) : checked(entry.y - exit.y);
    return 1; // The next glyph may start another connection.
  }

  private static valueSize(format: number): number {
    if ((format & ~0xff) != 0)
      invalid("Reserved GPOS value format bits.");
    let size = 0;
    for (let bit = 1; bit <= 128; bit <<= 1)
      if ((format & bit) != 0)
        size += 2;
    return size;
  }

  private value(sub: number, record: number, format: number, result: GlyphAdjustment): void {
    this.data.check(record, GlyphPositioning.valueSize(format));
    for (let bit = 1; bit <= 128; bit <<= 1)
    {
      if ((format & bit) == 0)
        continue;
      let value = this.data.i16(record);
      if (bit == 1)
        result.xPlacement = checked(result.xPlacement + value);
      else if (bit == 2)
        result.yPlacement = checked(result.yPlacement + value);
      else if (bit == 4)
        result.xAdvance = checked(result.xAdvance + value);
      else if (bit == 8)
      {
        // yAdvance is read but only applies to vertical layout.
        // This positioning pipeline is horizontal.
      }
      else if (this.data.u16(record) != 0)
      {
        this.device(checked(sub + this.data.u16(record)));
      }
      record += 2;
    }
  }

  private walk(glyphs: ShapingGlyph[], position: number, direction: number, flags: number, markSet: number): number {
    do
    {
      this.tick();
      position += direction;
    }
    while (position >= 0 && position < glyphs.length && this.filter.ignored(glyphs[position].id, flags, markSet));
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
      if (requireFeature && (this.activeRule != null && this.activeRule.value(glyphs[position].featureCluster, this.charge) == 0)) return false;
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

  private context(type: number, format: number, sub: number, coverage: number, glyphs: ShapingGlyph[], adjustments: GlyphAdjustment[], at: number, depth: number, flags: number, markSet: number, advanceWidth: ((glyph: number) => number) | null): number {
    let contextFirst = at, contextLast = at;
    let chained = type == 8;
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
        invalid("Empty GPOS context.");
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
      return match ? this.applyRecords(p, records, matched, glyphs, adjustments, at, depth, advanceWidth) : 0;
    }
    if (format != 1 && format != 2)
      unsupported("Unsupported GPOS context format.");
    let backClass = 0, inputClass = 0, aheadClass = 0, header = sub + 4;
    if (format == 2)
    {
      if (chained)
      {
        backClass = this.offset(sub, header);
        header += 2;
      }
      inputClass = this.offset(sub, header);
      header += 2;
      if (chained)
      {
        aheadClass = this.offset(sub, header);
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
      let p = this.offset(set, set + 2 + ruleIndex * 2), mode = format == 1 ? 0 : 1;
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
        invalid("Empty GPOS context.");
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
        return this.applyRecords(p, records, matched, glyphs, adjustments, at, depth, advanceWidth);
      }
    }
    return 0;
  }

  private applyRecords(p: number, records: number, matched: ShapingGlyph[], glyphs: ShapingGlyph[], adjustments: GlyphAdjustment[], at: number, depth: number, advanceWidth: ((glyph: number) => number) | null): number {
    this.data.check(p, records * 4);
    for (let i = 0; i < records; i++)
    {
      this.tick();
      let index = this.data.u16(p + i * 4), lookup = this.data.u16(p + i * 4 + 2);
      if (index >= matched.length)
        invalid("Invalid GPOS contextual sequence index.");
      this.applyAt(lookup, glyphs, adjustments, glyphs.indexOf(matched[index]), depth + 1, advanceWidth);
    }
    return glyphs.indexOf(matched[matched.length - 1]) + 1 - at;
  }

  private coverage(offset: number, glyph: number): number { return this.reads.coverage(this.data, offset, glyph); }
  private class(offset: number, glyph: number): number { return this.reads.class(this.data, offset, glyph); }

  // Scalar pair seam: first glyph's horizontal advance adjustment from
  // the default kern feature, without GSUB or mark advance suppression.
  // Full shaping remains authoritative for contextual text and offsets.
  pairKerning(left: number, right: number): number {
    this.operations = 0;
    let result = 0;
    for (const index of this.kerningLookups)
    {
      this.tick();
      let lookup = this.offset(this.lookupList, this.lookupList + 2 + index * 2), type = this.data.u16(lookup), flags = this.data.u16(lookup + 2);
      let count = this.data.u16(lookup + 4), markSet = (flags & 16) != 0 ? this.data.u16(lookup + 6 + count * 2) : -1;
      this.data.check(lookup + 6, count * 2);
      this.filter.validate(flags, markSet);
      if (this.filter.ignored(left, flags, markSet) || this.filter.ignored(right, flags, markSet)) continue;
      for (let i = 0; i < count; i++)
      {
        this.tick();
        let sub = this.offset(lookup, lookup + 6 + i * 2), actualType = type;
        if (type == 9)
        {
          if (this.data.u16(sub) != 1 || this.data.u16(sub + 2) == 9 || this.data.offset32(sub + 4) == 0)
            invalid("Invalid GPOS extension.");
          actualType = this.data.u16(sub + 2);
          sub = checked(sub + this.data.offset32(sub + 4));
        }
        if (actualType != 2)
        {
          let glyphs = [ new ShapingGlyph(left, 65, 0), new ShapingGlyph(right, 66, 1) ];
          return this.applySelected(glyphs, null, this.kerningLookups)[0].xAdvance;
        }
        let coverage = this.coverage(this.offset(sub, sub + 2), left);
        if (coverage < 0) continue;
        let format = this.data.u16(sub), firstFormat = this.data.u16(sub + 4), secondFormat = this.data.u16(sub + 6);
        let firstSize = GlyphPositioning.valueSize(firstFormat), secondSize = GlyphPositioning.valueSize(secondFormat), value, origin = sub;
        if (format == 1)
        {
          let sets = this.data.u16(sub + 8);
          if (coverage >= sets) invalid("Invalid GPOS pair coverage index.");
          this.data.check(sub + 10, sets * 2);
          let set = this.offset(sub, sub + 10 + coverage * 2), entries = this.data.u16(set), stride = 2 + firstSize + secondSize;
          this.data.check(set + 2, entries * stride);
          let low = 0, high = entries - 1;
          value = -1;
          while (low <= high)
          {
            this.tick();
            let middle = low + divide(high - low, 2), record = set + 2 + middle * stride, id = this.data.u16(record);
            if (id < right) low = middle + 1;
            else if (id > right) high = middle - 1;
            else { value = record + 2; break; }
          }
          if (value < 0) continue;
          origin = set;
        }
        else if (format == 2)
        {
          let row = this.class(this.offset(sub, sub + 8), left), column = this.class(this.offset(sub, sub + 10), right);
          let rows = this.data.u16(sub + 12), columns = this.data.u16(sub + 14);
          if (row >= rows || column >= columns) invalid("Invalid GPOS pair class index.");
          this.data.check(sub + 16, checked(rows * columns * (firstSize + secondSize)));
          value = checked(sub + 16 + (row * columns + column) * (firstSize + secondSize));
        }
        else invalid("Invalid GPOS pair format.");
        let adjustment = new GlyphAdjustment();
        this.value(origin, value, firstFormat, adjustment);
        // Validate the second record even though this scalar seam
        // deliberately exposes only the first advance.
        this.value(origin, value + firstSize, secondFormat, new GlyphAdjustment());
        result = checked(result + adjustment.xAdvance);
        break;
      }
    }
    return result;
  }
}
