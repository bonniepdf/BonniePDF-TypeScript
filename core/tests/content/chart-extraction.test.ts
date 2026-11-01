import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import * as charts from '../../src/charts';
import { chartToSvg } from '../../src/Export/SvgElementExport';
import { Color } from '../../src/Core/Color';

const fixture = new URL('./fixtures/chart-extraction.json', import.meta.url);
const cases: { id: string; type: string; variant: string; tsSvg?: string }[] = JSON.parse(
  readFileSync(fixture, 'utf8')
);

describe('chart extraction preserves existing SVG output', () => {
  for (const c of cases)
    it(c.id, () => {
      const Chart = (charts as unknown as Record<string, new () => charts.ChartBase>)[c.type];
      const chart = new Chart();
      chart.width = 640;
      chart.height = 360;
      chart.backgroundColor = Color.fromHex('#ffffff80');
      chart.title = c.variant === 'minimal' ? '' : 'Sales & <margin>';
      if (c.variant !== 'empty')
        chart.data.series = [0, 1].map(
          i =>
            new charts.ChartSeries({
              name: `Series ${i + 1}`,
              ...(i === 1 ? { color: '#0e749080' as const } : {}),
              dataPoints: [12.5, 32.25, 21.75].map((value, n) => ({
                label: ['A & B', '<C>', 'D'][n],
                value: value + i * 4,
                labelFormat: 'F2',
              })),
            })
        );
      chart.data.yAxis = new charts.AxisOptions({
        maxValue: 50,
        stepCount: 5,
        legend: 'Revenue',
        verticalLegend: true,
      });
      chart.data.xAxis.legend = 'Quarter';
      if (chart instanceof charts.CartesianChartBase) {
        chart.orientation =
          c.variant === 'horizontal' ? charts.ChartOrientation.Horizontal : charts.ChartOrientation.Vertical;
        chart.showLegend = c.variant !== 'minimal';
      }
      if (chart instanceof charts.PieChart) {
        chart.isDonut = c.variant !== 'horizontal';
        chart.showLegend = c.variant !== 'minimal';
      }
      const hash = createHash('sha256').update(chartToSvg(chart)).digest('hex');
      expect(hash).toBe(c.tsSvg);
    });
});
