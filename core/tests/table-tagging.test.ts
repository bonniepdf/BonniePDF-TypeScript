import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { Table } from '../src/Elements/Tables/Table';
import { TableRow } from '../src/Elements/Tables/TableRow';
import { TableCell } from '../src/Elements/Tables/TableCell';
import { TextBlock } from '../src/Elements/Text/TextBlock';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { SemanticRole } from '../src/Rendering/Tagging/SemanticRole';
import { StandardFonts } from '../src/Typography/StandardFonts';
import { pdfToText } from './helpers/test-base';

/**
 * table structure tagging. Mirrors the .NET TableTaggingTests:
 * a tagged Table produces /Table > /TR > [/TH | /TD] in the structure
 * tree, and ColumnSpan surfaces as /A << /O /Table /ColSpan n >> on
 * the cell's StructElem.
 */
describe('Table tagging', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  function generateTagged(populate: (t: Table) => void, hookHeader?: (t: Table) => void): string {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';

    const table = new Table(120, 120, 120);
    hookHeader?.(table);
    populate(table);
    doc.add(table);

    return pdfToText(doc.generateBytes());
  }

  function textCell(text: string, bold = false): TableCell {
    const tc = new TableCell();
    const tb = new TextBlock();
    tb.text = text;
    if (bold) tb.fontName = StandardFonts.HelveticaBold;
    tc.content = tb;
    return tc;
  }

  function tb(text: string): TextBlock {
    const x = new TextBlock();
    x.text = text;
    return x;
  }

  // ── Role-level (property) checks ────────────────────────────────

  it('Table.semanticRole === Table', () => {
    const t = new Table(100);
    expect(t.semanticRole).toBe(SemanticRole.Table);
  });

  it('TableRow.semanticRole === TR', () => {
    const r = new TableRow();
    r.cells = [];
    expect(r.semanticRole).toBe(SemanticRole.TR);
  });

  it('TableCell.semanticRole resolves to TH when isHeader, TD otherwise', () => {
    const th = textCell('h');
    th.isHeader = true;
    const td = textCell('d');
    expect(th.semanticRole).toBe(SemanticRole.TH);
    expect(td.semanticRole).toBe(SemanticRole.TD);
  });

  // ── Byte-level (end-to-end) checks ──────────────────────────────

  it('tagged table emits Table, TR, TH, and TD struct elems', () => {
    const text = generateTagged(
      t => {
        t.addRow(tb('a'), tb('b'), tb('c'));
        t.addRow(tb('a'), tb('b'), tb('c'));
      },
      t => t.addHeaderFromCells(textCell('A', true), textCell('B', true), textCell('C', true))
    );

    expect(text).toContain('/S /Table');
    expect(text).toContain('/S /TR');
    expect(text).toContain('/S /TH');
    expect(text).toContain('/S /TD');
  });

  it('header cells => TH, body cells => TD', () => {
    const text = generateTagged(
      t => {
        t.addRow(tb('a'), tb('b'), tb('c'));
      },
      t => t.addHeaderFromCells(textCell('A', true), textCell('B', true), textCell('C', true))
    );

    // Match the trailing newline so '/S /TH' doesn't also count '/S /THead'.
    expect(countSubstring(text, '/S /TH\n')).toBe(3);
    expect(countSubstring(text, '/S /TD\n')).toBe(3);
    expect(countSubstring(text, '/S /Table\n')).toBe(1);
    expect(countSubstring(text, '/S /TR\n')).toBe(2);
    // PDF/UA 7.2: rows are grouped under THead/TBody.
    expect(countSubstring(text, '/S /THead\n')).toBe(1);
    expect(countSubstring(text, '/S /TBody\n')).toBe(1);
  });

  it('ColumnSpan surfaces as /A << /O /Table /ColSpan n >>', () => {
    const text = generateTagged(t => {
      const spanning = textCell('spans 2');
      spanning.columnSpan = 2;
      const single = textCell('single');
      // addRow accepts IElements; TableCells pass through fromElements
      // without being re-wrapped, preserving the columnSpan.
      t.addRow(spanning, single);
    });

    expect(text).toContain('/A << /O /Table /ColSpan 2 >>');
  });

  it('untagged table emits no struct elems', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.None;

    const table = new Table(100, 100);
    table.addRow(tb('x'), tb('y'));
    doc.add(table);

    const text = pdfToText(doc.generateBytes());
    expect(text).not.toContain('/S /Table');
    expect(text).not.toContain('/S /TR');
    expect(text).not.toContain('/S /TH');
    expect(text).not.toContain('/S /TD');
  });

  it('every page stream stays BDC/EMC-balanced with a big multi-page table', () => {
    const text = generateTagged(
      t => {
        for (let i = 0; i < 50; i++) {
          t.addRow(tb(`r${i}a`), tb(`r${i}b`), tb(`r${i}c`));
        }
      },
      t => t.addHeaderFromCells(textCell('A', true), textCell('B', true), textCell('C', true))
    );

    const streams = splitPageContentStreams(text);
    expect(streams.length).toBeGreaterThanOrEqual(1);
    for (const s of streams) {
      const bdc = countSubstring(s, 'BDC');
      const bmc = countSubstring(s, 'BMC');
      const emc = countSubstring(s, 'EMC');
      expect(bdc + bmc).toBe(emc);
    }
  });
});

function splitPageContentStreams(pdf: string): string[] {
  const result: string[] = [];
  let idx = 0;
  while (true) {
    const streamStart = pdf.indexOf('stream\n', idx);
    if (streamStart < 0) break;
    const contentStart = streamStart + 'stream\n'.length;
    const streamEnd = pdf.indexOf('endstream', contentStart);
    if (streamEnd < 0) break;
    const content = pdf.substring(contentStart, streamEnd);
    if (content.includes('BT') && content.includes('ET')) {
      result.push(content);
    }
    idx = streamEnd + 'endstream'.length;
  }
  return result;
}

function countSubstring(source: string, needle: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = source.indexOf(needle, idx)) >= 0) {
    count++;
    idx += needle.length;
  }
  return count;
}
