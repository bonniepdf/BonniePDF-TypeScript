/**
 * Archival & Accessible PDF (Class API).
 * The same concise conformance example, authored by constructing and mutating every object without helper functions.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
import {
  AccessibilityMode,
  ColorPalette,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Heading,
  Line,
  PdfAConformance,
  StandardFonts,
  TextBlock,
  Thickness,
  UnorderedList,
} from '@bonniepdf/core';

/** The construct-then-mutate companion to `pdf-compliance.ts`. */
export function generate(): Document {
  const doc = new Document();
  doc.metadata = new DocumentMetadata();
  doc.metadata.title = 'Archival and Accessible PDF with BonniePDF';
  doc.metadata.author = 'BonniePDF';
  doc.metadata.subject = 'A concise PDF/A-2a and PDF/UA-1 example.';
  doc.metadata.keywords = 'pdf/a-2a, pdf/ua-1, accessibility, archival, BonniePDF';
  doc.settings = new DocumentSettings();
  doc.settings.conformance = PdfAConformance.PdfA2a;
  doc.settings.accessibility = AccessibilityMode.PdfUa1;
  doc.settings.language = 'en-GB';

  const title = new Heading('Archival and accessible PDF');
  title.level = 1;
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 24;
  title.color = ColorPalette.slate[900];
  title.margin = new Thickness(0, 0, 0, 8);
  doc.add(title);

  const intro = new TextBlock(
    'BonniePDF treats archival conformance and accessibility as separate settings, so a document can use either standard or combine both.'
  );
  intro.fontSize = 11;
  intro.color = ColorPalette.slate[600];
  intro.margin = new Thickness(0, 0, 0, 12);
  doc.add(intro);

  const accent = new Line();
  accent.thickness = 2;
  accent.color = ColorPalette.blue[600];
  accent.margin = new Thickness(0, 0, 0, 14);
  doc.add(accent);

  const settingsHeading = new Heading('Settings used by this document');
  settingsHeading.level = 2;
  settingsHeading.fontName = StandardFonts.HelveticaBold;
  settingsHeading.fontSize = 15;
  settingsHeading.color = ColorPalette.slate[800];
  settingsHeading.margin = new Thickness(0, 0, 0, 5);
  doc.add(settingsHeading);

  const settingsList = new UnorderedList();
  settingsList.addItem('conformance: pdf/a-2a - requests modern PDF/A archival output.');
  settingsList.addItem('accessibility: pdf/ua-1 - emits tagged structure for assistive technology.');
  settingsList.addItem('language: en-GB - declares the document language for screen readers.');
  settingsList.fontSize = 10;
  settingsList.color = ColorPalette.slate[700];
  settingsList.bulletColor = ColorPalette.blue[600];
  settingsList.itemSpacing = 5;
  settingsList.margin = new Thickness(0, 0, 0, 14);
  doc.add(settingsList);

  const engineHeading = new Heading('Responsibilities');
  engineHeading.level = 2;
  engineHeading.fontName = StandardFonts.HelveticaBold;
  engineHeading.fontSize = 15;
  engineHeading.color = ColorPalette.slate[800];
  engineHeading.margin = new Thickness(0, 0, 0, 5);
  doc.add(engineHeading);

  const engineBody = new TextBlock(
    'BonniePDF handles the PDF version, conformance metadata, colour profiles, embedded standard-font substitutes, semantic tags, setting validation, and resource checks that keep the conformance claim accurate.'
  );
  engineBody.fontSize = 10;
  engineBody.color = ColorPalette.slate[700];
  engineBody.margin = new Thickness(0, 0, 0, 8);
  doc.add(engineBody);

  const authorBody = new TextBlock(
    'The author supplies the required profile, title and language, logical reading order, alt text and table headers, and validates the final PDF against the required external profile.'
  );
  authorBody.fontSize = 10;
  authorBody.color = ColorPalette.slate[700];
  authorBody.margin = new Thickness(0, 0, 0, 16);
  doc.add(authorBody);

  const divider = new Line();
  divider.color = ColorPalette.slate[300];
  divider.margin = new Thickness(0, 0, 0, 10);
  doc.add(divider);

  const legacy = new TextBlock(
    'Legacy compatibility: pdfAEnabled reads true for any PDF/A profile. Assigning true selects PdfA2b; assigning false selects None. New code should use conformance.'
  );
  legacy.fontName = StandardFonts.HelveticaOblique;
  legacy.fontSize = 9;
  legacy.color = ColorPalette.slate[500];
  doc.add(legacy);

  return doc;
}
