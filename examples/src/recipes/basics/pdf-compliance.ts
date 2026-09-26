import { Document, Heading, Line, StandardFonts, TextBlock, UnorderedList } from '@bonniepdf/core';

/**
 * A concise PDF/A-2a + PDF/UA-1 example.
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
    },
    metadata: {
      title: 'Archival and Accessible PDF with BonniePDF',
      author: 'BonniePDF',
      subject: 'A concise PDF/A-2a and PDF/UA-1 example.',
      keywords: 'pdf/a-2a, pdf/ua-1, accessibility, archival, BonniePDF',
    },
  });

  doc.add(
    new Heading('Archival and accessible PDF', {
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      textColor: 'slate-900',
      margin: { bottom: 8 },
    })
  );
  doc.add(
    new TextBlock(
      'BonniePDF treats archival conformance and accessibility as separate settings, so a document can use either standard or combine both.',
      { fontSize: 11, textColor: 'slate-600', margin: { bottom: 12 } }
    )
  );
  doc.add(new Line({ thickness: 2, color: 'blue-600', margin: { bottom: 14 } }));

  doc.add(
    new Heading('Settings used by this document', {
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 15,
      textColor: 'slate-800',
      margin: { bottom: 5 },
    })
  );
  doc.add(
    new UnorderedList({
      items: [
        'conformance: pdf/a-2a - requests modern PDF/A archival output.',
        'accessibility: pdf/ua-1 - emits tagged structure for assistive technology.',
        'language: en-GB - declares the document language for screen readers.',
      ],
      fontSize: 10,
      textColor: 'slate-700',
      bulletColor: 'blue-600',
      itemSpacing: 5,
      margin: { bottom: 14 },
    })
  );

  doc.add(
    new Heading('Responsibilities', {
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 15,
      textColor: 'slate-800',
      margin: { bottom: 5 },
    })
  );
  doc.add(
    new TextBlock(
      'BonniePDF handles the PDF version, conformance metadata, colour profiles, embedded standard-font substitutes, semantic tags, setting validation, and resource checks that keep the conformance claim accurate.',
      { fontSize: 10, textColor: 'slate-700', margin: { bottom: 8 } }
    )
  );
  doc.add(
    new TextBlock(
      'The author supplies the required profile, title and language, logical reading order, alt text and table headers, and validates the final PDF against the required external profile.',
      { fontSize: 10, textColor: 'slate-700', margin: { bottom: 16 } }
    )
  );

  doc.add(new Line({ color: 'slate-300', margin: { bottom: 10 } }));
  doc.add(
    new TextBlock(
      'Legacy compatibility: pdfAEnabled reads true for any PDF/A profile. Assigning true selects PdfA2b; assigning false selects None. New code should use conformance.',
      { fontName: StandardFonts.HelveticaOblique, fontSize: 9, textColor: 'slate-500' }
    )
  );

  return doc;
}
