import { expect, test } from 'vitest';
import { generateCode } from '../src/generate';

test('maps declarative chrome, explicit page margins, attachments and native chart enums', async () => {
  const result = await generateCode({
    version: 1,
    minorVersion: 0,
    settings: {
      pageChrome: {
        header: {
          firstPage: { type: 'TextBlock', text: 'First page' },
          odd: { type: 'TextBlock', text: 'Odd' },
          even: { type: 'TextBlock', text: 'Even' },
        },
      },
    },
    resources: { data: { kind: 'attachment', mediaType: 'text/plain', data: 'SGVsbG8=' } },
    attachments: [
      { resource: 'data', fileName: 'readme.txt', relationship: 'source', creationDate: '2026-11-09T12:00:00Z' },
    ],
    pages: [
      {
        margin: '1cm',
        orientation: 'landscape',
        content: [
          {
            type: 'BarChart',
            orientation: 'horizontal',
            data: { series: [{ name: 'Sales', dataPoints: [{ label: 'A', value: 2 }] }] },
          },
        ],
      },
      { size: { width: 300, height: 200 }, content: [] },
    ],
  });
  expect(result.diagnostics).toEqual([]);
  expect(result.files[0].content).toContain('pageTemplate({');
  expect(result.files[0].content).toContain('PageOrientation.Landscape');
  expect(result.files[0].content).toContain('ChartOrientation.Horizontal');
  expect(result.files[0].content).toContain('new PdfSize(300, 200)');
  expect(result.files[0].content).toContain('doc.attach({');
  expect(result.files[1].content).toContain('PageTemplate.FromElements(');
  expect(result.files[1].content).toContain('Units.Parse("1cm")');
  expect(result.files[1].content).toContain('doc.Attach(new FileAttachment');
});
