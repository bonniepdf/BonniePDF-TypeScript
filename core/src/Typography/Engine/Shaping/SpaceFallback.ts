// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { TrueTypeFont } from '../Fonts/Sfnt/TrueTypeFont';
import { divide } from '../Data/Integer';
export function spaceWidth(font: TrueTypeFont, scalar: number): number | null {
  const em = font.unitsPerEm; let denominator: number;
  switch (scalar) {
    case 0xa0: return font.mapGlyph(32) === 0 ? null : font.advanceWidth(font.mapGlyph(32));
    case 0x2000: case 0x2002: denominator = 2; break;
    case 0x2001: case 0x2003: case 0x3000: denominator = 1; break;
    case 0x2004: denominator = 3; break; case 0x2005: denominator = 4; break; case 0x2006: denominator = 6; break;
    case 0x2009: denominator = 5; break; case 0x200a: denominator = 16; break;
    case 0x205f: return divide(em * 2 + 4, 9);
    case 0x202f: return divide(font.advanceWidth(font.mapGlyph(32)) + 1, 2);
    case 0x2007: case 0x2008: { const reference = font.mapGlyph(scalar === 0x2007 ? 48 : 46); return font.advanceWidth(reference === 0 ? font.mapGlyph(32) : reference); }
    default: return null;
  }
  return divide(em + divide(denominator, 2), denominator);
}
