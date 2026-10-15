// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { TrueTypeFont } from './Sfnt/TrueTypeFont';
import { SfntDirectory } from './Sfnt/SfntDirectory';
import { ShapingLimits, type ShapingLimitOptions } from '../Api/ShapingLimits';
import { ShapeOptions } from '../Api/ShapeOptions';
import { ShapingGlyph } from '../Layout/Common/ShapingGlyph';
import { requireInteger, argument, unsupported } from '../Api/FontError';
import { ColourLayers } from './Colour/ColourLayers';
import { BitmapStrikes } from './Colour/BitmapStrikes';
import type { PaletteColour } from './Colour/PaletteColour';
import type { ColourLayerData } from './Colour/ColourLayerData';
import { GlyphSubstitution } from '../Layout/Gsub/GlyphSubstitution';
import { GlyphPositioning } from '../Layout/Gpos/GlyphPositioning';
import { ShapingProgram } from '../Shaping/ShapingProgram';
export interface FaceOptions { faceIndex?: number; limits?: ShapingLimitOptions; }
export class FontFace {
  readonly limits: ShapingLimits; readonly font: TrueTypeFont; readonly name: string;
  readonly substitution: GlyphSubstitution; readonly positioning: GlyphPositioning; readonly bitmaps: BitmapStrikes | null;
  readonly #colours: ColourLayers | null; readonly #programs = new Map<ShapeOptions, ShapingProgram>();
  readonly #programsByValue = new Map<string, ShapingProgram>();
  #defaultProgram: ShapingProgram | null = null;
  // Per-call scratch for the shaping pipeline. A face serves one caller at a time, so a
  // shape call reuses the previous call's glyph records.
  readonly #run: ShapingGlyph[] = [];
  readonly #glyphPool: ShapingGlyph[] = [];
  #glyphsRented = 0;
  // Options are immutable; shape calls without options share one default.
  readonly defaultOptions = new ShapeOptions();
  // advanceWidth as a function value, created once rather than on every shape call.
  readonly advanceWidthOf = (glyph: number): number => this.font.advanceWidth(glyph);
  // Starts a shape call: an empty run, and every pooled glyph record free again.
  beginRun(): ShapingGlyph[] { this.#run.length = 0; this.#glyphsRented = 0; return this.#run; }
  rentGlyph(id: number, scalar: number, cluster: number): ShapingGlyph {
    if (this.#glyphsRented < this.#glyphPool.length) return this.#glyphPool[this.#glyphsRented++].reset(id, scalar, cluster);
    const glyph = new ShapingGlyph(id, scalar, cluster); this.#glyphPool.push(glyph); this.#glyphsRented++; return glyph;
  }
  constructor(bytes: Uint8Array, options: FaceOptions = {}) {
    this.limits = new ShapingLimits(options.limits);
    this.font = new TrueTypeFont(bytes, { faceIndex: options.faceIndex, outlines: this.limits.outlines });
    this.name = this.font.names.family ?? 'Unnamed font';
    const colr = this.font.getTableData('COLR');
    this.#colours = colr ? new ColourLayers(colr, this.font.getTableData('CPAL'), this.glyphCount, this.limits.colours) : null;
    if (this.font.hasTable('SVG ') && !this.#colours && !this.font.hasTable('CBDT')) unsupported('SVG-only colour fonts are unsupported.');
    this.bitmaps = this.font.hasTable('CBDT') || this.font.hasTable('CBLC') ? new BitmapStrikes(this.font.getTableData('CBLC'), this.font.getTableData('CBDT'), this.glyphCount, this.limits.colours) : null;
    if (this.font.hasTable('sbix')) unsupported('sbix bitmap fonts are unsupported; use CBDT.');
    this.substitution = new GlyphSubstitution(this.getTableData('GSUB'), this.glyphCount, this.getTableData('GDEF'), this.limits);
    this.positioning = new GlyphPositioning(this.getTableData('GPOS'), this.getTableData('GDEF'), this.limits);
  }
  program(options?: ShapeOptions): ShapingProgram {
    if (!options) return this.#defaultProgram ??= new ShapingProgram(this.substitution, this.positioning);
    if (options.limits === null) {
      // Callers build a fresh options instance per call (feature overrides, bidi
      // items), so equal options share a program by value rather than identity.
      const key = programKey(options);
      let shared = this.#programsByValue.get(key); if (shared) return shared;
      shared = this.#buildProgram(options, this.limits);
      if (this.#programsByValue.size < 16) this.#programsByValue.set(key, shared); return shared;
    }
    let program = this.#programs.get(options); if (program) return program;
    program = this.#buildProgram(options, options.limits);
    if (this.#programs.size < 16) this.#programs.set(options, program); return program;
  }
  #buildProgram(options: ShapeOptions, limits: ShapingLimits): ShapingProgram {
    return new ShapingProgram(new GlyphSubstitution(this.getTableData('GSUB'), this.glyphCount, this.getTableData('GDEF'), limits, options), new GlyphPositioning(this.getTableData('GPOS'), this.getTableData('GDEF'), limits, options));
  }
  get metrics() { return this.font.metrics; } get names() { return this.font.names; }
  get faceCount() { return this.font.faceCount; } get faceIndex() { return this.font.faceIndex; }
  get unitsPerEm() { return this.font.unitsPerEm; } get glyphCount() { return this.font.glyphCount; }
  mapGlyph(scalar: number) { return this.font.mapGlyph(scalar); } covers(scalar: number) { return this.mapGlyph(scalar) !== 0; }
  mapVariation(scalar: number, selector: number) { return this.font.mapVariation(scalar, selector); }
  advanceWidth(glyph: number) { return this.font.advanceWidth(glyph); } leftSideBearing(glyph: number) { return this.font.leftSideBearing(glyph); }
  readGlyph(glyph: number) { return this.font.readGlyph(glyph); } getTableData(tag: string) { return this.font.getTableData(tag); }
  static countFaces(bytes: Uint8Array) { return SfntDirectory.count(bytes); }
  getPairKerning(leftGlyph: number, rightGlyph: number): number {
    requireInteger(leftGlyph, 'leftGlyph', 0, this.glyphCount - 1); requireInteger(rightGlyph, 'rightGlyph', 0, this.glyphCount - 1);
    return this.positioning.hasKerning ? this.positioning.pairKerning(leftGlyph, rightGlyph) : this.font.kerning.get(leftGlyph, rightGlyph);
  }
  get hasColour() { return this.#colours !== null || this.bitmaps !== null; } get paletteCount() { return this.#colours?.paletteCount ?? 0; }
  palette(palette: number) { if (!this.#colours) argument('palette'); return this.#colours.palette(palette); }
  layers(glyph: number, options: { palette?: number; foreground?: PaletteColour } = {}): readonly ColourLayerData[] {
    requireInteger(glyph, 'glyph', 0, this.glyphCount - 1);
    if (this.#colours) return this.#colours.read(glyph, options);
    if ((options.palette ?? 0) !== 0) argument('palette'); return Object.freeze([]);
  }
  bitmapGlyph(glyph: number, ppem: number) {
    requireInteger(glyph, 'glyph', 0, this.glyphCount - 1); requireInteger(ppem, 'ppem', 1, 65535); return this.bitmaps?.read(glyph, ppem) ?? null;
  }
}
// Script and language are four-character tags, so plain concatenation is unambiguous.
function programKey(options: ShapeOptions): string {
  let key = options.script + options.language + options.direction;
  for (const feature of options.features) key += ';' + feature.tag + feature.value + ',' + feature.start + ',' + feature.end;
  return key;
}
