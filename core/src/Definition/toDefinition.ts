import type { Document } from '../Document';
import { getPageTemplateElements, PAGE_TEMPLATE_ELEMENT_KEYS, type PageTemplate } from '../Configuration/PageTemplate';
import { DocumentSettings } from '../Configuration/DocumentSettings';
import { DocumentMetadata, isBuiltInMetadataDate } from '../Configuration/DocumentMetadata';
import { Watermark } from '../Configuration/Watermark';
import { PageLabel } from '../Configuration/PageLabel';
import { PdfVersion } from '../Configuration/PdfVersion';
import { PdfSize } from '../Configuration/PdfSize';
import { EncryptionAlgorithm } from '../Security/Models/EncryptionAlgorithm';
import { PdfPermissions } from '../Security/Permissions/PdfPermissions';
import { AttachmentRelationship } from '../Attachments/AttachmentRelationship';
import { SemanticRole } from '../Rendering/Tagging/SemanticRole';
import { BarcodeSymbology } from '../Elements/Shapes/BarcodeSymbology';
import { LineOrientation } from '../Elements/Shapes/Line';
import { ChartOrientation } from '../Charts/ChartOrientation';
import { QrEcc } from '../Elements/Shapes/QrEcc';
import { TextAlignment } from '../Elements/Text/TextAlignment';
import { TextDecoration } from '../Elements/Text/TextDecoration';
import { DecorationStyle } from '../Elements/Text/DecorationStyle';
import { BaselineAlignment } from '../Elements/Text/BaselineAlignment';
import { FontWeight } from '../Typography/FontWeight';
import { FontFamilyResolver } from '../Typography/FontFamilyResolver';
import { StandardFonts } from '../Typography/StandardFonts';
import { HorizontalAlignment } from '../Core/HorizontalAlignment';
import { VerticalAlignment } from '../Core/VerticalAlignment';
import { PageOrientation } from '../Core/PageOrientation';
import { ImageFitMode } from '../Elements/Media/ImageFitMode';
import { PdfAConformance } from '../Configuration/PdfAConformance';
import { AccessibilityMode } from '../Configuration/AccessibilityMode';
import { ZoomLevel } from '../Configuration/ZoomLevel';
import { PageModeEnum } from '../Configuration/PageMode';
import { WidthDistribution } from '../Elements/Layout/WidthDistribution';
import { BulletStyle } from '../Elements/Lists/BulletStyle';
import { NumberFormat } from '../Elements/Lists/NumberFormat';
import { Color } from '../Core/Color';
import { toColor } from '../Normalize/toColor';
import { ColorPalette } from '../Core/ColorPalette';
import { Border } from '../Core/Border';
import { BorderColors } from '../Core/BorderColors';
import { Thickness } from '../Core/Thickness';
import { debugSourceOf } from '../Rendering/DebugSource';
import { toPageSize } from '../Normalize/toPageSize';
import { getPlatformIO } from '../Platform/PlatformIO';
import type { IElement } from '../Elements/IElement';
import { Flip } from '../Elements/Layout/Flip';
import { Translate } from '../Elements/Layout/Translate';
import { Rotate } from '../Elements/Layout/Rotate';
import { Container } from '../Elements/Layout/Container';
import { VerticalStack } from '../Elements/Layout/VerticalStack';
import { HorizontalStack } from '../Elements/Layout/HorizontalStack';
import { Layers } from '../Elements/Layout/Layers';
import { Spacer } from '../Elements/Layout/Spacer';
import { PageBreak } from '../Elements/Layout/PageBreak';
import { SemanticGroup } from '../Elements/Layout/SemanticGroup';
import { EnsureSpace } from '../Elements/Layout/Pagination/EnsureSpace';
import { PreventPageBreak } from '../Elements/Layout/Pagination/PreventPageBreak';
import { ShowEntire } from '../Elements/Layout/Pagination/ShowEntire';
import { StopPaging } from '../Elements/Layout/Pagination/StopPaging';
import { ShowIf, ShowOnce, SkipOnce } from '../Elements/Layout/Pagination/ShowIf';
import { Unconstrained } from '../Elements/Layout/Pagination/Unconstrained';
import { TextBlock } from '../Elements/Text/TextBlock';
import { Heading } from '../Elements/Text/Heading';
import { RichText } from '../Elements/Text/RichText';
import { PageNumberOf } from '../Elements/Text/PageNumberOf';
import { VisualToc } from '../Elements/Text/VisualToc';
import { Section } from '../Elements/Text/Section';
import { TextStyle } from '../Elements/Text/TextStyle';
import { TextElementBase } from '../Elements/Text/TextElementBase';
import { Hyperlink } from '../Core/Hyperlink';
import { SectionLink } from '../Core/SectionLink';
import { UnorderedList } from '../Elements/Lists/UnorderedList';
import { OrderedList } from '../Elements/Lists/OrderedList';
import { Table } from '../Elements/Tables/Table';
import { Grid } from '../Elements/Tables/Grid';
import { TableRow } from '../Elements/Tables/TableRow';
import { TableCell } from '../Elements/Tables/TableCell';
import { Image } from '../Elements/Media/Image';
import { Svg } from '../Elements/Media/Svg';
import { Line } from '../Elements/Shapes/Line';
import { Circle } from '../Elements/Shapes/Circle';
import { Ellipse } from '../Elements/Shapes/Ellipse';
import { QRCode } from '../Elements/Shapes/QRCode';
import { Barcode } from '../Elements/Shapes/Barcode';
import { DataMatrix } from '../Elements/Shapes/DataMatrix';
import { BarChart } from '../Charts/BarChart';
import { GroupedBarChart } from '../Charts/GroupedBarChart';
import { LineChart } from '../Charts/LineChart';
import { AreaChart } from '../Charts/AreaChart';
import { DotPlotChart } from '../Charts/DotPlotChart';
import { LollipopChart } from '../Charts/LollipopChart';
import { PieChart } from '../Charts/PieChart';
import { ChartBase } from '../Charts/ChartBase';
import { CartesianChartBase } from '../Charts/CartesianChartBase';
import { AxisOptions } from '../Charts/Models/AxisOptions';
import { ChartSeries, ChartSeriesStyle } from '../Charts/Models/ChartSeries';
import { ChartDataPoint } from '../Charts/Models/ChartDataPoint';
import { ELEMENT_DESCRIPTION } from './ElementDescription';
import type { KeySpec, ShapeSpec } from './ElementDescriptionTypes';
import type { DefinitionIssue, DocumentDefinition } from './DefinitionTypes';
import { DEFINITION_VERSIONS } from './DefinitionTypes';
import { DefinitionError } from './fromDefinition';
import { validateDefinition } from './validateDefinition';
import {
  alignmentExplicit,
  bulletColorSet,
  explicitText,
  fontChosenByFamily,
  listItems,
  richTextSpans,
  stackWeights,
  tableColumns,
  tableSections,
} from './internals';

const D = ELEMENT_DESCRIPTION;

type Obj = Record<string, unknown>;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

// ── options and result ──────────────────────────────────────────────────────

/** What the host is told about a resource so it can decide whether it can name it. */
export interface DefinitionResourceDescriptor {
  kind: 'image' | 'font' | 'svg' | 'attachment';
  mediaType: string;
  bytes: Uint8Array;
}

/** Options for writing a document as a definition. */
export interface DefinitionWriteOptions {
  /**
   * What to do with a construct a definition cannot express (spec 15 §11.2). `'error'` (the default)
   * throws a {@link DefinitionError} listing all of them and writes nothing; `'drop'` leaves each out
   * and reports a `dropped` note, after which the result is not a faithful copy.
   */
  onUnrepresentable?: 'error' | 'drop';
  /** Always carry resource bytes in the definition (`data`), even where `resourceRef` would name them. */
  embedResources?: boolean;
  /**
   * Names a resource the host can supply again when the definition is read. Return a name and the
   * definition carries `ref` and a `sha256` instead of the bytes; return `undefined` to embed them. The
   * writer never invents a name (spec 15 §9).
   */
  resourceRef?: (resource: DefinitionResourceDescriptor) => string | undefined | Promise<string | undefined>;
  /** Write a palette token (`slate-800`) where a colour equals a palette entry exactly, instead of hex. */
  writePaletteTokens?: boolean;
  /** The definition version to write, `"1.0"`. Anything this release cannot write is refused. */
  target?: string;
}

/** A definition and what the writer had to say about it. */
export interface DefinitionWriteResult {
  definition: DocumentDefinition;
  /** `secret-omitted` and `dropped` notes (spec 15 §11.4). */
  notes: DefinitionIssue[];
}

// ── element classes ─────────────────────────────────────────────────────────

type Ctor = abstract new (...args: never[]) => unknown;

/** Catalogue name for each element class, matched exactly: a subclass is custom behaviour. */
const TYPE_BY_CLASS = new Map<Ctor, string>([
  [Flip, 'Flip'],
  [Translate, 'Translate'],
  [Rotate, 'Rotate'],
  [Container, 'Container'],
  [VerticalStack, 'VerticalStack'],
  [HorizontalStack, 'HorizontalStack'],
  [Layers, 'Layers'],
  [Spacer, 'Spacer'],
  [PageBreak, 'PageBreak'],
  [SemanticGroup, 'SemanticGroup'],
  [EnsureSpace, 'EnsureSpace'],
  [PreventPageBreak, 'PreventPageBreak'],
  [ShowEntire, 'ShowEntire'],
  [StopPaging, 'StopPaging'],
  [ShowOnce, 'ShowOnce'],
  [SkipOnce, 'SkipOnce'],
  [Unconstrained, 'Unconstrained'],
  [ShowIf, 'ShowIf'],
  [TextBlock, 'TextBlock'],
  [Heading, 'Heading'],
  [RichText, 'RichText'],
  [PageNumberOf, 'PageNumberOf'],
  [VisualToc, 'VisualToc'],
  [Hyperlink, 'Hyperlink'],
  [SectionLink, 'SectionLink'],
  [Section, 'Section'],
  [UnorderedList, 'UnorderedList'],
  [OrderedList, 'OrderedList'],
  [Table, 'Table'],
  [Grid, 'Grid'],
  [Image, 'Image'],
  [Svg, 'Svg'],
  [Line, 'Line'],
  [Circle, 'Circle'],
  [Ellipse, 'Ellipse'],
  [QRCode, 'QRCode'],
  [Barcode, 'Barcode'],
  [DataMatrix, 'DataMatrix'],
  [BarChart, 'BarChart'],
  [GroupedBarChart, 'GroupedBarChart'],
  [LineChart, 'LineChart'],
  [AreaChart, 'AreaChart'],
  [DotPlotChart, 'DotPlotChart'],
  [LollipopChart, 'LollipopChart'],
  [PieChart, 'PieChart'],
]);

/** A fresh element of each type, for its defaults (`spec 15 §3.3`: a value equal to the default is left out). */
const BLANK: Record<string, () => unknown> = {
  Flip: () => new Flip(),
  Translate: () => new Translate(),
  Rotate: () => new Rotate(),
  Container: () => new Container(),
  VerticalStack: () => new VerticalStack(),
  HorizontalStack: () => new HorizontalStack(),
  Layers: () => new Layers(),
  Spacer: () => new Spacer(),
  PageBreak: () => new PageBreak(),
  SemanticGroup: () => new SemanticGroup(SemanticRole.Div),
  EnsureSpace: () => new EnsureSpace(),
  PreventPageBreak: () => new PreventPageBreak(),
  ShowEntire: () => new ShowEntire(),
  StopPaging: () => new StopPaging(),
  ShowOnce: () => new ShowOnce(),
  SkipOnce: () => new SkipOnce(),
  Unconstrained: () => new Unconstrained(),
  ShowIf: () => new ShowIf(),
  TextBlock: () => new TextBlock(),
  Heading: () => new Heading(),
  RichText: () => new RichText(),
  PageNumberOf: () => new PageNumberOf('a'),
  VisualToc: () => new VisualToc(),
  Hyperlink: () => new Hyperlink('a', 'a'),
  SectionLink: () => new SectionLink('a', 'a'),
  Section: () => new Section('a'),
  UnorderedList: () => new UnorderedList(),
  OrderedList: () => new OrderedList(),
  Table: () => new Table(),
  Grid: () => new Grid(),
  Image: () => new Image(),
  Svg: () => new Svg(),
  Line: () => new Line(),
  Circle: () => new Circle(),
  Ellipse: () => new Ellipse(),
  QRCode: () => new QRCode(),
  Barcode: () => new Barcode(),
  DataMatrix: () => new DataMatrix(),
  BarChart: () => new BarChart(),
  GroupedBarChart: () => new GroupedBarChart(),
  LineChart: () => new LineChart(),
  AreaChart: () => new AreaChart(),
  DotPlotChart: () => new DotPlotChart(),
  LollipopChart: () => new LollipopChart(),
  PieChart: () => new PieChart(),
};

const blankCache = new Map<string, unknown>();
function blankOf(type: string): Obj {
  let blank = blankCache.get(type);
  if (blank === undefined) {
    blank = BLANK[type]();
    blankCache.set(type, blank);
  }
  return blank as Obj;
}

/** Fresh instances of the nested value classes, for their defaults. */
const SHAPE_BLANK: Record<string, () => unknown> = {
  TextStyle: () => new TextStyle(),
  BorderColors: () => new BorderColors(),
  Axis: () => new AxisOptions(),
  SeriesStyle: () => new ChartSeriesStyle(),
  DataPoint: () => new ChartDataPoint(),
  Series: () => new ChartSeries(),
  Watermark: () => new Watermark(''),
  PageLabel: () => new PageLabel(),
};

// ── tokens ──────────────────────────────────────────────────────────────────

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Enumerations the code API stores as its own enum type and takes tokens for. */
const OPTION_ENUMS: Record<string, unknown> = {
  TextAlignment,
  HorizontalAlignment,
  VerticalAlignment,
  PageOrientation,
  ImageFitMode,
  PdfAConformance,
  AccessibilityMode,
  ZoomLevel,
  PageMode: PageModeEnum,
  WidthDistribution,
  BulletStyle,
  NumberFormat,
  BaselineAlignment,
  DecorationStyle,
};

/** Enumerations the description maps to members of a named enum (`via: 'member'`). */
const MEMBER_ENUMS: Record<string, unknown> = {
  PdfVersion,
  EncryptionAlgorithm,
  AttachmentRelationship,
  BarcodeSymbology,
  LineOrientation,
  ChartOrientation,
  SemanticRole,
};

const QR_ECC: Record<string, unknown> = {
  low: QrEcc.Low,
  medium: QrEcc.Medium,
  quartile: QrEcc.Quartile,
  high: QrEcc.High,
};

const WEIGHT_TOKENS: Record<number, string> = {
  [FontWeight.Thin]: 'thin',
  [FontWeight.ExtraLight]: 'extra-light',
  [FontWeight.Light]: 'light',
  [FontWeight.Normal]: 'normal',
  [FontWeight.Medium]: 'medium',
  [FontWeight.SemiBold]: 'semi-bold',
  [FontWeight.Bold]: 'bold',
  [FontWeight.ExtraBold]: 'extra-bold',
  [FontWeight.Black]: 'black',
};

/** The token for a stored enum value, or `undefined` when the value has none. */
function enumToken(name: string, value: unknown): string | undefined {
  const spec = D.enums[name];
  if (spec.tokens.includes(value as string)) return value as string;
  if (spec.via === 'member') {
    if (name === 'QrEcc') return undefined;
    const target = MEMBER_ENUMS[spec.type!];
    for (const token of spec.tokens) {
      const member = spec.members![token];
      if (target ? (target as Obj)[member] === value : member === value) return token;
    }
    return undefined;
  }
  if (name === 'QrEcc') return Object.keys(QR_ECC).find(t => QR_ECC[t] === value);
  const enumObject = OPTION_ENUMS[name] as Obj | undefined;
  if (!enumObject) return undefined;
  const memberName = Object.keys(enumObject).find(k => isNaN(Number(k)) && enumObject[k] === value);
  if (memberName === undefined) return undefined;
  const byName = spec.tokens.find(t => norm(t) === norm(memberName));
  if (byName) return byName;
  const mapped = spec.dotnet?.members;
  return mapped ? spec.tokens.find(t => mapped[t] === memberName) : undefined;
}

// ── colours ─────────────────────────────────────────────────────────────────

let paletteByHex: Map<string, string> | undefined;
function paletteToken(hex: string): string | undefined {
  if (!paletteByHex) {
    paletteByHex = new Map();
    const families = new Set(D.palette.families);
    for (const [family, ramp] of Object.entries(ColorPalette)) {
      if (!families.has(family)) continue;
      for (const shade of D.palette.shades) {
        const color = (ramp as unknown as Record<number, Color>)[shade];
        if (color && !paletteByHex.has(color.toHexString()))
          paletteByHex.set(color.toHexString(), `${family}-${shade}`);
      }
    }
  }
  return paletteByHex.get(hex);
}

const hex2 = (n: number): string => n.toString(16).padStart(2, '0');

// ── the writer ──────────────────────────────────────────────────────────────

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const escapeKey = (k: string): string => k.replace(/~/g, '~0').replace(/\//g, '~1');

function keysOf(spec: ShapeSpec): Record<string, KeySpec> {
  const merged: Record<string, KeySpec> = {};
  for (const use of spec.uses ?? []) Object.assign(merged, D.mixins[use]);
  return Object.assign(merged, spec.keys);
}

interface ResourceEntry {
  name: string;
  kind: DefinitionResourceDescriptor['kind'];
  mediaType: string;
  bytes: Uint8Array;
  body: Obj;
}

class Writer {
  readonly notes: DefinitionIssue[] = [];
  /** Constructs a definition cannot express; thrown together at the end unless dropping. */
  readonly unrepresentable: DefinitionIssue[] = [];
  private readonly resources: ResourceEntry[] = [];
  private readonly counters: Record<string, number> = {};
  private readonly usedIds = new Set<string>();
  private readonly drop: boolean;

  constructor(
    private readonly doc: Document,
    private readonly options: DefinitionWriteOptions
  ) {
    this.drop = options.onUnrepresentable === 'drop';
  }

  // ── problems ──────────────────────────────────────────────────────────────

  /** Reports a construct the format cannot express. Returns `undefined`, so callers can `return this.cannot(…)`. */
  private cannot(path: string, id: string | undefined, message: string): undefined {
    const seen = this.drop ? this.notes : this.unrepresentable;
    if (seen.some(i => i.path === path && i.message === message)) return undefined;
    if (this.drop) this.notes.push({ path, id, code: 'dropped', message });
    else this.unrepresentable.push({ path, id, code: 'unrepresentable', message });
    return undefined;
  }

  // ── values ────────────────────────────────────────────────────────────────

  colour(input: Color | string): string {
    // A few charts keep the colour text the author gave; the wire form is the same hex either way.
    const color = typeof input === 'string' ? toColor(input as never) : input;
    const rgb = `#${hex2(color.R)}${hex2(color.G)}${hex2(color.B)}`;
    if (color.A < 255) return `${rgb}${hex2(color.A)}`;
    return (this.options.writePaletteTokens ? paletteToken(rgb) : undefined) ?? rgb;
  }

  private sides(v: { left: number; top: number; right: number; bottom: number }): unknown {
    if (v.left === v.top && v.top === v.right && v.right === v.bottom) return v.left;
    const out: Obj = {};
    for (const side of ['top', 'right', 'bottom', 'left'] as const) if (v[side] !== 0) out[side] = v[side];
    return out;
  }

  private pageSize(size: PdfSize): unknown {
    const portrait = { width: Math.min(size.width, size.height), height: Math.max(size.width, size.height) };
    for (const token of D.pageSizes) {
      const named = toPageSize(token as never);
      if (
        Math.min(named.width, named.height) === portrait.width &&
        Math.max(named.width, named.height) === portrait.height
      ) {
        return token;
      }
    }
    return portrait;
  }

  private permissions(mask: number): unknown {
    if (mask === PdfPermissions.All) return 'all';
    if (mask === PdfPermissions.None) return 'none';
    const members = D.enums.PdfPermission.members!;
    return D.enums.PdfPermission.tokens.filter(
      t => (mask & (PdfPermissions as unknown as Record<string, number>)[members[t]]) !== 0
    );
  }

  /** Converts one stored value to its wire form, or `undefined` when the value is unset. */
  wire(kind: string, value: unknown): unknown {
    if (value === undefined || value === null) return undefined;
    const [head, ...rest] = kind.split(':');
    const arg = rest.join(':');
    switch (head) {
      case 'string':
      case 'boolean':
      case 'integer':
      case 'integerOrUnlimited':
        return value;
      case 'number':
        return value;
      case 'length':
        return value;
      case 'color':
        return this.colour(value as Color);
      case 'spacing':
        return this.sides(value as Thickness);
      case 'border':
        return this.sides(value as Border);
      case 'pageSize':
        return this.pageSize(value as PdfSize);
      case 'fontWeight':
        return WEIGHT_TOKENS[value as number] ?? value;
      case 'decoration': {
        const flags = value as number;
        const parts = [
          [TextDecoration.Underline, 'underline'],
          [TextDecoration.Strikethrough, 'strikethrough'],
          [TextDecoration.Overline, 'overline'],
        ].filter(([bit]) => (flags & (bit as number)) !== 0);
        if (parts.length === 0) return 'none';
        return parts.length === 1 ? parts[0][1] : parts.map(p => p[1]);
      }
      case 'permissions':
        return this.permissions(value as number);
      case 'dateTime':
        return (value as Date).toISOString();
      case 'chartNumberFormat':
        return value;
      case 'enum':
        return enumToken(arg, value);
      case 'array':
        return (value as unknown[]).map(v => this.wire(arg, v));
      case 'fontFeatures':
        return { ...(value as Record<string, number>) };
      case 'map':
        return Object.fromEntries(
          (value instanceof Map ? [...value.entries()] : Object.entries(value as Obj)).map(([k, v]) => [
            k,
            this.wire(arg, v),
          ])
        );
      case 'object':
        return this.shape(value as Obj, D.shapes[arg] ?? D.objects[arg], SHAPE_BLANK[arg]?.() as Obj | undefined);
      default:
        return undefined;
    }
  }

  /** A nested value object, writing only what differs from a fresh instance. `undefined` when nothing does. */
  shape(value: Obj, spec: ShapeSpec, blank?: Obj, skip: ReadonlySet<string> = new Set()): unknown {
    const out: Obj = {};
    for (const [key, ks] of Object.entries(keysOf(spec))) {
      if (skip.has(key)) continue;
      const w = this.wire(ks.kind, value[key]);
      if (w === undefined) continue;
      if (!ks.required && blank !== undefined && same(w, this.wire(ks.kind, blank[key]))) continue;
      out[key] = w;
    }
    return out;
  }

  // ── elements ──────────────────────────────────────────────────────────────

  private idOf(element: object): string | undefined {
    const id = debugSourceOf(element);
    if (id === undefined || !ID_PATTERN.test(id) || this.usedIds.has(id)) return undefined;
    this.usedIds.add(id);
    return id;
  }

  async elements(list: readonly IElement[], path: string): Promise<Obj[]> {
    const out: Obj[] = [];
    // Paths name the position in the document being written, so a dropped element does not renumber the rest.
    for (let i = 0; i < list.length; i++) {
      const node = await this.element(list[i], `${path}/${i}`);
      if (node !== undefined) out.push(node);
    }
    return out;
  }

  async element(el: IElement, path: string): Promise<Obj | undefined> {
    const type = TYPE_BY_CLASS.get(el.constructor as Ctor);
    if (type === undefined) {
      return this.cannot(
        path,
        undefined,
        `${el.constructor?.name ?? 'This element'} is a custom element; a definition can only hold catalogue elements.`
      );
    }
    const id = this.idOf(el);
    const node: Obj = { type };
    if (id !== undefined) node.id = id;

    const spec = D.elements[type];
    const blank = blankOf(type);
    const self = el as unknown as Obj;
    const fonts = el instanceof TextElementBase ? this.fontValues(el) : undefined;
    const explicit = el instanceof TextElementBase ? explicitText(el) : undefined;

    for (const [key, ks] of Object.entries(keysOf(spec))) {
      const at = `${path}/${escapeKey(key)}`;
      const head = ks.kind.split(':')[0];

      // Slots and keys whose stored form is not a property of the same name.
      const special = await this.slot(type, key, ks, el, at, id);
      if (special !== NOT_SPECIAL) {
        if (special === DROP_ELEMENT) return undefined;
        if (special !== undefined) node[key] = special;
        continue;
      }
      if (head === 'element' || head === 'elements' || head === 'stackChildren') continue;

      if (fonts !== undefined && key in FONT_KEYS) {
        if (fonts[key] !== undefined) node[key] = fonts[key];
        continue;
      }
      // Values a document-level default or an enclosing container can supply are written only when the
      // author set them, and then even if equal to the default: an unset value would be overridden.
      let setByAuthor = false;
      if (explicit !== undefined && CASCADE_KEYS[key]) {
        if (!explicit[CASCADE_KEYS[key]]) continue;
        setByAuthor = true;
      }
      if (el instanceof UnorderedList && key === 'bulletColor') {
        // Unset, the bullets follow the text colour; writing that colour would fix them to it.
        if (!bulletColorSet(el)) continue;
        setByAuthor = true;
      }
      if ((el instanceof TextBlock || el instanceof RichText) && key === 'alignment') {
        if (!alignmentExplicit(el)) continue;
        setByAuthor = true;
      }

      const w = this.wire(ks.kind, self[key]);
      if (w === undefined) continue;
      if (!ks.required && !setByAuthor && same(w, this.wire(ks.kind, blank[key]))) continue;
      if (isObj(w) && Object.keys(w).length === 0 && head === 'object') continue;
      node[key] = w;
    }
    return node;
  }

  /** `fontName`/`fontFamily`/`fontWeight`/`italic` of a text element: only what its author set. */
  private fontValues(el: TextElementBase): Obj {
    const out: Obj = {};
    if (!explicitText(el).font) return out;
    const weighted = el.fontWeight !== FontWeight.Normal || el.italic;
    if (fontChosenByFamily(el)) {
      out.fontFamily = el.fontFamily;
    } else if (
      !weighted ||
      FontFamilyResolver.resolve(StandardFonts.Helvetica, el.fontWeight, el.italic) !== el.fontName
    ) {
      // A font that was named, rather than one the weight and italic resolved from the default.
      out.fontName = el.fontName;
    }
    if (el.fontWeight !== FontWeight.Normal) out.fontWeight = this.wire('fontWeight', el.fontWeight);
    if (el.italic) out.italic = true;
    return out;
  }

  // ── slots ─────────────────────────────────────────────────────────────────

  private async child(el: IElement | undefined, at: string): Promise<Obj | undefined> {
    return el === undefined ? undefined : this.element(el, at);
  }

  /**
   * Handles the keys that are not plain properties. Returns {@link NOT_SPECIAL} for an ordinary key,
   * {@link DROP_ELEMENT} when the element cannot be written, otherwise the wire value (or `undefined`
   * to leave the key out).
   */
  private async slot(
    type: string,
    key: string,
    ks: KeySpec,
    el: IElement,
    at: string,
    id: string | undefined
  ): Promise<unknown> {
    const self = el as unknown as Obj;
    switch (`${type}.${key}`) {
      // single child
      case 'Flip.child':
      case 'Translate.child':
      case 'Rotate.child':
      case 'Container.child':
        return this.child(self.child as IElement | undefined, at);
      case 'EnsureSpace.child':
      case 'PreventPageBreak.child':
      case 'ShowEntire.child':
      case 'StopPaging.child':
      case 'ShowOnce.child':
      case 'SkipOnce.child':
      case 'Unconstrained.child':
      case 'ShowIf.child': {
        if (type === 'ShowIf' && self.predicate !== undefined) {
          this.cannot(
            at.slice(0, at.lastIndexOf('/')),
            id,
            'A ShowIf with a predicate is a function of the page and cannot be written.'
          );
          return DROP_ELEMENT;
        }
        const child = await this.child(self.child as IElement | undefined, at);
        return child ?? DROP_ELEMENT;
      }
      case 'VerticalStack.children':
      case 'SemanticGroup.children':
        return this.elements(el.getChildren?.() ?? [], at);
      case 'SemanticGroup.role':
        return this.wire(ks.kind, self.semanticRole);
      case 'HorizontalStack.children': {
        const stack = el as HorizontalStack;
        const weights = stackWeights(stack);
        const out: Obj[] = [];
        for (let i = 0; i < stack.children.length; i++) {
          const node = await this.element(stack.children[i], `${at}/${i}`);
          if (node === undefined) continue;
          out.push(weights[i] === null || weights[i] === undefined ? node : { element: node, weight: weights[i] });
        }
        return out;
      }
      case 'Layers.primary': {
        const primary = await this.child((el as Layers).primaryLayer, at);
        return primary ?? DROP_ELEMENT;
      }
      case 'Layers.backgrounds': {
        const list = await this.elements((el as Layers).backgroundLayers, at);
        return list.length ? list : undefined;
      }
      case 'Layers.foregrounds': {
        const list = await this.elements((el as Layers).foregroundLayers, at);
        return list.length ? list : undefined;
      }

      // text
      case 'RichText.spans':
        return this.spans(el as RichText);
      case 'RichText.defaultStyle': {
        const style = this.shape(
          (el as RichText).defaultStyle as unknown as Obj,
          D.shapes.TextStyle,
          new TextStyle() as unknown as Obj
        );
        return isObj(style) && Object.keys(style).length ? style : undefined;
      }

      // lists
      case 'UnorderedList.items':
      case 'OrderedList.items': {
        const list = el as OrderedList | UnorderedList;
        const items: unknown[] = [...listItems(list)];
        const nested = await this.elements(list.getNestedLists(), at);
        return [...items, ...nested];
      }

      // tables
      case 'Table.columns':
      case 'Grid.columns': {
        const columns = tableColumns(el as Table);
        return columns.length ? [...columns] : undefined;
      }
      case 'Table.header':
      case 'Grid.header':
      case 'Table.rows':
      case 'Grid.rows':
      case 'Table.footer':
      case 'Grid.footer': {
        const sections = tableSections(el as Table);
        const rows = key === 'header' ? sections.header : key === 'footer' ? sections.footer : sections.rows;
        if (rows.length === 0 && key !== 'rows') return undefined;
        const out: unknown[] = [];
        for (const row of rows) out.push(await this.row(row, `${at}/${out.length}`, key === 'header'));
        return out;
      }

      // media
      case 'Image.resource':
        return this.imageResource(el as Image, at, id);
      case 'Svg.resource':
      case 'Svg.svgData':
        return this.svgSource(el as Svg, key, at, id);

      // charts
      case 'BarChart.data':
      case 'GroupedBarChart.data':
      case 'LineChart.data':
      case 'AreaChart.data':
      case 'DotPlotChart.data':
      case 'LollipopChart.data':
      case 'PieChart.data':
        return this.chartData(el as ChartBase);
      default:
        break;
    }
    if (el instanceof ChartBase) {
      if (key === 'title') return (el.title as string) === '' ? undefined : el.title;
      if ((key === 'xAxis' || key === 'yAxis') && el instanceof CartesianChartBase) {
        const axis = this.shape(el[key] as unknown as Obj, D.shapes.Axis, new AxisOptions() as unknown as Obj);
        return isObj(axis) && Object.keys(axis).length ? axis : undefined;
      }
    }
    return NOT_SPECIAL;
  }

  private chartData(chart: ChartBase): Obj {
    const series: unknown[] = [];
    for (const s of chart.data.series) {
      const node = this.shape(
        s as unknown as Obj,
        D.shapes.Series,
        new ChartSeries() as unknown as Obj,
        new Set(['dataPoints', 'style'])
      ) as Obj;
      const ordered: Obj = {};
      for (const key of Object.keys(D.shapes.Series.keys)) {
        if (key === 'dataPoints') {
          ordered.dataPoints = s.dataPoints.map(p =>
            this.shape(p as unknown as Obj, D.shapes.DataPoint, new ChartDataPoint() as unknown as Obj)
          );
        } else if (key === 'style') {
          const style = this.shape(
            s.style as unknown as Obj,
            D.shapes.SeriesStyle,
            new ChartSeriesStyle() as unknown as Obj
          );
          if (isObj(style) && Object.keys(style).length) ordered.style = style;
        } else if (node[key] !== undefined) ordered[key] = node[key];
      }
      series.push(ordered);
    }
    return { series };
  }

  private spans(rich: RichText): Obj[] {
    return richTextSpans(rich).map(span => {
      if (span.isLineBreak && !span.text && !span.style) return { lineBreak: true };
      const node: Obj = { text: span.text ?? '' };
      if (span.style) {
        const style = this.shape(span.style as unknown as Obj, D.shapes.TextStyle, new TextStyle() as unknown as Obj);
        if (isObj(style) && Object.keys(style).length) node.style = style;
      }
      return node;
    });
  }

  // ── tables ────────────────────────────────────────────────────────────────

  private async row(row: TableRow, at: string, inHeader: boolean): Promise<unknown> {
    const cells: unknown[] = [];
    for (const cell of row.cells) cells.push(await this.cell(cell, `${at}/cells/${cells.length}`, inHeader));
    const options = this.shape(
      row as unknown as Obj,
      D.shapes.TableRow,
      new TableRow([]) as unknown as Obj,
      new Set(['cells'])
    ) as Obj;
    return Object.keys(options).length === 0 ? cells : { cells, ...options };
  }

  private async cell(cell: TableCell, at: string, inHeader: boolean): Promise<unknown> {
    const content = await this.element(cell.content, `${at}/content`);
    const plain = content !== undefined && content.type === 'TextBlock' && Object.keys(content).length === 2;
    const skip = new Set(['content', 'type', ...(inHeader ? ['isHeader'] : [])]);
    const options = this.shape(
      cell as unknown as Obj,
      D.shapes.TableCell,
      new TableCell() as unknown as Obj,
      skip
    ) as Obj;
    delete options.type;
    if (content === undefined) return Object.keys(options).length ? { type: 'TableCell', content: '', ...options } : '';
    if (Object.keys(options).length === 0) return plain ? content.text : content;
    return { type: 'TableCell', content: plain ? content.text : content, ...options };
  }

  // ── resources ─────────────────────────────────────────────────────────────

  private mediaTypeOf(kind: string, bytes: Uint8Array): string {
    const starts = (...sig: number[]): boolean => sig.every((b, i) => bytes[i] === b);
    if (kind === 'image') {
      if (starts(0x89, 0x50, 0x4e, 0x47)) return 'image/png';
      if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg';
    }
    if (kind === 'font') return starts(0x4f, 0x54, 0x54, 0x4f) ? 'font/otf' : 'font/ttf';
    if (kind === 'svg') return 'image/svg+xml';
    return 'application/octet-stream';
  }

  private async sha256(bytes: Uint8Array): Promise<string> {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
    return [...new Uint8Array(digest)].map(b => hex2(b)).join('');
  }

  private toBase64(bytes: Uint8Array): string {
    if (typeof btoa === 'function') {
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return btoa(binary);
    }
    return Buffer.from(bytes).toString('base64');
  }

  /** Adds a resource (or finds the identical one already added) and returns its name. */
  async resource(kind: DefinitionResourceDescriptor['kind'], bytes: Uint8Array, extra: Obj = {}): Promise<string> {
    const found = this.resources.find(
      r =>
        r.kind === kind &&
        r.bytes.length === bytes.length &&
        same(r.body.family, extra.family) &&
        same(r.body.weight, extra.weight) &&
        same(r.body.italic, extra.italic) &&
        r.bytes.every((b, i) => b === bytes[i])
    );
    if (found) return found.name;
    const mediaType = this.mediaTypeOf(kind, bytes);
    const body: Obj = { kind, mediaType };
    const ref = this.options.embedResources ? undefined : await this.options.resourceRef?.({ kind, mediaType, bytes });
    if (ref !== undefined) {
      body.ref = ref;
      body.sha256 = await this.sha256(bytes);
    } else body.data = this.toBase64(bytes);
    Object.assign(body, extra);
    this.counters[kind] = (this.counters[kind] ?? 0) + 1;
    const name = `${kind}-${this.counters[kind]}`;
    this.resources.push({ name, kind, mediaType, bytes, body });
    return name;
  }

  private readFile(path: string): Uint8Array | undefined {
    try {
      return getPlatformIO().readFileSync?.(path);
    } catch {
      return undefined;
    }
  }

  private async imageResource(image: Image, at: string, id: string | undefined): Promise<unknown> {
    let bytes: Uint8Array | undefined = image.imageData.length ? image.imageData : undefined;
    if (bytes === undefined && image.filePath !== '') bytes = this.readFile(image.filePath);
    if (bytes === undefined) {
      this.cannot(
        at.slice(0, at.lastIndexOf('/')),
        id,
        'The image has no bytes a definition can carry (its file could not be read).'
      );
      return DROP_ELEMENT;
    }
    return this.resource('image', bytes);
  }

  private async svgSource(svg: Svg, key: string, at: string, id: string | undefined): Promise<unknown> {
    const parent = at.slice(0, at.lastIndexOf('/'));
    if (svg.svgGenerator !== undefined) {
      this.cannot(parent, id, 'An Svg with an svgGenerator is a function of its box and cannot be written.');
      return DROP_ELEMENT;
    }
    let markup = svg.svgData;
    if (markup === '' && svg.filePath !== '') {
      const bytes = this.readFile(svg.filePath);
      markup = bytes ? new TextDecoder().decode(bytes) : '';
    }
    if (markup === '') {
      this.cannot(parent, id, 'The Svg has no markup a definition can carry (its file could not be read).');
      return DROP_ELEMENT;
    }
    const bytes = new TextEncoder().encode(markup);
    const named = this.options.embedResources
      ? undefined
      : await this.options.resourceRef?.({ kind: 'svg', mediaType: 'image/svg+xml', bytes });
    if (named === undefined) return key === 'svgData' ? markup : undefined;
    return key === 'resource' ? this.resource('svg', bytes) : undefined;
  }

  // ── the whole document ────────────────────────────────────────────────────

  async definition(): Promise<DocumentDefinition> {
    const doc = this.doc;
    const definition: DocumentDefinition = { version: DEFINITION_VERSIONS.version, minorVersion: 0, pages: [] };

    const settings = await this.settings();
    if (Object.keys(settings).length) definition.settings = settings;
    const metadata = this.metadata();
    if (Object.keys(metadata).length) definition.metadata = metadata;

    // Faces are resources; register them before the pages so they come first.
    for (const face of doc.fonts.faces) {
      await this.resource('font', face.bytes, {
        family: face.family,
        weight: this.wire('fontWeight', face.weight),
        italic: face.italic,
      });
    }

    const pages: Obj[] = [];
    const baseline = doc.settings;
    for (let i = 0; i < doc.pages.length; i++) {
      const page = doc.pages[i];
      const at = `/pages/${i}`;
      const node: Obj = {};
      const portrait = this.pageSize(page.size);
      const docPortrait = this.pageSize(baseline.pageSize);
      const landscape = page.width > page.height;
      const docLandscape = baseline.orientation === PageOrientation.Landscape;
      if (!same(portrait, docPortrait)) node.size = portrait;
      if (landscape !== docLandscape) node.orientation = landscape ? 'landscape' : 'portrait';
      if (page.hasExplicitMargin) node.margin = page.margin;
      if (page.pageColor !== undefined) node.pageColor = this.colour(page.pageColor);
      if (page.pageBackground) {
        const background = await this.element(page.pageBackground, `${at}/background`);
        if (background) node.background = background;
      }
      if (page.pageForeground) {
        const foreground = await this.element(page.pageForeground, `${at}/foreground`);
        if (foreground) node.foreground = foreground;
      }
      node.content = await this.elements(page.getElements(), `${at}/content`);
      pages.push(node);
    }
    definition.pages = pages;

    const attachments: Obj[] = [];
    for (const attachment of doc.attachments) {
      const resource = await this.resource('attachment', attachment.content);
      const node: Obj = { resource, fileName: attachment.fileName };
      if (attachment.relationship !== undefined)
        node.relationship = enumToken('AttachmentRelationship', attachment.relationship);
      if (attachment.mediaType !== undefined) node.mediaType = attachment.mediaType;
      if (attachment.description !== undefined) node.description = attachment.description;
      if (attachment.creationDate !== undefined) node.creationDate = attachment.creationDate.toISOString();
      if (attachment.modificationDate !== undefined) node.modificationDate = attachment.modificationDate.toISOString();
      attachments.push(node);
    }
    if (attachments.length) definition.attachments = attachments;

    if (this.resources.length) {
      const resources: Obj = {};
      for (const r of this.resources) resources[r.name] = r.body;
      // Resources are listed before the pages that use them.
      return this.order({ ...definition, resources });
    }
    return this.order(definition);
  }

  /** Root keys in the order of the description, so the JSON text is the same every time. */
  private order(definition: DocumentDefinition): DocumentDefinition {
    const out: Obj = {};
    for (const key of Object.keys(D.root.keys)) if (definition[key] !== undefined) out[key] = definition[key];
    return out as DocumentDefinition;
  }

  private metadata(): Obj {
    const metadata = this.doc.metadata as unknown as Obj;
    const blank = new DocumentMetadata() as unknown as Obj;
    const out: Obj = {};
    for (const [key, ks] of Object.entries(D.objects.Metadata.keys)) {
      let value = metadata[key];
      if (key === 'customProperties') value = (value as Map<string, string>).size ? value : undefined;
      // A date the metadata gave itself when it was built is "the time it was made", not a chosen date.
      if (ks.kind === 'dateTime' && isBuiltInMetadataDate(value as Date | undefined)) continue;
      const w = this.wire(ks.kind, value);
      if (w === undefined) continue;
      if (ks.kind !== 'dateTime' && same(w, this.wire(ks.kind, blank[key]))) continue;
      out[key] = w;
    }
    return out;
  }

  private async settings(): Promise<Obj> {
    const settings = this.doc.settings;
    const self = settings as unknown as Obj;
    const blank = new DocumentSettings() as unknown as Obj;
    const out: Obj = {};
    for (const [key, ks] of Object.entries(D.objects.Settings.keys)) {
      const at = `/settings/${key}`;
      switch (key) {
        case 'pageChrome': {
          const chrome = await this.pageChrome();
          if (chrome) out.pageChrome = chrome;
          continue;
        }
        case 'bookmarks': {
          if (!settings.bookmarks.length) continue;
          out.bookmarks = this.bookmarks(settings.bookmarks as never);
          continue;
        }
        case 'namedDestinations': {
          if (!settings.namedDestinations.size) continue;
          out.namedDestinations = Object.fromEntries(settings.namedDestinations);
          continue;
        }
        case 'facturX': {
          if (settings.facturX) out.facturX = { ...settings.facturX };
          continue;
        }
        case 'encryption': {
          if (!settings.encryption) continue;
          const enc = this.shape(
            settings.encryption as unknown as Obj,
            D.shapes.Encryption,
            new (settings.encryption.constructor as new () => object)() as Obj
          );
          out.encryption = enc;
          this.notes.push({
            path: at,
            code: 'secret-omitted',
            message: 'The passwords are not stored in a definition; the host supplies them when it is read.',
          });
          continue;
        }
        case 'maxImageDpi': {
          // "No cap" is null here and the token "unlimited" on the wire.
          if (settings.maxImageDpi === null && blank.maxImageDpi !== null) out.maxImageDpi = 'unlimited';
          else if (settings.maxImageDpi !== blank.maxImageDpi) out.maxImageDpi = settings.maxImageDpi;
          continue;
        }
        default:
          break;
      }
      const value = key === 'pdfVersion' ? settings.version : self[key];
      const w = this.wire(ks.kind, value);
      if (w === undefined) continue;
      const blankValue = key === 'pdfVersion' ? blank.version : blank[key];
      if (same(w, this.wire(ks.kind, blankValue))) continue;
      if (isObj(w) && Object.keys(w).length === 0 && ks.kind.startsWith('object:')) continue;
      out[key] = w;
    }
    return out;
  }

  private bookmarks(items: readonly { title: string; pageIndex: number; children: readonly unknown[] }[]): unknown[] {
    return items.map(item => {
      const node: Obj = { title: item.title, pageIndex: item.pageIndex };
      if (item.children.length) node.children = this.bookmarks(item.children as never);
      return node;
    });
  }

  private async pageChrome(): Promise<Obj | undefined> {
    const settings = this.doc.settings;
    const slots: [string, string, PageTemplate | undefined][] = [
      ['header', 'headerTemplate', settings.headerTemplate],
      ['footer', 'footerTemplate', settings.footerTemplate],
      ['background', 'pageBackground', settings.pageBackground],
      ['foreground', 'pageForeground', settings.pageForeground],
    ];
    const out: Obj = {};
    for (const [name, property, template] of slots) {
      if (!template) continue;
      const at = `/settings/pageChrome/${name}`;
      const elements = getPageTemplateElements(template);
      if (!elements) {
        // The wire has no key for a function; the report names the property of the document that holds it.
        this.cannot(
          `/settings/${property}`,
          undefined,
          `${property} is a function of the page number; build it with pageTemplate to write it.`
        );
        continue;
      }
      const slot: Obj = {};
      for (const member of PAGE_TEMPLATE_ELEMENT_KEYS) {
        const element = elements[member];
        if (!element) continue;
        const node = await this.element(element, `${at}/${member}`);
        if (node) slot[member] = node;
      }
      if (Object.keys(slot).length) out[name] = slot;
    }
    return Object.keys(out).length ? out : undefined;
  }
}

/** Marker: this key is an ordinary property. */
const NOT_SPECIAL = Symbol('not-special');
/** Marker: the element cannot be written and has been reported. */
const DROP_ELEMENT = Symbol('drop-element');

const FONT_KEYS: Record<string, true> = { fontName: true, fontFamily: true, fontWeight: true, italic: true };
const CASCADE_KEYS: Record<string, 'fontSize' | 'color' | 'lineHeight' | 'decoration' | undefined> = {
  fontSize: 'fontSize',
  color: 'color',
  lineHeight: 'lineHeight',
  decoration: 'decoration',
};

/**
 * Writes a document as a Document Definition (spec 15 §11, §14): plain data that
 * {@link documentFromDefinition} turns back into a document that renders identically.
 *
 * Values equal to their defaults are left out, lengths are points, colours are hex and every
 * enumeration is its token, so the result is the canonical form. Constructs a definition cannot express
 * (spec 15 §11.2) are reported: by default nothing is written and a {@link DefinitionError} lists them all;
 * with `onUnrepresentable: 'drop'` they are left out and reported as notes.
 */
export async function documentToDefinition(
  doc: Document,
  options: DefinitionWriteOptions = {}
): Promise<DefinitionWriteResult> {
  if (options.target !== undefined && options.target !== `${DEFINITION_VERSIONS.version}.0`) {
    throw new DefinitionError([
      {
        path: '',
        code: 'unsupported-version',
        message: `This release writes definition version ${DEFINITION_VERSIONS.version}.0; ${JSON.stringify(options.target)} was requested.`,
        expected: `${DEFINITION_VERSIONS.version}.0`,
        found: options.target,
      },
    ]);
  }
  const writer = new Writer(doc, options);
  const definition = await writer.definition();
  if (writer.unrepresentable.length) throw new DefinitionError(writer.unrepresentable);

  // A definition this writer produces must read back; anything the reader would refuse is reported now.
  const check = validateDefinition(definition);
  if (!check.valid) throw new DefinitionError(check.errors);
  return { definition, notes: writer.notes };
}
