import { PdfSyntax } from './PdfSyntax';
/** Creates PDF content-stream operators for text, paths, graphics state, and marked content. */
export class PdfOperators {
  public static saveState(s: string[]): void {
    s.push('q\n');
  }

  public static restoreState(s: string[]): void {
    s.push('Q\n');
  }

  public static translate(s: string[], x: number, y: number): void {
    s.push(`1 0 0 1 ${PdfSyntax.formatDecimal(x)} ${PdfSyntax.formatDecimal(y)} cm\n`);
  }

  public static scale(s: string[], sx: number, sy: number): void {
    s.push(`${PdfSyntax.formatDecimal(sx)} 0 0 ${PdfSyntax.formatDecimal(sy)} 0 0 cm\n`);
  }

  public static rotate(s: string[], angleDegrees: number): void {
    const radians = angleDegrees * (Math.PI / 180.0);
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    s.push(
      `${PdfSyntax.formatDecimal(cos)} ${PdfSyntax.formatDecimal(sin)} ${PdfSyntax.formatDecimal(-sin)} ${PdfSyntax.formatDecimal(cos)} 0 0 cm\n`
    );
  }

  public static concatMatrix(s: string[], a: number, b: number, c: number, d: number, e: number, f: number): void {
    s.push(
      `${PdfSyntax.formatDecimal(a)} ${PdfSyntax.formatDecimal(b)} ${PdfSyntax.formatDecimal(c)} ${PdfSyntax.formatDecimal(d)} ${PdfSyntax.formatDecimal(e)} ${PdfSyntax.formatDecimal(f)} cm\n`
    );
  }

  public static setGraphicsState(s: string[], name: string): void {
    s.push(`${name} gs\n`);
  }

  public static setFillColor(s: string[], color: { scR: number; scG: number; scB: number }): void {
    s.push(`${PdfSyntax.formatColor(color)} rg\n`);
  }

  public static setStrokeColor(s: string[], color: { scR: number; scG: number; scB: number }): void {
    s.push(`${PdfSyntax.formatColor(color)} RG\n`);
  }

  public static setLineWidth(s: string[], width: number): void {
    s.push(`${PdfSyntax.formatDecimal(width)} w\n`);
  }

  public static setLineJoin(s: string[], style: number): void {
    s.push(`${style} j\n`);
  }

  public static setMiterLimit(s: string[], limit: number): void {
    s.push(`${PdfSyntax.formatDecimal(limit)} M\n`);
  }

  public static moveTo(s: string[], x: number, y: number): void {
    s.push(`${PdfSyntax.formatDecimal(x)} ${PdfSyntax.formatDecimal(y)} m\n`);
  }

  public static lineTo(s: string[], x: number, y: number): void {
    s.push(`${PdfSyntax.formatDecimal(x)} ${PdfSyntax.formatDecimal(y)} l\n`);
  }

  public static curveTo(s: string[], x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void {
    s.push(
      `${PdfSyntax.formatDecimal(x1)} ${PdfSyntax.formatDecimal(y1)} ${PdfSyntax.formatDecimal(x2)} ${PdfSyntax.formatDecimal(y2)} ${PdfSyntax.formatDecimal(x3)} ${PdfSyntax.formatDecimal(y3)} c\n`
    );
  }

  public static rectangle(s: string[], x: number, y: number, width: number, height: number): void {
    s.push(
      `${PdfSyntax.formatDecimal(x)} ${PdfSyntax.formatDecimal(y)} ${PdfSyntax.formatDecimal(width)} ${PdfSyntax.formatDecimal(height)} re\n`
    );
  }

  public static closePath(s: string[]): void {
    s.push('h\n');
  }

  /**
   * `W n` - intersect the current clipping path with the current path (non-zero
   * winding rule), then end the path without painting it. Subsequent marking
   * operators are confined to the intersection until the enclosing `q`/`Q`
   * restores the previous clip.
   */
  public static clip(s: string[]): void {
    s.push('W n\n');
  }

  public static stroke(s: string[]): void {
    s.push('S\n');
  }

  public static rectangleFill(s: string[], x: number, y: number, width: number, height: number): void {
    s.push(
      `${PdfSyntax.formatDecimal(x)} ${PdfSyntax.formatDecimal(y)} ${PdfSyntax.formatDecimal(width)} ${PdfSyntax.formatDecimal(height)} re f\n`
    );
  }

  public static rectangleStroke(s: string[], x: number, y: number, width: number, height: number): void {
    s.push(
      `${PdfSyntax.formatDecimal(x)} ${PdfSyntax.formatDecimal(y)} ${PdfSyntax.formatDecimal(width)} ${PdfSyntax.formatDecimal(height)} re S\n`
    );
  }

  public static setWordSpacing(s: string[], spacing: number): void {
    s.push(`${PdfSyntax.formatDecimal(spacing)} Tw\n`);
  }

  /**
   * Emits the character-spacing operator (`Tc`). Applies to every glyph shown
   * by both `Tj` and `TJ`, for simple and composite fonts alike, so it is the
   * universal mechanism for letter spacing.
   */
  public static setCharacterSpacing(s: string[], spacing: number): void {
    s.push(`${PdfSyntax.formatDecimal(spacing)} Tc\n`);
  }

  public static strokeLine(s: string[], x1: number, y1: number, x2: number, y2: number): void {
    s.push(
      `${PdfSyntax.formatDecimal(x1)} ${PdfSyntax.formatDecimal(y1)} m ${PdfSyntax.formatDecimal(x2)} ${PdfSyntax.formatDecimal(y2)} l S\n`
    );
  }

  public static fill(s: string[]): void {
    s.push('f\n');
  }

  public static closePathFillStroke(s: string[]): void {
    s.push('b\n');
  }

  public static closePathStroke(s: string[]): void {
    s.push('s\n');
  }

  public static beginText(s: string[]): void {
    s.push('BT\n');
  }

  public static endText(s: string[]): void {
    s.push('ET\n');
  }

  public static setFont(s: string[], fontResourceName: string, size: number): void {
    s.push(`${fontResourceName} ${size} Tf\n`);
  }

  public static setTextPosition(s: string[], x: number, y: number): void {
    s.push(`1 0 0 1 ${PdfSyntax.formatDecimal(x)} ${PdfSyntax.formatDecimal(y)} Tm\n`);
  }

  public static showText(s: string[], operand: string): void {
    s.push(`${operand} Tj\n`);
  }

  /**
   * `TJ` - show text with individual glyph positioning. The operand is a
   * pre-built array, e.g. `[<0024> 80 <0057>]`, where numbers are advance
   * adjustments in thousandths of an em, *subtracted* from the current
   * position (so a tightening kern of -80 font units is emitted as `80`).
   */
  public static showTextPositioned(s: string[], arrayOperand: string): void {
    s.push(`${arrayOperand} TJ\n`);
  }

  public static paintXObject(s: string[], name: string): void {
    s.push(`${name} Do\n`);
  }

  // ── Marked content (PDF Ref 14.6 - tagged PDF / PDF/UA) ──────────

  /**
   * `/<role> << /MCID n >> BDC` - begin a marked-content sequence with
   * a PDF structure role and an MCID. Content emitted up to the
   * matching {@link endMarkedContent} is associated with the structure
   * element holding this MCID.
   */
  public static beginMarkedContentTagged(s: string[], role: string, mcid: number): void {
    s.push(`/${role} << /MCID ${mcid} >> BDC\n`);
  }

  /** `/<role> BMC` - begin a container marked-content sequence without an MCID. */
  public static beginMarkedContentBmc(s: string[], role: string): void {
    s.push(`/${role} BMC\n`);
  }

  /** `EMC` - end the most recent marked-content sequence. */
  public static endMarkedContent(s: string[]): void {
    s.push('EMC\n');
  }

  /** `/Artifact BMC` - begin an artifact region (no MCID, not in struct tree). */
  public static beginArtifact(s: string[]): void {
    s.push('/Artifact BMC\n');
  }
}
