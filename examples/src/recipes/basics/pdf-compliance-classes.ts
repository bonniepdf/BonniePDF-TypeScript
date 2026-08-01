import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfAConformance,
  AccessibilityMode,
  TextBlock,
  Heading,
  ColorPalette,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `pdf-compliance.ts`.
 *
 * Same PDF/A-2a + PDF/UA-1 document, authored the long way: `new` the settings
 * and metadata objects and assign each property, using the enum values
 * (`PdfAConformance.PdfA2a`, `AccessibilityMode.PdfUa1`) and value objects
 * (`Thickness`, `ColorPalette`) directly. This is the escape hatch the
 * options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `pdf-compliance.ts` (an equivalence test binds the two). Reach for the
 * options form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const doc = new Document();

  doc.metadata = new DocumentMetadata();
  doc.metadata.title = 'PDF/A-2a Compliant Document';
  doc.metadata.author = 'BonniePDF';
  doc.metadata.subject = 'A minimal PDF/A-2a + PDF/UA-1 document - archival and accessible.';
  doc.metadata.keywords = 'pdf, pdf/a-2a, pdf/ua, accessibility, archival, BonniePDF';

  doc.settings = new DocumentSettings();
  doc.settings.conformance = PdfAConformance.PdfA2a;
  doc.settings.accessibility = AccessibilityMode.PdfUa1;
  doc.settings.language = 'en-GB';
  // Conformance is the source of truth. PdfA2a auto-upgrades version
  // to PDF 1.7 and triggers all the PDF/A emission machinery.
  // "a" levels require PDF/UA-1 tagging.
  // BCP-47 tag - required for PDF/UA-1.

  const h1 = new Heading('PDF/A-2a + PDF/UA-1');
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const intro = new TextBlock();
  intro.text =
    'This document targets PDF/A-2a - the "accessible archival" profile from ISO 19005-2. ' +
    'It is simultaneously a long-term archival file (PDF/A) and a screen-reader-friendly document (PDF/UA-1). ' +
    'Both claims are verified by veraPDF against profiles 2a and ua1 respectively.';
  intro.fontName = StandardFonts.Helvetica;
  intro.fontSize = 12;
  intro.textColor = ColorPalette.slate[700];
  intro.margin = new Thickness(0, 0, 0, 12);
  doc.add(intro);

  const h2 = new Heading('Why PDF/A-2a over PDF/A-1b?');
  h2.level = 2;
  h2.fontName = StandardFonts.HelveticaBold;
  h2.fontSize = 16;
  h2.textColor = ColorPalette.slate[800];
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
  body.textColor = ColorPalette.slate[700];
  body.margin = new Thickness(0, 0, 0, 12);
  doc.add(body);

  const note = new TextBlock();
  note.text =
    'The legacy boolean `settings.pdfAEnabled = true` still works and maps to PDF/A-2b under the hood - ' +
    'the safe automatic upgrade from the historic PDF/A-1b baseline. For new code, prefer setting ' +
    '`settings.conformance` to the exact profile you want (here, PDF/A-2a).';
  note.fontName = StandardFonts.Helvetica;
  note.fontSize = 10;
  note.textColor = ColorPalette.slate[600];
  doc.add(note);

  return doc;
}
