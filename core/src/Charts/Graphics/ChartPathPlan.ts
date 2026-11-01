// Generated chart source. Do not edit here; the source manifest records its provenance.
import type { Color } from '../ChartHost';
export interface ChartPathCommand {
  op: 'M' | 'L' | 'C' | 'Z';
  values: number[];
}
export interface ChartResolvedGradient {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startColor: Color;
  endColor: Color;
}
/** Resolved chart geometry shared by vector backends. */
export interface ChartPathPlan {
  commands: ChartPathCommand[];
  color: Color;
  gradient?: ChartResolvedGradient;
}
