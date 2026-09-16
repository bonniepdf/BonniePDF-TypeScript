import type { IElement } from '../Elements/IElement';
import type { DocumentSettings } from '../Configuration/DocumentSettings';
import type { RenderContext } from './RenderContext';

/**
 * The vertical space a page's header and footer take out of the body content
 * band, in points. Both are measured against the body content width for the
 * page they belong to; `0` means "no template, or the template returned
 * nothing for this page".
 *
 * See the shared specification, "Layout & Pagination" §5.1 (chrome
 * reservation) for the normative rule these numbers feed.
 */
export interface ChromeReservation {
  readonly header: number;
  readonly footer: number;
}

/** The reservation for a page with no header and no footer. */
export const NO_CHROME: ChromeReservation = Object.freeze({ header: 0, footer: 0 });

/**
 * Builds the per-page header/footer measurement the render context uses to
 * inset the body content band.
 *
 * The provider is deliberately lazy: it reads `ctx.pageSize` and `ctx.margin`
 * at the moment it is asked, so a document whose pages differ in size or
 * margin measures each page's chrome against that page's own content width.
 *
 * Returns `undefined` when the document declares neither template, which lets
 * the context skip reservation entirely rather than measure two nothings per
 * page.
 */
export function chromeReservationFor(
  settings: DocumentSettings,
  ctx: RenderContext
): ((pageNumber: number) => ChromeReservation) | undefined {
  const headerTemplate = settings.headerTemplate;
  const footerTemplate = settings.footerTemplate;
  if (!headerTemplate && !footerTemplate) return undefined;

  return (pageNumber: number): ChromeReservation => {
    const contentWidth = ctx.pageSize.width - ctx.margin * 2;
    return {
      header: measure(headerTemplate?.(pageNumber), contentWidth),
      footer: measure(footerTemplate?.(pageNumber), contentWidth),
    };
  };
}

function measure(element: IElement | undefined, contentWidth: number): number {
  if (!element) return 0;
  const height = element.measureHeight(contentWidth);
  return Number.isFinite(height) && height > 0 ? height : 0;
}
