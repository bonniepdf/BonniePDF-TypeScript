// Generated chart source. Do not edit here; the source manifest records its provenance.
import { ElementBase } from '../Elements/ElementBase';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../Elements/ElementOptions';
import { RenderContext } from '../Rendering/RenderContext';
import { IRoleProvider } from '../Rendering/Tagging/IRoleProvider';
import { IAltTextProvider } from '../Rendering/Tagging/IAltTextProvider';
import { SemanticRole } from '../Rendering/Tagging/SemanticRole';
import { renderTaggedChart } from './ChartTagging';
import { type ICanvas, toColor, type ColorInput, type Color, toLength, type LengthInput, StandardFonts, TextAlignment } from './ChartHost';
import { resolveChartTheme, type ChartTheme, type ChartThemeInput } from './ChartTheme';
import { ChartData, type ChartDataOptions } from './Models/ChartData';
import type { ChartPathCommand } from './Graphics/ChartPathPlan';
import { fillChartPath, strokeChartPath } from './Graphics/ChartVector';

const ROUNDED_K = (4 / 3) * (Math.SQRT2 - 1);

function roundedRectCommands(x: number, y: number, w: number, h: number, radius: number): ChartPathCommand[] {
  const r = Math.min(Math.max(0, radius), w / 2, h / 2);
  if (r <= 0) {
    return [
      { op: 'M', values: [x, y] },
      { op: 'L', values: [x + w, y] },
      { op: 'L', values: [x + w, y + h] },
      { op: 'L', values: [x, y + h] },
      { op: 'Z', values: [] },
    ];
  }
  const c = ROUNDED_K * r;
  return [
    { op: 'M', values: [x + r, y] },
    { op: 'L', values: [x + w - r, y] },
    { op: 'C', values: [x + w - r + c, y, x + w, y + r - c, x + w, y + r] },
    { op: 'L', values: [x + w, y + h - r] },
    { op: 'C', values: [x + w, y + h - r + c, x + w - r + c, y + h, x + w - r, y + h] },
    { op: 'L', values: [x + r, y + h] },
    { op: 'C', values: [x + r - c, y + h, x, y + h - r + c, x, y + h - r] },
    { op: 'L', values: [x, y + r] },
    { op: 'C', values: [x, y + r - c, x + r - c, y, x + r, y] },
    { op: 'Z', values: [] },
  ];
}

/** Settable properties declared by {@link ChartBase} itself. */
export const CHART_BASE_OPTION_KEYS = [
  ...ELEMENT_OPTION_KEYS,
  'theme',
  'data',
  'title',
  'subtitle',
  'caption',
  'width',
  'height',
  'backgroundColor',
  'borderRadius',
  'borderColor',
  'borderWidth',
  'autoLayout',
  'inheritDocumentFont',
  'stretchToFit',
  'svgShapeRendering',
  'altText',
  'isDecorative',
] as const;

/** Options common to every chart. */
export type ChartBaseOptions = ElementOptions & Partial<
  Omit<
    Pick<ChartBase, Exclude<(typeof CHART_BASE_OPTION_KEYS)[number], (typeof ELEMENT_OPTION_KEYS)[number]>>,
    'backgroundColor' | 'borderColor' | 'borderRadius' | 'borderWidth' | 'data' | 'width' | 'height' | 'theme'
  >
> & {
  /** Appearance preset (`legacy`, `modern`, `dark`, `print`) or custom theme definition. */
  theme?: ChartThemeInput;
  /** Chart width. Accepts a length: `800`, `'20cm'`, or `{ value, unit }`. */
  width?: LengthInput;
  /** Chart height. Accepts a length: `450`, `'12cm'`, or `{ value, unit }`. */
  height?: LengthInput;
  /** Chart content; accepts a ChartData instance or a nested options literal. */
  data?: ChartData | ChartDataOptions;
  /** Background fill. Accepts a palette token or hex. */
  backgroundColor?: Color | ColorInput;
  /** Optional card border corner radius. */
  borderRadius?: LengthInput;
  /** Optional card border colour. */
  borderColor?: Color | ColorInput;
  /** Optional card border stroke width. */
  borderWidth?: LengthInput;
};

/** Provides sizing, styling, accessibility, and canvas helpers shared by all charts. */
export abstract class ChartBase extends ElementBase implements IRoleProvider, IAltTextProvider {
  private _theme: ChartThemeInput = 'legacy';
  private _resolvedTheme: ChartTheme = resolveChartTheme('legacy');
  /** @internal Ambient document default font family supplied by a PDF host when `inheritDocumentFont` is true. */
  protected _inheritedFontFamily: string | undefined;

  /** Appearance preset (`legacy`, `modern`, `dark`, `print`) or composable theme object. */
  get theme(): ChartThemeInput {
    return this._theme;
  }
  set theme(value: ChartThemeInput) {
    this._resolvedTheme = resolveChartTheme(value);
    this._theme = value;
  }
  /** The values and behaviours behind {@link theme}. @internal */
  get appearance(): ChartTheme {
    return this._resolvedTheme;
  }
  /** @internal */
  get usesStyledGeometry(): boolean {
    return this.appearance.styledGeometry || this._borderRadius > 0 || (this._borderColor !== undefined && this._borderWidth > 0);
  }

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

  /** Optional subtitle drawn beneath the title. */
  public get subtitle(): string {
    return this._data.subtitle;
  }
  public set subtitle(value: string) {
    this._data.subtitle = value;
  }

  /** Optional source or footnote line drawn at the bottom-left of the chart. */
  public caption: string = '';

  /** Enable content-aware dynamic margins based on measured text bounds. */
  public autoLayout: boolean = false;

  /** When hosted in BonniePDF, inherit the document's default font family instead of Helvetica. */
  public inheritDocumentFont: boolean = false;

  /** Alternate text used when the document is generated as PDF/UA-1. */
  public altText: string = '';

  /** Marks the chart as decorative even when altText is set. */
  public isDecorative = false;

  /**
   * Charts self-tag because their positioned canvas is flushed separately.
   * @internal
   */
  public get handlesOwnTagging(): true {
    return true;
  }

  /** @inheritdoc */
  public get semanticRole(): SemanticRole {
    return this.isDecorative || !this.altText ? SemanticRole.Artifact : SemanticRole.Figure;
  }

  private _width: number = 800;
  /** Chart width in points (default 800). */
  public get width(): number {
    return this._width;
  }
  public set width(value: LengthInput) {
    this._width = toLength(value);
  }

  private _height: number = 450;
  /** Chart height in points (default 450). */
  public get height(): number {
    return this._height;
  }
  public set height(value: LengthInput) {
    this._height = toLength(value);
  }

  private _backgroundColor: Color | undefined;

  /** Background fill. Accepts a palette token or hex; undefined = transparent (or theme background). */
  public get backgroundColor(): Color | undefined {
    return this._backgroundColor;
  }
  public set backgroundColor(value: ColorInput | undefined) {
    this._backgroundColor = value === undefined ? undefined : toColor(value);
  }

  private _borderRadius: number = 0;
  /** Optional card border corner radius in points. */
  public get borderRadius(): number {
    return this._borderRadius;
  }
  public set borderRadius(value: LengthInput) {
    const r = toLength(value);
    if (!Number.isFinite(r) || r < 0) throw new RangeError('borderRadius must be finite and nonnegative.');
    this._borderRadius = r;
  }

  private _borderColor: Color | undefined;
  /** Optional card border colour. */
  public get borderColor(): Color | undefined {
    return this._borderColor;
  }
  public set borderColor(value: ColorInput | undefined) {
    this._borderColor = value === undefined ? undefined : toColor(value);
  }

  private _borderWidth: number = 0;
  /** Optional card border stroke width in points. */
  public get borderWidth(): number {
    return this._borderWidth;
  }
  public set borderWidth(value: LengthInput) {
    const w = toLength(value);
    if (!Number.isFinite(w) || w < 0) throw new RangeError('borderWidth must be finite and nonnegative.');
    this._borderWidth = w;
  }

  /**
   * When true, the chart will stretch to fill the container width.
   * The width will be set automatically by the document layout engine.
   */
  stretchToFit: boolean = false;

  /** SVG `shape-rendering` hint (`auto` or `crispEdges`). */
  svgShapeRendering: 'auto' | 'crispEdges' | undefined = undefined;

  /** Resolves the effective regular font family, respecting host font inheritance and theme fontFamily. */
  protected resolveFontFamily(explicitFamily?: string): string {
    const t = this.appearance;
    if ((this.inheritDocumentFont || t.fontFamily === 'inherit') && this._inheritedFontFamily) {
      return this._inheritedFontFamily;
    }
    if (explicitFamily && explicitFamily !== StandardFonts.Helvetica) return explicitFamily;
    return t.fontFamily === 'inherit' ? StandardFonts.Helvetica : t.fontFamily;
  }

  /** Resolves the effective title font family. */
  protected resolveTitleFontFamily(): string {
    const t = this.appearance;
    if ((this.inheritDocumentFont || t.fontFamily === 'inherit') && this._inheritedFontFamily) {
      return this._inheritedFontFamily;
    }
    return t.titleFontFamily;
  }

  /** Resolves the effective background fill (explicit overrides theme). */
  protected get effectiveBackgroundColor(): Color | undefined {
    return this._backgroundColor ?? this.appearance.backgroundColor;
  }

  /** Renders the chart onto the given vector sink using `data` (defaults to `this.data`). */
  draw(canvas: ICanvas, data: ChartData = this.data): void {
    const bg = this.effectiveBackgroundColor;
    if (bg !== undefined) {
      if (this._borderRadius > 0) {
        fillChartPath(canvas, { commands: roundedRectCommands(0, 0, this.width, this.height, this._borderRadius), color: bg });
      } else {
        canvas.fillRect(0, 0, this.width, this.height, bg);
      }
    }

    if (data.title !== '') {
      this.drawTitle(canvas, data.title);
    }

    const sub = data.subtitle;
    if (sub !== '') {
      this.drawSubtitle(canvas, sub, data.title !== '');
    }

    this.drawContent(canvas, data);

    if (this.caption !== '') {
      this.drawCaption(canvas, this.caption);
    }

    if (this._borderColor !== undefined && this._borderWidth > 0) {
      const inset = this._borderWidth / 2;
      strokeChartPath(canvas, {
        commands: roundedRectCommands(inset, inset, this.width - this._borderWidth, this.height - this._borderWidth, Math.max(0, this._borderRadius - inset)),
        color: this._borderColor,
        lineWidth: this._borderWidth,
        lineJoin: 'round',
      });
    }
  }

  protected drawTitle(canvas: ICanvas, title: string): void {
    const t = this.appearance;
    canvas.drawText(
      t.titleX ?? this.width / 2,
      t.titleY,
      title,
      t.titleColor,
      t.titleFontSize,
      this.resolveTitleFontFamily(),
      t.titleAlignment
    );
  }

  protected drawSubtitle(canvas: ICanvas, subtitle: string, hasTitle: boolean): void {
    const t = this.appearance;
    const y = hasTitle ? t.titleY + t.titleFontSize + 4 : t.titleY;
    canvas.drawText(
      t.titleX ?? this.width / 2,
      y,
      subtitle,
      t.subtitleColor,
      11,
      this.resolveFontFamily(),
      t.titleAlignment
    );
  }

  protected drawCaption(canvas: ICanvas, caption: string): void {
    const t = this.appearance;
    canvas.drawText(
      t.titleX ?? 20,
      this.height - 14,
      caption,
      t.subtitleColor,
      8.5,
      this.resolveFontFamily(),
      TextAlignment.Left
    );
  }

  protected abstract drawContent(canvas: ICanvas, data: ChartData): void;

  /** @internal */
  public applyCascadedTextStyle(style: { fontFamily?: string }): void {
    this._inheritedFontFamily = style.fontFamily || undefined;
  }

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
