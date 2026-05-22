import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { Heading } from '../src/Elements/Text/Heading';
import { TextBlock } from '../src/Elements/Text/TextBlock';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { pdfToText } from './helpers/test-base';

/**
 * implicit tagging tests. Asserts that existing elements
 * (Heading, TextBlock) automatically emit structure elements and
 * marked-content sequences when the document opts into
 * AccessibilityMode.PdfUa1. Mirrors the .NET ImplicitTaggingTests.
 */
describe('Implicit tagging', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('Heading and TextBlocks generate H and P struct elems', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';

    const h = new Heading('Title');
    h.tocIdentifier = 'h1';
    h.fontSize = 24;
    doc.add(h);

    const p1 = new TextBlock();
    p1.text = 'First paragraph.';
    p1.fontSize = 12;
    doc.add(p1);

    const p2 = new TextBlock();
    p2.text = 'Second paragraph.';
    p2.fontSize = 12;
    doc.add(p2);

    const text = pdfToText(doc.generateBytes());

    expect(text).toContain('/S /Document');
    expect(text).toContain('/S /H1');
    expect(text).toContain('/S /P');

    const countBdc = countSubstring(text, 'BDC');
    const countEmc = countSubstring(text, 'EMC');
    expect(countBdc).toBeGreaterThanOrEqual(3);
    expect(countEmc).toBeGreaterThanOrEqual(3);
  });

  it('Heading level maps to correct struct role', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;

    const h1 = new Heading('Top');
    h1.tocIdentifier = 'a';
    h1.level = 1;
    h1.fontSize = 24;
    doc.add(h1);

    const h2 = new Heading('Sub');
    h2.tocIdentifier = 'b';
    h2.level = 2;
    h2.fontSize = 18;
    doc.add(h2);

    const h3 = new Heading('SubSub');
    h3.tocIdentifier = 'c';
    h3.level = 3;
    h3.fontSize = 14;
    doc.add(h3);

    const text = pdfToText(doc.generateBytes());

    expect(text).toContain('/S /H1');
    expect(text).toContain('/S /H2');
    expect(text).toContain('/S /H3');
  });

  it('untagged document emits no StructElem and no marked content', () => {
    // Back-compat invariant: when accessibility is None, existing
    // elements produce the same content streams they always have.
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.None;

    const h = new Heading('Title');
    h.tocIdentifier = 'h1';
    h.fontSize = 24;
    doc.add(h);

    const p = new TextBlock();
    p.text = 'Paragraph.';
    p.fontSize = 12;
    doc.add(p);

    const text = pdfToText(doc.generateBytes());

    expect(text).not.toContain('/Type /StructElem');
    expect(text).not.toContain(' BDC');
    expect(text).not.toContain('EMC\n');
  });

  it('Heading level defaults to 1', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;

    const h = new Heading('No level set');
    h.tocIdentifier = 'x';
    h.fontSize = 24;
    doc.add(h);

    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/S /H1');
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
