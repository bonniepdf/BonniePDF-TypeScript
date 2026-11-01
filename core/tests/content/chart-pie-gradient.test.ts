import { describe, it, expect } from 'vitest';
import { tintColor } from '../../src/Charts/Graphics/ChartTint';
import { PieChart } from '../../src/Charts/PieChart';
import { Color } from '../../src/Core/Color';
import { chartToSvg } from '../../src/Export/SvgElementExport';

/**
 * Pie slice gradients - shared conformance fixture `charts/pie-gradient`.
 * Each slice fades from its tint at the inner edge to its own colour at the rim; the tint moves each
 * channel 45% of the way to white in integers, and translucent colours are rejected.
 *
 * Mirrors the .NET ChartPieGradientTests.
 */

const TINTS: [color: string, tint: string][] = [
  ['#2563eb', '#87a9f4'],
  ['#0d9488', '#7ac4be'],
  ['#7c3aed', '#b793f5'],
  ['#d97706', '#eab476'],
  ['#4f46e5', '#9e99f1'],
  ['#000000', '#737373'],
  ['#808080', '#b9b9b9'],
  ['#ffffff', '#ffffff'],
];

const REJECTED = ['#2563eb80', '#00000000'];

describe('chart pie gradient', () => {
  it.each(TINTS)('tints %s to %s', (color, tint) => {
    expect(tintColor(Color.fromHex(color)).toHexString()).toBe(tint);
  });

  it.each(REJECTED)('rejects translucent %s', color => {
    expect(() => tintColor(Color.fromHex(color))).toThrow(RangeError);
  });

  it('draws native gradient slices only when asked', () => {
    const data = {
      series: [
        {
          dataPoints: [
            { label: 'A', value: 3 },
            { label: 'B', value: 1 },
          ],
        },
      ],
    };
    expect(chartToSvg(new PieChart({ data }))).not.toContain('<linearGradient');
    const svg = chartToSvg(new PieChart({ data, sliceGradient: true, colors: ['#2563eb', '#d97706'] }));
    expect(svg).toContain('stop-color="#87a9f4"');
    expect(svg).toContain('stop-color="#eab476"');
  });
});
