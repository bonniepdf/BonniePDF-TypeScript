import { describe, it, expect } from 'vitest';
import { BarChart, BAR_CHART_OPTION_KEYS } from '../../src/Charts/BarChart';
import { LineChart, LINE_CHART_OPTION_KEYS } from '../../src/Charts/LineChart';
import { AreaChart, AREA_CHART_OPTION_KEYS } from '../../src/Charts/AreaChart';
import { LollipopChart, LOLLIPOP_CHART_OPTION_KEYS } from '../../src/Charts/LollipopChart';
import { DotPlotChart, DOT_PLOT_CHART_OPTION_KEYS } from '../../src/Charts/DotPlotChart';
import { GroupedBarChart, GROUPED_BAR_CHART_OPTION_KEYS } from '../../src/Charts/GroupedBarChart';
import { PieChart, PIE_CHART_OPTION_KEYS } from '../../src/Charts/PieChart';
import { AxisOptions, AXIS_OPTIONS_OPTION_KEYS } from '../../src/Charts/Models/AxisOptions';
import { ChartData, CHART_DATA_OPTION_KEYS } from '../../src/Charts/Models/ChartData';
import {
  ChartSeries,
  ChartSeriesStyle,
  CHART_SERIES_OPTION_KEYS,
  CHART_SERIES_STYLE_OPTION_KEYS,
} from '../../src/Charts/Models/ChartSeries';
import { ChartDataPoint, CHART_DATA_POINT_OPTION_KEYS } from '../../src/Charts/Models/ChartDataPoint';
import { ChartElement, CHART_ELEMENT_OPTION_KEYS } from '../../src/Charts/ChartElement';
import { GroupedBarChartElement, GROUPED_BAR_CHART_ELEMENT_OPTION_KEYS } from '../../src/Charts/GroupedBarChartElement';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { ChartOrientation } from '../../src/Charts/ChartOrientation';
import { Thickness } from '../../src/Core/Thickness';

function settableSurface(instance: object, internal: readonly string[] = []): string[] {
  const skip = new Set<string>(['startingY', ...internal]);
  const names = new Set<string>();
  for (const k of Object.keys(instance)) {
    if (!k.startsWith('_') && !skip.has(k)) names.add(k);
  }
  let proto: object | null = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
      if (typeof d.set === 'function' && !k.startsWith('_') && !skip.has(k)) names.add(k);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return [...names].sort();
}

describe('Cartesian chart options (09a Phase 2.I)', () => {
  it('BarChart: colour token + own + inherited base options', () => {
    const c = new BarChart({
      barColor: 'indigo-600',
      barWidthRatio: 0.5,
      width: 600,
      showLegend: false,
      orientation: ChartOrientation.Horizontal,
    });
    expect(c.barColor).toBe(ColorPalette.indigo[600]);
    expect(c.barWidthRatio).toBe(0.5);
    expect(c.width).toBe(600);
    expect(c.showLegend).toBe(false);
    expect(c.orientation).toBe(ChartOrientation.Horizontal);
    expect(new BarChart().width).toBe(800);
  });

  it('Line/Area/Lollipop/DotPlot accept colour tokens', () => {
    expect(new LineChart({ lineColor: 'rose-500' }).lineColor).toBe(ColorPalette.rose[500]);
    expect(new AreaChart({ areaColor: 'sky-400', fillOpacity: 0.5 }).fillOpacity).toBe(0.5);
    expect(new LollipopChart({ lollipopColor: 'amber-600', headRadius: 10 }).headRadius).toBe(10);
    expect(new DotPlotChart({ dotColor: 'teal-500', dotRadius: 6 }).dotRadius).toBe(6);
    expect(new GroupedBarChart({ barWidthRatio: 0.7, groupGapRatio: 0.1 }).groupGapRatio).toBe(0.1);
  });

  it('PieChart configures in one expression', () => {
    const p = new PieChart({ isDonut: false, totalLabel: 'Sum', showLegend: false, colors: ['#111', '#222'] });
    expect(p.isDonut).toBe(false);
    expect(p.totalLabel).toBe('Sum');
    expect(p.showLegend).toBe(false);
    expect(p.colors).toEqual(['#111', '#222']);
  });

  it('cover chart surfaces', () => {
    expect(settableSurface(new BarChart())).toEqual([...BAR_CHART_OPTION_KEYS].sort());
    expect(settableSurface(new LineChart())).toEqual([...LINE_CHART_OPTION_KEYS].sort());
    expect(settableSurface(new AreaChart())).toEqual([...AREA_CHART_OPTION_KEYS].sort());
    expect(settableSurface(new LollipopChart())).toEqual([...LOLLIPOP_CHART_OPTION_KEYS].sort());
    expect(settableSurface(new DotPlotChart())).toEqual([...DOT_PLOT_CHART_OPTION_KEYS].sort());
    expect(settableSurface(new GroupedBarChart())).toEqual([...GROUPED_BAR_CHART_OPTION_KEYS].sort());
    expect(settableSurface(new PieChart())).toEqual([...PIE_CHART_OPTION_KEYS].sort());
  });
});

describe('Chart data model options', () => {
  it('AxisOptions and ChartDataPoint', () => {
    const a = new AxisOptions({ prefix: '$', maxValue: 500, stepCount: 4, showGridLines: false });
    expect(a.prefix).toBe('$');
    expect(a.maxValue).toBe(500);
    expect(a.showGridLines).toBe(false);

    const p = new ChartDataPoint({ label: 'Q1', value: 42, labelFormat: 'C' });
    expect(p.label).toBe('Q1');
    expect(p.value).toBe(42);
  });

  it('ChartSeries coerces nested style + dataPoints literals, widens colour', () => {
    const s = new ChartSeries({
      name: 'Revenue',
      color: 'emerald-600',
      style: { lineWidth: 3, showMarkers: false },
      dataPoints: [{ label: 'A', value: 1 }, new ChartDataPoint({ label: 'B', value: 2 })],
    });
    expect(s.name).toBe('Revenue');
    expect(s.color).toBe(ColorPalette.emerald[600]);
    expect(s.style).toBeInstanceOf(ChartSeriesStyle);
    expect(s.style.lineWidth).toBe(3);
    expect(s.dataPoints).toHaveLength(2);
    expect(s.dataPoints[0]).toBeInstanceOf(ChartDataPoint);
    expect(s.dataPoints[0].value).toBe(1);
  });

  it('ChartData coerces nested series + axis literals', () => {
    const d = new ChartData({
      title: 'Sales',
      series: [{ name: 'S1', dataPoints: [{ label: 'x', value: 1 }] }],
      yAxis: { maxValue: 100 },
      xAxis: new AxisOptions({ legend: 'Month' }),
    });
    expect(d.title).toBe('Sales');
    expect(d.series[0]).toBeInstanceOf(ChartSeries);
    expect(d.series[0].name).toBe('S1');
    expect(d.yAxis).toBeInstanceOf(AxisOptions);
    expect(d.yAxis.maxValue).toBe(100);
    expect(d.xAxis.legend).toBe('Month');
  });

  it('cover data-model surfaces', () => {
    expect(settableSurface(new AxisOptions())).toEqual([...AXIS_OPTIONS_OPTION_KEYS].sort());
    expect(settableSurface(new ChartDataPoint(), ['formattedValue'])).toEqual([...CHART_DATA_POINT_OPTION_KEYS].sort());
    expect(settableSurface(new ChartSeries())).toEqual([...CHART_SERIES_OPTION_KEYS].sort());
    expect(settableSurface(new ChartSeriesStyle())).toEqual([...CHART_SERIES_STYLE_OPTION_KEYS].sort());
    expect(settableSurface(new ChartData())).toEqual([...CHART_DATA_OPTION_KEYS].sort());
  });
});

describe('Chart element wrappers (required chart + data)', () => {
  const chart = new BarChart();
  const gbc = new GroupedBarChart();
  const data = new ChartData({ title: 't' });

  it('keep the (chart, data, altText) positional form', () => {
    const e = new ChartElement(chart, data, 'my alt');
    expect(e.altText).toBe('my alt');
    expect(new ChartElement(chart, data).altText).toBe('');
  });

  it('accept options as the third argument', () => {
    const e = new ChartElement(chart, data, { altText: 'chart', isDecorative: true, margin: 4 });
    expect(e.altText).toBe('chart');
    expect(e.isDecorative).toBe(true);
    expect(e.margin).toEqual(new Thickness(4));

    const g = new GroupedBarChartElement(gbc, data, { altText: 'grouped' });
    expect(g.altText).toBe('grouped');
  });

  it('do not leak chart/data as settable properties', () => {
    expect(settableSurface(new ChartElement(chart, data), ['chart', 'data'])).toEqual(
      [...CHART_ELEMENT_OPTION_KEYS].sort()
    );
    expect(settableSurface(new GroupedBarChartElement(gbc, data), ['chart', 'data'])).toEqual(
      [...GROUPED_BAR_CHART_ELEMENT_OPTION_KEYS].sort()
    );
  });
});
