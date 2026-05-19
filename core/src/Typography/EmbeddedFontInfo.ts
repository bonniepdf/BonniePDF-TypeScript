import { TtfFont } from './TrueType/TtfFont';
import { GlyphUsageTracker } from './GlyphUsageTracker';

/**
 * Contains all information about an embedded TrueType font
 */
export class EmbeddedFontInfo {
  /**
   * The parsed TrueType font
   */
  public font: any;
  /**
   * Tracks which glyphs are used in the document
   */
  public tracker: any;
  /**
   * 6-character random prefix for subset font name (e.g., "ABCDEF")
   * Required by PDF spec for subset fonts
   */
  public subsetPrefix: string;
  /**
   * PDF resource name (e.g., "/F1", "/F2")
   */
  public resourceName: string;
  /**
   * Object ID of the Type0 font in the PDF (set during writing)
   */
  public type0ObjectId: number = 0;

  /**
   * Gets the full font name with subset prefix (e.g., "ABCDEF+ArialMT")
   */
  get subsetFontName(): string {
    return `${this.subsetPrefix}+${this.font.postScriptName}`;
  }
}
