import { describe, it, expect } from 'vitest';
import { DocumentMetadata } from '../src/Configuration/DocumentMetadata';
import { XmpConformanceBlock } from '../src/Metadata/XmpConformanceBlock';
import { XmpMetadataWriter } from '../src/Metadata/XmpMetadataWriter';

/**
 * this feature acceptance tests for the additive XMP conformance hook. Covers
 * the same matrix as the .NET this feature tests in
 * BonniePDF.Tests/XmpMetadataTests.cs.
 */
describe('XmpMetadataWriter — conformance blocks', () => {
  it('PdfUa1 block emits pdfuaid:part', () => {
    const metadata = new DocumentMetadata('Accessibility test');
    const xml = XmpMetadataWriter.generateXmpXml(metadata, [XmpConformanceBlock.pdfUa1()]);

    expect(xml).toContain('xmlns:pdfuaid="http://www.aiim.org/pdfua/ns/id/"');
    expect(xml).toContain('<pdfuaid:part>1</pdfuaid:part>');
  });

  it('PdfA1B block emits pdfaid:part and pdfaid:conformance', () => {
    const metadata = new DocumentMetadata('PDF/A test');
    const xml = XmpMetadataWriter.generateXmpXml(metadata, [XmpConformanceBlock.pdfA1B()]);

    expect(xml).toContain('xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"');
    expect(xml).toContain('<pdfaid:part>1</pdfaid:part>');
    expect(xml).toContain('<pdfaid:conformance>B</pdfaid:conformance>');
  });

  it('no blocks => empty XMP body (preserves pre-T-14 behaviour)', () => {
    const metadata = new DocumentMetadata('Plain');
    const xml = XmpMetadataWriter.generateXmpXml(metadata);

    expect(xml).toBe('');
  });

  it('PdfA + PdfUa1 composes both namespaces into one rdf:Description', () => {
    // The additive-hook contract: two registered blocks emit into the
    // same XMP packet without collision. ZUGFeRD will be a third entry
    // in this same array when implemented.
    const metadata = new DocumentMetadata('Both');
    const xml = XmpMetadataWriter.generateXmpXml(metadata, [
      XmpConformanceBlock.pdfA1B(),
      XmpConformanceBlock.pdfUa1(),
    ]);

    expect(xml).toContain('xmlns:pdfaid=');
    expect(xml).toContain('xmlns:pdfuaid=');
    expect(xml).toContain('<pdfaid:part>1</pdfaid:part>');
    expect(xml).toContain('<pdfaid:conformance>B</pdfaid:conformance>');
    expect(xml).toContain('<pdfuaid:part>1</pdfuaid:part>');
  });
});
