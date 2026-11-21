import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { Heading } from '../../src/Elements/Text/Heading';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { VisualToc } from '../../src/Elements/Text/VisualToc';
import { OrderedList } from '../../src/Elements/Lists/OrderedList';
import { UnorderedList } from '../../src/Elements/Lists/UnorderedList';
import type { ListElementBase } from '../../src/Elements/Lists/ListElementBase';
import { NumberFormat } from '../../src/Elements/Lists/NumberFormat';
import { BulletStyle } from '../../src/Elements/Lists/BulletStyle';
import { Table } from '../../src/Elements/Tables/Table';
import { PageBreak } from '../../src/Elements/Layout/PageBreak';
import { Hyperlink } from '../../src/Core/Hyperlink';
import { SectionLink } from '../../src/Core/SectionLink';
import { BookmarkItem } from '../../src/Configuration/BookmarkItem';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { ZoomLevel } from '../../src/Configuration/ZoomLevel';
import { pdfToText } from '../helpers/test-base';
import { withoutRegisteredFonts } from '../helpers/bundled-fonts';

/**
 * PDF/UA-2 output (spec 04 §3.4). Mirrors the shared fixture
 * accessibility/pdf-ua-2 and the .NET PdfUa2Tests. Every document these tests
 * build passes veraPDF's ua2 profile (and 4 with PDF/A-4); that is checked
 * outside the suite.
 */

// ── The probe document (fixture input) ──────────────────────────

function configure(doc: Document): void {
  doc.settings.accessibility = AccessibilityMode.PdfUa2;
  doc.settings.language = 'en-GB';
  doc.metadata.title = 'PDF/UA-2 probe';
}

export function probe(): Document {
  const doc = new Document();
  configure(doc);
  doc.settings.bookmarks.push(new BookmarkItem('Start', 0));
  doc.settings.bookmarks.push(new BookmarkItem('Second page', 1));
  const toc = new VisualToc();
  toc.headingIdentifiers.push('Intro', 'Details');
  doc.add(toc);
  doc.add(heading('Intro'));
  doc.add(new TextBlock('Some text. ' + 'More words here. '.repeat(40)));
  const ordered = new OrderedList();
  ordered.addItem('One');
  ordered.addItem('Two');
  doc.add(ordered);
  const unordered = new UnorderedList();
  unordered.addItem('Apple');
  unordered.addItem('Pear');
  doc.add(unordered);
  const table = new Table(1, 1);
  table.addHeader('Item', 'Amount');
  table.addRow('A', '1');
  table.addRow('B', '2');
  doc.add(table);
  doc.add(new SectionLink('Go to details', 'Details'));
  doc.add(new Hyperlink('External', 'https://example.com'));
  doc.add(new PageBreak());
  doc.add(heading('Details'));
  doc.add(new TextBlock('Second page text.'));
  return doc;
}

function heading(text: string): Heading {
  const h = new Heading(text);
  h.tocIdentifier = text;
  h.level = 1;
  return h;
}

// ── Reading the output ──────────────────────────────────────────

function generate(doc: Document): string {
  try {
    return pdfToText(doc.generateBytes());
  } finally {
    doc.dispose();
  }
}

/** The value of an XMP property; each element declares its own namespace. */
function xmp(pdf: string, property: string): string {
  return new RegExp(`<${property}[^>]*>([^<]*)</${property}>`).exec(pdf)?.[1] ?? '';
}

function objects(doc: Document): Map<number, string> {
  const pdf = generate(doc);
  const map = new Map<number, string>();
  for (const m of pdf.matchAll(/(\d+) 0 obj\s*([\s\S]*?)endobj/g)) map.set(Number(m[1]), m[2]);
  return map;
}

function structElems(objs: Map<number, string>): Array<[number, string]> {
  return [...objs].filter(([, v]) => v.includes('/Type /StructElem')).sort((a, b) => a[0] - b[0]);
}

const role = (dict: string): string => /\/S \/(\w+)/.exec(dict)?.[1] ?? '';
const kids = (dict: string): string => /\/K \[([^\]]*)\]/.exec(dict)?.[1] ?? '';
const parent = (dict: string): number => Number(/\/P (\d+) 0 R/.exec(dict)?.[1]);
const refs = (array: string): number[] => [...array.matchAll(/(?<!\/Pg |\/Obj )(\d+) 0 R/g)].map(m => Number(m[1]));

function pageIds(objs: Map<number, string>): number[] {
  const pages = [...objs.values()].find(v => v.includes('/Type /Pages'))!;
  return refs(/\/Kids \[([^\]]*)\]/.exec(pages)![1]);
}

/** The probe's two headings are one per page: "Intro" on the first, "Details" on the second. */
function headingOnPage(objs: Map<number, string>, pages: number[], element: number): string {
  const pg = Number(/\/Pg (\d+) 0 R/.exec(objs.get(element)!)![1]);
  return pages.indexOf(pg) === 0 ? 'Intro' : 'Details';
}

/** [page index of /D, role of /SD's element] for a go-to action; headings carry their text. */
function goTo(objs: Map<number, string>, pages: number[], action: string): [number, string] {
  const m = /\/D \[(\d+) 0 R [^\]]*\]\s+\/SD \[(\d+) 0 R/.exec(action)!;
  const page = pages.indexOf(Number(m[1]));
  const element = Number(m[2]);
  const r = role(objs.get(element)!);
  return [page, r.startsWith('H') ? `${r}:${headingOnPage(objs, pages, element)}` : r];
}

function listNumberings(list: ListElementBase): string[] {
  const doc = new Document();
  configure(doc);
  doc.add(list);
  return structElems(objects(doc))
    .filter(([, v]) => role(v) === 'L')
    .map(([, v]) => /\/ListNumbering \/(\w+)/.exec(v)?.[1] ?? '');
}

describe('PDF/UA-2', () => {
  // ── Settings ────────────────────────────────────────────────────

  describe('settings', () => {
    it('raises the default version to PDF 2.0', () => {
      const doc = probe();
      const pdf = pdfToText(doc.generateBytes());
      expect(pdf.startsWith('%PDF-2.0')).toBe(true);
      expect(doc.settings.version).toBe(PdfVersion.Pdf20);
      doc.dispose();
    });

    it('throws on an explicit PDF 1.7', () => {
      const doc = probe();
      doc.settings.version = PdfVersion.Pdf17;
      expect(() => doc.generateBytes()).toThrow(/Pdf20[\s\S]*PdfUa1/);
      doc.dispose();
    });

    it.each([
      PdfAConformance.PdfA1b,
      PdfAConformance.PdfA1a,
      PdfAConformance.PdfA2b,
      PdfAConformance.PdfA2a,
      PdfAConformance.PdfA3b,
      PdfAConformance.PdfA3a,
    ])('throws with %s', conformance => {
      const doc = probe();
      doc.settings.conformance = conformance;
      expect(() => doc.generateBytes()).toThrow(/PdfA4[\s\S]*PdfUa1/);
      doc.dispose();
    });

    it('combines with PDF/A-4', () => {
      const doc = probe();
      doc.settings.conformance = PdfAConformance.PdfA4;
      const pdf = generate(doc);
      expect(xmp(pdf, 'pdfaid:part')).toBe('4');
      expect(xmp(pdf, 'pdfuaid:part')).toBe('2');
    });

    it('points PDF/UA-1 on PDF 2.0 to PDF/UA-2', () => {
      const doc = new Document();
      doc.settings.accessibility = AccessibilityMode.PdfUa1;
      doc.settings.version = PdfVersion.Pdf20;
      doc.add(new TextBlock('x'));
      expect(() => doc.generateBytes()).toThrow(/PdfUa2/);
      doc.dispose();
    });

    it("accepts the 'pdf/ua-2' token", () => {
      const doc = new Document();
      doc.settings.accessibility = 'pdf/ua-2';
      expect(doc.settings.accessibility).toBe(AccessibilityMode.PdfUa2);
      doc.dispose();
    });
  });

  // ── Metadata ────────────────────────────────────────────────────

  describe('metadata', () => {
    it('identifies part 2, revision 2024', () => {
      const pdf = generate(probe());
      expect(xmp(pdf, 'pdfuaid:part')).toBe('2');
      expect(xmp(pdf, 'pdfuaid:rev')).toBe('2024');
    });

    it('describes part and rev in the extension schema with PDF/A-4', () => {
      const doc = probe();
      doc.settings.conformance = PdfAConformance.PdfA4;
      const pdf = generate(doc);
      expect(pdf).toContain('>part</pdfaProperty:name>');
      expect(pdf).toContain('>rev</pdfaProperty:name>');
    });
  });

  // ── Structure ───────────────────────────────────────────────────

  describe('structure', () => {
    it('writes the PDF 2.0 namespace on every type it defines', () => {
      const objs = objects(probe());
      const [ns, nsDict] = [...objs].find(([, v]) => v.includes('/Type /Namespace'))!;
      expect(nsDict).toContain('/NS (http://iso.org/pdf2/ssn)');
      const root = [...objs.values()].find(v => v.includes('/Type /StructTreeRoot'))!;
      expect(root).toContain(`/Namespaces [ ${ns} 0 R ]`);

      const withoutNs = [
        ...new Set(
          structElems(objs)
            .filter(([, v]) => !v.includes(`/NS ${ns} 0 R`))
            .map(([, v]) => role(v))
        ),
      ].sort();
      expect(withoutNs).toEqual(['Reference', 'TOC', 'TOCI']);
      expect(structElems(objs).find(([, v]) => role(v) === 'Document')![1]).toContain(`/NS ${ns} 0 R`);
    });

    it.each([
      [NumberFormat.Decimal, 'Decimal'],
      [NumberFormat.UpperRoman, 'UpperRoman'],
      [NumberFormat.LowerRoman, 'LowerRoman'],
      [NumberFormat.UpperAlpha, 'UpperAlpha'],
      [NumberFormat.LowerAlpha, 'LowerAlpha'],
    ])('names ordered list numbering %s', (format, expected) => {
      const list = new OrderedList();
      list.numberFormat = format;
      list.addItem('One');
      expect(listNumberings(list)).toEqual([expected]);
    });

    it.each([
      [BulletStyle.Disc, 'Disc'],
      [BulletStyle.Circle, 'Circle'],
      [BulletStyle.Square, 'Square'],
      [BulletStyle.Dash, 'Unordered'],
      [BulletStyle.Custom, 'Unordered'],
    ])('names unordered list numbering %s', (style, expected) => {
      const list = new UnorderedList();
      list.bulletStyle = style;
      list.addItem('One');
      expect(listNumberings(list)).toEqual([expected]);
    });

    it('writes TOC entries as a TOCI around a Reference, referring to the heading', () => {
      const objs = objects(probe());
      const pages = pageIds(objs);
      const entries = structElems(objs).filter(([, v]) => role(v) === 'TOCI');
      expect(entries).toHaveLength(2);
      const headings = ['H1:Intro', 'H1:Details'];
      entries.forEach(([, entry], i) => {
        // Exactly one kid, a structure element: no marked content of its own.
        expect(kids(entry)).toMatch(/^\s*\d+ 0 R\s*$/);
        const reference = objs.get(refs(kids(entry))[0])!;
        expect(role(reference)).toBe('Reference');
        expect(reference).toContain('/Type /OBJR');
        const target = Number(/\/Ref \[ (\d+) 0 R \]/.exec(entry)![1]);
        expect(`${role(objs.get(target)!)}:${headingOnPage(objs, pages, target)}`).toBe(headings[i]);
      });
      const inToc = structElems(objs).filter(
        ([, v]) => role(v) === 'Link' && ['TOCI', 'Reference'].includes(role(objs.get(parent(v))!))
      );
      expect(inToc).toEqual([]);
    });
  });

  // ── Destinations ────────────────────────────────────────────────

  describe('destinations', () => {
    it('makes links, bookmarks and the opening view structure destinations', () => {
      const objs = objects(probe());
      const pages = pageIds(objs);

      // The TOC's two links, the section link, then the two bookmarks, then the opening view.
      const goTos = [...objs]
        .filter(([, v]) => v.includes('/S /GoTo'))
        .sort((a, b) => a[0] - b[0])
        .map(([, v]) => goTo(objs, pages, v));
      expect(goTos).toEqual([
        [0, 'H1:Intro'],
        [1, 'H1:Details'],
        [1, 'H1:Details'],
        [0, 'Reference'],
        [1, 'H1:Details'],
        [0, 'Reference'],
      ]);

      const catalog = [...objs.values()].find(v => v.includes('/Type /Catalog'))!;
      expect(catalog).toMatch(/\/OpenAction \d+ 0 R/);
      for (const item of [...objs.values()].filter(v => v.includes('/Title (') && v.includes('/Parent')))
        expect(item).not.toContain('/Dest');
      for (const link of [...objs.values()].filter(v => v.includes('/Subtype /Link') && !v.includes('/URI')))
        expect(link).toMatch(/\/A \d+ 0 R/);
    });

    it('targets the element continuing onto a page where none starts', () => {
      const doc = new Document();
      configure(doc);
      doc.settings.bookmarks.push(new BookmarkItem('Page two', 1));
      doc.add(new TextBlock('A sentence that keeps the paragraph going. '.repeat(200)));
      const objs = objects(doc);
      const pages = pageIds(objs);
      expect(pages).toHaveLength(2);
      const bookmarkAction = [...objs].filter(([, v]) => v.includes('/S /GoTo')).sort((a, b) => a[0] - b[0])[0][1];
      expect(goTo(objs, pages, bookmarkAction)).toEqual([1, 'P']);
    });

    it('uses the default zoom view for the opening action', () => {
      const doc = new Document();
      configure(doc);
      doc.settings.defaultZoom = ZoomLevel.FitWidth;
      doc.add(new TextBlock('x'));
      const actions = [...objects(doc).values()].filter(v => v.includes('/S /GoTo'));
      expect(actions).toHaveLength(1);
      expect(actions[0]).toMatch(/\/D \[\d+ 0 R \/FitH 0\]\s+\/SD \[\d+ 0 R \/FitH 0\]/);
    });
  });

  // ── PDF/UA-1 unchanged, honest claim, PDF 2.0 bookmarks ─────────

  describe('PDF/UA-1, honest claim and bookmarks', () => {
    it('writes none of the PDF 2.0 structure for PDF/UA-1', () => {
      const doc = probe();
      doc.settings.accessibility = AccessibilityMode.PdfUa1;
      const pdf = generate(doc);
      for (const absent of ['/Namespaces', '/NS ', '/ListNumbering', '/Ref ', '/SD', '/S /Reference', 'pdfuaid:rev'])
        expect(pdf).not.toContain(absent);
      expect(xmp(pdf, 'pdfuaid:part')).toBe('1');
    });

    it('withholds the claim and keeps the structure without fonts', () => {
      withoutRegisteredFonts(() => {
        const doc = probe();
        const pdf = pdfToText(doc.generateBytes());
        const withheld = doc.diagnostics.filter(d => d.category === 'compliance' && d.source === 'pdf/ua-2');
        expect(withheld).toHaveLength(1);
        expect(pdf).not.toContain('pdfuaid');
        for (const kept of ['%PDF-2.0', '/Namespaces', '/ListNumbering', '/SD']) expect(pdf).toContain(kept);
        doc.dispose();
      });
    });

    it('keeps bookmarks in PDF 2.0 documents', () => {
      const doc = new Document();
      doc.settings.conformance = PdfAConformance.PdfA4;
      doc.settings.bookmarks.push(new BookmarkItem('Start', 0));
      doc.add(new TextBlock('x'));
      const pdf = generate(doc);
      expect(pdf).toContain('/Type /Outlines');
      expect(pdf).toContain('/Outlines ');
    });
  });
});
