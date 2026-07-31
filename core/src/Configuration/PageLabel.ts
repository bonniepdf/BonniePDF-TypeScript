import { applyOptions } from '../Core/applyOptions';

/**
 * Numbering style for a page label section, mapping to the PDF /S entry.
 * - `decimal`         → /D   (1, 2, 3, …)
 * - `lowercase-roman` → /r   (i, ii, iii, …)
 * - `uppercase-roman` → /R   (I, II, III, …)
 * - `lowercase-alpha` → /a   (a, b, c, …, aa, bb, …)
 * - `uppercase-alpha` → /A   (A, B, C, …, AA, BB, …)
 */
export type PageLabelStyle = 'decimal' | 'lowercase-roman' | 'uppercase-roman' | 'lowercase-alpha' | 'uppercase-alpha';

/**
 * Defines how the PDF viewer labels pages in its page counter, "go to page"
 * dialog, and bookmark targets. Written as `/PageLabels` in the document
 * catalog (PDF §12.4.2).
 *
 * Setting `pageLabel` on `DocumentSettings` applies the labelling from the
 * first page of the document. For multi-range labelling (e.g. front matter
 * in Roman numerals followed by decimal body pages) use the `pageLabels`
 * array property instead.
 *
 * ```typescript
 * const label = new PageLabel()
 * label.startAt = 42
 * settings.pageLabel = label
 * // → viewer shows "42" on page 1, "43" on page 2, etc.
 * ```
 */
/** Settable properties of {@link PageLabel}. */
export const PAGE_LABEL_OPTION_KEYS = ['style', 'startAt', 'prefix'] as const;

/** Options for {@link PageLabel}. */
export type PageLabelOptions = Partial<Pick<PageLabel, (typeof PAGE_LABEL_OPTION_KEYS)[number]>>;

export class PageLabel {
  /** Numbering style. Defaults to `'decimal'`. */
  public style: PageLabelStyle = 'decimal';
  /** First value in the sequence. Defaults to `1`. */
  public startAt: number = 1;
  /** Optional label prefix, prepended to every page label (e.g. `'A-'` → A-1, A-2). */
  public prefix?: string;

  /** Creates a page label, optionally configured in one expression. */
  constructor(options?: PageLabelOptions) {
    applyOptions(this, options);
  }
}
