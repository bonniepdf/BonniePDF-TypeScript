import { inflateSync } from 'node:zlib';
import { ChartData } from '../../src/Charts/Models/ChartData';
import { ChartSeries } from '../../src/Charts/Models/ChartSeries';
import { ChartDataPoint } from '../../src/Charts/Models/ChartDataPoint';

/**
 * Decodes a PDF for assertions, inflating any `/FlateDecode` stream so the
 * operators inside stay greppable.
 *
 * Content streams and embedded font programs are compressed, so a plain
 * latin1 decode would show only the compressed bytes — assertions like
 * `expect(pdf).toContain('BT')` would quietly stop meaning anything rather
 * than failing. The inflated bodies are appended after the raw text, so
 * assertions about object dictionaries and assertions about stream operators
 * both work against one string.
 */
export function pdfToText(bytes: Uint8Array): string {
  const raw = new TextDecoder('latin1').decode(bytes);
  const decoder = new TextDecoder('latin1');
  const marker = 'stream\n';

  // Rebuild the document with each stream body replaced *in place* by its
  // inflated content, so the surrounding `stream` / `endstream` structure is
  // preserved and callers that slice between those markers keep working.
  // Byte offsets in the returned string no longer match the file, which is
  // fine - anything asserting on offsets works from the bytes directly.
  let out = '';
  let cursor = 0;
  let index = raw.indexOf(marker);

  while (index >= 0) {
    const start = index + marker.length;
    const end = raw.indexOf('endstream', start);
    if (end < 0) break;

    let body: string;
    try {
      body = decoder.decode(inflateSync(Buffer.from(bytes.subarray(start, end))));
    } catch {
      // Not a Flate stream (plain content, an image, a raw font program).
      body = raw.slice(start, end);
    }

    out += raw.slice(cursor, start) + body;
    cursor = end;
    index = raw.indexOf(marker, end + 'endstream'.length);
  }

  return out + raw.slice(cursor);
}

/**
 * The document's content streams, in order, each inflated if it is
 * `/FlateDecode`d. Use this rather than slicing between `stream`/`endstream`
 * by hand — content streams are compressed, so a raw slice is unreadable.
 */
export function contentStreams(bytes: Uint8Array): string[] {
  const raw = new TextDecoder('latin1').decode(bytes);
  const streams: string[] = [];
  const marker = 'stream\n';

  let index = raw.indexOf(marker);
  while (index >= 0) {
    const start = index + marker.length;
    const end = raw.indexOf('endstream', start);
    if (end < 0) break;
    const slice = bytes.subarray(start, end);
    try {
      streams.push(new TextDecoder('latin1').decode(inflateSync(Buffer.from(slice))));
    } catch {
      streams.push(new TextDecoder('latin1').decode(slice));
    }
    index = raw.indexOf(marker, end + 'endstream'.length);
  }

  return streams;
}

/** The first content stream, inflated. */
export function firstContentStream(bytes: Uint8Array): string {
  return contentStreams(bytes)[0] ?? '';
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
