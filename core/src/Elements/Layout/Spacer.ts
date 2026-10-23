import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { ElementBase } from '../ElementBase';
import { RenderContext } from '../IElement';
import { toLength, type LengthInput, type LengthObject } from '../../Normalize/toLength';

/** Settable properties declared by {@link Spacer} itself. */
export const SPACER_OWN_OPTION_KEYS = ['height'] as const;

/** The full settable surface, base included. */
export const SPACER_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...SPACER_OWN_OPTION_KEYS] as const;

/** Options for {@link Spacer}. */
export type SpacerOptions = ElementOptions & {
  /** Vertical gap. Accepts a length: `24`, `'1cm'`, or `{ value, unit }`. */
  height?: LengthInput;
};

/** Reserves a fixed amount of vertical space in the document flow. */
export class Spacer extends ElementBase {
  private _height = 0;

  /**
   * Vertical space this spacer reserves in the flow.
   *
   * Accepts a length: a number of points, `'1cm'`, or `{ value, unit }`.
   */
  public get height(): number {
    return this._height;
  }
  public set height(value: LengthInput) {
    this._height = toLength(value);
  }

  /** Creates a spacer of the given height. Accepts a length (`24`, `'1cm'`). */
  constructor(height?: LengthInput);
  /** Creates a spacer configured in one expression. */
  constructor(options: SpacerOptions);
  constructor(heightOrOptions: LengthInput | SpacerOptions = 0) {
    super();
    if (typeof heightOrOptions === 'number' || typeof heightOrOptions === 'string') {
      this.height = heightOrOptions;
    } else if (isLengthObject(heightOrOptions)) {
      this.height = heightOrOptions;
    } else {
      this.height = 0;
      applyOptions(this, heightOrOptions);
    }
  }

  protected measureContentHeight(_contentWidth: number): number {
    return this.height;
  }

  protected renderContent(ctx: RenderContext, _contentWidth: number): void {
    ctx.currentY += this.height;
  }
}

/** Distinguishes the `{ value, unit }` length form from an options bag. */
function isLengthObject(input: SpacerOptions | LengthObject): input is LengthObject {
  return 'unit' in input && 'value' in input;
}
