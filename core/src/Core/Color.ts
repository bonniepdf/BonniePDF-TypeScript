/**
 * Represents an RGB color with values ranging from 0 to 255.
 * Internally stores values as floats (0.0 to 1.0) for high-precision PDF operations.
 */
export class Color {
  private readonly r: number;
  private readonly g: number;
  private readonly b: number;
  private readonly a: number;

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
    (color as any).r = Math.max(0, Math.min(1, r));
    (color as any).g = Math.max(0, Math.min(1, g));
    (color as any).b = Math.max(0, Math.min(1, b));
    (color as any).a = Math.max(0, Math.min(1, a));
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
  static readonly black = new Color(0, 0, 0);
  static readonly white = new Color(255, 255, 255);
  static readonly red = new Color(255, 0, 0);
  static readonly blue = new Color(0, 0, 255);
  static readonly lightGray = new Color(229, 229, 229);
  static readonly darkGray = new Color(77, 77, 77);

  // --- Tailwind v4 Colors ---

  // Slate
  static readonly slate50 = Color.fromHex('f8fafc');
  static readonly slate100 = Color.fromHex('f1f5f9');
  static readonly slate200 = Color.fromHex('e2e8f0');
  static readonly slate300 = Color.fromHex('cad5e2');
  static readonly slate400 = Color.fromHex('90a1b9');
  static readonly slate500 = Color.fromHex('62748e');
  static readonly slate600 = Color.fromHex('45556c');
  static readonly slate700 = Color.fromHex('314158');
  static readonly slate800 = Color.fromHex('1d293d');
  static readonly slate900 = Color.fromHex('0f172b');
  static readonly slate950 = Color.fromHex('020618');

  // Gray
  static readonly gray50 = Color.fromHex('f9fafb');
  static readonly gray100 = Color.fromHex('f3f4f6');
  static readonly gray200 = Color.fromHex('e5e7eb');
  static readonly gray300 = Color.fromHex('d1d5dc');
  static readonly gray400 = Color.fromHex('99a1af');
  static readonly gray500 = Color.fromHex('6a7282');
  static readonly gray600 = Color.fromHex('4a5565');
  static readonly gray700 = Color.fromHex('364153');
  static readonly gray800 = Color.fromHex('1e2939');
  static readonly gray900 = Color.fromHex('101828');
  static readonly gray950 = Color.fromHex('030712');

  // Zinc
  static readonly zinc50 = Color.fromHex('fafafa');
  static readonly zinc100 = Color.fromHex('f4f4f5');
  static readonly zinc200 = Color.fromHex('e4e4e7');
  static readonly zinc300 = Color.fromHex('d4d4d8');
  static readonly zinc400 = Color.fromHex('9f9fa9');
  static readonly zinc500 = Color.fromHex('71717b');
  static readonly zinc600 = Color.fromHex('52525c');
  static readonly zinc700 = Color.fromHex('3f3f46');
  static readonly zinc800 = Color.fromHex('27272a');
  static readonly zinc900 = Color.fromHex('18181b');
  static readonly zinc950 = Color.fromHex('09090b');

  // Neutral
  static readonly neutral50 = Color.fromHex('fafafa');
  static readonly neutral100 = Color.fromHex('f5f5f5');
  static readonly neutral200 = Color.fromHex('e5e5e5');
  static readonly neutral300 = Color.fromHex('d4d4d4');
  static readonly neutral400 = Color.fromHex('a1a1a1');
  static readonly neutral500 = Color.fromHex('737373');
  static readonly neutral600 = Color.fromHex('525252');
  static readonly neutral700 = Color.fromHex('404040');
  static readonly neutral800 = Color.fromHex('262626');
  static readonly neutral900 = Color.fromHex('171717');
  static readonly neutral950 = Color.fromHex('0a0a0a');

  // Stone
  static readonly stone50 = Color.fromHex('fafaf9');
  static readonly stone100 = Color.fromHex('f5f5f4');
  static readonly stone200 = Color.fromHex('e7e5e4');
  static readonly stone300 = Color.fromHex('d6d3d1');
  static readonly stone400 = Color.fromHex('a6a09b');
  static readonly stone500 = Color.fromHex('79716b');
  static readonly stone600 = Color.fromHex('57534d');
  static readonly stone700 = Color.fromHex('44403b');
  static readonly stone800 = Color.fromHex('292524');
  static readonly stone900 = Color.fromHex('1c1917');
  static readonly stone950 = Color.fromHex('0c0a09');

  // Red
  static readonly red50 = Color.fromHex('fef2f2');
  static readonly red100 = Color.fromHex('ffe2e2');
  static readonly red200 = Color.fromHex('ffc9c9');
  static readonly red300 = Color.fromHex('ffa2a2');
  static readonly red400 = Color.fromHex('ff6467');
  static readonly red500 = Color.fromHex('fb2c36');
  static readonly red600 = Color.fromHex('e7000b');
  static readonly red700 = Color.fromHex('c10007');
  static readonly red800 = Color.fromHex('9f0712');
  static readonly red900 = Color.fromHex('82181a');
  static readonly red950 = Color.fromHex('460809');

  // Orange
  static readonly orange50 = Color.fromHex('fff7ed');
  static readonly orange100 = Color.fromHex('ffedd4');
  static readonly orange200 = Color.fromHex('ffd6a7');
  static readonly orange300 = Color.fromHex('ffb86a');
  static readonly orange400 = Color.fromHex('ff8904');
  static readonly orange500 = Color.fromHex('ff6900');
  static readonly orange600 = Color.fromHex('f54900');
  static readonly orange700 = Color.fromHex('ca3500');
  static readonly orange800 = Color.fromHex('9f2d00');
  static readonly orange900 = Color.fromHex('7e2a0c');
  static readonly orange950 = Color.fromHex('441306');

  // Amber
  static readonly amber50 = Color.fromHex('fffbeb');
  static readonly amber100 = Color.fromHex('fef3c6');
  static readonly amber200 = Color.fromHex('fee685');
  static readonly amber300 = Color.fromHex('ffd230');
  static readonly amber400 = Color.fromHex('ffb900');
  static readonly amber500 = Color.fromHex('fe9a00');
  static readonly amber600 = Color.fromHex('e17100');
  static readonly amber700 = Color.fromHex('bb4d00');
  static readonly amber800 = Color.fromHex('973c00');
  static readonly amber900 = Color.fromHex('7b3306');
  static readonly amber950 = Color.fromHex('461901');

  // Yellow
  static readonly yellow50 = Color.fromHex('fefce8');
  static readonly yellow100 = Color.fromHex('fef9c2');
  static readonly yellow200 = Color.fromHex('fff085');
  static readonly yellow300 = Color.fromHex('ffdf20');
  static readonly yellow400 = Color.fromHex('fdc700');
  static readonly yellow500 = Color.fromHex('f0b100');
  static readonly yellow600 = Color.fromHex('d08700');
  static readonly yellow700 = Color.fromHex('a65f00');
  static readonly yellow800 = Color.fromHex('894b00');
  static readonly yellow900 = Color.fromHex('733e0a');
  static readonly yellow950 = Color.fromHex('432004');

  // Lime
  static readonly lime50 = Color.fromHex('f7fee7');
  static readonly lime100 = Color.fromHex('ecfcca');
  static readonly lime200 = Color.fromHex('d8f999');
  static readonly lime300 = Color.fromHex('bbf451');
  static readonly lime400 = Color.fromHex('9ae600');
  static readonly lime500 = Color.fromHex('7ccf00');
  static readonly lime600 = Color.fromHex('5ea500');
  static readonly lime700 = Color.fromHex('497d00');
  static readonly lime800 = Color.fromHex('3c6300');
  static readonly lime900 = Color.fromHex('35530e');
  static readonly lime950 = Color.fromHex('192e03');

  // Green
  static readonly green50 = Color.fromHex('f0fdf4');
  static readonly green100 = Color.fromHex('dcfce7');
  static readonly green200 = Color.fromHex('b9f8cf');
  static readonly green300 = Color.fromHex('7bf1a8');
  static readonly green400 = Color.fromHex('05df72');
  static readonly green500 = Color.fromHex('00c950');
  static readonly green600 = Color.fromHex('00a63e');
  static readonly green700 = Color.fromHex('008236');
  static readonly green800 = Color.fromHex('016630');
  static readonly green900 = Color.fromHex('0d542b');
  static readonly green950 = Color.fromHex('032e15');

  // Emerald
  static readonly emerald50 = Color.fromHex('ecfdf5');
  static readonly emerald100 = Color.fromHex('d0fae5');
  static readonly emerald200 = Color.fromHex('a4f4cf');
  static readonly emerald300 = Color.fromHex('5ee9b5');
  static readonly emerald400 = Color.fromHex('00d492');
  static readonly emerald500 = Color.fromHex('00bc7d');
  static readonly emerald600 = Color.fromHex('009966');
  static readonly emerald700 = Color.fromHex('007a55');
  static readonly emerald800 = Color.fromHex('006045');
  static readonly emerald900 = Color.fromHex('004f3b');
  static readonly emerald950 = Color.fromHex('002c22');

  // Teal
  static readonly teal50 = Color.fromHex('f0fdfa');
  static readonly teal100 = Color.fromHex('cbfbf1');
  static readonly teal200 = Color.fromHex('96f7e4');
  static readonly teal300 = Color.fromHex('46ecd5');
  static readonly teal400 = Color.fromHex('00d5be');
  static readonly teal500 = Color.fromHex('00bba7');
  static readonly teal600 = Color.fromHex('009689');
  static readonly teal700 = Color.fromHex('00786f');
  static readonly teal800 = Color.fromHex('005f5a');
  static readonly teal900 = Color.fromHex('0b4f4a');
  static readonly teal950 = Color.fromHex('022f2e');

  // Cyan
  static readonly cyan50 = Color.fromHex('ecfeff');
  static readonly cyan100 = Color.fromHex('cefafe');
  static readonly cyan200 = Color.fromHex('a2f4fd');
  static readonly cyan300 = Color.fromHex('53eafd');
  static readonly cyan400 = Color.fromHex('00d3f2');
  static readonly cyan500 = Color.fromHex('00b8db');
  static readonly cyan600 = Color.fromHex('0092b8');
  static readonly cyan700 = Color.fromHex('007595');
  static readonly cyan800 = Color.fromHex('005f78');
  static readonly cyan900 = Color.fromHex('104e64');
  static readonly cyan950 = Color.fromHex('053345');

  // Sky
  static readonly sky50 = Color.fromHex('f0f9ff');
  static readonly sky100 = Color.fromHex('dff2fe');
  static readonly sky200 = Color.fromHex('b8e6fe');
  static readonly sky300 = Color.fromHex('74d4ff');
  static readonly sky400 = Color.fromHex('00bcff');
  static readonly sky500 = Color.fromHex('00a6f4');
  static readonly sky600 = Color.fromHex('0084d1');
  static readonly sky700 = Color.fromHex('0069a8');
  static readonly sky800 = Color.fromHex('00598a');
  static readonly sky900 = Color.fromHex('024a70');
  static readonly sky950 = Color.fromHex('052f4a');

  // Blue
  static readonly blue50 = Color.fromHex('eff6ff');
  static readonly blue100 = Color.fromHex('dbeafe');
  static readonly blue200 = Color.fromHex('bedbff');
  static readonly blue300 = Color.fromHex('8ec5ff');
  static readonly blue400 = Color.fromHex('51a2ff');
  static readonly blue500 = Color.fromHex('2b7fff');
  static readonly blue600 = Color.fromHex('155dfc');
  static readonly blue700 = Color.fromHex('1447e6');
  static readonly blue800 = Color.fromHex('193cb8');
  static readonly blue900 = Color.fromHex('1c398e');
  static readonly blue950 = Color.fromHex('162456');

  // Indigo
  static readonly indigo50 = Color.fromHex('eef2ff');
  static readonly indigo100 = Color.fromHex('e0e7ff');
  static readonly indigo200 = Color.fromHex('c6d2ff');
  static readonly indigo300 = Color.fromHex('a3b3ff');
  static readonly indigo400 = Color.fromHex('7c86ff');
  static readonly indigo500 = Color.fromHex('615fff');
  static readonly indigo600 = Color.fromHex('4f39f6');
  static readonly indigo700 = Color.fromHex('432dd7');
  static readonly indigo800 = Color.fromHex('372aac');
  static readonly indigo900 = Color.fromHex('312c85');
  static readonly indigo950 = Color.fromHex('1e1a4d');

  // Violet
  static readonly violet50 = Color.fromHex('f5f3ff');
  static readonly violet100 = Color.fromHex('ede9fe');
  static readonly violet200 = Color.fromHex('ddd6ff');
  static readonly violet300 = Color.fromHex('c4b4ff');
  static readonly violet400 = Color.fromHex('a684ff');
  static readonly violet500 = Color.fromHex('8e51ff');
  static readonly violet600 = Color.fromHex('7f22fe');
  static readonly violet700 = Color.fromHex('7008e7');
  static readonly violet800 = Color.fromHex('5d0ec0');
  static readonly violet900 = Color.fromHex('4d179a');
  static readonly violet950 = Color.fromHex('2f0d68');

  // Purple
  static readonly purple50 = Color.fromHex('faf5ff');
  static readonly purple100 = Color.fromHex('f3e8ff');
  static readonly purple200 = Color.fromHex('e9d4ff');
  static readonly purple300 = Color.fromHex('dab2ff');
  static readonly purple400 = Color.fromHex('c27aff');
  static readonly purple500 = Color.fromHex('ad46ff');
  static readonly purple600 = Color.fromHex('9810fa');
  static readonly purple700 = Color.fromHex('8200db');
  static readonly purple800 = Color.fromHex('6e11b0');
  static readonly purple900 = Color.fromHex('59168b');
  static readonly purple950 = Color.fromHex('3c0366');

  // Fuchsia
  static readonly fuchsia50 = Color.fromHex('fdf4ff');
  static readonly fuchsia100 = Color.fromHex('fae8ff');
  static readonly fuchsia200 = Color.fromHex('f6cfff');
  static readonly fuchsia300 = Color.fromHex('f4a8ff');
  static readonly fuchsia400 = Color.fromHex('ed6aff');
  static readonly fuchsia500 = Color.fromHex('e12afb');
  static readonly fuchsia600 = Color.fromHex('c800de');
  static readonly fuchsia700 = Color.fromHex('a800b7');
  static readonly fuchsia800 = Color.fromHex('8a0194');
  static readonly fuchsia900 = Color.fromHex('721378');
  static readonly fuchsia950 = Color.fromHex('4b004f');

  // Pink
  static readonly pink50 = Color.fromHex('fdf2f8');
  static readonly pink100 = Color.fromHex('fce7f3');
  static readonly pink200 = Color.fromHex('fccee8');
  static readonly pink300 = Color.fromHex('fda5d5');
  static readonly pink400 = Color.fromHex('fb64b6');
  static readonly pink500 = Color.fromHex('f6339a');
  static readonly pink600 = Color.fromHex('e60076');
  static readonly pink700 = Color.fromHex('c6005c');
  static readonly pink800 = Color.fromHex('a3004c');
  static readonly pink900 = Color.fromHex('861043');
  static readonly pink950 = Color.fromHex('510424');

  // Rose
  static readonly rose50 = Color.fromHex('fff1f2');
  static readonly rose100 = Color.fromHex('ffe4e6');
  static readonly rose200 = Color.fromHex('ffccd3');
  static readonly rose300 = Color.fromHex('ffa1ad');
  static readonly rose400 = Color.fromHex('ff637e');
  static readonly rose500 = Color.fromHex('ff2056');
  static readonly rose600 = Color.fromHex('ec003f');
  static readonly rose700 = Color.fromHex('c70036');
  static readonly rose800 = Color.fromHex('a50036');
  static readonly rose900 = Color.fromHex('8b0836');
  static readonly rose950 = Color.fromHex('4d0218');

  /**
   * Creates a Color from a hex string (e.g., "FF0000" or "#FF0000")
   */
  static fromHex(hex: string): Color {
    if (!hex || hex.trim().length === 0) return Color.black;

    let h = hex.trim().replace(/^#/, '');

    if (h.length === 3 || h.length === 4) {
      h = h.split('').map(c => c + c).join('');
    }

    if (h.length !== 6 && h.length !== 8) return Color.black;

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
    const r = Math.round(this.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(this.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(this.b * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  equals(other: Color): boolean {
    return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
  }
}
