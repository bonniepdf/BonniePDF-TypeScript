import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { fromDefinition, toDefinition, validateDefinition, DefinitionError } from '../../src/definition';
import { ELEMENT_DESCRIPTION as D } from '../../src/Definition/ElementDescription';
import type { KeySpec, ShapeSpec } from '../../src/Definition/ElementDescriptionTypes';
import { pageTemplate } from '../../src/Configuration/PageTemplate';
import { markDebugSource } from '../../src/Rendering/DebugSource';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { ShowIf } from '../../src/Elements/Layout/Pagination/ShowIf';
import { Svg } from '../../src/Elements/Media/Svg';
import { Image } from '../../src/Elements/Media/Image';
import { Container } from '../../src/Elements/Layout/Container';
import { DEFINITION_FIXTURES } from './fixtures.generated';
import { PNG, maskedPdf, stateDiff } from './helpers';

/**
 * The Document Definition writer (spec 15 §11, §14). Three kinds of check:
 *
 * - every valid fixture reads, writes, and reads back to a document with identical state and identical PDF bytes;
 * - every key of every element, with every token it accepts, survives read → write → read (generated from the
 *   element description, so a new key is covered the day it is added);
 * - the constructs a definition cannot express are reported, not approximated.
 *
 * Mirrors the .NET DocumentDefinitionWriterTests.
 */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/** True when everything written is what was given; a nested value may leave out members equal to their defaults. */
function isSubset(written: unknown, given: unknown): boolean {
  if (isObj(written) && isObj(given)) return Object.keys(written).every(k => isSubset(written[k], given[k]));
  if (Array.isArray(written) && Array.isArray(given))
    return written.length === given.length && written.every((w, i) => isSubset(w, given[i]));
  return JSON.stringify(written) === JSON.stringify(given);
}

async function roundTrip(definition: unknown) {
  const doc1 = await fromDefinition(definition);
  const first = await toDefinition(doc1);
  const doc2 = await fromDefinition(first.definition);
  const second = await toDefinition(doc2);
  return { doc1, doc2, first, second };
}

const png64 = Buffer.from(PNG).toString('base64');

describe('round trip of the valid fixtures', () => {
  for (const [name, fixture] of Object.entries(DEFINITION_FIXTURES.valid)) {
    it(`${name}: read, write, read gives the same document`, async () => {
      const { doc1, doc2, first, second } = await roundTrip(fixture);

      expect(validateDefinition(first.definition).errors).toEqual([]);
      expect(stateDiff(doc1, doc2)).toBeUndefined();

      // The canonical form is stable: writing what was written changes nothing.
      expect(JSON.stringify(second.definition)).toBe(JSON.stringify(first.definition));

      // Same bytes, masking the trailer id and the dates a document gives itself.
      expect(maskedPdf(await doc2.generateBytesAsync())).toBe(maskedPdf(await doc1.generateBytesAsync()));
    });

    const canonical = fixture._expect?.canonical;
    if (canonical) {
      it(`${name}: the canonical form is the one the fixture pins`, async () => {
        const doc = await fromDefinition(fixture);
        const { definition } = await toDefinition(doc);
        expect(definition).toEqual(canonical);
      });
    }
  }
});

// ── every key of every element ──────────────────────────────────────────────

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

function keysOf(spec: ShapeSpec): Record<string, KeySpec> {
  const merged: Record<string, KeySpec> = {};
  for (const use of spec.uses ?? []) Object.assign(merged, D.mixins[use]);
  return Object.assign(merged, spec.keys);
}

/** Values to try for one key: canonical spellings, so what comes back can be compared to what went in. */
function samples(key: string, ks: KeySpec): unknown[] {
  const [head, ...rest] = ks.kind.split(':');
  const arg = rest.join(':');
  switch (head) {
    case 'string':
      return [
        {
          fontName: 'Times-Roman',
          fontFamily: 'Times',
          uri: 'https://example.com/a',
          anchorTarget: 'target',
          anchorId: 'anchor-x',
          tocIdentifier: 'toc-x',
        }[key] ?? 'sample',
      ];
    case 'boolean':
      return [true, false];
    case 'integer':
    case 'number': {
      const min = ks.min ?? 0;
      if (ks.max !== undefined && ks.max <= 1) return [0.5];
      const v = head === 'integer' ? min + 2 : min + 2.5;
      return [ks.max !== undefined ? Math.min(v, ks.max) : v];
    }
    case 'length':
      return [13];
    case 'color':
      return ['#336699', '#33669980'];
    case 'spacing':
      return [4, { top: 1, left: 2 }];
    case 'border':
      return [3, { top: 1 }];
    case 'fontWeight':
      return ['bold', 650];
    case 'decoration':
      return ['underline', ['underline', 'overline']];
    case 'enum':
      return D.enums[arg].tokens;
    case 'chartNumberFormat':
      return ['N2', 'P1'];
    case 'dateTime':
      return ['2020-01-02T03:04:05.000Z'];
    case 'permissions':
      return ['none', ['print', 'copy']];
    case 'array':
      if (arg === 'string') return [['a', 'b']];
      if (arg === 'number') return [[1, 2]];
      if (arg === 'color') return [['#111111', '#222222']];
      return [];
    case 'map':
      return arg === 'string' ? [{ k: 'v' }] : [];
    case 'object': {
      const shape = D.shapes[arg] ?? D.objects[arg];
      if (arg === 'ChartData') return [];
      return [sampleObject(shape)];
    }
    default:
      return [];
  }
}

function sampleObject(shape: ShapeSpec): Obj {
  const out: Obj = {};
  const conflicts = new Set((shape.conflicts ?? []).flatMap(c => c.slice(1)));
  for (const [key, ks] of Object.entries(keysOf(shape))) {
    if (SLOT_KINDS.has(ks.kind.split(':')[0]) || conflicts.has(key)) continue;
    if (
      ks.kind.startsWith('object:') &&
      ks.kind !== 'object:TextStyle' &&
      ks.kind !== 'object:BorderColors' &&
      ks.kind !== 'object:Axis'
    )
      continue;
    const first = samples(key, ks)[0];
    if (first !== undefined) out[key] = first;
  }
  return out;
}

/** The smallest valid node of a type, with the definition-level things it refers to. */
function baseNode(type: string): Obj {
  const spec = D.elements[type];
  const node: Obj = { type };
  for (const [key, ks] of Object.entries(keysOf(spec))) {
    if (!ks.required) continue;
    const head = ks.kind.split(':')[0];
    if (head === 'element') node[key] = { type: 'Spacer' };
    else if (head === 'elements') node[key] = [{ type: 'Spacer' }];
    else if (head === 'stackChildren') node[key] = [{ type: 'Spacer' }];
    else if (head === 'listItems') node[key] = ['a'];
    else if (head === 'spans') node[key] = [{ text: 'a' }];
    else if (head === 'rows') node[key] = [['a']];
    else if (ks.kind === 'object:ChartData')
      node[key] = { series: [{ name: 's', dataPoints: [{ label: 'a', value: 1 }] }] };
    else if (key === 'role') node[key] = 'P';
    else if (key === 'headingIdentifiers') node[key] = ['h1'];
    else node[key] = samples(key, ks)[0];
  }
  if (type === 'Hyperlink') node.uri = 'https://example.com';
  if (type === 'Image') node.resource = 'img';
  if (type === 'Svg')
    node.svgData =
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>';
  return node;
}

function definitionAround(node: Obj): Obj {
  return {
    version: 1,
    minorVersion: 0,
    resources: { img: { kind: 'image', mediaType: 'image/png', data: png64 } },
    pages: [
      {
        content: [{ type: 'Section', anchorId: 'target' }, { type: 'Heading', text: 'H', tocIdentifier: 'h1' }, node],
      },
    ],
  };
}

describe('every key of every element survives read, write, read', () => {
  for (const type of Object.keys(D.elements)) {
    const spec = D.elements[type];
    const cases: [string, unknown][] = [];
    for (const [key, ks] of Object.entries(keysOf(spec))) {
      if (SLOT_KINDS.has(ks.kind.split(':')[0])) continue;
      for (const value of samples(key, ks)) cases.push([key, value]);
    }
    it(`${type}: ${cases.length} key/value cases`, async () => {
      const problems: string[] = [];
      for (const [key, value] of cases) {
        const node = { ...baseNode(type), [key]: value };
        // A choice between keys (fontName/fontFamily, uri/targetPageIndex) makes some pairings illegal.
        if (key === 'targetPageIndex') delete node.uri;
        if (key === 'fontFamily') delete node.fontName;
        if (key === 'resource' && type === 'Svg') delete node.svgData;
        if (key === 'svgData' && type === 'Svg') delete node.resource;
        const definition = definitionAround(node);
        if (!validateDefinition(definition).valid) continue;

        const label = `${type}.${key}=${JSON.stringify(value)}`;
        try {
          const { doc1, doc2, first, second } = await roundTrip(definition);
          const diff = stateDiff(doc1, doc2);
          if (diff) problems.push(`${label}: state differs at ${diff}`);
          if (JSON.stringify(second.definition) !== JSON.stringify(first.definition))
            problems.push(`${label}: the canonical form is not stable`);
          // Either the value is written back exactly, or it is the default and is left out.
          const written = (first.definition.pages[0] as Obj).content as Obj[];
          const back = written[written.length - 1] as Obj;
          if (key in back && !isSubset(back[key], value))
            problems.push(`${label}: written as ${JSON.stringify(back[key])}`);
        } catch (e) {
          problems.push(`${label}: ${(e as Error).message}`);
        }
      }
      expect(problems).toEqual([]);
    });
  }
});

// ── structure the generated test does not reach ─────────────────────────────

describe('slots and containers', () => {
  it('writes children, weights, layers, wrappers and page-level content', async () => {
    const definition = {
      version: 1,
      minorVersion: 0,
      settings: { pageSize: 'a5', orientation: 'landscape', margin: 30 },
      pages: [
        {
          content: [
            {
              type: 'HorizontalStack',
              widthDistribution: 'weighted',
              children: [
                { element: { type: 'TextBlock', text: 'left' }, weight: 2 },
                { type: 'TextBlock', text: 'right' },
              ],
            },
            {
              type: 'Layers',
              primary: { type: 'Container', padding: 6, child: { type: 'TextBlock', text: 'top' } },
              backgrounds: [{ type: 'Circle', diameter: 40, fillColor: '#eeeeee' }],
              foregrounds: [{ type: 'Line', length: 30 }],
            },
            { type: 'EnsureSpace', minHeight: 120, child: { type: 'TextBlock', text: 'kept together' } },
            { type: 'SemanticGroup', role: 'Sect', children: [{ type: 'TextBlock', text: 'g' }] },
            { type: 'PageBreak' },
          ],
        },
        {
          size: 'letter',
          orientation: 'portrait',
          margin: 20,
          pageColor: 'slate-100',
          background: { type: 'Spacer', height: 4 },
          foreground: { type: 'Spacer', height: 5 },
          content: [{ type: 'TextBlock', text: 'second' }],
        },
        { content: [] },
      ],
    };
    const { doc1, doc2, first } = await roundTrip(definition);
    expect(stateDiff(doc1, doc2)).toBeUndefined();
    const pages = first.definition.pages as Obj[];
    expect(pages).toHaveLength(3);
    expect(pages[0].size).toBeUndefined();
    expect(pages[1]).toMatchObject({ size: 'letter', orientation: 'portrait', margin: 20, pageColor: '#f1f5f9' });
    expect(pages[2]).toEqual({ content: [] });
    const stack = (pages[0].content as Obj[])[0];
    expect(stack.children).toEqual([
      { element: { type: 'TextBlock', text: 'left' }, weight: 2 },
      { type: 'TextBlock', text: 'right' },
    ]);
  });

  it('honours a margin stated on the first page, and writes it back', async () => {
    const definition = {
      version: 1,
      minorVersion: 0,
      settings: { margin: 50 },
      pages: [{ margin: 20, content: [{ type: 'TextBlock', text: 'x' }] }, { content: [] }],
    };
    const doc = await fromDefinition(definition);
    const exported = await doc.generateSvgDocumentAsync({ captureLayout: true });
    // The text starts at the page's own margin, not the document's.
    expect(exported.snapshot!.root.children[0].rects[0].x).toBe(20);
    const pages = (await toDefinition(doc)).definition.pages as Obj[];
    expect(pages[0].margin).toBe(20);
    expect(pages[1].margin).toBeUndefined();
  });

  it('writes table sections, spans, header cells and plain-text cells', async () => {
    const definition = {
      version: 1,
      minorVersion: 0,
      pages: [
        {
          content: [
            {
              type: 'Table',
              columns: [1, 2],
              header: [['Item', 'Cost']],
              rows: [
                ['Tea', { type: 'TableCell', content: 'Cheap', color: '#ff0000', columnSpan: 1 }],
                { cells: ['Coffee', { type: 'Circle', diameter: 4 }], backgroundColor: '#eeeeee', minHeight: 30 },
                [
                  { type: 'TableCell', content: { type: 'TextBlock', text: 'Total', fontSize: 14 }, isHeader: true },
                  '3',
                ],
              ],
              footer: [['Sum', '3']],
            },
            {
              type: 'RichText',
              defaultStyle: { fontSize: 10 },
              spans: [{ text: 'a', style: { fontWeight: 'bold' } }, { lineBreak: true }, { text: 'b' }],
            },
            {
              type: 'UnorderedList',
              items: ['one', { type: 'UnorderedList', items: ['nested'] }, 'two'],
            },
          ],
        },
      ],
    };
    const { doc1, doc2, first } = await roundTrip(definition);
    expect(stateDiff(doc1, doc2)).toBeUndefined();
    const table = ((first.definition.pages[0] as Obj).content as Obj[])[0];
    expect(table.header).toEqual([['Item', 'Cost']]);
    expect((table.rows as unknown[])[2]).toEqual([
      { type: 'TableCell', content: { type: 'TextBlock', text: 'Total', fontSize: 14 }, isHeader: true },
      '3',
    ]);
  });

  it('keeps an id that is a valid id, and leaves out one that is not', async () => {
    const doc = new Document();
    doc.add(markDebugSource(new TextBlock({ text: 'a' }), 'title'));
    doc.add(markDebugSource(new TextBlock({ text: 'b' }), 'not valid!'));
    doc.add(markDebugSource(new TextBlock({ text: 'c' }), 'title'));
    const { definition } = await toDefinition(doc);
    const content = (definition.pages[0] as Obj).content as Obj[];
    expect(content.map(n => n.id)).toEqual(['title', undefined, undefined]);
  });
});

// ── text: written only when set ─────────────────────────────────────────────

describe('text properties that were never set are not written', () => {
  it('omits font, size, colour, line height, decoration and alignment left to the defaults', async () => {
    const doc = new Document();
    doc.add(new TextBlock({ text: 'plain' }));
    doc.add(new TextBlock({ text: 'chosen', fontSize: 12, color: '#000000', alignment: 'left', lineHeight: 1.2 }));
    const { definition } = await toDefinition(doc);
    const [plain, chosen] = (definition.pages[0] as Obj).content as Obj[];
    expect(plain).toEqual({ type: 'TextBlock', text: 'plain' });
    // Set to the same value as the default: still written, because a default text style would not override it.
    expect(chosen).toMatchObject({ fontSize: 12, color: '#000000', alignment: 'left', lineHeight: 1.2 });
  });

  it('a default text style still reaches an element that did not set the value, after a round trip', async () => {
    const definition = {
      version: 1,
      minorVersion: 0,
      settings: { defaultTextStyle: { fontSize: 20, color: '#ff0000' } },
      pages: [
        {
          content: [
            { type: 'TextBlock', text: 'inherits' },
            { type: 'TextBlock', text: 'explicit', fontSize: 12 },
          ],
        },
      ],
    };
    const { doc1, doc2 } = await roundTrip(definition);
    expect(maskedPdf(await doc2.generateBytesAsync())).toBe(maskedPdf(await doc1.generateBytesAsync()));
  });
});

// ── document-level ──────────────────────────────────────────────────────────

describe('settings, metadata, resources and attachments', () => {
  it('round-trips a document that uses all of them', async () => {
    const font = new Uint8Array(
      (await import('node:fs')).readFileSync(new URL('../../assets/fonts/LiberationSans-Regular.ttf', import.meta.url))
    );
    const definition = {
      version: 1,
      minorVersion: 0,
      settings: {
        pageSize: { width: 300, height: 400 },
        margin: 24,
        pageColor: '#fafafa',
        pdfVersion: 'pdf-1.7',
        conformance: 'pdf/a-2b',
        language: 'en-GB',
        defaultZoom: 'fit-width',
        pageMode: 'use-outlines',
        hideToolbar: true,
        maxImageDpi: 150,
        defaultTextStyle: { fontFamily: 'Liberation Sans', fontSize: 11 },
        watermark: { text: 'DRAFT', opacity: 0.3 },
        pageLabel: { style: 'lowercase-roman', startAt: 3, prefix: 'p-' },
        namedDestinations: { start: 0 },
        bookmarks: [{ title: 'One', pageIndex: 0, children: [{ title: 'Nested', pageIndex: 0 }] }],
        facturX: {
          documentType: 'INVOICE',
          documentFileName: 'factur-x.xml',
          version: '1.0',
          conformanceLevel: 'BASIC',
        },
      },
      metadata: {
        title: 'T',
        author: 'A',
        creationDate: '2020-01-02T03:04:05.000Z',
        modifiedDate: '2021-01-02T03:04:05.000Z',
        customProperties: { Invoice: '42' },
      },
      resources: {
        logo: { kind: 'image', mediaType: 'image/png', data: png64 },
        body: {
          kind: 'font',
          mediaType: 'font/ttf',
          data: Buffer.from(font).toString('base64'),
          family: 'Liberation Sans',
          weight: 'normal',
          italic: false,
        },
        xml: { kind: 'attachment', mediaType: 'text/xml', data: Buffer.from('<x/>').toString('base64') },
      },
      attachments: [
        {
          resource: 'xml',
          fileName: 'factur-x.xml',
          relationship: 'alternative',
          mediaType: 'text/xml',
          description: 'invoice',
          creationDate: '2020-01-02T03:04:05.000Z',
          modificationDate: '2020-01-03T03:04:05.000Z',
        },
      ],
      pages: [
        {
          content: [
            { type: 'Image', resource: 'logo', width: 20 },
            { type: 'Heading', text: 'Hi', anchorId: 'a' },
          ],
        },
      ],
    };
    const { doc1, doc2, first, second } = await roundTrip(definition);
    expect(first.notes).toEqual([]);
    expect(stateDiff(doc1, doc2)).toBeUndefined();
    expect(JSON.stringify(second.definition)).toBe(JSON.stringify(first.definition));
    const written = first.definition as Obj;
    expect(Object.keys(written)).toEqual([
      'version',
      'minorVersion',
      'settings',
      'metadata',
      'resources',
      'attachments',
      'pages',
    ]);
    expect(Object.keys(written.resources as Obj)).toEqual(['font-1', 'image-1', 'attachment-1']);
    expect((written.metadata as Obj).creationDate).toBe('2020-01-02T03:04:05.000Z');
    expect(maskedPdf(await doc2.generateBytesAsync())).toBe(maskedPdf(await doc1.generateBytesAsync()));
  });

  it('reads and writes maxImageDpi "unlimited" as no cap', async () => {
    const definition = {
      version: 1,
      minorVersion: 0,
      settings: { maxImageDpi: 'unlimited' },
      pages: [{ content: [] }],
    };
    const doc = await fromDefinition(definition);
    expect(doc.settings.maxImageDpi).toBeNull();
    expect((await toDefinition(doc)).definition.settings).toEqual({ maxImageDpi: 'unlimited' });
    const capped = await fromDefinition({ ...definition, settings: { maxImageDpi: 150 } });
    expect((await toDefinition(capped)).definition.settings).toEqual({ maxImageDpi: 150 });
    expect(validateDefinition({ ...definition, settings: { maxImageDpi: 'lots' } }).errors).toMatchObject([
      { path: '/settings/maxImageDpi', code: 'invalid-value' },
    ]);
    expect(validateDefinition({ ...definition, settings: { maxImageDpi: 0 } }).errors).toMatchObject([
      { path: '/settings/maxImageDpi', code: 'invalid-value' },
    ]);
  });

  it('does not write the dates a document gave itself', async () => {
    const { definition } = await toDefinition(new Document());
    expect(definition.metadata).toBeUndefined();
  });

  it('puts identical bytes in one resource', async () => {
    const doc = new Document();
    doc.add(new Image({ imageData: PNG }));
    doc.add(new Image({ imageData: PNG.slice() }));
    const { definition } = await toDefinition(doc);
    expect(Object.keys(definition.resources as Obj)).toEqual(['image-1']);
  });

  it('asks the host to name a resource, and writes a ref with a sha256 when it does', async () => {
    const doc = new Document();
    doc.add(new Image({ imageData: PNG }));
    const named = await toDefinition(doc, { resourceRef: r => (r.kind === 'image' ? 'northwind-logo' : undefined) });
    const resource = (named.definition.resources as Obj)['image-1'] as Obj;
    expect(resource).toMatchObject({ kind: 'image', mediaType: 'image/png', ref: 'northwind-logo' });
    expect(resource.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(resource.data).toBeUndefined();

    const embedded = await toDefinition(doc, { resourceRef: () => 'x', embedResources: true });
    expect(((embedded.definition.resources as Obj)['image-1'] as Obj).data).toBe(png64);
  });

  it('writes encryption without its passwords and says so', async () => {
    const doc = new Document({
      settings: { encryption: { algorithm: 'AES_256' as never, ownerPassword: 'secret', userPassword: 'open' } },
    });
    doc.settings.version = 'Pdf17' as never;
    doc.add(new TextBlock({ text: 'x' }));
    const { definition, notes } = await toDefinition(doc);
    expect(JSON.stringify(definition)).not.toContain('secret');
    expect(JSON.stringify(definition)).not.toContain('open"');
    expect((definition.settings as Obj).encryption).toMatchObject({ algorithm: 'aes-256' });
    expect(notes).toEqual([expect.objectContaining({ path: '/settings/encryption', code: 'secret-omitted' })]);
    await expect(fromDefinition(definition)).rejects.toMatchObject({ issues: [{ code: 'secret-required' }] });
    const back = await fromDefinition(definition, { passwords: { owner: 'secret', user: 'open' } });
    expect(back.settings.isEncrypted).toBe(true);
  });

  it('writes page chrome built from elements', async () => {
    const doc = new Document();
    doc.settings.footerTemplate = pageTemplate({
      default: new TextBlock({ text: 'Page {{CurrentPage}}' }),
      firstPage: new TextBlock({ text: 'Cover' }),
    });
    doc.add(new TextBlock({ text: 'x' }));
    const { definition } = await toDefinition(doc);
    expect((definition.settings as Obj).pageChrome).toEqual({
      footer: {
        default: { type: 'TextBlock', text: 'Page {{CurrentPage}}' },
        firstPage: { type: 'TextBlock', text: 'Cover' },
      },
    });
  });

  it('palette tokens are written only when asked for', async () => {
    const doc = new Document();
    doc.add(new Container({ backgroundColor: 'slate-100' }));
    const hex = ((await toDefinition(doc)).definition.pages[0] as Obj).content as Obj[];
    expect(hex[0].backgroundColor).toBe('#f1f5f9');
    const tokens = ((await toDefinition(doc, { writePaletteTokens: true })).definition.pages[0] as Obj)
      .content as Obj[];
    expect(tokens[0].backgroundColor).toBe('slate-100');
  });

  it('refuses a version it cannot write', async () => {
    await expect(toDefinition(new Document(), { target: '2.0' })).rejects.toMatchObject({
      issues: [{ code: 'unsupported-version' }],
    });
    await expect(toDefinition(new Document(), { target: '1.0' })).resolves.toBeDefined();
  });
});

// ── what cannot be written ──────────────────────────────────────────────────

describe('constructs a definition cannot express', () => {
  const fixture = DEFINITION_FIXTURES.unrepresentable['function-template'];

  function documentFromRecipe(): Document {
    const doc = new Document();
    doc.settings.footerTemplate = page => new TextBlock({ text: `Page ${page}` });
    doc.add(new TextBlock({ text: 'Kept' }));
    doc.add(new (class Canvas extends TextBlock {})({ text: 'custom' }));
    return doc;
  }

  it('fails by default, listing every one and writing nothing', async () => {
    const error = await toDefinition(documentFromRecipe()).catch(e => e);
    expect(error).toBeInstanceOf(DefinitionError);
    const expected = fixture._expectNotes.strict.issues;
    expect(error.issues.map((i: { path: string; code: string }) => ({ path: i.path, code: i.code }))).toEqual(expected);
  });

  it('drops them on request and notes each one', async () => {
    const { definition, notes } = await toDefinition(documentFromRecipe(), { onUnrepresentable: 'drop' });
    expect(notes.map(n => ({ path: n.path, code: n.code }))).toEqual(fixture._expectNotes.drop.notes);
    expect(definition).toEqual(fixture._expectNotes.drop.definition);
  });

  it('reports a ShowIf predicate, an Svg generator and an image with no bytes', async () => {
    const doc = new Document();
    doc.add(new ShowIf({ predicate: () => true, child: new TextBlock({ text: 'x' }) }));
    doc.add(new Svg({ svgGenerator: () => '<svg/>', width: 10, height: 10 }));
    doc.add(new Image({ filePath: '/nonexistent/logo.png' }));
    const error = await toDefinition(doc).catch(e => e);
    expect(error.issues.map((i: { path: string; code: string }) => `${i.path} ${i.code}`)).toEqual([
      '/pages/0/content/0 unrepresentable',
      '/pages/0/content/1 unrepresentable',
      '/pages/0/content/2 unrepresentable',
    ]);
  });
});
