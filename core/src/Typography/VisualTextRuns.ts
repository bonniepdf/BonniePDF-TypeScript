import { TextFlow } from './TextFlow';
import { TextItemizer } from './Engine/Shaping/TextItemizer';
import { GlyphRunBuilder, type GlyphRun } from './Engine/Api/GlyphRun';
import { ShapeOptions } from './Engine/Api/ShapeOptions';
import { ShapeFeature } from './Engine/Api/ShapeFeature';
import type { FontFace } from './Engine/Fonts/FontFace';
import { FontError } from './Engine/Api/FontError';

/**
 * One piece of a line drawn in more than one font, in visual (left-to-right painting) order.
 * `run` is the index of the font run it belongs to. For a run with a face, `text` is the piece's
 * logical text and `glyphs` its shaped glyphs in visual order, clusters relative to `text`. For a
 * run without one (a standard font the viewer draws), `glyphs` is undefined and `text` is already
 * in visual order.
 */
export interface VisualTextPiece {
  readonly run: number;
  readonly text: string;
  readonly glyphs: GlyphRun | undefined;
}

/**
 * Orders the font runs of one bidirectional line for painting (spec 22, fallback-font boundaries).
 *
 * Shaping each font run on its own resolves each as if it were a paragraph: the pieces are then
 * painted in logical order and a neutral at a run's edge (a space, a comma) takes the run's own
 * direction, so spaces beside a fallback run land on the wrong side. Instead the line is resolved
 * once - bidi levels over the whole line, in the flow's direction - with each grapheme shaped in
 * its run's face, and the pieces come back in visual order (UBA rule L2), split wherever the run
 * changes.
 *
 * Returns `undefined` when nothing needs reordering (one run, or a line with no bidi content), or
 * when the line cannot be resolved this way (no run has a face, or a script without a shaper), in
 * which case the caller paints the runs in logical order as before.
 */
export function orderRunsVisually(
  runs: readonly { readonly text: string }[],
  faceOf: (run: number) => FontFace | null,
  features?: Readonly<Record<string, number>>
): VisualTextPiece[] | undefined {
  if (runs.length < 2) return undefined;
  const text = runs.map(run => run.text).join('');
  if (text.length === 0 || !(TextFlow.rightToLeft || TextFlow.needsBidi(text))) return undefined;

  const faces = runs.map((_, index) => faceOf(index));
  // A run the viewer draws has no face of its own; any face of the line orders it.
  const anyFace = faces.find(face => face !== null);
  if (!anyFace) return undefined;
  const ends: number[] = [];
  let offset = 0;
  for (const run of runs) ends.push((offset += run.text.length));
  const runAt = (index: number): number => {
    let run = 0;
    while (ends[run] <= index) run++;
    return run;
  };

  const options = features
    ? new ShapeOptions({ features: Object.entries(features).map(([tag, value]) => new ShapeFeature(tag, { value })) })
    : undefined;
  let items;
  try {
    items = TextItemizer.resolve(
      text,
      start => faces[runAt(start)] ?? anyFace,
      TextFlow.rightToLeft ? 'rtl' : 'ltr'
    ).shapeLine(0, text.length, options);
  } catch (error) {
    // A script without a shaper, or a line past the shaping limits.
    if (error instanceof FontError) return undefined;
    throw error;
  }

  const pieces: VisualTextPiece[] = [];
  for (const item of items) {
    let first = 0;
    while (first < item.glyphs.length) {
      const run = runAt(item.glyphs[first].cluster);
      let last = first + 1;
      while (last < item.glyphs.length && runAt(item.glyphs[last].cluster) === run) last++;
      pieces.push(piece(text, item.glyphs.slice(first, last), run, faces[run] !== null));
      first = last;
    }
  }
  return pieces;
}

function piece(
  text: string,
  glyphs: readonly import('./Engine/Api/GlyphInfo').GlyphInfo[],
  run: number,
  shaped: boolean
): VisualTextPiece {
  if (!shaped) {
    // Each source cluster once, in the order its glyphs are painted.
    let visual = '';
    let prior = -1;
    for (const g of glyphs) {
      if (g.cluster === prior) continue;
      visual += text.slice(g.cluster, g.cluster + g.sourceLength);
      prior = g.cluster;
    }
    return { run, text: visual, glyphs: undefined };
  }
  let start = Number.MAX_SAFE_INTEGER;
  let end = 0;
  for (const g of glyphs) {
    start = Math.min(start, g.cluster);
    end = Math.max(end, g.cluster + g.sourceLength);
  }
  const builder = new GlyphRunBuilder(glyphs.length);
  for (const g of glyphs)
    builder.add(
      g.id,
      g.cluster - start,
      g.advanceX,
      g.advanceY,
      g.offsetX,
      g.offsetY,
      g.componentCount,
      g.isMark,
      g.isLigature,
      g.sourceLength,
      g.unsafeToBreak,
      g.componentIndex
    );
  return { run, text: text.slice(start, end), glyphs: builder.build() };
}
