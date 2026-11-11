// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import type { FontFace, FontProvider } from '../Fonts/FontFace';
import { parseLength } from '../Parsers/Length';
import type { PathSegment } from '../Parsers/PathData';
import type { SvgElement } from './Dom';
import type { ComputedStyle, UnsupportedFeature } from './Types';

/**
 * Text layout: `<text>` and `<tspan>` to glyph outlines.
 *
 * Text is imported as outlines, so everything a renderer would do to place
 * glyphs happens here - whitespace handling, x/y/dx/dy/rotate lists, text
 * chunks and their anchoring, `textLength`, and choosing a font per character.
 * What comes out is ordinary path geometry, one run per stretch of text that
 * shares a style, which the builder turns into paths like any shape.
 *
 * The only shaping it does is pair kerning, which both reference renderers apply
 * and Latin text visibly needs. No ligatures, no contextual forms: scripts that
 * cannot be drawn correctly without them are reported rather than drawn wrongly.
 */

export type Cascade = (parent: ComputedStyle, attributes: ReadonlyMap<string, string>) => ComputedStyle;

/** Consecutive glyphs sharing one style, as user-space path segments. */
export interface TextRun {
  readonly style: ComputedStyle;
  readonly segments: PathSegment[];
  /** The element the characters came from, for diagnostics only. */
  readonly source: string;
}

interface Holder {
  readonly element: SvgElement;
  readonly style: ComputedStyle;
}

interface Char {
  codePoint: number;
  readonly style: ComputedStyle;
  /** Indices into the holder list: the text element and every tspan this character sits in. */
  readonly holders: readonly number[];
  readonly source: string;
  x: number | undefined;
  y: number | undefined;
  dx: number;
  dy: number;
  rotate: number;
}

interface Placed {
  readonly face: FontFace;
  readonly glyph: number;
  x: number;
  readonly y: number;
  readonly scale: number;
  /** Horizontal glyph scale from `lengthAdjust="spacingAndGlyphs"`. */
  stretch: number;
  readonly rotate: number;
  readonly style: ComputedStyle;
  readonly source: string;
}

interface Chunk {
  readonly glyphs: Placed[];
  readonly anchor: ComputedStyle['textAnchor'];
  startX: number;
  endX: number;
}

const SPACE = 0x20;

/**
 * Lays out one `<text>` element and returns its glyphs as runs.
 *
 * Problems are pushed to `unsupported` once per text element, so a chart with a
 * thousand labels in an uncovered script says so once, not a thousand times.
 */
export function layoutText(
  element: SvgElement,
  style: ComputedStyle,
  fonts: FontProvider,
  cascade: Cascade,
  unsupported: UnsupportedFeature[]
): TextRun[] {
  const problems = new Map<string, string>();
  const holders: Holder[] = [{ element, style }];
  const raw: Char[] = [];
  collect(element, style, [0], holders, raw, problems, cascade);

  const chars = normaliseSpace(raw);
  assignPositions(chars, holders);

  const chunks = place(chars, fonts, problems);
  applyTextLength(element, chunks, problems);
  anchor(chunks);

  for (const [feature, detail] of problems) unsupported.push({ feature, detail });
  return runs(chunks);
}

/** Walks the content in document order, cascading style through each tspan. */
function collect(
  element: SvgElement,
  style: ComputedStyle,
  chain: readonly number[],
  holders: Holder[],
  chars: Char[],
  problems: Map<string, string>,
  cascade: Cascade
): void {
  for (const entry of element.content) {
    if (typeof entry === 'string') {
      for (const character of entry) {
        chars.push({
          codePoint: character.codePointAt(0)!,
          style,
          holders: chain,
          source: element.name,
          x: undefined,
          y: undefined,
          dx: 0,
          dy: 0,
          rotate: 0,
        });
      }
      continue;
    }

    const name = entry.name;
    if (name === 'tspan' || name === 'a') {
      const childStyle = cascade(style, entry.attributes);
      if (!childStyle.display) continue;
      if (name === 'tspan' && entry.attributes.has('textLength')) {
        problems.set('textLength', 'textLength is applied on <text> only, not on <tspan>');
      }
      holders.push({ element: entry, style: childStyle });
      collect(entry, childStyle, [...chain, holders.length - 1], holders, chars, problems, cascade);
    } else if (name === 'textPath') {
      problems.set('textPath', 'text on a path is not in the supported profile');
    } else if (name === 'tref') {
      problems.set('tref', 'tref was removed from SVG 2 and is not supported');
    }
    // title, desc and anything unknown inside text contribute no characters.
  }
}

/**
 * Whitespace, as browsers treat it: newlines and tabs become spaces, and outside
 * `xml:space="preserve"` a run of spaces collapses to one and spaces at the start
 * and end of the element go. SVG 1.1 removed newlines outright; SVG 2 and every
 * browser convert them, so "a\nb" reads "a b".
 */
function normaliseSpace(raw: readonly Char[]): Char[] {
  const out: Char[] = [];
  for (const character of raw) {
    const codePoint = character.codePoint;
    if (codePoint === 0x0a || codePoint === 0x0d || codePoint === 0x09) character.codePoint = SPACE;

    if (!character.style.preserveSpace && character.codePoint === SPACE) {
      const previous = out[out.length - 1];
      if (previous === undefined || (previous.codePoint === SPACE && !previous.style.preserveSpace)) continue;
    }
    out.push(character);
  }

  while (out.length > 0) {
    const last = out[out.length - 1]!;
    if (last.codePoint !== SPACE || last.style.preserveSpace) break;
    out.pop();
  }
  return out;
}

/**
 * Applies x, y, dx, dy and rotate lists. Each list addresses the characters of
 * the element carrying it, from its first; holders are visited outermost first,
 * so a tspan's own list overrides its text's for the characters it holds. A
 * rotate list's last value carries on to the remaining characters; the others
 * simply run out.
 */
function assignPositions(chars: readonly Char[], holders: readonly Holder[]): void {
  holders.forEach(({ element, style }, index) => {
    const members = chars.filter((character) => character.holders.includes(index));
    if (members.length === 0) return;

    const list = (name: string): number[] => lengthList(element.attributes.get(name), style.fontSize);
    list('x').forEach((value, i) => {
      if (members[i]) members[i]!.x = value;
    });
    list('y').forEach((value, i) => {
      if (members[i]) members[i]!.y = value;
    });
    list('dx').forEach((value, i) => {
      if (members[i]) members[i]!.dx = value;
    });
    list('dy').forEach((value, i) => {
      if (members[i]) members[i]!.dy = value;
    });

    const rotate = list('rotate');
    if (rotate.length > 0) {
      members.forEach((character, i) => {
        character.rotate = rotate[Math.min(i, rotate.length - 1)]!;
      });
    }
  });
}

function lengthList(value: string | undefined, fontSize: number): number[] {
  if (value === undefined) return [];
  const values: number[] = [];
  // Explicit separators rather than \s, whose Unicode coverage differs between
  // JavaScript and .NET - the two engines must split every list identically.
  for (const token of value.split(/[ \t\n\r\f,]+/)) {
    if (token === '') continue;
    const parsed = parseLength(token, { percentBasis: 0, fontSize });
    if (parsed === undefined) return values;
    values.push(parsed);
  }
  return values;
}

/**
 * Chooses a glyph for every character, advances the pen, and splits the result
 * into text chunks - a chunk starts wherever a character is given an absolute x
 * or y, and is anchored as a unit.
 */
function place(chars: readonly Char[], fonts: FontProvider, problems: Map<string, string>): Chunk[] {
  const chunks: Chunk[] = [];
  const faceLists = new Map<string, FontFace[]>();
  const uncovered = new Set<number>();
  const missingFamilies = new Set<string>();
  let complexScript = false;

  let penX = 0;
  let penY = 0;
  let chunk: Chunk | undefined;
  let previous: Placed | undefined;

  for (const character of chars) {
    const absolute = character.x !== undefined || character.y !== undefined;
    if (character.x !== undefined) penX = character.x;
    if (character.y !== undefined) penY = character.y;
    if (chunk === undefined || absolute) {
      chunk = { glyphs: [], anchor: character.style.textAnchor, startX: penX, endX: penX };
      chunks.push(chunk);
      previous = undefined;
    }
    penX += character.dx;
    penY += character.dy;

    for (const issue of character.style.textIssues) {
      problems.set(issue, `${issue} is not applied by the text layout`);
    }
    if (needsShaping(character.codePoint)) complexScript = true;

    const faces = facesFor(character.style, fonts, faceLists);
    if (faces.length === 0) {
      missingFamilies.add(character.style.fontFamily);
      previous = undefined;
      continue;
    }
    let face: FontFace | undefined;
    let glyph = 0;
    for (const candidate of faces) {
      glyph = candidate.glyphIndex(character.codePoint);
      if (glyph !== 0) {
        face = candidate;
        break;
      }
    }
    // A character no supplied font covers is dropped and reported, never drawn
    // as the font's .notdef box - the same rule BonniePDF applies to its own text.
    if (face === undefined) {
      uncovered.add(character.codePoint);
      previous = undefined;
      continue;
    }

    const scale = character.style.fontSize / face.unitsPerEm;
    // Kerning adjusts the previous glyph's advance, so it applies only between
    // neighbours in one face at one size: across a change of font the pair is not
    // a pair in any font's kerning table.
    if (previous !== undefined && previous.face === face && previous.scale === scale) {
      penX += face.kerning(previous.glyph, glyph) * scale;
    }
    if (chunk.glyphs.length === 0) chunk.startX = penX;
    const placed: Placed = {
      face,
      glyph,
      x: penX,
      y: penY,
      scale,
      stretch: 1,
      rotate: character.rotate,
      style: character.style,
      source: character.source,
    };
    chunk.glyphs.push(placed);
    previous = placed;
    penX +=
      face.advanceWidth(glyph) * scale +
      character.style.letterSpacing +
      (character.codePoint === SPACE ? character.style.wordSpacing : 0);
    chunk.endX = penX;
  }

  const fontProblems: string[] = [];
  if (missingFamilies.size > 0) {
    fontProblems.push(`no supplied font matches font-family: ${[...missingFamilies].join(' | ')}`);
  }
  if (uncovered.size > 0) {
    const listed = [...uncovered].slice(0, 8).map((codePoint) => `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`);
    const more = uncovered.size > 8 ? ` and ${uncovered.size - 8} more` : '';
    fontProblems.push(`no supplied font covers ${listed.join(', ')}${more}`);
  }
  if (fontProblems.length > 0) problems.set('font', fontProblems.join('; '));
  if (complexScript) {
    problems.set('complex script', 'text in a script that needs shaping (Arabic, Hebrew, Indic, ...) is not laid out correctly without it');
  }
  return chunks.filter((entry) => entry.glyphs.length > 0);
}

/** The faces a style's font-family list resolves to, in list order, without repeats. */
function facesFor(style: ComputedStyle, fonts: FontProvider, cache: Map<string, FontFace[]>): FontFace[] {
  const key = `${style.fontFamily}\u0000${style.fontWeight}\u0000${style.fontItalic}`;
  let faces = cache.get(key);
  if (faces === undefined) {
    faces = [];
    for (const family of familyList(style.fontFamily)) {
      // Rounded because CSS weights may be fractional and the .NET seam takes an
      // integer; both engines round the same way so they ask for the same face.
      const face = fonts.resolve(family, Math.round(style.fontWeight), style.fontItalic);
      if (face !== undefined && !faces.includes(face)) faces.push(face);
    }
    cache.set(key, faces);
  }
  return faces;
}

/** A CSS font-family list: comma-separated, names optionally quoted. */
export function familyList(value: string): string[] {
  const families: string[] = [];
  for (const part of value.split(',')) {
    const name = part.trim().replace(/^(['"])(.*)\1$/, '$2').trim();
    if (name !== '') families.push(name);
  }
  return families;
}

/**
 * Code points in scripts whose glyphs must be joined, reordered or combined by a
 * shaping engine to read correctly. Drawing them one glyph at a time produces
 * text that looks plausible to someone who cannot read it, which is the worst
 * kind of wrong.
 */
function needsShaping(codePoint: number): boolean {
  return (
    (codePoint >= 0x0590 && codePoint <= 0x08ff) || // Hebrew, Arabic, Syriac, Thaana, NKo, ...
    (codePoint >= 0x0900 && codePoint <= 0x0dff) || // Indic
    (codePoint >= 0x0e00 && codePoint <= 0x0eff) || // Thai, Lao
    (codePoint >= 0x0f00 && codePoint <= 0x0fff) || // Tibetan
    (codePoint >= 0x1000 && codePoint <= 0x109f) || // Myanmar
    (codePoint >= 0x1780 && codePoint <= 0x17ff) || // Khmer
    (codePoint >= 0xfb1d && codePoint <= 0xfdff) || // Hebrew and Arabic presentation forms
    (codePoint >= 0xfe70 && codePoint <= 0xfeff) // Arabic presentation forms B
  );
}

/**
 * `textLength` on the text element. `spacing` (the default) spreads the
 * difference over the gaps between glyphs; `spacingAndGlyphs` stretches glyphs
 * and gaps alike. Applied before anchoring, so the anchor sees the stated length.
 */
function applyTextLength(element: SvgElement, chunks: Chunk[], problems: Map<string, string>): void {
  const value = element.attributes.get('textLength');
  if (value === undefined || chunks.length === 0) return;
  const target = parseLength(value, { percentBasis: 0, fontSize: 16 });
  if (target === undefined || target < 0) return;
  if (chunks.length > 1) {
    problems.set('textLength', 'textLength across more than one text chunk is not applied');
    return;
  }

  const chunk = chunks[0]!;
  const natural = chunk.endX - chunk.startX;
  if (element.attributes.get('lengthAdjust')?.trim() === 'spacingAndGlyphs') {
    const factor = natural > 0 ? target / natural : 1;
    for (const glyph of chunk.glyphs) {
      glyph.x = chunk.startX + (glyph.x - chunk.startX) * factor;
      glyph.stretch = factor;
    }
  } else {
    const gaps = chunk.glyphs.length - 1;
    if (gaps > 0) {
      const extra = (target - natural) / gaps;
      chunk.glyphs.forEach((glyph, i) => {
        glyph.x += extra * i;
      });
    }
  }
  chunk.endX = chunk.startX + target;
}

function anchor(chunks: readonly Chunk[]): void {
  for (const chunk of chunks) {
    if (chunk.anchor === 'start') continue;
    const width = chunk.endX - chunk.startX;
    const shift = chunk.anchor === 'middle' ? -width / 2 : -width;
    for (const glyph of chunk.glyphs) glyph.x += shift;
  }
}

/** Glyph outlines in user space, grouped into runs of one style. */
function runs(chunks: readonly Chunk[]): TextRun[] {
  const result: TextRun[] = [];
  let current: TextRun | undefined;

  for (const chunk of chunks) {
    for (const glyph of chunk.glyphs) {
      const segments = glyphSegments(glyph);
      if (segments.length === 0) continue;
      if (current === undefined || current.style !== glyph.style) {
        current = { style: glyph.style, segments: [], source: glyph.source };
        result.push(current);
      }
      for (const segment of segments) current.segments.push(segment);
    }
  }
  return result;
}

/**
 * One glyph's outline, placed. Font units are y-up and user space y-down, so y is
 * negated; a glyph rotation turns about its own origin on the baseline. Quadratic
 * segments are raised to cubic after placing - an affine map takes a Bezier to a
 * Bezier of the same degree, so the order does not change the curve. Cubic
 * segments, from CFF outlines, are placed as they are.
 */
function glyphSegments(glyph: Placed): PathSegment[] {
  const outline = glyph.face.outline(glyph.glyph);
  if (outline.length === 0) return [];

  const radians = (glyph.rotate * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const map = (gx: number, gy: number): [number, number] => {
    const lx = gx * glyph.scale * glyph.stretch;
    const ly = -gy * glyph.scale;
    if (glyph.rotate === 0) return [glyph.x + lx, glyph.y + ly];
    return [glyph.x + lx * cos - ly * sin, glyph.y + lx * sin + ly * cos];
  };

  const segments: PathSegment[] = [];
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;

  for (const segment of outline) {
    if (segment.kind === 'close') {
      segments.push({ kind: 'close' });
      currentX = startX;
      currentY = startY;
      continue;
    }
    const [x, y] = map(segment.x, segment.y);
    if (segment.kind === 'move') {
      segments.push({ kind: 'move', x, y });
      startX = x;
      startY = y;
    } else if (segment.kind === 'line') {
      segments.push({ kind: 'line', x, y });
    } else if (segment.kind === 'cubic') {
      const [c1x, c1y] = map(segment.c1x, segment.c1y);
      const [c2x, c2y] = map(segment.c2x, segment.c2y);
      segments.push({ kind: 'cubic', c1x, c1y, c2x, c2y, x, y });
    } else {
      const [qx, qy] = map(segment.cx, segment.cy);
      segments.push({
        kind: 'cubic',
        c1x: currentX + (2 / 3) * (qx - currentX),
        c1y: currentY + (2 / 3) * (qy - currentY),
        c2x: x + (2 / 3) * (qx - x),
        c2y: y + (2 / 3) * (qy - y),
        x,
        y,
      });
    }
    currentX = x;
    currentY = y;
  }
  return segments;
}
