import { ICanvas } from '../Drawing/ICanvas';
import { ChartData } from './Models/ChartData';
import { Color } from '../Core/Color';
import { TextAlignment } from '../Elements/Text/TextAlignment';

/**
 * Base class for all charts that provides common functionality for drawing charts
 * using the ICanvas interface. This ensures charts can be rendered to any backend
 * (PDF, SVG, etc.) without modification.
 */
export abstract class ChartBase {
  // Title styling constants (matching SVG chart implementation)
  private static readonly TITLE_FONT_SIZE = 20;
  private static readonly TITLE_Y = 35;
  private static readonly TITLE_FONT_FAMILY = "Arial, sans-serif";
  private static readonly TITLE_COLOR = Color.fromHex("#333333");

  /**
   * Width of the chart canvas in points
   */
  width: number = 800;

  /**
   * Height of the chart canvas in points
   */
  height: number = 450;

  /**
   * Background color for the chart (default: null/transparent).
   * When null, no background is drawn, allowing the chart to blend with document content.
   * Set to Color.White for standalone chart images.
   */
  backgroundColor: Color | undefined;

  /**
   * When true, the chart will stretch to fill the container width.
   * The Width property will be set automatically by the ChartElement.
   */
  stretchToFit: boolean = false;

  /**
   * Draws the chart to the specified canvas.
   * This method handles the common setup (background, title) and calls the abstract DrawContent method.
   * @param canvas The canvas to draw to
   * @param data The chart data to render
   */
  draw(canvas: ICanvas, data: ChartData): void {
    // Draw background only if a color is specified
    if (this.backgroundColor !== undefined) {
      canvas.fillRect(0, 0, this.width, this.height, this.backgroundColor);
    }

    // Draw title if present
    if (data.title !== "") {
      this.drawTitle(canvas, data.title);
    }

    // Draw chart-specific content
    this.drawContent(canvas, data);
  }

  /**
   * Draws the chart title centered at the top.
   * @param canvas The canvas to draw to
   * @param title The title text
   */
  protected drawTitle(canvas: ICanvas, title: string): void {
    const centerX = this.width / 2;
    canvas.drawText(
      centerX,
      ChartBase.TITLE_Y,
      title,
      ChartBase.TITLE_COLOR,
      ChartBase.TITLE_FONT_SIZE,
      ChartBase.TITLE_FONT_FAMILY,
      TextAlignment.Center
    );
  }

  /**
   * Draws the chart-specific content.
   * Derived classes must implement this to provide their specific drawing logic.
   * @param canvas The canvas to draw to
   * @param data The chart data to render
   */
  protected abstract drawContent(canvas: ICanvas, data: ChartData): void;
}
