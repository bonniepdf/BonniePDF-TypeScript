import { describe, it, expect } from 'vitest';
import { inflateSync } from 'zlib';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { RenderContext } from '../../src/Rendering/RenderContext';
import { PdfRenderPipeline } from '../../src/Rendering/PdfRenderPipeline';

// A document with no page chrome compresses each body page as soon as layout leaves it.
// Mirrored by the .NET FinishedPageStoreTests: the written streams must be exactly the
// pages the pipeline renders, in order.

function build(options: { chrome?: boolean; secondPage?: boolean } = {}): Document {
  const doc = new Document();
  for (let i = 0; i < 300; i++) doc.add(new TextBlock(`Row ${i} üéß`, { fontSize: 12 }));
  if (options.secondPage) {
    const page = doc.addPage();
    for (let i = 0; i < 120; i++) page.add(new TextBlock(`Second page row ${i}`, { fontSize: 12 }));
  }
  if (options.chrome) doc.settings.footerTemplate = n => new TextBlock(`Page ${n}`, { fontSize: 9 });
  return doc;
}

/** Each page's decoded content stream, in page order. */
function writtenPages(bytes: Uint8Array): string[] {
  const raw = new TextDecoder('latin1').decode(bytes);
  const pages: string[] = [];
  for (const contents of raw.matchAll(/\/Contents (\d+) 0 R/g)) {
    const start = raw.indexOf(`\n${contents[1]} 0 obj`);
    const length = Number(/\/Length (\d+)/.exec(raw.slice(start))![1]);
    const data = raw.indexOf('stream\n', start) + 'stream\n'.length;
    pages.push(new TextDecoder('latin1').decode(inflateSync(Buffer.from(bytes.subarray(data, data + length)))));
  }
  return pages;
}

function renderedPages(doc: Document): string[] {
  const ctx = new RenderContext(doc.settings.getOrientedPageSize(), doc.settings.margin);
  return [...PdfRenderPipeline.renderPagesStreaming(doc.pages, doc.settings, ctx)].map(page => page.contentStream);
}

describe('finished pages', () => {
  for (const [name, options] of [
    ['without chrome', {}],
    ['with chrome', { chrome: true }],
    ['across input pages', { secondPage: true }],
  ] as const) {
    it(`written streams decode to the rendered pages (${name})`, () => {
      const expected = renderedPages(build(options));
      const written = writtenPages(build(options).generateBytes());
      expect(expected.length).toBeGreaterThan(2);
      expect(written).toEqual(expected);
    });
  }

  it('compresses finished pages only when the serializer asks and no chrome is configured', () => {
    const doc = build();
    const ctx = new RenderContext(doc.settings.getOrientedPageSize(), doc.settings.margin);
    ctx.sealFinishedPages = true;
    const pages = [...PdfRenderPipeline.renderPagesStreaming(doc.pages, doc.settings, ctx)];
    // Every page but the last was sealed when layout left it.
    expect(pages.slice(0, -1).every(page => page.compressedContent && page.contentStream === '')).toBe(true);
    expect(pages.at(-1)!.compressedContent).toBeUndefined();

    const chrome = build({ chrome: true });
    const chromeCtx = new RenderContext(chrome.settings.getOrientedPageSize(), chrome.settings.margin);
    chromeCtx.sealFinishedPages = true;
    expect(
      [...PdfRenderPipeline.renderPagesStreaming(chrome.pages, chrome.settings, chromeCtx)].some(
        p => p.compressedContent
      )
    ).toBe(false);
  });
});
