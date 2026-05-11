import { RenderStatus } from '../RenderStatus';
import { RenderContext } from '../../Rendering/RenderContext';

/**
 * Interface for elements that can render across multiple pages with state tracking.
 * Elements implementing this interface maintain internal state between render calls
 * to support automatic pagination (e.g., TextBlock, RichText, VisualToc).
 */
export interface IStatefulElement {
  /**
   * Renders the element with state tracking for pagination.
   * @param ctx The current render context
   * @param width The available width for rendering
   * @returns RenderStatus indicating whether the element is complete, overflowed, or needs wrapping
   */
  renderStateful(ctx: RenderContext, width: number): RenderStatus;

  /**
   * Resets the internal state, preparing the element for a fresh render.
   */
  resetState(): void;
}
