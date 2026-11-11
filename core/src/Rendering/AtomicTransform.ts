import { PdfCanvas } from '../Drawing/PdfCanvas';
import { drawPossiblyOversized } from './OversizedContent';
import { type PaintTransform, isIdentityPaintTransform } from '../Drawing/PaintTransform';
import { type IElement, type IStatefulElement, type RenderContext, RenderStatus } from '../Elements/IElement';
import { composeElementTransform } from './ElementTransforms';
import { beginChildTag, endChildTag } from './Tagging/ChildTagging';
import { captureTypeOf, captureNameOf } from './LayoutRecorder';

/** @internal Reset an atomic transform's child. */
export function resetTransformChild(child?: IElement): void {
  (child as Partial<IStatefulElement> | undefined)?.resetState?.();
}
/** @internal Guard the atomic render path and restore failed layout. */
export function renderAtomicTransform(element: IElement, ctx: RenderContext, width: number, draw: () => void): void {
  const x = ctx.currentX,
    y = ctx.currentY;
  try {
    drawPossiblyOversized(ctx, element, element.measureHeight(width), draw);
  } catch (error) {
    ctx.currentX = x;
    ctx.currentY = y;
    ctx.layoutRecorder?.abortNode(element);
    throw error;
  }
}
/** @internal Decide pagination before painting a transformed subtree. */
export function renderAtomicTransformStateful(
  element: IElement,
  ctx: RenderContext,
  width: number,
  draw: () => void
): RenderStatus {
  const height = element.measureHeight(width);
  // Taller than a whole page: drawn at the top of one, clipped and reported (spec 02 §4.3).
  if (height > ctx.maxY - ctx.currentY + 0.001 && ctx.currentY > ctx.contentTop + 0.001)
    return RenderStatus.WrapRequired;
  drawPossiblyOversized(ctx, element, height, draw);
  return RenderStatus.Complete;
}
/** @internal Scope a native subtree's transform, geometry and atomic child band. */
export function renderTransformedChild(
  child: IElement | undefined,
  ctx: RenderContext,
  width: number,
  height: number,
  flowHeight: number,
  transform: PaintTransform
): void {
  if (!child) return;
  const x = ctx.currentX,
    y = ctx.currentY;
  const band = ctx.atomicLayoutBounds,
    previous = ctx.elementTransform;
  const target = ctx.cellStretchTarget,
    stretch = ctx.cellStretchHeight;
  const recorder = ctx.layoutRecorder,
    previousCapture = recorder?.elementTransform;
  let success = false;
  resetTransformChild(child);
  let saved = false;
  let tag: ReturnType<typeof beginChildTag> | undefined;
  try {
    if (!isIdentityPaintTransform(transform)) {
      ctx.canvas.saveState();
      saved = true;
      if (ctx.canvas instanceof PdfCanvas) ctx.canvas.transformElement(transform);
      else ctx.canvas.transform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f);
    }
    ctx.atomicLayoutBounds = { top: y, bottom: y + height + 0.001 };
    ctx.elementTransform = composeElementTransform(previous, transform);
    if (recorder) recorder.elementTransform = ctx.elementTransform;
    ctx.cellStretchTarget = undefined;
    ctx.cellStretchHeight = 0;
    recorder?.openNode(child, captureTypeOf(child), captureNameOf(child), ctx.currentPageIndex, x, y, width);
    tag = beginChildTag(ctx, child);
    const statefulChild = child as Partial<IStatefulElement>;
    if (statefulChild.renderStateful) {
      if (statefulChild.renderStateful(ctx, width) !== RenderStatus.Complete)
        throw new Error('Transformed content cannot continue onto another page.');
    } else child.render(ctx, width);
    if (ctx.currentY === y) ctx.currentY += height;
    recorder?.closeNode(child, ctx.currentPageIndex, ctx.currentY, true);
    success = true;
  } finally {
    if (tag) endChildTag(ctx, tag);
    ctx.atomicLayoutBounds = band;
    ctx.elementTransform = previous;
    if (recorder) recorder.elementTransform = previousCapture;
    ctx.cellStretchTarget = target;
    ctx.cellStretchHeight = stretch;
    ctx.currentX = x;
    ctx.currentY = success ? y + flowHeight : y;
    if (saved) ctx.canvas.restoreState();
    resetTransformChild(child);
  }
}
