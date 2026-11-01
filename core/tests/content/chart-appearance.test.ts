import { it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BarChart } from '../../src/Charts/BarChart';
import { chartToSvg } from '../../src/Export/SvgElementExport';
import { Document } from '../../src/Document';
import { documentToDefinition } from '../../src/Definition/toDefinition';
import { documentFromDefinition } from '../../src/Definition/fromDefinition';

it('renders rounded gradients natively in PDF and survives document-definition round trips', async () => {
  const chart = new BarChart({
    theme: 'modern',
    width: 480,
    height: 280,
    title: 'Quarterly sales',
    barStyle: { cornerRadius: 6, gradient: { startColor: '#93c5fd', endColor: '#2563eb', scope: 'plot' } },
    data: {
      series: [
        {
          name: 'Revenue',
          dataPoints: [
            { label: 'Q1', value: 25 },
            { label: 'Q2', value: 40 },
            { label: 'Q3', value: 32 },
          ],
        },
      ],
      yAxis: { maxValue: 50 },
    },
  });
  chart.title = 'Quarterly sales';
  const svg = chartToSvg(chart);
  expect(svg).toContain('<linearGradient');
  expect(svg).toMatch(/ C |C[\d]/);
  expect(svg).toContain('y="38"');
  const doc = new Document();
  doc.add(chart);
  const definition = (await documentToDefinition(doc)).definition;
  const second = await documentFromDefinition(definition);
  expect((await documentToDefinition(second)).definition).toEqual(definition);
  const pdf = await doc.generateBytesAsync();
  const text = Buffer.from(pdf).toString('latin1');
  expect(text).toContain('/ShadingType 2');
  expect(text).not.toContain('/Subtype /Image');
  if (process.env.CHART_APPEARANCE_OUTPUT) {
    const dir = process.env.CHART_APPEARANCE_OUTPUT;
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'modern-native.svg'), svg);
    fs.writeFileSync(path.join(dir, 'modern.pdf'), pdf);
    fs.writeFileSync(
      path.join(dir, 'crop.json'),
      JSON.stringify({ margin: doc.pages[0].margin, width: 480, height: 280 })
    );
  }
});
