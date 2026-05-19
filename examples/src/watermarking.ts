import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  PdfVersion,
  WatermarkSettings,
  TextBlock,
  TextAlignment,
  Color,
  Thickness,
  StandardFonts,
} from '@bonniepdf/core';

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 60);
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;
  settings.watermark = new WatermarkSettings('DRAFT');

  const metadata = new DocumentMetadata();
  metadata.title = 'Draft Document with Watermark';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Page 1: Title page ──
  const title = new TextBlock('Project Proposal');
  title.fontName = StandardFonts.HelveticaBold;
  title.fontSize = 28;
  title.textColor = Color.slate800;
  title.margin = new Thickness(0, 80, 0, 12);
  title.alignment = TextAlignment.Center;
  doc.add(title);

  const subtitle = new TextBlock('Prepared for Internal Review');
  subtitle.fontName = StandardFonts.Helvetica;
  subtitle.fontSize = 14;
  subtitle.textColor = Color.slate500;
  subtitle.margin = new Thickness(0, 0, 0, 40);
  subtitle.alignment = TextAlignment.Center;
  doc.add(subtitle);

  const disclaimer = new TextBlock(
    'This document is a draft and has not been approved for distribution. ' +
      'All content is subject to change pending final review by the project committee. ' +
      'Please do not share this document outside the review team.'
  );
  disclaimer.fontName = StandardFonts.TimesRoman;
  disclaimer.fontSize = 12;
  disclaimer.textColor = Color.slate600;
  disclaimer.alignment = TextAlignment.Justify;
  doc.add(disclaimer);

  // ── Page 2: Content page ──
  doc.addPage();

  const s1 = new TextBlock('Section 1: Executive Summary');
  s1.fontName = StandardFonts.HelveticaBold;
  s1.fontSize = 18;
  s1.textColor = Color.slate800;
  s1.margin = new Thickness(0, 0, 0, 12);
  doc.add(s1);

  const para1 = new TextBlock(
    'The proposed initiative aims to modernize the existing infrastructure by adopting ' +
      'cloud-native technologies and microservice architectures. This transformation will ' +
      'enable greater scalability, improved fault tolerance, and faster deployment cycles. ' +
      'The estimated timeline for Phase 1 completion is twelve months, with a projected ' +
      'budget allocation of two million dollars across engineering and operations teams.'
  );
  para1.fontName = StandardFonts.TimesRoman;
  para1.fontSize = 11;
  para1.textColor = Color.slate700;
  para1.alignment = TextAlignment.Justify;
  para1.margin = new Thickness(0, 0, 0, 12);
  doc.add(para1);

  const para2 = new TextBlock(
    'Key stakeholders include the VP of Engineering, the CTO, and department leads ' +
      'from Product, Security, and Operations. A steering committee will convene monthly ' +
      'to review progress against milestones and address any blockers or scope changes.'
  );
  para2.fontName = StandardFonts.TimesRoman;
  para2.fontSize = 11;
  para2.textColor = Color.slate700;
  para2.alignment = TextAlignment.Justify;
  doc.add(para2);

  return doc;
}
