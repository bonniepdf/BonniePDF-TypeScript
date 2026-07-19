import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { Heading } from '../../src/Elements/Text/Heading';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { VisualToc } from '../../src/Elements/Text/VisualToc';
import { PageBreak } from '../../src/Elements/Layout/PageBreak';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { pdfToText } from '../helpers/test-base';

/**
 * Regression coverage for the two-pass TOC resolution (parity with the .NET
 * PdfDocumentSerializer). Unlike visual-toc-tagging.test.ts, here the VisualToc
 * is added *before* the headings it references - the Dickens-example layout -
 * so a single-pass serializer would print "XX" page numbers and link every
 * entry to page 1.
 */
describe('VisualToc page-number + link resolution (TOC before headings)', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  function makeHeading(id: string, text: string): Heading {
    const h = new Heading(text);
    h.tocIdentifier = id;
    h.fontSize = 20;
    return h;
  }

  function buildDoc(): Document {
    const d = new Document();

    // TOC on page 1, before any heading.
    const toc = new VisualToc();
    toc.fontName = StandardFonts.Helvetica;
    toc.fontSize = 12;
    toc.headingIdentifiers.push('ch1', 'ch2', 'ch3');
    d.add(toc);
    d.add(new PageBreak());

    // Each chapter forced onto its own page so page numbers are distinct.
    d.add(makeHeading('ch1', 'Chapter One'));
    d.add(new TextBlock('Body of chapter one.'));
    d.add(new PageBreak());
    d.add(makeHeading('ch2', 'Chapter Two'));
    d.add(new TextBlock('Body of chapter two.'));
    d.add(new PageBreak());
    d.add(makeHeading('ch3', 'Chapter Three'));
    d.add(new TextBlock('Body of chapter three.'));
    return d;
  }

  it('resolves real page numbers (no "XX" placeholder) on the TOC page', () => {
    doc = buildDoc();
    const text = pdfToText(doc.generateBytes());
    // The unresolved placeholder must not survive into the content stream.
    expect(text).not.toContain('(XX)');
    // Chapters land on pages 2, 3, 4 respectively.
    expect(text).toContain('(2)');
    expect(text).toContain('(3)');
    expect(text).toContain('(4)');
  });

  it('emits one GoTo link annotation per TOC entry', () => {
    doc = buildDoc();
    const text = pdfToText(doc.generateBytes());
    const gotoCount = (text.match(/\/S \/GoTo/g) ?? []).length;
    expect(gotoCount).toBe(3);
  });

  it('gives each TOC link a non-zero clickable rectangle', () => {
    doc = buildDoc();
    const text = pdfToText(doc.generateBytes());
    // Every /Link annotation must have a real /Rect, not the [0 0 0 0] fallback.
    const rects = [...text.matchAll(/\/Subtype \/Link[\s\S]*?\/Rect \[([^\]]+)\]/g)].map(m => m[1].trim());
    expect(rects.length).toBe(3);
    for (const rect of rects) {
      expect(rect).not.toBe('0 0 0 0');
      const [x1, y1, x2, y2] = rect.split(/\s+/).map(Number);
      expect(x2).toBeGreaterThan(x1);
      expect(y2).toBeGreaterThan(y1);
    }
  });

  it('links target distinct pages, not all page 1', () => {
    doc = buildDoc();
    const text = pdfToText(doc.generateBytes());
    // Collect the destination page-object ids referenced by the GoTo actions.
    const dests = [...text.matchAll(/\/S \/GoTo \/D \[(\d+) 0 R \/Fit\]/g)].map(m => m[1]);
    expect(dests.length).toBe(3);
    // All three must be distinct (each chapter is on its own page).
    expect(new Set(dests).size).toBe(3);
  });

  it('auto-populates bookmarks from resolved headings when none supplied', () => {
    doc = buildDoc();
    doc.generateBytes();
    expect(doc.settings.bookmarks.map(b => b.title)).toEqual(['ch1', 'ch2', 'ch3']);
    // 0-based page indices for pages 2, 3, 4.
    expect(doc.settings.bookmarks.map(b => b.pageIndex)).toEqual([1, 2, 3]);
  });
});
