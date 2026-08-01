import { Document, TextBlock, VerticalStack, Container, StandardFonts } from '@bonniepdf/core';

/**
 * A draft document with a large, faint diagonal DRAFT watermark on every page,
 * authored through the options-object front door.
 *
 * The watermark is a nested `watermark` literal on `settings` (font, size,
 * colour token, opacity, rotation). The status callout's left accent bar uses
 * the per-side border sugar (`border: { left: 4, color: 'amber-500' }`).
 */
export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 64,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: 'slate-700' },
      // A tuned watermark: a large, faint diagonal DRAFT sits over the content on
      // every page. Font, size, colour, opacity and rotation are all exposed so
      // the stamp can be matched to the document's palette.
      watermark: {
        text: 'DRAFT',
        fontName: StandardFonts.HelveticaBold,
        fontSize: 120,
        textColor: 'slate-400',
        opacity: 0.12,
        rotationDegrees: -45,
      },
    },
    metadata: {
      title: 'Draft Document with Watermark',
      author: 'BonniePDF',
    },
  });

  // ── Page 1: Title page ──────────────────────────────────────────────────────

  // Brand banner - a filled container introduces the document above the stamp.
  doc.add(
    new Container({
      backgroundColor: 'blue-700',
      cornerRadius: 10,
      padding: [28, 26],
      margin: { bottom: 24 },
      child: new VerticalStack({
        children: [
          new TextBlock('SAMPLE COMPANY', {
            fontName: StandardFonts.HelveticaBold,
            fontSize: 11,
            textColor: 'blue-200',
            margin: { bottom: 6 },
          }),
          new TextBlock('Product Strategy Proposal', {
            fontName: StandardFonts.HelveticaBold,
            fontSize: 26,
            textColor: 'slate-50',
          }),
        ],
      }),
    })
  );

  // Draft-status callout - a tinted box with a left accent bar that explains the watermark.
  doc.add(
    new Container({
      backgroundColor: 'amber-50',
      border: { left: 4, color: 'amber-500' },
      padding: [16, 14],
      margin: { bottom: 24 },
      child: new TextBlock(
        'This document is a draft and has not been approved for distribution. All content ' +
          'is subject to change pending final review by the project committee. Please do not ' +
          'share this document outside the review team.',
        { fontName: StandardFonts.Helvetica, fontSize: 11, textColor: 'amber-800', alignment: 'justify' }
      ),
    })
  );

  doc.add(
    new TextBlock(
      'Prepared for internal review by the strategy team. The sections that follow outline ' +
        'the proposed initiative, its objectives, and the resourcing required to deliver it.',
      { fontName: StandardFonts.Helvetica, fontSize: 12, textColor: 'slate-600', alignment: 'justify' }
    )
  );

  // ── Page 2: Content page ────────────────────────────────────────────────────
  doc.addPage();

  doc.add(
    new TextBlock('Section 1: Executive Summary', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 18,
      textColor: 'blue-800',
      margin: { bottom: 12 },
    })
  );

  doc.add(
    new TextBlock(
      'The proposed initiative aims to modernize the existing infrastructure by adopting ' +
        'cloud-native technologies and microservice architectures. This transformation will ' +
        'enable greater scalability, improved fault tolerance, and faster deployment cycles. ' +
        'The estimated timeline for Phase 1 completion is twelve months, with a projected ' +
        'budget allocation of two million dollars across engineering and operations teams.',
      {
        fontName: StandardFonts.Helvetica,
        fontSize: 11,
        textColor: 'slate-700',
        alignment: 'justify',
        margin: { bottom: 12 },
      }
    )
  );

  doc.add(
    new TextBlock(
      'Key stakeholders include the VP of Engineering, the CTO, and department leads ' +
        'from Product, Security, and Operations. A steering committee will convene monthly ' +
        'to review progress against milestones and address any blockers or scope changes.',
      { fontName: StandardFonts.Helvetica, fontSize: 11, textColor: 'slate-700', alignment: 'justify' }
    )
  );

  doc.add(
    new TextBlock('Section 2: Expected Outcomes', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 18,
      textColor: 'blue-800',
      margin: { top: 18, bottom: 12 },
    })
  );

  doc.add(
    new TextBlock(
      'On completion, the platform is expected to reduce infrastructure costs by twenty ' +
        'percent, cut average deployment time from hours to minutes, and improve service ' +
        'availability to four nines. These outcomes will be measured against a baseline ' +
        'captured during the discovery phase and reported to the steering committee.',
      { fontName: StandardFonts.Helvetica, fontSize: 11, textColor: 'slate-700', alignment: 'justify' }
    )
  );

  return doc;
}
