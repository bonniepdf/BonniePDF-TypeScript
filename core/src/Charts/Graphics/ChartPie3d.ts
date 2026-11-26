// Generated chart source. Do not edit here; the source manifest records its provenance.
/** A tilted pie: the disc is drawn as an ellipse and the slices gain side walls. Flat pies are easier to read accurately. */
export interface ChartPie3d {
  /** How far the pie leans back, in degrees from `0` to `80` (`50`). The vertical radius is the radius times the cosine of the tilt. */
  tilt?: number;
  /** The height of the side walls in points (`16`), before the tilt foreshortens it: a wall appears `depth · sin(tilt)` tall. */
  depth?: number;
  /** Write each slice's share inside it when `sliceLabelMode` is `none` (`true`), because projected slices are hard to compare by eye. */
  labels?: boolean;
}

/** The validated tilt and depth of a pie. @internal */
export interface Pie3dGeometry {
  /** The vertical radius as a fraction of the horizontal radius. */
  yScale: number;
  /** The wall height as drawn, in points: the depth foreshortened by the tilt. */
  depth: number;
}

/** The largest number of slices a tilted pie may have. @internal */
export const PIE3D_MAX_SLICES = 8;

/** Validates `pie3d` and returns its geometry, or `undefined` when there is none. @internal */
export function resolvePie3d(p: ChartPie3d | undefined): Pie3dGeometry | undefined {
  if (p === undefined) return undefined;
  const tilt = p.tilt ?? 50;
  const depth = p.depth ?? 16;
  if (!Number.isFinite(tilt) || tilt < 0 || tilt > 80) throw new RangeError('pie3d tilt must be from 0 to 80 degrees.');
  if (!Number.isFinite(depth) || depth < 0) throw new RangeError('pie3d depth must be finite and nonnegative.');
  // The pie is a cylinder seen from above at an angle: the disc's vertical radius shrinks by cos(tilt), and the vertical
  // walls appear sin(tilt) of their height. Flat on (tilt 0) the walls vanish; edge on they would show in full.
  const t = (tilt * Math.PI) / 180;
  return { yScale: Math.cos(t), depth: depth * Math.sin(t) };
}
