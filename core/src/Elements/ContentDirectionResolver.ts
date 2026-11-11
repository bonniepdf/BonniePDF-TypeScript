import type { ContentDirection } from '../Configuration/ContentDirection';
import type { IElement } from './IElement';
import { ElementBase } from './ElementBase';
import { ElementCycleError } from '../Core/ElementCycleError';

/**
 * Resolves the inherited content direction through an element and its descendants.
 *
 * This is the first walk of the tree in every generation, so it is also where a tree that contains itself is
 * caught: `ancestors` holds the elements on the path from the root to the one being visited, and meeting one
 * of them again is a cycle. Without the check the walk recurses until the stack overflows.
 *
 * @internal
 */
export function applyContentDirection(
  element: IElement | null | undefined,
  inherited: ContentDirection,
  ancestors: Set<IElement> = new Set()
): void {
  if (!element) return;
  if (ancestors.has(element)) throw new ElementCycleError(element.constructor.name);
  if (element instanceof ElementBase) {
    element.inheritContentDirection(inherited);
    inherited = element.effectiveContentDirection;
  }
  const children = (element as IElement).getChildren?.() ?? [];
  ancestors.add(element);
  try {
    for (const child of children) applyContentDirection(child, inherited, ancestors);
  } finally {
    ancestors.delete(element);
  }
}
