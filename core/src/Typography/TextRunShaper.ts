import { TtfFont } from './TrueType/TtfFont';
import { isRenderableCodePoint } from './TextEncoding';

/** A font the shaper may select glyphs from. */
export interface ShaperFont {
  /** Opaque identifier the caller uses to resolve a resource name + tracker. */
  fontIdentifier: string;
  font: TtfFont;
}

/** A maximal substring renderable by a single candidate font. */
export interface ShapedRun {
  /** Index into the candidate list passed to {@link shapeTextRuns} (0 = primary). */
  fontIndex: number;
  text: string;
}

export interface ShapeResult {
  runs: ShapedRun[];
  /** Code points no candidate font could render (dropped from output). */
  unsupported: number[];
}

/**
 * Splits `text` into runs, each renderable by a single font, preferring the
 * primary font (`candidates[0]`) and falling back to later candidates for code
 * points the primary lacks.
 *
 * Control and default-ignorable code points are dropped (see
 * {@link isRenderableCodePoint}). Code points no candidate covers are also
 * dropped and reported in `unsupported`, so the caller surfaces a diagnostic
 * instead of emitting a `.notdef` reference that PDF/A-2 (6.2.11.8) and
 * PDF/UA-1 (7.21.8) forbid.
 *
 * When the primary font covers every code point the result is a single run
 * with `fontIndex === 0`, so callers that don't need fallback behave exactly
 * as before.
 */
export function shapeTextRuns(text: string, candidates: ShaperFont[]): ShapeResult {
  const runs: ShapedRun[] = [];
  const unsupported: number[] = [];
  if (!text || candidates.length === 0) return { runs, unsupported };

  let current: ShapedRun | null = null;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (!isRenderableCodePoint(cp)) continue;

    let chosen = -1;
    for (let i = 0; i < candidates.length; i++) {
      if (candidates[i].font.getGlyphId(cp) !== 0) {
        chosen = i;
        break;
      }
    }

    if (chosen === -1) {
      unsupported.push(cp);
      continue;
    }

    if (current && current.fontIndex === chosen) {
      current.text += ch;
    } else {
      current = { fontIndex: chosen, text: ch };
      runs.push(current);
    }
  }

  return { runs, unsupported };
}
