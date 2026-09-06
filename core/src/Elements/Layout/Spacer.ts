import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { ElementBase } from '../ElementBase';
import { RenderContext } from '../IElement';

/** Settable properties declared by {@link Spacer} itself. */
export const SPACER_OWN_OPTION_KEYS = ['height'] as const;

/** The full settable surface, base included. */
export const SPACER_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...SPACER_OWN_OPTION_KEYS] as const;

/** Options for {@link Spacer}. */
export type SpacerOptions = ElementOptions & Partial<Pick<Spacer, 'height'>>;

/** Reserves a fixed amount of vertical space in the document flow. */
export class Spacer extends ElementBase {
  public height: number;

  /** Creates a spacer of the given height. */
  constructor(height?: number);
  /** Creates a spacer configured in one expression. */
  constructor(options: SpacerOptions);
  constructor(heightOrOptions: number | SpacerOptions = 0) {
    super();
    if (typeof heightOrOptions === 'number') {
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
