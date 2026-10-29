import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { Section } from '../../src/Elements/Text/Section';
import { SectionLink } from '../../src/Core/SectionLink';
import { PageNumberOf } from '../../src/Elements/Text/PageNumberOf';
import { Heading } from '../../src/Elements/Text/Heading';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { PageBreak } from '../../src/Elements/Layout/PageBreak';
import { documentRequiresTwoPassLayout } from '../../src/Rendering/TocLayout';
import { pdfToText } from '../helpers/test-base';

/**
 * Section / internal cross-reference primitives. A `SectionLink` and a
 * `PageNumberOf` both point at a named anchor that is declared *later* in the
 * document, so resolving them requires the two-pass layout that already backs
 * VisualToc. These tests place the reference on page 1 and the anchor on a
 * later page and assert the resolved destination + printed page number.
 */
describe('Section / SectionLink / PageNumberOf', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  /** SectionLink + PageNumberOf on page 1; a Section anchor on page 3. */
  function buildDoc(): Document {
    const d = new Document();
    d.add(new SectionLink('Jump to Chapter Three', 'ch3'));
    d.add(new PageNumberOf('ch3'));
    d.add(new PageBreak()); // -> page 2
    d.add(new TextBlock('Body of chapter one.'));
    d.add(new PageBreak()); // -> page 3
    d.add(new Section('ch3'));
    d.add(new Heading('Chapter Three'));
    return d;
  }

  it('flags a document with a SectionLink/PageNumberOf as needing two passes', () => {
    doc = buildDoc();
    expect(documentRequiresTwoPassLayout(doc)).toBe(true);

    const plain = new Document();
    plain.add(new TextBlock('No cross references here.'));
    expect(documentRequiresTwoPassLayout(plain)).toBe(false);
    plain.dispose();
  });

  it('emits a GoTo annotation from the SectionLink to the anchor page', () => {
    doc = buildDoc();
    const text = pdfToText(doc.generateBytes());
    const gotos = [...text.matchAll(/\/S \/GoTo \/D \[(\d+) 0 R \/Fit\]/g)];
    expect(gotos.length).toBe(1);
  });

  it('gives the SectionLink a non-zero clickable rectangle', () => {
    doc = buildDoc();
    const text = pdfToText(doc.generateBytes());
    const rects = [...text.matchAll(/\/Subtype \/Link[\s\S]*?\/Rect \[([^\]]+)\]/g)].map(m => m[1].trim());
    expect(rects.length).toBe(1);
    expect(rects[0]).not.toBe('0 0 0 0');
    const [x1, y1, x2, y2] = rects[0].split(/\s+/).map(Number);
    expect(x2).toBeGreaterThan(x1);
    expect(y2).toBeGreaterThan(y1);
  });

  it('prints the resolved page number for PageNumberOf (no placeholder)', () => {
    doc = buildDoc();
    const text = pdfToText(doc.generateBytes());
    // The anchor sits on page 3; the "?" placeholder must not survive.
    expect(text).not.toContain('(?)');
    expect(text).toContain('(3)');
  });

  it('lets a Heading act as an anchor via anchorId', () => {
    const d = new Document();
    d.add(new SectionLink('Go to the appendix', 'appendix'));
    d.add(new PageNumberOf('appendix'));
    d.add(new PageBreak()); // -> page 2
    const h = new Heading('Appendix A');
    h.anchorId = 'appendix';
    d.add(h);
    doc = d;

    const text = pdfToText(doc.generateBytes());
    // Appendix heading is on page 2.
    expect(text).toContain('(2)');
    const gotos = [...text.matchAll(/\/S \/GoTo \/D \[(\d+) 0 R \/Fit\]/g)];
    expect(gotos.length).toBe(1);
  });

  it('falls back to the placeholder for an unknown anchor', () => {
    const d = new Document();
    d.add(new PageNumberOf('does-not-exist'));
    doc = d;
    // A PageNumberOf still forces two-pass, but the id never resolves.
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('(?)');
  });

  it('rejects empty anchor identifiers', () => {
    expect(() => new Section('')).toThrow();
    expect(() => new SectionLink('text', '')).toThrow();
    expect(() => new PageNumberOf('')).toThrow();
  });
});
