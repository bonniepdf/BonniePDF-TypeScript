/**
 * Compliance Findings Register.
 * A GRC audit findings register: 18 severity-coloured finding cards, each with a badge, heading, and remediation steps, paginating cleanly across pages.
 * Build with generate(); export with await doc.generateBytesAsync().
 */
// Compliance Findings Register
//
// A compliance / audit findings register - the kind of report a GRC, audit, or
// security-assessment platform produces (see the "Audit, compliance, ESG" and
// "risk register" markets). Each finding is a severity-coloured Container card
// built from a HorizontalStack (severity badge + heading/description), and the
// whole register is an accessible, archival PDF/A-2a + PDF/UA-1 document.
// Authored through the options-object front door.

import {
  Document,
  TextBlock,
  TextElementBase,
  VerticalStack,
  HorizontalStack,
  Container,
  Heading,
  SectionLink,
  PageNumberOf,
  ColorPalette,
  StandardFonts,
  type ColorInput,
  pageTemplate,
} from '@bonniepdf/core';

// Badge is 700, not 600: white bold 9pt text on orange/amber/green 600 falls to
// 3.20-3.60:1 against the 4.5:1 WCAG AA threshold. 700 clears it on all three
// (red[600] already did, so it stays). Tint/border are unaffected.
const SEVERITY_STYLE: Record<Severity, { label: string; badge: ColorInput; tint: ColorInput; border: ColorInput }> = {
  Critical: {
    label: 'CRITICAL',
    badge: ColorPalette.red[600],
    tint: ColorPalette.red[50],
    border: ColorPalette.red[200],
  },
  High: {
    label: 'HIGH',
    badge: ColorPalette.orange[700],
    tint: ColorPalette.orange[50],
    border: ColorPalette.orange[200],
  },
  Medium: {
    label: 'MEDIUM',
    badge: ColorPalette.amber[700],
    tint: ColorPalette.amber[50],
    border: ColorPalette.amber[200],
  },
  Low: { label: 'LOW', badge: ColorPalette.slate[500], tint: ColorPalette.slate[50], border: ColorPalette.slate[200] },
  Resolved: {
    label: 'RESOLVED',
    badge: ColorPalette.green[700],
    tint: ColorPalette.green[50],
    border: ColorPalette.green[200],
  },
};

const FINDINGS: Finding[] = [
  {
    id: 'F-001',
    category: 'Access Control',
    severity: 'Critical',
    title: 'Shared administrator credentials',
    description:
      'A single administrator account is shared across three regional teams with no individual accountability. Recommend provisioning named accounts and enforcing MFA before the next audit cycle.',
  },
  {
    id: 'F-002',
    category: 'Data Encryption',
    severity: 'High',
    title: 'Unencrypted database backups',
    description:
      'Nightly database backups are written to object storage without server-side encryption. Recommend enabling encryption at rest and rotating the affected snapshots.',
    related: 'F-011',
  },
  {
    id: 'F-003',
    category: 'Password Policy',
    severity: 'Medium',
    title: 'Password rotation exceeds policy window',
    description:
      'Twelve service accounts have not rotated credentials within the 90-day policy window. Recommend automating rotation via the secrets manager already in use elsewhere.',
  },
  {
    id: 'F-004',
    category: 'Documentation',
    severity: 'Low',
    title: 'Runbook references a retired endpoint',
    description:
      'The incident-response runbook still references a monitoring endpoint decommissioned in the last infrastructure migration. Recommend a documentation pass at the next sprint review.',
  },
  {
    id: 'F-005',
    category: 'Incident Response',
    severity: 'Resolved',
    title: 'On-call escalation gap closed',
    description:
      'The previously reported gap between the paging tool and the secondary on-call rota has been closed. Verified against two live incidents since remediation.',
  },
  {
    id: 'F-006',
    category: 'Vendor Management',
    severity: 'Critical',
    title: 'Sub-processor missing a signed DPA',
    description:
      'A newly onboarded analytics sub-processor is receiving customer data without an executed data-processing agreement. Recommend suspending the data feed until the DPA is signed.',
  },
  {
    id: 'F-007',
    category: 'Network Segmentation',
    severity: 'High',
    title: 'Flat network between staging and production',
    description:
      'Staging hosts can reach production database ports directly. Recommend segmenting the two environments with dedicated security groups and removing the shared routing table.',
  },
  {
    id: 'F-008',
    category: 'Change Management',
    severity: 'Medium',
    title: 'Emergency changes lack retrospective sign-off',
    description:
      'Four of the last twenty emergency changes were merged without a documented post-hoc review. Recommend adding a mandatory 48-hour retrospective step to the change template.',
  },
  {
    id: 'F-009',
    category: 'Physical Security',
    severity: 'Low',
    title: 'Visitor log retained past policy',
    description:
      'The reception visitor log for the secondary office is retained for eighteen months against a twelve-month policy. Recommend aligning the retention job with the documented schedule.',
  },
  {
    id: 'F-010',
    category: 'Employee Training',
    severity: 'Resolved',
    title: 'Security-awareness completion below target',
    description:
      'Completion of the annual security-awareness course has risen from 74% to 98% following the reminder campaign. No further action required this cycle.',
  },
  {
    id: 'F-011',
    category: 'Data Retention',
    severity: 'Critical',
    title: 'Deletion requests not propagating to backups',
    description:
      'Right-to-erasure requests are honoured in the primary database but not in long-term backup archives. Recommend extending the deletion workflow to cover archived snapshots.',
    related: 'F-002',
  },
  {
    id: 'F-012',
    category: 'Access Reviews',
    severity: 'High',
    title: 'Quarterly access review overdue',
    description:
      'The Q2 access review for the billing system was not completed; twelve accounts with elevated privileges have not been re-certified. Recommend closing the backlog before Q3 begins.',
    related: 'F-001',
  },
  {
    id: 'F-013',
    category: 'Business Continuity',
    severity: 'Medium',
    title: 'Failover runbook untested this year',
    description:
      'The documented regional failover procedure has not been exercised since last year’s audit. Recommend scheduling a tabletop or live failover drill this quarter.',
  },
  {
    id: 'F-014',
    category: 'Asset Inventory',
    severity: 'Low',
    title: 'Decommissioned laptops pending wipe confirmation',
    description:
      'Nine decommissioned laptops are awaiting certificate-of-destruction confirmation from the disposal vendor. Recommend following up before the next inventory reconciliation.',
  },
  {
    id: 'F-015',
    category: 'Authentication',
    severity: 'Resolved',
    title: 'Multi-factor authentication now enforced org-wide',
    description:
      'MFA is now enforced for all workforce accounts, including the previously exempted contractor group. Verified via the identity provider’s enforcement report.',
  },
  {
    id: 'F-016',
    category: 'Third-Party Risk',
    severity: 'High',
    title: 'Vendor risk assessments twelve months stale',
    description:
      'Risk assessments for three critical vendors have not been refreshed in over a year. Recommend prioritising re-assessment for vendors with direct production access.',
    related: 'F-006',
  },
  {
    id: 'F-017',
    category: 'Audit Logging',
    severity: 'Medium',
    title: 'Administrative actions not centrally logged',
    description:
      'Administrative actions taken directly in the cloud console are not forwarded to the central log store. Recommend enabling the provider’s management-event log export.',
  },
  {
    id: 'F-018',
    category: 'Endpoint Protection',
    severity: 'Critical',
    title: 'Endpoint agent disabled on finance workstations',
    description:
      'The endpoint-protection agent was found disabled on two finance-team workstations for eleven days. Recommend re-enabling immediately and reviewing the tamper-protection policy.',
  },
];

export function generate(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 11, color: ColorPalette.slate[700] },
      footerTemplate: pageTemplate({
        default: new TextBlock(`Page ${TextElementBase.CurrentPageToken} of ${TextElementBase.TotalPagesToken}`, {
          fontName: StandardFonts.Helvetica,
          fontSize: 9,
          color: ColorPalette.slate[400],
          alignment: 'right',
        }),
      }),
    },
    metadata: {
      title: 'Compliance Findings Register',
      author: 'BonniePDF',
      subject: 'An accessible PDF/A-2a + PDF/UA-1 compliance findings register.',
      keywords: 'pdf, accessibility, compliance, audit, findings register, GRC, BonniePDF',
    },
  });

  doc.add(
    new Heading('Compliance Findings Register', {
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 22,
      color: ColorPalette.slate[800],
      margin: { bottom: 10 },
    })
  );

  doc.add(
    new TextBlock(
      'Findings from the quarterly security and compliance review, ordered by identifier and colour-coded by severity. Each entry records the affected control category, a summary, and the recommended remediation.',
      { margin: { bottom: 16 } }
    )
  );

  // Executive summary: a clickable index of the Critical findings, each showing
  // the live page number where the detail card lands (resolved by two-pass
  // layout). This is the "jump to detail" pattern real audit reports lead with.
  const critical = FINDINGS.filter(f => f.severity === 'Critical');
  doc.add(priorityActions(critical));

  const register = new VerticalStack();
  for (const finding of FINDINGS) {
    register.add(findingCard(finding));
  }
  doc.add(register);

  return doc;
}

// Local helpers and sample types used by this document.

interface Finding {
  id: string;
  category: string;
  severity: Severity;
  title: string;
  description: string;
  /** Optional related finding id, rendered as a clickable "see F-XXX (page N)" cross-reference. */
  related?: string;
}

type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Resolved';

/** Normalises a finding id (e.g. "F-011") into its anchor/toc key ("f-011"). */
function anchorFor(id: string): string {
  return id.toLowerCase();
}

function findingCard(finding: Finding): Container {
  const style = SEVERITY_STYLE[finding.severity];

  const body = new VerticalStack({
    spacing: 3,
    children: [
      new Heading(`${finding.id} - ${finding.title}`, {
        tocIdentifier: anchorFor(finding.id),
        // anchorId makes this finding a cross-reference target for the Priority
        // Actions summary and any "Related" links - resolved to a live page
        // number by two-pass layout, independent of tocIdentifier's
        // table-of-contents role.
        anchorId: anchorFor(finding.id),
        level: 2,
        fontName: StandardFonts.HelveticaBold,
        fontSize: 12,
        color: ColorPalette.slate[800],
      }),
      new TextBlock(finding.category, {
        fontName: StandardFonts.HelveticaBold,
        fontSize: 9,
        // 600, not 500: this card always sits on a coloured tint (red/orange-50),
        // and 500 falls to 4.35-4.49:1 against the 4.5:1 WCAG AA threshold there.
        color: ColorPalette.slate[600],
      }),
      new TextBlock(finding.description, { fontSize: 10.5, color: ColorPalette.slate[700] }),
    ],
  });

  // Optional "Related: F-XXX (page N)" cross-reference - a clickable SectionLink
  // to the related finding plus its resolved page number, on one row.
  if (finding.related != null) {
    const relatedLabel = new TextBlock('Related:', {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 9,
      color: ColorPalette.slate[600],
    });
    const relatedLink = new SectionLink(finding.related, anchorFor(finding.related), {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 9,
      color: ColorPalette.blue[700],
    });
    const onPage = new TextBlock('on page', { fontSize: 9, color: ColorPalette.slate[600] });
    const relatedPage = new PageNumberOf(anchorFor(finding.related), {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 9,
      color: ColorPalette.slate[600],
    });

    const relatedRow = new HorizontalStack({ spacing: 4, margin: { top: 4 } });
    relatedRow.add(relatedLabel, relatedLabel.getPreferredWidth());
    relatedRow.add(relatedLink, relatedLink.getPreferredWidth());
    relatedRow.add(onPage, onPage.getPreferredWidth());
    relatedRow.add(relatedPage);

    body.add(relatedRow);
  }

  const badge = new Container({
    width: 78,
    padding: [6, 4],
    backgroundColor: style.badge,
    cornerRadius: 4,
    child: new TextBlock(style.label, {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 9,
      color: '#ffffff',
      alignment: 'center',
    }),
  });

  const row = new HorizontalStack({ spacing: 12, widthDistribution: 'weighted' });
  row.add(badge);
  row.add(body, 1);

  return new Container({
    child: row,
    padding: 12,
    backgroundColor: style.tint,
    cornerRadius: 8,
    border: { width: 1, color: style.border },
    margin: { bottom: 10 },
  });
}

/**
 * Builds the "Priority Actions" callout: a bordered card listing every Critical
 * finding as a clickable {@link SectionLink} to its detail card, followed by the
 * page it lands on via {@link PageNumberOf}. Both resolve during two-pass layout,
 * so the summary stays correct no matter how the cards paginate.
 */
function priorityActions(critical: Finding[]): Container {
  const inner = new VerticalStack({ spacing: 4 });

  inner.add(
    new Heading('Priority Actions', {
      tocIdentifier: 'priority-actions',
      anchorId: 'priority-actions',
      level: 2,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 13,
      color: ColorPalette.red[800],
      margin: { bottom: 2 },
    })
  );

  inner.add(
    new TextBlock(`${critical.length} critical findings require immediate remediation:`, {
      fontSize: 10,
      color: ColorPalette.slate[600],
      margin: { bottom: 4 },
    })
  );

  for (const finding of critical) {
    const link = new SectionLink(`${finding.id} - ${finding.title}`, anchorFor(finding.id), {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 10,
      color: ColorPalette.blue[700],
    });
    const onPage = new TextBlock('page', { fontSize: 10, color: ColorPalette.slate[600] });
    const page = new PageNumberOf(anchorFor(finding.id), {
      fontName: StandardFonts.HelveticaBold,
      fontSize: 10,
      color: ColorPalette.slate[700],
    });

    const row = new HorizontalStack({ spacing: 4, margin: { bottom: 2 } });
    row.add(link, link.getPreferredWidth());
    row.add(onPage, onPage.getPreferredWidth());
    row.add(page);
    inner.add(row);
  }

  return new Container({
    child: inner,
    padding: 12,
    backgroundColor: ColorPalette.red[50],
    cornerRadius: 8,
    border: { width: 1, color: ColorPalette.red[200] },
    margin: { bottom: 16 },
  });
}
