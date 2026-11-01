import { describe, it, expect } from 'vitest';
import {
  checkValueRange,
  isBelowOrigin,
  originFraction,
  valueFraction,
} from '../../src/Charts/Graphics/ChartValueScale';
import { BarChart } from '../../src/Charts/BarChart';
import { ChartSeries } from '../../src/Charts/Models/ChartSeries';
import { chartToSvg } from '../../src/Export/SvgElementExport';

/**
 * Cartesian value scale - shared conformance fixture `charts/value-scale`.
 * Values sit linearly between minValue and maxValue; bars, areas and stems start at zero limited to
 * the range; a value below that origin is labelled below (or left of) its point; a range that cannot
 * be drawn is rejected.
 *
 * Mirrors the .NET ChartValueScaleTests.
 */

const FRACTIONS: [min: number, max: number, value: number, fraction: number][] = [
  [0, 50, 12.5, 0.25],
  [0, 50, 0, 0],
  [0, 50, 75, 1.5],
  [0, 50, -25, -0.5],
  [20, 50, 35, 0.5],
  [20, 50, 20, 0],
  [20, 50, 50, 1],
  [20, 50, 65, 1.5],
  [20, 50, 5, -0.5],
  [-20, 60, 0, 0.25],
  [-20, 60, -20, 0],
  [-20, 60, 40, 0.75],
  [-20, 60, -40, -0.25],
  [-50, -10, -30, 0.5],
  [-50, -10, -10, 1],
  [0.5, 1.5, 0.75, 0.25],
];

const ORIGINS: [min: number, max: number, fraction: number][] = [
  [0, 50, 0],
  [20, 50, 0],
  [-20, 60, 0.25],
  [-10, 30, 0.25],
  [-50, -10, 1],
  [-10, 0, 1],
  [0, 10, 0],
];

const LABEL_SIDES: [min: number, max: number, value: number, belowOrigin: boolean][] = [
  [0, 50, 12.5, false],
  [0, 50, 0, false],
  [0, 50, -5, true],
  [-20, 60, 0, false],
  [-20, 60, -0.5, true],
  [-50, -10, -10, false],
  [-50, -10, -30, true],
  [-50, -10, -5, false],
  [20, 50, 20, false],
  [20, 50, 10, true],
];

const REJECTED: [min: number, max: number][] = [
  [10, 10],
  [50, 10],
  [0, 0],
  [-5, -10],
  [NaN, 10],
  [0, Infinity],
  [-Infinity, 10],
];

describe('chart value scale', () => {
  it.each(FRACTIONS)('places %d..%d value %d at %d', (min, max, value, fraction) => {
    expect(valueFraction(value, min, max)).toBe(fraction);
  });

  it.each(ORIGINS)('starts marks on %d..%d at %d', (min, max, fraction) => {
    expect(originFraction(min, max)).toBe(fraction);
  });

  it.each(LABEL_SIDES)('labels %d..%d value %d below its point: %s', (min, max, value, belowOrigin) => {
    expect(isBelowOrigin(value, min, max)).toBe(belowOrigin);
  });

  it.each(REJECTED)('rejects %d..%d', (min, max) => {
    expect(() => checkValueRange(min, max)).toThrow(RangeError);
  });

  it('rejects the range when a chart with series is drawn, and not before', () => {
    const chart = new BarChart({ data: { yAxis: { minValue: 10, maxValue: 10 } } });
    expect(() => chartToSvg(chart)).not.toThrow();
    chart.data.series = [new ChartSeries({ dataPoints: [{ label: 'A', value: 5 }] })];
    expect(() => chartToSvg(chart)).toThrow(RangeError);
  });
});
