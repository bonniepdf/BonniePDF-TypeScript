// Generated chart source. Do not edit here; the source manifest records its provenance.
import type { ICanvas } from '../../Drawing/ICanvas';
import { LinearGradientPaint } from '../../Drawing/Paint';
import { Point } from '../../Core/Point';
import type { ChartPathPlan } from './ChartPathPlan';
export function fillChartPath(sink: ICanvas, plan: ChartPathPlan): void {
  sink.saveState();
  try {
    sink.beginPath();
    for(const c of plan.commands){const v=c.values;switch(c.op){
      case 'M':sink.moveTo(v[0],v[1]);break;
      case 'L':sink.lineTo(v[0],v[1]);break;
      case 'C':sink.cubicBezierTo(v[0],v[1],v[2],v[3],v[4],v[5]);break;
      case 'Z':sink.closePath();break;
    }}
    const g=plan.gradient;
    sink.fillCurrentPath(g?new LinearGradientPaint(new Point(g.startX,g.startY),new Point(g.endX,g.endY),[{offset:0,color:g.startColor},{offset:1,color:g.endColor}]):plan.color);
  } finally { sink.restoreState(); }
}
