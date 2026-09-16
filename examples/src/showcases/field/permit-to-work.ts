// ── Hot works permit to work ─────────────────────────────────────────────────
//
// The controlled form that authorises high-risk work on a site: what is being
// done, what could go wrong, what controls are in place, who tested the
// atmosphere, who isolated what, and the three signatures that make it valid —
// issue, acceptance, and cancellation.
//
// A permit is the most form-like document in the field set and the least
// forgiving: it is printed and displayed at the work location, it has a hard
// validity window, and the signature panels must be present and complete or the
// permit is void. Nothing about it may reflow unpredictably.
//
// The counterpoint to the job sheet in the same family: where that document
// records what happened, this one authorises what is about to.
//
// Tagged PDF/UA-1 and archival PDF/A-2a. Sample site, people, and references
// throughout; the controls listed are illustrative and are not a substitute for
// a real risk assessment.

import {
  Document,
  TextBlock,
  TextElementBase,
  Container,
  VerticalStack,
  HorizontalStack,
  Table,
  StandardFonts,
  ColorPalette,
  type ColorInput,
} from '@bonniepdf/core';

import {
  INK,
  MUTED,
  ACCENT,
  RULE,
  STATUS,
  accentBar,
  body,
  eyebrow,
  field,
  fieldRow,
  h1,
  h2,
  h3,
  panel,
  shortDate,
  signatureRow,
  signatureSlot,
  statusCell,
  td,
  th,
} from './_kit';

// ── The permit ───────────────────────────────────────────────────────────────

const PERMIT = {
  number: 'PTW-2026-0451',
  type: 'Hot works — grinding and welding',
  site: 'Sample Site B — Building 4, Plant room 2',
  project: 'Sample Project — Phase 2 fit-out',
  contractor: 'Sample Contractor Ltd',
  issuedBy: 'M. Delgado — Authorised Person (AP-118)',
  acceptedBy: 'A. Okafor — Supervising Engineer (Eng. 4471)',
  validFrom: new Date(Date.UTC(2026, 8, 10, 8, 0)),
  validTo: new Date(Date.UTC(2026, 8, 10, 16, 0)),
  riskAssessment: 'RA-2026-0117 rev. C',
  methodStatement: 'MS-2026-0088 rev. B',
};

interface Hazard {
  reference: string;
  hazard: string;
  who: string;
  rating: 'High' | 'Medium' | 'Low';
  controls: string;
}

const HAZARDS: Hazard[] = [
  {
    reference: 'H-1',
    hazard: 'Ignition of combustible material by sparks or hot slag',
    who: 'Operatives, building occupants',
    rating: 'High',
    controls:
      'Combustibles removed to 10m or protected with fire blankets. Two 6-litre extinguishers at the work position. Fire watch maintained throughout and for 60 minutes after work ceases.',
  },
  {
    reference: 'H-2',
    hazard: 'Activation of the detection system causing an unnecessary evacuation',
    who: 'Building occupants',
    rating: 'Medium',
    controls:
      'Local detector heads isolated by the responsible person before work begins and reinstated on cancellation. Isolation recorded below and confirmed to the building manager.',
  },
  {
    reference: 'H-3',
    hazard: 'Exposure to welding fume in a confined plant room',
    who: 'Operatives',
    rating: 'High',
    controls:
      'Local exhaust ventilation at the arc, doors held open on the corridor side, and RPE to the standard named in the method statement. Atmospheric test recorded below.',
  },
  {
    reference: 'H-4',
    hazard: 'Contact with live services in the work area',
    who: 'Operatives',
    rating: 'High',
    controls:
      'Circuits isolated and locked off at DB-2B; keys retained by the supervising engineer. Isolation certificate ISO-2026-0288 attached.',
  },
  {
    reference: 'H-5',
    hazard: 'Arc eye and burns to persons passing the work area',
    who: 'Other trades',
    rating: 'Medium',
    controls: 'Welding screens erected on the corridor side; signage at both plant room doors for the permit duration.',
  },
  {
    reference: 'H-6',
    hazard: 'Manual handling of the welding set on a stair core',
    who: 'Operatives',
    rating: 'Low',
    controls: 'Two-person lift, set transported on a sack truck, route surveyed before the shift.',
  },
];

const RATING_COLOUR: Record<Hazard['rating'], ColorInput> = {
  High: STATUS.critical,
  Medium: STATUS.high,
  Low: STATUS.medium,
};

interface Isolation {
  reference: string;
  system: string;
  point: string;
  method: string;
  by: string;
}

const ISOLATIONS: Isolation[] = [
  {
    reference: 'I-1',
    system: 'Electrical — lighting and power, plant room 2',
    point: 'DB-2B ways 4, 6, 8',
    method: 'Locked off, personal padlock, caution notice applied',
    by: 'A. Okafor',
  },
  {
    reference: 'I-2',
    system: 'Fire detection — zone 14',
    point: 'Panel FP-1, zone isolate',
    method: 'Zone isolated at panel, building manager informed',
    by: 'M. Delgado',
  },
  {
    reference: 'I-3',
    system: 'Heating — LTHW flow and return to AHU-04',
    point: 'Valves V-204 / V-205',
    method: 'Valves closed, chained, and tagged',
    by: 'A. Okafor',
  },
];

const PRECAUTIONS: string[] = [
  'Risk assessment and method statement read and understood by every operative on the permit.',
  'Work area inspected and combustible materials removed or protected before ignition sources are introduced.',
  'Fire extinguishers checked in date and positioned at the work location.',
  'Fire watch nominated, briefed, and present for the duration and for 60 minutes after work ceases.',
  'Atmospheric test completed and within limits before work starts, and repeated after any break longer than 30 minutes.',
  'Detection isolation confirmed with the building manager, and reinstatement confirmed on cancellation.',
  'Permit displayed at the work location for its full duration.',
];

// ── Document ─────────────────────────────────────────────────────────────────

export function generate(): Document {
  const doc = new Document({
    settings: {
      pageSize: 'a4',
      margin: 44,
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 9.5, color: INK },
      headerTemplate: (pageNumber: number) =>
        pageNumber === 1
          ? undefined
          : runningBand(`Permit to work ${PERMIT.number} — ${PERMIT.type}`, PERMIT.site, STATUS.critical),
      footerTemplate: (pageNumber: number) =>
        runningBand(
          'This permit is void unless all three panels are signed. Display at the work location.',
          `Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`,
          MUTED
        ),
    },
    metadata: {
      title: `Permit to work ${PERMIT.number} — ${PERMIT.type}`,
      author: PERMIT.contractor,
      subject:
        'Hot works permit to work: hazards and controls, atmospheric test, isolation record, precautions, and issue/acceptance/cancellation signatures (sample data).',
      keywords: 'permit to work, hot works, construction, safety, isolation, RAMS, pdf/ua, pdf/a',
    },
  });

  // ── Title block ────────────────────────────────────────────────────────────

  doc.add(accentBar(STATUS.critical));
  doc.add(eyebrow('PERMIT TO WORK · HOT WORKS · DISPLAY AT THE WORK LOCATION', STATUS.critical));
  doc.add(h1(PERMIT.type));
  doc.add(body(`${PERMIT.project} · ${PERMIT.site}`, { color: MUTED, mb: 12 }));

  doc.add(
    fieldRow(
      [
        field('Permit number', PERMIT.number),
        field('Valid from', `${shortDate(PERMIT.validFrom)} ${clock(PERMIT.validFrom)}`),
        field('Valid until', `${shortDate(PERMIT.validTo)} ${clock(PERMIT.validTo)}`),
        field('Contractor', PERMIT.contractor),
      ],
      { mb: 6 }
    )
  );

  doc.add(
    fieldRow([
      field('Risk assessment', PERMIT.riskAssessment),
      field('Method statement', PERMIT.methodStatement),
      field('Issued by', PERMIT.issuedBy),
      field('Accepted by', PERMIT.acceptedBy),
    ])
  );

  doc.add(
    panel(
      'Validity',
      [
        body(
          'This permit authorises only the work described below, only at the location named, and only between the ' +
            'times shown. It lapses automatically at the expiry time and must be cancelled and reissued if the work ' +
            'is not complete.',
          { mb: 0, size: 9 }
        ),
      ],
      { accent: STATUS.critical }
    )
  );

  // ── Description of work ────────────────────────────────────────────────────

  doc.add(h2('Description of work'));
  doc.add(
    body(
      'Cutting and removal of redundant LTHW pipework brackets in plant room 2, followed by MIG welding of three ' +
        'replacement bracket plates to the existing steel frame. Angle grinder and portable welding set in use. ' +
        'Work is at low level; no working at height or confined-space entry is authorised under this permit.'
    )
  );

  // ── Hazards and controls ───────────────────────────────────────────────────

  doc.add(h2('Hazards and controls'));

  const hazards = new Table({
    columns: [0.6, 2.6, 1.5, 0.9, 4.4],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  hazards.addHeader(th('Ref'), th('Hazard'), th('Who is at risk'), th('Rating'), th('Controls in place'));
  for (const hazard of HAZARDS) {
    hazards.addRow(
      td(hazard.reference, { bold: true }),
      td(hazard.hazard),
      td(hazard.who, { color: MUTED }),
      statusCell(hazard.rating, RATING_COLOUR[hazard.rating]),
      td(hazard.controls)
    );
  }
  doc.add(hazards);

  // ── Atmospheric test ───────────────────────────────────────────────────────

  doc.add(h2('Atmospheric test record'));

  const gas = new Table({
    columns: [2.2, 1.2, 1.4, 1.2, 1.6],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  gas.addHeader(th('Measurement'), th('Reading'), th('Acceptable range'), th('Result'), th('Tested by'));
  gas.addRow(td('Oxygen'), td('20.9 %'), td('19.5 – 23.5 %', { color: MUTED }), pass(), td('M. Delgado'));
  gas.addRow(td('Flammable gas (LEL)'), td('0 %'), td('< 10 %', { color: MUTED }), pass(), td('M. Delgado'));
  gas.addRow(td('Carbon monoxide'), td('0 ppm'), td('< 30 ppm', { color: MUTED }), pass(), td('M. Delgado'));
  doc.add(gas);

  doc.add(
    body(
      `Instrument SN-4471-B, calibration due 14 Nov 2026. Tested at ${clock(PERMIT.validFrom)} on ` +
        `${shortDate(PERMIT.validFrom)}. Re-test required after any break in work longer than 30 minutes.`,
      { color: MUTED, size: 8.5 }
    )
  );

  // ── Isolations ─────────────────────────────────────────────────────────────

  doc.add(h2('Isolation record'));

  const isolations = new Table({
    columns: [0.6, 3.2, 1.8, 3.4, 1.2],
    cellPadding: 6,
    border: { width: 0.5, color: RULE },
    headerBackgroundColor: ACCENT,
    headerTextColor: '#ffffff',
  });
  isolations.addHeader(th('Ref'), th('System'), th('Isolation point'), th('Method'), th('Isolated by'));
  for (const isolation of ISOLATIONS) {
    isolations.addRow(
      td(isolation.reference, { bold: true }),
      td(isolation.system),
      td(isolation.point),
      td(isolation.method, { color: MUTED }),
      td(isolation.by)
    );
  }
  doc.add(isolations);

  doc.add(
    body(
      'All isolations above are to be reinstated on cancellation of this permit, and the reinstatement confirmed ' +
        'in the cancellation panel.',
      { color: MUTED, size: 8.5 }
    )
  );

  // ── Precautions checklist ──────────────────────────────────────────────────

  doc.add(h2('Precautions — to be confirmed before work starts'));
  const checklist = new VerticalStack({ spacing: 5, margin: { bottom: 10 } });
  for (const precaution of PRECAUTIONS) checklist.add(checkItem(precaution));
  doc.add(checklist);

  // ── Signature panels ───────────────────────────────────────────────────────

  // The three panels start a page of their own. A permit that splits its
  // signature panels across a page break is a permit someone can sign half of,
  // and this document's own footer says it is void unless all three are
  // complete - so the layout has to guarantee what the wording claims.
  doc.addPage();
  doc.add(h2('Authorisation'));
  doc.add(
    body(
      'All three panels must be completed. The permit is not valid until panels 1 and 2 are signed, and the work ' +
        'area may not be handed back until panel 3 is signed.',
      { color: MUTED, size: 9 }
    )
  );

  doc.add(h3('1. Issue'));
  doc.add(
    body(
      'I have inspected the work location, I am satisfied that the controls above are in place, and I authorise ' +
        'the work described for the period stated.',
      { color: MUTED, size: 9, mb: 4 }
    )
  );
  doc.add(
    signatureRow([
      signatureSlot('Authorised person', PERMIT.issuedBy, {
        dated: `${shortDate(PERMIT.validFrom)} at ${clock(PERMIT.validFrom)}`,
      }),
    ])
  );

  doc.add(h3('2. Acceptance'));
  doc.add(
    body(
      'I have read this permit and the associated risk assessment and method statement. I accept responsibility ' +
        'for the work being carried out in accordance with them, and I have briefed every operative on the permit.',
      { color: MUTED, size: 9, mb: 4 }
    )
  );
  doc.add(
    signatureRow([
      signatureSlot('Accepting person', PERMIT.acceptedBy, { dated: shortDate(PERMIT.validFrom) }),
      signatureSlot('Operatives briefed by', 'Name and signature'),
    ])
  );
  doc.add(
    body('3 operatives briefed — see the attendance register for this permit.', {
      color: MUTED,
      size: 8.5,
      mt: 6,
    })
  );

  doc.add(h3('3. Cancellation'));
  doc.add(
    body(
      'Work is complete or suspended, the area has been inspected, the fire watch has been maintained for the ' +
        'required period, all isolations have been reinstated, and this permit is cancelled.',
      { color: MUTED, size: 9, mb: 4 }
    )
  );
  doc.add(
    signatureRow([
      signatureSlot('Accepting person', PERMIT.acceptedBy),
      signatureSlot('Authorised person', PERMIT.issuedBy),
      signatureSlot('Isolations reinstated by', 'Name and signature'),
    ])
  );

  doc.add(
    body(`${PERMIT.number} · white copy displayed at the work location, yellow copy retained by the issuing office.`, {
      color: MUTED,
      size: 8,
      mt: 10,
      mb: 0,
    })
  );

  return doc;
}

// ── Local helpers ────────────────────────────────────────────────────────────

function pass(): Container {
  return statusCell('Pass', STATUS.done);
}

function checkItem(text: string): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted', spacing: 8 });
  // An empty bordered box: the permit is signed off against a printed copy, so
  // the operative ticks these by hand.
  row.add(
    new Container({
      border: { width: 0.75, color: ColorPalette.slate[400] },
      cornerRadius: 2,
      width: 11,
      height: 11,
    }),
    0.35
  );
  row.add(new TextBlock(text, { fontName: StandardFonts.Helvetica, fontSize: 9, textColor: INK }), 12);
  return row;
}

function clock(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC',
  }).format(d);
}

function runningBand(left: string, right: string, color: ColorInput = MUTED): HorizontalStack {
  const row = new HorizontalStack({ widthDistribution: 'weighted' });
  row.add(new TextBlock(left, { fontName: StandardFonts.Helvetica, fontSize: 7.5, textColor: color }), 3);
  row.add(
    new TextBlock(right, {
      fontName: StandardFonts.Helvetica,
      fontSize: 7.5,
      textColor: MUTED,
      alignment: 'right',
    }),
    1.5
  );
  return row;
}
