import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AttachmentRelationship } from '../../src/Attachments/AttachmentRelationship';
import { allowsEmbeddedFiles } from '../../src/Attachments/AttachmentRules';
import { pdfToText } from '../helpers/test-base';

const xml = () => new TextEncoder().encode('<invoice><total>42.00</total></invoice>');

describe('File attachments', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('embeds an attachment as an EmbeddedFile stream with a Filespec', () => {
    doc = new Document();
    doc.add(new TextBlock('hello'));
    doc.attach('invoice.xml', xml(), {
      relationship: AttachmentRelationship.Source,
      mediaType: 'text/xml',
    });

    const out = pdfToText(doc.generateBytes());
    expect(out).toContain('/Type /EmbeddedFile');
    expect(out).toContain('/Type /Filespec');
    expect(out).toContain('/AFRelationship /Source');
    // MIME slash is escaped in the /Subtype name.
    expect(out).toContain('/Subtype /text#2Fxml');
    expect(out).toContain('(invoice.xml)');
  });

  it('references the embedded files from the catalog Names tree and AF array', () => {
    doc = new Document();
    doc.add(new TextBlock('hello'));
    doc.attach('data.json', new TextEncoder().encode('{"a":1}'), {
      relationship: AttachmentRelationship.Data,
      mediaType: 'application/json',
    });

    const out = pdfToText(doc.generateBytes());
    expect(out).toContain('/EmbeddedFiles');
    expect(out).toMatch(/\/AF \[ \d+ 0 R \]/);
    expect(out).toContain('/Names [ (data.json)');
  });

  it('orders multiple attachments by file name in the name tree', () => {
    doc = new Document();
    doc.add(new TextBlock('hello'));
    doc.attach('zeta.txt', new TextEncoder().encode('z'));
    doc.attach('alpha.txt', new TextEncoder().encode('a'));

    const out = pdfToText(doc.generateBytes());
    const names = out.slice(out.indexOf('/Names [ ('));
    expect(names.indexOf('(alpha.txt)')).toBeLessThan(names.indexOf('(zeta.txt)'));
  });

  it('emits attachments under PDF/A-3b (the ZUGFeRD path)', () => {
    doc = new Document();
    doc.settings.conformance = PdfAConformance.PdfA3b;
    doc.add(new TextBlock('invoice'));
    doc.attach('factur-x.xml', xml(), {
      relationship: AttachmentRelationship.Data,
      mediaType: 'text/xml',
    });

    const out = pdfToText(doc.generateBytes());
    expect(out).toContain('/Type /EmbeddedFile');
    expect(out).toContain('/AF [');
    expect(doc.diagnostics.filter(d => d.category === 'attachment')).toHaveLength(0);
  });

  it('drops attachments under PDF/A-1b and records a diagnostic (honest claim)', () => {
    doc = new Document();
    doc.settings.conformance = PdfAConformance.PdfA1b;
    doc.add(new TextBlock('archival'));
    doc.attach('invoice.xml', xml(), { mediaType: 'text/xml' });

    const out = pdfToText(doc.generateBytes());
    expect(out).not.toContain('/Type /EmbeddedFile');
    expect(out).not.toContain('/EmbeddedFiles');
    const warnings = doc.diagnostics.filter(d => d.category === 'attachment');
    expect(warnings).toHaveLength(1);
    expect(warnings[0].severity).toBe('warning');
  });

  it('AttachmentRules matches the spec: A-3/A-4/None allow, A-1/A-2 forbid', () => {
    expect(allowsEmbeddedFiles(PdfAConformance.None)).toBe(true);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA3b)).toBe(true);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA3a)).toBe(true);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA4)).toBe(true);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA1b)).toBe(false);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA1a)).toBe(false);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA2b)).toBe(false);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA2a)).toBe(false);
  });

  it('ignores empty attachments', () => {
    doc = new Document();
    doc.add(new TextBlock('hello'));
    doc.attach('empty.bin', new Uint8Array(0));

    const out = pdfToText(doc.generateBytes());
    expect(out).not.toContain('/Type /EmbeddedFile');
  });
});
