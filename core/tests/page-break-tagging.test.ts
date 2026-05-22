import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { TextBlock } from '../src/Elements/Text/TextBlock';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { StructureTreeBuilder } from '../src/Rendering/Tagging/StructureTreeBuilder';
import { TaggingContext } from '../src/Rendering/Tagging/TaggingContext';
import { pdfToText } from './helpers/test-base';

/**
 * page-break-aware tagging tests. Mirrors the .NET
 * PageBreakTaggingTests.
 */
describe('Page-break-aware tagging', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('TaggingContext.snapshotOpenRolesBottomUp returns bottom-up', () => {
    const ctx = new TaggingContext(new StructureTreeBuilder());
    ctx.pushOpenRole('Sect');
    ctx.pushOpenRole('P');

    expect(ctx.snapshotOpenRolesBottomUp()).toEqual(['Sect', 'P']);
  });

  it('newPage closes marked-content on outgoing page and reopens on new page', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';

    // Lots of text to force a page break.
    const lines: string[] = [];
    for (let i = 0; i < 200; i++) {
      lines.push(`This is line ${i} of a long block of text that should span multiple pages. `);
    }
    const tb = new TextBlock();
    tb.text = lines.join('');
    tb.fontSize = 12;
    doc.add(tb);

    const text = pdfToText(doc.generateBytes());
    const streams = splitPageContentStreams(text);
    expect(streams.length).toBeGreaterThanOrEqual(2);
    for (const s of streams) {
      const bdc = countSubstring(s, 'BDC');
      const emc = countSubstring(s, 'EMC');
      expect(bdc).toBe(emc);
    }
  });

  it('no open marked content => page break does nothing', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;

    const tb = new TextBlock();
    tb.text = 'short';
    tb.fontSize = 12;
    doc.add(tb);

    const text = pdfToText(doc.generateBytes());
    const streams = splitPageContentStreams(text);
    expect(streams).toHaveLength(1);
  });

  it('untagged document: page break behaves as before', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.None;

    const lines: string[] = [];
    for (let i = 0; i < 200; i++) lines.push(`Line ${i}. `);
    const tb = new TextBlock();
    tb.text = lines.join('');
    tb.fontSize = 12;
    doc.add(tb);

    const text = pdfToText(doc.generateBytes());
    expect(text).not.toContain(' BDC\n');
    expect(text).not.toContain('EMC\n');
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
