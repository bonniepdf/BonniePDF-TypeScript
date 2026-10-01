import { TtfFont } from './TrueType/TtfFont';
import { GlyphUsageTracker } from './GlyphUsageTracker';

/** Contains the objects, metrics, and mappings needed to write an embedded TrueType font. */
export class EmbeddedFontInfo {
  /**
   * The parsed TrueType font. `null` until the font bytes have been loaded
   * (async registrations start unloaded and are populated by preload).
   * @internal
   */
  public font: TtfFont | null = null;
  /**
   * Tracks which glyphs are used in the document. `null` until the font has
   * been loaded (the tracker needs the parsed font to resolve glyph IDs).
   * @internal
   */
  public tracker: GlyphUsageTracker | null = null;
  /**
   * 6-character random prefix for subset font name (e.g., "ABCDEF")
   * Required by PDF spec for subset fonts
   */
  public subsetPrefix!: string;
  /**
   * PDF resource name (e.g., "/F1", "/F2")
   */
  public resourceName!: string;
  /**
   * Object ID of the Type0 font in the PDF (set during writing)
   */
  public type0ObjectId: number = 0;

  /**
   * Gets the full font name with subset prefix (e.g., "ABCDEF+ArialMT")
   */
  get subsetFontName(): string {
    return `${this.subsetPrefix}+${this.font!.postScriptName}`;
  }
}
