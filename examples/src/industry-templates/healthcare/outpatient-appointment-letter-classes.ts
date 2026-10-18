/**
 * Outpatient Appointment (Class API).
 * An accessible fictional Outpatient Appointment with clear appointment details, plain-language actions, an accessibility contact, and prominent sample-data disclaimers. Inspired by UK public-health information-design principles without copying any specific provider’s branding.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// Accessible Outpatient Appointment
//
// This fictional document borrows broad information-design principles common
// to UK public healthcare: plain language, a strong visual hierarchy, generous
// spacing, and a prominent appointment summary. It deliberately does not copy
// any real health service provider's branding, logos, typography, organisation
// names, or contact details.
//
// The **class / construct-then-mutate** companion to
// `outpatient-appointment-letter.ts`. Same letter, authored the long way:
// `new` each element and assign properties. It renders **byte-for-byte
// identically** to the options-style original (an equivalence test binds the
// two). Reach for the options form first; this variant exists to show what it
// desugars to.

import {
  AccessibilityMode,
  Border,
  BorderColors,
  Color,
  Container,
  Document,
  DocumentMetadata,
  DocumentSettings,
  Grid,
  Heading,
  PdfAConformance,
  PdfSize,
  StandardFonts,
  TextAlignment,
  TextBlock,
  TextElementBase,
  TextStyle,
  Thickness,
  UnorderedList,
  VerticalStack,
  pageTemplate,
} from '@bonniepdf/core';

const INK = Color.fromHex('#17324d');
const BODY = Color.fromHex('#2f4858');
const MUTED = Color.fromHex('#5d6f7c');
const BLUE = Color.fromHex('#176b87');
const BLUE_DARK = Color.fromHex('#11566d');
const BLUE_PALE = Color.fromHex('#eaf4f8');
const BLUE_BORDER = Color.fromHex('#b8d8e3');
const NOTICE = Color.fromHex('#fff4ce');
const NOTICE_BORDER = Color.fromHex('#d69e00');

export function generate(): Document {
  const settings = new DocumentSettings(PdfSize.a4, 48);
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.displayDocTitle = true;
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(BODY);
  function pageFooter(): TextBlock {
    const f = new TextBlock(
      `SAMPLE DOCUMENT - FICTIONAL DATA  |  Not issued by any health service provider  |  Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`
    );
    f.fontName = StandardFonts.Helvetica;
    f.fontSize = 7.5;
    f.color = MUTED;
    f.alignment = TextAlignment.Center;
    return f;
  }

  settings.footerTemplate = pageTemplate({ default: pageFooter() });

  const metadata = new DocumentMetadata();
  metadata.title = 'Fictional Outpatient Appointment';
  metadata.author = 'Sample Healthcare';
  metadata.subject = 'Accessible Outpatient Appointment using entirely fictional data.';
  metadata.keywords = 'sample, healthcare, appointment, accessibility, fictional data';

  const doc = new Document(settings, metadata);

  const masthead = new Grid(1.5, 1);
  masthead.cellPadding = 0;
  masthead.margin = new Thickness(0, 0, 0, 8);
  const brandName = new TextBlock('Sample Healthcare');
  brandName.fontName = StandardFonts.HelveticaBold;
  brandName.fontSize = 21;
  brandName.color = BLUE_DARK;
  const brandSub = new TextBlock('Outpatient services');
  brandSub.fontSize = 10;
  brandSub.color = MUTED;
  const brand = new VerticalStack();
  brand.spacing = 3;
  brand.add(brandName);
  brand.add(brandSub);

  const issuedDate = new TextBlock('Issued 1 August 2026');
  issuedDate.fontSize = 9.5;
  issuedDate.color = MUTED;
  issuedDate.alignment = TextAlignment.Right;
  const issuedRef = new TextBlock('Reference SAMPLE-OP-1042');
  issuedRef.fontSize = 9.5;
  issuedRef.color = MUTED;
  issuedRef.alignment = TextAlignment.Right;
  const issued = new VerticalStack();
  issued.spacing = 3;
  issued.add(issuedDate);
  issued.add(issuedRef);

  masthead.addRow(brand, issued);
  doc.add(masthead);

  const banner = new Container();
  banner.backgroundColor = BLUE;
  banner.padding = new Thickness(12, 7, 12, 7);
  banner.margin = new Thickness(0, 0, 0, 20);
  const bannerText = new TextBlock('SAMPLE DOCUMENT - FICTIONAL DATA');
  bannerText.fontName = StandardFonts.HelveticaBold;
  bannerText.fontSize = 9;
  bannerText.color = Color.white;
  bannerText.alignment = TextAlignment.Center;
  banner.child = bannerText;
  doc.add(banner);

  const heading = new Heading('Your outpatient appointment');
  heading.tocIdentifier = 'appointment';
  heading.level = 1;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 25;
  heading.color = INK;
  heading.margin = new Thickness(0, 0, 0, 14);
  doc.add(heading);

  doc.add(body('Dear Sample Patient,', { bold: true, bottom: 8 }));
  doc.add(
    body(
      'We have arranged an outpatient appointment for you. The main details are shown below. Please read the information on this page before you attend.',
      { bottom: 18 }
    )
  );

  const appointmentDetails = new Grid(1, 1);
  appointmentDetails.cellPadding = 5;
  appointmentDetails.addRow(detail('Date', 'Tuesday 15 September 2026'), detail('Time', '10:30 am'));
  appointmentDetails.addRow(
    detail('Clinic', 'Cardiology outpatient clinic'),
    detail('Clinician', 'Dr Sample Clinician')
  );
  appointmentDetails.addRow(
    detail('Location', 'Sample Healthcare Centre\nLevel 2, Blue reception'),
    detail('Patient number', 'SAMPLE-2026-0148')
  );

  const appointmentHeading = new Heading('Appointment details');
  appointmentHeading.tocIdentifier = 'appointment-details';
  appointmentHeading.level = 2;
  appointmentHeading.fontName = StandardFonts.HelveticaBold;
  appointmentHeading.fontSize = 16;
  appointmentHeading.color = BLUE_DARK;

  const appointmentStack = new VerticalStack();
  appointmentStack.spacing = 8;
  appointmentStack.add(appointmentHeading);
  appointmentStack.add(appointmentDetails);

  const appointmentBox = new Container();
  appointmentBox.backgroundColor = BLUE_PALE;
  appointmentBox.border = new Border(1);
  appointmentBox.borderColors = new BorderColors(BLUE_BORDER);
  appointmentBox.padding = new Thickness(15);
  appointmentBox.margin = new Thickness(0, 0, 0, 20);
  appointmentBox.child = appointmentStack;
  doc.add(appointmentBox);

  doc.add(sectionHeading('What you need to do', 'what-to-do'));
  const list = new UnorderedList();
  list.fontName = StandardFonts.Helvetica;
  list.fontSize = 10.5;
  list.color = BODY;
  list.bulletColor = BLUE;
  list.itemSpacing = 4;
  list.margin = new Thickness(0, 0, 0, 18);
  list.addItem('Arrive 15 minutes before your appointment and check in at Blue reception.');
  list.addItem('Bring an up-to-date list of any medicines you take.');
  list.addItem('Tell us as soon as possible if you cannot attend so the appointment can be rearranged.');
  list.addItem(
    'Contact us before your visit if you need an interpreter, step-free access, or information in another format.'
  );
  doc.add(list);

  const noticeHeading = new TextBlock('If you feel unwell before the appointment');
  noticeHeading.fontName = StandardFonts.HelveticaBold;
  noticeHeading.fontSize = 11;
  noticeHeading.color = INK;
  const noticeBody = new TextBlock(
    'Use the appropriate local healthcare service for advice. This sample letter does not provide medical or emergency guidance.'
  );
  noticeBody.fontSize = 10;
  noticeBody.color = BODY;

  const noticeStack = new VerticalStack();
  noticeStack.spacing = 5;
  noticeStack.add(noticeHeading);
  noticeStack.add(noticeBody);

  const notice = new Container();
  notice.backgroundColor = NOTICE;
  notice.border = new Border(1);
  notice.borderColors = new BorderColors(NOTICE_BORDER);
  notice.padding = new Thickness(13);
  notice.margin = new Thickness(0, 0, 0, 18);
  notice.child = noticeStack;
  doc.add(notice);

  doc.add(sectionHeading('Contact and accessibility', 'contact'));
  doc.add(
    body(
      'For this fictional example, contact appointments@example.com. Tell the service if you need the letter in large print, audio, easy read, Braille, or another language.',
      { bottom: 18 }
    )
  );

  const disclaimer = new TextBlock(
    'Demonstration document generated by BonniePDF. All people, identifiers, organisations, locations and contact details are fictional. Not issued by any health service provider.'
  );
  disclaimer.fontName = StandardFonts.HelveticaOblique;
  disclaimer.fontSize = 8.5;
  disclaimer.color = MUTED;
  disclaimer.alignment = TextAlignment.Center;

  const disclaimerBox = new Container();
  disclaimerBox.backgroundColor = Color.fromHex('#f4f7f9');
  disclaimerBox.padding = new Thickness(11);
  disclaimerBox.child = disclaimer;
  doc.add(disclaimerBox);

  return doc;
}

// Local helpers and sample types used by this document.

function sectionHeading(text: string, tocIdentifier: string): Heading {
  const h = new Heading(text);
  h.tocIdentifier = tocIdentifier;
  h.level = 2;
  h.fontName = StandardFonts.HelveticaBold;
  h.fontSize = 16;
  h.color = INK;
  h.margin = new Thickness(0, 0, 0, 8);
  return h;
}

function body(text: string, options: { bold?: boolean; bottom?: number } = {}): TextBlock {
  const b = new TextBlock(text);
  b.fontName = options.bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica;
  b.fontSize = 11;
  b.color = BODY;
  b.margin = new Thickness(0, 0, 0, options.bottom ?? 12);
  return b;
}

function detail(label: string, value: string): VerticalStack {
  const labelBlock = new TextBlock(label.toUpperCase());
  labelBlock.fontName = StandardFonts.HelveticaBold;
  labelBlock.fontSize = 8;
  labelBlock.color = BLUE_DARK;

  const valueBlock = new TextBlock(value);
  valueBlock.fontName = StandardFonts.Helvetica;
  valueBlock.fontSize = 10.5;
  valueBlock.color = INK;

  const s = new VerticalStack();
  s.spacing = 3;
  s.add(labelBlock);
  s.add(valueBlock);
  return s;
}
