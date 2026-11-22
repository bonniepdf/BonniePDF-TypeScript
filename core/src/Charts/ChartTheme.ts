// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color, toColor, type ColorInput, StandardFonts, TextAlignment } from './ChartHost';
import type { ChartMarkerShape } from './Graphics/ChartMarkers';
import type { ChartPatternKind } from './Graphics/ChartPathPlan';

/** Built-in chart appearance preset name. */
export type ChartThemeName = 'legacy' | 'modern' | 'dark' | 'print';
/** Gridline stroke style used by a chart theme. */
export type ChartGridLineStyle = 'solid' | 'dashed' | 'none';

/** Composable custom theme object extending a built-in preset. */
export interface ChartThemeDefinition {
  /** Built-in preset to inherit unspecified theme fields from. */
  extends?: ChartThemeName;
  /** Optional chart background colour override. */
  backgroundColor?: ColorInput;
  /** Optional explicit title X position. */
  titleX?: number;
  /** Title baseline Y offset from the top of the chart. */
  titleY?: number;
  /** Chart title text colour. */
  titleColor?: ColorInput;
  /** Chart title font size in points. */
  titleFontSize?: number;
  /** Chart title font family name. */
  titleFontFamily?: string;
  /** Chart title horizontal alignment. */
  titleAlignment?: TextAlignment;
  /** Chart subtitle text colour. */
  subtitleColor?: ColorInput;
  /** Axis line and tick label colour. */
  axisColor?: ColorInput;
  /** Gridline stroke colour. */
  gridLineColor?: ColorInput;
  /** Gridline stroke style (`solid`, `dashed`, or `none`). */
  gridLineStyle?: ChartGridLineStyle;
  /** Legend item label text colour. */
  legendTextColor?: ColorInput;
  /** Whether to draw axis frame lines around the plot area. */
  axisFrame?: boolean;
  /** Stroke width of axis lines in points. */
  axisLineWidth?: number;
  /** Ordered colour palette assigned to series without an explicit colour. */
  seriesPalette?: readonly ColorInput[];
  /** Ordered fill patterns assigned to series (used by monochrome print themes). */
  seriesPatterns?: readonly ChartPatternKind[];
  /** Ordered marker shapes assigned to series. */
  seriesMarkerShapes?: readonly ChartMarkerShape[];
  /** Ordered dash patterns assigned to line series. */
  seriesDashPatterns?: readonly (readonly number[] | undefined)[];
  /** Default chart font family. */
  fontFamily?: string;
  /** Whether to measure tick labels accurately for layout and spacing. */
  measuredLabels?: boolean;
  /** Whether to lay out legend items in a wrapping flow row. */
  flowLegend?: boolean;
  /** Default rounded corner radius on bars in points. */
  barCornerRadius?: number;
  /** Whether to enable styled vector geometry (rounded bars, callout leaders, markers). */
  styledGeometry?: boolean;
  /** Whether to use PDF-aligned text baseline offsets. */
  pdfTextBaseline?: boolean;
  /** Whether to emit tabular-nums styling for numeric tick and value labels. */
  tabularNums?: boolean;
  /** Whether to draw rounded square swatches in legends. */
  roundedLegendSwatches?: boolean;
}

/** Theme preset name or custom {@link ChartThemeDefinition} override object. */
export type ChartThemeInput = ChartThemeName | ChartThemeDefinition;

/**
 * Everything a chart theme decides. Charts read these values rather than testing the theme name,
 * so each theme is described once, here.
 * @internal
 */
export interface ChartTheme {
  readonly backgroundColor: Color | undefined;
  readonly titleX: number | undefined;
  readonly titleY: number;
  readonly titleColor: Color;
  readonly titleFontSize: number;
  readonly titleFontFamily: string;
  readonly titleAlignment: TextAlignment;
  readonly subtitleColor: Color;
  readonly axisColor: Color;
  readonly gridLineColor: Color;
  readonly gridLineStyle: ChartGridLineStyle;
  readonly legendTextColor: Color;
  readonly axisFrame: boolean;
  readonly axisLineWidth: number;
  readonly seriesPalette: readonly Color[];
  readonly seriesPatterns: readonly ChartPatternKind[];
  readonly seriesMarkerShapes: readonly ChartMarkerShape[];
  readonly seriesDashPatterns: readonly (readonly number[] | undefined)[];
  readonly fontFamily: string;
  readonly measuredLabels: boolean;
  readonly flowLegend: boolean;
  readonly barCornerRadius: number;
  readonly styledGeometry: boolean;
  readonly pdfTextBaseline: boolean;
  readonly tabularNums: boolean;
  readonly roundedLegendSwatches: boolean;
}

/** The library's default series colour; a theme palette replaces only this colour. */
const LIBRARY_SERIES_COLOR = '#4f46e5';

/** @internal */
export const CHART_THEMES: Readonly<Record<ChartThemeName, ChartTheme>> = {
  legacy: {
    backgroundColor: undefined,
    titleX: undefined,
    titleY: 35,
    titleColor: Color.fromHex('#333333'),
    titleFontSize: 20,
    titleFontFamily: StandardFonts.Helvetica,
    titleAlignment: TextAlignment.Center,
    subtitleColor: Color.fromHex('#666666'),
    axisColor: Color.fromHex('#666666'),
    gridLineColor: Color.fromHex('#e0e0e0'),
    gridLineStyle: 'solid',
    legendTextColor: Color.fromHex('#333333'),
    axisFrame: true,
    axisLineWidth: 1,
    seriesPalette: [],
    seriesPatterns: [],
    seriesMarkerShapes: [],
    seriesDashPatterns: [],
    fontFamily: StandardFonts.Helvetica,
    measuredLabels: false,
    flowLegend: false,
    barCornerRadius: 0,
    styledGeometry: false,
    pdfTextBaseline: false,
    tabularNums: false,
    roundedLegendSwatches: false,
  },
  modern: {
    backgroundColor: undefined,
    titleX: 32,
    titleY: 20,
    titleColor: Color.fromHex('#0f172a'),
    titleFontSize: 18,
    titleFontFamily: StandardFonts.HelveticaBold,
    titleAlignment: TextAlignment.Left,
    subtitleColor: Color.fromHex('#64748b'),
    axisColor: Color.fromHex('#64748b'),
    gridLineColor: Color.fromHex('#e2e8f0'),
    gridLineStyle: 'solid',
    legendTextColor: Color.fromHex('#334155'),
    axisFrame: false,
    axisLineWidth: 0.5,
    seriesPalette: ['#2563eb', '#0d9488', '#7c3aed', '#d97706', '#e11d48', '#0284c7'].map((hex) => Color.fromHex(hex)),
    seriesPatterns: [],
    seriesMarkerShapes: [],
    seriesDashPatterns: [],
    fontFamily: StandardFonts.Helvetica,
    measuredLabels: true,
    flowLegend: true,
    barCornerRadius: 4,
    styledGeometry: true,
    pdfTextBaseline: true,
    tabularNums: true,
    roundedLegendSwatches: true,
  },
  dark: {
    backgroundColor: Color.fromHex('#0f172a'),
    titleX: 32,
    titleY: 20,
    titleColor: Color.fromHex('#f8fafc'),
    titleFontSize: 18,
    titleFontFamily: StandardFonts.HelveticaBold,
    titleAlignment: TextAlignment.Left,
    subtitleColor: Color.fromHex('#94a3b8'),
    axisColor: Color.fromHex('#94a3b8'),
    gridLineColor: Color.fromHex('#1e293b'),
    gridLineStyle: 'solid',
    legendTextColor: Color.fromHex('#e2e8f0'),
    axisFrame: false,
    axisLineWidth: 0.5,
    seriesPalette: ['#60a5fa', '#2dd4bf', '#a78bfa', '#fbbf24', '#fb7185', '#38bdf8'].map((hex) => Color.fromHex(hex)),
    seriesPatterns: [],
    seriesMarkerShapes: [],
    seriesDashPatterns: [],
    fontFamily: StandardFonts.Helvetica,
    measuredLabels: true,
    flowLegend: true,
    barCornerRadius: 4,
    styledGeometry: true,
    pdfTextBaseline: true,
    tabularNums: true,
    roundedLegendSwatches: true,
  },
  print: {
    backgroundColor: Color.fromHex('#ffffff'),
    titleX: 32,
    titleY: 20,
    titleColor: Color.fromHex('#000000'),
    titleFontSize: 18,
    titleFontFamily: StandardFonts.HelveticaBold,
    titleAlignment: TextAlignment.Left,
    subtitleColor: Color.fromHex('#404040'),
    axisColor: Color.fromHex('#1f2937'),
    gridLineColor: Color.fromHex('#d1d5db'),
    gridLineStyle: 'dashed',
    legendTextColor: Color.fromHex('#111827'),
    axisFrame: false,
    axisLineWidth: 0.75,
    seriesPalette: ['#111827', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#1f2937'].map((hex) => Color.fromHex(hex)),
    seriesPatterns: ['none', 'diagonal', 'dots', 'reverseDiagonal', 'horizontal', 'crosshatch'],
    seriesMarkerShapes: ['circle', 'square', 'diamond', 'triangle'],
    seriesDashPatterns: [undefined, [6, 3], [2, 2], [8, 3, 2, 3]],
    fontFamily: StandardFonts.Helvetica,
    measuredLabels: true,
    flowLegend: true,
    barCornerRadius: 2,
    styledGeometry: true,
    pdfTextBaseline: true,
    tabularNums: true,
    roundedLegendSwatches: true,
  },
};

export function isChartThemeName(value: unknown): value is ChartThemeName {
  return value === 'legacy' || value === 'modern' || value === 'dark' || value === 'print';
}

/** Resolves a theme preset name or custom definition into a complete {@link ChartTheme}. @internal */
export function resolveChartTheme(input: ChartThemeInput): ChartTheme {
  if (typeof input === 'string') {
    if (!isChartThemeName(input)) throw new RangeError('Invalid chart theme.');
    return CHART_THEMES[input];
  }
  const baseName = input.extends ?? 'modern';
  if (!isChartThemeName(baseName)) throw new RangeError('Invalid chart theme base.');
  const base = CHART_THEMES[baseName];
  return {
    backgroundColor: input.backgroundColor !== undefined ? toColor(input.backgroundColor) : base.backgroundColor,
    titleX: input.titleX !== undefined ? input.titleX : base.titleX,
    titleY: input.titleY ?? base.titleY,
    titleColor: input.titleColor !== undefined ? toColor(input.titleColor) : base.titleColor,
    titleFontSize: input.titleFontSize ?? base.titleFontSize,
    titleFontFamily: input.titleFontFamily ?? base.titleFontFamily,
    titleAlignment: input.titleAlignment ?? base.titleAlignment,
    subtitleColor: input.subtitleColor !== undefined ? toColor(input.subtitleColor) : base.subtitleColor,
    axisColor: input.axisColor !== undefined ? toColor(input.axisColor) : base.axisColor,
    gridLineColor: input.gridLineColor !== undefined ? toColor(input.gridLineColor) : base.gridLineColor,
    gridLineStyle: input.gridLineStyle ?? base.gridLineStyle,
    legendTextColor: input.legendTextColor !== undefined ? toColor(input.legendTextColor) : base.legendTextColor,
    axisFrame: input.axisFrame ?? base.axisFrame,
    axisLineWidth: input.axisLineWidth ?? base.axisLineWidth,
    seriesPalette: input.seriesPalette ? input.seriesPalette.map(toColor) : base.seriesPalette,
    seriesPatterns: input.seriesPatterns ?? base.seriesPatterns,
    seriesMarkerShapes: input.seriesMarkerShapes ?? base.seriesMarkerShapes,
    seriesDashPatterns: input.seriesDashPatterns ?? base.seriesDashPatterns,
    fontFamily: input.fontFamily ?? base.fontFamily,
    measuredLabels: input.measuredLabels ?? base.measuredLabels,
    flowLegend: input.flowLegend ?? base.flowLegend,
    barCornerRadius: input.barCornerRadius ?? base.barCornerRadius,
    styledGeometry: input.styledGeometry ?? base.styledGeometry,
    pdfTextBaseline: input.pdfTextBaseline ?? base.pdfTextBaseline,
    tabularNums: input.tabularNums ?? base.tabularNums,
    roundedLegendSwatches: input.roundedLegendSwatches ?? base.roundedLegendSwatches,
  };
}

/**
 * The colour of the series at `index` when the chart supplies `color` because the author set none.
 * @internal
 */
export function themedSeriesColor(theme: ChartTheme, color: Color, index: number): Color {
  const palette = theme.seriesPalette;
  return palette.length > 0 && color.toHexString() === LIBRARY_SERIES_COLOR
    ? palette[Math.max(0, index) % palette.length]
    : color;
}
