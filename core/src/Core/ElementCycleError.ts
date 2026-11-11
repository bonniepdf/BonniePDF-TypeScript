import { BonniePdfError } from './BonniePdfError';

/**
 * Thrown when an element contains itself, directly or through its descendants. Such a tree has no end, so it
 * is rejected before layout instead of recursing until the stack overflows.
 */
export class ElementCycleError extends BonniePdfError {
  /** Creates the error, naming the type of the element found inside itself. */
  constructor(elementType: string) {
    super(`The element tree contains a cycle: a ${elementType} is its own descendant.`);
  }
}
