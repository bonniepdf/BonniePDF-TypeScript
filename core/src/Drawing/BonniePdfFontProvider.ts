import { getPlatformIO } from '../Platform/PlatformIO';
import type { FontFace, FontProvider } from '../Rendering/Svg/Fonts/FontFace';
import { TextFontFaceAdapter } from './TextFontFaceAdapter';
import { FontFamilyResolver } from '../Typography/FontFamilyResolver';
import { getDocumentFontBytes } from '../Typography/DocumentFontMetricScope';
import { FontManager } from '../Typography/FontManager';
import type { FontWeight } from '../Typography/FontWeight';

/** Registered subfamilies to try for a style, best match first. */
const SUBFAMILIES: Record<string, readonly string[]> = {
  regular: ['regular'],
  bold: ['bold', 'regular'],
  italic: ['italic', 'regular'],
  bolditalic: ['bolditalic', 'bold', 'italic', 'regular'],
};

/**
 * Supplies the SVG importer with the fonts registered with BonniePDF.
 *
 * A family name resolves as it would for a paragraph - registered custom
 * families, the standard families and their aliases (`Arial` and `sans-serif`
 * to Helvetica, and so on), with the Liberation faces behind the standard
 * families supplying the outlines - and then as the name of a font registered
 * with {@link FontManager}. A name that resolves to nothing returns
 * `undefined`, so the importer moves on to the next family in the list: unlike
 * a paragraph, imported SVG never falls back to a font nobody chose.
 */
export class BonniePdfFontProvider implements FontProvider {
  private readonly faces = new Map<Uint8Array, FontFace | undefined>();

  resolve(family: string, weight: number, italic: boolean): FontFace | undefined {
    const bytes = this.bytesFor(family, weight, italic);
    if (bytes === undefined) return undefined;
    if (!this.faces.has(bytes)) this.faces.set(bytes, parse(bytes, family));
    return this.faces.get(bytes);
  }

  private bytesFor(family: string, weight: number, italic: boolean): Uint8Array | undefined {
    const resolved = FontFamilyResolver.resolveKnown(family, weight as FontWeight, italic);
    if (resolved !== undefined) {
      return (
        getDocumentFontBytes(resolved) ??
        FontManager.getBytesForStandardFont(resolved) ??
        FontManager.getBytesForIdentifier(resolved) ??
        FontManager.getRegisteredFont(resolved)?.bytes ??
        readFile(resolved)
      );
    }

    const bold = weight >= 600;
    const style = bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'regular';
    for (const subfamily of SUBFAMILIES[style]) {
      const registered = FontManager.getBytesForFamily(family.trim(), subfamily);
      if (registered) return registered;
    }
    return undefined;
  }
}

function parse(bytes: Uint8Array, family: string): FontFace | undefined {
  try {
    return new TextFontFaceAdapter(bytes, family);
  } catch {
    // A font the importer cannot outline (CFF, say) is skipped like one that is
    // absent, and the importer reports the text if nothing else covers it.
    return undefined;
  }
}

function readFile(path: string): Uint8Array | undefined {
  try {
    return getPlatformIO().readFileSync?.(path) ?? undefined;
  } catch {
    return undefined;
  }
}
