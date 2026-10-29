import type { Document } from '../Document';
import { SectionLink } from '../Core/SectionLink';
import type { IContentContainer } from '../Elements/IContentContainer';
import type { IElement } from '../Elements/IElement';
import { Container } from '../Elements/Layout/Container';
import { HorizontalStack } from '../Elements/Layout/HorizontalStack';
import { VerticalStack } from '../Elements/Layout/VerticalStack';
import { PageNumberOf } from '../Elements/Text/PageNumberOf';
import { VisualToc } from '../Elements/Text/VisualToc';

// Shared helpers for two-pass page-number resolution. A VisualToc, SectionLink or PageNumberOf can reference a
// page that has not been laid out yet, so its page number can only be resolved after a first, throw-away layout
// pass. The PDF serializer and the SVG exporter both consult these so they make the same decision.

/**
 * Returns true when the document contains any element whose page-number
 * resolution depends on a completed layout - a {@link VisualToc}, a
 * {@link SectionLink}, or a {@link PageNumberOf} - and therefore needs a
 * throw-away first pass to seed `ctx.tocEntries` before the real render. Shared
 * by the PDF serializer and the SVG exporter so both render paths make the same
 * decision. The .NET
 * counterpart is `TocLayout.RequiresTwoPass`.
 */
export function documentRequiresTwoPassLayout(document: Document): boolean {
  return document.pages.some(page => page.getElements().some(el => elementRequiresTwoPassLayout(el)));
}

/**
 * Recursively checks whether an element tree contains an element that needs
 * two-pass layout (a {@link VisualToc}, {@link SectionLink}, or
 * {@link PageNumberOf}), descending through the layout containers
 * (VerticalStack, HorizontalStack, Container) and single-child fluent content
 * slots. The .NET
 * counterpart is `TocLayout.ContainsTwoPassElement`.
 */
export function elementRequiresTwoPassLayout(element: IElement): boolean {
  if (element instanceof VisualToc || element instanceof SectionLink || element instanceof PageNumberOf) {
    return true;
  }
  if (element instanceof VerticalStack) return element.children.some(elementRequiresTwoPassLayout);
  if (element instanceof HorizontalStack) return element.children.some(elementRequiresTwoPassLayout);
  if (element instanceof Container && element.child != null) return elementRequiresTwoPassLayout(element.child);
  // IContentContainer covers any remaining single-child wrapper element.
  const asContent = element as Partial<IContentContainer>;
  if (asContent.child != null) return elementRequiresTwoPassLayout(asContent.child);
  return false;
}

/**
 * @deprecated Retained for backward compatibility; use
 * {@link elementRequiresTwoPassLayout}. Now returns true for any element that
 * forces two-pass layout, not only {@link VisualToc}.
 */
export function elementContainsVisualToc(element: IElement): boolean {
  return elementRequiresTwoPassLayout(element);
}
