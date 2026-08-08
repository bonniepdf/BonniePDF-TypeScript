import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

describe('Document', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('creates a new document with default settings', () => {
    doc = new Document();
    expect(doc).toBeDefined();
    expect(doc.settings).toBeDefined();
    // Document auto-creates the first page
    expect(doc.pages).toHaveLength(1);
  });

  it('adds a page to the document', () => {
    doc = new Document();
    doc.addPage();
    expect(doc.pages).toHaveLength(2);
  });

  it('saves document to bytes with valid PDF header', () => {
    doc = new Document();
    doc.addPage();
    const bytes = doc.generateBytes();
    expect(bytes.length).toBeGreaterThan(0);
    const header = new TextDecoder().decode(bytes.slice(0, 8));
    expect(header.startsWith('%PDF-1.4')).toBe(true);
  });

  it('generates bytes with valid PDF structure', () => {
    doc = new Document();
    doc.addPage();
    const bytes = doc.generateBytes();
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text).toContain('%%EOF');
    expect(text).toContain('xref');
    expect(text).toContain('trailer');
  });

  it('creates document with custom settings', () => {
    const settings = new DocumentSettings(PdfSize.a4);
    doc = new Document(settings);
    expect(doc.settings).toBeDefined();
    // Document auto-creates the first page
    expect(doc.pages).toHaveLength(1);
  });

  // The constructor creates page 1 before any post-construction assignment can
  // land, so a page whose margin came from the settings must resolve it at
  // render time rather than freezing the value it saw at construction.
  // Otherwise `doc.settings = ...` (and C#'s object-initializer idiom) is
  // silently ignored on the first page only.
  it('applies a margin from settings assigned after construction', async () => {
    doc = new Document();
    expect(doc.pages[0].hasExplicitMargin).toBe(false);

    doc.settings = new DocumentSettings();
    doc.settings.margin = 72;
    doc.add(new TextBlock('Body copy.'));

    const { pages } = await doc.generateSvgDocumentAsync();
    const firstX = /<text[^>]*\sx="([\d.]+)/.exec(pages[0]);
    expect(Number(firstX![1])).toBeCloseTo(72, 3);
  });

  it('keeps an explicit per-page margin in preference to the document margin', () => {
    doc = new Document();
    doc.addPage(PdfSize.a4, 20);
    expect(doc.pages[1].hasExplicitMargin).toBe(true);

    doc.settings.margin = 72;
    expect(doc.pages[1].margin).toBe(20);
  });
});
