import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { DocumentSettings } from '../src/Configuration/DocumentSettings';
import { PdfSize } from '../src/Configuration/PdfSize';

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
});
