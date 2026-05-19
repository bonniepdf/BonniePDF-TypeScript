import { describe, it, expect } from 'vitest';
import { MockCanvas } from './helpers/mock-canvas';
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
import { Color } from '../src/Core/Color';

function createSampleData(points = 5): ChartData {
  const series = new ChartSeries();
  series.name = 'Series 1';
  for (let i = 0; i < points; i++) {
    const pt = new ChartDataPoint();
    pt.label = `Item ${i + 1}`;
    pt.value = i * 10 + 20;
    series.dataPoints.push(pt);
  }
  const data = new ChartData();
  data.title = 'Test Chart';
  data.series.push(series);
  return data;
}

describe('ChartDataPoint', () => {
  it('formattedValue returns string representation of value', () => {
    const pt = new ChartDataPoint();
    pt.value = 1234;
    expect(pt.formattedValue).toBeDefined();
    expect(typeof pt.formattedValue).toBe('string');
  });
});

describe('Color', () => {
  it('fromHex creates color', () => {
    const color = Color.fromHex('#FF5733');
    expect(color).toBeDefined();
  });
});

describe('BarChart', () => {
  it('draw produces FillRect operations', () => {
    const chart = new BarChart();
    const canvas = new MockCanvas();
    const data = createSampleData();
    chart.draw(canvas, data);
    const rectOps = canvas.operations.filter(op => op.startsWith('FillRect'));
    expect(rectOps.length).toBeGreaterThan(0);
  });

  it('barColor property is settable', () => {
    const chart = new BarChart();
    chart.barColor = Color.fromHex('#FF0000');
    expect(chart.barColor).toBeDefined();
  });

  it('showValueLabels property is settable', () => {
    const chart = new BarChart();
    chart.showValueLabels = false;
    expect(chart.showValueLabels).toBe(false);
  });

  it('stretchToFit property is settable', () => {
    const chart = new BarChart();
    chart.stretchToFit = true;
    expect(chart.stretchToFit).toBe(true);
  });

  it('backgroundColor property is settable', () => {
    const chart = new BarChart();
    chart.backgroundColor = Color.fromHex('#FFFFFF');
    expect(chart.backgroundColor).toBeDefined();
  });

  it('width and height properties are settable', () => {
    const chart = new BarChart();
    chart.width = 600;
    chart.height = 300;
    expect(chart.width).toBe(600);
    expect(chart.height).toBe(300);
  });
});

describe('LineChart', () => {
  it('draw produces DrawLine operations', () => {
    const chart = new LineChart();
    const canvas = new MockCanvas();
    const data = createSampleData();
    chart.draw(canvas, data);
    const lineOps = canvas.operations.filter(op => op.startsWith('DrawLine'));
    expect(lineOps.length).toBeGreaterThan(0);
  });
});

describe('AreaChart', () => {
  it('draw produces FillRect or FillPath operations', () => {
    const chart = new AreaChart();
    const canvas = new MockCanvas();
    const data = createSampleData();
    chart.draw(canvas, data);
    const ops = canvas.operations.filter(op => op.startsWith('FillRect') || op.startsWith('FillPath'));
    expect(ops.length).toBeGreaterThan(0);
  });
});

describe('PieChart', () => {
  it('draw produces FillPath operations', () => {
    const chart = new PieChart();
    const canvas = new MockCanvas();
    const data = createSampleData();
    chart.draw(canvas, data);
    const pathOps = canvas.operations.filter(op => op.startsWith('FillPath'));
    expect(pathOps.length).toBeGreaterThan(0);
  });
});

describe('DotPlotChart', () => {
  it('draw produces FillCircle operations', () => {
    const chart = new DotPlotChart();
    const canvas = new MockCanvas();
    const data = createSampleData();
    chart.draw(canvas, data);
    const circleOps = canvas.operations.filter(op => op.startsWith('FillCircle'));
    expect(circleOps.length).toBeGreaterThan(0);
  });
});

describe('LollipopChart', () => {
  it('draw produces both DrawLine and FillCircle operations', () => {
    const chart = new LollipopChart();
    const canvas = new MockCanvas();
    const data = createSampleData();
    chart.draw(canvas, data);
    const lineOps = canvas.operations.filter(op => op.startsWith('DrawLine'));
    const circleOps = canvas.operations.filter(op => op.startsWith('FillCircle'));
    expect(lineOps.length).toBeGreaterThan(0);
    expect(circleOps.length).toBeGreaterThan(0);
  });
});

describe('GroupedBarChart', () => {
  it('draw with multi-series produces many FillRect operations', () => {
    const chart = new GroupedBarChart();
    const canvas = new MockCanvas();

    const data = new ChartData();
    data.title = 'Multi-series';
    for (let s = 0; s < 2; s++) {
      const series = new ChartSeries();
      series.name = `Series ${s + 1}`;
      for (let i = 0; i < 3; i++) {
        const pt = new ChartDataPoint();
        pt.label = `Item ${i + 1}`;
        pt.value = (i + 1) * (s + 1) * 10;
        series.dataPoints.push(pt);
      }
      data.series.push(series);
    }

    chart.draw(canvas, data);
    const rectOps = canvas.operations.filter(op => op.startsWith('FillRect'));
    expect(rectOps.length).toBeGreaterThanOrEqual(4);
  });
});
