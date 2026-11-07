import { ElementBase } from '../../ElementBase';
import { PageBreak } from '../PageBreak';
import type { IElement } from '../../IElement';

/** The height of the group that must start together, or zero for an unmarked sibling. */
export function keepWithNextHeight(elements: readonly IElement[], index: number, width: number, spacing = 0): number {
  let height = 0;
  let next = index;
  for (; next + 1 < elements.length; next++) {
    const element = elements[next];
    if (!(element instanceof ElementBase && element.keepWithNext)) break;
    height += element.measureHeight(width) + spacing;
  }
  if (next === index) return 0;
  const following = elements[next];
  if (following instanceof PageBreak) return 0;
  return (
    height + (following instanceof ElementBase ? following.minimumStartHeight(width) : following.measureHeight(width))
  );
}
