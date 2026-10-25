/**
 * The face-matching rules shared by a document's fonts and the global font registrations: weight names in a
 * subfamily, and the CSS font-matching order that picks a face for a requested weight and style.
 */

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

/** The weight a subfamily name gives (`'Bold Italic'` is 700), or 400 when it names none. */
export function subfamilyWeight(subfamily: string): number {
  const words = subfamily.toLowerCase().replace(/[\s_-]/g, '');
  for (const [name, weight] of SUBFAMILY_WEIGHTS) if (words.includes(name)) return weight;
  return 400;
}

/** Whether a subfamily name is italic or oblique. */
export function subfamilyItalic(subfamily: string): boolean {
  const lower = subfamily.toLowerCase();
  return lower.includes('italic') || lower.includes('oblique');
}

/**
 * The face for a requested weight and style among one family's faces: style first (an upright request is met by
 * an italic-only family and the reverse), then weight in the CSS font-matching order. Among faces of the same
 * weight and style the first in `candidates` wins, so callers pass them in a stable order.
 */
export function matchFace<T extends { readonly weight: number; readonly italic: boolean }>(
  candidates: readonly T[],
  weight: number,
  italic: boolean
): T | undefined {
  if (candidates.length === 0) return undefined;
  const styled = candidates.filter(f => f.italic === italic);
  const pool = styled.length > 0 ? styled : candidates;

  const exact = pool.find(f => f.weight === weight);
  if (exact) return exact;

  const heavier = pool.filter(f => f.weight > weight).sort((a, b) => a.weight - b.weight);
  const lighter = pool.filter(f => f.weight < weight).sort((a, b) => b.weight - a.weight);
  if (weight >= 400 && weight <= 500) return heavier.find(f => f.weight <= 500) ?? lighter[0] ?? heavier[0];
  if (weight < 400) return lighter[0] ?? heavier[0];
  return heavier[0] ?? lighter[0];
}
