// Generated chart source. Do not edit here; the source manifest records its provenance.
import { formatChartNumber, sumChartNumbers } from './ChartNumberFormat';
import { ChartData } from './Models/ChartData';
import { applyOptions, Color, Point, type ICanvas, TextAlignment } from './ChartHost';
import { CHART_BASE_OPTION_KEYS, type ChartBaseOptions } from './ChartBase';
import { ChartDataPoint } from './Models/ChartDataPoint';
import { ChartBase } from './ChartBase';
import type { ChartGradientStop, ChartPathCommand, ChartPathPlan, ChartResolvedEffect } from './Graphics/ChartPathPlan';
import { toEffects, type ChartEffectInput } from './Graphics/ChartEffects';
import { darkenColor, tintColor } from './Graphics/ChartTint';
import { PIE3D_MAX_SLICES, resolvePie3d, type ChartPie3d } from './Graphics/ChartPie3d';
import { contrastTextColor } from './Graphics/ChartValueScale';
import { fillChartPath, strokeChartPath, withChartGroup } from './Graphics/ChartVector';

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
  'sliceEffects',
  'pie3d',
  'explodedSlices',
  'explodeOffset',
] as const;

/** The full option surface, base included. */
export const PIE_CHART_OPTION_KEYS = [...CHART_BASE_OPTION_KEYS, ...PIE_CHART_OWN_OPTION_KEYS] as const;

/** Options for {@link PieChart}. Intersects {@link ChartBaseOptions}. */
export type PieChartOptions = ChartBaseOptions &
  Partial<Omit<Pick<PieChart, (typeof PIE_CHART_OWN_OPTION_KEYS)[number]>, 'sliceEffects'>> & {
    /** Shadow, glow or gloss for every slice. */
    sliceEffects?: readonly ChartEffectInput[];
  };

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

  /** The label placement drawn: a tilted pie writes its shares inside the slices unless `pie3d.labels` is `false`. */
  private get effectiveSliceLabelMode(): PieSliceLabelMode {
    return this.sliceLabelMode === 'none' && this._pie3d !== undefined && this._pie3d.labels !== false ? 'inside' : this.sliceLabelMode;
  }

  private _explodedSlices: number[] = [];
  /** Indices of the slices pulled out from the centre, along the middle of each slice. */
  get explodedSlices(): readonly number[] {
    return this._explodedSlices;
  }
  set explodedSlices(value: readonly number[]) {
    for (const i of value) if (!Number.isInteger(i) || i < 0) throw new RangeError('explodedSlices must hold slice indices: integers from 0.');
    this._explodedSlices = [...value];
  }

  private _explodeOffset = 16;
  /** How far exploded slices move out, in points (`16`). */
  get explodeOffset(): number {
    return this._explodeOffset;
  }
  set explodeOffset(value: number) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('explodeOffset must be finite and nonnegative.');
    this._explodeOffset = value;
  }

  /** Whether any slice is pulled out. */
  private get isExploded(): boolean {
    return this._explodedSlices.length > 0 && this._explodeOffset > 0;
  }

  /** The layout of slice `i`: the pie's, moved out along the slice's middle when the slice is exploded. */
  private sliceLayout(i: number, angles: { startAngle: number; endAngle: number }[], layout: PieLayout): PieLayout {
    if (!this.isExploded || !this._explodedSlices.includes(i)) return layout;
    const mid = (((angles[i].startAngle + angles[i].endAngle) / 2) * Math.PI) / 180;
    const dx = this._explodeOffset * Math.cos(mid);
    const dy = this._explodeOffset * Math.sin(mid) * layout.yScale;
    return new PieLayout(layout.centerX + dx, layout.centerY + dy, layout.radius, layout.donutHoleRadius, layout.legendX, layout.legendStartY, layout.plotTop, layout.plotBottom, layout.yScale, layout.depth);
  }

  private _pie3d: ChartPie3d | undefined;
  /** Tilts the pie and gives its slices side walls: at most eight slices. Flat pies are easier to read accurately. */
  get pie3d(): ChartPie3d | undefined {
    return this._pie3d;
  }
  set pie3d(value: ChartPie3d | undefined) {
    resolvePie3d(value);
    this._pie3d = value === undefined ? undefined : { ...value };
  }
  /** Whether to display the legend beside the chart. */
  showLegend: boolean = true;
  /** Whether to display the sum of all slice values. */
  showTotal: boolean = true;
  /** Where to render the total (`legend` or donut `center`). */
  totalPosition: 'legend' | 'center' = 'legend';
  /** Whether to shade each slice with a subtle tonal gradient. */
  sliceGradient: boolean = false;

  private get effectiveSliceGradient(): boolean {
    return this.sliceGradient || this.appearance.autoFill === 'tint';
  }

  private get effectiveSliceEffects(): readonly ChartResolvedEffect[] {
    return this._sliceEffects.length > 0 ? this._sliceEffects : this.appearance.sliceEffects;
  }

  private _sliceEffects: ChartResolvedEffect[] = [];
  /** Shadow, glow or gloss for every slice. */
  get sliceEffects(): readonly ChartResolvedEffect[] {
    return this._sliceEffects;
  }
  set sliceEffects(value: readonly ChartEffectInput[] | undefined) {
    this._sliceEffects = toEffects(value);
  }

  /** @internal */
  override get usesStyledGeometry(): boolean {
    return super.usesStyledGeometry || this._pie3d !== undefined || this.effectiveSliceGradient || this.effectiveSliceEffects.length > 0 || this.appearance.markOutline !== 'none' || this.sliceBorderWidth > 0 || this.sliceLabelMode === 'callout';
  }

  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (data.series.length === 0 || data.series[0].dataPoints.length === 0) return;

    const dataPoints = data.series[0].dataPoints;
    if (this._pie3d !== undefined && dataPoints.length > PIE3D_MAX_SLICES) throw new RangeError(`A pie3d chart takes at most ${PIE3D_MAX_SLICES} slices.`);
    const total = dataPoints.reduce((sum, dp) => sum + dp.value, 0);
    const layout = this.calculateLayout(canvas, dataPoints, total, data.title !== '', data.subtitle !== '');
    const angles = this.calculateSliceAngles(dataPoints, total);
    const colors = this.getColors(dataPoints.length, dataPoints);

    for (const i of this._explodedSlices) if (i >= dataPoints.length) throw new RangeError(`explodedSlices names slice ${i}, but the pie has ${dataPoints.length} slices.`);
    if (this._pie3d !== undefined && this.isExploded) {
      // Exploded slices are separate solids: paint them back to front, each with its walls and then its top.
      const front = ({ startAngle: s, endAngle: e }: { startAngle: number; endAngle: number }): number =>
        s <= 90 && e >= 90 ? 1 : Math.max(Math.sin((s * Math.PI) / 180), Math.sin((e * Math.PI) / 180));
      const order = angles.map((_, i) => i).sort((a, b) => front(angles[a]) - front(angles[b]) || a - b);
      this.drawPieSlices(canvas, dataPoints, angles, colors, layout, data.series[0].name, order, (i) => this.drawSliceSolid(canvas, i, angles, colors, layout));
    } else {
      this.drawPieWalls(canvas, angles, colors, layout);
      this.drawPieSlices(canvas, dataPoints, angles, colors, layout, data.series[0].name);
    }

    const labelMode = this.effectiveSliceLabelMode;
    if (labelMode === 'inside') {
      this.drawInsideSliceLabels(canvas, dataPoints, angles, colors, layout, total);
    } else if (labelMode === 'callout') {
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
    const geometry = resolvePie3d(this._pie3d);
    const yScale = geometry?.yScale ?? 1;
    const depth = geometry?.depth ?? 0;
    const maxRadiusFromHeight = geometry === undefined ? availableHeight / 2 : (availableHeight - depth) / (2 * yScale);
    let pieRadius = Math.min(maxRadiusFromWidth, maxRadiusFromHeight);
    if (this.isExploded) pieRadius -= this._explodeOffset;
    pieRadius = Math.max(pieRadius, 20);

    let pieCenterY = titleBand + PieChart.TOP_PADDING + availableHeight / 2;
    let blockCenterY = pieCenterY;
    if (geometry !== undefined) {
      const blockHeight = 2 * pieRadius * yScale + depth;
      const blockTop = titleBand + PieChart.TOP_PADDING + (availableHeight - blockHeight) / 2;
      pieCenterY = blockTop + pieRadius * yScale;
      blockCenterY = blockTop + blockHeight / 2;
    }
    const pieAreaWidth =
      this.width -
      (this.showLegend ? legendWidth + PieChart.LEGEND_GAP_FROM_PIE + PieChart.RIGHT_PADDING : PieChart.RIGHT_PADDING) -
      PieChart.LEFT_PADDING;
    const pieCenterX = PieChart.LEFT_PADDING + pieAreaWidth / 2;
    const legendX = pieCenterX + pieRadius + calloutReserve + PieChart.LEGEND_GAP_FROM_PIE;
    const totalLegendHeight = dataPoints.length * PieChart.LEGEND_ITEM_HEIGHT;
    const legendStartY = blockCenterY - totalLegendHeight / 2;

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
      this.height - PieChart.BOTTOM_PADDING - captionBand,
      yScale,
      depth
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

  private getColors(count: number, dataPoints: readonly ChartDataPoint[] = []): Color[] {
    const colors: Color[] = [];
    const sourceColors = this.colors ?? PieChart.DEFAULT_COLORS;
    for (let i = 0; i < count; i++) {
      // A point's own fill or colour wins over the palette; a gradient fill stands in as its middle colour.
      const own = dataPoints[i]?.fill?.color ?? dataPoints[i]?.color;
      colors.push(own ?? Color.fromHex(sourceColors[i % sourceColors.length]));
    }
    return colors;
  }

  private drawPieSlices(
    canvas: ICanvas,
    dataPoints: ChartDataPoint[],
    angles: { startAngle: number; endAngle: number }[],
    colors: Color[],
    pieLayout: PieLayout,
    seriesName: string,
    order?: readonly number[],
    beforeSlice?: (i: number) => void
  ): void {
    const total = dataPoints.reduce((sum, dp) => sum + dp.value, 0);
    const borderColor = this.effectiveBackgroundColor ?? Color.white;
    for (const i of order ?? dataPoints.map((_, n) => n)) {
      const { startAngle, endAngle } = angles[i];
      if (endAngle <= startAngle) continue;
      beforeSlice?.(i);
      const layout = this.sliceLayout(i, angles, pieLayout);
      withChartGroup(
        canvas,
        () => ({
          role: 'mark',
          seriesIndex: 0,
          pointIndex: i,
          name: dataPoints[i].label,
          description: this.describeMark('{label}: {value} ({percent})', {
            series: seriesName,
            label: dataPoints[i].label,
            value: this.formatSliceValue(dataPoints[i]),
            percent: `${this.formatSlicePercent(dataPoints[i].value, total)}`,
            raw: dataPoints[i].value,
          }),
          anchor: { x: layout.centerX, y: layout.centerY, axis: 'both' },
        }),
        () => {
          const color = colors[i];
          const path = this.isDonut
            ? this.createAnnularSectorPath(startAngle, endAngle, layout)
            : this.createPieSlicePath(startAngle, endAngle, layout);
          const pointFill = dataPoints[i].fill;
          if (pointFill && pointFill.kind !== 'solid') {
            const box = { x: layout.centerX - layout.radius, y: layout.centerY - layout.radius * layout.yScale, width: layout.radius * 2, height: layout.radius * 2 * layout.yScale };
            const commands: ChartPathCommand[] = [
              ...path.map((p, n) => ({ op: n === 0 ? ('M' as const) : ('L' as const), values: [p.x, p.y] })),
              { op: 'Z' as const, values: [] },
            ];
            fillChartPath(canvas, { commands, ...pointFill.resolve(this.fillBoxes(box)) });
          } else if (this.effectiveSliceGradient) {
            const plan = this.gradientSlice(path, startAngle, endAngle, color, layout);
            fillChartPath(canvas, this.effectiveSliceEffects.length > 0 ? { ...plan, effects: this.effectiveSliceEffects } : plan);
          } else if (this.effectiveSliceEffects.length > 0) {
            const commands: ChartPathCommand[] = [
              ...path.map((p, n) => ({ op: n === 0 ? ('M' as const) : ('L' as const), values: [p.x, p.y] })),
              { op: 'Z' as const, values: [] },
            ];
            fillChartPath(canvas, { commands, color, effects: this.effectiveSliceEffects });
          } else canvas.fillPath(path, color);

          if (this._pie3d !== undefined && this.isExploded && this._explodedSlices.includes(i)) {
            // A lit bevel along the top edges of a pulled-out slice, so the top reads as a separate surface from its walls.
            strokeChartPath(canvas, {
              commands: [...path.map((p, n) => ({ op: n === 0 ? ('M' as const) : ('L' as const), values: [p.x, p.y] })), { op: 'Z' as const, values: [] }],
              color: PieChart.edgeHighlight(color),
              lineWidth: 1,
              lineJoin: 'round',
            });
          }

          if (this.appearance.markOutline === 'darker') {
            strokeChartPath(canvas, {
              commands: [
                ...path.map((p, n) => ({ op: n === 0 ? ('M' as const) : ('L' as const), values: [p.x, p.y] })),
                { op: 'Z' as const, values: [] },
              ],
              color: darkenColor(color),
              lineWidth: 1,
              lineJoin: 'round',
            });
          }

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
      );
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
      const slice = this.sliceLayout(i, angles, layout);
      const x = slice.centerX + midRadius * Math.cos(midRad);
      const y = slice.centerY + midRadius * Math.sin(midRad) * layout.yScale - fontSize / 2;
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
    type Entry = { text: string; midRad: number; anchorY: number; y: number; cx: number; cy: number };
    const right: Entry[] = [];
    const left: Entry[] = [];

    for (let i = 0; i < dataPoints.length; i++) {
      const dp = dataPoints[i];
      if (dp.value <= 0) continue;
      const { startAngle, endAngle } = angles[i];
      const midRad = (((startAngle + endAngle) / 2) * Math.PI) / 180;
      const slice = this.sliceLayout(i, angles, layout);
      const anchorY = slice.centerY + layout.radius * Math.sin(midRad) * layout.yScale;
      const text = `${dp.label} ${this.formatSlicePercent(dp.value, total)}`;
      const entry: Entry = { text, midRad, anchorY, y: anchorY, cx: slice.centerX, cy: slice.centerY };
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
        const sx = item.cx + (layout.radius + 2) * Math.cos(item.midRad);
        const sy = item.cy + (layout.radius + 2) * Math.sin(item.midRad) * layout.yScale;
        const mx = item.cx + (layout.radius + 10) * Math.cos(item.midRad);
        const my = item.cy + (layout.radius + 10) * Math.sin(item.midRad) * layout.yScale;
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
        startY: layout.centerY + inner * Math.sin(middle) * layout.yScale,
        endX: layout.centerX + layout.radius * Math.cos(middle),
        endY: layout.centerY + layout.radius * Math.sin(middle) * layout.yScale,
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
      path.push(new Point(layout.centerX + layout.radius * Math.cos(radians), layout.centerY + layout.radius * Math.sin(radians) * layout.yScale));
    }
    return path;
  }

  /** The highlight along the top edges of an exploded slice: each channel 40 % of the way to white, in integers. */
  private static edgeHighlight(color: Color): Color {
    const hex = color.toHexString();
    const channel = (offset: number): number => {
      const c = parseInt(hex.slice(offset, offset + 2), 16);
      return c + Math.floor(((255 - c) * 40 + 50) / 100);
    };
    return new Color(channel(1), channel(3), channel(5));
  }

  /**
   * The colour of a wall whose outward normal points at `normalDeg` (screen angles, 90° towards the viewer). Light comes
   * from the front left: a wall facing it is shaded 12 %, a wall facing away 38 %, plus `extra`. Integer channel maths,
   * so every implementation gives the same colour.
   */
  private static wallShade(color: Color, normalDeg: number, extra = 0): Color {
    const lambert = Math.max(0, Math.cos(((normalDeg - 125) * Math.PI) / 180));
    const pct = Math.round(38 - 26 * lambert) + extra;
    const hex = color.toHexString();
    const channel = (offset: number): number => {
      const c = parseInt(hex.slice(offset, offset + 2), 16);
      return c - Math.floor((c * pct + 50) / 100);
    };
    return new Color(channel(1), channel(3), channel(5));
  }

  /**
   * Fills the wall that hangs from the rim arc at `radius` between two angles. The outside of the rim (`inside` false) faces
   * away from the centre, the inside of the hole towards it; the light changes along the curve, so the wall is a horizontal
   * gradient sampled every 15° or less. Across the front or back half of the rim, x follows the angle one to one.
   */
  private drawRimWall(canvas: ICanvas, layout: PieLayout, radius: number, from: number, to: number, color: Color, inside: boolean): void {
    const segments = Math.max(Math.ceil((to - from) / 5), 1);
    const rim: Point[] = [];
    for (let i = 0; i <= segments; i++) {
      const radians = ((from + ((to - from) * i) / segments) * Math.PI) / 180;
      rim.push(new Point(layout.centerX + radius * Math.cos(radians), layout.centerY + radius * Math.sin(radians) * layout.yScale));
    }
    const outline = [...rim, ...[...rim].reverse().map((p) => new Point(p.x, p.y + layout.depth))];
    const commands: ChartPathCommand[] = [...outline.map((p, n) => ({ op: n === 0 ? ('M' as const) : ('L' as const), values: [p.x, p.y] })), { op: 'Z' as const, values: [] }];
    const shade = (angle: number): Color => PieChart.wallShade(color, inside ? angle + 180 : angle, inside ? 12 : 0);
    const xAt = (angle: number): number => layout.centerX + radius * Math.cos((angle * Math.PI) / 180);
    const x0 = xAt(from);
    const x1 = xAt(to);
    if (Math.abs(x1 - x0) < 0.5) {
      fillChartPath(canvas, { commands, color: shade((from + to) / 2) });
      return;
    }
    const count = Math.max(Math.ceil((to - from) / 15), 1);
    const stops: ChartGradientStop[] = [];
    for (let k = 0; k <= count; k++) {
      const angle = from + ((to - from) * k) / count;
      stops.push({ offset: (xAt(angle) - x0) / (x1 - x0), color: shade(angle) });
    }
    fillChartPath(canvas, {
      commands,
      color: shade((from + to) / 2),
      gradient: { startX: x0, startY: layout.centerY, endX: x1, endY: layout.centerY, startColor: stops[0].color, endColor: stops[stops.length - 1].color, stops },
    });
  }

  /** The parts of each slice that fall between `from` and `to` degrees. */
  private static spans(angles: { startAngle: number; endAngle: number }[], colors: Color[], from: number, to: number, only?: number): { from: number; to: number; color: Color }[] {
    const out: { from: number; to: number; color: Color }[] = [];
    angles.forEach(({ startAngle, endAngle }, i) => {
      if (only !== undefined && i !== only) return;
      const a = Math.max(startAngle, from);
      const b = Math.min(endAngle, to);
      if (endAngle > startAngle && b > a) out.push({ from: a, to: b, color: colors[i] });
    });
    return out;
  }

  /** How far a span of the far half of the hole is from the back (270°): the back is painted first. */
  private static backDistance(w: { from: number; to: number }): number {
    const mid = (w.from + w.to) / 2;
    return Math.abs((mid < 0 ? mid + 360 : mid) - 270);
  }

  /**
   * Draws the side walls of a tilted pie. A donut first gets the inside of its hole: the far half of the hole's rim
   * (screen angles 180° to 360°), dropped by the depth and shaded twice, which the top faces then frame. Every pie then
   * gets the outside of the near half of its rim (0° to 180°), shaded once.
   */
  private drawPieWalls(canvas: ICanvas, angles: { startAngle: number; endAngle: number }[], colors: Color[], layout: PieLayout): void {
    if (this._pie3d === undefined || layout.depth <= 0) return;
    if (this.isDonut && layout.donutHoleRadius > 0) {
      // Slice angles run from -90° to 270°, so the far half of the hole is -90° to 0° and 180° to 270°.
      const inner = [...PieChart.spans(angles, colors, -90, 0), ...PieChart.spans(angles, colors, 180, 270)];
      inner.sort((x, y) => PieChart.backDistance(x) - PieChart.backDistance(y));
      for (const w of inner) this.drawRimWall(canvas, layout, layout.donutHoleRadius, w.from, w.to, w.color, true);
    }
    // Outermost angles first, so the wall at the bottom of the pie is painted last.
    const outer = PieChart.spans(angles, colors, 0, 180);
    outer.sort((x, y) => Math.abs((y.from + y.to) / 2 - 90) - Math.abs((x.from + x.to) / 2 - 90));
    for (const w of outer) this.drawRimWall(canvas, layout, layout.radius, w.from, w.to, w.color, false);
  }

  /**
   * Draws the walls of one slice of an exploded tilted pie, before its top: the inside of the hole, the two cut faces
   * along its edges (which the gap now shows), then the outside of its rim.
   */
  private drawSliceSolid(canvas: ICanvas, i: number, angles: { startAngle: number; endAngle: number }[], colors: Color[], pieLayout: PieLayout): void {
    if (pieLayout.depth <= 0) return;
    const layout = this.sliceLayout(i, angles, pieLayout);
    const color = colors[i];
    const inner = this.isDonut ? layout.donutHoleRadius : 0;
    if (inner > 0) {
      const spans = [...PieChart.spans(angles, colors, -90, 0, i), ...PieChart.spans(angles, colors, 180, 270, i)];
      spans.sort((x, y) => PieChart.backDistance(x) - PieChart.backDistance(y));
      for (const w of spans) this.drawRimWall(canvas, layout, inner, w.from, w.to, color, true);
    }
    const { startAngle, endAngle } = angles[i];
    if (endAngle - startAngle < 360) {
      // A cut face's outward normal points away from the slice: back from its start edge, on from its end edge.
      for (const [angle, normal] of [[startAngle, startAngle - 90], [endAngle, endAngle + 90]]) {
        const t = (angle * Math.PI) / 180;
        const cos = Math.cos(t);
        const sin = Math.sin(t) * layout.yScale;
        const x1 = layout.centerX + inner * cos;
        const y1 = layout.centerY + inner * sin;
        const x2 = layout.centerX + layout.radius * cos;
        const y2 = layout.centerY + layout.radius * sin;
        const commands: ChartPathCommand[] = [
          { op: 'M', values: [x1, y1] },
          { op: 'L', values: [x2, y2] },
          { op: 'L', values: [x2, y2 + layout.depth] },
          { op: 'L', values: [x1, y1 + layout.depth] },
          { op: 'Z', values: [] },
        ];
        fillChartPath(canvas, { commands, color: PieChart.wallShade(color, normal) });
      }
    }
    for (const w of PieChart.spans(angles, colors, 0, 180, i)) this.drawRimWall(canvas, layout, layout.radius, w.from, w.to, color, false);
  }

  private createAnnularSectorPath(startAngle: number, endAngle: number, layout: PieLayout): Point[] {
    const path: Point[] = [];
    const segments = Math.max(Math.ceil((endAngle - startAngle) / 5), 1);
    for (let i = 0; i <= segments; i++) {
      const radians = ((startAngle + ((endAngle - startAngle) * i) / segments) * Math.PI) / 180;
      path.push(new Point(layout.centerX + layout.radius * Math.cos(radians), layout.centerY + layout.radius * Math.sin(radians) * layout.yScale));
    }
    for (let i = segments; i >= 0; i--) {
      const radians = ((startAngle + ((endAngle - startAngle) * i) / segments) * Math.PI) / 180;
      path.push(new Point(layout.centerX + layout.donutHoleRadius * Math.cos(radians), layout.centerY + layout.donutHoleRadius * Math.sin(radians) * layout.yScale));
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
    public plotBottom: number,
    public yScale: number = 1,
    public depth: number = 0
  ) {}
}
