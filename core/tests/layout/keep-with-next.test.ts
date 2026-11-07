import { expect, it } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { Heading } from '../../src/Elements/Text/Heading';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Spacer } from '../../src/Elements/Layout/Spacer';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';

it.each([false, true])('moves a heading with the first lines of a longer paragraph (nested=%s)', async nested => {
  const doc = new Document(new DocumentSettings({ pageSize: new PdfSize(180, 180), margin: 15 }));
  const flow = nested ? new VerticalStack() : doc;
  flow.add(new Spacer(126));
  flow.add(new Heading('Next section'));
  flow.add(new TextBlock(Array.from({ length: 12 }, (_, i) => 'Body line ' + i)));
  if (flow instanceof VerticalStack) doc.add(flow);
  const pages = await doc.generateSvgPagesAsync();
  expect(pages[0]).not.toContain('Next section');
  expect(pages[1]).toContain('Next section');
  expect(pages[1]).toContain('Body line 0');
  expect(pages[2]).toContain('Body line 11');
  doc.dispose();
});
