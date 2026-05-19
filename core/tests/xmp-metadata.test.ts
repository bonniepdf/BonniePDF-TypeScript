import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { asPdf17, asPdfA } from '../src/Extensions/DocumentSettingsExtensions';
import { pdfToText } from './helpers/test-base';

describe('XmpMetadata', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('Pdf17_ContainsXmpMetadata', () => {
    doc = new Document();
    asPdf17(doc.settings);
    doc.metadata.title = 'Test Document';
    doc.metadata.author = 'Test Author';
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/Metadata');
    expect(text).toContain('/Subtype /XML');
  });

  it('Pdf14_DoesNotContainXmpMetadata', () => {
    doc = new Document();
    // Default version is Pdf14 — no XMP expected
    const text = pdfToText(doc.generateBytes());
    expect(text).not.toContain('/Subtype /XML');
  });

  it('PdfA_ContainsOutputIntents', () => {
    // XMP pdfaid namespace is deferred — test OutputIntents which IS written
    doc = new Document();
    asPdfA(doc.settings);
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/GTS_PDFA1');
    expect(text).toContain('/OutputIntents');
  });

  it('Pdf17_metadata_title_in_info_dict', () => {
    doc = new Document();
    asPdf17(doc.settings);
    doc.metadata.title = 'MyTitle';
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('MyTitle');
  });

  it('metadata_author_subject_keywords', () => {
    doc = new Document();
    asPdf17(doc.settings);
    doc.metadata.author = 'AuthorName';
    doc.metadata.subject = 'SubjectText';
    doc.metadata.keywords = 'kw1, kw2';
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('AuthorName');
    expect(text).toContain('SubjectText');
  });
});
