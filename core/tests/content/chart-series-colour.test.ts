import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { BarChart } from '../../src/Charts/BarChart';
import { LineChart } from '../../src/Charts/LineChart';
import { GroupedBarChart } from '../../src/Charts/GroupedBarChart';
import { ChartData } from '../../src/Charts/Models/ChartData';
import { ChartSeries } from '../../src/Charts/Models/ChartSeries';
import { Color } from '../../src/Core/Color';
import type { CartesianChartBase } from '../../src/Charts/CartesianChartBase';

const CHART_RED = '#dc2626';
const SERIES_GREEN = '#16a34a';
const DEFAULT_SERIES = '#4f46e5';

/** A series with two points. Its colour is set only when `colour` is given. */
function series(colour?: string): ChartSeries {
  const s = new ChartSeries({
    name: 'Sales',
    dataPoints: [
      { label: 'A', value: 4000 },
      { label: 'B', value: 7000 },
    ],
  });
  if (colour) s.color = Color.fromHex(colour);
  return s;
}

async function svgOf(chart: CartesianChartBase): Promise<string> {
  const doc = new Document({ settings: { language: 'en-GB' }, metadata: { title: 'Chart colour' } });
  doc.add(chart);
  return (await doc.generateSvgPagesAsync())[0];
}

describe('a series with no colour of its own', () => {
  it('is drawn in the chart colour', async () => {
    const chart = new BarChart({ data: new ChartData({ series: [series()] }), barColor: CHART_RED, altText: 'Bars' });
    const svg = await svgOf(chart);
    expect(svg).toContain(CHART_RED);
    expect(svg).not.toContain(DEFAULT_SERIES);
  });

  it('still reads as the default series colour', () => {
    expect(series().color).toEqual(Color.fromHex(DEFAULT_SERIES));
  });

  it('follows the chart colour for line charts too', async () => {
    const chart = new LineChart({ data: new ChartData({ series: [series()] }), lineColor: CHART_RED, altText: 'Line' });
    expect(await svgOf(chart)).toContain(CHART_RED);
  });

  it('keeps the original indigo when neither colour is set', async () => {
    const chart = new BarChart({ data: new ChartData({ series: [series()] }), altText: 'Bars' });
    expect(await svgOf(chart)).toContain(DEFAULT_SERIES);
  });

  it('uses the default colour in a grouped chart, which has no colour of its own', async () => {
    const chart = new GroupedBarChart({ data: new ChartData({ series: [series(), series()] }), altText: 'Groups' });
    expect(await svgOf(chart)).toContain(DEFAULT_SERIES);
  });
});

describe('a series with a colour of its own', () => {
  it('keeps it over the chart colour', async () => {
    const chart = new BarChart({
      data: new ChartData({ series: [series(SERIES_GREEN)] }),
      barColor: CHART_RED,
      altText: 'Bars',
    });
    const svg = await svgOf(chart);
    expect(svg).toContain(SERIES_GREEN);
    expect(svg).not.toContain(CHART_RED);
  });
});
