import {
  renderAtomicTransform,
  renderAtomicTransformStateful,
  renderTransformedChild,
  resetTransformChild,
} from '../../Rendering/AtomicTransform';
import { ElementBase } from '../ElementBase';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { type IElement, type IStatefulElement, type RenderContext, RenderStatus } from '../IElement';
import { type IContentContainer } from '../IContentContainer';
import { type LengthInput, toOptionalLength } from '../../Normalize/toLength';
import { type PaintTransform } from '../../Drawing/PaintTransform';

/** Free rotation keeps the flow box; constrained quarter turns swap its dimensions. */
export type RotationMode = 'free' | 'constrained';
/** Settable properties declared by Rotate. */
export const ROTATE_OWN_OPTION_KEYS = ['child', 'angle', 'mode', 'contentWidth'] as const;
/** The full settable surface, including inherited element options. */
export const ROTATE_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...ROTATE_OWN_OPTION_KEYS] as const;
/** Options for a native, atomic rotation wrapper. */
export type RotateOptions = ElementOptions &
  Partial<Pick<Rotate, 'child' | 'angle' | 'mode'>> & {
    /** Positive width before rotation; points or a unit token. */
    contentWidth?: LengthInput;
  };

/** Rotates a native subtree clockwise without rasterising its content. */
export class Rotate extends ElementBase implements IContentContainer, IStatefulElement {
  /** The native subtree to rotate. */
  public child?: IElement;
  /** Finite clockwise degrees, default zero. */
  public angle = 0;
  /** Free keeps the flow box; constrained accepts multiples of 90 degrees. */
  public mode: RotationMode = 'free';
  private _contentWidth?: number;
  /** Optional positive child width before rotation, in points. */
  public get contentWidth(): number | undefined {
    return this._contentWidth;
  }
  public set contentWidth(value: LengthInput | undefined) {
    const width = toOptionalLength(value);
    if (width !== undefined && (!Number.isFinite(width) || width <= 0))
      throw new Error('Rotate contentWidth must be positive and finite.');
    this._contentWidth = width;
  }
  /** Configure native rotation in one expression. */
  constructor(options: RotateOptions = {}) {
    super();
    Object.assign(this, options);
  }
  /** Native child traversal for fonts, styles and accessibility. */
  public getChildren(): readonly IElement[] {
    return this.child ? [this.child] : [];
  }
  /** Reset the child for a fresh atomic render. */
  public resetState(): void {
    resetTransformChild(this.child);
  }
  private geometry(width: number) {
    if (!Number.isFinite(this.angle)) throw new Error('Rotate angle must be finite.');
    if (this.mode !== 'free' && this.mode !== 'constrained') throw new Error('Invalid rotation mode.');
    const angle = ((this.angle % 360) + 360) % 360;
    if (this.mode === 'constrained' && angle % 90 !== 0)
      throw new Error('Constrained rotation requires a multiple of 90 degrees.');
    const quarter = this.mode === 'constrained' && (angle === 90 || angle === 270);
    const w = this.contentWidth ?? (quarter ? this.child?.getPreferredWidth() || width : width);
    const h = this.child?.measureHeight(w) ?? 0;
    return { angle, w, h, height: this.child ? (quarter ? w : h) : 0 };
  }
  protected measureContentHeight(width: number): number {
    return this.geometry(width).height;
  }
  protected getPreferredContentWidth(): number {
    if (!this.child) return 0;
    const width = this.contentWidth ?? this.child.getPreferredWidth();
    const g = this.geometry(width);
    return this.mode === 'constrained' && (g.angle === 90 || g.angle === 270) ? g.h : width;
  }
  /** Render atomically, restoring the context if the child fails. */
  public override render(ctx: RenderContext, width: number): void {
    renderAtomicTransform(this, ctx, width, () => super.render(ctx, width));
  }
  /** Move to a fresh page before painting when the whole rotated box does not fit. */
  /** @internal A transformed subtree is drawn whole, never split across pages. */
  public readonly splitsAcrossPages = false;

  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    return renderAtomicTransformStateful(this, ctx, width, () => this.render(ctx, width));
  }
  protected renderContent(ctx: RenderContext, width: number): void {
    const g = this.geometry(width);
    if (!this.child) return;
    const x = ctx.currentX,
      y = ctx.currentY;
    const radians = (g.angle * Math.PI) / 180;
    const a = g.angle % 90 === 0 ? [1, 0, -1, 0][g.angle / 90] : Math.round(Math.cos(radians) * 1e6) / 1e6;
    const b = g.angle % 90 === 0 ? [0, 1, 0, -1][g.angle / 90] : Math.round(Math.sin(radians) * 1e6) / 1e6;
    const cx = x + g.w / 2,
      cy = y + g.h / 2;
    let transform: PaintTransform = { a, b, c: -b, d: a, e: cx - a * cx + b * cy, f: cy - b * cx - a * cy };
    if (this.mode === 'constrained') {
      const e = g.angle === 90 ? x + y + g.h : g.angle === 270 ? x - y : g.angle === 180 ? 2 * x + g.w : 0;
      const f = g.angle === 90 ? y - x : g.angle === 270 ? y + x + g.w : g.angle === 180 ? 2 * y + g.h : 0;
      transform = { a, b, c: -b, d: a, e, f };
    }
    renderTransformedChild(this.child, ctx, g.w, g.h, g.height, transform);
  }
}

/** Creates a native rotation wrapper. */
export function rotate(options: RotateOptions): Rotate {
  return new Rotate(options);
}
