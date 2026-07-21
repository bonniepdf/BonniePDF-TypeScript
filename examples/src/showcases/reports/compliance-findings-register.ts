import {
  Document,
  DocumentSettings,
  DocumentMetadata,
  AccessibilityMode,
  TextBlock,
  TextStyle,
  TextAlignment,
  TextElementBase,
  VerticalStack,
  HorizontalStack,
  Container,
  Heading,
  SectionLink,
  PageNumberOf,
  Color,
  ColorPalette,
  Border,
  BorderColors,
  Thickness,
  StandardFonts,
  WidthDistribution,
  PdfAConformance,
} from '@bonniepdf/core';

/**
 * A compliance / audit findings register - the kind of report a GRC, audit, or
 * security-assessment platform produces (see the "Audit, compliance, ESG" and
 * "risk register" markets). Each finding is a severity-coloured Container card
 * built from a HorizontalStack (severity badge + heading/description), and the
 * whole register is an accessible, archival PDF/A-2a + PDF/UA-1 document.
 */
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

const SEVERITY_STYLE: Record<Severity, { label: string; badge: Color; tint: Color; border: Color }> = {
  Critical: {
    label: 'CRITICAL',
    badge: ColorPalette.red[600],
    tint: ColorPalette.red[50],
    border: ColorPalette.red[200],
  },
  High: {
    label: 'HIGH',
    badge: ColorPalette.orange[600],
    tint: ColorPalette.orange[50],
    border: ColorPalette.orange[200],
  },
  Medium: {
    label: 'MEDIUM',
    badge: ColorPalette.amber[600],
    tint: ColorPalette.amber[50],
    border: ColorPalette.amber[200],
  },
  Low: { label: 'LOW', badge: ColorPalette.slate[500], tint: ColorPalette.slate[50], border: ColorPalette.slate[200] },
  Resolved: {
    label: 'RESOLVED',
    badge: ColorPalette.green[600],
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

/** Normalises a finding id (e.g. "F-011") into its anchor/toc key ("f-011"). */
function anchorFor(id: string): string {
  return id.toLowerCase();
}

function findingCard(finding: Finding): Container {
  const style = SEVERITY_STYLE[finding.severity];

  const badge = new Container();
  badge.width = 78;
  badge.padding = new Thickness(6, 4, 6, 4);
  badge.backgroundColor = style.badge;
  badge.cornerRadius = 4;
  const badgeText = new TextBlock(style.label);
  badgeText.fontName = StandardFonts.HelveticaBold;
  badgeText.fontSize = 9;
  badgeText.textColor = Color.white;
  badgeText.alignment = TextAlignment.Center;
  badge.child = badgeText;

  const body = new VerticalStack();
  body.spacing = 3;

  const heading = new Heading(`${finding.id} - ${finding.title}`);
  heading.tocIdentifier = anchorFor(finding.id);
  // anchorId makes this finding a cross-reference target for the Priority Actions
  // summary and any "Related" links - resolved to a live page number by two-pass
  // layout, independent of tocIdentifier's table-of-contents role.
  heading.anchorId = anchorFor(finding.id);
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 12;
  heading.textColor = ColorPalette.slate[800];
  body.addChild(heading);

  const category = new TextBlock(finding.category);
  category.fontName = StandardFonts.HelveticaBold;
  category.fontSize = 9;
  category.textColor = ColorPalette.slate[500];
  body.addChild(category);

  const description = new TextBlock(finding.description);
  description.fontSize = 10.5;
  description.textColor = ColorPalette.slate[700];
  body.addChild(description);

  // Optional "Related: F-XXX (page N)" cross-reference - a clickable SectionLink
  // to the related finding plus its resolved page number, on one row.
  if (finding.related != null) {
    const relatedRow = new HorizontalStack();
    relatedRow.spacing = 4;
    relatedRow.margin = new Thickness(0, 4, 0, 0);

    const relatedLabel = new TextBlock('Related:');
    relatedLabel.fontName = StandardFonts.HelveticaBold;
    relatedLabel.fontSize = 9;
    relatedLabel.textColor = ColorPalette.slate[500];
    relatedRow.addChild(relatedLabel, relatedLabel.getPreferredWidth());

    const relatedLink = new SectionLink(finding.related, anchorFor(finding.related));
    relatedLink.fontName = StandardFonts.HelveticaBold;
    relatedLink.fontSize = 9;
    relatedLink.textColor = ColorPalette.blue[700];
    relatedRow.addChild(relatedLink, relatedLink.getPreferredWidth());

    const onPage = new TextBlock('on page');
    onPage.fontSize = 9;
    onPage.textColor = ColorPalette.slate[500];
    relatedRow.addChild(onPage, onPage.getPreferredWidth());

    const relatedPage = new PageNumberOf(anchorFor(finding.related));
    relatedPage.fontName = StandardFonts.HelveticaBold;
    relatedPage.fontSize = 9;
    relatedPage.textColor = ColorPalette.slate[600];
    relatedRow.addChild(relatedPage);

    body.addChild(relatedRow);
  }

  const row = new HorizontalStack();
  row.spacing = 12;
  row.widthDistribution = WidthDistribution.Weighted;
  row.addChild(badge);
  row.addChild(body, 1);

  const card = new Container();
  card.child = row;
  card.padding = new Thickness(12);
  card.backgroundColor = style.tint;
  card.cornerRadius = 8;
  card.border = new Border(1);
  card.borderColors = new BorderColors(style.border);
  card.margin = new Thickness(0, 0, 0, 10);
  return card;
}

/**
 * Builds the "Priority Actions" callout: a bordered card listing every Critical
 * finding as a clickable {@link SectionLink} to its detail card, followed by the
 * page it lands on via {@link PageNumberOf}. Both resolve during two-pass layout,
 * so the summary stays correct no matter how the cards paginate.
 */
function priorityActions(critical: Finding[]): Container {
  const inner = new VerticalStack();
  inner.spacing = 4;

  const heading = new Heading('Priority Actions');
  heading.tocIdentifier = 'priority-actions';
  heading.anchorId = 'priority-actions';
  heading.level = 2;
  heading.fontName = StandardFonts.HelveticaBold;
  heading.fontSize = 13;
  heading.textColor = ColorPalette.red[800];
  heading.margin = new Thickness(0, 0, 0, 2);
  inner.addChild(heading);

  const lead = new TextBlock(`${critical.length} critical findings require immediate remediation:`);
  lead.fontSize = 10;
  lead.textColor = ColorPalette.slate[600];
  lead.margin = new Thickness(0, 0, 0, 4);
  inner.addChild(lead);

  for (const finding of critical) {
    const row = new HorizontalStack();
    row.spacing = 4;
    row.margin = new Thickness(0, 0, 0, 2);

    const link = new SectionLink(`${finding.id} - ${finding.title}`, anchorFor(finding.id));
    link.fontName = StandardFonts.HelveticaBold;
    link.fontSize = 10.5;
    link.textColor = ColorPalette.blue[700];
    row.addChild(link, link.getPreferredWidth());

    const onPage = new TextBlock('page');
    onPage.fontSize = 10;
    onPage.textColor = ColorPalette.slate[500];
    row.addChild(onPage, onPage.getPreferredWidth());

    const page = new PageNumberOf(anchorFor(finding.id));
    page.fontName = StandardFonts.HelveticaBold;
    page.fontSize = 10;
    page.textColor = ColorPalette.slate[700];
    row.addChild(page);

    inner.addChild(row);
  }

  const card = new Container();
  card.child = inner;
  card.padding = new Thickness(12);
  card.backgroundColor = ColorPalette.red[50];
  card.cornerRadius = 8;
  card.border = new Border(1);
  card.borderColors = new BorderColors(ColorPalette.red[200]);
  card.margin = new Thickness(0, 0, 0, 16);
  return card;
}

export function generate(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(11).withColor(ColorPalette.slate[700]);

  settings.footerTemplate = (pageNumber: number): TextBlock => {
    const b = new TextBlock(`Page ${pageNumber} of ${TextElementBase.TotalPagesToken}`);
    b.fontName = StandardFonts.Helvetica;
    b.fontSize = 9;
    b.textColor = ColorPalette.slate[400];
    b.alignment = TextAlignment.Right;
    return b;
  };

  const metadata = new DocumentMetadata();
  metadata.title = 'Compliance Findings Register';
  metadata.author = 'BonniePDF';
  metadata.subject = 'An accessible PDF/A-2a + PDF/UA-1 compliance findings register.';
  metadata.keywords = 'pdf, accessibility, compliance, audit, findings register, GRC, BonniePDF';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Compliance Findings Register');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 22;
  h1.textColor = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 10);
  doc.add(h1);

  const intro = new TextBlock(
    'Findings from the quarterly security and compliance review, ordered by identifier and colour-coded by severity. Each entry records the affected control category, a summary, and the recommended remediation.'
  );
  intro.margin = new Thickness(0, 0, 0, 16);
  doc.add(intro);

  // Executive summary: a clickable index of the Critical findings, each showing
  // the live page number where the detail card lands (resolved by two-pass
  // layout). This is the "jump to detail" pattern real audit reports lead with.
  const critical = FINDINGS.filter(f => f.severity === 'Critical');
  doc.add(priorityActions(critical));

  const register = new VerticalStack();
  for (const finding of FINDINGS) {
    register.addChild(findingCard(finding));
  }
  doc.add(register);

  return doc;
}
