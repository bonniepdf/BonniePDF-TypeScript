// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color, toColor, type ColorInput, StandardFonts, TextAlignment } from './ChartHost';
import type { ChartMarkerShape } from './Graphics/ChartMarkers';
import type { ChartPatternKind, ChartResolvedEffect } from './Graphics/ChartPathPlan';
import { ChartFill, type ChartFillInput } from './Graphics/ChartFill';
import { toEffects, type ChartEffectInput } from './Graphics/ChartEffects';

/** Built-in chart appearance preset name. */
export type ChartThemeName = 'legacy' | 'modern' | 'dark' | 'print' | 'executive' | 'vivid' | 'pastel' | 'midnight';
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
  /** Whether a reference label with no explicit colour must meet 4.5:1 contrast against the chart background. */
  adaptiveReferenceLabels?: boolean;
  /** Chart background (a colour or gradient). A chart's own `backgroundFill` or `backgroundColor` wins. */
  backgroundFill?: ChartFillInput;
  /** Fill of the plot rectangle of Cartesian charts. */
  plotAreaFill?: ChartFillInput;
  /** Colour of a border around the plot rectangle. */
  plotAreaBorderColor?: ColorInput;
  /** Corner radius of the chart card. A chart's own `borderRadius` greater than zero wins. */
  cardRadius?: number;
  /** Border colour of the chart card. A chart's own `borderColor` wins. */
  cardBorderColor?: ColorInput;
  /** Border width of the chart card. A chart's own `borderWidth` greater than zero wins. */
  cardBorderWidth?: number;
  /** Distance between the chart edge and its card, leaving room for the card's shadow. */
  cardInset?: number;
  /** Effects on the chart card. */
  cardEffects?: readonly ChartEffectInput[];
  /** Default effects on bars. */
  barEffects?: readonly ChartEffectInput[];
  /** Default effects on line strokes. */
  lineEffects?: readonly ChartEffectInput[];
  /** Default effects on pie slices. */
  sliceEffects?: readonly ChartEffectInput[];
  /** How a series colour becomes a fill: `solid` (default) or `tint` (a gradient from a lighter tint at the value end). */
  autoFill?: 'solid' | 'tint';
  /** `darker` outlines bars and slices in a darker shade of their colour. */
  markOutline?: 'none' | 'darker';
  /** Ordered colours for lines and markers of series without a colour, when fills use a paler palette. */
  strokePalette?: readonly ColorInput[];
  /** Colour of increases (waterfall deltas, growth annotations). */
  positiveColor?: ColorInput;
  /** Colour of decreases. */
  negativeColor?: ColorInput;
  /** Colour of totals. */
  totalColor?: ColorInput;
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
  readonly adaptiveReferenceLabels: boolean;
  readonly backgroundFill: ChartFill | undefined;
  readonly plotAreaFill: ChartFill | undefined;
  readonly plotAreaBorderColor: Color | undefined;
  readonly cardRadius: number | undefined;
  readonly cardBorderColor: Color | undefined;
  readonly cardBorderWidth: number | undefined;
  readonly cardInset: number | undefined;
  readonly cardEffects: readonly ChartResolvedEffect[];
  readonly barEffects: readonly ChartResolvedEffect[];
  readonly lineEffects: readonly ChartResolvedEffect[];
  readonly sliceEffects: readonly ChartResolvedEffect[];
  readonly autoFill: 'solid' | 'tint';
  readonly markOutline: 'none' | 'darker';
  readonly strokePalette: readonly Color[];
  readonly positiveColor: Color | undefined;
  readonly negativeColor: Color | undefined;
  readonly totalColor: Color | undefined;
}

/** Presentation fields that the shipped presets leave unset. */
const NO_PRESENTATION = {
  backgroundFill: undefined,
  plotAreaFill: undefined,
  plotAreaBorderColor: undefined,
  cardRadius: undefined,
  cardBorderColor: undefined,
  cardBorderWidth: undefined,
  cardInset: undefined,
  cardEffects: [],
  barEffects: [],
  lineEffects: [],
  sliceEffects: [],
  autoFill: 'solid',
  markOutline: 'none',
  strokePalette: [],
  positiveColor: undefined,
  negativeColor: undefined,
  totalColor: undefined,
} as const;

const hex = (values: readonly string[]): Color[] => values.map((v) => Color.fromHex(v));
const shadow = (opacity: number, blur: number, offsetY: number) => toEffects([{ type: 'shadow', opacity, blur, offsetY }]);

/** The library's default series colour; a theme palette replaces only this colour. */
const LIBRARY_SERIES_COLOR = '#4f46e5';

/** @internal */
const BASE_THEMES: Readonly<Record<'legacy' | 'modern' | 'dark' | 'print', ChartTheme>> = {
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
    adaptiveReferenceLabels: false,
    ...NO_PRESENTATION,
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
    adaptiveReferenceLabels: true,
    ...NO_PRESENTATION,
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
    adaptiveReferenceLabels: true,
    ...NO_PRESENTATION,
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
    adaptiveReferenceLabels: true,
    ...NO_PRESENTATION,
  },
};

const derive = (base: ChartTheme, over: Partial<ChartTheme>): ChartTheme => ({ ...base, ...over });

/**
 * The shipped presets plus the four presentation presets. Colours are `ColorPalette` tokens resolved once and frozen here
 * (and in the .NET theme table), so a later palette change cannot alter existing charts.
 * @internal
 */
export const CHART_THEMES: Readonly<Record<ChartThemeName, ChartTheme>> = {
  ...BASE_THEMES,
  /** Board decks and annual reports: restrained blue, teal and amber on white, a quiet card with a soft shadow. */
  executive: derive(BASE_THEMES.modern, {
    seriesPalette: hex(['#1c398e', '#00786f', '#bb4d00', '#45556c', '#432dd7', '#7e2a0c']),
    titleColor: Color.fromHex('#0f172b'),
    subtitleColor: Color.fromHex('#45556c'),
    axisColor: Color.fromHex('#45556c'),
    gridLineColor: Color.fromHex('#e2e8f0'),
    legendTextColor: Color.fromHex('#1d293d'),
    barCornerRadius: 2,
    cardRadius: 10,
    cardBorderColor: Color.fromHex('#e2e8f0'),
    cardBorderWidth: 1,
    cardInset: 12,
    cardEffects: shadow(0.1, 12, 4),
    positiveColor: Color.fromHex('#00786f'),
    negativeColor: Color.fromHex('#c10007'),
    totalColor: Color.fromHex('#1c398e'),
  }),
  /** Marketing and keynote slides: saturated colours, tinted fills, raised bars and slices. */
  vivid: derive(BASE_THEMES.modern, {
    seriesPalette: hex(['#155dfc', '#e60076', '#e17100', '#009966', '#7f22fe', '#e7000b']),
    titleColor: Color.fromHex('#0f172b'),
    titleFontSize: 22,
    subtitleColor: Color.fromHex('#45556c'),
    axisColor: Color.fromHex('#45556c'),
    gridLineStyle: 'none',
    legendTextColor: Color.fromHex('#1d293d'),
    barCornerRadius: 6,
    cardRadius: 12,
    cardInset: 14,
    cardEffects: shadow(0.16, 16, 6),
    autoFill: 'tint',
    barEffects: shadow(0.18, 6, 2),
    sliceEffects: shadow(0.18, 6, 2),
    positiveColor: Color.fromHex('#009966'),
    negativeColor: Color.fromHex('#e7000b'),
    totalColor: Color.fromHex('#155dfc'),
  }),
  /** Friendly internal reports: pale fills outlined in a darker shade, lines in the darker shade, a white plot on a pale card. */
  pastel: derive(BASE_THEMES.modern, {
    backgroundColor: Color.fromHex('#f8fafc'),
    plotAreaFill: ChartFill.solid('#ffffff'),
    plotAreaBorderColor: Color.fromHex('#e2e8f0'),
    seriesPalette: hex(['#8ec5ff', '#fda5d5', '#ffd230', '#5ee9b5', '#c4b4ff', '#ffa2a2']),
    strokePalette: hex(['#1447e6', '#c6005c', '#bb4d00', '#007a55', '#7008e7', '#c10007']),
    markOutline: 'darker',
    titleColor: Color.fromHex('#1d293d'),
    subtitleColor: Color.fromHex('#45556c'),
    axisColor: Color.fromHex('#45556c'),
    gridLineStyle: 'dashed',
    gridLineColor: Color.fromHex('#e2e8f0'),
    legendTextColor: Color.fromHex('#1d293d'),
    barCornerRadius: 8,
    cardRadius: 14,
    cardBorderColor: Color.fromHex('#e2e8f0'),
    cardBorderWidth: 1,
    positiveColor: Color.fromHex('#007a55'),
    negativeColor: Color.fromHex('#c10007'),
    totalColor: Color.fromHex('#1447e6'),
  }),
  /** Dark keynote and dashboard slides: a gradient slate surface, bright series colours, glowing lines. */
  midnight: derive(BASE_THEMES.modern, {
    backgroundFill: ChartFill.from({ type: 'linear', angle: 90, stops: [{ offset: 0, color: '#0f172b' }, { offset: 1, color: '#1d293d' }] }),
    seriesPalette: hex(['#00bcff', '#fb64b6', '#fdc700', '#00d492', '#a684ff', '#ff8904']),
    titleColor: Color.fromHex('#f8fafc'),
    titleFontSize: 22,
    subtitleColor: Color.fromHex('#90a1b9'),
    axisColor: Color.fromHex('#cad5e2'),
    gridLineColor: Color.fromHex('#314158'),
    legendTextColor: Color.fromHex('#e2e8f0'),
    barCornerRadius: 6,
    cardRadius: 12,
    cardInset: 14,
    cardEffects: shadow(0.4, 18, 6),
    autoFill: 'tint',
    lineEffects: toEffects([{ type: 'glow', opacity: 0.45, radius: 5 }]),
    positiveColor: Color.fromHex('#00d492'),
    negativeColor: Color.fromHex('#ff6467'),
    totalColor: Color.fromHex('#00bcff'),
  }),
};

export function isChartThemeName(value: unknown): value is ChartThemeName {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(CHART_THEMES, value);
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
    adaptiveReferenceLabels: input.adaptiveReferenceLabels ?? base.adaptiveReferenceLabels,
    backgroundFill: input.backgroundFill !== undefined ? ChartFill.from(input.backgroundFill) : base.backgroundFill,
    plotAreaFill: input.plotAreaFill !== undefined ? ChartFill.from(input.plotAreaFill) : base.plotAreaFill,
    plotAreaBorderColor: input.plotAreaBorderColor !== undefined ? toColor(input.plotAreaBorderColor) : base.plotAreaBorderColor,
    cardRadius: input.cardRadius ?? base.cardRadius,
    cardBorderColor: input.cardBorderColor !== undefined ? toColor(input.cardBorderColor) : base.cardBorderColor,
    cardBorderWidth: input.cardBorderWidth ?? base.cardBorderWidth,
    cardInset: input.cardInset ?? base.cardInset,
    cardEffects: input.cardEffects !== undefined ? toEffects(input.cardEffects) : base.cardEffects,
    barEffects: input.barEffects !== undefined ? toEffects(input.barEffects) : base.barEffects,
    lineEffects: input.lineEffects !== undefined ? toEffects(input.lineEffects) : base.lineEffects,
    sliceEffects: input.sliceEffects !== undefined ? toEffects(input.sliceEffects) : base.sliceEffects,
    autoFill: input.autoFill ?? base.autoFill,
    markOutline: input.markOutline ?? base.markOutline,
    strokePalette: input.strokePalette ? input.strokePalette.map(toColor) : base.strokePalette,
    positiveColor: input.positiveColor !== undefined ? toColor(input.positiveColor) : base.positiveColor,
    negativeColor: input.negativeColor !== undefined ? toColor(input.negativeColor) : base.negativeColor,
    totalColor: input.totalColor !== undefined ? toColor(input.totalColor) : base.totalColor,
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
