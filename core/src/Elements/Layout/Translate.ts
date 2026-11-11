import { ElementBase } from '../ElementBase';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { type IElement, type IStatefulElement, type RenderContext, RenderStatus } from '../IElement';
import { type IContentContainer } from '../IContentContainer';
import { type LengthInput, toLength, toOptionalLength } from '../../Normalize/toLength';
import {
  renderAtomicTransform,
  renderAtomicTransformStateful,
  renderTransformedChild,
  resetTransformChild,
} from '../../Rendering/AtomicTransform';
/** Settable properties declared by Translate. */
export const TRANSLATE_OWN_OPTION_KEYS = ['child', 'contentWidth', 'x', 'y'] as const;
/** The full settable surface, including inherited element options. */
export const TRANSLATE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...TRANSLATE_OWN_OPTION_KEYS] as const;
/** Options for native translate with an unchanged flow box. */
export type TranslateOptions = ElementOptions &
  Partial<Pick<Translate, 'child'>> & {
    /** Signed horizontal offset. */
    x?: LengthInput;
    /** Signed vertical offset. */
    y?: LengthInput;
    /** Positive child width before transformation. */
    contentWidth?: LengthInput;
  };
/** Moves native painted content without changing its original flow box. */
export class Translate extends ElementBase implements IContentContainer, IStatefulElement {
  /** The native subtree to transform. */
  public child?: IElement;
  private _x = 0;
  private _y = 0;
  /** Signed horizontal paint offset; positive moves right. */
  public get x(): number {
    return this._x;
  }
  public set x(value: LengthInput) {
    const offset = toLength(value);
    if (!Number.isFinite(offset)) throw new Error('Translate x must be finite.');
    this._x = offset;
  }
  /** Signed vertical paint offset; positive moves down. */
  public get y(): number {
    return this._y;
  }
  public set y(value: LengthInput) {
    const offset = toLength(value);
    if (!Number.isFinite(offset)) throw new Error('Translate y must be finite.');
    this._y = offset;
  }
  private _contentWidth?: number;
  /** Optional positive child width before transformation, in points. */
  public get contentWidth(): number | undefined {
    return this._contentWidth;
  }
  public set contentWidth(value: LengthInput | undefined) {
    const width = toOptionalLength(value);
    if (width !== undefined && (!Number.isFinite(width) || width <= 0))
      throw new Error('Translate contentWidth must be positive and finite.');
    this._contentWidth = width;
  }
  /** Configure the native transform in one expression. */
  constructor(options: TranslateOptions = {}) {
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
  /** @internal A transformed subtree is drawn whole, never split across pages. */
  public readonly splitsAcrossPages = false;

  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    return renderAtomicTransformStateful(this, ctx, width, () => this.render(ctx, width));
  }
  protected renderContent(ctx: RenderContext, width: number): void {
    const w = this.contentWidth ?? width,
      h = this.child?.measureHeight(w) ?? 0;
    renderTransformedChild(this.child, ctx, w, h, h, { a: 1, b: 0, c: 0, d: 1, e: this.x, f: this.y });
  }
}
/** Creates a native translate wrapper. */
export function translate(options: TranslateOptions): Translate {
  return new Translate(options);
}
