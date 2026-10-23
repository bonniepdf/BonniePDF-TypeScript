/**
 * Represents an RGB color with values ranging from 0 to 255.
 * Internally stores values as floats (0.0 to 1.0) for high-precision PDF operations.
 */
export class Color {
  // Not `readonly` so fromScRgb can overwrite the byte-normalised values with
  // raw scRGB floats after construction; never mutated once a Color escapes.
  private r: number;
  private g: number;
  private b: number;
  private a: number;

  /**
   * Creates a new Color from byte values (0-255).
   */
  constructor(r: number, g: number, b: number, a?: number);
  /**
   * Creates a new Color from integer values (0-255).
   * Values are clamped to the valid byte range.
   */
  constructor(r: number, g: number, b: number, a: number = 255) {
    this.r = this.clamp(r) / 255;
    this.g = this.clamp(g) / 255;
    this.b = this.clamp(b) / 255;
    this.a = this.clamp(a) / 255;
  }

  private clamp(value: number): number {
    return Math.max(0, Math.min(255, Math.round(value)));
  }

  /**
   * Creates a Color from scRGB float values (0.0 - 1.0).
   * Use this for high-precision color definition or when porting from legacy code.
   */
  static fromScRgb(r: number, g: number, b: number, a: number = 1.0): Color {
    const color = new Color(0, 0, 0);
    color.r = Math.max(0, Math.min(1, r));
    color.g = Math.max(0, Math.min(1, g));
    color.b = Math.max(0, Math.min(1, b));
    color.a = Math.max(0, Math.min(1, a));
    return color;
  }

  /**
   * Gets the Red component (0-255).
   */
  get R(): number {
    return Math.round(this.r * 255);
  }

  /**
   * Gets the Green component (0-255).
   */
  get G(): number {
    return Math.round(this.g * 255);
  }

  /**
   * Gets the Blue component (0-255).
   */
  get B(): number {
    return Math.round(this.b * 255);
  }

  /**
   * Gets the Alpha component (0-255).
   */
  get A(): number {
    return Math.round(this.a * 255);
  }

  /**
   * Internal: Gets the Red component as a float (0.0 - 1.0).
   * @internal
   */
  get scR(): number {
    return this.r;
  }

  /**
   * Internal: Gets the Green component as a float (0.0 - 1.0).
   * @internal
   */
  get scG(): number {
    return this.g;
  }

  /**
   * Internal: Gets the Blue component as a float (0.0 - 1.0).
   * @internal
   */
  get scB(): number {
    return this.b;
  }

  /**
   * Internal: Gets the Alpha component as a float (0.0 - 1.0).
   * @internal
   */
  get scA(): number {
    return this.a;
  }

  // Basic Colors
  /** Opaque black (`#000000`). */
  static readonly black = new Color(0, 0, 0);
  /** Opaque white (`#ffffff`). */
  static readonly white = new Color(255, 255, 255);
  /** Opaque pure red (`#ff0000`). */
  static readonly red = new Color(255, 0, 0);
  /** Opaque pure blue (`#0000ff`). */
  static readonly blue = new Color(0, 0, 255);
  /** Light grey (`#e5e5e5`). */
  static readonly lightGray = new Color(229, 229, 229);
  /** Dark grey (`#4d4d4d`). */
  static readonly darkGray = new Color(77, 77, 77);

  // Tailwind v4 palette tokens (slate50, red500, …) now live on `ColorPalette`, addressed
  // by shade: `ColorPalette.red[500]`. `Color` is just the RGBA primitive.

  /**
   * Creates a Color from a hex string (e.g., "FF0000" or "#FF0000").
   * Any input that is not a well-formed 3/4/6/8-digit hex value yields
   * {@link Color.black}.
   */
  static fromHex(hex: string): Color {
    if (!hex || hex.trim().length === 0) return Color.black;

    let h = hex.trim().replace(/^#/, '');

    if (h.length === 3 || h.length === 4) {
      h = h
        .split('')
        .map(c => c + c)
        .join('');
    }

    if (h.length !== 6 && h.length !== 8) return Color.black;

    // `parseInt` returns NaN for non-hex digits rather than throwing, so the
    // try/catch below cannot see it. Without this guard a same-length but
    // non-hex string (e.g. "gg0000") produces NaN channels, which reach the
    // content stream as "NaN NaN NaN rg" and corrupt the PDF.
    if (!/^[0-9a-fA-F]+$/.test(h)) return Color.black;

    try {
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      const a = h.length === 8 ? parseInt(h.substring(6, 8), 16) : 255;
      return new Color(r, g, b, a);
    } catch {
      return Color.black;
    }
  }

  /**
   * Creates a new Color with the specified alpha value (0.0 to 1.0).
   * @param alpha - The alpha value (0.0 to 1.0)
   * @returns A new Color with the specified alpha value
   */
  withAlpha(alpha: number): Color {
    return Color.fromScRgb(this.r, this.g, this.b, Math.max(0, Math.min(1, alpha)));
  }

  /**
   * Converts the color to a hex string (e.g. "#FF0000").
   */
  toHexString(): string {
    const r = Math.round(this.r * 255)
      .toString(16)
      .padStart(2, '0');
    const g = Math.round(this.g * 255)
      .toString(16)
      .padStart(2, '0');
    const b = Math.round(this.b * 255)
      .toString(16)
      .padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  /** Returns `true` when `other` has the same red, green, blue and alpha values. */
  equals(other: Color): boolean {
    return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
  }
}
