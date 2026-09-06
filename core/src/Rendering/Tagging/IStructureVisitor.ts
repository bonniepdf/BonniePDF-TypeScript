import type { StructureElement } from './StructureElement';

/**
 * Visitor over a structure tree. {@link StructureElement.accept}
 * (and the equivalent {@link StructureTreeBuilder.walk}) traverse the
 * tree depth-first, calling {@link visitEnter} as each node is entered
 * and {@link visitLeave} as it is left.
 *
 * The writer uses this to translate the in-memory tree
 * into the PDF object graph: assign object IDs on enter, populate
 * `/K` arrays on leave.
 */
export interface IStructureVisitor {
  /**
   * Called when traversal enters `element`, before any of its children
   * are visited.
   */
  visitEnter(element: StructureElement): void;

  /**
   * Called when traversal leaves `element`, after all its children (if
   * any) have been visited.
   */
  visitLeave(element: StructureElement): void;
}
