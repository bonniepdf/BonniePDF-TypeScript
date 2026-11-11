import type { RenderContext as ElementRenderContext, IElement } from '../Elements/IElement';
import type { RenderContext } from './RenderContext';
import { OversizedContent } from '../Configuration/OversizedContent';
import { OversizedContentError } from '../Core/OversizedContentError';
import { captureTypeOf } from './LayoutRecorder';

/**
 * Draws content that cannot split, handling the case where it is taller than the body band.
 *
 * Callers move such content to a fresh page first, so content that still overruns the band here fits on no
 * page. It is drawn from where it stands, clipped to the band, and reported once at error severity; with
 * `oversizedContent: 'throw'` generation fails instead, before anything is drawn. Content drawn inside an
 * oversized box shares its clip and is not reported again.
 *
 * @internal
 */
export function drawPossiblyOversized(
  ctx: ElementRenderContext,
  element: IElement | string,
  height: number,
  draw: () => void
): void {
  const full = ctx as Partial<RenderContext> & ElementRenderContext;
  const overrun = ctx.currentY + height - ctx.maxY;
  if (overrun <= 0.01 || (full.oversizedClipDepth ?? 0) > 0) {
    draw();
    return;
  }

  const type = typeof element === 'string' ? element : captureTypeOf(element);
  const message =
    `A ${type} is taller than the page body and cannot be split: ` +
    `${Math.round(overrun)}pt is cut off at the bottom of page ${ctx.currentPageIndex + 1}.`;
  if (full.resources?.oversizedContent === OversizedContent.Throw) throw new OversizedContentError(message);
  full.resources?.diagnostics.addError('render', message, 'pagination');

  const canvas = ctx.canvas;
  canvas.saveState();
  // Four explicit sides rather than addRect, whose operators differ between the two implementations' canvases.
  canvas.beginPath();
  canvas.moveTo(0, 0);
  canvas.lineTo(ctx.pageSize.width, 0);
  canvas.lineTo(ctx.pageSize.width, ctx.maxY);
  canvas.lineTo(0, ctx.maxY);
  canvas.closePath();
  canvas.clipToCurrentPath();
  full.oversizedClipDepth = (full.oversizedClipDepth ?? 0) + 1;
  try {
    draw();
  } finally {
    full.oversizedClipDepth = (full.oversizedClipDepth ?? 1) - 1;
    canvas.restoreState();
  }
}
