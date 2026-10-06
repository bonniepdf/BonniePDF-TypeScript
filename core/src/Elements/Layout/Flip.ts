import { ElementBase } from '../ElementBase';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { type IElement, type IStatefulElement, type RenderContext, RenderStatus } from '../IElement';
import { type IContentContainer } from '../IContentContainer';
import { type LengthInput, toOptionalLength } from '../../Normalize/toLength';
import {
  renderAtomicTransform,
  renderAtomicTransformStateful,
  renderTransformedChild,
  resetTransformChild,
} from '../../Rendering/AtomicTransform';
/** Settable properties declared by Flip. */
export const FLIP_OWN_OPTION_KEYS = ['child', 'contentWidth', 'horizontal', 'vertical'] as const;
/** The full settable surface, including inherited element options. */
export const FLIP_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...FLIP_OWN_OPTION_KEYS] as const;
/** Options for native flip with an unchanged flow box. */
export type FlipOptions = ElementOptions &
  Partial<Pick<Flip, 'child' | 'horizontal' | 'vertical'>> & {
    /** Positive child width before transformation. */
    contentWidth?: LengthInput;
  };
/** Mirrors a native subtree about its box centre without changing flow dimensions. */
export class Flip extends ElementBase implements IContentContainer, IStatefulElement {
  /** The native subtree to transform. */
  public child?: IElement;
  /** Mirror left and right about the child box centre. */
  public horizontal = false;
  /** Mirror top and bottom about the child box centre. */
  public vertical = false;
  private _contentWidth?: number;
  /** Optional positive child width before transformation, in points. */
  public get contentWidth(): number | undefined {
    return this._contentWidth;
  }
  public set contentWidth(value: LengthInput | undefined) {
    const width = toOptionalLength(value);
    if (width !== undefined && (!Number.isFinite(width) || width <= 0))
      throw new Error('Flip contentWidth must be positive and finite.');
    this._contentWidth = width;
  }
  /** Configure the native transform in one expression. */
  constructor(options: FlipOptions = {}) {
    super();
    Object.assign(this, options);
  }
  /** Traverse the child for fonts, styles and accessibility. */
  public getChildren(): readonly IElement[] {
    return this.child ? [this.child] : [];
  }
  /** Reset the child for a fresh atomic render. */
  public resetState(): void {
    resetTransformChild(this.child);
  }
  protected getPreferredContentWidth(): number {
    return this.child ? (this.contentWidth ?? this.child.getPreferredWidth()) : 0;
  }
  protected measureContentHeight(width: number): number {
    return this.child?.measureHeight(this.contentWidth ?? width) ?? 0;
  }
  /** Render atomically and restore failed layout. */
  public override render(ctx: RenderContext, width: number): void {
    renderAtomicTransform(this, ctx, width, () => super.render(ctx, width));
  }
  /** Move whole to a fresh page before painting when necessary. */
  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    return renderAtomicTransformStateful(this, ctx, width, () => this.render(ctx, width));
  }
  protected renderContent(ctx: RenderContext, width: number): void {
    const w = this.contentWidth ?? width,
      h = this.child?.measureHeight(w) ?? 0;
    renderTransformedChild(this.child, ctx, w, h, h, {
      a: this.horizontal ? -1 : 1,
      b: 0,
      c: 0,
      d: this.vertical ? -1 : 1,
      e: this.horizontal ? 2 * ctx.currentX + w : 0,
      f: this.vertical ? 2 * ctx.currentY + h : 0,
    });
  }
}
/** Creates a native flip wrapper. */
export function flip(options: FlipOptions): Flip {
  return new Flip(options);
}
