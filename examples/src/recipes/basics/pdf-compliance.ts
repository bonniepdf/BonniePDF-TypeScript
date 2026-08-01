import { Document, Heading, TextBlock, StandardFonts } from '@bonniepdf/core';

/**
 * PDF/A-2a + PDF/UA-1 - the recommended modern baseline.
 *
 * PDF/A-2a is the strongest of the "basic + accessible" archival levels:
 *
 *   • PDF/A-2  → modern PDF 1.7 visual fidelity (transparency, JPEG2000,
 *     OpenType font embedding allowed).
 *   • "a"      → tagged structure (presupposes PDF/UA-1).
 *
 * Setting `conformance: 'pdf/a-2a'` auto-upgrades `version` to PDF 1.7 and
 * emits the `pdfaid:part 2 / pdfaid:conformance A` XMP claim, the sRGB ICC
 * profile, the `/OutputIntents` entry, and the `pdfaExtension:schemas`
 * declaration for the `pdfuaid` namespace (PDF/A-2 §6.6.2.3.1). The "a" level
 * requires `accessibility: 'pdf/ua-1'` - the document throws at save time
 * otherwise.
 *
 * Conformance and accessibility are the only two knobs that matter here; both
 * are set as forgiving token strings on `settings`. Verified against veraPDF
 * profile `2a`.
 */
export function generate(): Document {
  const HEADING = StandardFonts.HelveticaBold;
  const BODY = StandardFonts.Helvetica;

  const doc = new Document({
    settings: {
      // Conformance is the source of truth: 'pdf/a-2a' auto-upgrades the PDF
      // version and triggers all the PDF/A machinery; the "a" level requires
      // PDF/UA-1 tagging; language is a BCP-47 tag, required for PDF/UA-1.
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
    },
    metadata: {
      title: 'PDF/A-2a Compliant Document',
      author: 'BonniePDF',
      subject: 'A minimal PDF/A-2a + PDF/UA-1 document - archival and accessible.',
      keywords: 'pdf, pdf/a-2a, pdf/ua, accessibility, archival, BonniePDF',
    },
  });

  doc.add(
    new Heading('PDF/A-2a + PDF/UA-1', {
      level: 1,
      fontName: HEADING,
      fontSize: 24,
      textColor: 'slate-800',
      margin: { bottom: 12 },
    })
  );

  doc.add(
    new TextBlock(
      'This document targets PDF/A-2a - the "accessible archival" profile from ISO 19005-2. ' +
        'It is simultaneously a long-term archival file (PDF/A) and a screen-reader-friendly document (PDF/UA-1). ' +
        'Both claims are verified by veraPDF against profiles 2a and ua1 respectively.',
      { fontName: BODY, fontSize: 12, textColor: 'slate-700', margin: { bottom: 12 } }
    )
  );

  doc.add(
    new Heading('Why PDF/A-2a over PDF/A-1b?', {
      level: 2,
      fontName: HEADING,
      fontSize: 16,
      textColor: 'slate-800',
      margin: { top: 16, bottom: 8 },
    })
  );

  doc.add(
    new TextBlock(
      'PDF/A-1b (2005) is based on PDF 1.4 and disallows transparency, JPEG2000, and modern font features. ' +
        'PDF/A-2a (2011) is based on PDF 1.7, lifts those restrictions, and crucially requires the same tagged ' +
        'structure that the European Accessibility Act (EAA) calls for. For new documents authored in 2026 onward, ' +
        'PDF/A-2a is the natural target - and BonniePDF reaches it with two lines of configuration.',
      { fontName: BODY, fontSize: 12, textColor: 'slate-700', margin: { bottom: 12 } }
    )
  );

  doc.add(
    new TextBlock(
      'The legacy boolean `settings.pdfAEnabled = true` still works and maps to PDF/A-2b under the hood - ' +
        'the safe automatic upgrade from the historic PDF/A-1b baseline. For new code, prefer setting ' +
        '`settings.conformance` to the exact profile you want (here, PDF/A-2a).',
      { fontName: BODY, fontSize: 10, textColor: 'slate-600' }
    )
  );

  return doc;
}
