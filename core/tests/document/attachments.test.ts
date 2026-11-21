import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AttachmentRelationship } from '../../src/Attachments/AttachmentRelationship';
import { allowsEmbeddedFiles } from '../../src/Attachments/AttachmentRules';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
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
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA4)).toBe(false);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA4f)).toBe(true);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA1b)).toBe(false);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA1a)).toBe(false);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA2b)).toBe(false);
    expect(allowsEmbeddedFiles(PdfAConformance.PdfA2a)).toBe(false);
  });

  // Mirrors the shared fixture honest-claim/attachments (04 §10.1-10.3).
  type GuardCase = {
    conformance: PdfAConformance;
    accessibility?: AccessibilityMode;
    attachment?: 'none' | 'no-media-type' | 'described';
    embedded: boolean;
    part: string | null;
    level: string | null;
    subtype: string | null;
    desc?: string;
    warnings: number;
    warning?: string;
  };
  const C = PdfAConformance;
  const guardCases: Array<[string, GuardCase]> = [
    ['none', { conformance: C.None, embedded: true, part: null, level: null, subtype: '/text#2Fxml', warnings: 0 }],
    ['pdfa1b', { conformance: C.PdfA1b, embedded: false, part: '1', level: 'B', subtype: null, warnings: 1 }],
    ['pdfa2b', { conformance: C.PdfA2b, embedded: false, part: '2', level: 'B', subtype: null, warnings: 1 }],
    ['pdfa3b', { conformance: C.PdfA3b, embedded: true, part: '3', level: 'B', subtype: '/text#2Fxml', warnings: 0 }],
    ['pdfa4', { conformance: C.PdfA4, embedded: false, part: '4', level: null, subtype: null, warnings: 1 }],
    [
      'pdfa4-with-ua2',
      {
        conformance: C.PdfA4,
        accessibility: AccessibilityMode.PdfUa2,
        embedded: false,
        part: '4',
        level: null,
        subtype: null,
        warnings: 1,
      },
    ],
    ['pdfa4f', { conformance: C.PdfA4f, embedded: true, part: '4', level: 'F', subtype: '/text#2Fxml', warnings: 0 }],
    [
      'pdfa4f-with-ua2',
      {
        conformance: C.PdfA4f,
        accessibility: AccessibilityMode.PdfUa2,
        embedded: true,
        part: '4',
        level: 'F',
        subtype: '/text#2Fxml',
        desc: 'data.xml',
        warnings: 1,
        warning:
          "Attachment 'data.xml' has no description; PDF/UA-2 requires one, so its file name was used. " +
          'Give it a description that tells readers what the file contains.',
      },
    ],
    [
      'pdfa4f-with-ua2-described',
      {
        conformance: C.PdfA4f,
        accessibility: AccessibilityMode.PdfUa2,
        attachment: 'described',
        embedded: true,
        part: '4',
        level: 'F',
        subtype: '/text#2Fxml',
        desc: 'Meter readings',
        warnings: 0,
      },
    ],
    [
      'none-no-media-type',
      {
        conformance: C.None,
        attachment: 'no-media-type',
        embedded: true,
        part: null,
        level: null,
        subtype: null,
        warnings: 0,
      },
    ],
    [
      'pdfa3b-no-media-type',
      {
        conformance: C.PdfA3b,
        attachment: 'no-media-type',
        embedded: true,
        part: '3',
        level: 'B',
        subtype: '/application#2Foctet-stream',
        warnings: 0,
      },
    ],
    [
      'pdfa4f-no-media-type',
      {
        conformance: C.PdfA4f,
        attachment: 'no-media-type',
        embedded: true,
        part: '4',
        level: 'F',
        subtype: '/application#2Foctet-stream',
        warnings: 0,
      },
    ],
  ];

  function guardDocument(c: Pick<GuardCase, 'conformance' | 'accessibility' | 'attachment'>): Document {
    const d = new Document();
    d.settings.conformance = c.conformance;
    d.settings.accessibility = c.accessibility ?? AccessibilityMode.None;
    d.add(new TextBlock('Attachment guard'));
    if (c.attachment !== 'none') {
      d.attach({
        fileName: 'data.xml',
        content: new TextEncoder().encode('<a/>'),
        relationship: AttachmentRelationship.Data,
        ...(c.attachment === 'no-media-type' ? {} : { mediaType: 'text/xml' }),
        ...(c.attachment === 'described' ? { description: 'Meter readings' } : {}),
      });
    }
    return d;
  }

  const xmp = (pdf: string, property: string): string | null =>
    new RegExp(`<pdfaid:${property}[^>]*>([^<]*)</pdfaid:${property}>`).exec(pdf)?.[1] ?? null;

  /** The /Subtype of the embedded-file stream's dictionary, or null. */
  function embeddedFileSubtype(pdf: string): string | null {
    const start = pdf.indexOf('/Type /EmbeddedFile');
    if (start < 0) return null;
    const dict = pdf.slice(start, pdf.indexOf('endstream', start));
    return /\/Subtype (\/[\w#.+-]+)/.exec(dict)?.[1] ?? null;
  }

  it.each(guardCases)('applies the conformance guard: %s', (_name, c) => {
    doc = guardDocument(c);
    const out = pdfToText(doc.generateBytes());
    for (const marker of ['/Type /EmbeddedFile', '/EmbeddedFiles', '/AF '])
      expect(out.includes(marker)).toBe(c.embedded);
    expect(xmp(out, 'part')).toBe(c.part);
    expect(xmp(out, 'conformance')).toBe(c.level);
    expect(embeddedFileSubtype(out)).toBe(c.subtype);
    expect(/\/Type \/Filespec[\s\S]*?\/Desc \(([^)]*)\)/.exec(out)?.[1] ?? null).toBe(c.desc ?? null);
    const warnings = doc.diagnostics.filter(d => d.category === 'attachment');
    expect(warnings).toHaveLength(c.warnings);
    if (c.warning) {
      expect(warnings[0]).toMatchObject({ severity: 'warning', message: c.warning, source: 'data.xml' });
    }
  });

  it('warns once per attachment described by its file name, in file-name order', () => {
    doc = guardDocument({ conformance: C.PdfA4f, accessibility: AccessibilityMode.PdfUa2, attachment: 'none' });
    doc.attach('b.csv', new TextEncoder().encode('1'));
    doc.attach('a.csv', new TextEncoder().encode('2'));
    doc.attach({ fileName: 'c.csv', content: new TextEncoder().encode('3'), description: 'Totals' });
    doc.attach('empty.csv', new Uint8Array(0));
    doc.generateBytes();
    expect(doc.diagnostics.filter(d => d.category === 'attachment').map(d => d.source)).toEqual(['a.csv', 'b.csv']);
  });

  it('throws for PDF/A-4f without an attachment', () => {
    doc = guardDocument({ conformance: C.PdfA4f, attachment: 'none' });
    expect(() => doc.generateBytes()).toThrow(/^PdfA4f requires at least one attachment\./);
  });

  it('throws for PDF/A-4f whose only attachment is empty', () => {
    doc = guardDocument({ conformance: C.PdfA4f, attachment: 'none' });
    doc.attach('empty.bin', new Uint8Array(0));
    expect(() => doc.generateBytes()).toThrow(/PdfA4f requires at least one attachment/);
  });

  it('ignores empty attachments', () => {
    doc = new Document();
    doc.add(new TextBlock('hello'));
    doc.attach('empty.bin', new Uint8Array(0));

    const out = pdfToText(doc.generateBytes());
    expect(out).not.toContain('/Type /EmbeddedFile');
  });
});
