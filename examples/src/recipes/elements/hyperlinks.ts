import { Document, Heading, TextBlock, Hyperlink, StandardFonts } from '@bonniepdf/core';

/**
 * Hyperlinks - basic, styled (colour / size / weight), and margined links -
 * authored through the options-object front door. PDF/A-2a + PDF/UA-1.
 *
 * Each link is `new Hyperlink(text, uri, { … })`: the text and target stay
 * positional, everything visual (colour token, size, weight, margin) goes in the
 * options object.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-700' },
      defaultZoom: 'fit-page',
      displayDocTitle: true,
    },
    metadata: {
      title: 'Hyperlink Examples',
      author: 'BonniePDF',
      subject: 'Demonstrating hyperlink support in PDFs',
    },
  });

  // ── Title ──
  // A real Heading (H1), not a big TextBlock: PDF/UA preflight requires the
  // outline to start at H1, and headings give AT users document structure.
  doc.add(
    new Heading('Hyperlink Support Demo', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      textColor: 'slate-800',
      margin: { bottom: 12 },
    })
  );

  // ── Basic links ──
  doc.add(sectionLabel('Basic Links', 8));

  for (const [text, uri, mb] of [
    ['Visit GitHub', 'https://github.com', 8],
    ['Visit Microsoft', 'https://microsoft.com', 8],
    ['Search on Google', 'https://google.com', 16],
  ] as [string, string, number][]) {
    // TS constructor: Hyperlink(text, uri, options) - note .NET swaps text/uri.
    doc.add(new Hyperlink(text, uri, { margin: { bottom: mb } }));
  }

  // ── Styled links ──
  doc.add(sectionLabel('Styled Links', 8));

  // Default blue
  doc.add(new Hyperlink('Default Blue Link', 'https://github.com', { margin: { bottom: 8 } }));

  // Green
  doc.add(new Hyperlink('Green Link', 'https://microsoft.com', { textColor: 'green-500', margin: { bottom: 8 } }));

  // Large purple
  doc.add(
    new Hyperlink('Large Purple Link', 'https://google.com', {
      fontSize: 16,
      textColor: 'purple-500',
      margin: { bottom: 8 },
    })
  );

  // Bold red
  doc.add(
    new Hyperlink('Bold Red Link', 'https://stackoverflow.com', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 14,
      textColor: '#ff0000',
      margin: { bottom: 16 },
    })
  );

  // ── Links with margins ──
  doc.add(sectionLabel('Links with Margins'));

  doc.add(new TextBlock('Text before link.', { fontSize: 10 }));

  doc.add(new Hyperlink('Link with 20pt vertical margins', 'https://github.com', { margin: { top: 20, bottom: 20 } }));

  doc.add(new TextBlock('Text after link.', { fontSize: 10 }));

  return doc;
}

/** A level-2 section label with the shared style used across this example. */
function sectionLabel(text: string, marginBottom?: number): Heading {
  return new Heading(text, {
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 14,
    textColor: 'slate-700',
    margin: marginBottom === undefined ? undefined : { bottom: marginBottom },
  });
}
