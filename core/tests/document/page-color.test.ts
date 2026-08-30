import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { Color } from '../../src/Core/Color';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { Container } from '../../src/Elements/Layout/Container';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { contentStreams, firstContentStream } from '../helpers/test-base';

/** The first content stream, inflated. */
function firstPageStream(bytes: Uint8Array): string {
  return firstContentStream(bytes);
}

/** Every content stream containing a fill-rectangle, in file order. */
function fillStreams(bytes: Uint8Array): string[] {
  return contentStreams(bytes).filter(s => s.includes(' re'));
}

describe('DocumentSettings.pageColor', () => {
  it('fills the page with the colour when set', () => {
    const settings = new DocumentSettings();
    settings.pageColor = ColorPalette.indigo[50];

    const doc = new Document(settings);
    const bytes = doc.generateBytes();
    const stream = firstPageStream(bytes);

    // The pageColour fill is the very first op: a filled rectangle covering
    // the full page (setFillColor 'rg' + rectangle 're' + fill 'f').
    expect(stream).toContain('rg');
    expect(stream).toContain(' re');
    expect(stream).toContain(' f');
  });

  it('omits the fill when pageColor is unset', () => {
    const doc = new Document();
    const bytes = doc.generateBytes();
    const stream = firstPageStream(bytes);

    // An empty document with no pageColour produces no fill-rectangle ops.
    expect(stream).not.toContain(' re');
    expect(stream).not.toContain(' f');
  });

  it('paints behind body content', () => {
    const settings = new DocumentSettings();
    settings.pageColor = Color.fromHex('#e2e8f0');

    const doc = new Document(settings);
    doc.add(new TextBlock('on top of the background'));
    const bytes = doc.generateBytes();
    const stream = firstPageStream(bytes);

    // The fill rect must precede the text-showing operator (Tj) so it sits
    // behind the text in the painter's-model stream.
    const fillIndex = stream.indexOf(' re');
    const textIndex = stream.indexOf('Tj');
    expect(fillIndex).toBeGreaterThan(-1);
    expect(textIndex).toBeGreaterThan(-1);
    expect(fillIndex).toBeLessThan(textIndex);
  });

  it('renders in SVG page export', async () => {
    const settings = new DocumentSettings();
    settings.pageColor = ColorPalette.rose[100];

    const doc = new Document(settings);
    const pages = await doc.generateSvgPagesAsync();
    expect(pages.length).toBeGreaterThan(0);
    // The SVG page should contain a full-page <rect> fill in the chosen colour.
    expect(pages[0]).toContain('<rect');
    expect(pages[0]).toContain(ColorPalette.rose[100].toHexString());
  });

  it('applies Page.pageColor with no document-level pageColor set', () => {
    const doc = new Document();
    doc.pages[0].pageColor = Color.fromHex('#00ff00'); // green, per-page only
    doc.add(new TextBlock('green page'));

    const streams = fillStreams(doc.generateBytes());
    expect(streams.length).toBe(1);
    expect(streams[0]).toContain('0 1 0 rg'); // green fill
  });

  it('Page.pageColor overrides the document-level pageColor for that page', () => {
    const settings = new DocumentSettings();
    settings.pageColor = Color.fromHex('#ff0000'); // red default for every page

    const doc = new Document(settings);
    doc.add(new TextBlock('page 0: default red'));

    const page1 = doc.addPage();
    page1.pageColor = Color.fromHex('#00ff00'); // green override on page 1
    doc.add(new TextBlock('page 1: green override'));

    const streams = fillStreams(doc.generateBytes());
    expect(streams.length).toBe(2);
    // Page 0 keeps the document-level red; page 1 uses its own green override.
    expect(streams[0]).toContain('1 0 0 rg');
    expect(streams[1]).toContain('0 1 0 rg');
    expect(streams[1]).not.toContain('1 0 0 rg');
  });

  it('Page.pageBackground overrides the document-level template for that page', () => {
    // Document-level template draws a RED fill on every page; page 1 overrides
    // it with its own GREEN background element.
    const doc = new Document();
    doc.settings.pageBackground = () => {
      const c = new Container();
      c.backgroundColor = Color.fromHex('#ff0000');
      c.height = 9999; // fill the page (pageBackground renders at natural height)
      return c;
    };
    doc.add(new TextBlock('page 0: document-level red background'));

    const cover = doc.addPage();
    const coverBg = new Container();
    coverBg.backgroundColor = Color.fromHex('#00ff00');
    coverBg.height = 9999;
    cover.pageBackground = coverBg;
    doc.add(new TextBlock('page 1: per-page green background'));

    const streams = fillStreams(doc.generateBytes());
    expect(streams.length).toBe(2);
    expect(streams[0]).toContain('1 0 0 rg'); // page 0: red (document template)
    expect(streams[1]).toContain('0 1 0 rg'); // page 1: green (per-page override)
    expect(streams[1]).not.toContain('1 0 0 rg');
  });
});
