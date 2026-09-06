import { TtfFont } from './TrueType/TtfFont';
import { getPlatformIO } from '../Platform/PlatformIO';

/**
 * Standard PDF font identifier → Liberation family+weight lookup.
 * Liberation fonts are metric-compatible substitutes (OFL license) that
 * satisfy PDF/A-1b §6.3.4 (full embedding required).
 */
const STANDARD_FONT_MAP: Record<string, { family: string; weight: string }> = {
  // Helvetica family → Liberation Sans
  Helvetica: { family: 'liberation sans', weight: 'regular' },
  'Helvetica-Bold': { family: 'liberation sans', weight: 'bold' },
  'Helvetica-Oblique': { family: 'liberation sans', weight: 'italic' },
  'Helvetica-BoldOblique': { family: 'liberation sans', weight: 'bolditalic' },
  // Times family → Liberation Serif
  'Times-Roman': { family: 'liberation serif', weight: 'regular' },
  'Times-Bold': { family: 'liberation serif', weight: 'bold' },
  'Times-Italic': { family: 'liberation serif', weight: 'italic' },
  'Times-BoldItalic': { family: 'liberation serif', weight: 'bolditalic' },
  // Courier family → Liberation Mono
  Courier: { family: 'liberation mono', weight: 'regular' },
  'Courier-Bold': { family: 'liberation mono', weight: 'bold' },
  'Courier-Oblique': { family: 'liberation mono', weight: 'italic' },
  'Courier-BoldOblique': { family: 'liberation mono', weight: 'bolditalic' },
};

/** Normalizes a weight string: "Bold Italic", "BoldItalic", "bold italic" → "bolditalic". */
function normalizeWeight(raw: string): string {
  return raw.toLowerCase().replace(/[\s_-]/g, '');
}

/** Registry entry: either raw bytes already loaded, or a file path to load lazily. */
type FontEntry = { kind: 'bytes'; bytes: Uint8Array } | { kind: 'file'; path: string; bytes?: Uint8Array };

const BUNDLED_FONTS: ReadonlyArray<readonly [string, string, string]> = [
  ['LiberationSans-Regular', 'liberation sans', 'regular'],
  ['LiberationSans-Bold', 'liberation sans', 'bold'],
  ['LiberationSans-Italic', 'liberation sans', 'italic'],
  ['LiberationSans-BoldItalic', 'liberation sans', 'bolditalic'],
  ['LiberationSerif-Regular', 'liberation serif', 'regular'],
  ['LiberationSerif-Bold', 'liberation serif', 'bold'],
  ['LiberationSerif-Italic', 'liberation serif', 'italic'],
  ['LiberationSerif-BoldItalic', 'liberation serif', 'bolditalic'],
  ['LiberationMono-Regular', 'liberation mono', 'regular'],
  ['LiberationMono-Bold', 'liberation mono', 'bold'],
  ['LiberationMono-Italic', 'liberation mono', 'italic'],
  ['LiberationMono-BoldItalic', 'liberation mono', 'bolditalic'],
];

/**
 * Global font registry for BonniePDF.
 *
 * Fonts registered here are automatically substituted for standard PDF type-1
 * fonts (Helvetica, Times-Roman, Courier) when `pdfAEnabled: true` is set on
 * `DocumentSettings`. This allows the library to produce genuinely PDF/A-1b
 * conformant output without the caller having to supply font paths on every
 * element.
 *
 * **Node.js zero-config**: the `index.node.ts` entry-point calls
 * `FontManager.autoRegisterBundledFonts()` at startup, which registers the
 * bundled Liberation Sans / Serif / Mono fonts automatically. No code changes
 * are needed on the caller side.
 *
 * **Browser usage**: call `FontManager.registerFont(bytes)` with the raw TTF
 * bytes before generating any document. A Vite/webpack import or `fetch()`
 * from a CDN both work:
 *
 * ```typescript
 * import { FontManager } from '@bonniepdf/core';
 * import fontBytes from './LiberationSans-Regular.ttf?uint8array';
 * FontManager.registerFont(fontBytes);
 * ```
 */
/** A registered font available to the glyph-fallback chain. */
export interface FallbackFont {
  /** Registry key (`family:weight`), stable across the document. */
  key: string;
  /** Raw TTF bytes, for embedding the fallback font on demand. */
  bytes: Uint8Array;
  /** Parsed font, for glyph-coverage probing. */
  font: TtfFont;
}

/** Optional names supplied when registering in-memory font bytes. `identifier`
 * binds the bytes to the exact document font reference (commonly a browser URL)
 * so export does not need to fetch that resource a second time. */
export interface FontRegistrationOptions {
  family?: string;
  subfamily?: string;
  identifier?: string;
}

/** Registers font bytes and resolves font families, weights, fallbacks, and bundled substitutes. */
export class FontManager {
  // Keys: `${family.toLowerCase()}:${normalizedWeight}`
  private static readonly registry = new Map<string, FontEntry>();

  /** Exact document font identifier (URL/path) -> already loaded bytes. */
  private static readonly identifierRegistry = new Map<string, Uint8Array>();

  /** Parsed-font cache for the fallback chain, keyed like {@link registry}. */
  private static readonly fallbackCache = new Map<string, TtfFont | null>();

  /**
   * Registers a TrueType font from raw bytes.
   * The family name is read from the font's name table (ID 1) unless overridden.
   *
   * ```typescript
   * const bytes = await fetch('/fonts/MyFont-Bold.ttf').then(r => r.arrayBuffer());
   * FontManager.registerFont(new Uint8Array(bytes), { family: 'MyFont', subfamily: 'Bold' });
   * ```
   */
  public static registerFont(bytes: Uint8Array, opts?: FontRegistrationOptions): void {
    const font = TtfFont.loadFromBytes(bytes);
    const family = (opts?.family ?? font.fontFamily).toLowerCase();
    const weight = normalizeWeight(opts?.subfamily ?? font.fontSubfamily ?? 'Regular');
    const key = `${family}:${weight}`;
    this.registry.set(key, { kind: 'bytes', bytes });
    this.fallbackCache.delete(key);
    if (opts?.identifier) this.identifierRegistry.set(opts.identifier, bytes);
  }

  /** Returns bytes registered for an exact document font identifier. */
  public static getBytesForIdentifier(identifier: string): Uint8Array | null {
    return this.identifierRegistry.get(identifier) ?? null;
  }

  /**
   * Registers a TrueType font from a file path (Node.js only).
   * Loading is deferred until the font is first needed.
   *
   * Called automatically by `autoRegisterBundledFonts()`.
   */
  public static registerFontFile(path: string, opts?: { family?: string; subfamily?: string }): void {
    // Read the name table to derive the key without holding the entire parse in memory.
    const font = TtfFont.fromFileSync(path);
    const family = (opts?.family ?? font.fontFamily).toLowerCase();
    const weight = normalizeWeight(opts?.subfamily ?? font.fontSubfamily ?? 'Regular');
    const key = `${family}:${weight}`;
    this.registry.set(key, { kind: 'file', path });
    this.fallbackCache.delete(key);
  }

  /**
   * Registers a font file path directly by key (Node.js only).
   * Called by `index.node.ts` after it resolves paths with `fs`/`path`.
   */
  public static registerFontFilePath(key: string, filePath: string): void {
    this.registry.set(key, { kind: 'file', path: filePath });
    this.fallbackCache.delete(key);
  }

  /**
   * Returns raw TTF bytes for the given standard PDF font identifier
   * (e.g. `"Helvetica"`, `"Times-Bold"`, `"Courier-Oblique"`), or
   * `null` if no substitution font has been registered.
   *
   * Called by `PdfResourceRegistry` when `pdfAEnabled = true` and the
   * document uses a standard-14 font.
   */
  public static getBytesForStandardFont(standardFontName: string): Uint8Array | null {
    const mapping = STANDARD_FONT_MAP[standardFontName];
    if (!mapping) return null;
    return this.getBytesForFamily(mapping.family, mapping.weight);
  }

  /**
   * Returns raw TTF bytes for a registered family/weight pair, or `null`.
   * `family` is case-insensitive; `weight` is normalized (spaces and dashes stripped).
   */
  public static getBytesForFamily(family: string, subfamily: string): Uint8Array | null {
    const key = `${family.toLowerCase()}:${normalizeWeight(subfamily)}`;
    const entry = this.registry.get(key);
    if (!entry) return null;

    if (entry.kind === 'bytes') return entry.bytes;

    // Lazy-load from file
    if (!entry.bytes) {
      entry.bytes = this.loadFileBytes(entry.path);
    }
    return entry.bytes ?? null;
  }

  /**
   * Returns `true` if at least one substitution font is registered.
   * Used by `PdfDocumentSerializer` to decide whether to enforce PDF/A.
   */
  public static hasBundledFonts(): boolean {
    return this.registry.size > 0;
  }

  /**
   * Returns every registered font (in registration order) parsed for
   * glyph-coverage probing, for use as a glyph-fallback chain. Fonts whose
   * bytes fail to parse are skipped. The parsed instances are cached.
   *
   * The fallback chain lets the encoder render a code point the primary font
   * lacks (e.g. a `★` bullet, a symbol, an emoji) using the first registered
   * font that covers it, rather than emitting a forbidden `.notdef` glyph.
   */
  public static getFallbackFonts(): FallbackFont[] {
    const result: FallbackFont[] = [];
    for (const key of this.registry.keys()) {
      const bytes = this.getBytesForKey(key);
      if (!bytes) continue;

      const font = this.getParsedFont(key, bytes);
      if (font) result.push({ key, bytes, font });
    }
    return result;
  }

  private static getBytesForKey(key: string): Uint8Array | null {
    const entry = this.registry.get(key);
    if (!entry) return null;
    if (entry.kind === 'bytes') return entry.bytes;
    if (!entry.bytes) entry.bytes = this.loadFileBytes(entry.path);
    return entry.bytes ?? null;
  }

  private static getParsedFont(key: string, bytes: Uint8Array): TtfFont | null {
    let font = this.fallbackCache.get(key);
    if (font !== undefined) return font;

    try {
      font = TtfFont.loadFromBytes(bytes);
    } catch {
      font = null;
    }
    this.fallbackCache.set(key, font);
    return font;
  }

  /** Removes all registered fonts (primarily for test isolation). */
  public static clear(): void {
    this.registry.clear();
    this.identifierRegistry.clear();
    this.fallbackCache.clear();
  }

  /**
   * Registers all 12 bundled Liberation font variants from the given directory
   * (Node.js only). Files are expected to be named `LiberationSans-Regular.ttf`,
   * `LiberationSerif-Bold.ttf`, etc. Missing or unreadable files are skipped silently.
   */
  public static autoRegisterBundledFonts(fontsDir: string): void {
    const io = getPlatformIO();
    if (!io.readFileSync) return; // sync IO unavailable (browser) - nothing to register
    for (const [file, family, weight] of BUNDLED_FONTS) {
      // Forward slashes are valid path separators on every Node platform.
      const path = `${fontsDir}/${file}.ttf`;
      // Cheap existence check so missing variants are skipped
      // then register the *path* only - bytes are read and parsed lazily on
      // first use, keeping package import time flat.
      if (io.fileExistsSync && !io.fileExistsSync(path)) continue;
      this.registerFontFilePath(`${family}:${weight}`, path);
    }
  }

  private static loadFileBytes(filePath: string): Uint8Array | undefined {
    try {
      return getPlatformIO().readFileSync?.(filePath);
    } catch {
      return undefined;
    }
  }
}
