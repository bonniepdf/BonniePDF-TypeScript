import { ChartData } from './Models/ChartData';
import { applyOptions } from '../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../Elements/ElementOptions';
import { GroupedBarChart } from './GroupedBarChart';
import { ElementBase } from '../Elements/ElementBase';
import { RenderContext } from '../Rendering/RenderContext';
import { renderTaggedChart } from './ChartTagging';

/**
 * Element that renders a GroupedBarChart to the document.
 */
/** Settable properties declared by {@link GroupedBarChartElement} itself. */
export const GROUPED_BAR_CHART_ELEMENT_OWN_OPTION_KEYS = ['altText', 'isDecorative'] as const;

/** The full settable surface, base included (chart/data are constructor-only). */
export const GROUPED_BAR_CHART_ELEMENT_OPTION_KEYS = [
  ...ELEMENT_OPTION_KEYS,
  ...GROUPED_BAR_CHART_ELEMENT_OWN_OPTION_KEYS,
] as const;

/** Options for {@link GroupedBarChartElement}. `chart` and `data` are required constructor values. */
export type GroupedBarChartElementOptions = ElementOptions &
  Partial<Pick<GroupedBarChartElement, (typeof GROUPED_BAR_CHART_ELEMENT_OWN_OPTION_KEYS)[number]>>;

export class GroupedBarChartElement extends ElementBase {
  private readonly chart: GroupedBarChart;
  private readonly data: ChartData;

  /**
   * Creates a new GroupedBarChartElement.
   * @param chart The grouped bar chart to render
   * @param data The chart data containing series, axis options, and title
   */
  /**
   * Alternate text used when the document is generated as PDF/UA-1.
   * A chart with alt text is tagged as a Figure; without alt text it is
   * treated as decorative artifact content.
   */
  public altText: string = '';

  /** Marks the chart as decorative even when altText is set. */
  public isDecorative = false;

  /** Creates the chart element from its chart and data, with optional alt text. */
  constructor(chart: GroupedBarChart, data: ChartData, altText?: string);
  /** Creates the chart element with options (alt text, decorative flag, margin). */
  constructor(chart: GroupedBarChart, data: ChartData, options: GroupedBarChartElementOptions);
  constructor(chart: GroupedBarChart, data: ChartData, altTextOrOptions: string | GroupedBarChartElementOptions = '') {
    super();
    this.chart = chart;
    this.data = data;
    if (typeof altTextOrOptions === 'string') {
      this.altText = altTextOrOptions;
    } else {
      applyOptions(this, altTextOrOptions);
    }
  }

  /**
   * Measures the height of the chart content.
   */
  protected override measureContentHeight(_contentWidth: number): number {
    return this.chart.height;
  }

  /**
   * Renders the grouped bar chart to the document.
   */
  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    if (this.chart.stretchToFit) this.chart.width = contentWidth;

    const canvas = ctx.getCanvas(ctx.currentX, ctx.currentY);
    renderTaggedChart(ctx, canvas, this.altText, this.isDecorative, () => this.chart.draw(canvas, this.data));
    ctx.flushExternalCanvas(canvas);

    ctx.currentY += this.chart.height;
  }
}
