import { TtfFont } from './TrueType/TtfFont';
import { toFontWeight, type FontWeightInput } from '../Normalize/toEnum';
import type { FallbackFont } from './FontManager';

import { DOCUMENT_FONT_PREFIX } from './DocumentFontName';

export { DOCUMENT_FONT_PREFIX, isDocumentFontName } from './DocumentFontName';

/** Options for {@link DocumentFonts.add}. Anything omitted is read from the font. */
export interface DocumentFontOptions {
  /** Family name. Defaults to the font's own. */
  family?: string;
  /** Weight, 1-1000 or a token (`'bold'`). Defaults to the font's OS/2 weight class, or its subfamily's name. */
  weight?: FontWeightInput | number;
  /** Whether the face is italic or oblique. Defaults to the font's OS/2 flags, or its subfamily's name. */
  italic?: boolean;
}

/** One font file in a document, identified by family, weight and italic. */
export interface DocumentFontFace {
  /** Family name as given (compared ignoring case and surrounding white space). */
  readonly family: string;
  /** Weight, 1-1000. */
  readonly weight: number;
  readonly italic: boolean;
  /**
   * A font name that selects this face wherever an element takes one (`fontName`, a
   * watermark, a table of contents). Opaque, valid for the document that made it only,
   * and never written to the output.
   */
  readonly fontName: string;
  /** The font file. */
  readonly bytes: Uint8Array;
  /**
   * The parsed font.
   * @internal
   */
  readonly font: TtfFont;
}

const SUBFAMILY_WEIGHTS: ReadonlyArray<readonly [string, number]> = [
  ['thin', 100],
  ['extralight', 200],
  ['ultralight', 200],
  ['light', 300],
  ['regular', 400],
  ['book', 400],
  ['normal', 400],
  ['medium', 500],
  ['semibold', 600],
  ['demibold', 600],
  ['extrabold', 800],
  ['ultrabold', 800],
  ['bold', 700],
  ['black', 900],
  ['heavy', 900],
];

let nextDocumentSerial = 1;

function familyKey(family: string): string {
  return family.trim().toLowerCase();
}

function detectWeight(font: TtfFont): number {
  if (font.weightClass !== undefined) return font.weightClass;
  const words = font.fontSubfamily.toLowerCase().replace(/[\s_-]/g, '');
  for (const [name, weight] of SUBFAMILY_WEIGHTS) if (words.includes(name)) return weight;
  return 400;
}

function detectItalic(font: TtfFont): boolean {
  if (font.selectionItalic) return true;
  const subfamily = font.fontSubfamily.toLowerCase();
  return subfamily.includes('italic') || subfamily.includes('oblique');
}

/**
 * The fonts that belong to one document.
 *
 * A collection of faces, any number of families with any number of weights and styles
 * each. Nothing added here is visible to another document, and nothing global changes.
 * See spec 16 for the resolution rules.
 */
export class DocumentFonts {
  private readonly serial = nextDocumentSerial++;
  private readonly byIdentity = new Map<string, DocumentFontFace>();
  private readonly resolved = new Map<string, DocumentFontFace | undefined>();

  /** The faces, in registration order. */
  public get faces(): readonly DocumentFontFace[] {
    return [...this.byIdentity.values()];
  }

  /** True when the collection holds no face. */
  public get isEmpty(): boolean {
    return this.byIdentity.size === 0;
  }

  /**
   * Adds a TrueType font. A face with the same family, weight and italic replaces the
   * earlier one and keeps its place. Throws when the bytes are not a readable font, or the
   * weight is outside 1-1000.
   *
   * @example
   * ```ts
   * const doc = new Document();
   * doc.fonts.add(interRegularBytes, { family: 'Inter' });
   * doc.fonts.add(interBoldBytes, { family: 'Inter', weight: FontWeight.Bold });
   * doc.add(new TextBlock('Set in Inter', { fontFamily: 'Inter' }));
   * ```
   */
  public add(bytes: Uint8Array, options: DocumentFontOptions = {}): DocumentFontFace {
    // The same parse the PDF writer uses for these bytes, so measuring and writing share one
    // font and its shaping cache, and a service that keeps its font arrays parses once.
    const font = TtfFont.loadFromBytesCached(bytes);
    const family = (options.family ?? font.fontFamily).trim();
    if (!family) throw new Error('A document font needs a family name.');
    const weight = options.weight === undefined ? detectWeight(font) : toFontWeight(options.weight);
    if (!Number.isFinite(weight) || weight < 1 || weight > 1000) {
      throw new Error(`Font weight must be between 1 and 1000; got ${String(weight)}.`);
    }
    const italic = options.italic ?? detectItalic(font);

    const identity = `${familyKey(family)}:${weight}:${italic ? 'i' : 'n'}`;
    const face: DocumentFontFace = {
      family,
      weight,
      italic,
      fontName: `${DOCUMENT_FONT_PREFIX}${this.serial}/${identity}`,
      bytes,
      font,
    };
    // A Map keeps the original position when a key is set again.
    this.byIdentity.set(identity, face);
    this.resolved.clear();
    return face;
  }

  /**
   * The face for a family, weight and italic, or `undefined` when the document has no such
   * family. Style is matched first, then weight by the CSS font-matching order.
   */
  public resolve(family: string, weight: number, italic: boolean): DocumentFontFace | undefined {
    // Layout resolves the same few families for every line it measures and draws.
    const memoKey = `${italic ? 'i' : 'n'}${weight}:${family}`;
    if (this.resolved.has(memoKey)) return this.resolved.get(memoKey);
    const face = this.resolveUncached(family, weight, italic);
    this.resolved.set(memoKey, face);
    return face;
  }

  private resolveUncached(family: string, weight: number, italic: boolean): DocumentFontFace | undefined {
    const key = familyKey(family);
    const candidates = this.faces.filter(f => familyKey(f.family) === key);
    if (candidates.length === 0) return undefined;

    const styled = candidates.filter(f => f.italic === italic);
    const pool = styled.length > 0 ? styled : candidates;

    const exact = pool.find(f => f.weight === weight);
    if (exact) return exact;

    const heavier = pool.filter(f => f.weight > weight).sort((a, b) => a.weight - b.weight);
    const lighter = pool.filter(f => f.weight < weight).sort((a, b) => b.weight - a.weight);
    if (weight >= 400 && weight <= 500) {
      return heavier.find(f => f.weight <= 500) ?? lighter[0] ?? heavier[0];
    }
    if (weight < 400) return lighter[0] ?? heavier[0];
    return heavier[0] ?? lighter[0];
  }

  /**
   * The face made by {@link add} that has this font name, or `undefined`.
   * @internal
   */
  public faceForFontName(fontName: string): DocumentFontFace | undefined {
    for (const face of this.byIdentity.values()) if (face.fontName === fontName) return face;
    return undefined;
  }

  /**
   * The faces as glyph-fallback candidates, in registration order.
   * @internal
   */
  public fallbackFonts(): FallbackFont[] {
    return this.faces.map(face => ({ key: face.fontName, bytes: face.bytes, font: face.font }));
  }
}
