import type { ContentDirection } from '../Configuration/ContentDirection';
import type { IElement } from './IElement';
import { ElementBase } from './ElementBase';

/** @internal */
export function applyContentDirection(element: IElement | null | undefined, inherited: ContentDirection): void {
  if (!element) return;
  if (element instanceof ElementBase) {
    element.inheritContentDirection(inherited);
    inherited = element.effectiveContentDirection;
  }
  for (const child of (element as IElement).getChildren?.() ?? []) applyContentDirection(child, inherited);
}
