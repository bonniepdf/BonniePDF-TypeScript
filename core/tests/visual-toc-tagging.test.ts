import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { Heading } from '../src/Elements/Text/Heading';
import { TextBlock } from '../src/Elements/Text/TextBlock';
import { VisualToc } from '../src/Elements/Text/VisualToc';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { SemanticRole } from '../src/Rendering/Tagging/SemanticRole';
import { StandardFonts } from '../src/Typography/StandardFonts';
import { pdfToText } from './helpers/test-base';

/**
 * VisualToc tagging. Mirror of the .NET VisualTocTaggingTests:
 * a tagged VisualToc emits a /TOC structure element (via the
 * IRoleProvider auto-wrap) containing one /TOCI per entry.
 */
describe('VisualToc tagging', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  function makeHeading(id: string, text: string, level = 1): Heading {
    const h = new Heading(text);
    h.tocIdentifier = id;
    h.level = level;
    h.fontSize = 24;
    return h;
  }

  function makeTb(text: string): TextBlock {
    const tb = new TextBlock();
    tb.text = text;
    tb.fontSize = 12;
    return tb;
  }

  function generateTocPdf(accessibility: AccessibilityMode): string {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = accessibility;
    doc.settings.language = 'en-GB';

    doc.add(makeHeading('ch1', 'Chapter 1'));
    doc.add(makeTb('Content of chapter 1.'));
    doc.add(makeHeading('ch2', 'Chapter 2'));
    doc.add(makeTb('Content of chapter 2.'));
    doc.add(makeHeading('ch3', 'Chapter 3'));
    doc.add(makeTb('Content of chapter 3.'));

    const toc = new VisualToc();
    toc.fontName = StandardFonts.Helvetica;
    toc.fontSize = 12;
    toc.headingIdentifiers.push('ch1', 'ch2', 'ch3');
    doc.add(toc);

    return pdfToText(doc.generateBytes());
  }

  it('VisualToc.semanticRole === TOC', () => {
    expect(new VisualToc().semanticRole).toBe(SemanticRole.TOC);
  });

  it('tagged document with a VisualToc emits /S /TOC and /S /TOCI', () => {
    const text = generateTocPdf(AccessibilityMode.PdfUa1);
    expect(text).toContain('/S /TOC');
    expect(text).toContain('/S /TOCI');
  });

  it('TOCI count matches heading count', () => {
    const text = generateTocPdf(AccessibilityMode.PdfUa1);
    expect(countSubstring(text, '/S /TOCI')).toBe(3);
  });

  it('untagged VisualToc emits no TOC struct elems', () => {
    const text = generateTocPdf(AccessibilityMode.None);
    expect(text).not.toContain('/S /TOC');
    expect(text).not.toContain('/S /TOCI');
  });

  it('tagged VisualToc pages stay BDC/EMC-balanced', () => {
    const text = generateTocPdf(AccessibilityMode.PdfUa1);
    const streams = splitPageContentStreams(text);
    expect(streams.length).toBeGreaterThanOrEqual(1);
    for (const s of streams) {
      const bdc = countSubstring(s, 'BDC');
      const emc = countSubstring(s, 'EMC');
      expect(bdc).toBe(emc);
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
    if (content.includes('BT') && content.includes('ET')) result.push(content);
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
