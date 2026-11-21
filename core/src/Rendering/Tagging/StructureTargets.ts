import type { StructureElement } from './StructureElement';
import type { TaggingContext } from './TaggingContext';

/**
 * Chooses the structure element an in-document destination targets (spec 04
 * §3.4): the element that registered the anchor, when the destination names one
 * and that element was tagged; otherwise an element on the target page.
 */
export function resolveStructureTarget(
  tagging: TaggingContext,
  anchor: string | undefined,
  pageIndex: number
): StructureElement {
  if (anchor !== undefined) {
    const owner = tagging.anchorOwners.get(anchor);
    const element = owner !== undefined ? tagging.elementStructure.get(owner) : undefined;
    if (element !== undefined) return element;
  }
  return structureTargetForPage(tagging.tree.root, pageIndex);
}

/**
 * In reading order (the tree's pre-order), the first element whose first marked
 * content is on the page; failing that, the first with any marked content on it;
 * failing that, the document element.
 */
export function structureTargetForPage(root: StructureElement, pageIndex: number): StructureElement {
  let continuing: StructureElement | undefined;
  const stack: StructureElement[] = [root];
  while (stack.length > 0) {
    const element = stack.pop()!;
    const pages = element.mcIdPages;
    if (pages.length > 0) {
      if (pages[0] === pageIndex) return element;
      if (continuing === undefined && pages.includes(pageIndex)) continuing = element;
    }
    for (let i = element.children.length - 1; i >= 0; i--) stack.push(element.children[i]);
  }
  return continuing ?? root;
}
