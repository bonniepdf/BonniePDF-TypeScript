import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { RichText } from '../../src/Elements/Text/RichText';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { Container } from '../../src/Elements/Layout/Container';
import { Hyperlink } from '../../src/Core/Hyperlink';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { pdfToText } from '../helpers/test-base';

/**
 * PDF/UA rule 7.1: every mark-producing operator must sit inside a BDC/BMC
 * marked-content scope (real content) or an /Artifact region. Layout containers
 * that render children themselves (HorizontalStack, Container) and self-drawing
 * elements (RichText, Hyperlink) used to emit text outside any scope; these
 * guard against that regressing. Mirrors the local veraPDF 7.1-3 check.
 */
describe('PDF/UA 7.1 - no untagged text in tagged documents', () => {
  let doc: Document;
  afterEach(() => doc?.dispose());

  /** Counts text-show operators emitted while not inside a BDC/BMC scope. */
  function untaggedTextShows(pdf: string): number {
    const cleaned = pdf.replace(/\((?:\\.|[^\\)])*\)/g, ' ').replace(/<[0-9A-Fa-f\s]*>/g, ' ');
    let depth = 0;
    let untagged = 0;
    for (const tok of cleaned.split(/\s+/)) {
      if (tok === 'BDC' || tok === 'BMC') depth++;
      else if (tok === 'EMC') depth = Math.max(0, depth - 1);
      else if ((tok === 'Tj' || tok === 'TJ') && depth === 0) untagged++;
    }
    return untagged;
  }

  function tagged(populate: (d: Document) => void): string {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';
    populate(doc);
    return pdfToText(doc.generateBytes());
  }

  it('tags text inside a HorizontalStack child', () => {
    const pdf = tagged(d => {
      const row = new HorizontalStack();
      row.add(new TextBlock('Left column text'));
      row.add(new TextBlock('Right column text'));
      d.add(row);
    });
    expect(untaggedTextShows(pdf)).toBe(0);
  });

  it('tags text nested in a Container inside a HorizontalStack', () => {
    const pdf = tagged(d => {
      const row = new HorizontalStack();
      const cell = new Container();
      cell.child = new TextBlock('Boxed text');
      row.add(cell);
      d.add(row);
    });
    expect(untaggedTextShows(pdf)).toBe(0);
  });

  it('tags RichText as a paragraph', () => {
    const pdf = tagged(d => {
      const rt = new RichText();
      rt.span('Bold then ');
      rt.span('normal text that flows across the line.');
      d.add(rt);
    });
    expect(pdf).toContain('/P');
    expect(untaggedTextShows(pdf)).toBe(0);
  });

  it('tags hyperlink text inside its /Link scope', () => {
    const pdf = tagged(d => {
      d.add(new Hyperlink('Visit example', 'https://example.com'));
    });
    expect(pdf).toContain('/Link');
    expect(untaggedTextShows(pdf)).toBe(0);
  });

  /** Counts structure (non-/Artifact) scopes opened inside an /Artifact region. */
  function structureInsideArtifact(pdf: string): number {
    const cleaned = pdf.replace(/\((?:\\.|[^\\)])*\)/g, ' ').replace(/<[0-9A-Fa-f\s]*>/g, ' ');
    const artifactStack: boolean[] = [];
    let operands: string[] = [];
    let bad = 0;
    for (const tok of cleaned.split(/\s+/)) {
      if (tok.startsWith('/')) {
        operands.push(tok);
        continue;
      }
      if (tok === '<<' || tok === '>>' || tok === '[' || tok === ']' || tok === '') continue;
      if (/^[-+]?[\d.]+$/.test(tok)) continue; // numeric operand, such as an MCID's value
      if (tok === 'BDC' || tok === 'BMC') {
        // Tagged content is marked content with an MCID. A span that only
        // carries ActualText for an embedded font's glyphs is not tagged.
        const isArtifact = operands[0] === '/Artifact';
        const isTagged = operands.includes('/MCID');
        if (isTagged && artifactStack.some(a => a)) bad++;
        artifactStack.push(isArtifact);
      } else if (tok === 'EMC') {
        artifactStack.pop();
      }
      operands = [];
    }
    return bad;
  }

  it('does not tag structure content inside an artifact header (PDF/UA 7.1-2)', () => {
    const pdf = tagged(d => {
      // A header is decorative chrome (wrapped in /Artifact). Its child content
      // must stay artifact content, not get its own /P structure scope.
      d.settings.headerTemplate = () => {
        const stack = new HorizontalStack();
        stack.add(new TextBlock('Confidential'));
        return stack;
      };
      d.add(new TextBlock('Body paragraph.'));
    });
    expect(structureInsideArtifact(pdf)).toBe(0);
    expect(untaggedTextShows(pdf)).toBe(0);
  });
});
