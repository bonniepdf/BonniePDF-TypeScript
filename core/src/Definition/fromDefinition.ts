import { Document } from '../Document';
import { pageTemplate, type PageTemplate } from '../Configuration/PageTemplate';
import { DocumentSettings } from '../Configuration/DocumentSettings';
import { AttachmentRelationship } from '../Attachments/AttachmentRelationship';
import { PdfVersion } from '../Configuration/PdfVersion';
import { EncryptionAlgorithm } from '../Security/Models/EncryptionAlgorithm';
import { PdfPermissions } from '../Security/Permissions/PdfPermissions';
import { SemanticRole } from '../Rendering/Tagging/SemanticRole';
import { BarcodeSymbology } from '../Elements/Shapes/BarcodeSymbology';
import { LineOrientation } from '../Elements/Shapes/Line';
import { ChartOrientation } from '../Charts/ChartOrientation';
import { markDebugSource } from '../Rendering/DebugSource';
import { toLength } from '../Normalize/toLength';
import { toPageSize } from '../Normalize/toPageSize';
import { toPageOrientation } from '../Normalize/toEnum';
import { Unit } from '../Core/Unit';
import type { Color } from '../Core/Color';
import { BorderColors } from '../Core/BorderColors';
import { toColor } from '../Normalize/toColor';
import type { IElement } from '../Elements/IElement';
import type { Page } from '../Elements/Layout/Page';
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
import { ShowIf } from '../Elements/Layout/Pagination/ShowIf';
import { ShowOnce } from '../Elements/Layout/Pagination/ShowOnce';
import { SkipOnce } from '../Elements/Layout/Pagination/SkipOnce';
import { Unconstrained } from '../Elements/Layout/Pagination/Unconstrained';
import { TextBlock } from '../Elements/Text/TextBlock';
import { Heading } from '../Elements/Text/Heading';
import { RichText } from '../Elements/Text/RichText';
import { PageNumberOf } from '../Elements/Text/PageNumberOf';
import { VisualToc } from '../Elements/Text/VisualToc';
import { Section } from '../Elements/Text/Section';
import { TextStyle } from '../Elements/Text/TextStyle';
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
import { ELEMENT_DESCRIPTION } from './ElementDescription';
import { keysOf } from './keysOf';
import type { ShapeSpec } from './ElementDescriptionTypes';
import type { DefinitionIssue, DocumentDefinition, ValidateOptions } from './DefinitionTypes';
import { validateDefinition } from './validateDefinition';
import type { SvgRasterizer } from '../Rendering/Svg/ImportSvg';
import { BonniePdfError } from '../Core/BonniePdfError';

const D = ELEMENT_DESCRIPTION;

/** What the host is asked for when a definition names a resource it does not carry. */
export interface DefinitionResourceRequest {
  /** The name in the definition's `resources`. */
  name: string;
  /** The kind of resource requested: `'image'`, `'font'`, `'svg'` or `'attachment'`. */
  kind: string;
  /** The media type the definition declares for the resource. */
  mediaType: string;
}

/** Options for reading a definition into a document. */
export interface DefinitionReadOptions extends ValidateOptions {
  /**
   * Supplies the bytes for a resource that has a `ref`. The reader never opens a path or fetches a URL
   * on its own: `ref` is an opaque name the host resolves. Return `undefined` when the
   * host has nothing under that name.
   */
  resources?: (
    ref: string,
    request: DefinitionResourceRequest
  ) => Uint8Array | undefined | Promise<Uint8Array | undefined>;
  /** Passwords for `settings.encryption`. They are never part of a definition. */
  passwords?: { owner?: string; user?: string };
  /** An SVG rasterizer to register on the document. Supplied by the host, never stored. */
  rasterizer?: SvgRasterizer;
}

/** Thrown when a definition cannot be turned into a document. Carries every problem found. */
export class DefinitionError extends BonniePdfError {
  constructor(
    /** Every problem found in the definition. */
    public readonly issues: readonly DefinitionIssue[]
  ) {
    super(
      `The definition has ${issues.length} problem${issues.length === 1 ? '' : 's'}: ` +
        issues
          .slice(0, 5)
          .map(i => `${i.path || '/'} ${i.code}`)
          .join('; ') +
        (issues.length > 5 ? `; and ${issues.length - 5} more` : '')
    );
    this.name = 'DefinitionError';
  }
}

// ── enum members ────────────────────────────────────────────────────────────

const ENUM_OBJECTS: Record<string, Record<string, unknown>> = {
  PdfVersion: PdfVersion as unknown as Record<string, unknown>,
  EncryptionAlgorithm: EncryptionAlgorithm as unknown as Record<string, unknown>,
  AttachmentRelationship: AttachmentRelationship as unknown as Record<string, unknown>,
  BarcodeSymbology: BarcodeSymbology as unknown as Record<string, unknown>,
  LineOrientation: LineOrientation as unknown as Record<string, unknown>,
  ChartOrientation: ChartOrientation as unknown as Record<string, unknown>,
  SemanticRole: SemanticRole as unknown as Record<string, unknown>,
};

const UNIT_BY_TOKEN: Record<string, Unit> = { pt: Unit.Point, in: Unit.Inch, cm: Unit.Centimeter, mm: Unit.Millimeter };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

// ── value conversion ────────────────────────────────────────────────────────

/** Bytes for the resources a definition carries, by name. */
interface Loaded {
  bytes: Map<string, Uint8Array>;
}

function toPoints(value: unknown): number {
  if (isObj(value)) return toLength({ value: value.value as number, unit: UNIT_BY_TOKEN[value.unit as string] });
  return toLength(value as number | `${number}pt`);
}

/** Converts one validated value into what the code API's options accept. */
function convert(kind: string, value: unknown): unknown {
  const [head, ...rest] = kind.split(':');
  const arg = rest.join(':');
  switch (head) {
    case 'integerOrUnlimited':
      // "No cap" is null in the code API and the token "unlimited" on the wire.
      return value === 'unlimited' ? null : value;
    case 'length':
      return toPoints(value);
    case 'spacing':
      if (Array.isArray(value)) return value.map(toPoints);
      if (isObj(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPoints(v)]));
      return toPoints(value);
    case 'border':
      if (isObj(value))
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === 'color' ? v : toPoints(v)]));
      return toPoints(value);
    case 'enum': {
      const spec = D.enums[arg];
      if (spec.via === 'options') return value;
      const member = spec.members![value as string];
      const target = ENUM_OBJECTS[spec.type!];
      return target ? target[member] : member;
    }
    case 'permissions': {
      if (value === 'all') return PdfPermissions.All;
      if (value === 'none') return PdfPermissions.None;
      const list = Array.isArray(value) ? (value as string[]) : [value as string];
      const members = D.enums.PdfPermission.members!;
      return list.reduce<number>(
        (mask, token) => mask | (PdfPermissions as unknown as Record<string, number>)[members[token]],
        0
      );
    }
    case 'dateTime':
      return new Date(value as string);
    case 'array':
      return (value as unknown[]).map(v => convert(arg, v));
    case 'map':
      return Object.fromEntries(Object.entries(value as Obj).map(([k, v]) => [k, convert(arg, v)]));
    case 'object':
      if (arg === 'BorderColors') {
        // The code API takes a BorderColors of Colors here, not a literal of colour strings.
        const sides = value as Obj;
        const side = (name: string): Color | undefined =>
          sides[name] === undefined ? undefined : toColor(sides[name] as never);
        return new BorderColors(side('left'), side('top'), side('right'), side('bottom'));
      }
      return convertShape(value as Obj, D.shapes[arg] ?? D.objects[arg]);
    default:
      return value;
  }
}

const SLOT_KINDS = new Set([
  'element',
  'elements',
  'stackChildren',
  'listItems',
  'spans',
  'rows',
  'cells',
  'cellContent',
]);

/** Converts every value key of a shape; slot kinds are left for the builder. */
function convertShape(value: Obj, spec: ShapeSpec, skip: ReadonlySet<string> = new Set()): Obj {
  const keys = keysOf(spec);
  const out: Obj = {};
  for (const [key, v] of Object.entries(value)) {
    if (key.startsWith('_') || key === 'type' || key === 'id' || skip.has(key)) continue;
    const keySpec = keys[key];
    if (!keySpec || SLOT_KINDS.has(keySpec.kind.split(':')[0]) || keySpec.kind.includes('element')) continue;
    out[key] = convert(keySpec.kind, v);
  }
  return out;
}

// ── reading ─────────────────────────────────────────────────────────────────

function matchesMediaType(mediaType: string, bytes: Uint8Array): boolean {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  switch (mediaType.toLowerCase()) {
    case 'image/png':
      return starts(0x89, 0x50, 0x4e, 0x47);
    case 'image/jpeg':
      return starts(0xff, 0xd8, 0xff);
    case 'font/ttf':
    case 'font/otf':
    case 'font/sfnt':
    case 'application/font-sfnt':
    case 'application/x-font-ttf':
      return (
        starts(0x00, 0x01, 0x00, 0x00) ||
        starts(0x74, 0x72, 0x75, 0x65) ||
        starts(0x4f, 0x54, 0x54, 0x4f) ||
        starts(0x74, 0x74, 0x63, 0x66)
      );
    case 'image/svg+xml':
      return new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 4096))).includes('<svg');
    default:
      return true;
  }
}

function fromBase64(text: string): Uint8Array {
  if (typeof atob === 'function') {
    const binary = atob(text);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  return Uint8Array.from(Buffer.from(text, 'base64'));
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function loadResources(definition: DocumentDefinition, options: DefinitionReadOptions): Promise<Loaded> {
  const issues: DefinitionIssue[] = [];
  const bytes = new Map<string, Uint8Array>();
  const resources = (definition.resources ?? {}) as Record<string, Obj>;
  for (const [name, resource] of Object.entries(resources)) {
    const at = `/resources/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`;
    let data: Uint8Array | undefined;
    if (typeof resource.data === 'string') data = fromBase64(resource.data);
    else if (typeof resource.ref === 'string') {
      data = await options.resources?.(resource.ref, {
        name,
        kind: resource.kind as string,
        mediaType: resource.mediaType as string,
      });
      if (!data) {
        issues.push({
          path: `${at}/ref`,
          code: 'resource-unresolved',
          message: `The host supplied no bytes for ${JSON.stringify(resource.ref)}.`,
        });
        continue;
      }
    }
    if (!data) continue;
    if (!matchesMediaType(resource.mediaType as string, data)) {
      issues.push({
        path: at,
        code: 'resource-type-mismatch',
        message: `The bytes are not ${String(resource.mediaType)}.`,
      });
      continue;
    }
    if (typeof resource.sha256 === 'string' && (await sha256Hex(data)) !== resource.sha256) {
      issues.push({
        path: `${at}/sha256`,
        code: 'resource-hash-mismatch',
        message: 'The bytes do not match the recorded sha256.',
      });
      continue;
    }
    bytes.set(name, data);
  }
  if (issues.length) throw new DefinitionError(issues);
  return { bytes };
}

class Builder {
  constructor(private readonly loaded: Loaded) {}

  /** Builds an element, and marks it with its `id`. */
  element(node: Obj): IElement {
    const element = this.build(node);
    if (typeof node.id === 'string') markDebugSource(element, node.id);
    return element;
  }

  private elements(nodes: unknown): IElement[] {
    return (nodes as Obj[]).map(n => this.element(n));
  }

  private build(node: Obj): IElement {
    const type = node.type as string;
    const spec = D.elements[type];
    const o = convertShape(node, spec);
    const child = node.child !== undefined ? this.element(node.child as Obj) : undefined;

    switch (type) {
      case 'Flip':
        return new Flip({ ...o, child });
      case 'Translate':
        return new Translate({ ...o, child });
      case 'Rotate':
        return new Rotate({ ...o, child });
      case 'Container':
        return new Container({ ...o, child });
      case 'VerticalStack':
        return new VerticalStack({ ...o, children: this.elements(node.children) });
      case 'HorizontalStack': {
        const stack = new HorizontalStack(o);
        for (const c of node.children as Obj[]) {
          if (c.type === undefined && c.element !== undefined)
            stack.add(this.element(c.element as Obj), c.weight as number);
          else stack.add(this.element(c));
        }
        return stack;
      }
      case 'Layers': {
        const layers = new Layers({ ...o, primaryLayer: this.element(node.primary as Obj) });
        for (const b of (node.backgrounds as Obj[] | undefined) ?? []) layers.addBackground(this.element(b));
        for (const f of (node.foregrounds as Obj[] | undefined) ?? []) layers.addForeground(this.element(f));
        return layers;
      }
      case 'Spacer':
        return new Spacer(o);
      case 'PageBreak':
        return new PageBreak(o);
      case 'SemanticGroup': {
        const { role, ...rest } = o;
        return new SemanticGroup({ ...rest, role: role as SemanticRole, children: this.elements(node.children) });
      }
      case 'EnsureSpace':
        return new EnsureSpace({ ...o, child });
      case 'PreventPageBreak':
        return new PreventPageBreak({ ...o, child });
      case 'ShowEntire':
        return new ShowEntire({ ...o, child });
      case 'StopPaging':
        return new StopPaging({ ...o, child });
      case 'ShowOnce':
        return new ShowOnce({ ...o, child });
      case 'SkipOnce':
        return new SkipOnce({ ...o, child });
      case 'Unconstrained':
        return new Unconstrained({ ...o, child });
      case 'ShowIf':
        return new ShowIf({ ...o, child });
      case 'TextBlock':
        return new TextBlock(o);
      case 'Heading':
        return new Heading(o);
      case 'PageNumberOf':
        return new PageNumberOf(o as never);
      case 'VisualToc':
        return new VisualToc(o);
      case 'Hyperlink':
        return new Hyperlink(o as never);
      case 'SectionLink':
        return new SectionLink(o as never);
      case 'Section':
        return new Section(o as never);
      case 'RichText':
        return this.richText(node, o);
      case 'UnorderedList':
      case 'OrderedList':
        return this.list(node, o);
      case 'Table':
      case 'Grid':
        return this.table(node, o);
      case 'Image': {
        const { resource, ...rest } = o;
        void resource;
        return new Image({ ...rest, imageData: this.loaded.bytes.get(node.resource as string) });
      }
      case 'Svg': {
        const { svgData, resource, ...rest } = o;
        void resource;
        const data =
          typeof node.svgData === 'string'
            ? node.svgData
            : new TextDecoder().decode(this.loaded.bytes.get(node.resource as string));
        void svgData;
        return new Svg({ ...rest, svgData: data });
      }
      case 'Line':
        return new Line(o);
      case 'Circle':
        return new Circle(o);
      case 'Ellipse':
        return new Ellipse(o);
      case 'QRCode':
        return new QRCode(o);
      case 'Barcode':
        return new Barcode(o);
      case 'DataMatrix':
        return new DataMatrix(o);
      case 'BarChart':
        return new BarChart(o);
      case 'GroupedBarChart':
        return new GroupedBarChart(o);
      case 'LineChart':
        return new LineChart(o);
      case 'AreaChart':
        return new AreaChart(o);
      case 'DotPlotChart':
        return new DotPlotChart(o);
      case 'LollipopChart':
        return new LollipopChart(o);
      case 'PieChart':
        return new PieChart(o);
      default:
        throw new DefinitionError([
          { path: '', code: 'unknown-type', message: `Element type ${type} is not supported by this reader.` },
        ]);
    }
  }

  private richText(node: Obj, o: Obj): IElement {
    const { defaultStyle, ...rest } = o;
    const rich = new RichText(rest);
    if (defaultStyle !== undefined) rich.defaultStyle = new TextStyle(defaultStyle as never);
    for (const span of node.spans as Obj[]) {
      if (span.lineBreak === true) rich.lineBreak();
      else {
        const style =
          span.style !== undefined
            ? new TextStyle(convertShape(span.style as Obj, D.shapes.TextStyle) as never)
            : undefined;
        if (typeof span.link === 'string') rich.link(span.text as string, span.link, style);
        else rich.span(span.text as string, style);
      }
    }
    return rich;
  }

  private list(node: Obj, o: Obj): IElement {
    const items = node.items as (string | Obj)[];
    const strings = items.filter((i): i is string => typeof i === 'string');
    const list =
      node.type === 'UnorderedList'
        ? new UnorderedList({ ...o, items: strings })
        : new OrderedList({ ...o, items: strings });
    for (const item of items) {
      if (typeof item === 'string') continue;
      (list as UnorderedList).addNestedList(this.element(item) as UnorderedList);
    }
    return list;
  }

  private table(node: Obj, o: Obj): IElement {
    const { presentation, ...rest } = o;
    const columns = node.columns as number[] | undefined;
    const table =
      node.type === 'Grid'
        ? new Grid({ ...rest, columns })
        : new Table({ ...rest, columns, presentation: presentation as boolean | undefined });
    for (const row of (node.header as unknown[] | undefined) ?? []) table.addHeader(this.row(row));
    for (const row of (node.rows as unknown[] | undefined) ?? []) table.addRow(this.row(row));
    for (const row of (node.footer as unknown[] | undefined) ?? []) table.addFooter(this.row(row));
    return table;
  }

  private row(row: unknown): TableRow {
    if (Array.isArray(row)) return new TableRow(row.map(c => this.cell(c)));
    const r = row as Obj;
    const options = convertShape(r, D.shapes.TableRow);
    const tableRow = new TableRow(options as never);
    tableRow.cells = (r.cells as unknown[]).map(c => this.cell(c));
    return tableRow;
  }

  private cell(cell: unknown): TableCell {
    if (typeof cell === 'string') return new TableCell({ content: new TextBlock({ text: cell }) });
    const c = cell as Obj;
    if (c.type === 'TableCell') {
      const options = convertShape(c, D.shapes.TableCell);
      const content =
        typeof c.content === 'string' ? new TextBlock({ text: c.content }) : this.element(c.content as Obj);
      return new TableCell({ ...options, content } as never);
    }
    return new TableCell({ content: this.element(c) });
  }
}

/** Builds the page-chrome templates of `settings.pageChrome`. */
function chromeTemplate(builder: Builder, slot: Obj | undefined): PageTemplate | undefined {
  if (!slot) return undefined;
  const pick = (key: string): IElement | undefined =>
    slot[key] !== undefined ? builder.element(slot[key] as Obj) : undefined;
  return pageTemplate({ default: pick('default'), firstPage: pick('firstPage'), odd: pick('odd'), even: pick('even') });
}

function settingsOptions(settings: Obj, options: DefinitionReadOptions): Obj {
  const converted = convertShape(
    settings,
    D.objects.Settings,
    new Set(['pageChrome', 'pdfVersion', 'namedDestinations', 'facturX', 'encryption', 'bookmarks'])
  );
  if (settings.pdfVersion !== undefined) converted.version = convert('enum:PdfVersion', settings.pdfVersion);
  if (settings.bookmarks !== undefined) converted.bookmarks = convert('array:object:Bookmark', settings.bookmarks);
  if (settings.encryption !== undefined) {
    const enc = convertShape(settings.encryption as Obj, D.shapes.Encryption);
    converted.encryption = {
      ...enc,
      ownerPassword: options.passwords?.owner,
      userPassword: options.passwords?.user ?? '',
    };
  }
  if (settings.facturX !== undefined) converted.facturX = settings.facturX;
  return converted;
}

/**
 * Builds a document from a definition. Validates first, and throws a {@link DefinitionError}
 * listing every problem if there are any; nothing is constructed from an invalid definition.
 */
export async function documentFromDefinition(input: unknown, options: DefinitionReadOptions = {}): Promise<Document> {
  const result = validateDefinition(input, options);
  if (!result.valid) throw new DefinitionError(result.errors);
  const definition = result.definition!;

  if (isObj(definition.settings) && definition.settings.encryption !== undefined && !options.passwords?.owner) {
    throw new DefinitionError([
      {
        path: '/settings/encryption',
        code: 'secret-required',
        message: 'The definition is encrypted; the host must supply `passwords.owner` when reading.',
      },
    ]);
  }

  const loaded = await loadResources(definition, options);
  const builder = new Builder(loaded);

  const settings = isObj(definition.settings) ? definition.settings : {};
  const pages = definition.pages as Obj[];
  const settingsBag = settingsOptions(settings, options);

  // The first page is the one the document creates itself, so its size comes from the settings the
  // document is constructed with; the real defaults are put back before the other pages are added.
  const first = pages[0];
  const construction: Obj = { ...settingsBag };
  if (first.size !== undefined) construction.pageSize = convert('pageSize', first.size);
  if (first.orientation !== undefined) {
    construction.orientation = first.orientation;
    construction.preservePageDimensions = false;
  }
  if (first.margin !== undefined) construction.margin = toPoints(first.margin);

  const metadata = isObj(definition.metadata) ? convertShape(definition.metadata, D.objects.Metadata) : {};
  const doc = new Document({ settings: construction as never, metadata: metadata as never });

  // The page the document made for itself is given a margin of its own only if the definition states one.
  doc.pages[0].hasExplicitMargin = first.margin !== undefined;

  // Put the document-level page defaults back now the first page exists, so later pages start from them.
  const baseline = new DocumentSettings();
  if (first.size !== undefined) doc.settings.pageSize = (settingsBag.pageSize ?? baseline.pageSize) as never;
  if (first.orientation !== undefined) {
    doc.settings.orientation = (settingsBag.orientation ?? baseline.orientation) as never;
    doc.settings.preservePageDimensions = settingsBag.preservePageDimensions === true;
  }
  if (first.margin !== undefined) doc.settings.margin = (settingsBag.margin ?? baseline.margin) as never;

  if (settings.namedDestinations !== undefined) {
    doc.settings.namedDestinations = new Map(Object.entries(settings.namedDestinations as Record<string, number>));
  }
  if (isObj(settings.pageChrome)) {
    const chrome = settings.pageChrome;
    doc.settings.headerTemplate = chromeTemplate(builder, chrome.header as Obj | undefined);
    doc.settings.footerTemplate = chromeTemplate(builder, chrome.footer as Obj | undefined);
    doc.settings.pageBackground = chromeTemplate(builder, chrome.background as Obj | undefined);
    doc.settings.pageForeground = chromeTemplate(builder, chrome.foreground as Obj | undefined);
  }
  if (options.rasterizer) doc.registerSvgRasterizer(options.rasterizer);

  // Fonts belong to this document.
  for (const [name, resource] of Object.entries((definition.resources ?? {}) as Record<string, Obj>)) {
    if (resource.kind !== 'font') continue;
    doc.fonts.add(loaded.bytes.get(name)!, {
      family: resource.family as string | undefined,
      weight: resource.weight as never,
      italic: resource.italic as boolean | undefined,
    });
  }

  for (let i = 0; i < pages.length; i++) {
    const entry = pages[i];
    let page: Page;
    if (i === 0) page = doc.pages[0];
    else {
      const named =
        entry.size !== undefined && !doc.settings.preservePageDimensions
          ? (entry.orientation ?? settings.orientation ?? 'portrait')
          : entry.orientation;
      const pageOrientation = named === undefined ? undefined : toPageOrientation(named as never);
      page = doc.addPage({
        size: entry.size !== undefined ? toPageSize(entry.size as never) : undefined,
        // With a size of its own a page still takes the document's orientation unless it names one; without one it is the document's page.
        orientation: pageOrientation,
        margin: entry.margin !== undefined ? toPoints(entry.margin) : undefined,
      });
    }
    if (entry.margins !== undefined) page.margins = convert('spacing', entry.margins) as never;
    if (entry.pageColor !== undefined) page.pageColor = entry.pageColor as never;
    if (entry.background !== undefined) page.pageBackground = builder.element(entry.background as Obj);
    if (entry.foreground !== undefined) page.pageForeground = builder.element(entry.foreground as Obj);
    for (const node of entry.content as Obj[]) page.add(builder.element(node));
  }

  for (const attachment of (definition.attachments ?? []) as Obj[]) {
    doc.attach({
      fileName: attachment.fileName as string,
      content: loaded.bytes.get(attachment.resource as string)!,
      relationship:
        attachment.relationship !== undefined
          ? (convert('enum:AttachmentRelationship', attachment.relationship) as AttachmentRelationship)
          : undefined,
      mediaType: attachment.mediaType as string | undefined,
      description: attachment.description as string | undefined,
      creationDate: attachment.creationDate !== undefined ? new Date(attachment.creationDate as string) : undefined,
      modificationDate:
        attachment.modificationDate !== undefined ? new Date(attachment.modificationDate as string) : undefined,
    });
  }
  return doc;
}
