import { ChartData } from './Models/ChartData';
import { applyOptions } from '../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../Elements/ElementOptions';
import { ChartBase } from './ChartBase';
import { ElementBase } from '../Elements/ElementBase';
import { RenderContext } from '../Rendering/RenderContext';
import { renderTaggedChart } from './ChartTagging';

/**
 * Custom element that renders a chart using ICanvas to PDF.
 */
/** Settable properties declared by {@link ChartElement} itself. */
export const CHART_ELEMENT_OWN_OPTION_KEYS = ['altText', 'isDecorative'] as const;

/** The full settable surface, base included (chart/data are constructor-only). */
export const CHART_ELEMENT_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...CHART_ELEMENT_OWN_OPTION_KEYS] as const;

/** Options for {@link ChartElement}. `chart` and `data` are required constructor values. */
export type ChartElementOptions = ElementOptions &
  Partial<Pick<ChartElement, (typeof CHART_ELEMENT_OWN_OPTION_KEYS)[number]>>;

/**
 * Compatibility wrapper that assigns data to a chart before rendering it.
 * @deprecated Set `chart.data` and add the chart directly.
 */
export class ChartElement extends ElementBase {
  private readonly chart: ChartBase;
  private readonly data: ChartData;

  /**
   * Alternate text used when the document is generated as PDF/UA-1.
   * A chart with alt text is tagged as a Figure; without alt text it is
   * treated as decorative artifact content.
   */
  public altText: string = '';

  /** Marks the chart as decorative even when altText is set. */
  public isDecorative = false;

  /** Creates the chart element from its chart and data, with optional alt text. */
  constructor(chart: ChartBase, data: ChartData, altText?: string);
  /** Creates the chart element with options (alt text, decorative flag, margin). */
  constructor(chart: ChartBase, data: ChartData, options: ChartElementOptions);
  constructor(chart: ChartBase, data: ChartData, altTextOrOptions: string | ChartElementOptions = '') {
    super();
    this.chart = chart;
    this.data = data;
    if (typeof altTextOrOptions === 'string') {
      this.altText = altTextOrOptions;
    } else {
      applyOptions(this, altTextOrOptions);
    }
  }

  protected override getPreferredContentWidth(): number {
    return this.chart.width;
  }

  protected override measureContentHeight(_contentWidth: number): number {
    // If stretching to fit, use container width for measurement
    if (this.chart.stretchToFit) return this.chart.height;
    return this.chart.height;
  }

  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    if (this.chart.stretchToFit) this.chart.width = contentWidth;

    const canvas = ctx.getCanvas(ctx.currentX, ctx.currentY);
    renderTaggedChart(ctx, canvas, this.altText, this.isDecorative, () => this.chart.draw(canvas, this.data));
    ctx.flushExternalCanvas(canvas);

    ctx.currentY += this.chart.height;
  }
}
