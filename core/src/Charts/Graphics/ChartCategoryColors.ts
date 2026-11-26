// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color } from '../ChartHost';
import type { ChartDataPoint } from '../Models/ChartDataPoint';
import type { ChartTheme } from '../ChartTheme';

const DEFAULT_COLORS = ['#4f46e5', '#7c3aed', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'].map((hex) => Color.fromHex(hex));

/** The colour of the `index`th category in a chart that colours each one: the point's own, else the theme palette, else the library cycle. */
export function categoryColor(theme: ChartTheme, point: ChartDataPoint | undefined, index: number): Color {
  const own = point?.fill?.color ?? point?.color;
  if (own !== undefined) return own;
  const palette = theme.seriesPalette.length > 0 ? theme.seriesPalette : DEFAULT_COLORS;
  return palette[index % palette.length];
}
