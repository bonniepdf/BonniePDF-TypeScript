import { ChartData } from './Models/ChartData';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../Elements/ElementOptions';
import { GroupedBarChart } from './GroupedBarChart';
import { ChartElement } from './ChartElement';

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

/**
 * Compatibility wrapper that assigns data to a grouped bar chart before rendering it.
 * @deprecated Set `chart.data` and add the chart directly.
 */
export class GroupedBarChartElement extends ChartElement {
  /** Creates the chart element from its chart and data, with optional alt text. */
  constructor(chart: GroupedBarChart, data: ChartData, altText?: string);
  /** Creates the chart element with options (alt text, decorative flag, margin). */
  constructor(chart: GroupedBarChart, data: ChartData, options: GroupedBarChartElementOptions);
  constructor(chart: GroupedBarChart, data: ChartData, altTextOrOptions: string | GroupedBarChartElementOptions = '') {
    // The branches are identical by design: `super` resolves against ChartElement's
    // real overloads, which take alt text or an options object but not the union.
    if (typeof altTextOrOptions === 'string') {
      super(chart, data, altTextOrOptions);
    } else {
      super(chart, data, altTextOrOptions);
    }
  }

  /**
   * Reports no preferred width, unlike {@link ChartElement}. This wrapper has never
   * contributed the chart's width to auto-sizing containers, and the spec keeps it
   * that way: reporting one here would change how horizontal stacks and shrink-to-fit
   * containers size an existing document.
   */
  protected override getPreferredContentWidth(): number {
    return 0;
  }
}
