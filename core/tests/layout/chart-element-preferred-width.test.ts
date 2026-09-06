import { describe, it, expect } from 'vitest';
import { ChartElement } from '../../src/Charts/ChartElement';
import { GroupedBarChartElement } from '../../src/Charts/GroupedBarChartElement';
import { BarChart } from '../../src/Charts/BarChart';
import { GroupedBarChart } from '../../src/Charts/GroupedBarChart';
import { ChartData } from '../../src/Charts/Models/ChartData';

/**
 * The two deprecated chart wrappers report preferred width differently, and the
 * difference is load-bearing: auto-sizing containers use it to size their content.
 * Mirrors the .NET wrappers, where only ChartElement overrides
 * GetPreferredContentWidth.
 */
describe('chart element preferred width', () => {
  it('reports the chart width from ChartElement', () => {
    const chart = new BarChart();
    chart.width = 420;
    chart.height = 200;

    expect(new ChartElement(chart, new ChartData()).getPreferredWidth()).toBe(420);
  });

  it('reports no preferred width from GroupedBarChartElement', () => {
    const chart = new GroupedBarChart();
    chart.width = 420;
    chart.height = 200;

    expect(new GroupedBarChartElement(chart, new ChartData()).getPreferredWidth()).toBe(0);
  });
});
