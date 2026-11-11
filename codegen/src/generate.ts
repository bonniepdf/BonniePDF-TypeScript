import { validateDefinition, type DocumentDefinition } from '@bonniepdf/core/definition';
import { formatSource, updateSourceRanges } from './format';
import { isPortableIdentifier } from './identifiers';
import apiData from './api.generated.json';
import { emptyAnnotations, emitNote, validateAnnotations, type CodeAnnotations, type CodeTarget } from './authoring';

type Obj = Record<string, any>;
const api = apiData as unknown as {
  elements: string[];
  schemas: Record<string, Obj>;
  dotnet: Record<string, Obj>;
  provenance: Obj;
};
export interface GenerateOptions {
  targets?: CodeTarget[];
  documentName?: string;
  namespace?: string;
  annotations?: CodeAnnotations;
  signal?: AbortSignal;
}
export interface GenerationDiagnostic {
  code: string;
  path: string;
  message: string;
  target?: CodeTarget;
}
export interface GeneratedFile {
  path: string;
  language: CodeTarget;
  content: string;
}
export interface GeneratedRange {
  language: CodeTarget;
  nodeId?: string;
  definitionPath: string;
  symbolName: string;
  startLine: number;
  endLine: number;
}
export interface GenerationResult {
  generatorVersion: '0.1.0';
  files: GeneratedFile[];
  diagnostics: GenerationDiagnostic[];
  sourceMap: GeneratedRange[];
}
class MappingError extends Error {
  constructor(
    public path: string,
    message: string
  ) {
    super(message);
  }
}
const quote = (value: string) =>
  JSON.stringify(value).replace(/[\u2028\u2029]/g, c => (c === '\u2028' ? '\\u2028' : '\\u2029'));
const pascal = (s: string) => s[0].toUpperCase() + s.slice(1);
const normalized = (s: string) => s.replace(/[^a-z0-9]/gi, '').toLowerCase();
const portableIdentifier = isPortableIdentifier;
const object = (v: unknown): v is Obj => Boolean(v) && typeof v === 'object' && !Array.isArray(v);
const typescriptEnumNames = new Set([
  'PdfVersion',
  'EncryptionAlgorithm',
  'AttachmentRelationship',
  'BarcodeSymbology',
  'LineOrientation',
  'ChartOrientation',
  'SemanticRole',
]);
const typeAliases: Record<string, string> = {
  Settings: 'DocumentSettings',
  Metadata: 'DocumentMetadata',
  Axis: 'AxisOptions',
  Series: 'ChartSeries',
  SeriesStyle: 'ChartSeriesStyle',
  DataPoint: 'ChartDataPoint',
  Encryption: 'EncryptionSettings',
};
const slots = new Set([
  'child',
  'children',
  'primary',
  'backgrounds',
  'foregrounds',
  'header',
  'rows',
  'footer',
  'spans',
  'items',
  'resource',
]);

class Emitter {
  lines: string[] = [];
  imports = new Set<string>();
  sourceMap: GeneratedRange[] = [];
  private counter = 0;
  private variables = new Set<string>(['doc', 'resources', 'runtimeSecrets']);
  constructor(
    readonly target: CodeTarget,
    readonly annotations: CodeAnnotations,
    readonly options: GenerateOptions
  ) {}
  get cs() {
    return this.target === 'csharp';
  }
  get indent() {
    return this.cs ? '        ' : '  ';
  }
  add(line = '') {
    this.options.signal?.throwIfAborted();
    this.lines.push(...line.split('\n'));
  }
  imp(name: string) {
    this.imports.add(name);
    return name;
  }
  name(node?: Obj) {
    const hint = typeof node?.id === 'string' ? node.id.replace(/[^A-Za-z0-9_]/g, '_') : '';
    let value = hint && /^[A-Za-z_]/.test(hint) ? hint : `element${++this.counter}`;
    while (this.variables.has(value) || !portableIdentifier(value)) value = `element${++this.counter}`;
    this.variables.add(value);
    return value;
  }
  notes(node: Obj | undefined, placement: 'before' | 'after') {
    for (const note of this.annotations.notes) {
      const matches = node
        ? note.target.kind === 'node' && note.target.nodeId === node.id
        : note.target.kind === 'document';
      if (matches && note.placement === placement) this.add(emitNote(note, this.target, this.indent));
    }
  }
  enumValue(typeName: string, token: any, path: string): string {
    const meta = api.dotnet[typeName];
    if (typeName === 'VerticalAlignment')
      token = ({ top: 'start', middle: 'center', bottom: 'end' } as Obj)[token] || token;
    if (typeof token === 'number') return `(${typeName})${token}`;
    if (Array.isArray(token)) return token.map(t => this.enumValue(typeName, t, path)).join(' | ');
    const member = Object.keys(meta?.enumMembers || {}).find(k => normalized(k) === normalized(token));
    if (!member) throw new MappingError(path, `No ${typeName} member maps to ${quote(String(token))}.`);
    return `${this.imp(typeName)}.${member}`;
  }
  length(value: any): string {
    if (typeof value === 'number') return `${value}f`;
    if (typeof value === 'string') return `Units.Parse(${quote(value)})`;
    const unit = ({ pt: 'Point', in: 'Inch', cm: 'Centimeter', mm: 'Millimeter' } as Obj)[value.unit];
    return `Units.ToPoints(${value.value}f, Unit.${unit})`;
  }
  color(value: string): string {
    const match = /^([a-z]+)-(\d+)$/.exec(value);
    return match ? `ColorPalette.${pascal(match[1])}[${match[2]}]` : `Color.FromHex(${quote(value)})`;
  }
  spacing(value: any, type: string): string {
    if (typeof value === 'number' || typeof value === 'string' || (object(value) && 'unit' in value))
      return `new ${type}(${this.length(value)})`;
    let sides;
    if (Array.isArray(value)) sides = value.length === 2 ? [value[0], value[1], value[0], value[1]] : value;
    else if (type === 'Border' && value.width !== undefined) return `new Border(${this.length(value.width)})`;
    else sides = ['left', 'top', 'right', 'bottom'].map(k => value[k] ?? 0);
    return `new ${type}(${sides.map((v: any) => this.length(v)).join(', ')})`;
  }
  csValue(value: any, type: string, path: string): string {
    if (value === null || value === undefined || value === 'unlimited') return 'null';
    type = type.replace(/\?$/, '');
    const short = type.replace(/^BonniePDF\./, '');
    if (type === 'System.String') return quote(String(value));
    if (type === 'System.Boolean') return String(value);
    if (type === 'System.Single') return this.length(value);
    if (type === 'System.Double') return `${value}d`;
    if (type === 'System.Decimal') return `${value}m`;
    if (['System.Int32', 'System.Int64', 'System.UInt32'].includes(type)) return String(value);
    if (short === 'Color') return this.color(value);
    if (short === 'Thickness' || short === 'Border') return this.spacing(value, short);
    if (short === 'BorderColors')
      return typeof value === 'string'
        ? `new BorderColors(${this.color(value)})`
        : `new BorderColors(${['left', 'top', 'right', 'bottom'].map(k => (value[k] === undefined ? 'null' : this.color(value[k]))).join(', ')})`;
    if (short === 'PdfSize')
      return typeof value === 'string'
        ? `PdfSize.${pascal(value)}`
        : `new PdfSize(${value.width}f, ${value.height}f${value.name === undefined ? '' : `, ${quote(value.name)}`})`;
    if (type === 'System.DateTimeOffset') return `DateTimeOffset.Parse(${quote(value)}, CultureInfo.InvariantCulture)`;
    if (api.dotnet[short]?.kind === 'enum') return this.enumValue(short, value, path);
    const dictionary = /^(?:IReadOnlyDictionary|IDictionary|Dictionary)<System.String,(.+)>$/.exec(type);
    if (dictionary)
      return `new Dictionary<string, ${this.csType(dictionary[1])}> { ${Object.entries(value)
        .map(([key, item]) => `[${quote(key)}] = ${this.csValue(item, dictionary[1], path + '/' + key)}`)
        .join(', ')} }`;
    const array = type.endsWith('[]')
      ? type.slice(0, -2)
      : /^(?:IList|IReadOnlyList|List|IEnumerable)<(.+)>$/.exec(type)?.[1];
    if (array)
      return `new ${type.startsWith('List<') ? `List<${this.csType(array)}>` : this.csType(array) + '[]'} { ${(value as any[]).map((item, index) => this.csValue(item, array, path + '/' + index)).join(', ')} }`;
    if (api.dotnet[short] && object(value)) return this.csObject(short, value, path);
    throw new MappingError(path, `Unsupported public property type ${type}.`);
  }
  csType(type: string): string {
    return (
      (
        {
          'System.String': 'string',
          'System.Single': 'float',
          'System.Double': 'double',
          'System.Int32': 'int',
          'System.Byte': 'byte',
        } as Obj
      )[type] || type.replace(/^BonniePDF\./, '')
    );
  }
  csObject(
    type: string,
    value: Obj,
    path: string,
    skip: Set<string> = new Set(),
    ctor = '',
    extra: Record<string, string> = {}
  ): string {
    const meta = api.dotnet[type];
    if (!meta) throw new MappingError(path, `Public class ${type} is unavailable.`);
    const fields: string[] = [];
    const schemaName = Object.entries(typeAliases).find(([, publicName]) => publicName === type)?.[0] || type;
    const order = Object.keys(api.schemas[schemaName]?.properties || {});
    for (const [key, item] of Object.entries(value).sort(([a], [b]) => order.indexOf(a) - order.indexOf(b))) {
      if (['type', 'id'].includes(key) || key.startsWith('_') || skip.has(key)) continue;
      const name = key === 'pdfVersion' ? 'Version' : pascal(key);
      const property = meta.properties[name];
      if (!property?.writable)
        throw new MappingError(path + '/' + key, `${type}.${name} is not a writable public property.`);
      fields.push(`${name} = ${this.csValue(item, property.type, path + '/' + key)}`);
    }
    fields.push(...Object.entries(extra).map(([key, expression]) => `${pascal(key)} = ${expression}`));
    if (
      object(value.border) &&
      value.border.color &&
      value.borderColors === undefined &&
      meta.properties.BorderColors?.writable
    )
      fields.push(`BorderColors = new BorderColors(${this.color(value.border.color)})`);
    return `new ${type}(${ctor})${fields.length ? ` { ${fields.join(', ')} }` : ''}`;
  }
  tsValue(value: any, path: string, key?: string, schema?: Obj): string {
    const enumName: string | undefined = (
      {
        pdfVersion: 'PdfVersion',
        algorithm: 'EncryptionAlgorithm',
        relationship: 'AttachmentRelationship',
        symbology: 'BarcodeSymbology',
        semanticRole: 'SemanticRole',
        role: 'SemanticRole',
      } as Obj
    )[key || ''];
    if (enumName && typescriptEnumNames.has(enumName)) return this.enumValue(enumName, value, path);
    if (schema?.$ref === '#/$defs/DateTime') return `new Date(${quote(value)})`;
    if (Array.isArray(value))
      return `[${value.map((item, index) => this.tsValue(item, path + '/' + index, undefined, schema?.items)).join(', ')}]`;
    if (object(value)) {
      if (schema?.$ref === '#/$defs/BorderColors') {
        const color = (item: string | undefined) => {
          if (item === undefined) return 'undefined';
          const palette = /^([a-z]+)-(\d+)$/.exec(item);
          return palette
            ? `${this.imp('ColorPalette')}.${palette[1]}[${palette[2]}]`
            : `${this.imp('Color')}.fromHex(${quote(item)})`;
        };
        return `new ${this.imp('BorderColors')}(${['left', 'top', 'right', 'bottom'].map(key => color(value[key])).join(', ')})`;
      }
      if (typeof value.type === 'string' && api.elements.includes(value.type)) return this.element(value, path);
      const shape = schema?.$ref ? api.schemas[schema.$ref.split('/').pop()] : schema;
      return `{ ${Object.entries(value)
        .map(([k, v]) => `${quote(k)}: ${this.tsValue(v, path + '/' + k, k, shape?.properties?.[k])}`)
        .join(', ')} }`;
    }
    return typeof value === 'string' ? quote(value) : JSON.stringify(value);
  }
  tsOptions(type: string, node: Obj, path: string, skip: Set<string>, extra: Record<string, string> = {}): string {
    const props = api.schemas[type]?.properties || {};
    const fields = Object.entries(node)
      .filter(([key]) => !['type', 'id'].includes(key) && !key.startsWith('_') && !skip.has(key))
      .map(([key, value]) => {
        if (!props[key]) throw new MappingError(path + '/' + key, `Unmapped ${type} property ${key}.`);
        return `${quote(key === 'pdfVersion' ? 'version' : key)}: ${key === 'orientation' && (type.includes('Chart') || type === 'Line') ? this.enumValue(type === 'Line' ? 'LineOrientation' : 'ChartOrientation', value, path + '/' + key) : this.tsValue(value, path + '/' + key, key, props[key])}`;
      });
    fields.push(...Object.entries(extra).map(([key, value]) => `${key}: ${value}`));
    return `{ ${fields.join(', ')} }`;
  }
  element(node: Obj, path: string): string {
    const type = node.type;
    if (!api.elements.includes(type)) throw new MappingError(path, `Unsupported definition element ${type}.`);
    const name = this.name(node),
      extra: Record<string, string> = {},
      after: string[] = [];
    const skip = new Set(slots);
    if (node.child !== undefined) extra.child = this.element(node.child, path + '/child');
    if (node.primary !== undefined) extra.primaryLayer = this.element(node.primary, path + '/primary');
    const children = (node.children || []).map((child: Obj, i: number) => ({
      value: this.element(child.element || child, `${path}/children/${i}${child.element ? '/element' : ''}`),
      weight: child.element ? child.weight : undefined,
    }));
    if (!this.cs && ['VerticalStack', 'SemanticGroup'].includes(type))
      extra.children = `[${children.map((c: Obj) => c.value).join(', ')}]`;
    else
      for (const child of children)
        after.push(
          `${name}.${this.cs ? 'Add' : 'add'}(${child.value}${child.weight === undefined ? '' : `, ${child.weight}${this.cs ? 'f' : ''}`});`
        );
    for (const [slot, method] of [
      ['backgrounds', 'addBackground'],
      ['foregrounds', 'addForeground'],
    ])
      for (const [i, child] of (node[slot] || []).entries())
        after.push(`${name}.${this.cs ? pascal(method) : method}(${this.element(child, `${path}/${slot}/${i}`)});`);
    if (['Table', 'Grid'].includes(type)) {
      skip.add('columns');
      if (!this.cs && node.columns !== undefined) extra.columns = JSON.stringify(node.columns);
      for (const [slot, method] of [
        ['header', 'addHeader'],
        ['rows', 'addRow'],
        ['footer', 'addFooter'],
      ])
        for (const [i, row] of (node[slot] || []).entries())
          after.push(`${name}.${this.cs ? pascal(method) : method}(${this.row(row, `${path}/${slot}/${i}`)});`);
    }
    if (type === 'Image') extra.imageData = `resources[${quote(node.resource)}]`;
    if (type === 'Svg' && node.resource)
      extra.svgData = this.cs
        ? `Encoding.UTF8.GetString(resources[${quote(node.resource)}])`
        : `new TextDecoder().decode(resources[${quote(node.resource)}])`;
    if (type === 'RichText') {
      for (const [i, span] of node.spans.entries()) {
        const method = span.lineBreak ? 'lineBreak' : span.link ? 'link' : 'span';
        const style = span.style
          ? this.cs
            ? this.csObject('TextStyle', span.style, `${path}/spans/${i}/style`)
            : `new ${this.imp('TextStyle')}(${this.tsValue(span.style, `${path}/spans/${i}/style`, undefined, { $ref: '#/$defs/TextStyle' })})`
          : this.cs
            ? '(TextStyle?)null'
            : 'undefined';
        const args = span.lineBreak ? '' : `${quote(span.text)}${span.link ? `, ${quote(span.link)}` : ''}, ${style}`;
        after.push(`${name}.${this.cs ? pascal(method) : method}(${args});`);
      }
      if (node.defaultStyle && !this.cs) {
        skip.add('defaultStyle');
        after.unshift(
          `${name}.defaultStyle = new ${this.imp('TextStyle')}(${this.tsValue(node.defaultStyle, path + '/defaultStyle', undefined, { $ref: '#/$defs/TextStyle' })});`
        );
      }
    }
    if (['OrderedList', 'UnorderedList'].includes(type)) {
      const strings = node.items.filter((item: unknown) => typeof item === 'string');
      if (!this.cs) extra.items = JSON.stringify(strings);
      else for (const text of strings) after.push(`${name}.AddItem(${quote(text)});`);
      for (const [i, item] of node.items.entries())
        if (typeof item !== 'string')
          after.push(
            `${name}.${this.cs ? 'AddNestedList' : 'addNestedList'}(${this.element(item, `${path}/items/${i}`)});`
          );
    }
    for (const section of this.annotations.sections.filter(s => s.nodeIds[0] === node.id))
      this.add(
        emitNote(
          {
            id: section.id,
            target: { kind: 'document' },
            placement: 'before',
            text: section.label.replace(/[\r\n\u2028\u2029]/g, ' '),
          },
          this.target,
          this.indent
        )
      );
    this.notes(node, 'before');
    const startLine = this.lines.length + 1;
    if (this.cs) {
      let ctor = '';
      if (['Table', 'Grid'].includes(type))
        ctor = `new float[] { ${(node.columns || []).map((n: number) => n + 'f').join(', ')} }`;
      if (type === 'PageNumberOf') {
        ctor = quote(node.anchorTarget);
        skip.add('anchorTarget');
      }
      if (type === 'Section') {
        ctor = quote(node.anchorId);
        skip.add('anchorId');
      }
      if (type === 'SectionLink') {
        ctor = `${quote(node.text)}, ${quote(node.anchorTarget)}`;
        skip.add('text');
        skip.add('anchorTarget');
      }
      if (type === 'Hyperlink') {
        ctor = node.uri !== undefined ? `${quote(node.uri)}, ${quote(node.text)}` : quote(node.text);
        skip.add('uri');
        skip.add('text');
      }
      if (type === 'SemanticGroup') {
        ctor = this.enumValue('SemanticRole', node.role, path + '/role');
        skip.add('role');
      }
      const base = this.csObject(
        type,
        node,
        path,
        skip,
        ctor,
        type === 'Heading' && node.tocIdentifier === undefined ? { tocIdentifier: '""' } : {}
      );
      this.add(`${this.indent}var ${name} = ${base};`);
      for (const [key, value] of Object.entries(extra)) this.add(`${this.indent}${name}.${pascal(key)} = ${value};`);
    } else
      this.add(
        `${this.indent}const ${name} = new ${this.imp(type)}(${this.tsOptions(type, node, path, skip, extra)});`
      );
    after.forEach(line => this.add(this.indent + line));
    this.notes(node, 'after');
    this.sourceMap.push({
      language: this.target,
      nodeId: node.id,
      definitionPath: path,
      symbolName: name,
      startLine,
      endLine: this.lines.length,
    });
    return name;
  }
  row(input: any, path: string): string {
    const row = Array.isArray(input) ? { cells: input } : input;
    const cells = row.cells.map((cell: any, i: number) => {
      const cellPath = `${path}/cells/${i}`;
      if (typeof cell === 'string') cell = { type: 'TableCell', content: { type: 'TextBlock', text: cell } };
      if (cell.type !== 'TableCell') cell = { type: 'TableCell', content: cell };
      const content = typeof cell.content === 'string' ? { type: 'TextBlock', text: cell.content } : cell.content;
      const value = this.element(content, cellPath + '/content');
      return this.cs
        ? this.csObject('TableCell', cell, cellPath, new Set(['content']), '', { content: value })
        : `new ${this.imp('TableCell')}(${this.tsOptions('TableCell', cell, cellPath, new Set(['content']), { content: value })})`;
    });
    return this.cs
      ? this.csObject('TableRow', row, path, new Set(['cells']), '', {
          cells: `new TableCell[] { ${cells.join(', ')} }`,
        })
      : `new ${this.imp('TableRow')}(${this.tsOptions('TableRow', row, path, new Set(['cells']), { cells: `[${cells.join(', ')}]` })})`;
  }
}

/** Generate native source. Unsupported mappings produce diagnostics and no partial files. */
export async function generateCode(input: unknown, options: GenerateOptions = {}): Promise<GenerationResult> {
  const result: GenerationResult = { generatorVersion: '0.1.0', files: [], diagnostics: [], sourceMap: [] };
  if (!object(options))
    return {
      ...result,
      diagnostics: [{ code: 'invalid-options', path: '/options', message: 'Expected generation options.' }],
    };
  for (const key of Object.keys(options))
    if (!['targets', 'documentName', 'namespace', 'annotations', 'signal'].includes(key))
      result.diagnostics.push({
        code: 'unknown-option',
        path: '/options/' + key,
        message: 'This generation option/profile is not supported.',
      });
  const validation = validateDefinition(input, { strict: true });
  for (const issue of [...validation.errors, ...(validation.warnings || [])])
    result.diagnostics.push({ code: issue.code, path: issue.path, message: issue.message });
  if (result.diagnostics.length) return result;
  const definition = input as DocumentDefinition;
  const annotations = options.annotations || emptyAnnotations();
  for (const issue of validateAnnotations(annotations, definition).issues) result.diagnostics.push(issue);
  const name = options.documentName || 'DesignedDocument',
    namespace = options.namespace || 'GeneratedDocuments';
  if (typeof name !== 'string' || !portableIdentifier(name) || api.dotnet[name])
    result.diagnostics.push({
      code: 'invalid-identifier',
      path: '/options/documentName',
      message: 'Use a portable document identifier that does not shadow a BonniePDF type.',
    });
  if (typeof namespace !== 'string' || !namespace.split('.').every(portableIdentifier))
    result.diagnostics.push({
      code: 'invalid-identifier',
      path: '/options/namespace',
      message: 'Use a portable namespace.',
    });
  if (annotations.sections.some(s => s.helperName))
    result.diagnostics.push({
      code: 'unsupported-helper-section',
      path: '/annotations/sections',
      message: 'Helper extraction is not implemented for this profile yet.',
    });
  if (result.diagnostics.length) return result;
  const targets = options.targets || ['typescript', 'csharp'];
  if (!Array.isArray(targets) || !targets.length || targets.some(t => !['typescript', 'csharp'].includes(t)))
    return {
      ...result,
      diagnostics: [{ code: 'unsupported-target', path: '/options/targets', message: 'Choose TypeScript and/or C#.' }],
    };
  for (const target of [...new Set(targets)]) {
    try {
      const emitter = new Emitter(target, annotations, options);
      emitter.notes(undefined, 'before');
      // Document assembly is completed by the profile-specific builder below.
      const built = assemble(emitter, definition as Obj, name, namespace);
      emitter.notes(undefined, 'after');
      const content = await formatSource(built(), target);
      updateSourceRanges(content, emitter.sourceMap);
      result.files.push({
        language: target,
        path: target === 'csharp' ? `${name}.Generated.cs` : `${name}.generated.ts`,
        content,
      });
      result.sourceMap.push(...emitter.sourceMap);
    } catch (error) {
      if (options.signal?.aborted) throw error;
      result.diagnostics.push({
        target,
        code: 'unsupported-mapping',
        path: error instanceof MappingError ? error.path : '',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
  if (result.diagnostics.length) {
    result.files = [];
    result.sourceMap = [];
  }
  return result;
}
function assemble(emitter: Emitter, definition: Obj, name: string, namespace: string): () => string {
  const cs = emitter.cs,
    indent = emitter.indent;
  const settings = definition.settings || {};

  const first = definition.pages[0];

  const skip = new Set(['pageChrome', 'namedDestinations']);
  if (cs) {
    emitter.add(
      `${indent}var documentSettings = ${emitter.csObject('DocumentSettings', settings, '/settings', skip)};`
    );
    emitter.add(
      `${indent}var metadata = ${emitter.csObject('DocumentMetadata', definition.metadata || {}, '/metadata')};`
    );
    if (first.size !== undefined || first.orientation !== undefined) {
      emitter.add(`${indent}var defaultPageSize = documentSettings.PageSize;`);
      emitter.add(`${indent}var defaultOrientation = documentSettings.Orientation;`);
      emitter.add(`${indent}var defaultPreserveDimensions = documentSettings.PreservePageDimensions;`);
      if (first.size !== undefined)
        emitter.add(
          `${indent}documentSettings.PageSize = ${emitter.csValue(first.size, 'BonniePDF.PdfSize', '/pages/0/size')};`
        );
      if (first.orientation !== undefined) {
        emitter.add(
          `${indent}documentSettings.Orientation = ${emitter.enumValue('PageOrientation', first.orientation, '/pages/0/orientation')};`
        );
        emitter.add(`${indent}documentSettings.PreservePageDimensions = false;`);
      }
    }
    emitter.add(`${indent}var doc = new Document(documentSettings, metadata);`);
    if (first.size !== undefined || first.orientation !== undefined)
      for (const [key, expression] of [
        ['PageSize', 'defaultPageSize'],
        ['Orientation', 'defaultOrientation'],
        ['PreservePageDimensions', 'defaultPreserveDimensions'],
      ])
        emitter.add(`${indent}documentSettings.${key} = ${expression};`);
    if (settings.namedDestinations)
      emitter.add(
        `${indent}documentSettings.NamedDestinations = ${emitter.csValue(settings.namedDestinations, 'IDictionary<System.String,System.Int32>', '/settings/namedDestinations')};`
      );
    if (settings.encryption) {
      emitter.add(
        `${indent}documentSettings.Encryption.OwnerPassword = runtimeSecrets?.Owner ?? throw new ArgumentException("Supply an owner password.");`
      );
      emitter.add(`${indent}documentSettings.Encryption.UserPassword = runtimeSecrets?.User ?? "";`);
    }
  } else {
    emitter.imp('Document');
    emitter.imp('type DocumentSettingsOptions');
    emitter.add(
      `${indent}const documentSettings: DocumentSettingsOptions = ${emitter.tsOptions('Settings', settings, '/settings', skip)};`
    );
    const construction = {
      ...(first.size === undefined ? {} : { pageSize: emitter.tsValue(first.size, '/pages/0/size') }),
      ...(first.orientation === undefined
        ? {}
        : { orientation: quote(first.orientation), preservePageDimensions: 'false' }),
    };
    const initial = Object.keys(construction).length
      ? `{ ...documentSettings, ${Object.entries(construction)
          .map(([k, v]) => k + ': ' + v)
          .join(', ')} }`
      : 'documentSettings';
    emitter.add(
      `${indent}const doc = new Document({ settings: ${initial}, metadata: ${emitter.tsOptions('Metadata', definition.metadata || {}, '/metadata', new Set())} });`
    );
    if (Object.keys(construction).length) {
      emitter.imp('DocumentSettings');
      emitter.add(`${indent}const baseline = new DocumentSettings(documentSettings);`);
      for (const key of ['pageSize', 'orientation', 'preservePageDimensions'])
        emitter.add(`${indent}doc.settings.${key} = baseline.${key};`);
    }
    if (settings.namedDestinations)
      emitter.add(
        `${indent}doc.settings.namedDestinations = new Map(Object.entries(${JSON.stringify(settings.namedDestinations)}));`
      );
    if (settings.encryption) {
      emitter.add(`${indent}if (!runtimeSecrets?.owner) throw new Error("Supply an owner password.");`);
      emitter.add(`${indent}doc.settings.encryption!.ownerPassword = runtimeSecrets.owner;`);
      emitter.add(`${indent}doc.settings.encryption!.userPassword = runtimeSecrets.user || "";`);
    }
  }
  for (const [key, resource] of Object.entries(definition.resources || {}) as [string, Obj][]) {
    emitter.add(
      `${indent}if (${cs ? `!resources.ContainsKey(${quote(key)})` : `!resources[${quote(key)}]`}) throw new ${cs ? 'ArgumentException' : 'Error'}(${quote('Supply resource ' + key + '.')});`
    );
    if (resource.kind === 'font') {
      if (cs)
        emitter.add(
          `${indent}doc.Fonts.Add(resources[${quote(key)}], ${resource.family === undefined ? 'null' : quote(resource.family)}, ${resource.weight === undefined ? 'null' : emitter.enumValue('FontWeight', resource.weight, '/resources/' + key + '/weight')}, ${resource.italic === undefined ? 'null' : resource.italic});`
        );
      else
        emitter.add(
          `${indent}doc.fonts.add(resources[${quote(key)}], ${JSON.stringify(Object.fromEntries(['family', 'weight', 'italic'].filter(k => resource[k] !== undefined).map(k => [k, resource[k]])))});`
        );
    }
  }
  for (const [slot, template] of Object.entries(settings.pageChrome || {}) as [string, Obj][]) {
    const property = (
      {
        header: 'headerTemplate',
        footer: 'footerTemplate',
        background: 'pageBackground',
        foreground: 'pageForeground',
      } as Obj
    )[slot];
    const entries = Object.entries(template).map(([variant, node]) => [
      variant,
      emitter.element(node as Obj, `/settings/pageChrome/${slot}/${variant}`),
    ]);
    if (cs)
      emitter.add(
        `${indent}doc.Settings.${pascal(property)} = PageTemplate.FromElements(${entries.map(([key, value]) => `${key === 'default' ? '@default' : key}: ${value}`).join(', ')});`
      );
    else
      emitter.add(
        `${indent}doc.settings.${property} = ${emitter.imp('pageTemplate')}({ ${entries.map(([key, value]) => `${key}: ${value}`).join(', ')} });`
      );
  }
  if (first.margin !== undefined) {
    if (cs)
      emitter.add(
        `${indent}doc.SetCurrentPageSettings(doc.Pages[0].Size, doc.Pages[0].Width > doc.Pages[0].Height ? PageOrientation.Landscape : PageOrientation.Portrait, ${emitter.length(first.margin)});`
      );
    else
      emitter.add(
        `${indent}doc.setCurrentPageSettings(doc.pages[0].size, doc.pages[0].width > doc.pages[0].height ? ${emitter.imp('PageOrientation')}.Landscape : PageOrientation.Portrait, ${emitter.imp('toLength')}(${emitter.tsValue(first.margin, '/pages/0/margin')}) );`
      );
  }
  for (const [index, page] of definition.pages.entries() as IterableIterator<[number, Obj]>) {
    const pageName = emitter.name({ id: `page${index + 1}` });
    if (index === 0) emitter.add(`${indent}${cs ? 'var' : 'const'} ${pageName} = doc.${cs ? 'Pages' : 'pages'}[0];`);
    else {
      if (cs) {
        let size =
          page.size === undefined
            ? 'documentSettings.GetOrientedPageSize()'
            : emitter.csValue(page.size, 'BonniePDF.PdfSize', `/pages/${index}/size`);
        if (page.orientation !== undefined) {
          if (page.size === undefined) size = 'documentSettings.PageSize';
          size += `.GetOrientedSize(${emitter.enumValue('PageOrientation', page.orientation, `/pages/${index}/orientation`)})`;
        } else if (page.size !== undefined && !settings.preservePageDimensions)
          size += '.GetOrientedSize(documentSettings.Orientation)';
        emitter.add(
          `${indent}var ${pageName} = doc.AddPage(${size}${page.margin === undefined ? '' : `, ${emitter.length(page.margin)}`});`
        );
      } else
        emitter.add(
          `${indent}const ${pageName} = doc.addPage({ ${['size', 'orientation', 'margin']
            .filter(k => page[k] !== undefined)
            .map(
              k =>
                `${k}: ${k === 'size' ? (typeof page.size === 'string' ? `${emitter.imp('PdfSize')}.${page.size}` : `new ${emitter.imp('PdfSize')}(${page.size.width}, ${page.size.height}${page.size.name === undefined ? '' : `, ${quote(page.size.name)}`})`) : emitter.tsValue(page[k], `/pages/${index}/${k}`)}`
            )
            .join(', ')} });`
        );
    }
    for (const [key, property] of [
      ['margins', 'margins'],
      ['pageColor', 'pageColor'],
    ] as const)
      if (page[key] !== undefined)
        emitter.add(
          `${indent}${pageName}.${cs ? pascal(property) : property} = ${cs ? emitter.csValue(page[key], key === 'margins' ? 'BonniePDF.Thickness' : 'BonniePDF.Color', `/pages/${index}/${key}`) : emitter.tsValue(page[key], `/pages/${index}/${key}`)};`
        );
    for (const [key, property] of [
      ['background', 'pageBackground'],
      ['foreground', 'pageForeground'],
    ])
      if (page[key]) {
        const element = emitter.element(page[key], `/pages/${index}/${key}`);
        emitter.add(`${indent}${pageName}.${cs ? pascal(property) : property} = ${element};`);
      }
    for (const [i, node] of page.content.entries()) {
      const element = emitter.element(node, `/pages/${index}/content/${i}`);
      emitter.add(`${indent}${pageName}.${cs ? 'Add' : 'add'}(${element});`);
    }
  }
  for (const [index, attachment] of (definition.attachments || []).entries() as IterableIterator<[number, Obj]>) {
    const path = `/attachments/${index}`;
    if (cs)
      emitter.add(
        `${indent}doc.Attach(${emitter.csObject('FileAttachment', attachment, path, new Set(['resource']), '', { content: `resources[${quote(attachment.resource)}]` })});`
      );
    else
      emitter.add(
        `${indent}doc.attach(${emitter.tsOptions('Attachment', attachment, path, new Set(['resource']), { content: `resources[${quote(attachment.resource)}]` })});`
      );
  }
  emitter.add(`${indent}return doc;`);
  return () => {
    const prefix = cs
      ? [
          '// <auto-generated> BonniePDF codegen 0.1.0 </auto-generated>',
          '#nullable enable',
          'using System;',
          'using System.Collections.Generic;',
          'using System.Globalization;',
          'using System.Text;',
          'using BonniePDF;',
          '',
          `namespace ${namespace};`,
          '',
          `public static class ${name}`,
          '{',
          '    public sealed record RuntimeSecrets(string Owner, string User = "");',
          '    public static Document Generate(IReadOnlyDictionary<string, byte[]> resources, RuntimeSecrets? runtimeSecrets = null)',
          '    {',
        ]
      : [
          '// <auto-generated> BonniePDF codegen 0.1.0 </auto-generated>',
          `import { ${[...emitter.imports].sort().join(', ')} } from "@bonniepdf/core";`,
          '',
          'export interface RuntimeSecrets { owner?: string; user?: string }',
          'export function generate(resources: Readonly<Record<string, Uint8Array>> = {}, runtimeSecrets: RuntimeSecrets = {}): Document {',
        ];
    emitter.sourceMap.forEach(range => {
      range.startLine += prefix.length;
      range.endLine += prefix.length;
    });
    return [...prefix, ...emitter.lines, ...(cs ? ['    }', '}'] : ['}']), ''].join('\n');
  };
}
