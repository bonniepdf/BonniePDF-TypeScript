// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { SvgParseError } from './Tokens';

/** Units per CSS pixel. SVG user units are CSS pixels at 96dpi. */
const UNITS: Record<string, number> = {
  '': 1,
  px: 1,
  pt: 96 / 72,
  pc: 16,
  in: 96,
  cm: 96 / 2.54,
  mm: 96 / 25.4,
  q: 96 / 25.4 / 4,
};

export interface LengthContext {
  /** The dimension a percentage resolves against. */
  readonly percentBasis: number;
  /** Font size in user units, for `em`. */
  readonly fontSize: number;
}

export const DEFAULT_LENGTH_CONTEXT: LengthContext = { percentBasis: 0, fontSize: 16 };

/**
 * Resolve a length to user units.
 *
 * Returns undefined rather than throwing for an unrecognised value: a single bad
 * attribute should fall back to its default, not abort the document. Genuinely
 * malformed numbers do throw, because that indicates a parser bug or corrupt
 * input rather than an authoring quirk.
 */
export function parseLength(input: string, context: LengthContext = DEFAULT_LENGTH_CONTEXT): number | undefined {
  const text = input.trim();
  if (text === '') return undefined;

  const match = /^([+-]?(?:[0-9]*\.[0-9]+|[0-9]+\.?)(?:[eE][+-]?[0-9]+)?)[ \t\n\r\f]*([a-z%]*)$/.exec(text);
  if (!match) return undefined;

  const value = Number(match[1]);
  if (!Number.isFinite(value)) throw new SvgParseError('length is not a finite number', 0, text);

  const unit = match[2]!.toLowerCase();
  if (unit === '%') return (value / 100) * context.percentBasis;
  if (unit === 'em') return value * context.fontSize;
  // `ex` has no reliable value without font metrics; half the em is the
  // conventional approximation and is documented as such rather than silently
  // exact.
  if (unit === 'ex') return value * context.fontSize * 0.5;

  const scale = UNITS[unit];
  return scale === undefined ? undefined : value * scale;
}
