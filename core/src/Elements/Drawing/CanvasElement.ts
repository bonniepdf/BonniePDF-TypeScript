import { ElementBase } from '../ElementBase';
import { RenderContext } from '../../Rendering/RenderContext';
import { ICanvas } from '../../Drawing/ICanvas';
import { Size } from '../../Core/Size';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import type { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import type { IAltTextProvider } from '../../Rendering/Tagging/IAltTextProvider';

export type CanvasDrawHandler = (canvas: ICanvas, size: Size) => void;

export class CanvasElement extends ElementBase implements IRoleProvider, IAltTextProvider {
  public drawWidth: number = 400;
  public drawHeight: number = 300;
  public altText: string = '';
  public isDecorative: boolean = false;
  private readonly drawHandler: CanvasDrawHandler;

  constructor(handler: CanvasDrawHandler) {
    super();
    this.drawHandler = handler;
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
