import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { Hyperlink } from '../src/Core/Hyperlink';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { SemanticRole } from '../src/Rendering/Tagging/SemanticRole';
import { StandardFonts } from '../src/Typography/StandardFonts';
import { pdfToText } from './helpers/test-base';

/**
 * hyperlink tagging. Mirror of the .NET HyperlinkTaggingTests.
 * Standalone Hyperlink elements produce a /Link structure element, and
 * the link annotation carries /Contents (link text) per PDF/UA rule
 * 7-18. Annotation reachability via /OBJR + /StructParent is deferred
 * to a stage-1 follow-up.
 */
describe('Hyperlink tagging', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  function generateTagged(populate: (d: Document) => void): string {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';
    populate(doc);
    return pdfToText(doc.generateBytes());
  }

  function makeLink(uri: string, text: string): Hyperlink {
    const link = new Hyperlink(text, uri);
    link.fontName = StandardFonts.Helvetica;
    link.fontSize = 12;
    return link;
  }

  it('Hyperlink.semanticRole === Link', () => {
    const link = makeLink('https://example.com', 'Example');
    expect(link.semanticRole).toBe(SemanticRole.Link);
  });

  it('tagged document with a hyperlink emits /S /Link', () => {
    const text = generateTagged(d => d.add(makeLink('https://example.com', 'Visit')));
    expect(text).toContain('/S /Link');
  });

  it('link annotation carries /Contents matching the visible text', () => {
    const text = generateTagged(d => d.add(makeLink('https://example.com', 'Visit Example')));
    expect(text).toContain('/Subtype /Link');
    expect(text).toContain('/Contents (Visit Example)');
  });

  it('link text with parentheses is PDF-escaped in /Contents', () => {
    const text = generateTagged(d => d.add(makeLink('https://example.com', 'Click here (now)')));
    expect(text).toContain('/Contents (Click here \\(now\\))');
  });

  it('untagged document still emits /Contents but no /S /Link', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.None;
    doc.add(makeLink('https://example.com', 'x'));

    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/Contents (x)');
    expect(text).not.toContain('/S /Link');
  });

  it('every page stream stays BDC/EMC-balanced with hyperlinks', () => {
    const text = generateTagged(d => {
      d.add(makeLink('https://a.example.com', 'A'));
      d.add(makeLink('https://b.example.com', 'B'));
    });

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
