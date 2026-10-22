import { Thickness } from '../Core/Thickness';
import { Border } from '../Core/Border';
import { BorderColors } from '../Core/BorderColors';
import { Color } from '../Core/Color';
import type { ContentDirection } from '../Configuration/ContentDirection';
import { FontWeight } from '../Typography/FontWeight';
import { StandardFonts } from '../Typography/StandardFonts';
import { TextDecoration } from './Text/TextDecoration';
import { DecorationStyle } from './Text/DecorationStyle';
import { TextAlignment } from './Text/TextAlignment';

// Elements styled alike share one options object. A table of a thousand cells styled alike
// holds one set of options rather than a thousand copies; each element keeps a reference.
//
// Option objects are never changed once shared: an element changes an option by switching to
// another object, so changing one element never affects another. Equal objects are shared
// through a bounded table per type; past the bound, new values are simply not shared. The
// tables hold only option values (sizes, colours, font names), never content.

const capacity = 8192;
// Changes remembered per object: elements built alike make the same changes in the same order,
// so a few answer almost every change without building and comparing a new object.
const remembered = 4;

/** Exact comparison of option values: numbers by Object.is, so -0 and NaN keep their identity. */
function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a === undefined || b === undefined || a === null || b === null) return false;
  if (a instanceof Color) return b instanceof Color && a.equals(b);
  if (a instanceof Thickness || a instanceof Border) {
    const x = a as Thickness,
      y = b as Thickness;
    return (
      a.constructor === b.constructor &&
      Object.is(x.left, y.left) &&
      Object.is(x.top, y.top) &&
      Object.is(x.right, y.right) &&
      Object.is(x.bottom, y.bottom)
    );
  }
  if (a instanceof BorderColors) {
    if (!(b instanceof BorderColors)) return false;
    return (
      sameValue(a.left, b.left) &&
      sameValue(a.top, b.top) &&
      sameValue(a.right, b.right) &&
      sameValue(a.bottom, b.bottom)
    );
  }
  if (typeof a === 'object' && typeof b === 'object') {
    // Feature overrides compare by content: each element holds its own validated copy.
    const x = a as Record<string, unknown>,
      y = b as Record<string, unknown>;
    const keys = Object.keys(x);
    if (keys.length !== Object.keys(y).length) return false;
    for (const key of keys) if (!Object.hasOwn(y, key) || !Object.is(x[key], y[key])) return false;
    return true;
  }
  return false;
}

function hashOf(value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number')
    return Object.is(value, -0) ? 1 : Number.isInteger(value) ? value | 0 : (value * 1000) | 0;
  if (typeof value === 'boolean') return value ? 3 : 2;
  if (typeof value === 'string') {
    let h = value.length;
    for (let i = 0; i < value.length; i += Math.max(1, value.length >> 4)) h = Math.imul(h, 31) + value.charCodeAt(i);
    return h | 0;
  }
  if (value instanceof Color) return value.R * 65536 + value.G * 256 + value.B;
  if (value instanceof Thickness || value instanceof Border) return hashOf(value.left) * 31 + hashOf(value.top);
  return 7;
}

interface Change<T> {
  readonly field: string;
  readonly value: unknown;
  readonly result: T;
}

/** The base of every shared options type: equality over its fields, and change by copy. */
abstract class SharedOptions<Self extends SharedOptions<Self>> {
  private changes: Change<Self>[] | undefined = undefined;

  protected abstract fields(): readonly string[];
  protected abstract table(): Map<number, Self[]>;
  protected abstract copy(): Self;

  /** These options with `field` set to `value`. */
  with<K extends keyof Self & string>(field: K, value: Self[K]): Self {
    const changes = this.changes;
    if (changes !== undefined) {
      for (const change of changes) if (change.field === field && sameValue(change.value, value)) return change.result;
    }
    const next = this.copy();
    (next as Record<string, unknown>)[field] = value;
    (next as unknown as SharedOptions<Self>).changes = undefined;
    const shared = next.shared();
    const kept = changes === undefined ? [] : changes.slice(0, remembered - 1);
    this.changes = [{ field, value, result: shared }, ...kept];
    return shared;
  }

  /** The shared object equal to this one, which becomes shared if there is none and room remains. */
  shared(): Self {
    const self = this as unknown as Self;
    const names = this.fields();
    let hash = 0;
    for (let i = 0; i < Math.min(names.length, 12); i++)
      hash = (Math.imul(hash, 31) + hashOf(this.field(names[i]))) | 0;
    const table = this.table();
    const bucket = table.get(hash);
    if (bucket !== undefined) {
      for (const candidate of bucket) if (this.equals(candidate)) return candidate;
    }
    if (table.size >= capacity) return self;
    if (bucket === undefined) table.set(hash, [self]);
    else bucket.push(self);
    return self;
  }

  private equals(other: Self): boolean {
    for (const name of this.fields()) if (!sameValue(this.field(name), other.field(name))) return false;
    return true;
  }

  private field(name: string): unknown {
    return (this as unknown as Record<string, unknown>)[name];
  }
}

const elementFields = ['margin', 'captureName', 'contentDirection', 'breakAllowed'] as const;
const elementTable = new Map<number, SharedElementOptions[]>();

/** The options every element has: margin, capture name, direction override and break permission. */
export class SharedElementOptions extends SharedOptions<SharedElementOptions> {
  static readonly default = new SharedElementOptions().shared();

  readonly margin: Thickness = new Thickness(0);
  readonly captureName: string | undefined = undefined;
  readonly contentDirection: ContentDirection | undefined = undefined;
  readonly breakAllowed: boolean = true;

  protected fields() {
    return elementFields;
  }
  protected table() {
    return elementTable;
  }
  protected copy() {
    return Object.assign(new SharedElementOptions(), this);
  }
}

const boxFields = ['border', 'borderColors', 'backgroundColor', 'cornerRadius'] as const;
const boxTable = new Map<number, SharedBoxOptions[]>();

/** Border, border colours, background and corner radius of a bordered element. */
export class SharedBoxOptions extends SharedOptions<SharedBoxOptions> {
  static readonly default = new SharedBoxOptions().shared();

  readonly border: Border = new Border(0);
  readonly borderColors: BorderColors = new BorderColors();
  readonly backgroundColor: Color | undefined = undefined;
  readonly cornerRadius: number = 0;

  protected fields() {
    return boxFields;
  }
  protected table() {
    return boxTable;
  }
  protected copy() {
    return Object.assign(new SharedBoxOptions(), this);
  }
}

const cellFields = ['color', 'padding', 'minHeight', 'backgroundColor'] as const;
const cellTable = new Map<number, SharedCellOptions[]>();

/** The text colour and padding a table cell or row sets for its content (and a row's height and background). */
export class SharedCellOptions extends SharedOptions<SharedCellOptions> {
  static readonly default = new SharedCellOptions().shared();

  readonly color: Color | undefined = undefined;
  readonly padding: Thickness | undefined = undefined;
  readonly minHeight: number | undefined = undefined;
  readonly backgroundColor: Color | undefined = undefined;

  protected fields() {
    return cellFields;
  }
  protected table() {
    return cellTable;
  }
  protected copy() {
    return Object.assign(new SharedCellOptions(), this);
  }
}

// The most distinguishing fields first: the hash reads the first twelve.
const textFields = [
  'fontName',
  'fontSize',
  'textColor',
  'fontFamily',
  'alignment',
  'lineHeight',
  'fontWeight',
  'italic',
  'fontExplicit',
  'fontFamilyExplicit',
  'fontWeightExplicit',
  'italicExplicit',
  'fontSizeExplicit',
  'textColorExplicit',
  'lineHeightExplicit',
  'textDecorationExplicit',
  'alignmentExplicit',
  'textDecoration',
  'letterSpacing',
  'fontFeatures',
  'decorationColor',
  'decorationThickness',
  'decorationStyle',
  'wordSpacing',
  'maxLines',
  'ellipsis',
  'firstLineIndent',
  'paragraphSpacing',
  'preserveWhitespace',
  'minLinesBeforeBreak',
  'minLinesAfterBreak',
] as const;
const textTable = new Map<number, SharedTextOptions[]>();

/**
 * The text style and text-block options of a text element. Undefined cascade fields (size,
 * colour, line height, decoration) mean the value was not set, so the document's default text
 * style may fill them in.
 */
export class SharedTextOptions extends SharedOptions<SharedTextOptions> {
  static readonly default = new SharedTextOptions().shared();

  readonly fontFeatures: Readonly<Record<string, number>> | undefined = undefined;
  readonly fontFamily: string | undefined = undefined;
  readonly fontWeight: FontWeight = FontWeight.Normal;
  readonly italic: boolean = false;
  readonly fontName: string = StandardFonts.Helvetica;
  readonly fontExplicit: boolean = false;
  readonly fontFamilyExplicit: boolean = false;
  readonly fontWeightExplicit: boolean = false;
  readonly italicExplicit: boolean = false;
  readonly fontSizeExplicit: boolean = false;
  readonly textColorExplicit: boolean = false;
  readonly lineHeightExplicit: boolean = false;
  readonly textDecorationExplicit: boolean = false;
  readonly fontSize: number | undefined = undefined;
  readonly textColor: Color | undefined = undefined;
  readonly lineHeight: number | undefined = undefined;
  readonly textDecoration: TextDecoration | undefined = undefined;
  readonly decorationColor: Color | undefined = undefined;
  readonly decorationThickness: number | undefined = undefined;
  readonly decorationStyle: DecorationStyle = DecorationStyle.Solid;
  readonly letterSpacing: number = 0;
  readonly wordSpacing: number = 0;

  // TextBlock options.
  readonly alignment: TextAlignment = TextAlignment.Left;
  readonly alignmentExplicit: boolean = false;
  readonly maxLines: number | undefined = undefined;
  readonly ellipsis: string = '…';
  readonly firstLineIndent: number = 0;
  readonly paragraphSpacing: number = 0;
  readonly preserveWhitespace: boolean = false;
  readonly minLinesBeforeBreak: number = 2;
  readonly minLinesAfterBreak: number = 2;

  protected fields() {
    return textFields;
  }
  protected table() {
    return textTable;
  }
  protected copy() {
    return Object.assign(new SharedTextOptions(), this);
  }
}
