import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { Table } from '../../src/Elements/Tables/Table';
import { TableCell } from '../../src/Elements/Tables/TableCell';
import { Hyperlink } from '../../src/Core/Hyperlink';
import { Heading } from '../../src/Elements/Text/Heading';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { VisualToc } from '../../src/Elements/Text/VisualToc';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { Thickness } from '../../src/Core/Thickness';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { pdfToText } from '../helpers/test-base';

/**
 * cross-language equivalence (TS mirror). The .NET and TS
 * implementations must produce structurally-equivalent PDF/UA
 * output. This test extracts a "canonical fingerprint" from a
 * generated PDF - a sorted map of `role → count` for every
 * StructElem - and asserts the same expectations the .NET sibling
 * (`BonniePDF.Tests/CrossLanguageEquivalenceTests.cs`) asserts on
 * the equivalent fixtures.
 *
 * If both sides pass their respective tests, structural equivalence
 * is verified. Object IDs and byte-level diffs are ignored -
 * fingerprints are derived from `/S /Role` occurrences which are
 * stable regardless of allocation order.
 */
describe('Cross-language structure-tree equivalence', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  // ── Document builders (kept locally to mirror the .NET side that
  //    re-uses Stage1CloseoutTests.Build*; same shape, no shared file). ──

  function buildBusinessInvoiceDocument(): Document {
    const d = new Document();
    d.metadata.title = 'Invoice #12345';
    d.metadata.author = 'Acme Co.';
    d.metadata.subject = 'Sample tagged invoice for stage-1 closeout.';
    d.settings.version = PdfVersion.Pdf17;
    d.settings.accessibility = AccessibilityMode.PdfUa1;
    d.settings.language = 'en-GB';

    const h = new Heading('Invoice');
    h.tocIdentifier = 'invoice';
    h.level = 1;
    h.fontName = StandardFonts.HelveticaBold;
    h.fontSize = 24;
    h.margin = new Thickness(0, 0, 0, 12);
    d.add(h);

    const intro = new TextBlock();
    intro.text = 'Customer: Wile E. Coyote. Invoice number: 12345. Date: 1 January 2026.';
    intro.fontName = StandardFonts.Helvetica;
    intro.fontSize = 12;
    intro.margin = new Thickness(0, 0, 0, 16);
    d.add(intro);

    const items = new Table(220, 80, 90, 100);
    items.addHeader([headerCell('Description'), headerCell('Qty'), headerCell('Unit price'), headerCell('Total')]);
    items.addRow(tb('Roadrunner trap'), tb('2'), tb('£25.00'), tb('£50.00'));
    items.addRow(tb('Rocket-powered skates'), tb('1'), tb('£99.00'), tb('£99.00'));
    items.addRow(tb('Anvil (assorted)'), tb('3'), tb('£14.00'), tb('£42.00'));
    d.add(items);

    const link = new Hyperlink('View invoice online', 'https://acme.example.com/invoice/12345');
    link.fontName = StandardFonts.Helvetica;
    link.fontSize = 12;
    link.margin = new Thickness(0, 24, 0, 0);
    d.add(link);

    return d;
  }

  function buildMultiPageFlowDocument(): Document {
    const d = new Document();
    d.metadata.title = 'Multi-Page Flow';
    d.settings.version = PdfVersion.Pdf17;
    d.settings.accessibility = AccessibilityMode.PdfUa1;
    d.settings.language = 'en-GB';

    const table = new Table(60, 240, 100);
    table.addHeader([headerCell('#'), headerCell('Item'), headerCell('Amount')]);
    for (let i = 1; i <= 80; i++) {
      table.addRow(
        tb(String(i)),
        tb(`Line item ${i}: description that fills the row reasonably.`),
        tb(`£${(i * 1.5).toFixed(2)}`)
      );
    }
    d.add(table);
    return d;
  }

  function buildDickensNovelDocument(): Document {
    const d = new Document();
    d.metadata.title = 'The Pickwick Papers (excerpt)';
    d.settings.version = PdfVersion.Pdf17;
    d.settings.accessibility = AccessibilityMode.PdfUa1;
    d.settings.language = 'en-GB';

    const toc = new VisualToc();
    toc.fontName = StandardFonts.Helvetica;
    toc.fontSize = 12;
    toc.margin = new Thickness(0, 0, 0, 24);
    toc.headingIdentifiers.push('ch1', 'ch2', 'ch3');
    d.add(toc);

    d.add(makeChapter('ch1', 'Chapter I'));
    d.add(para('The first ray of light which illumines the gloom...'));
    d.add(makeChapter('ch2', 'Chapter II'));
    d.add(para('That punctual servant of all work, the sun...'));
    d.add(makeChapter('ch3', 'Chapter III'));
    d.add(para('Mr. Pickwick’s apartments in Goswell Street...'));

    return d;
  }

  function tb(text: string): TextBlock {
    const x = new TextBlock();
    x.text = text;
    x.fontSize = 12;
    return x;
  }

  function headerCell(text: string): TableCell {
    const cell = new TableCell();
    const inner = new TextBlock();
    inner.text = text;
    inner.fontName = StandardFonts.HelveticaBold;
    inner.fontSize = 12;
    cell.content = inner;
    cell.isHeader = true;
    return cell;
  }

  function para(text: string): TextBlock {
    const x = new TextBlock();
    x.text = text;
    x.fontSize = 12;
    x.margin = new Thickness(0, 0, 0, 12);
    return x;
  }

  function makeChapter(id: string, heading: string): Heading {
    const h = new Heading(heading);
    h.tocIdentifier = id;
    h.level = 1;
    h.fontName = StandardFonts.HelveticaBold;
    h.fontSize = 24;
    return h;
  }

  function generate(d: Document): string {
    doc = d;
    return pdfToText(doc.generateBytes());
  }

  // ── Fingerprint extraction ───────────────────────────────────────

  const ROLES = [
    'Document',
    'Sect',
    'Art',
    'Div',
    'H',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'P',
    'L',
    'LI',
    'Lbl',
    'LBody',
    'Table',
    'THead',
    'TBody',
    'TFoot',
    'TR',
    'TH',
    'TD',
    'Span',
    'Quote',
    'Code',
    'Figure',
    'Caption',
    'Form',
    'Formula',
    'Link',
    'Reference',
    'Note',
    'Annot',
    'TOC',
    'TOCI',
    'Index',
    'BlockQuote',
    'Artifact',
  ];

  function fingerprint(pdf: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const role of ROLES) {
      let count = countSubstring(pdf, `/S /${role}`);
      // Subtract longer-role matches (e.g. "H1" inside a search for "H").
      for (const longer of ROLES) {
        if (longer.length > role.length && longer.startsWith(role)) {
          count -= countSubstring(pdf, `/S /${longer}`);
        }
      }
      if (count > 0) result[role] = count;
    }
    return result;
  }

  // ── Equivalence assertions ──────────────────────────────────────

  it('business-invoice fingerprint matches the .NET-side expectation', () => {
    const fp = fingerprint(generate(buildBusinessInvoiceDocument()));
    expect(fp).toEqual({
      Document: 1,
      H1: 1,
      P: 1,
      Table: 1,
      THead: 1, // header row group (PDF/UA 7.2)
      TBody: 1, // body row group
      TR: 4, // 1 header + 3 body
      TH: 4, // 4 header cells
      TD: 12, // 3 body rows × 4 cells
      Link: 1,
    });
  });

  it('dickens-novel fingerprint matches the .NET-side expectation', () => {
    const fp = fingerprint(generate(buildDickensNovelDocument()));
    expect(fp).toEqual({
      Document: 1,
      TOC: 1,
      TOCI: 3,
      Link: 3, // one per TOCI entry - PDF/UA 14.8.4.4.2 requires TOC links to be tagged
      H1: 3,
      P: 3,
    });
  });

  it('multi-page-flow fingerprint has the right role set + deterministic TD count', () => {
    // Exact role counts depend on Table header-repeat semantics and
    // per-page row-fit math, both of which vary with font metrics.
    // Assert the role *set* matches the .NET side, plus the TD count
    // (which is deterministic: 80 rows × 3 columns = 240).
    const fp = fingerprint(generate(buildMultiPageFlowDocument()));
    const roleSet = Object.keys(fp).sort();

    expect(roleSet).toEqual(['Document', 'TBody', 'TD', 'TH', 'THead', 'TR', 'Table']);
    expect(fp.TD).toBe(240);
    expect(fp.Document).toBe(1);
    expect(fp.Table).toBe(1);
    expect(fp.TR).toBeGreaterThanOrEqual(81);
    expect(fp.TH).toBeGreaterThanOrEqual(3);
    expect(fp.TH % 3).toBe(0);
  });
});

function countSubstring(source: string, needle: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = source.indexOf(needle, idx)) >= 0) {
    count++;
    idx += needle.length;
  }
  return count;
}
