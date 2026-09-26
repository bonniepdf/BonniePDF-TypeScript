import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { RichText } from '../../src/Elements/Text/RichText';
import { Container } from '../../src/Elements/Layout/Container';
import { pdfToText } from '../helpers/test-base';

/**
 * `{{CurrentPage}}` and `{{TotalPages}}` in rich-text spans behave as they do in a TextBlock: the
 * current page is substituted as each page is drawn, the total resolves once the whole document is
 * laid out, and a text that a container sizes to its own preferred width is never wrapped.
 * Mirrors the token tests in BonniePDF.Tests/Layout/FluentTextAndChromeTests.cs.
 */

function twoPageDocument(footer: () => RichText | Container): Document {
  const doc = new Document(new DocumentSettings({ margin: 50, footerTemplate: footer }));
  for (let i = 0; i < 90; i++) doc.add(new TextBlock({ text: `line ${i}` }));
  return doc;
}

describe('RichText page tokens', () => {
  it('substitutes the current page and resolves the total on every page', async () => {
    const doc = twoPageDocument(() =>
      new RichText({ alignment: 'center' }).span('Page {{CurrentPage}} of {{TotalPages}}')
    );

    const text = pdfToText(await doc.generateBytesAsync());

    expect(text).not.toContain('{{');
    expect(text).toContain('(Page 1 of ) Tj');
    expect(text).toContain('(Page 2 of ) Tj');
    expect(text).toContain('(2) Tj'); // the deferred total holds the real page count
    doc.dispose();
  });

  it('substitutes tokens in a span of its own, next to plain spans', async () => {
    const doc = twoPageDocument(() =>
      new RichText().span('Page ').span('{{CurrentPage}}').span(' of ').span('{{TotalPages}}')
    );

    const text = pdfToText(await doc.generateBytesAsync());

    expect(text).not.toContain('{{');
    expect(text).toContain('(Page 1 of ) Tj'); // same-style spans are one run
    doc.dispose();
  });

  it('does not wrap a centred footer that the container sizes to its own preferred width', async () => {
    const doc = twoPageDocument(
      () =>
        new Container({
          horizontalAlignment: 'center',
          child: new RichText().span('{{CurrentPage}}').span(' / ').span('{{TotalPages}}'),
        })
    );

    const text = pdfToText(await doc.generateBytesAsync());

    // One line means one run: "1 / " and the deferred total, never "1 /" over "2".
    expect(text).toContain('(1 / ) Tj');
    expect(text).toContain('(2 / ) Tj');
    doc.dispose();
  });

  it('leaves rich text with no tokens unchanged', async () => {
    const doc = new Document();
    doc.add(new RichText().span('no tokens here').span(' or here'));

    const text = pdfToText(await doc.generateBytesAsync());

    expect(text).toContain('(no tokens here or here) Tj'); // adjacent same-style spans are one run
    doc.dispose();
  });
});
