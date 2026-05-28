import { Color } from '../Core/Color';
import { Point } from '../Core/Point';
import { Size } from '../Core/Size';
import { TextAlignment } from '../Elements/Text/TextAlignment';

export interface ICanvas {
  readonly width: number;
  readonly height: number;

  saveState(): void;
  restoreState(): void;

  fillRect(x: number, y: number, width: number, height: number, color: Color): void;
  strokeRect(x: number, y: number, width: number, height: number, color: Color, strokeWidth: number): void;
  drawLine(x1: number, y1: number, x2: number, y2: number, color: Color, lineWidth: number): void;
  fillCircle(cx: number, cy: number, radius: number, color: Color): void;
  fillPath(points: Point[], color: Color): void;
  fillRoundedRect(x: number, y: number, width: number, height: number, radius: number, color: Color): void;
  strokeRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    color: Color,
    strokeWidth: number
  ): void;

  drawText(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    align: TextAlignment
  ): void;
  drawTextRotated(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    angleDegrees: number
  ): void;
  drawTextJustified(
    x: number,
    y: number,
    text: string,
    color: Color,
    fontSize: number,
    fontFamily: string,
    availableWidth: number
  ): void;
  measureText(text: string, fontSize: number, fontFamily: string): Size;

  drawImage(image: any, x: number, y: number, width: number, height: number): void;
  drawFormXObject(resourceName: string, x: number, y: number): void;

  // ── Marked content (PDF/UA tagging) ──────────────────────────────

  /**
   * Begin a marked-content sequence tagged with a PDF structure role
   * (e.g. `"H1"`, `"P"`, `"Figure"`). On PDF this emits
   * `/<role> << /MCID n >> BDC`; on SVG it is a no-op (SVG-out doesn't
   * carry PDF structure). The MCID is auto-allocated and attached to
   * the currently-open structure element via the tagging context.
   *
   * When the canvas has no tagging context (the document is not opted
   * into PDF/UA), this method is a no-op so renderer code can call it
   * unconditionally.
   */
  beginMarkedContent(role: string): void;

  /**
   * Begin a grouping/container marked-content sequence without allocating
   * an MCID. Emits `/<role> BMC` on PDF. Use for structure-tree container
   * roles (Table, TR, THead, TBody, TFoot, Sect, …) whose content is
   * referenced by child structure elements rather than directly by an MCID.
   * Prevents "Nested MCID" warnings when container BDC blocks would
   * otherwise enclose leaf BDC blocks.
   */
  beginContainerContent(role: string): void;

  /**
   * End the most recent marked-content sequence opened by
   * {@link beginMarkedContent} or {@link beginContainerContent}.
   * Emits `EMC` on PDF; no-op on SVG and when tagging is disabled.
   */
  endMarkedContent(): void;

  /**
   * Begin an artifact (decorative/navigational) marked-content region.
   * Emits `/Artifact BMC` on PDF. Unlike {@link beginMarkedContent},
   * artifact regions are not registered in the structure tree and do not
   * allocate an MCID. No-op when the document is not tagged or when using
   * SVG output.
   */
  beginArtifact(): void;

  /**
   * End the artifact region opened by {@link beginArtifact}. Emits `EMC`
   * on PDF; no-op on SVG.
   */
  endArtifact(): void;
}
