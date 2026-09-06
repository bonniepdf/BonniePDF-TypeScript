import { ICanvas } from '../Drawing/ICanvas';
import { toColor, type ColorInput } from '../Normalize/toColor';
import { ChartData, type ChartDataOptions } from './Models/ChartData';
import { Color } from '../Core/Color';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { StandardFonts } from '../Typography/StandardFonts';
import { ElementBase } from '../Elements/ElementBase';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../Elements/ElementOptions';
import { RenderContext } from '../Rendering/RenderContext';
import { IRoleProvider } from '../Rendering/Tagging/IRoleProvider';
import { IAltTextProvider } from '../Rendering/Tagging/IAltTextProvider';
import { SemanticRole } from '../Rendering/Tagging/SemanticRole';
import { renderTaggedChart } from './ChartTagging';

/**
 * Base class for all charts that provides common functionality for drawing charts
 * using the ICanvas interface. This ensures charts can be rendered to any backend
 * (PDF, SVG, etc.) without modification.
 */
/** Settable properties declared by {@link ChartBase} itself. */
export const CHART_BASE_OPTION_KEYS = [
  ...ELEMENT_OPTION_KEYS,
  'data',
  'title',
  'width',
  'height',
  'backgroundColor',
  'stretchToFit',
  'svgShapeRendering',
  'altText',
  'isDecorative',
] as const;

/** Options common to every chart. */
export type ChartBaseOptions = ElementOptions &
  Partial<
    Omit<
      Pick<ChartBase, Exclude<(typeof CHART_BASE_OPTION_KEYS)[number], (typeof ELEMENT_OPTION_KEYS)[number]>>,
      'backgroundColor' | 'data'
    >
  > & {
    /** Chart content; accepts a ChartData instance or a nested options literal. */
    data?: ChartData | ChartDataOptions;
    /** Background fill. Accepts a palette token or hex. */
    backgroundColor?: import('../Core/Color').Color | ColorInput;
  };

/** Provides sizing, styling, accessibility, and canvas helpers shared by all charts. */
export abstract class ChartBase extends ElementBase implements IRoleProvider, IAltTextProvider {
  // Title styling constants (matching SVG chart implementation)
  private static readonly TITLE_FONT_SIZE = 20;
  private static readonly TITLE_Y = 35;
  private static readonly TITLE_FONT_FAMILY = StandardFonts.Helvetica;
  private static readonly TITLE_COLOR = Color.fromHex('#333333');

  private _data: ChartData = new ChartData();

  /** Data rendered by this chart when it is used as a document element. */
  public get data(): ChartData {
    return this._data;
  }
  public set data(value: ChartData | ChartDataOptions) {
    this._data = value instanceof ChartData ? value : new ChartData(value);
  }

  /** Visible title drawn inside the chart. */
  public get title(): string {
    return this._data.title;
  }
  public set title(value: string) {
    this._data.title = value;
  }

  /** Alternate text used when the document is generated as PDF/UA-1. */
  public altText: string = '';

  /** Marks the chart as decorative even when altText is set. */
  public isDecorative = false;

  /** Charts self-tag because their positioned canvas is flushed separately. */
  public get handlesOwnTagging(): true {
    return true;
  }

  /** @inheritdoc */
  public get semanticRole(): SemanticRole {
    return this.isDecorative || !this.altText ? SemanticRole.Artifact : SemanticRole.Figure;
  }

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
  private _backgroundColor: Color | undefined;

  /** Background fill. Accepts a palette token or hex; undefined = transparent. */
  public get backgroundColor(): Color | undefined {
    return this._backgroundColor;
  }
  public set backgroundColor(value: ColorInput | undefined) {
    this._backgroundColor = value === undefined ? undefined : toColor(value);
  }

  /**
   * When true, the chart will stretch to fill the container width.
   * The width will be set automatically by the document layout engine.
   */
  stretchToFit: boolean = false;

  /**
   * Preferred root `shape-rendering` for standalone SVG export ({@link
   * SvgExportExtensions.chartToSvg}). `undefined` (the default) keeps the SVG
   * default antialiasing, which is required for charts with diagonal lines,
   * arcs, or circles. Axis-aligned charts (bar, grouped bar) override this to
   * `'crispEdges'` so their bars and gridlines snap to the pixel grid instead
   * of softening into blurred edges. Text is governed by `text-rendering`, so
   * it is unaffected either way.
   */
  svgShapeRendering: 'auto' | 'crispEdges' | undefined = undefined;

  /**
   * Draws the chart to the specified canvas.
   * This method handles the common setup (background, title) and calls the abstract DrawContent method.
   * @param canvas The canvas to draw to
   * @param data The chart data to render
   */
  draw(canvas: ICanvas, data: ChartData = this.data): void {
    // Draw background only if a color is specified
    if (this.backgroundColor !== undefined) {
      canvas.fillRect(0, 0, this.width, this.height, this.backgroundColor);
    }

    // Draw title if present
    if (data.title !== '') {
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

  protected override getPreferredContentWidth(): number {
    return this.width;
  }

  protected override measureContentHeight(_contentWidth: number): number {
    return this.height;
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    if (this.stretchToFit) this.width = contentWidth;

    const insideArtifact = typeof ctx.canvas?.isInsideArtifact === 'function' && ctx.canvas.isInsideArtifact();
    const canvas = ctx.getCanvas(ctx.currentX, ctx.currentY);
    renderTaggedChart(ctx, canvas, this.altText, this.isDecorative || insideArtifact, () => this.draw(canvas));
    ctx.flushExternalCanvas(canvas);

    ctx.currentY += this.height;
  }
}
