// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color, StandardFonts, TextAlignment } from './ChartHost';

/**
 * Everything a chart theme decides. Charts read these values rather than testing the theme name,
 * so each theme is described once, here.
 * @internal
 */
export interface ChartTheme {
  /** Left edge of a left-aligned title; undefined centres the title on the chart. */
  readonly titleX: number | undefined;
  readonly titleY: number;
  readonly titleColor: Color;
  readonly titleFontSize: number;
  readonly titleFontFamily: string;
  readonly titleAlignment: TextAlignment;
  /** Axis lines, tick labels, axis legends and legend text. */
  readonly axisColor: Color;
  readonly gridLineColor: Color;
  /** Draws both axis lines with crisp edges; otherwise only the category baseline. */
  readonly axisFrame: boolean;
  readonly axisLineWidth: number;
  /** Replaces the library's default series colour, cycled by series index. Empty keeps it. */
  readonly seriesPalette: readonly Color[];
  /** Places value and category labels by measured bounds and omits overlapping ones. */
  readonly measuredLabels: boolean;
  /** Wraps legend entries by measured width instead of fixed-width columns. */
  readonly flowLegend: boolean;
  /** Bar corner radius when the bar style sets none. */
  readonly barCornerRadius: number;
  /** Draws bars as resolved vector paths and requests antialiased SVG shapes. */
  readonly styledGeometry: boolean;
  /** Standalone SVG follows the PDF text-baseline and rotation conventions. */
  readonly pdfTextBaseline: boolean;
}

/** The library's default series colour; a theme palette replaces only this colour. */
const LIBRARY_SERIES_COLOR = '#4f46e5';

/** @internal */
export const CHART_THEMES: Readonly<Record<'legacy' | 'modern', ChartTheme>> = {
  legacy: {
    titleX: undefined,
    titleY: 35,
    titleColor: Color.fromHex('#333333'),
    titleFontSize: 20,
    titleFontFamily: StandardFonts.Helvetica,
    titleAlignment: TextAlignment.Center,
    axisColor: Color.fromHex('#666666'),
    gridLineColor: Color.fromHex('#e0e0e0'),
    axisFrame: true,
    axisLineWidth: 1,
    seriesPalette: [],
    measuredLabels: false,
    flowLegend: false,
    barCornerRadius: 0,
    styledGeometry: false,
    pdfTextBaseline: false,
  },
  modern: {
    titleX: 32,
    titleY: 20,
    titleColor: Color.fromHex('#0f172a'),
    titleFontSize: 18,
    titleFontFamily: StandardFonts.HelveticaBold,
    titleAlignment: TextAlignment.Left,
    axisColor: Color.fromHex('#64748b'),
    gridLineColor: Color.fromHex('#e2e8f0'),
    axisFrame: false,
    axisLineWidth: 0.5,
    seriesPalette: ['#2563eb', '#0d9488', '#7c3aed', '#d97706', '#e11d48', '#0284c7'].map((hex) => Color.fromHex(hex)),
    measuredLabels: true,
    flowLegend: true,
    barCornerRadius: 4,
    styledGeometry: true,
    pdfTextBaseline: true,
  },
};

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
