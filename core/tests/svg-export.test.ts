import { describe, it, expect } from 'vitest';
import { chartToSvg } from '../src/Extensions/SvgExportExtensions';
import { BarChart } from '../src/Charts/BarChart';
import { LineChart } from '../src/Charts/LineChart';
import { AreaChart } from '../src/Charts/AreaChart';
import { PieChart } from '../src/Charts/PieChart';
import { DotPlotChart } from '../src/Charts/DotPlotChart';
import { LollipopChart } from '../src/Charts/LollipopChart';
import { ChartData } from '../src/Charts/Models/ChartData';
import { ChartSeries } from '../src/Charts/Models/ChartSeries';
import { ChartDataPoint } from '../src/Charts/Models/ChartDataPoint';

function createSampleData(title = 'My Chart', points = 4): ChartData {
  const series = new ChartSeries();
  for (let i = 0; i < points; i++) {
    const pt = new ChartDataPoint();
    pt.label = `Label ${i + 1}`;
    pt.value = (i + 1) * 15;
    series.dataPoints.push(pt);
  }
  const data = new ChartData();
  data.title = title;
  data.series.push(series);
  return data;
}

describe('SvgExport', () => {
  it('BarChart_ToSvg_ContainsSvgTags', () => {
    const chart = new BarChart();
    chart.width = 600;
    chart.height = 400;
    const svg = chartToSvg(chart, createSampleData());
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('BarChart_ToSvg_ContainsXmlns', () => {
    const chart = new BarChart();
    const svg = chartToSvg(chart, createSampleData());
    expect(svg).toContain('xmlns');
  });

  it('BarChart_ToSvg_ContainsChartTitle', () => {
    const chart = new BarChart();
    const data = createSampleData('Revenue 2024');
    const svg = chartToSvg(chart, data);
    expect(svg).toContain('Revenue 2024');
  });

  it('BarChart_ToSvg_HasWidthAndHeight', () => {
    const chart = new BarChart();
    chart.width = 600;
    chart.height = 400;
    const svg = chartToSvg(chart, createSampleData());
    expect(svg).toContain('600');
    expect(svg).toContain('400');
  });

  it('LineChart_ToSvg_ContainsLineElement', () => {
    const chart = new LineChart();
    const svg = chartToSvg(chart, createSampleData());
    expect(svg).toContain('<line');
  });

  it('AreaChart_ToSvg_ContainsRectOrPath', () => {
    const chart = new AreaChart();
    const svg = chartToSvg(chart, createSampleData());
    expect(svg).toMatch(/<rect|<path/);
  });

  it('PieChart_ToSvg_ContainsPathElement', () => {
    const chart = new PieChart();
    const svg = chartToSvg(chart, createSampleData());
    expect(svg).toContain('<path');
  });

  it('DotPlotChart_ToSvg_ContainsCircleElement', () => {
    const chart = new DotPlotChart();
    const svg = chartToSvg(chart, createSampleData());
    expect(svg).toContain('<circle');
  });

  it('LollipopChart_ToSvg_ContainsLineAndCircle', () => {
    const chart = new LollipopChart();
    const svg = chartToSvg(chart, createSampleData());
    expect(svg).toContain('<line');
    expect(svg).toContain('<circle');
  });

  it('BarChart_ToSvg_ContainsDataLabels', () => {
    const chart = new BarChart();
    const data = createSampleData('Test', 3);
    data.series[0].dataPoints[0].label = 'UniqLabel1';
    const svg = chartToSvg(chart, data);
    expect(svg).toContain('UniqLabel1');
  });
});
