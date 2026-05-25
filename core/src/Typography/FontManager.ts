import { TtfFont } from './TrueType/TtfFont';

/**
 * Standard PDF font identifier → Liberation family+weight lookup.
 * Liberation fonts are metric-compatible substitutes (OFL license) that
 * satisfy PDF/A-1b §6.3.4 (full embedding required).
 */
const STANDARD_FONT_MAP: Record<string, { family: string; weight: string }> = {
  Helvetica: { family: 'liberation sans', weight: 'regular' },
  'Helvetica-Bold': { family: 'liberation sans', weight: 'bold' },
  'Helvetica-Oblique': { family: 'liberation sans', weight: 'italic' },
  'Helvetica-BoldOblique': { family: 'liberation sans', weight: 'bolditalic' },
  'Times-Roman': { family: 'liberation serif', weight: 'regular' },
  'Times-Bold': { family: 'liberation serif', weight: 'bold' },
  'Times-Italic': { family: 'liberation serif', weight: 'italic' },
  'Times-BoldItalic': { family: 'liberation serif', weight: 'bolditalic' },
  Courier: { family: 'liberation mono', weight: 'regular' },
  'Courier-Bold': { family: 'liberation mono', weight: 'bold' },
  'Courier-Oblique': { family: 'liberation mono', weight: 'italic' },
  'Courier-BoldOblique': { family: 'liberation mono', weight: 'bolditalic' },
};

function normalizeWeight(raw: string): string {
  return raw.toLowerCase().replace(/[\s_-]/g, '');
}

type FontEntry = { kind: 'bytes'; bytes: Uint8Array } | { kind: 'file'; path: string; bytes?: Uint8Array };

/**
 * Global font registry for BonniePDF.
 *
 * Fonts registered here are automatically substituted for standard PDF type-1
 * fonts (Helvetica, Times-Roman, Courier) when `pdfAEnabled: true` is set on
 * `DocumentSettings`. This allows the library to produce genuinely PDF/A-1b
 * conformant output without the caller having to supply font paths on every element.
 *
 * **Node.js zero-config**: the `index.node.ts` entry-point calls
 * `FontManager.autoRegisterBundledFonts()` at startup, which registers the
 * bundled Liberation Sans / Serif / Mono fonts automatically.
 *
 * **Browser usage**: call `FontManager.registerFont(bytes)` with the raw TTF
 * bytes before generating any document.
 */
export class FontManager {
  private static readonly registry = new Map<string, FontEntry>();

  public static registerFont(bytes: Uint8Array, opts?: { family?: string; subfamily?: string }): void {
    const font = TtfFont.loadFromBytes(bytes);
    const family = (opts?.family ?? font.fontFamily).toLowerCase();
    const weight = normalizeWeight(opts?.subfamily ?? font.fontSubfamily ?? 'Regular');
    const key = `${family}:${weight}`;
    this.registry.set(key, { kind: 'bytes', bytes });
  }

  public static registerFontFile(path: string, opts?: { family?: string; subfamily?: string }): void {
    const font = TtfFont.fromFileSync(path);
    const family = (opts?.family ?? font.fontFamily).toLowerCase();
    const weight = normalizeWeight(opts?.subfamily ?? font.fontSubfamily ?? 'Regular');
    const key = `${family}:${weight}`;
    this.registry.set(key, { kind: 'file', path });
  }

  public static autoRegisterBundledFonts(fontsDir: string): void {
    const families = [
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
    ] as const;

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path: typeof import('path') = require('path');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs: typeof import('fs') = require('fs');

    for (const [file, family, weight] of families) {
      const fullPath = path.join(fontsDir, `${file}.ttf`);
      if (fs.existsSync(fullPath)) {
        const key = `${family}:${weight}`;
        this.registry.set(key, { kind: 'file', path: fullPath });
      }
    }
  }

  public static getBytesForStandardFont(standardFontName: string): Uint8Array | null {
    const mapping = STANDARD_FONT_MAP[standardFontName];
    if (!mapping) return null;
    return this.getBytesForFamily(mapping.family, mapping.weight);
  }

  public static getBytesForFamily(family: string, subfamily: string): Uint8Array | null {
    const key = `${family.toLowerCase()}:${normalizeWeight(subfamily)}`;
    const entry = this.registry.get(key);
    if (!entry) return null;
    if (entry.kind === 'bytes') return entry.bytes;
    if (!entry.bytes) {
      entry.bytes = this.loadFileBytes(entry.path);
    }
    return entry.bytes ?? null;
  }

  public static hasBundledFonts(): boolean {
    return this.registry.size > 0;
  }

  public static clear(): void {
    this.registry.clear();
  }

  private static loadFileBytes(filePath: string): Uint8Array | undefined {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs: typeof import('fs') = require('fs');
      const buf = fs.readFileSync(filePath);
      return Uint8Array.from(buf);
    } catch {
      return undefined;
    }
  }
}
