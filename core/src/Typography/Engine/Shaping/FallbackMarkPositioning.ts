// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { TrueTypeFont } from '../Fonts/Sfnt/TrueTypeFont';
import type { ShapingGlyph } from '../Layout/Common/ShapingGlyph';
import type { GlyphAdjustment } from '../Layout/Gpos/GlyphAdjustment';
import type { ShapingLimits } from '../Api/ShapingLimits';
import { invalid } from '../Api/FontError';
import { checked, divide } from '../Data/Integer';
import * as Unicode from '../Unicode/Generated/UnicodeData';
export function positionFallbackMarks(font: TrueTypeFont, glyphs: ShapingGlyph[], adjustments: GlyphAdjustment[], limits: ShapingLimits, hebrew = false): void {
  if (font.hasTable('GPOS')) return;
  let pen = 0, basePen = 0, baseAdvance = 0, baseId = 0, priorClass = -1, stacked = 0, operations = 0, hasBase = false;
  for (let i = 0; i < glyphs.length; i++) {
    if (++operations > limits.maxOperations) invalid('Fallback mark operation limit exceeded.');
    const glyph = glyphs[i], a = adjustments[i]; let ccc = Unicode.combiningClass(glyph.scalar);
    if (hebrew) {
      const cp = glyph.scalar;
      if ((cp >= 0x5b0 && cp <= 0x5b8) || cp === 0x5bb || cp === 0x5bd || cp === 0x5c7) ccc = 220;
      else if (cp === 0x5b9 || cp === 0x5ba || cp === 0x5c2) ccc = 228;
      else if (cp === 0x5bc) ccc = 1;
      else if (cp === 0x5bf) ccc = 214;
      else if (cp === 0x5c1) ccc = 232;
    }
    if (a.zeroMarkAdvance && ccc !== 0 && hasBase) {
      const mark = font.readGlyph(glyph.id), outline = font.readGlyph(baseId), gap = ccc === 202 || ccc === 214 || ccc === 216 ? 0 : divide(font.unitsPerEm, 16);
      let center = divide(baseAdvance, 2) - divide(mark.xMin + mark.xMax, 2);
      if (ccc === 233 || ccc === 234) center = baseAdvance - divide(mark.xMin + mark.xMax, 2);
      if (ccc === 218 || ccc === 228) center = -mark.xMin;
      else if (ccc === 222 || ccc === 232 || ccc === 216) center = baseAdvance - mark.xMax;
      a.xPlacement = checked(a.xPlacement + basePen + center - pen + (hebrew ? baseAdvance : 0)); if (ccc !== priorClass) stacked = 0;
      if (ccc === 202 || ccc === 233 || (ccc >= 218 && ccc <= 222)) a.yPlacement = checked(a.yPlacement + outline.yMin - mark.yMax - gap - stacked);
      else if (ccc === 214 || ccc === 216 || (ccc >= 228 && ccc <= 234)) a.yPlacement = checked(a.yPlacement + outline.yMax - mark.yMin + gap + stacked);
      if (ccc !== 1) stacked = checked(stacked + mark.yMax - mark.yMin + gap); priorClass = ccc;
    } else if (!a.zeroMarkAdvance && !Unicode.isIgnorable(glyph.scalar)) {
      hasBase = true; basePen = pen; baseAdvance = checked(font.advanceWidth(glyph.id) + a.xAdvance); baseId = glyph.id; priorClass = -1; stacked = 0;
    }
    pen = checked(pen + font.advanceWidth(glyph.id) + a.xAdvance);
  }
}
