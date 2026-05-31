import { describe, it, expect } from 'vitest';
import { chartToSvg } from '../src/Extensions/SvgExportExtensions';
import { BarChart } from '../src/Charts/BarChart';
import { LineChart } from '../src/Charts/LineChart';
import { AreaChart } from '../src/Charts/AreaChart';
import { PieChart } from '../src/Charts/PieChart';
import { DotPlotChart } from '../src/Charts/DotPlotChart';
import { LollipopChart } from '../src/Charts/LollipopChart';
import { GroupedBarChart } from '../src/Charts/GroupedBarChart';
import { ChartData } from '../src/Charts/Models/ChartData';
import { ChartSeries } from '../src/Charts/Models/ChartSeries';
import { ChartDataPoint } from '../src/Charts/Models/ChartDataPoint';
import { SvgCanvas } from '../src/Drawing/SvgCanvas';
import { Color } from '../src/Core/Color';
import { TextAlignment } from '../src/Elements/Text/TextAlignment';

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
  it('SvgCanvas_DrawText_UsesTopCoordinateForY', () => {
    const canvas = new SvgCanvas(100, 50);

    canvas.drawText(10, 20, 'Legend', Color.fromHex('#000000'), 10, 'Helvetica', TextAlignment.Left);

    expect(canvas.getSvg()).toContain('y="28"');
  });

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

  it('GroupedBarChart_ToSvg_CentersLegendLabelsWithColorBoxes', () => {
    const chart = new GroupedBarChart();
    chart.width = 540;
    chart.height = 320;

    const data = new ChartData();
    data.yAxis.maxValue = 30;
    const first = new ChartSeries();
    first.name = 'A';
    first.dataPoints = [Object.assign(new ChartDataPoint(), { label: 'Q1', value: 10 })];
    const second = new ChartSeries();
    second.name = 'B';
    second.dataPoints = [Object.assign(new ChartDataPoint(), { label: 'Q1', value: 20 })];
    data.series = [first, second];

    const svg = chartToSvg(chart, data);

    expect(svg).toContain('<rect x="80" y="280" width="12" height="12"');
    expect(svg).toContain('<text x="97" y="289.3"');
  });

  it('PieChart_ToSvg_CentersLegendLabelsWithColorBoxes', () => {
    const chart = new PieChart();
    chart.width = 540;
    chart.height = 320;

    const series = new ChartSeries();
    series.dataPoints = [Object.assign(new ChartDataPoint(), { label: '.NET', value: 48 })];
    const data = new ChartData();
    data.series = [series];

    const svg = chartToSvg(chart, data);
    const rectY = Number(svg.match(/<rect x="[^"]+" y="([^"]+)" width="14" height="14" fill="#4f46e5"\/>/)?.[1]);
    const textY = Number(svg.match(/<text x="[^"]+" y="([^"]+)"[^>]*>\.NET - 48<\/text>/)?.[1]);

    expect(textY - rectY).toBeCloseTo(10.3, 5);
  });

  it('BarChart_ToSvg_ContainsDataLabels', () => {
    const chart = new BarChart();
    const data = createSampleData('Test', 3);
    data.series[0].dataPoints[0].label = 'UniqLabel1';
    const svg = chartToSvg(chart, data);
    expect(svg).toContain('UniqLabel1');
  });
});
