// ---------------------------------------------------------------------------
// Accessibility / compliance preflight.
//
// A pure evaluator that walks an enriched {@link LayoutSnapshot} — the tree the
// LayoutRecorder captures during a render pass, carrying each element's intrinsic
// accessibility facts ({@link NodeAccessibility}) plus document-level context
// ({@link SnapshotMeta}) — and reports per-element findings against the PDF/UA-1
// rules (ISO 14289-1).
//
// Because BonniePDF *generates* the document, it knows the semantics of every element at authoring time
// and can tell an author *which element on which page* is inaccessible and how to fix it —
// before the PDF is even written. External validators (veraPDF) can only inspect a
// finished file, and crucially they *pass* image-like content that silently fell
// back to `/Artifact` for want of alt text; this evaluator flags exactly that.
//
// The evaluator is deterministic, side-effect-free, and dependency-light (it reads
// only the snapshot). The .NET implementation mirrors it against the shared spec
// (BonniePDF/the specification) and shared fixtures.
// ---------------------------------------------------------------------------

import type { LayoutNode, LayoutSnapshot, NodeAccessibility } from '../Rendering/LayoutRecorder';

/** Severity of a compliance finding, most-severe first. */
export enum ComplianceSeverity {
  /** A PDF/UA-1 requirement is violated; the document is not conformant. */
  Error = 'error',
  /** Likely-inaccessible authoring the spec strongly discourages. */
  Warning = 'warning',
  /** Advisory context (e.g. the document opted out of tagging entirely). */
  Info = 'info',
}

/** One reported accessibility/compliance issue, resolved to an element when applicable. */
export interface ComplianceFinding {
  /** Stable rule identifier, e.g. `"figure-missing-alt"`. */
  code: string;
  severity: ComplianceSeverity;
  /** The standard the rule derives from. Currently always `"PDF/UA-1"`. */
  standard: string;
  /** Spec clause citation, e.g. `"ISO 14289-1:2014 §7.3"`. */
  clause: string;
  /** Human-readable, author-facing description of the problem. */
  message: string;
  /** How to fix it, phrased as an authoring action. */
  fixHint?: string;
  /** The snapshot node this finding is anchored to; omitted for document-level findings. */
  nodeId?: string;
  /** The element's resolved role, when node-scoped. */
  role?: string;
  /** 0-based page index of the element's first rectangle, for navigation. */
  page?: number;
}

/** The result of evaluating a snapshot. */
export interface ComplianceReport {
  /** Findings, ordered document-level first, then in document order. */
  findings: ComplianceFinding[];
  /** True when there are no {@link ComplianceSeverity.Error} findings. */
  passed: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

/** ISO 14289-1 (PDF/UA-1). */
const UA = 'PDF/UA-1';

/**
 * Evaluates a layout snapshot against the PDF/UA-1 accessibility rules and
 * returns a per-element report. Pure and deterministic.
 *
 * The rules are checked *unconditionally* (independent of whether the document
 * opted into `AccessibilityMode.PdfUa1`), so the report answers "is this document
 * accessible, and if not, where?" for any document. When the document did not opt
 * into tagging, a single document-level {@link ComplianceSeverity.Info} finding
 * frames the rest as advisory rather than hard violations.
 */
export function evaluateCompliance(snapshot: LayoutSnapshot): ComplianceReport {
  const findings: ComplianceFinding[] = [];
  const meta = snapshot.meta;
  const tagged = (meta?.accessibilityMode ?? 0) !== 0;

  // ── Document-level findings ────────────────────────────────────────────────
  if (!tagged) {
    findings.push({
      code: 'doc-not-tagged',
      severity: ComplianceSeverity.Info,
      standard: UA,
      clause: 'ISO 14289-1:2014 §5',
      message:
        'Document is not tagged (AccessibilityMode.None). It carries no structure ' +
        'tree, so assistive technology cannot interpret its reading order. The ' +
        'findings below show what accessible authoring would require.',
      fixHint: 'Set settings.accessibility = AccessibilityMode.PdfUa1 to emit a tagged PDF.',
    });
  }

  if (!meta?.language) {
    findings.push({
      code: 'doc-lang-missing',
      severity: tagged ? ComplianceSeverity.Error : ComplianceSeverity.Warning,
      standard: UA,
      clause: 'ISO 14289-1:2014 §7.2',
      message:
        'The document does not declare what language it is written in. Screen readers cannot ' +
        'choose the right pronunciation rules for the text.',
      fixHint: 'Set settings.language to a BCP-47 tag, e.g. "en-GB".',
    });
  }

  if (!meta?.title) {
    findings.push({
      code: 'doc-title-missing',
      severity: tagged ? ComplianceSeverity.Error : ComplianceSeverity.Warning,
      standard: UA,
      clause: 'ISO 14289-1:2014 §7.1',
      message:
        'The document has no title in its metadata. PDF/UA requires a title and that ' +
        'viewers display it instead of the file name.',
      fixHint: 'Set the document metadata title (doc.metadata.title).',
    });
  }

  // ── Node walk (document order, pre-order DFS) ──────────────────────────────
  let headingCount = 0;
  let lastHeadingLevel = 0;

  const visit = (node: LayoutNode): void => {
    const a11y = node.a11y;
    if (a11y) {
      checkFigure(node, a11y, findings);
      if (a11y.headingLevel) {
        headingCount++;
        checkHeadingOrder(node, a11y, a11y.headingLevel, headingCount, lastHeadingLevel, findings);
        lastHeadingLevel = a11y.headingLevel;
      }
      if (a11y.role === 'Table') checkTableHeaders(node, findings);
    }
    for (const child of node.children) visit(child);
  };
  visit(snapshot.root);

  if (headingCount === 0 && hasContent(snapshot.root)) {
    findings.push({
      code: 'doc-no-headings',
      severity: ComplianceSeverity.Info,
      standard: UA,
      clause: 'ISO 14289-1:2014 §7.4',
      message:
        'The document contains no headings. Headings give assistive-technology users ' +
        'a navigable outline of the content.',
      fixHint: 'Use heading() elements to structure the document.',
    });
  }

  const errorCount = findings.filter(f => f.severity === ComplianceSeverity.Error).length;
  const warningCount = findings.filter(f => f.severity === ComplianceSeverity.Warning).length;
  const infoCount = findings.filter(f => f.severity === ComplianceSeverity.Info).length;

  return { findings, passed: errorCount === 0, errorCount, warningCount, infoCount };
}

/** First page a node touches, for navigation on a finding. */
function pageOf(node: LayoutNode): number | undefined {
  return node.rects[0]?.page;
}

/**
 * Image-like content (Image, QR code, barcode, …) that fell back to `/Artifact`
 * for want of alt text is invisible to assistive tech — and external validators
 * pass it silently. This is the highest-value rule in the set.
 */
function checkFigure(node: LayoutNode, a11y: NodeAccessibility, out: ComplianceFinding[]): void {
  if (!a11y.imageLike) return;
  if (a11y.artifact && !a11y.decorative) {
    out.push({
      code: 'figure-missing-alt',
      severity: ComplianceSeverity.Error,
      standard: UA,
      clause: 'ISO 14289-1:2014 §7.3',
      message:
        `${node.type} has no alternate text, so it is exported as an artifact and ` +
        'assistive technology will skip it entirely.',
      fixHint: "Set the element's altText to describe it, or mark it decorative if it conveys no meaning.",
      nodeId: node.id,
      role: a11y.role,
      page: pageOf(node),
    });
  } else if (a11y.role === 'Figure' && !a11y.alt) {
    // A tagged Figure that reached the tree without /Alt (defensive: BonniePDF
    // normally demotes these to Artifact, but a custom role provider might not).
    out.push({
      code: 'figure-missing-alt',
      severity: ComplianceSeverity.Error,
      standard: UA,
      clause: 'ISO 14289-1:2014 §7.3',
      message: `${node.type} is tagged as a figure but has no alternative text.`,
      fixHint: "Set the element's altText.",
      nodeId: node.id,
      role: a11y.role,
      page: pageOf(node),
    });
  }
}

/**
 * Headings must not skip levels (H1→H3) and the outline should open at H1.
 * Skipping breaks the navigable structure assistive-tech users rely on.
 */
function checkHeadingOrder(
  node: LayoutNode,
  a11y: NodeAccessibility,
  level: number,
  ordinal: number,
  lastLevel: number,
  out: ComplianceFinding[]
): void {
  if (ordinal === 1) {
    if (level !== 1) {
      out.push({
        code: 'heading-first-not-h1',
        severity: ComplianceSeverity.Warning,
        standard: UA,
        clause: 'ISO 14289-1:2014 §7.4',
        message: `The first heading is ${a11y.role}, not H1; a document outline should begin at H1.`,
        fixHint: 'Start the heading hierarchy at level 1.',
        nodeId: node.id,
        role: a11y.role,
        page: pageOf(node),
      });
    }
    return;
  }
  if (level > lastLevel + 1) {
    out.push({
      code: 'heading-skip',
      severity: ComplianceSeverity.Warning,
      standard: UA,
      clause: 'ISO 14289-1:2014 §7.4',
      message: `Heading level jumps from H${lastLevel} to ${a11y.role}, skipping a level.`,
      fixHint: `Use H${lastLevel + 1} here, or add the intermediate heading level.`,
      nodeId: node.id,
      role: a11y.role,
      page: pageOf(node),
    });
  }
}

/** A data table with no header cells (TH) cannot be navigated by assistive tech. */
function checkTableHeaders(table: LayoutNode, out: ComplianceFinding[]): void {
  if (hasRole(table, 'TH')) return;
  out.push({
    code: 'table-no-header',
    severity: ComplianceSeverity.Warning,
    standard: UA,
    clause: 'ISO 14289-1:2014 §7.5',
    message: 'Table has no header cells (TH); screen readers cannot associate data cells with headers.',
    fixHint: 'Mark the header row/column cells as headers (e.g. Table.addHeaderRow / cell.isHeader).',
    nodeId: table.id,
    role: 'Table',
    page: pageOf(table),
  });
}

/** True when any descendant node carries the given role. */
function hasRole(node: LayoutNode, role: string): boolean {
  for (const child of node.children) {
    if (child.a11y?.role === role) return true;
    if (hasRole(child, role)) return true;
  }
  return false;
}

/** True when the tree contains at least one role-bearing (content) node. */
function hasContent(node: LayoutNode): boolean {
  for (const child of node.children) {
    if (child.a11y) return true;
    if (hasContent(child)) return true;
  }
  return false;
}
