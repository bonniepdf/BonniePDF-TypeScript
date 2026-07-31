import { IElement } from '../Elements/IElement';
import { RenderContext } from '../Rendering/RenderContext';
import { Color } from './Color';
import { Thickness } from './Thickness';
import { FontMetrics } from '../Typography/FontMetrics';
import { StandardFonts } from '../Typography/StandardFonts';
import { PdfSyntax } from '../Rendering/Pdf/PdfSyntax';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { IRoleProvider } from '../Rendering/Tagging/IRoleProvider';
import { SemanticRole } from '../Rendering/Tagging/SemanticRole';
import { applyOptions } from './applyOptions';
import { toColor, type ColorInput } from '../Normalize/toColor';
import { toThickness, type ThicknessInput } from '../Normalize/toThickness';
import type { StructureElement } from '../Rendering/Tagging/StructureElement';

/**
 * Represents a hyperlink annotation in a PDF document.
 *
 * Hyperlinks are clickable areas that navigate to a URI.
 * This element implements IElement so it can be added like other elements.
 */
/**
 * Settable *authoring* properties of {@link Hyperlink}. The `render*` bounds and
 * `linkedStructElement` are layout output, set by `setRenderBounds` during
 * rendering, and are deliberately excluded.
 */
export const HYPERLINK_OPTION_KEYS = [
  'text',
  'uri',
  'targetPageIndex',
  'fontName',
  'fontSize',
  'textColor',
  'margin',
] as const;

type HyperlinkKey = (typeof HYPERLINK_OPTION_KEYS)[number];

/** Options for {@link Hyperlink}. */
export type HyperlinkOptions = Partial<Omit<Pick<Hyperlink, HyperlinkKey>, 'textColor' | 'margin'>> & {
  /** Link text colour. Accepts a palette token or hex. */
  textColor?: ColorInput;
  /** Margin around the link. Accepts `12`, `[h, v]`, `[l, t, r, b]` or `{ bottom: 12 }`. */
  margin?: ThicknessInput;
};

export class Hyperlink implements IElement, IRoleProvider {
  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return SemanticRole.Link;
  }

  /**
   * Gets or sets the URI (URL) that this hyperlink points to
   */
  uri: string = '';
  /**
   * Gets or sets the target 0-based page index (for internal links)
   */
  targetPageIndex: number | undefined;
  /**
   * Gets the link text to display
   */
  text: string;
  /**
   * Gets or sets the font name for the link text
   */
  fontName: string = StandardFonts.Helvetica;
  /**
   * Gets or sets the font size for the link text
   */
  fontSize: number = 12;
  /**
   * Gets or sets the text color for the link
   */
  private _textColor: Color = Color.blue;

  /** Link text colour. Accepts a palette token or hex on write. */
  public get textColor(): Color {
    return this._textColor;
  }
  public set textColor(value: ColorInput) {
    this._textColor = toColor(value);
  }
  /**
   * Gets or sets the margin around the hyperlink
   */
  private _margin: Thickness = new Thickness(0);

  /** Margin around the link. Accepts the forgiving spacing forms on write. */
  public get margin(): Thickness {
    return this._margin;
  }
  public set margin(value: ThicknessInput) {
    this._margin = toThickness(value);
  }

  // Internal properties set during rendering

  /**
   * @internal - the Link struct element opened for this hyperlink during the
   * render pass. Set by the pipeline so the serializer can write
   * /StructParent + /OBJR on the annotation.
   */
  linkedStructElement?: StructureElement;

  /**
   * @internal - Gets the X position of the rendered annotation rectangle in PDF coordinates (bottom-left origin).
   */
  renderX: number = 0;
  /**
   * @internal - Gets the Y position of the rendered annotation rectangle in PDF coordinates (bottom-left origin).
   */
  renderY: number = 0;
  /**
   * @internal - Gets the width of the rendered annotation rectangle in points.
   */
  renderWidth: number = 0;
  /**
   * @internal - Gets the height of the rendered annotation rectangle in points.
   */
  renderHeight: number = 0;

  /**
   * Line height derived from fontSize with a standard 1.2× leading factor.
   */
  private get lineHeight(): number {
    return this.fontSize * 1.2;
  }

  /**
   * Creates a new hyperlink with the specified URI and display text
   * @param text - The link text to display
   * @param uri - The URI (URL) that this hyperlink points to
   */
  /** Creates a hyperlink from its text and optional URI. */
  constructor(text: string, uri?: string, options?: HyperlinkOptions);
  /** Options-only form; `text` is required either way. */
  constructor(options: HyperlinkOptions & { text: string });
  constructor(textOrOptions: string | (HyperlinkOptions & { text: string }), uri?: string, options?: HyperlinkOptions) {
    const isPositional = typeof textOrOptions === 'string';
    const text = isPositional ? textOrOptions : textOrOptions.text;
    if (!text || text === '') {
      throw new Error('Hyperlink text cannot be null or empty');
    }
    this.text = text;

    if (isPositional) {
      if (uri !== undefined) {
        if (uri === '') throw new Error('URI cannot be null or empty');
        this.uri = uri;
      }
      applyOptions(this, options);
    } else {
      // `text` already assigned above; applyOptions re-assigns it harmlessly.
      applyOptions(this, textOrOptions);
    }
  }

  /**
   * Sets the rendered bounding rectangle in PDF coordinates (bottom-left origin).
   * Called during rendering so that the annotation can be written after layout is complete.
   */
  setRenderBounds(x: number, y: number, width: number, height: number): void {
    this.renderX = x;
    this.renderY = y;
    this.renderWidth = width;
    this.renderHeight = height;
  }

  /**
   * Gets the preferred width of this element, if any.
   */
  getPreferredWidth(): number {
    return FontMetrics.getStringWidth(this.text, this.fontName, this.fontSize) + this.margin.left + this.margin.right;
  }

  /**
   * Measures the height of this hyperlink given the available width
   * @param availableWidth - The available width for the hyperlink
   */
  measureHeight(availableWidth: number): number {
    const contentWidth = availableWidth - this.margin.left - this.margin.right;
    const contentHeight = this.computeLineCount(contentWidth) * this.lineHeight;
    return contentHeight + this.margin.top + this.margin.bottom;
  }

  /**
   * Renders this hyperlink to the PDF context and registers the annotation
   * @param ctx - The render context
   * @param width - The available width
   */
  render(ctx: RenderContext, width: number): void {
    // Save starting Y position for correct advancement
    const startY = ctx.currentY;

    // Layout capture (opt-in, no-op without a recorder): Hyperlink implements
    // IElement directly rather than extending ElementBase, so it must record its
    // own node — otherwise links never appear in the layout snapshot and the
    // previewer's structure/accessibility views cannot show them. Mirrors
    // ElementBase.render: the full margin box, opened and closed (complete)
    // around the atomic render. The recorder derives the Link role via
    // accessibilityOf(this) from semanticRole.
    ctx.layoutRecorder?.openNode(this, 'Hyperlink', undefined, ctx.currentPageIndex, ctx.currentX, startY, width);

    // Apply top margin
    ctx.currentY += this.margin.top;

    const contentWidth = width - this.margin.left - this.margin.right;
    const lines = this.computeLines(contentWidth);
    let localY = ctx.currentY;

    // Draw through the canvas (not by appending raw operators to the page
    // stream) so the link text lands inside the /Link marked-content scope the
    // pipeline opens around this element. Writing to ctx.pages directly emitted
    // the text outside that scope, leaving it untagged (PDF/UA 7.1).
    let maxWidth = 0;
    for (const line of lines) {
      const lineWidth = FontMetrics.getStringWidth(line, this.fontName, this.fontSize);
      if (lineWidth > maxWidth) {
        maxWidth = lineWidth;
      }

      ctx.canvas.drawText(
        ctx.currentX + this.margin.left,
        localY,
        line,
        this.textColor,
        this.fontSize,
        this.fontName,
        TextAlignment.Left
      );

      localY += this.lineHeight;
    }

    // Calculate total content height
    const contentHeight = lines.length * this.lineHeight;

    // Store render position for annotation (PDF coordinates: bottom-left origin)
    // The rectangle should be in PDF coordinates where (0,0) is bottom-left
    this.renderX = ctx.currentX + this.margin.left;
    // Convert from top-down to bottom-up coordinates
    this.renderY = ctx.pageSize.height - (startY + this.margin.top + contentHeight);
    this.renderWidth = maxWidth;
    this.renderHeight = contentHeight;

    // Register this hyperlink in the render context
    ctx.registerHyperlink(this);

    // Advance Y by the total height (margins + content)
    ctx.currentY = startY + this.margin.top + contentHeight + this.margin.bottom;

    ctx.layoutRecorder?.closeNode(this, ctx.currentPageIndex, ctx.currentY, true);
  }

  /**
   * Gets the PDF rectangle string for this hyperlink in the format [x1 y1 x2 y2]
   * where (x1, y1) is the bottom-left corner and (x2, y2) is the top-right corner
   */
  getRectangleString(): string {
    // PDF coordinates: (0,0) is bottom-left
    // RenderX, RenderY are already in PDF coordinates (bottom-left based)
    return `[${PdfSyntax.formatDecimal(this.renderX)} ${PdfSyntax.formatDecimal(this.renderY)} ${PdfSyntax.formatDecimal(this.renderX + this.renderWidth)} ${PdfSyntax.formatDecimal(this.renderY + this.renderHeight)}]`;
  }

  /**
   * Returns the number of wrapped lines required to render text within the given width.
   * @param maxWidth - The maximum width for text wrapping
   */
  private computeLineCount(maxWidth: number): number {
    if (!this.text || this.text === '') return 0;
    return this.computeLines(maxWidth).length;
  }

  /**
   * Wraps text into a list of lines that each fit within maxWidth.
   * Uses a greedy word-wrap algorithm measured with FontMetrics.
   * @param maxWidth - The maximum width for each line
   */
  private computeLines(maxWidth: number): string[] {
    const lines: string[] = [];
    if (!this.text || this.text === '') return lines;

    const words = this.text.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine === '' ? word : currentLine + ' ' + word;

      const testWidth = FontMetrics.getStringWidth(testLine, this.fontName, this.fontSize);

      if (testWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine !== '') lines.push(currentLine);
    return lines;
  }
}
