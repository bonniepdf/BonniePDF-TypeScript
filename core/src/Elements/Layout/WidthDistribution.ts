/**
 * How a horizontal stack shares its available width among its children: equally, by weight, or by each child's preferred width.
 */
export enum WidthDistribution {
  Equal = 'Equal',
  Weighted = 'Weighted',
  Auto = 'Auto',
}
