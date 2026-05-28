/**
 * PDF structure-element role. Maps directly to one of the standard
 * structure types in ISO 32000-1 §14.8.4 (grouping, headings,
 * paragraph, list, table, inline, illustration, navigation, and
 * artifact).
 *
 * String form via {@link toPdfTag} is the value that appears in PDF
 * dictionaries (the leading `/` is added by the writer, not stored
 * here).
 */
export enum SemanticRole {
  // ── Grouping elements (ISO 32000-1 §14.8.4.2) ────────────────────
  /** Document — top-level grouping element. The builder auto-creates a Document root. */
  Document = 'Document',
  /** Sect — a section. */
  Sect = 'Sect',
  /** Art — an article. */
  Art = 'Art',
  /** Div — a generic division. */
  Div = 'Div',
  /** BlockQuote — a block quotation. */
  BlockQuote = 'BlockQuote',
  /** Caption — caption associated with a Figure / Formula / Form / Table. */
  Caption = 'Caption',
  /** TOC — table of contents container. */
  TOC = 'TOC',
  /** TOCI — a single TOC item. */
  TOCI = 'TOCI',
  /** Index — a structured index. */
  Index = 'Index',

  // ── Heading and paragraph-like (ISO 32000-1 §14.8.4.3) ───────────
  /** H — generic heading (level inferred from context). */
  H = 'H',
  /** H1 — heading level 1. */
  H1 = 'H1',
  /** H2 — heading level 2. */
  H2 = 'H2',
  /** H3 — heading level 3. */
  H3 = 'H3',
  /** H4 — heading level 4. */
  H4 = 'H4',
  /** H5 — heading level 5. */
  H5 = 'H5',
  /** H6 — heading level 6. */
  H6 = 'H6',
  /** P — paragraph. */
  P = 'P',

  // ── List (ISO 32000-1 §14.8.4.3) ─────────────────────────────────
  /** L — a list. */
  L = 'L',
  /** LI — a list item (the row). */
  LI = 'LI',
  /** Lbl — a list item label (bullet, number, …). */
  Lbl = 'Lbl',
  /** LBody — a list item body (the content of the item). */
  LBody = 'LBody',

  // ── Tables (ISO 32000-1 §14.8.4.3) ───────────────────────────────
  /** Table — table grouping. */
  Table = 'Table',
  /** TR — table row. */
  TR = 'TR',
  /** TH — table header cell. */
  TH = 'TH',
  /** TD — table data cell. */
  TD = 'TD',
  /** THead — table header section. */
  THead = 'THead',
  /** TBody — table body section. */
  TBody = 'TBody',
  /** TFoot — table footer section. */
  TFoot = 'TFoot',

  // ── Inline (ISO 32000-1 §14.8.4.4) ───────────────────────────────
  /** Span — generic inline grouping. */
  Span = 'Span',
  /** Quote — inline quotation. */
  Quote = 'Quote',
  /** Note — footnote or endnote. */
  Note = 'Note',
  /** Reference — cross-reference. */
  Reference = 'Reference',
  /** BibEntry — bibliography entry. */
  BibEntry = 'BibEntry',
  /** Code — inline code or computer output. */
  Code = 'Code',
  /**
   * Link — hyperlink wrapper. Used around the visible link text; the
   * actual `/Link` annotation references this structure element via
   * `/OBJR`.
   */
  Link = 'Link',
  /** Annot — generic annotation reference. */
  Annot = 'Annot',

  // ── Illustration (ISO 32000-1 §14.8.4.5) ─────────────────────────
  /** Figure — an illustration / image. */
  Figure = 'Figure',
  /** Formula — a mathematical formula. */
  Formula = 'Formula',
  /** Form — a form widget. */
  Form = 'Form',

  // ── Non-content ──────────────────────────────────────────────────
  /**
   * Artifact — content that is not part of the logical document order
   * (page headers, footers, watermarks, decorative borders). Required
   * by PDF/UA for any drawn content that is not otherwise tagged.
   */
  Artifact = 'Artifact',
}

/**
 * Returns the PDF tag name for the role (e.g. `"H1"`, `"Figure"`).
 * The leading `/` is added by the writer when the tag is emitted as a
 * PDF name object.
 */
export function toPdfTag(role: SemanticRole): string {
  // The enum values match the PDF spec exactly for every entry, so
  // the value is the tag. Function form mirrors the .NET extension
  // method and gives one place to land future spec aliases.
  return role;
}

/**
 * Returns true for grouping/container roles whose content-stream marker
 * should be a plain `BMC` (no MCID), as their structure-tree children —
 * not direct MCIDs — carry the content references.
 *
 * ISO 32000-1 §14.7.2: a structure element may contain other structure
 * elements without any MCID of its own. Emitting nested BDC/MCID pairs
 * for containers causes "Nested MCID" warnings in veraPDF.
 */
export function isContainerRole(role: SemanticRole): boolean {
  switch (role) {
    case SemanticRole.Table:
    case SemanticRole.TR:
    case SemanticRole.THead:
    case SemanticRole.TBody:
    case SemanticRole.TFoot:
    case SemanticRole.Document:
    case SemanticRole.Sect:
    case SemanticRole.Art:
    case SemanticRole.Div:
    case SemanticRole.TOC:
    case SemanticRole.L:
    case SemanticRole.LI:
      return true;
    default:
      return false;
  }
}
