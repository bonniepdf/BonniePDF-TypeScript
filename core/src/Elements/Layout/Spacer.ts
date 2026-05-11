import { ElementBase } from '../ElementBase';
import { RenderContext } from '../IElement';

export class Spacer extends ElementBase {
  public height: number;

  constructor(height: number = 0) {
    super();
    this.height = height ?? 0;
  }

  protected measureContentHeight(_contentWidth: number): number {
    return this.height;
  }

  protected renderContent(_ctx: any, _contentWidth: number): void {
    // No-op - height is handled by parent
  }
}
