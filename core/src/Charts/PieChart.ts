// Generated chart source. Do not edit here; the source manifest records its provenance.
import { formatChartNumber, sumChartNumbers } from './ChartNumberFormat';
import { ChartData } from './Models/ChartData';
import { applyOptions, Color, Point, type ICanvas, TextAlignment } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions } from './ChartBase';
import { ChartDataPoint } from './Models/ChartDataPoint';
import { ChartBase } from './ChartBase';
import type { ChartPathCommand, ChartPathPlan } from './Graphics/ChartPathPlan';
import { tintColor } from './Graphics/ChartTint';
import { contrastTextColor } from './Graphics/ChartValueScale';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';

/** Format of legend rows on a {@link PieChart}. */
export type PieLegendFormat = 'labelValue' | 'labelPercent' | 'labelValuePercent' | 'labelOnly';
/** Placement of data labels directly on pie slices (`none`, `inside`, or `callout`). */
export type PieSliceLabelMode = 'none' | 'inside' | 'callout';

/** Settable properties declared by {@link PieChart} itself. */
export const PIE_CHART_OWN_OPTION_KEYS = [
  'colors',
  'isDonut',
  'donutHoleRatio',
  'sliceBorderWidth',
  'totalLabel',
  'totalValueFormat',
  'valueFormat',
  'percentFormat',
  'legendFormat',
  'sliceLabelMode',
  'showLegend',
  'showTotal',
  'totalPosition',
  'sliceGradient',
] as const;

/** The full option surface, base included. */
export const PIE_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...PIE_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link PieChart}. Intersects {@link ChartBaseOptions}. */
export type PieChartOptions = ChartBaseOptions & Partial<Pick<PieChart, (typeof PIE_CHART_OWN_OPTION_KEYS)[number]>>;

const ROUNDED_K = (4 / 3) * (Math.SQRT2 - 1);

/** Renders a data series as proportional slices of a circle. */
export class PieChart extends ChartBase {
  private static readonly TITLE_AREA_HEIGHT = 60;
  private static readonly TOP_PADDING = 20;
  private static readonly BOTTOM_PADDING = 20;
  private static readonly LEFT_PADDING = 20;
  private static readonly LEGEND_GAP_FROM_PIE = 30;
  private static readonly RIGHT_PADDING = 20;

  private static readonly LEGEND_ITEM_HEIGHT = 24;
  private static readonly LEGEND_BOX_SIZE = 14;
  private static readonly LEGEND_BOX_TEXT_GAP = 8;
  private static readonly LEGEND_FONT_SIZE = 11;
  private static readonly TOTAL_ROW_GAP = 8;

  private static readonly DEFAULT_DONUT_HOLE_RATIO = 0.33;
  private static readonly CENTRE_TOTAL_HOLE_RATIO = 0.56;
  private static readonly CENTRE_VALUE_MAX_SIZE = 22;
  private static readonly CENTRE_VALUE_MIN_SIZE = 7;
  private static readonly CENTRE_LABEL_GAP = 3;
  private static readonly CENTRE_VALUE_COLOR = Color.fromHex('#111827');

  private static readonly DEFAULT_COLORS = [
    '#4f46e5',
    '#7c3aed',
    '#a855f7',
    '#d946ef',
    '#ec4899',
    '#f43f5e',
    '#f97316',
    '#eab308',
    '#84cc16',
    '#22c55e',
    '#14b8a6',
    '#06b6d4',
  ];

  constructor(options?: PieChartOptions) {
    super();
    const { data, ...rest } = options ?? {};
    if (data !== undefined) this.data = data;
    applyOptions(this, rest);
  }

  /** Optional custom hex colour palette cycled across slices. */
  colors: string[] | undefined;
  /** Whether to draw a donut ring with a hollow centre instead of a filled pie. */
  isDonut: boolean = true;

  private _donutHoleRatio: number | undefined;
  /** Optional explicit inner/outer radius ratio (`0..0.85`) when `isDonut` is true. */
  get donutHoleRatio(): number | undefined {
    return this._donutHoleRatio;
  }
  set donutHoleRatio(value: number | undefined) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0 || value > 0.85)) {
      throw new RangeError('donutHoleRatio must be finite and between 0 and 0.85.');
    }
    this._donutHoleRatio = value;
  }

  /** Optional background-coloured separator stroke width between slices in points. */
  sliceBorderWidth: number = 0;

  /** Label displayed beside or above the total value. */
  totalLabel: string = 'Total';
  /** Optional number format for the total value. */
  totalValueFormat: string | undefined;
  /** Optional number format for legend and callout slice values. */
  valueFormat: string | undefined;
  /** Percentage format when `legendFormat` or `sliceLabelMode` displays percentages (default `F0`). */
  percentFormat: string = 'F0';
  /** Format of legend rows (`labelValue`, `labelPercent`, `labelValuePercent`, `labelOnly`). */
  legendFormat: PieLegendFormat = 'labelValue';
  /** Direct slice label placement (`none`, `inside`, or `callout`). */
  sliceLabelMode: PieSliceLabelMode = 'none';
  /** Whether to display the legend beside the chart. */
  showLegend: boolean = true;
  /** Whether to display the sum of all slice values. */
  showTotal: boolean = true;
  /** Where to render the total (`legend` or donut `center`). */
  totalPosition: 'legend' | 'center' = 'legend';
  /** Whether to shade each slice with a subtle tonal gradient. */
  sliceGradient: boolean = false;

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return super.usesStyledGeometry || this.sliceGradient || this.sliceBorderWidth > 0 || this.sliceLabelMode === 'callout';
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (data.series.length === 0 || data.series[0].dataPoints.length === 0) return;

    const dataPoints = data.series[0].dataPoints;
    const total = dataPoints.reduce((sum, dp) => sum + dp.value, 0);
    const layout = this.calculateLayout(canvas, dataPoints, total, data.title !== '', data.subtitle !== '');
    const angles = this.calculateSliceAngles(dataPoints, total);
    const colors = this.getColors(dataPoints.length);

    this.drawPieSlices(canvas, dataPoints, angles, colors, layout);

    if (this.sliceLabelMode === 'inside') {
      this.drawInsideSliceLabels(canvas, dataPoints, angles, colors, layout, total);
    } else if (this.sliceLabelMode === 'callout') {
      this.drawCalloutLabels(canvas, dataPoints, angles, layout, total);
    }

    if (this.showLegend) {
      this.drawLegend(canvas, dataPoints, colors, layout, total);
    }

    if (this.showTotal && this.totalInCentre) {
      this.drawCentreTotal(canvas, dataPoints, layout);
    }
  }

  private get totalInCentre(): boolean {
    return this.isDonut && this.totalPosition === 'center';
  }

  private totalValueText(dataPoints: ChartDataPoint[]): string {
    return formatChartNumber(
      sumChartNumbers(dataPoints.map((dp) => dp.value)),
      this.totalValueFormat
    );
  }

  private formatSliceValue(dp: ChartDataPoint): string {
    if (dp.hasExplicitLabelFormat) return dp.formattedValue;
    return this.valueFormat ? formatChartNumber(dp.value, this.valueFormat) : dp.formattedValue;
  }

  private formatSlicePercent(value: number, total: number): string {
    const pct = total > 0 ? (value / total) * 100 : 0;
    return `${formatChartNumber(pct, this.percentFormat)}%`;
  }

  private formatLegendEntry(dp: ChartDataPoint, total: number): string {
    switch (this.legendFormat) {
      case 'labelOnly': return dp.label;
      case 'labelPercent': return `${dp.label} (${this.formatSlicePercent(dp.value, total)})`;
      case 'labelValuePercent': return `${dp.label} - ${this.formatSliceValue(dp)} (${this.formatSlicePercent(dp.value, total)})`;
      default: return `${dp.label} - ${this.formatSliceValue(dp)}`;
    }
  }

  private drawCentreTotal(canvas: ICanvas, dataPoints: ChartDataPoint[], layout: PieLayout): void {
    const value = this.totalValueText(dataPoints);
    const maxWidth = layout.donutHoleRadius * 1.6;
    let size = Math.min(PieChart.CENTRE_VALUE_MAX_SIZE, Math.floor(layout.donutHoleRadius * 0.45));
    const boldFont = this.resolveTitleFontFamily();
    const regularFont = this.resolveFontFamily();
    while (size > PieChart.CENTRE_VALUE_MIN_SIZE && canvas.measureText(value, size, boldFont).width > maxWidth) {
      size -= 1;
    }
    const labelSize = Math.max(PieChart.CENTRE_VALUE_MIN_SIZE, Math.round(size * 0.55));
    const hasLabel = this.totalLabel !== '';
    const blockHeight = size + (hasLabel ? PieChart.CENTRE_LABEL_GAP + labelSize : 0);
    const top = layout.centerY - blockHeight / 2;
    const valueColor = this.appearance.backgroundColor ? this.appearance.titleColor : PieChart.CENTRE_VALUE_COLOR;
    canvas.drawText(layout.centerX, top, value, valueColor, size, boldFont, TextAlignment.Center);
    if (hasLabel) {
      canvas.drawText(
        layout.centerX,
        top + size + PieChart.CENTRE_LABEL_GAP,
        this.totalLabel,
        this.appearance.legendTextColor,
        labelSize,
        regularFont,
        TextAlignment.Center
      );
    }
  }

  private calculateLayout(
    canvas: ICanvas,
    dataPoints: ChartDataPoint[],
    total: number,
    hasTitle: boolean,
    hasSubtitle: boolean
  ): PieLayout {
    const titleBand = (hasTitle ? PieChart.TITLE_AREA_HEIGHT : 0) + (hasSubtitle ? 18 : 0);
    const captionBand = this.caption !== '' ? 16 : 0;
    const availableHeight = this.height - titleBand - PieChart.TOP_PADDING - PieChart.BOTTOM_PADDING - captionBand;
    const font = this.resolveFontFamily();

    let legendWidth = 0;
    if (this.showLegend) {
      if (this.autoLayout) {
        let maxW = 0;
        for (const dp of dataPoints) {
          const w = canvas.measureText(this.formatLegendEntry(dp, total), PieChart.LEGEND_FONT_SIZE, font).width;
          if (w > maxW) maxW = w;
        }
        if (this.showTotal && !this.totalInCentre) {
          const tw = canvas.measureText(`${this.totalLabel}: ${this.totalValueText(dataPoints)}`, PieChart.LEGEND_FONT_SIZE, font).width;
          if (tw > maxW) maxW = tw;
        }
        legendWidth = Math.max(80, Math.min(this.width * 0.45, Math.ceil(PieChart.LEGEND_BOX_SIZE + PieChart.LEGEND_BOX_TEXT_GAP + maxW + 6)));
      } else {
        legendWidth = PieChart.LEGEND_BOX_SIZE + PieChart.LEGEND_BOX_TEXT_GAP + 150;
      }
    }

    let calloutReserve = 0;
    if (this.sliceLabelMode === 'callout') {
      let maxLbl = 0;
      for (const dp of dataPoints) {
        const w = canvas.measureText(`${dp.label} ${this.formatSlicePercent(dp.value, total)}`, 9, font).width;
        if (w > maxLbl) maxLbl = w;
      }
      calloutReserve = Math.min(this.width * 0.25, maxLbl + 24);
    }

    let availableWidthForPie = this.width - PieChart.LEFT_PADDING - PieChart.RIGHT_PADDING - calloutReserve * 2;
    if (this.showLegend) {
      availableWidthForPie -= legendWidth + PieChart.LEGEND_GAP_FROM_PIE;
    }

    const maxRadiusFromWidth = availableWidthForPie / 2;
    const maxRadiusFromHeight = availableHeight / 2;
    let pieRadius = Math.min(maxRadiusFromWidth, maxRadiusFromHeight);
    pieRadius = Math.max(pieRadius, 20);

    const pieCenterY = titleBand + PieChart.TOP_PADDING + availableHeight / 2;
    const pieAreaWidth =
      this.width -
      (this.showLegend ? legendWidth + PieChart.LEGEND_GAP_FROM_PIE + PieChart.RIGHT_PADDING : PieChart.RIGHT_PADDING) -
      PieChart.LEFT_PADDING;
    const pieCenterX = PieChart.LEFT_PADDING + pieAreaWidth / 2;
    const legendX = pieCenterX + pieRadius + calloutReserve + PieChart.LEGEND_GAP_FROM_PIE;
    const totalLegendHeight = dataPoints.length * PieChart.LEGEND_ITEM_HEIGHT;
    const legendStartY = pieCenterY - totalLegendHeight / 2;

    const holeRatio = !this.isDonut
      ? 0
      : this._donutHoleRatio !== undefined
        ? this._donutHoleRatio
        : this.totalInCentre && this.showTotal
          ? PieChart.CENTRE_TOTAL_HOLE_RATIO
          : PieChart.DEFAULT_DONUT_HOLE_RATIO;

    return new PieLayout(
      pieCenterX,
      pieCenterY,
      pieRadius,
      pieRadius * holeRatio,
      legendX,
      legendStartY,
      titleBand + PieChart.TOP_PADDING,
      this.height - PieChart.BOTTOM_PADDING - captionBand
    );
  }

  private calculateSliceAngles(dataPoints: ChartDataPoint[], total: number): { startAngle: number; endAngle: number }[] {
    const angles: { startAngle: number; endAngle: number }[] = [];
    let currentAngle = -90;
    for (const dataPoint of dataPoints) {
      const sliceAngle = total > 0 ? 360 * (dataPoint.value / total) : 0;
      const endAngle = currentAngle + sliceAngle;
      angles.push({ startAngle: currentAngle, endAngle });
      currentAngle = endAngle;
    }
    return angles;
  }

  private getColors(count: number): Color[] {
    const colors: Color[] = [];
    const sourceColors = this.colors ?? PieChart.DEFAULT_COLORS;
    for (let i = 0; i < count; i++) {
      colors.push(Color.fromHex(sourceColors[i % sourceColors.length]));
    }
    return colors;
  }

  private drawPieSlices(
    canvas: ICanvas,
    dataPoints: ChartDataPoint[],
    angles: { startAngle: number; endAngle: number }[],
    colors: Color[],
    layout: PieLayout
  ): void {
    const borderColor = this.effectiveBackgroundColor ?? Color.white;
    for (let i = 0; i < dataPoints.length; i++) {
      const { startAngle, endAngle } = angles[i];
      if (endAngle <= startAngle) continue;
      const color = colors[i];
      const path = this.isDonut
        ? this.createAnnularSectorPath(startAngle, endAngle, layout)
        : this.createPieSlicePath(startAngle, endAngle, layout);
      if (this.sliceGradient) fillChartPath(canvas, this.gradientSlice(path, startAngle, endAngle, color, layout));
      else canvas.fillPath(path, color);

      if (this.sliceBorderWidth > 0) {
        const cmds: ChartPathCommand[] = [
          ...path.map((p, n) => ({ op: n === 0 ? ('M' as const) : ('L' as const), values: [p.x, p.y] })),
          { op: 'Z' as const, values: [] },
        ];
        strokeChartPath(canvas, {
          commands: cmds,
          color: borderColor,
          lineWidth: this.sliceBorderWidth,
          lineJoin: 'round',
        });
      }
    }
  }

  private drawInsideSliceLabels(
    canvas: ICanvas,
    dataPoints: ChartDataPoint[],
    angles: { startAngle: number; endAngle: number }[],
    colors: Color[],
    layout: PieLayout,
    total: number
  ): void {
    const font = this.resolveFontFamily();
    const fontSize = 9;
    const midRadius = this.isDonut ? (layout.donutHoleRadius + layout.radius) / 2 : layout.radius * 0.65;
    for (let i = 0; i < dataPoints.length; i++) {
      const dp = dataPoints[i];
      if (dp.value <= 0) continue;
      const { startAngle, endAngle } = angles[i];
      const spanRad = ((endAngle - startAngle) * Math.PI) / 180;
      const text = this.formatSlicePercent(dp.value, total);
      const measured = canvas.measureText(text, fontSize, font);
      const chord = 2 * midRadius * Math.sin(Math.min(Math.PI, spanRad) / 2);
      if (chord < measured.width + 4) continue;
      const midRad = (((startAngle + endAngle) / 2) * Math.PI) / 180;
      const x = layout.centerX + midRadius * Math.cos(midRad);
      const y = layout.centerY + midRadius * Math.sin(midRad) - fontSize / 2;
      canvas.drawText(x, y, text, contrastTextColor(colors[i]), fontSize, font, TextAlignment.Center);
    }
  }

  private drawCalloutLabels(
    canvas: ICanvas,
    dataPoints: ChartDataPoint[],
    angles: { startAngle: number; endAngle: number }[],
    layout: PieLayout,
    total: number
  ): void {
    const font = this.resolveFontFamily();
    const fontSize = 9;
    const rowHeight = fontSize + 4;
    type Entry = { text: string; midRad: number; anchorY: number; y: number };
    const right: Entry[] = [];
    const left: Entry[] = [];

    for (let i = 0; i < dataPoints.length; i++) {
      const dp = dataPoints[i];
      if (dp.value <= 0) continue;
      const { startAngle, endAngle } = angles[i];
      const midRad = (((startAngle + endAngle) / 2) * Math.PI) / 180;
      const anchorY = layout.centerY + layout.radius * Math.sin(midRad);
      const text = `${dp.label} ${this.formatSlicePercent(dp.value, total)}`;
      const entry: Entry = { text, midRad, anchorY, y: anchorY };
      if (Math.cos(midRad) >= 0) right.push(entry);
      else left.push(entry);
    }

    const relax = (items: Entry[], isRight: boolean): void => {
      items.sort((a, b) => a.anchorY - b.anchorY);
      for (let i = 1; i < items.length; i++) {
        if (items[i].y < items[i - 1].y + rowHeight) items[i].y = items[i - 1].y + rowHeight;
      }
      if (items.length > 0 && items[items.length - 1].y > layout.plotBottom - rowHeight / 2) {
        items[items.length - 1].y = layout.plotBottom - rowHeight / 2;
        for (let i = items.length - 2; i >= 0; i--) {
          if (items[i].y > items[i + 1].y - rowHeight) items[i].y = items[i + 1].y - rowHeight;
        }
        if (items[0].y < layout.plotTop + rowHeight / 2) {
          items[0].y = layout.plotTop + rowHeight / 2;
        }
      }
      const dir = isRight ? 1 : -1;
      const endX = layout.centerX + dir * (layout.radius + 18);
      for (const item of items) {
        const sx = layout.centerX + (layout.radius + 2) * Math.cos(item.midRad);
        const sy = layout.centerY + (layout.radius + 2) * Math.sin(item.midRad);
        const mx = layout.centerX + (layout.radius + 10) * Math.cos(item.midRad);
        const my = layout.centerY + (layout.radius + 10) * Math.sin(item.midRad);
        strokeChartPath(canvas, {
          commands: [
            { op: 'M', values: [sx, sy] },
            { op: 'L', values: [mx, my] },
            { op: 'L', values: [endX, item.y] },
          ],
          color: this.appearance.axisColor,
          lineWidth: 0.75,
          lineJoin: 'round',
        });
        canvas.drawText(
          endX + dir * 4,
          item.y - fontSize / 2,
          item.text,
          this.appearance.legendTextColor,
          fontSize,
          font,
          isRight ? TextAlignment.Left : TextAlignment.Right
        );
      }
    };

    relax(right, true);
    relax(left, false);
  }

  private gradientSlice(path: Point[], startAngle: number, endAngle: number, color: Color, layout: PieLayout): ChartPathPlan {
    const middle = (((startAngle + endAngle) / 2) * Math.PI) / 180;
    const inner = this.isDonut ? layout.donutHoleRadius : 0;
    return {
      commands: [
        ...path.map((p, n) => ({ op: n === 0 ? ('M' as const) : ('L' as const), values: [p.x, p.y] })),
        { op: 'Z' as const, values: [] },
      ],
      color,
      gradient: {
        startX: layout.centerX + inner * Math.cos(middle),
        startY: layout.centerY + inner * Math.sin(middle),
        endX: layout.centerX + layout.radius * Math.cos(middle),
        endY: layout.centerY + layout.radius * Math.sin(middle),
        startColor: tintColor(color),
        endColor: color,
      },
    };
  }

  private createPieSlicePath(startAngle: number, endAngle: number, layout: PieLayout): Point[] {
    const path: Point[] = [new Point(layout.centerX, layout.centerY)];
    const segments = Math.max(Math.ceil((endAngle - startAngle) / 5), 1);
    for (let i = 0; i <= segments; i++) {
      const radians = ((startAngle + ((endAngle - startAngle) * i) / segments) * Math.PI) / 180;
      path.push(new Point(layout.centerX + layout.radius * Math.cos(radians), layout.centerY + layout.radius * Math.sin(radians)));
    }
    return path;
  }

  private createAnnularSectorPath(startAngle: number, endAngle: number, layout: PieLayout): Point[] {
    const path: Point[] = [];
    const segments = Math.max(Math.ceil((endAngle - startAngle) / 5), 1);
    for (let i = 0; i <= segments; i++) {
      const radians = ((startAngle + ((endAngle - startAngle) * i) / segments) * Math.PI) / 180;
      path.push(new Point(layout.centerX + layout.radius * Math.cos(radians), layout.centerY + layout.radius * Math.sin(radians)));
    }
    for (let i = segments; i >= 0; i--) {
      const radians = ((startAngle + ((endAngle - startAngle) * i) / segments) * Math.PI) / 180;
      path.push(new Point(layout.centerX + layout.donutHoleRadius * Math.cos(radians), layout.centerY + layout.donutHoleRadius * Math.sin(radians)));
    }
    return path;
  }

  private drawLegendSwatch(canvas: ICanvas, x: number, y: number, color: Color): void {
    if (!this.appearance.roundedLegendSwatches) {
      canvas.fillRect(x, y, PieChart.LEGEND_BOX_SIZE, PieChart.LEGEND_BOX_SIZE, color);
      return;
    }
    const s = 12;
    const ox = x + 1;
    const oy = y + 1;
    const r = 3;
    const c = ROUNDED_K * r;
    fillChartPath(canvas, {
      commands: [
        { op: 'M', values: [ox + r, oy] },
        { op: 'L', values: [ox + s - r, oy] },
        { op: 'C', values: [ox + s - r + c, oy, ox + s, oy + r - c, ox + s, oy + r] },
        { op: 'L', values: [ox + s, oy + s - r] },
        { op: 'C', values: [ox + s, oy + s - r + c, ox + s - r + c, oy + s, ox + s - r, oy + s] },
        { op: 'L', values: [ox + r, oy + s] },
        { op: 'C', values: [ox + r - c, oy + s, ox, oy + s - r + c, ox, oy + s - r] },
        { op: 'L', values: [ox, oy + r] },
        { op: 'C', values: [ox, oy + r - c, ox + r - c, oy, ox + r, oy] },
        { op: 'Z', values: [] },
      ],
      color,
    });
  }

  private drawLegend(
    canvas: ICanvas,
    dataPoints: ChartDataPoint[],
    colors: Color[],
    layout: PieLayout,
    total: number
  ): void {
    const textColor = this.appearance.legendTextColor;
    const font = this.resolveFontFamily();

    for (let i = 0; i < dataPoints.length; i++) {
      const dataPoint = dataPoints[i];
      const color = colors[i];
      const y = layout.legendStartY + i * PieChart.LEGEND_ITEM_HEIGHT;

      this.drawLegendSwatch(canvas, layout.legendX, y, color);

      const labelText = this.formatLegendEntry(dataPoint, total);
      const textX = layout.legendX + PieChart.LEGEND_BOX_SIZE + PieChart.LEGEND_BOX_TEXT_GAP;
      const textY = y + PieChart.LEGEND_BOX_SIZE / 2 - PieChart.LEGEND_FONT_SIZE / 2;
      canvas.drawText(textX, textY, labelText, textColor, PieChart.LEGEND_FONT_SIZE, font, TextAlignment.Left);
    }

    if (this.showTotal && !this.totalInCentre) {
      const totalText = `${this.totalLabel}: ${this.totalValueText(dataPoints)}`;
      const textX = layout.legendX + PieChart.LEGEND_BOX_SIZE + PieChart.LEGEND_BOX_TEXT_GAP;
      const totalY = layout.legendStartY + dataPoints.length * PieChart.LEGEND_ITEM_HEIGHT + PieChart.TOTAL_ROW_GAP;
      canvas.drawText(textX, totalY, totalText, textColor, PieChart.LEGEND_FONT_SIZE, font, TextAlignment.Left);
    }
  }
}

class PieLayout {
  constructor(
    public centerX: number,
    public centerY: number,
    public radius: number,
    public donutHoleRadius: number,
    public legendX: number,
    public legendStartY: number,
    public plotTop: number,
    public plotBottom: number
  ) {}
}
