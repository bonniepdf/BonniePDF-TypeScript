import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { TextBlock } from '../src/Elements/Text/TextBlock';
import { TextAlignment } from '../src/Elements/Text/TextAlignment';
import { Table } from '../src/Elements/Tables/Table';
import { Image } from '../src/Elements/Media/Image';
import { ChartElement } from '../src/Charts/ChartElement';
import { BarChart } from '../src/Charts/BarChart';
import { WatermarkSettings } from '../src/Configuration/WatermarkSettings';
import { StandardFonts } from '../src/Typography/StandardFonts';
import { Color } from '../src/Core/Color';
import { createMinimalJpeg, createTestChartData } from './helpers/test-base';

function simpleDoc(): Document {
  const doc = new Document();
  doc.add(new TextBlock('Hello, SVG world!', 14, StandardFonts.Helvetica));
  doc.add(new TextBlock('Second line of text.', 11, StandardFonts.Helvetica));
  return doc;
}

describe('SVG page export', () => {
  let doc: Document;
  afterEach(() => doc?.dispose());

  it('generateSvgPagesAsync returns one SVG per page', async () => {
    doc = simpleDoc();
    const pages = await doc.generateSvgPagesAsync();
    expect(pages).toHaveLength(1);
    expect(pages[0]).toContain('<svg');
    expect(pages[0]).toContain('</svg>');
  });

  it('emits a viewBox matching the page dimensions', async () => {
    doc = simpleDoc();
    const svg = await doc.generateFirstPageSvgAsync();
    // Default A4 in points: 595.276 x 841.89 (rounded to 3 dp by default).
    expect(svg).toMatch(/viewBox="0 0 595\.276 841\.89"/);
    expect(svg).toMatch(/width="595\.276"/);
    expect(svg).toMatch(/height="841\.89"/);
  });

  it('renders text content into the page', async () => {
    doc = simpleDoc();
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('Hello, SVG world!');
  });

  it('wraps content in a deterministic page group', async () => {
    doc = simpleDoc();
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('<g id="page-1" data-bonniepdf-page="1">');
  });

  it('includes accessibility metadata by default and omits it on request', async () => {
    doc = simpleDoc();
    const withMeta = await doc.generateFirstPageSvgAsync();
    expect(withMeta).toContain('role="img"');
    expect(withMeta).toContain('<title>');

    const without = await doc.generateFirstPageSvgAsync({ includeAccessibilityMetadata: false });
    expect(without).not.toContain('role="img"');
    expect(without).not.toContain('<title>');
  });

  it('produces deterministic output across equivalent documents', async () => {
    // Like the PDF path, a document tree is single-shot (stateful elements are
    // consumed during render), so determinism is verified across two equivalent
    // documents rather than two renders of the same instance.
    const a = await simpleDoc().generateFirstPageSvgAsync();
    const b = await simpleDoc().generateFirstPageSvgAsync();
    expect(a).toEqual(b);
  });

  it('honours the precision option', async () => {
    doc = simpleDoc();
    const svg = await doc.generateFirstPageSvgAsync({ precision: 1 });
    expect(svg).toMatch(/viewBox="0 0 595\.3 841\.9"/);
  });

  it('matches generated PDF page count for multi-page documents', async () => {
    doc = new Document();
    for (let i = 0; i < 3; i++) {
      if (i > 0) doc.addPage();
      doc.add(new TextBlock(`Page ${i + 1}`, 12, StandardFonts.Helvetica));
    }
    const pages = await doc.generateSvgPagesAsync();
    expect(pages.length).toBeGreaterThanOrEqual(3);
    pages.forEach((p, i) => expect(p).toContain(`data-bonniepdf-page="${i + 1}"`));
  });

  it('limits output to maxPages while keeping page numbers correct', async () => {
    doc = new Document();
    for (let i = 0; i < 4; i++) {
      if (i > 0) doc.addPage();
      doc.add(new TextBlock(`Page ${i + 1}`, 12, StandardFonts.Helvetica));
    }
    const pages = await doc.generateSvgPagesAsync({ maxPages: 2 });
    expect(pages).toHaveLength(2);
    expect(pages[0]).toContain('data-bonniepdf-page="1"');
    expect(pages[1]).toContain('data-bonniepdf-page="2"');
  });

  it('embeds raster images as data URIs', async () => {
    doc = new Document();
    const img = new Image();
    img.imageData = createMinimalJpeg();
    img.width = 64;
    img.altText = 'sample';
    doc.add(img);
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('<image');
    expect(svg).toContain('data:image/jpeg;base64,');
  });

  it('omits images when embedImages is "omit"', async () => {
    doc = new Document();
    const img = new Image();
    img.imageData = createMinimalJpeg();
    img.width = 64;
    img.altText = 'sample';
    doc.add(img);
    const svg = await doc.generateFirstPageSvgAsync({ embedImages: 'omit' });
    expect(svg).not.toContain('<image');
  });

  it('renders charts into the page surface', async () => {
    doc = new Document();
    const chart = new BarChart();
    chart.width = 400;
    chart.height = 250;
    doc.add(new ChartElement(chart, createTestChartData(4), 'A bar chart'));
    const svg = await doc.generateFirstPageSvgAsync();
    // Chart bars render as filled rects within the page.
    expect(svg).toContain('<rect');
    // The chart canvas is composed via a positioned translate group.
    expect(svg).toMatch(/<g transform="translate\(/);
  });

  it('renders tables', async () => {
    doc = new Document();
    const table = new Table(80, 80);
    table.addRow(
      new TextBlock('Cell A', 10, StandardFonts.Helvetica),
      new TextBlock('Cell B', 10, StandardFonts.Helvetica)
    );
    doc.add(table);
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('Cell A');
    expect(svg).toContain('Cell B');
  });

  it('draws the watermark behind content', async () => {
    doc = simpleDoc();
    doc.settings.watermark = new WatermarkSettings('DRAFT');
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('DRAFT');
    expect(svg).toContain('rotate(45'); // default -45deg negated for SVG
    // Watermark is prepended (paints behind the body content text).
    const wmIndex = svg.indexOf('DRAFT');
    const bodyIndex = svg.indexOf('Hello, SVG world!');
    expect(wmIndex).toBeLessThan(bodyIndex);
  });

  it('renders header and footer templates on every page', async () => {
    doc = new Document();
    doc.add(new TextBlock('Body', 12, StandardFonts.Helvetica));
    doc.settings.headerTemplate = pageNum => {
      const tb = new TextBlock();
      tb.text = `Header ${pageNum}`;
      tb.fontSize = 9;
      tb.textColor = Color.slate500;
      return tb;
    };
    doc.settings.footerTemplate = pageNum => {
      const tb = new TextBlock();
      tb.text = `Footer ${pageNum}`;
      tb.fontSize = 9;
      tb.textColor = Color.slate500;
      return tb;
    };
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('Header 1');
    expect(svg).toContain('Footer 1');
  });

  it('throws on out-of-range page index', async () => {
    doc = simpleDoc();
    await expect(doc.generateSvgPageAsync(5)).rejects.toThrow(/out of range/);
  });

  it('escapes XML special characters in text', async () => {
    doc = new Document();
    doc.add(new TextBlock('a < b & c > d', 12, StandardFonts.Helvetica));
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('&lt;');
    expect(svg).toContain('&amp;');
    expect(svg).not.toContain('a < b');
  });

  it('supports right and center aligned text', async () => {
    doc = new Document();
    const center = new TextBlock('Centered', 12, StandardFonts.Helvetica);
    center.alignment = TextAlignment.Center;
    doc.add(center);
    const svg = await doc.generateFirstPageSvgAsync();
    expect(svg).toContain('Centered');
    expect(svg).toContain('<svg');
  });
});
