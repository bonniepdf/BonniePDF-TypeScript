import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { ICanvas } from '../../Drawing/ICanvas';
import { Size } from '../../Core/Size';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import type { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import type { IAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toLength, type LengthInput } from '../../Normalize/toLength';

/**
 * The function that draws a {@link CanvasElement}: it receives the canvas and the size of the area reserved for the element, in points.
 */
export type CanvasDrawHandler = (canvas: ICanvas, size: Size) => void;

/** Settable properties declared by {@link CanvasElement} itself. */
export const CANVAS_ELEMENT_OWN_OPTION_KEYS = ['drawWidth', 'drawHeight', 'altText', 'isDecorative'] as const;

/** The full settable surface, base included. */
export const CANVAS_ELEMENT_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...CANVAS_ELEMENT_OWN_OPTION_KEYS] as const;

/**
 * Options for {@link CanvasElement}. The draw handler is required and stays a
 * constructor value (it is stored `readonly`, not a settable property).
 */
export type CanvasElementOptions = ElementOptions &
  Partial<Omit<Pick<CanvasElement, (typeof CANVAS_ELEMENT_OWN_OPTION_KEYS)[number]>, 'drawWidth' | 'drawHeight'>> & {
    /** Drawing-surface width. Accepts a length: `240`, `'8cm'`, or `{ value, unit }`. */
    drawWidth?: LengthInput;
    /** Drawing-surface height. Accepts a length: `160`, `'8cm'`, or `{ value, unit }`. */
    drawHeight?: LengthInput;
  };

/** Invokes a caller-provided drawing function within the document layout. */
export class CanvasElement extends ElementBase implements IRoleProvider, IAltTextProvider {
  private _drawWidth: number = 0;

  /**
   * Width of the drawing box in points. `0` (the default) fills the available
   * content width; a positive value fixes the width and is clamped to the space
   * available.
   *
   * Accepts a length: a number of points, `'8cm'`, or `{ value, unit }`.
   */
  public get drawWidth(): number {
    return this._drawWidth;
  }
  public set drawWidth(value: LengthInput) {
    this._drawWidth = toLength(value);
  }
  private _drawHeight: number = 100;

  /** Height of the drawing box in points. Always explicit — a canvas cannot measure itself.
   *
   * Accepts a length: a number of points, `'8cm'`, or `{ value, unit }`.
   */
  public get drawHeight(): number {
    return this._drawHeight;
  }
  public set drawHeight(value: LengthInput) {
    this._drawHeight = toLength(value);
  }
  public altText: string = '';
  public isDecorative: boolean = false;
  private readonly drawHandler: CanvasDrawHandler;

  /** Creates a canvas element for the given draw handler. */
  constructor(handler: CanvasDrawHandler, options?: CanvasElementOptions);
  /** Options-only form; `handler` is required either way. */
  constructor(options: CanvasElementOptions & { handler: CanvasDrawHandler });
  constructor(
    handlerOrOptions: CanvasDrawHandler | (CanvasElementOptions & { handler: CanvasDrawHandler }),
    options?: CanvasElementOptions
  ) {
    super();
    // The handler is a function; the options bag is a plain object.
    if (typeof handlerOrOptions === 'function') {
      this.drawHandler = handlerOrOptions;
      applyOptions(this, options);
    } else {
      // Strip `handler` from the bag: it maps to the private readonly field, not
      // a settable property, so it must not reach applyOptions.
      const { handler, ...rest } = handlerOrOptions;
      this.drawHandler = handler;
      applyOptions(this, rest);
    }
  }

  get semanticRole(): SemanticRole {
    return this.isDecorative || !this.altText ? SemanticRole.Artifact : SemanticRole.Figure;
  }

  protected override measureContentHeight(_contentWidth: number): number {
    return this.drawHeight;
  }

  protected override getPreferredContentWidth(): number {
    return this.drawWidth;
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    const drawWidth = this.drawWidth > 0 ? Math.min(this.drawWidth, contentWidth) : contentWidth;
    const canvas = ctx.getCanvas(ctx.currentX, ctx.currentY);

    canvas.saveState();
    canvas.beginPath();
    canvas.addRect(0, 0, drawWidth, this.drawHeight);
    canvas.clipToCurrentPath();

    try {
      this.drawHandler(canvas, new Size(drawWidth, this.drawHeight));
    } finally {
      canvas.restoreState();
    }

    ctx.flushExternalCanvas(canvas);
    ctx.currentY += this.drawHeight;
  }
}
