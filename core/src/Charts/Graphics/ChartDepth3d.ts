// Generated chart source. Do not edit here; the source manifest records its provenance.
/** Oblique depth for bars: each bar gains a top face and a right face, projected at `angle`. Two-dimensional charts are easier to read accurately. */
export interface ChartDepth3d {
  /** Depth of the bars in points (`12`). */
  depth?: number;
  /** The projection angle in degrees, above 0 and below 90 (`45`). */
  angle?: number;
  /** Draw a back wall and floor behind the bars, with the gridlines on the back wall (`false`). */
  walls?: boolean;
}

/** The resolved projection of a depth: how far a point at full depth moves right and up. */
export interface DepthShift {
  dx: number;
  dy: number;
}

/** Validates `depth3d` and returns its projection, or `undefined` when there is none. @internal */
export function resolveDepth3d(d: ChartDepth3d | undefined): DepthShift | undefined {
  if (d === undefined) return undefined;
  const depth = d.depth ?? 12;
  const angle = d.angle ?? 45;
  if (!(depth > 0) || !Number.isFinite(depth)) throw new RangeError('depth3d depth must be positive.');
  if (!(angle > 0 && angle < 90)) throw new RangeError('depth3d angle must be above 0 and below 90 degrees.');
  const t = (angle * Math.PI) / 180;
  return { dx: depth * Math.cos(t), dy: depth * Math.sin(t) };
}
