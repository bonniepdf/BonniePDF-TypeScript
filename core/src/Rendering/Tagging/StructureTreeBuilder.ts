import { SemanticRole } from './SemanticRole';
import { StructureElement } from './StructureElement';
import { StructureTreeException } from './StructureTreeException';
import type { IStructureVisitor } from './IStructureVisitor';

/**
 * Stack-based builder for the PDF structure tree. The renderer pushes a
 * structure element when it starts emitting a tagged region (heading, paragraph,
 * figure, ...) and pops it when the region ends. The canvas attaches MCIDs to
 * the current top-of-stack element as marked content is written.
 *
 * A new builder starts with an implicit {@link SemanticRole.Document} root
 * already open and at the top of the stack - every element added is a
 * descendant of Document.
 */
export class StructureTreeBuilder {
  private readonly _stack: StructureElement[] = [];
  private readonly _root: StructureElement;

  constructor() {
    this._root = new StructureElement(SemanticRole.Document);
    this._stack.push(this._root);
  }

  /** The document root. Always returns the same instance for the lifetime of this builder. */
  get root(): StructureElement {
    return this._root;
  }

  /**
   * The element currently at the top of the open-element stack - the
   * element that {@link addMcid} attaches to and that new {@link begin}
   * calls nest under.
   */
  get current(): StructureElement {
    return this._stack[this._stack.length - 1];
  }

  /**
   * Open a new structure element under the current one and make it the
   * new current. Must be paired with a subsequent {@link end}.
   * @returns the newly created element, in case the caller wants to
   *          set metadata (alt, lang, …) directly.
   */
  begin(role: SemanticRole): StructureElement {
    const element = new StructureElement(role);
    element.parent = this.current;
    this.current.children.push(element);
    this._stack.push(element);
    return element;
  }

  /**
   * Reopen an element begun earlier, so content drawn on a later page is marked as part of it. The element keeps
   * its place in the tree; it is only made current again. Pair with {@link end}, as for {@link begin}. A table row
   * split across pages (spec 02 §4.2) resumes its row and cells on each page.
   *
   * @internal
   */
  resume(element: StructureElement): void {
    this._stack.push(element);
  }

  /**
   * Close the current structure element, returning to its parent.
   * Throws {@link StructureTreeException} if called more times than
   * {@link begin} (the document root cannot be closed - it is owned by
   * the builder).
   */
  end(): void {
    if (this._stack.length <= 1) {
      throw new StructureTreeException(
        'end() called with no open structure element. The document root cannot be closed; check for an end() without a matching begin().'
      );
    }
    this._stack.pop();
  }

  /**
   * Attach a marked-content identifier (MCID) to the current structure
   * element, optionally paired with the zero-based page index it was
   * emitted on. Page index defaults to 0 - the page-aware overload is
   * what the canvas uses in real rendering; the default is for unit
   * tests of the structure-tree model in isolation.
   */
  addMcid(mcid: number, pageIndex: number = 0): void {
    this.current.mcIds.push(mcid);
    this.current.mcIdPages.push(pageIndex);
  }

  /** Set `/Alt` on the current element. */
  setAlt(text: string): void {
    this.current.alt = text;
  }

  /** Set `/ActualText` on the current element. */
  setActualText(text: string): void {
    this.current.actualText = text;
  }

  /** Set `/Lang` on the current element. */
  setLang(lang: string): void {
    this.current.lang = lang;
  }

  /** Set `/T` on the current element. */
  setTitle(title: string): void {
    this.current.title = title;
  }

  /**
   * Set the raw `/A` (attributes dictionary) PDF syntax on the current
   * element. Used by tagged tables to emit `/ColSpan` / `/RowSpan` on
   * cells, and by lists to declare bullet characteristics. The caller
   * is responsible for valid PDF syntax.
   */
  setAttributes(pdfAttributes: string): void {
    this.current.attributes = pdfAttributes;
  }

  /**
   * Traverse the entire tree from the root depth-first, invoking
   * `visitor` on each node.
   */
  walk(visitor: IStructureVisitor): void {
    this._root.accept(visitor);
  }
}
