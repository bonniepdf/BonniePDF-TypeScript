import { SemanticRole, toPdfTag } from './SemanticRole';
import type { IStructureVisitor } from './IStructureVisitor';

/**
 * A node in the PDF structure tree. Carries a {@link SemanticRole}, a
 * parent reference, an ordered list of children, and the list of
 * marked-content identifiers (MCIDs) this element claims from the
 * content stream.
 *
 * Optional metadata ({@link alt}, {@link actualText}, {@link lang},
 * {@link title}) is written into the PDF structure dictionary when set.
 */
export class StructureElement {
  /** The semantic role (PDF tag) for this element. */
  public readonly role: SemanticRole;

  /**
   * The parent structure element. `undefined` only on the document
   * root.
   */
  public parent?: StructureElement;

  /** Child structure elements in document order. */
  public readonly children: StructureElement[] = [];

  /**
   * Marked-content identifiers (MCIDs) for content runs that belong
   * to this structure element. Populated by the canvas as text and
   * images are drawn inside an open structure element.
   */
  public readonly mcIds: number[] = [];

  /**
   * `/Alt` alternate text — read by assistive tech in place of the
   * visible content. Required by PDF/UA on {@link SemanticRole.Figure}
   * elements that aren't {@link SemanticRole.Artifact}.
   */
  public alt?: string;

  /**
   * `/ActualText` — the literal text equivalent of the rendered
   * content. Used for ligatures, decorative letterforms, and figures
   * whose visible content is itself words (e.g. a logo).
   */
  public actualText?: string;

  /**
   * `/Lang` — BCP-47 language tag for this subtree. Overrides the
   * document-level language for content underneath.
   */
  public lang?: string;

  /**
   * `/T` — a short title for the structure element. Used by some
   * viewers' navigation panes.
   */
  public title?: string;

  /**
   * Creates a new structure element with the given role. Parent is
   * assigned by {@link StructureTreeBuilder.begin}; do not set it
   * directly.
   */
  constructor(role: SemanticRole) {
    this.role = role;
  }

  /**
   * Visit this element and (recursively) all of its descendants in
   * document order.
   */
  accept(visitor: IStructureVisitor): void {
    visitor.visitEnter(this);
    for (const child of this.children) child.accept(visitor);
    visitor.visitLeave(this);
  }

  /**
   * Returns a human-readable tree dump, mainly for test golden
   * comparison. Format:
   * ```
   * Document
   *   H1 [mcids: 0]
   *   Figure [mcids: 1] /Alt=logo
   * ```
   */
  toTreeString(): string {
    const parts: string[] = [];
    StructureElement.append(parts, this, 0);
    return parts.join('');
  }

  private static append(parts: string[], node: StructureElement, depth: number): void {
    parts.push('  '.repeat(depth));
    parts.push(toPdfTag(node.role));
    if (node.mcIds.length > 0) {
      parts.push(' [mcids: ');
      parts.push(node.mcIds.join(','));
      parts.push(']');
    }
    if (node.alt) parts.push(` /Alt=${node.alt}`);
    if (node.actualText) parts.push(` /ActualText=${node.actualText}`);
    if (node.lang) parts.push(` /Lang=${node.lang}`);
    if (node.title) parts.push(` /T=${node.title}`);
    parts.push('\n');
    for (const child of node.children) StructureElement.append(parts, child, depth + 1);
  }
}
