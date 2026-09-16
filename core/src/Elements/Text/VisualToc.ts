import { TextAlignment } from './TextAlignment';
import { applyOptions } from '../../Core/applyOptions';
import { ELEMENT_OPTION_KEYS, type ElementOptions } from '../ElementOptions';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { ElementBase } from '../ElementBase';
import { IElement, IStatefulElement } from '../IElement';
import { RenderStatus } from '../RenderStatus';
import { RenderContext } from '../../Rendering/RenderContext';
import type { RegisteredLink } from '../../Rendering/RegisteredLink';
import { PdfSyntax } from '../../Rendering/Pdf/PdfSyntax';
import { StandardFonts } from '../../Typography/StandardFonts';
import { FontMetrics } from '../../Typography/FontMetrics';
import { Color } from '../../Core/Color';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';
import { beginChildTag, endChildTag } from '../../Rendering/Tagging/ChildTagging';
import { toLength, type LengthInput } from '../../Normalize/toLength';

/**
 * Renders a visual Table of Contents with dotted leaders and right-aligned page numbers,
 * built from a list of heading identifiers that were registered during layout.
 * Supports multi-page overflow via IStatefulElement so that very long
 * tables of contents flow naturally across page boundaries.
 */
/** Settable properties declared by {@link VisualToc} itself. */
export const VISUAL_TOC_OWN_OPTION_KEYS = ['headingIdentifiers', 'fontName', 'fontSize', 'textColor'] as const;

/** The full settable surface, base included. */
export const VISUAL_TOC_OPTION_KEYS = [...ELEMENT_OPTION_KEYS, ...VISUAL_TOC_OWN_OPTION_KEYS] as const;

/** Options for {@link VisualToc}. */
export type VisualTocOptions = ElementOptions &
  Partial<Omit<Pick<VisualToc, (typeof VISUAL_TOC_OWN_OPTION_KEYS)[number]>, 'textColor' | 'fontSize'>> & {
    /** Entry font size. Accepts a length: `12`, `'12pt'`, or `{ value, unit }`. */
    fontSize?: LengthInput;
    /** Entry text colour. Accepts a palette token or hex. */
    textColor?: ColorInput;
  };

/** Renders a table of contents from headings collected during document layout. */
export class VisualToc extends ElementBase implements IStatefulElement, IRoleProvider {
  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return SemanticRole.TOC;
  }

  /**
   * Gets or sets the ordered list of TOC identifiers to render.
   * Each identifier must match the Heading.TocIdentifier of a rendered heading.
   */
  /** Creates a visual table of contents, optionally configured in one expression. */
  constructor(options?: VisualTocOptions) {
    super();
    applyOptions(this, options);
  }

  public headingIdentifiers: string[] = [];

  /**
   * Gets or sets the font name used to render TOC entry text.
   */
  public fontName: string = StandardFonts.Helvetica;

  private _fontSize: number = 12;

  /**
   * Gets or sets the font size (in points) used to render TOC entry text.
   *
   * Accepts a length: a number of points, `'12pt'`, or `{ value, unit }` (§4A.3).
   */
  public get fontSize(): number {
    return this._fontSize;
  }
  public set fontSize(value: LengthInput) {
    this._fontSize = toLength(value);
  }

  /**
   * Gets or sets the text color used for TOC entries.
   */
  private _textColor: Color = Color.black;

  /** Entry text colour. Accepts a palette token or hex. */
  public get textColor(): Color {
    return this._textColor;
  }
  public set textColor(value: ColorInput) {
    this._textColor = toColor(value);
  }

  private lastRenderedIndex = -1;

  /**
   * Returns the preferred content width. The element expands to fill all available width.
   */
  protected override getPreferredContentWidth(): number {
    return 0; // It will expand to available width
  }

  /**
   * Measures the total height required to render all TOC entries at the configured font size.
   */
  protected override measureContentHeight(_contentWidth: number): number {
    return this.headingIdentifiers.length * (this.fontSize * 1.2);
  }

  /**
   * Renders all TOC entries at the current cursor position without page-boundary checks.
   * Used by the non-stateful render path when the entire TOC is known to fit.
   */
  protected override renderContent(ctx: RenderContext, contentWidth: number): void {
    let y = ctx.currentY;
    const lineHeight = this.fontSize * 1.2;

    for (let i = 0; i < this.headingIdentifiers.length; i++) {
      this.drawTaggedTocEntry(ctx, this.headingIdentifiers[i], contentWidth, y);
      y += lineHeight;
    }

    ctx.currentY = y;
  }

  /**
   * Renders as many TOC entries as fit on the current page, advancing the cursor and
   * returning RenderStatus.Overflow when more entries remain for the next page.
   */
  public renderStateful(ctx: RenderContext, width: number): RenderStatus {
    if (this.lastRenderedIndex < 0) {
      ctx.currentY += this.margin.top;
    }

    const contentWidth = this.getContentWidth(width);
    const originalX = ctx.currentX;
    ctx.currentX += this.margin.left;
    const lineHeight = this.fontSize * 1.2;
    const startIndex = this.lastRenderedIndex + 1;

    try {
      if (startIndex >= this.headingIdentifiers.length) {
        ctx.currentY += this.margin.bottom;
        return RenderStatus.Complete;
      }

      const startY = ctx.currentY;
      let itemsThatFit = 0;
      let testY = startY;

      for (let i = startIndex; i < this.headingIdentifiers.length; i++) {
        if (testY + lineHeight > ctx.maxY) break;
        itemsThatFit++;
        testY += lineHeight;
      }

      if (itemsThatFit === 0) {
        return startIndex === 0 ? RenderStatus.WrapRequired : RenderStatus.Overflow;
      }

      const endIndex = startIndex + itemsThatFit;
      let y = startY;
      for (let i = startIndex; i < endIndex; i++) {
        this.drawTaggedTocEntry(ctx, this.headingIdentifiers[i], contentWidth, y);
        y += lineHeight;
      }

      this.lastRenderedIndex = endIndex - 1;
      ctx.currentY = y;

      if (endIndex >= this.headingIdentifiers.length) {
        ctx.currentY += this.margin.bottom;
        return RenderStatus.Complete;
      }

      return RenderStatus.Overflow;
    } finally {
      ctx.currentX = originalX;
    }
  }

  /**
   * Draws a single TOC entry: the heading text on the left, a dotted leader in the middle,
   * and the resolved page number on the right. Also registers a clickable hyperlink annotation
   * spanning the full line width so the user can navigate directly to the heading.
   */
  /**
   * Wraps drawTocEntry in a /TOCI struct element + marked-content
   * scope so each entry is its own addressable item in the PDF/UA
   * structure tree. The outer /TOC wrap comes from the pipeline's
   * IRoleProvider hook using {@link semanticRole}. No-op when tagging
   * is off.
   */
  private drawTaggedTocEntry(ctx: RenderContext, identifier: string, contentWidth: number, y: number): void {
    const tagging = ctx.tagging;
    const tagThisEntry = tagging != null;
    if (tagThisEntry) {
      tagging!.tree.begin(SemanticRole.TOCI);
      ctx.canvas.beginMarkedContent('TOCI');
    }

    try {
      this.drawTocEntry(ctx, identifier, contentWidth, y);
    } finally {
      if (tagThisEntry) {
        ctx.canvas.endMarkedContent();
        tagging!.tree.end();
      }
    }
  }

  private drawTocEntry(ctx: RenderContext, identifier: string, contentWidth: number, y: number): void {
    let pageNumStr = 'XX';
    if (ctx.tocEntries.has(identifier)) {
      pageNumStr = ctx.tocEntries.get(identifier)!.toString();
    }

    // Draw heading text
    ctx.canvas.drawText(ctx.currentX, y, identifier, this.textColor, this.fontSize, this.fontName, TextAlignment.Left);

    // Draw page number
    const pageNumWidth = FontMetrics.getStringWidth(pageNumStr, this.fontName, this.fontSize);
    const pageNumX = ctx.currentX + contentWidth - pageNumWidth;
    ctx.canvas.drawText(pageNumX, y, pageNumStr, this.textColor, this.fontSize, this.fontName, TextAlignment.Left);

    // Draw dotted leader
    const textWidth = FontMetrics.getStringWidth(identifier, this.fontName, this.fontSize);
    const startDotX = ctx.currentX + textWidth + 5;
    const endDotX = pageNumX - 5;

    if (endDotX > startDotX) {
      const dot = '.';
      const dotWidth = FontMetrics.getStringWidth(dot, this.fontName, this.fontSize);
      let currentDotX = startDotX;
      while (currentDotX + dotWidth <= endDotX) {
        ctx.canvas.drawText(currentDotX, y, dot, this.textColor, this.fontSize, this.fontName, TextAlignment.Left);
        currentDotX += dotWidth * 2; // Spacing between dots
      }
    }

    // Make the entire line clickable to the internal named destination
    const lineHeight = this.fontSize * 1.2;
    const pdfX = ctx.currentX;
    const pdfY = ctx.pageSize.height - (y + lineHeight); // PDF coordinate is bottom-up

    // tocEntries stores a 1-based page *number* (Heading records
    // currentPageIndex + 1); the link annotation writer treats
    // targetPageIndex as a 0-based index into the page-id table, so convert
    // back. Mirrors VisualToc.cs (`p - 1`). Falls back to the first page when
    // the identifier was never resolved (single-pass / missing heading).
    const resolvedPageNumber = ctx.tocEntries.get(identifier);
    const targetPage = resolvedPageNumber != null ? resolvedPageNumber - 1 : 0;
    const link: RegisteredLink & { semanticRole: SemanticRole } = {
      identifier,
      // Mirror the visible entry text into the annotation /Contents (PDF/UA 7-18),
      // matching the .NET TOC link which is a Hyperlink(identifier).
      text: identifier,
      targetPageIndex: targetPage,
      renderX: pdfX,
      renderY: pdfY,
      renderWidth: contentWidth,
      renderHeight: lineHeight,
      // Declared so beginChildTag (below) recognises this as a Link-role
      // element via isRoleProvider and wires linkedStructElement onto it,
      // exactly as it would for a real Hyperlink instance. Must be present
      // as an actual key (not just typed optional) - beginChildTag checks
      // `'linkedStructElement' in child`, which is false for a key that was
      // never assigned, even as undefined.
      semanticRole: SemanticRole.Link,
      linkedStructElement: undefined,
      setRenderBounds(rx: number, ry: number, rw: number, rh: number) {
        this.renderX = rx;
        this.renderY = ry;
        this.renderWidth = rw;
        this.renderHeight = rh;
      },
      // Without this the annotation writer falls back to `[0 0 0 0]` and the
      // link has no clickable area. Byte-identical to Hyperlink.getRectangleString
      // so TOC links match inline links (and the .NET output).
      getRectangleString(): string {
        return (
          `[${PdfSyntax.formatDecimal(this.renderX)} ${PdfSyntax.formatDecimal(this.renderY)} ` +
          `${PdfSyntax.formatDecimal(this.renderX + this.renderWidth)} ${PdfSyntax.formatDecimal(this.renderY + this.renderHeight)}]`
        );
      },
    };

    // Unlike a Hyperlink added as a document child, this one is a plain
    // RegisteredLink built and registered directly rather than going through
    // Hyperlink.render(), so it never passes through the pipeline's
    // per-element beginChildTag/endChildTag wrap that assigns
    // linkedStructElement (PDF/UA 14.8.4.4.2 requires every Link annotation
    // to be tagged). Open/close that wrap explicitly here. Mirrors VisualToc.cs.
    const token = beginChildTag(ctx, link as unknown as IElement);
    try {
      ctx.registerHyperlink(link);
    } finally {
      endChildTag(ctx, token);
    }
  }

  /**
   * Resets the render state so that rendering can restart from the first entry,
   * for example before a second layout pass.
   */
  public resetState(): void {
    this.lastRenderedIndex = -1;
  }
}
