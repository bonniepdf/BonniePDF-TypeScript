import { Graphemes } from './Engine/Unicode/Segmentation/Graphemes';
import { winAnsiCovers } from './WinAnsi';
import { FontManager, type FallbackFont } from './FontManager';
import { getActiveDocumentFonts } from './DocumentFontMetricScope';
import type { TtfFont } from './TrueType/TtfFont';

/**
 * The twelve standard text faces. Symbol and ZapfDingbats use their own built-in encodings and never fall back.
 */
const STANDARD_TEXT_FACES: ReadonlySet<string> = new Set([
  'Helvetica',
  'Helvetica-Bold',
  'Helvetica-Oblique',
  'Helvetica-BoldOblique',
  'Times-Roman',
  'Times-Bold',
  'Times-Italic',
  'Times-BoldItalic',
  'Courier',
  'Courier-Bold',
  'Courier-Oblique',
  'Courier-BoldOblique',
]);

/** Whether `fontName` is one of the twelve standard text faces, the faces that fall back outside WinAnsi. */
export function isStandardTextFace(fontName: string): boolean {
  return STANDARD_TEXT_FACES.has(fontName);
}

/**
 * Whether a standard text face shows every character of `text` itself. The common case, so it is checked
 * without segmenting: any code unit above U+00FF that WinAnsi does not map (a surrogate included) means no.
 */
export function standardFaceCoversAll(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const unit = text.charCodeAt(i);
    if (unit > 0xff && !winAnsiCovers(unit)) return false;
  }
  return true;
}

/** A maximal piece of a standard-face text that the face shows (`covered`) or that falls back. */
export interface StandardTextSegment {
  text: string;
  covered: boolean;
}

/**
 * Splits a standard-face text into covered and fallback pieces, by grapheme cluster: a cluster is covered when
 * the face shows every code point in it, so a letter and its combining marks are never split between fonts.
 */
export function splitStandardText(text: string): StandardTextSegment[] {
  const segments: StandardTextSegment[] = [];
  const boundaries = Graphemes.boundaries(text);
  for (let b = 0; b + 1 < boundaries.length; b++) {
    const cluster = text.slice(boundaries[b], boundaries[b + 1]);
    let covered = true;
    for (const ch of cluster) {
      if (!winAnsiCovers(ch.codePointAt(0)!)) {
        covered = false;
        break;
      }
    }
    const last = segments[segments.length - 1];
    if (last && last.covered === covered) last.text += cluster;
    else segments.push({ text: cluster, covered });
  }
  return segments;
}

/**
 * The faces a standard text face falls back to, in order: its Liberation substitute when registered, then the
 * document's faces, then the global registrations. A face reached by two routes appears once, at its first place.
 */
export function standardFallbackChain(fontName: string): FallbackFont[] {
  const chain: FallbackFont[] = [];
  const seen = new Set<TtfFont>();
  const add = (fallback: FallbackFont) => {
    if (seen.has(fallback.font)) return;
    seen.add(fallback.font);
    chain.push(fallback);
  };
  const substitute = FontManager.getStandardSubstitute(fontName);
  if (substitute) add(substitute);
  for (const fallback of getActiveDocumentFonts()?.fallbackFonts() ?? []) add(fallback);
  for (const fallback of FontManager.getFallbackFonts()) add(fallback);
  return chain;
}
