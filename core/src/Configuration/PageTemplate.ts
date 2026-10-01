import type { IElement } from '../Elements/IElement';

/**
 * A page template: given the 1-based page number, the element to draw in a
 * page-chrome slot on that page, or nothing.
 *
 * The type of `headerTemplate`, `footerTemplate`, `pageBackground` and
 * `pageForeground`. A hand-written function satisfies it, and so does the
 * result of {@link pageTemplate}.
 */
export type PageTemplate = (pageNumber: number) => IElement | undefined;

/**
 * The elements an element-based template chooses among; see {@link pageTemplate}.
 */
export interface PageTemplateElements {
  /** Used on every page no more specific member covers. */
  default?: IElement;
  /** Used on page 1 only. */
  firstPage?: IElement;
  /** Used on odd pages (1, 3, 5, …) that `firstPage` does not cover. */
  odd?: IElement;
  /** Used on even pages (2, 4, 6, …). */
  even?: IElement;
}

/** Every member of {@link PageTemplateElements}, as a runtime list. */
export const PAGE_TEMPLATE_ELEMENT_KEYS = ['default', 'firstPage', 'odd', 'even'] as const;

/**
 * Elements behind templates made by {@link pageTemplate}, keyed by the template
 * function. A side table rather than a property on the function, so the
 * template stays an ordinary function everywhere it is used.
 */
const builtFrom = new WeakMap<PageTemplate, Readonly<PageTemplateElements>>();

/**
 * Builds a page template from elements instead of a function.
 *
 * For page *n* (1-based) the template returns the first present of
 * `firstPage` (page 1 only), then `odd` or `even` by the parity of *n*, then
 * `default`; when none applies it returns nothing for that page. At least one
 * member is required.
 *
 * The same element instance is returned on every page it applies to, so it
 * must be reusable across pages. `{{CurrentPage}}` and `{{TotalPages}}` in
 * text let one element show a different number on each.
 *
 * @example
 * ```ts
 * doc.settings.footerTemplate = pageTemplate({
 *   default: new TextBlock({ text: 'Page {{CurrentPage}} of {{TotalPages}}', alignment: 'center' }),
 *   firstPage: new TextBlock({ text: 'Confidential', alignment: 'right' }),
 * });
 * ```
 */
export function pageTemplate(elements: PageTemplateElements): PageTemplate {
  const { default: fallback, firstPage, odd, even } = elements;
  if (!fallback && !firstPage && !odd && !even) {
    throw new Error('pageTemplate needs at least one of default, firstPage, odd or even.');
  }

  const template: PageTemplate = pageNumber => {
    if (pageNumber === 1 && firstPage) return firstPage;
    const byParity = pageNumber % 2 === 1 ? odd : even;
    return byParity ?? fallback;
  };
  builtFrom.set(template, Object.freeze({ default: fallback, firstPage, odd, even }));
  return template;
}

/**
 * The elements a template was built from, or `undefined` when it was not made
 * by {@link pageTemplate} (a hand-written function).
 *
 * For tools that inspect a document's settings; it changes nothing about how
 * the template renders.
 */
export function getPageTemplateElements(
  template: PageTemplate | undefined
): Readonly<PageTemplateElements> | undefined {
  return template ? builtFrom.get(template) : undefined;
}
