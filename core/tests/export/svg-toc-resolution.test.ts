import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { Heading } from '../../src/Elements/Text/Heading';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { VisualToc } from '../../src/Elements/Text/VisualToc';
import { PageBreak } from '../../src/Elements/Layout/PageBreak';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { exportSvgPagesAsync } from '../../src/Export/SvgPageExporter';

/**
 * The SVG export path runs a separate pipeline from the PDF serializer, so it
 * needs its own two-pass TOC resolution. With a VisualToc placed before the
 * headings it references (the Dickens-example layout), a single pass would draw
 * the "XX" placeholder for every page number in the preview.
 */
describe('SVG export - VisualToc page-number resolution', () => {
  function buildDoc(): Document {
    const d = new Document();

    const toc = new VisualToc();
    toc.fontName = StandardFonts.Helvetica;
    toc.fontSize = 12;
    toc.headingIdentifiers.push('ch1', 'ch2', 'ch3');
    d.add(toc);
    d.add(new PageBreak());

    d.add(makeHeading('ch1', 'Chapter One'));
    d.add(new TextBlock('Body one.'));
    d.add(new PageBreak());
    d.add(makeHeading('ch2', 'Chapter Two'));
    d.add(new TextBlock('Body two.'));
    d.add(new PageBreak());
    d.add(makeHeading('ch3', 'Chapter Three'));
    d.add(new TextBlock('Body three.'));
    return d;
  }

  function makeHeading(id: string, text: string): Heading {
    const h = new Heading(text);
    h.tocIdentifier = id;
    h.fontSize = 20;
    return h;
  }

  it('renders resolved page numbers, not the "XX" placeholder', async () => {
    const pages = await exportSvgPagesAsync(buildDoc());
    const tocPageSvg = pages[0];
    // The placeholder must not appear in the TOC page's text runs.
    expect(tocPageSvg).not.toContain('>XX<');
    expect(tocPageSvg).not.toContain('XX');
    // Chapters land on pages 2, 3, 4 - those digits should be drawn.
    expect(tocPageSvg).toContain('>2<');
    expect(tocPageSvg).toContain('>3<');
    expect(tocPageSvg).toContain('>4<');
  });
});
