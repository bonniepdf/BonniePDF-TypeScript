import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  Heading,
  QRCode,
  Color,
  Thickness,
  StandardFonts,
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * this feature stage-0 closeout example. PDF/UA-1 tagged variant of
 * simple-document - same shape as the .NET SimpleDocumentTaggedExample.
 *
 * Acceptance: byte-level structural assertions in
 * `core/tests/tagged-simple-document.test.ts`. The same generated
 * PDF can be fed to the .NET BonniePDF.Validation tool to verify
 * against VeraPDF profile `ua1` (Q-V2 resolved as ".NET tool
 * validates PDFs from either repo").
 */
export function generate(): Document {
  const doc = new Document();

  doc.metadata = new DocumentMetadata();
  doc.metadata.title = 'Simple Document - Tagged (PDF/UA-1)';
  doc.metadata.author = 'BonniePDF';
  doc.metadata.subject = 'this feature stage-0 closeout: a screen-reader-friendly tagged PDF.';
  doc.metadata.keywords = 'pdf, pdf/ua, accessibility, tagged, BonniePDF';

  doc.settings = new DocumentSettings();
  doc.settings.conformance = PdfAConformance.PdfA2a;
  doc.settings.accessibility = AccessibilityMode.PdfUa1;
  doc.settings.language = 'en-GB';

  const h1 = new Heading('Accessible PDF Demo');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.textColor = Color.slate800;
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const p1 = new TextBlock();
  p1.text =
    'This document opts into PDF/UA-1 tagging by setting Settings.Accessibility = AccessibilityMode.PdfUa1. ' +
    'The writer emits a structure tree, marked-content operators around every visible text run, ' +
    'and an XMP packet declaring pdfuaid:part 1.';
  p1.fontName = StandardFonts.Helvetica;
  p1.fontSize = 12;
  p1.textColor = Color.slate700;
  p1.margin = new Thickness(0, 0, 0, 8);
  doc.add(p1);

  const p2 = new TextBlock();
  p2.text =
    'Existing elements (Heading, TextBlock, Image, QRCode) tag themselves automatically - no semantic ' +
    'verbs required. Authors who want explicit control over the structure tree can use the Semantic* ' +
    'extensions that arrive in stage 2.';
  p2.fontName = StandardFonts.Helvetica;
  p2.fontSize = 12;
  p2.textColor = Color.slate700;
  p2.margin = new Thickness(0, 0, 0, 12);
  doc.add(p2);

  const h2 = new Heading('Scan to verify');
  h2.tocIdentifier = 'qr';
  h2.level = 2;
  h2.fontName = StandardFonts.HelveticaBold;
  h2.fontSize = 16;
  h2.textColor = Color.slate800;
  h2.margin = new Thickness(0, 0, 0, 8);
  doc.add(h2);

  const qr = new QRCode();
  qr.data = 'https://github.com/bonniepdf/BonniePDF-TypeScript';
  qr.size = 100;
  qr.altText = 'QR code linking to the BonniePDF GitHub repository';
  doc.add(qr);

  return doc;
}
