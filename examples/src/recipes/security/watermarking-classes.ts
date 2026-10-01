import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  PdfSize,
  Watermark,
  TextBlock,
  TextStyle,
  TextAlignment,
  VerticalStack,
  Container,
  ColorPalette,
  Thickness,
  Border,
  BorderColors,
  StandardFonts,
  PdfAConformance,
  AccessibilityMode,
} from '@bonniepdf/core';

/**
 * The **class / construct-then-mutate** companion to `watermarking.ts`.
 *
 * Same draft document with a diagonal DRAFT watermark, authored the long way:
 * `new Watermark()` + `new` each element and assign properties, using
 * `Border.leftOnly`, `BorderColors`, the `TextAlignment` enum, `TextStyle`,
 * `Thickness` and `ColorPalette` directly. This is the escape hatch the
 * options-object front door sits on top of.
 *
 * It renders **byte-for-byte identically** to the options-style
 * `watermarking.ts` (an equivalence test binds the two). Reach for the options
 * form first; this variant exists to show what it desugars to.
 */
export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 64);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);

  // A tuned watermark: a large, faint diagonal DRAFT sits over the content on
  // every page. Watermark exposes the font, size, colour, opacity and
  // rotation so the stamp can be matched to the document's palette.
  const watermark = new Watermark('DRAFT');
  watermark.fontName = StandardFonts.HelveticaBold;
  watermark.fontSize = 120;
  watermark.color = ColorPalette.slate[400];
  watermark.opacity = 0.12;
  watermark.rotationDegrees = -45;
  settings.watermark = watermark;

  const metadata = new DocumentMetadata();
  metadata.title = 'Draft Document with Watermark';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  // ── Page 1: Title page ──────────────────────────────────────────────────────

  // Brand banner - a filled container introduces the document above the stamp.
  const bannerStack = new VerticalStack();

  const eyebrow = new TextBlock('SAMPLE COMPANY');
  eyebrow.fontName = StandardFonts.HelveticaBold;
  eyebrow.fontSize = 11;
  eyebrow.color = ColorPalette.blue[200];
  eyebrow.margin = new Thickness(0, 0, 0, 6);
  bannerStack.add(eyebrow);

  const bannerTitle = new TextBlock('Product Strategy Proposal');
  bannerTitle.fontName = StandardFonts.HelveticaBold;
  bannerTitle.fontSize = 26;
  bannerTitle.color = ColorPalette.slate[50];
  bannerStack.add(bannerTitle);

  const banner = new Container();
  banner.backgroundColor = ColorPalette.blue[700];
  banner.cornerRadius = 10;
  banner.padding = new Thickness(28, 26, 28, 26);
  banner.margin = new Thickness(0, 0, 0, 24);
  banner.child = bannerStack;
  doc.add(banner);

  // Draft-status callout - a tinted box that explains the watermark.
  const calloutText = new TextBlock(
    'This document is a draft and has not been approved for distribution. All content ' +
      'is subject to change pending final review by the project committee. Please do not ' +
      'share this document outside the review team.'
  );
  calloutText.fontName = StandardFonts.Helvetica;
  calloutText.fontSize = 11;
  calloutText.color = ColorPalette.amber[800];
  calloutText.alignment = TextAlignment.Justify;

  const callout = new Container();
  callout.backgroundColor = ColorPalette.amber[50];
  callout.border = Border.leftOnly(4);
  callout.borderColors = new BorderColors(ColorPalette.amber[500]);
  callout.padding = new Thickness(16, 14, 16, 14);
  callout.margin = new Thickness(0, 0, 0, 24);
  callout.child = calloutText;
  doc.add(callout);

  const intro = new TextBlock(
    'Prepared for internal review by the strategy team. The sections that follow outline ' +
      'the proposed initiative, its objectives, and the resourcing required to deliver it.'
  );
  intro.fontName = StandardFonts.Helvetica;
  intro.fontSize = 12;
  intro.color = ColorPalette.slate[600];
  intro.alignment = TextAlignment.Justify;
  doc.add(intro);

  // ── Page 2: Content page ────────────────────────────────────────────────────
  doc.addPage();

  const s1 = new TextBlock('Section 1: Executive Summary');
  s1.fontName = StandardFonts.HelveticaBold;
  s1.fontSize = 18;
  s1.color = ColorPalette.blue[800];
  s1.margin = new Thickness(0, 0, 0, 12);
  doc.add(s1);

  const para1 = new TextBlock(
    'The proposed initiative aims to modernize the existing infrastructure by adopting ' +
      'cloud-native technologies and microservice architectures. This transformation will ' +
      'enable greater scalability, improved fault tolerance, and faster deployment cycles. ' +
      'The estimated timeline for Phase 1 completion is twelve months, with a projected ' +
      'budget allocation of two million dollars across engineering and operations teams.'
  );
  para1.fontName = StandardFonts.Helvetica;
  para1.fontSize = 11;
  para1.color = ColorPalette.slate[700];
  para1.alignment = TextAlignment.Justify;
  para1.margin = new Thickness(0, 0, 0, 12);
  doc.add(para1);

  const para2 = new TextBlock(
    'Key stakeholders include the VP of Engineering, the CTO, and department leads ' +
      'from Product, Security, and Operations. A steering committee will convene monthly ' +
      'to review progress against milestones and address any blockers or scope changes.'
  );
  para2.fontName = StandardFonts.Helvetica;
  para2.fontSize = 11;
  para2.color = ColorPalette.slate[700];
  para2.alignment = TextAlignment.Justify;
  doc.add(para2);

  const s2 = new TextBlock('Section 2: Expected Outcomes');
  s2.fontName = StandardFonts.HelveticaBold;
  s2.fontSize = 18;
  s2.color = ColorPalette.blue[800];
  s2.margin = new Thickness(0, 18, 0, 12);
  doc.add(s2);

  const para3 = new TextBlock(
    'On completion, the platform is expected to reduce infrastructure costs by twenty ' +
      'percent, cut average deployment time from hours to minutes, and improve service ' +
      'availability to four nines. These outcomes will be measured against a baseline ' +
      'captured during the discovery phase and reported to the steering committee.'
  );
  para3.fontName = StandardFonts.Helvetica;
  para3.fontSize = 11;
  para3.color = ColorPalette.slate[700];
  para3.alignment = TextAlignment.Justify;
  doc.add(para3);

  return doc;
}
