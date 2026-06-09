import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfVersion,
  PdfAConformance,
  AccessibilityMode,
  TextBlock,
  Heading,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

/**
 * PDF/A-2a + PDF/UA-1 - the recommended modern baseline.
 *
 * PDF/A-2a is the strongest of the "basic + accessible" archival levels:
 *
 *   • PDF/A-2  → modern PDF 1.7 visual fidelity (transparency, JPEG2000,
 *     OpenType font embedding allowed).
 *   • "a"      → tagged structure (presupposes PDF/UA-1).
 *
 * Setting `conformance` auto-upgrades `version` to PDF 1.7 and emits the
 * `pdfaid:part 2 / pdfaid:conformance A` XMP claim, the sRGB ICC profile,
 * the `/OutputIntents` entry, and the `pdfaExtension:schemas` declaration
 * for the `pdfuaid` namespace (PDF/A-2 §6.6.2.3.1). The "a" level requires
 * `accessibility = AccessibilityMode.PdfUa1` - the document throws at save
 * time otherwise.
 *
 * Verified against veraPDF profile `2a`.
 */
export function generate(): Document {
  const doc = new Document();

  doc.metadata = new DocumentMetadata();
  doc.metadata.title = 'PDF/A-2a Compliant Document';
  doc.metadata.author = 'BonniePDF';
  doc.metadata.subject = 'A minimal PDF/A-2a + PDF/UA-1 document - archival and accessible.';
  doc.metadata.keywords = 'pdf, pdf/a-2a, pdf/ua, accessibility, archival, BonniePDF';

  doc.settings = new DocumentSettings();
  // Conformance is the source of truth. PdfA2a auto-upgrades version
  // to PDF 1.7 and triggers all the PDF/A emission machinery.
  doc.settings.conformance = PdfAConformance.PdfA2a;
  // "a" levels require PDF/UA-1 tagging.
  doc.settings.accessibility = AccessibilityMode.PdfUa1;
  // BCP-47 tag - required for PDF/UA-1.
  doc.settings.language = 'en-GB';

  const h1 = new Heading('PDF/A-2a + PDF/UA-1');
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.textColor = Color.slate800;
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock();
  intro.text =
    'This document targets PDF/A-2a - the "accessible archival" profile from ISO 19005-2. ' +
    'It is simultaneously a long-term archival file (PDF/A) and a screen-reader-friendly document (PDF/UA-1). ' +
    'Both claims are verified by veraPDF against profiles 2a and ua1 respectively.';
  intro.fontName = StandardFonts.Helvetica;
  intro.fontSize = 12;
  intro.textColor = Color.slate700;
  intro.margin = new Thickness(0, 0, 0, 12);
  doc.add(intro);

  const h2 = new Heading('Why PDF/A-2a over PDF/A-1b?');
  h2.level = 2;
  h2.fontName = StandardFonts.HelveticaBold;
  h2.fontSize = 16;
  h2.textColor = Color.slate800;
  h2.margin = new Thickness(0, 16, 0, 8);
  doc.add(h2);

  const body = new TextBlock();
  body.text =
    'PDF/A-1b (2005) is based on PDF 1.4 and disallows transparency, JPEG2000, and modern font features. ' +
    'PDF/A-2a (2011) is based on PDF 1.7, lifts those restrictions, and crucially requires the same tagged ' +
    'structure that the European Accessibility Act (EAA) calls for. For new documents authored in 2026 onward, ' +
    'PDF/A-2a is the natural target - and BonniePDF reaches it with two lines of configuration.';
  body.fontName = StandardFonts.Helvetica;
  body.fontSize = 12;
  body.textColor = Color.slate700;
  body.margin = new Thickness(0, 0, 0, 12);
  doc.add(body);

  const note = new TextBlock();
  note.text =
    'The legacy boolean `settings.pdfAEnabled = true` still works and maps to PDF/A-2b under the hood - ' +
    'the safe automatic upgrade from the historic PDF/A-1b baseline. For new code, prefer the explicit ' +
    '`settings.conformance = PdfAConformance.PdfA2a` shown above.';
  note.fontName = StandardFonts.Helvetica;
  note.fontSize = 10;
  note.textColor = Color.slate600;
  doc.add(note);

  return doc;
}
