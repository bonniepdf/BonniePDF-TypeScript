/**
 * Outpatient Appointment.
 * A fictional outpatient appointment letter: clear appointment details, plain-language actions, an accessibility contact, and prominent sample-data notices.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// Accessible Outpatient Appointment
//
// This fictional document borrows broad information-design principles common
// to UK public healthcare: plain language, a strong visual hierarchy, generous
// spacing, and a prominent appointment summary. It deliberately does not copy
// any real health service provider's branding, logos, typography, organisation
// names, or contact details.

import {
  pageNumber,
  AccessibilityMode,
  Container,
  Document,
  Grid,
  Heading,
  HorizontalStack,
  PdfAConformance,
  PdfSize,
  StandardFonts,
  Svg,
  TextBlock,
  UnorderedList,
  VerticalStack,
  pageTemplate,
} from '@bonniepdf/core';

const INK = '#17324d';
const BODY = '#2f4858';
const MUTED = '#5d6f7c';
const BLUE = '#176b87';
const BLUE_DARK = '#11566d';
const BLUE_PALE = '#eaf4f8';
const BLUE_BORDER = '#b8d8e3';
const NOTICE = '#fff4ce';
const NOTICE_BORDER = '#d69e00';

export function generate(assets: ReadonlyMap<string, Uint8Array>): Document {
  const markBytes = assets.get('images/svg/sample-healthcare.svg');
  if (!markBytes) throw new Error('Supply images/svg/sample-healthcare.svg.');
  const markSvg = new TextDecoder().decode(markBytes);
  const mapBytes = assets.get('images/svg/clinic-map.svg');
  if (!mapBytes) throw new Error('Supply images/svg/clinic-map.svg.');
  const mapSvg = new TextDecoder().decode(mapBytes);

  const doc = new Document({
    settings: {
      pageSize: PdfSize.a4,
      margin: 48,
      conformance: PdfAConformance.PdfA2a,
      accessibility: AccessibilityMode.PdfUa1,
      language: 'en-GB',
      displayDocTitle: true,
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: BODY },
      footerTemplate: pageTemplate({
        default: pageNumber(
          'SAMPLE DOCUMENT - FICTIONAL DATA  |  Not issued by any health service provider  |  Page {page} of {total}',
          {
            fontName: StandardFonts.Helvetica,
            fontSize: 7.5,
            color: MUTED,
            alignment: 'center',
          }
        ),
      }),
    },
    metadata: {
      title: 'Fictional Outpatient Appointment',
      author: 'Sample Healthcare',
      subject: 'Accessible Outpatient Appointment using entirely fictional data.',
      keywords: 'sample, healthcare, appointment, accessibility, fictional data',
    },
  });

  const masthead = new Grid({ columns: [1.5, 1], cellPadding: 0, margin: { bottom: 8 } });
  masthead.addRow(
    new HorizontalStack({
      widthDistribution: 'auto',
      spacing: 8,
      children: [
        new Svg({ svgData: markSvg, width: 24, height: 24, isDecorative: true, margin: { top: 2 } }),
        new VerticalStack({
          spacing: 3,
          children: [
            new TextBlock('Sample Healthcare', {
              fontName: StandardFonts.HelveticaBold,
              fontSize: 21,
              color: BLUE_DARK,
            }),
            new TextBlock('Outpatient services', { fontSize: 10, color: MUTED }),
          ],
        }),
      ],
    }),
    new VerticalStack({
      spacing: 3,
      children: [
        new TextBlock('Issued 1 August 2026', {
          fontSize: 9.5,
          color: MUTED,
          alignment: 'right',
        }),
        new TextBlock('Reference SAMPLE-OP-1042', {
          fontSize: 9.5,
          color: MUTED,
          alignment: 'right',
        }),
      ],
    })
  );
  doc.add(masthead);

  doc.add(
    new Container({
      backgroundColor: BLUE,
      padding: { top: 7, right: 12, bottom: 7, left: 12 },
      margin: { bottom: 20 },
      child: new TextBlock('SAMPLE DOCUMENT - FICTIONAL DATA', {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 9,
        color: '#ffffff',
        alignment: 'center',
      }),
    })
  );

  doc.add(
    new Heading('Your outpatient appointment', {
      tocIdentifier: 'appointment',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 25,
      color: INK,
      margin: { bottom: 14 },
    })
  );

  doc.add(body('Dear Sample Patient,', { bold: true, bottom: 8 }));
  doc.add(
    body(
      'We have arranged an outpatient appointment for you. The main details are shown below. Please read the information on this page before you attend.',
      { bottom: 18 }
    )
  );

  const appointmentDetails = new Grid({ columns: [1, 1], cellPadding: 5 });
  appointmentDetails.addRow(detail('Date', 'Tuesday 15 September 2026'), detail('Time', '10:30 am'));
  appointmentDetails.addRow(
    detail('Clinic', 'Cardiology outpatient clinic'),
    detail('Clinician', 'Dr Sample Clinician')
  );
  appointmentDetails.addRow(
    detail('Location', 'Sample Healthcare Centre\nLevel 2, Blue reception'),
    detail('Patient number', 'SAMPLE-2026-0148')
  );

  doc.add(
    new Container({
      backgroundColor: BLUE_PALE,
      border: { width: 1, color: BLUE_BORDER },
      padding: 15,
      margin: { bottom: 20 },
      child: new VerticalStack({
        spacing: 8,
        children: [
          new Heading('Appointment details', {
            tocIdentifier: 'appointment-details',
            level: 2,
            fontName: StandardFonts.HelveticaBold,
            fontSize: 16,
            color: BLUE_DARK,
          }),
          appointmentDetails,
        ],
      }),
    })
  );

  const actionsSection = new HorizontalStack({
    widthDistribution: 'weighted',
    spacing: 14,
    margin: { bottom: 18 },
  });
  actionsSection.add(
    new VerticalStack({
      children: [
        sectionHeading('What you need to do', 'what-to-do'),
        new UnorderedList({
          fontName: StandardFonts.Helvetica,
          fontSize: 10.5,
          color: BODY,
          bulletColor: BLUE,
          itemSpacing: 4,
          items: [
            'Arrive 15 minutes before your appointment and check in at Blue reception.',
            'Bring an up-to-date list of any medicines you take.',
            'Tell us as soon as possible if you cannot attend so the appointment can be rearranged.',
            'Contact us before your visit if you need an interpreter, step-free access, or information in another format.',
          ],
        }),
      ],
    }),
    1.7
  );
  actionsSection.add(
    new Svg({
      svgData: mapSvg,
      width: 170,
      height: 109,
      altText:
        'Site map of Sample General Hospital showing Main Entrance on Hospital Road and Rheumatology Outpatient Clinic in Wing B.',
    }),
    1
  );
  doc.add(actionsSection);

  doc.add(
    new Container({
      backgroundColor: NOTICE,
      border: { width: 1, color: NOTICE_BORDER },
      padding: 13,
      margin: { bottom: 18 },
      child: new VerticalStack({
        spacing: 5,
        children: [
          new TextBlock('If you feel unwell before the appointment', {
            fontName: StandardFonts.HelveticaBold,
            fontSize: 11,
            color: INK,
          }),
          new TextBlock(
            'Use the appropriate local healthcare service for advice. This sample letter does not provide medical or emergency guidance.',
            { fontSize: 10, color: BODY }
          ),
        ],
      }),
    })
  );

  doc.add(sectionHeading('Contact and accessibility', 'contact'));
  doc.add(
    body(
      'For this fictional example, contact appointments@example.com. Tell the service if you need the letter in large print, audio, easy read, Braille, or another language.',
      { bottom: 18 }
    )
  );

  doc.add(
    new Container({
      backgroundColor: '#f4f7f9',
      padding: 11,
      child: new TextBlock(
        'Demonstration document generated by BonniePDF. All people, identifiers, organisations, locations and contact details are fictional. Not issued by any health service provider.',
        {
          fontName: StandardFonts.HelveticaOblique,
          fontSize: 8.5,
          color: MUTED,
          alignment: 'center',
        }
      ),
    })
  );

  return doc;
}

// Local helpers and sample types used by this document.

function sectionHeading(text: string, tocIdentifier: string): Heading {
  return new Heading(text, {
    tocIdentifier,
    level: 2,
    fontName: StandardFonts.HelveticaBold,
    fontSize: 16,
    color: INK,
    margin: { bottom: 8 },
  });
}

function body(text: string, options: { bold?: boolean; bottom?: number } = {}): TextBlock {
  return new TextBlock(text, {
    fontName: options.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica,
    fontSize: 11,
    color: BODY,
    margin: { bottom: options.bottom ?? 12 },
  });
}

function detail(label: string, value: string): VerticalStack {
  return new VerticalStack({
    spacing: 3,
    children: [
      new TextBlock(label.toUpperCase(), {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 8,
        color: BLUE_DARK,
      }),
      new TextBlock(value, {
        fontName: StandardFonts.Helvetica,
        fontSize: 10.5,
        color: INK,
      }),
    ],
  });
}
