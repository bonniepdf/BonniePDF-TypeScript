import { applyOptions } from '../../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../../ElementOptions';
import { IElement, RenderContext } from '../../IElement';
import { toLength, type LengthInput } from '../../../Normalize/toLength';
import { PaginationWrapperBase, type PaginationDecision } from './PaginationWrapperBase';

/** Settable properties declared by {@link EnsureSpace} itself. */
export const ENSURE_SPACE_OWN_OPTION_KEYS = ['child', 'minHeight'] as const;

/** The full settable surface of an ensure-space, bases included. */
export const ENSURE_SPACE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...ENSURE_SPACE_OWN_OPTION_KEYS] as const;

type EnsureSpaceOwnKey = (typeof ENSURE_SPACE_OWN_OPTION_KEYS)[number];

/** Options for {@link EnsureSpace}. */
export type EnsureSpaceOptions = ElementOptions &
  Partial<Omit<Pick<EnsureSpace, EnsureSpaceOwnKey>, 'minHeight'>> & {
    /** Minimum space required. Accepts a length: `150`, `'5cm'`, or `{ value, unit }`. */
    minHeight?: LengthInput;
  };

/**
 * Starts a new page unless at least {@link minHeight} of body height remains.
 *
 * This is the orphaned-heading control: wrapping a heading in
 * `new EnsureSpace({ minHeight: 150, child: heading })` guarantees the heading
 * is followed by 150pt of its section rather than stranded at the foot of a
 * page. The child itself is untouched - once the space test passes it renders
 * and paginates exactly as it would unwrapped.
 *
 * The test is skipped when the cursor is already at the top of the body band:
 * breaking there would produce a blank page without gaining any space.
 */
export class EnsureSpace extends PaginationWrapperBase {
  private _minHeight: number = 0;

  /** Creates an empty ensure-space. */
  constructor();
  /**
   * Creates an ensure-space configured in one expression.
   *
   * ```typescript
   * new EnsureSpace({ minHeight: 150, child: new Heading('Section 3') });
   * ```
   */
  constructor(options: EnsureSpaceOptions);
  /** Creates an ensure-space around `child`, requiring `minHeight` of space. */
  constructor(minHeight: LengthInput, child?: IElement);
  constructor(optionsOrMinHeight?: EnsureSpaceOptions | LengthInput, child?: IElement) {
    super();
    if (optionsOrMinHeight === undefined) return;
    if (isOptions(optionsOrMinHeight)) {
      applyOptions(this, optionsOrMinHeight);
      return;
    }
    this.minHeight = optionsOrMinHeight;
    this.child = child;
  }

  /**
   * The body height that must remain on the current page for the child to start
   * here. Accepts a length: `150`, `'5cm'`, or `{ value, unit }`.
   */
  public get minHeight(): number {
    return this._minHeight;
  }
  public set minHeight(value: LengthInput) {
    this._minHeight = toLength(value);
  }

  protected decide(ctx: RenderContext, _contentWidth: number): PaginationDecision {
    if (this.remainingHeight(ctx) >= this._minHeight) return 'render';
    return this.canGainSpaceByBreaking(ctx) ? 'wrap' : 'render';
  }
}

/** Distinguishes the options bag from the `(minHeight, child)` convenience form. */
function isOptions(value: EnsureSpaceOptions | LengthInput): value is EnsureSpaceOptions {
  if (typeof value === 'number' || typeof value === 'string') return false;
  return !('value' in value && 'unit' in value);
}
