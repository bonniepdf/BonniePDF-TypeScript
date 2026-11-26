// Generated chart source. Do not edit here; the source manifest records its provenance.
/** What a group of marks contains. */
export type ChartGroupRole = 'chart' | 'background' | 'plot' | 'grid' | 'axis' | 'series' | 'mark' | 'label' | 'annotation' | 'legend' | 'title';

/** Where a mark grows from when it animates in, in chart coordinates. */
export interface ChartGroupAnchor {
  x: number;
  y: number;
  /** The mark scales along `x` (horizontal bars), along `y` (vertical bars), or in both from the anchor (slices, points). */
  axis: 'x' | 'y' | 'both';
}

/** Describes a group of marks for sinks that keep chart structure. Charts emit the `series` and `mark` roles. */
export interface ChartGroupInfo {
  role: ChartGroupRole;
  /** Set for `series` and `mark`. */
  seriesIndex?: number;
  /** Set for `mark`. */
  pointIndex?: number;
  /** A human-readable name: the series name, or the category label. */
  name?: string;
  /** Accessible text for the mark, built by the chart from `markDescriptionTemplate`. */
  description?: string;
  /** Where the mark grows from when it animates in. */
  anchor?: ChartGroupAnchor;
}
