import { ChartData } from '../../src/Charts/Models/ChartData';
import { ChartSeries } from '../../src/Charts/Models/ChartSeries';
import { ChartDataPoint } from '../../src/Charts/Models/ChartDataPoint';

export function pdfToText(bytes: Uint8Array): string {
  return new TextDecoder('latin1').decode(bytes);
}

export function assertValidPdf(bytes: Uint8Array): void {
  const text = pdfToText(bytes);
  expect(bytes.length).toBeGreaterThan(0);
  expect(text.startsWith('%PDF-')).toBe(true);
  expect(text).toContain('%%EOF');
  expect(text).toContain('xref');
  expect(text).toContain('trailer');
}

export function assertPdfHasFonts(bytes: Uint8Array): void {
  expect(pdfToText(bytes)).toContain('/Font');
}

export function assertPdfHasPages(bytes: Uint8Array, minPages: number): void {
  const text = pdfToText(bytes);
  let count = 0;
  let idx = 0;
  while ((idx = text.indexOf('/Type', idx)) !== -1) {
    const ahead = text.indexOf('/Page', idx);
    if (ahead !== -1 && ahead - idx < 20 && text[ahead + 5] !== 's') count++;
    idx++;
  }
  expect(count).toBeGreaterThanOrEqual(minPages);
}

export function createTestChartData(points = 5): ChartData {
  const series = new ChartSeries();
  for (let i = 0; i < points; i++) {
    const pt = new ChartDataPoint();
    pt.label = `Item ${i + 1}`;
    pt.value = i * 10 + 20;
    series.dataPoints.push(pt);
  }
  const data = new ChartData();
  data.series.push(series);
  return data;
}

export function createMinimalJpeg(): Uint8Array {
  return new Uint8Array([
    0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x10, 0x00, 0x20, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x00, 0x03,
    0x11, 0x00, 0xff, 0xd9,
  ]);
}
