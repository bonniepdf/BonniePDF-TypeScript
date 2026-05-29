import { ChartData } from './Models/ChartData';
import { ChartDataPoint } from './Models/ChartDataPoint';
import { ChartBase } from './ChartBase';
import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { ICanvas } from '../Drawing/ICanvas';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { StandardFonts } from '../Typography/StandardFonts';

/**
 * Pie chart that renders pie slices with a legend on the right side.
 * Supports donut style with a center hole showing the total value.
 * Uses the ICanvas interface for rendering, making it backend-agnostic.
 * All layout is computed dynamically from Width and Height, so the chart
 * adapts correctly to any size or StretchToFit mode.
 */
export class PieChart extends ChartBase {
  // Layout proportions (relative to chart dimensions)
  private static readonly TITLE_AREA_HEIGHT = 60;
  private static readonly TOP_PADDING = 20;
  private static readonly BOTTOM_PADDING = 20;
  private static readonly LEFT_PADDING = 20;
  private static readonly LEGEND_GAP_FROM_PIE = 30;
  private static readonly RIGHT_PADDING = 20;

  // Legend item layout
  private static readonly LEGEND_ITEM_HEIGHT = 24;
  private static readonly LEGEND_BOX_SIZE = 14;
  private static readonly LEGEND_BOX_TEXT_GAP = 8;
  private static readonly LEGEND_FONT_SIZE = 11;

  // Donut hole proportions
  private static readonly DONUT_HOLE_RATIO = 0.33;

  private static readonly FONT_FAMILY = StandardFonts.Helvetica;

  // Styling constants
  private static readonly LEGEND_TEXT_COLOR = Color.fromHex('#333333');
  private static readonly TOTAL_LABEL_COLOR = Color.fromHex('#666666');
  private static readonly TOTAL_VALUE_COLOR = Color.fromHex('#333333');

  // Default colors matching the SVG
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

  /**
   * Custom colors to use for the pie slices.
   * If null, uses the default color palette.
   */
  colors: string[] | undefined;

  /**
   * Whether to render as a donut chart with a center hole.
   * Default is true.
   */
  isDonut: boolean = true;

  /**
   * Label to display above the total value in the donut hole.
   * Default is "Total".
   */
  totalLabel: string = 'Total';

  /**
   * Font size for the total label in the donut hole.
   */
  totalLabelFontSize: number = 11;

  /**
   * Font size for the total value in the donut hole.
   */
  totalValueFontSize: number = 16;

  /**
   * Format string for the total value displayed in the donut hole.
   * When null (default), uses the LabelFormat from the first data point.
   * Set to a custom format string (e.g. "C0", "N0", "'$'#,##0") to override.
   */
  totalValueFormat: string | undefined;

  /**
   * Whether to show the legend.
   * Default is true.
   */
  showLegend: boolean = true;

  /**
   * Draws the pie chart content.
   * All positions are computed dynamically from Width and Height.
   */
  protected override drawContent(canvas: ICanvas, data: ChartData): void {
    if (data.series.length === 0 || data.series[0].dataPoints.length === 0) return;

    const dataPoints = data.series[0].dataPoints;

    // Calculate total value
    const total = dataPoints.reduce((sum, dp) => sum + dp.value, 0);

    // Calculate dynamic layout
    const layout = this.calculateLayout(dataPoints.length);

    // Calculate start angle for each slice
    const angles = this.calculateSliceAngles(dataPoints, total);

    // Get colors to use
    const colors = this.getColors(dataPoints.length);

    // Draw pie slices
    this.drawPieSlices(canvas, dataPoints, angles, colors, layout);

    // Draw donut hole if enabled
    if (this.isDonut) {
      this.drawDonutHole(canvas, total, dataPoints, layout);
    }

    // Draw legend
    if (this.showLegend) {
      this.drawLegend(canvas, dataPoints, colors, layout);
    }
  }

  /**
   * Computes all layout metrics from the current Width and Height.
   */
  private calculateLayout(dataPointCount: number): PieLayout {
    // Available vertical space for the pie (between title and bottom padding)
    const availableHeight = this.height - PieChart.TITLE_AREA_HEIGHT - PieChart.TOP_PADDING - PieChart.BOTTOM_PADDING;

    // Estimate legend width when legend is shown
    let legendWidth = 0;
    if (this.showLegend) {
      // Reserve a reasonable width for legend items
      // LegendBoxSize + gap + ~150pt for text
      legendWidth = PieChart.LEGEND_BOX_SIZE + PieChart.LEGEND_BOX_TEXT_GAP + 150;
    }

    // Available horizontal space for the pie
    let availableWidthForPie = this.width - PieChart.LEFT_PADDING - PieChart.RIGHT_PADDING;
    if (this.showLegend) {
      availableWidthForPie -= legendWidth + PieChart.LEGEND_GAP_FROM_PIE;
    }

    // Pie radius is constrained by both available width and height
    const maxRadiusFromWidth = availableWidthForPie / 2;
    const maxRadiusFromHeight = availableHeight / 2;
    let pieRadius = Math.min(maxRadiusFromWidth, maxRadiusFromHeight);
    pieRadius = Math.max(pieRadius, 20); // minimum viable radius

    // Center the pie vertically in the available area
    const pieCenterY = PieChart.TITLE_AREA_HEIGHT + PieChart.TOP_PADDING + availableHeight / 2;

    // Center the pie horizontally in its allocated space
    const pieAreaWidth =
      this.width -
      (this.showLegend ? legendWidth + PieChart.LEGEND_GAP_FROM_PIE + PieChart.RIGHT_PADDING : PieChart.RIGHT_PADDING) -
      PieChart.LEFT_PADDING;
    const pieCenterX = PieChart.LEFT_PADDING + pieAreaWidth / 2;

    // Legend position: to the right of the pie
    const legendX = pieCenterX + pieRadius + PieChart.LEGEND_GAP_FROM_PIE;

    // Vertically center the legend items relative to the pie center
    const totalLegendHeight = dataPointCount * PieChart.LEGEND_ITEM_HEIGHT;
    const legendStartY = pieCenterY - totalLegendHeight / 2;

    // Donut hole radius
    const donutHoleRadius = pieRadius * PieChart.DONUT_HOLE_RATIO;

    return new PieLayout(pieCenterX, pieCenterY, pieRadius, donutHoleRadius, legendX, legendStartY);
  }

  /**
   * Calculates the start and end angles for each pie slice.
   */
  private calculateSliceAngles(
    dataPoints: ChartDataPoint[],
    total: number
  ): { startAngle: number; endAngle: number }[] {
    const angles: { startAngle: number; endAngle: number }[] = [];
    let currentAngle = -90; // Start from top (12 o'clock position)

    for (const dataPoint of dataPoints) {
      const sliceAngle = 360 * (dataPoint.value / total);
      const endAngle = currentAngle + sliceAngle;
      angles.push({ startAngle: currentAngle, endAngle });
      currentAngle = endAngle;
    }

    return angles;
  }

  /**
   * Gets the colors to use for the pie slices.
   */
  private getColors(count: number): Color[] {
    const colors: Color[] = [];
    const sourceColors = this.colors ?? PieChart.DEFAULT_COLORS;

    for (let i = 0; i < count; i++) {
      const colorHex = sourceColors[i % sourceColors.length];
      colors.push(Color.fromHex(colorHex));
    }

    return colors;
  }

  /**
   * Draws the pie slices.
   */
  private drawPieSlices(
    canvas: ICanvas,
    dataPoints: ChartDataPoint[],
    angles: { startAngle: number; endAngle: number }[],
    colors: Color[],
    layout: PieLayout
  ): void {
    for (let i = 0; i < dataPoints.length; i++) {
      const { startAngle, endAngle } = angles[i];
      const color = colors[i];

      // Calculate the path for the pie slice
      const path = this.createPieSlicePath(startAngle, endAngle, layout);

      // Fill the slice
      canvas.fillPath(path, color);
    }
  }

  /**
   * Creates a path for a pie slice.
   */
  private createPieSlicePath(startAngle: number, endAngle: number, layout: PieLayout): Point[] {
    const path: Point[] = [];

    // Start at the center
    path.push(new Point(layout.centerX, layout.centerY));

    // Add arc points
    const segments = Math.max(Math.ceil((endAngle - startAngle) / 5), 1);
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + ((endAngle - startAngle) * i) / segments;
      const radians = (angle * Math.PI) / 180;
      const x = layout.centerX + layout.radius * Math.cos(radians);
      const y = layout.centerY + layout.radius * Math.sin(radians);
      path.push(new Point(x, y));
    }

    return path;
  }

  /**
   * Draws the donut hole with the total value.
   */
  private drawDonutHole(canvas: ICanvas, total: number, dataPoints: ChartDataPoint[], layout: PieLayout): void {
    // Draw white circle for donut hole
    canvas.fillCircle(layout.centerX, layout.centerY, layout.donutHoleRadius, Color.white);

    // Draw "Total" label
    const totalLabelY = layout.centerY - 5;
    canvas.drawText(
      layout.centerX,
      totalLabelY,
      this.totalLabel,
      PieChart.TOTAL_LABEL_COLOR,
      this.totalLabelFontSize,
      PieChart.FONT_FAMILY,
      TextAlignment.Center
    );

    // Format total value using the configured format or the first data point's format
    const format = this.totalValueFormat ?? (dataPoints.length > 0 ? dataPoints[0].labelFormat : 'G');
    const totalValueText = total.toString();

    const totalValueY = layout.centerY + 12;
    canvas.drawText(
      layout.centerX,
      totalValueY,
      totalValueText,
      PieChart.TOTAL_VALUE_COLOR,
      this.totalValueFontSize,
      PieChart.FONT_FAMILY,
      TextAlignment.Center
    );
  }

  /**
   * Draws the legend on the right side.
   */
  private drawLegend(canvas: ICanvas, dataPoints: ChartDataPoint[], colors: Color[], layout: PieLayout): void {
    for (let i = 0; i < dataPoints.length; i++) {
      const dataPoint = dataPoints[i];
      const color = colors[i];
      const y = layout.legendStartY + i * PieChart.LEGEND_ITEM_HEIGHT;

      // Draw color box
      canvas.fillRect(layout.legendX, y, PieChart.LEGEND_BOX_SIZE, PieChart.LEGEND_BOX_SIZE, color);

      // Draw label text (vertically centered with the color box)
      const labelText = `${dataPoint.label} - ${dataPoint.formattedValue}`;
      const textX = layout.legendX + PieChart.LEGEND_BOX_SIZE + PieChart.LEGEND_BOX_TEXT_GAP;
      canvas.drawText(
        textX,
        y,
        labelText,
        PieChart.LEGEND_TEXT_COLOR,
        PieChart.LEGEND_FONT_SIZE,
        PieChart.FONT_FAMILY,
        TextAlignment.Left
      );
    }
  }

  /**
   * Holds all computed layout positions for a pie chart render pass.
   */
  private static readonly PieLayout = class {
    constructor(
      public centerX: number,
      public centerY: number,
      public radius: number,
      public donutHoleRadius: number,
      public legendX: number,
      public legendStartY: number
    ) {}

    equals(other: PieLayout): boolean {
      return (
        Math.abs(this.centerX - other.centerX) < 0.0001 &&
        Math.abs(this.centerY - other.centerY) < 0.0001 &&
        Math.abs(this.radius - other.radius) < 0.0001 &&
        Math.abs(this.donutHoleRadius - other.donutHoleRadius) < 0.0001 &&
        Math.abs(this.legendX - other.legendX) < 0.0001 &&
        Math.abs(this.legendStartY - other.legendStartY) < 0.0001
      );
    }

    hashCode(): number {
      let hash = 0;
      hash = (hash * 31 + Math.floor(this.centerX * 10000)) | 0;
      hash = (hash * 31 + Math.floor(this.centerY * 10000)) | 0;
      hash = (hash * 31 + Math.floor(this.radius * 10000)) | 0;
      hash = (hash * 31 + Math.floor(this.donutHoleRadius * 10000)) | 0;
      hash = (hash * 31 + Math.floor(this.legendX * 10000)) | 0;
      hash = (hash * 31 + Math.floor(this.legendStartY * 10000)) | 0;
      return hash;
    }
  };
}

/**
 * Holds all computed layout positions for a pie chart render pass.
 */
class PieLayout {
  constructor(
    public centerX: number,
    public centerY: number,
    public radius: number,
    public donutHoleRadius: number,
    public legendX: number,
    public legendStartY: number
  ) {}
}
