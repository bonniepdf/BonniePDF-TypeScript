import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fromDefinition, validateDefinition, DefinitionError, DEFINITION_VERSIONS } from '../../src/definition';
import { pdfToText } from '../helpers/test-base';
import { DEFINITION_FIXTURES } from './fixtures.generated';

/**
 * The Document Definition reader (spec 15). The fixtures are the shared conformance fixtures
 * `document-definition/{valid,invalid}`, generated into this suite from the specification; the .NET
 * suite runs the same files. Every fixture must produce exactly the errors it lists.
 *
 * Mirrors the .NET DocumentDefinitionTests.
 */

const key = (i: { path: string; code: string }) => `${i.path} ${i.code}`;
const texts = (svg: string) => [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1]);

/** A 1x1 PNG. */
const PNG = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  )
);
const font = (file: string) => new Uint8Array(readFileSync(resolve(__dirname, '../../assets/fonts', file)));
const base64 = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');

const minimal = (over: Record<string, unknown> = {}) => ({
  version: 1,
  minorVersion: 0,
  pages: [{ content: [{ type: 'TextBlock', text: 'x' }] }],
  ...over,
});

describe('valid fixtures', () => {
  for (const [name, fixture] of Object.entries(DEFINITION_FIXTURES.valid)) {
    it(`${name} validates, builds and generates`, async () => {
      const result = validateDefinition(fixture);
      expect(result.errors, 'errors').toEqual([]);
      expect(result.valid).toBe(true);
      if ('_expectWarnings' in fixture) {
        const expected = (fixture._expectWarnings as { path: string; code: string }[]).map(key).sort();
        expect(result.warnings.map(key).sort()).toEqual(expected);
        expect(validateDefinition(fixture, { strict: true }).errors.map(key).sort()).toEqual(expected);
      }

      const doc = await fromDefinition(fixture);
      const exported = await doc.generateSvgDocumentAsync({ captureLayout: true });
      const bytes = await doc.generateBytesAsync();
      expect(pdfToText(bytes)).toContain('%PDF-');

      const expected = fixture._expect ?? {};
      if (expected.pages !== undefined) expect(exported.pages).toHaveLength(expected.pages);
      const all = exported.pages.flatMap(texts);
      for (const text of expected.text ?? []) expect(all.join('\n')).toContain(text);
      for (const id of expected.ids ?? []) {
        const found: string[] = [];
        const walk = (n: { sourceId?: string; children: never[] }) => {
          if (n.sourceId) found.push(n.sourceId);
          n.children.forEach(walk);
        };
        walk(exported.snapshot!.root as never);
        expect(found, `sourceId ${id}`).toContain(id);
      }
      doc.dispose();
    });
  }

  it('page-chrome puts the chosen header and footer on each page', async () => {
    const doc = await fromDefinition(DEFINITION_FIXTURES.valid['page-chrome']);
    const pages = (await doc.generateSvgDocumentAsync()).pages.map(texts);
    expect(pages[0]).toEqual(expect.arrayContaining(['Northwind — Confidential', 'Page 1 of ', '3']));
    expect(pages[1]).toEqual(expect.arrayContaining(['Even: 2 / ', '3']));
    expect(pages[1]).not.toContain('Northwind — Confidential');
    expect(pages[2]).toEqual(expect.arrayContaining(['Page 3 of ', '3']));
    doc.dispose();
  });

  it('reads the same document from JSON text and from a parsed value', async () => {
    const fixture = DEFINITION_FIXTURES.valid['report-table-chart'];
    const a = await fromDefinition(fixture);
    const b = await fromDefinition(JSON.stringify(fixture));
    const strip = (t: string) =>
      t
        .replace(/\/ID \[[^\]]*\]/, '/ID []')
        .replace(/[A-Z]{6}\+/g, 'S+')
        .replace(/\/(Creation|Mod)Date[^\n]*/g, '');
    expect(strip(pdfToText(await a.generateBytesAsync()))).toBe(strip(pdfToText(await b.generateBytesAsync())));
  });
});

describe('invalid fixtures', () => {
  for (const [name, fixture] of Object.entries(DEFINITION_FIXTURES.invalid)) {
    it(`${name} returns exactly the listed errors`, async () => {
      const result = validateDefinition(fixture);
      expect(result.valid).toBe(false);
      expect(result.definition).toBeUndefined();
      expect(result.errors.map(key).sort()).toEqual(
        (fixture._expectErrors as { path: string; code: string }[]).map(key).sort()
      );
      await expect(fromDefinition(fixture)).rejects.toBeInstanceOf(DefinitionError);
    });
  }

  it('newer-minor reads the rest under bestEffort, ignoring what it does not know', async () => {
    const fixture = DEFINITION_FIXTURES.invalid['newer-minor'];
    const result = validateDefinition(fixture, { bestEffort: true });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toHaveLength(fixture._expectBestEffort.warnings);
    expect(result.warnings.every(w => w.code === 'newer-minor')).toBe(true);
  });
});

describe('validation', () => {
  it('reports every problem in one pass, each located', () => {
    const r = validateDefinition(
      minimal({ pages: [{ content: [{ type: 'Spacer', height: 'far' }, { type: 'Nope' }, { type: 'TextBlock' }] }] })
    );
    expect(r.errors.map(key).sort()).toEqual([
      '/pages/0/content/0/height invalid-value',
      '/pages/0/content/1 unknown-type',
      '/pages/0/content/2 missing-required',
    ]);
  });

  it('names the element in every issue that has an id', () => {
    const r = validateDefinition(minimal({ pages: [{ content: [{ type: 'Spacer', id: 'gap', height: 'far' }] }] }));
    expect(r.errors[0].id).toBe('gap');
  });

  it('treats unrecognised keys as warnings, and as errors when strict', () => {
    const doc = minimal({ pages: [{ content: [{ type: 'Spacer', hieght: 4 }] }] });
    expect(validateDefinition(doc).valid).toBe(true);
    expect(validateDefinition(doc).warnings.map(key)).toEqual(['/pages/0/content/0/hieght unknown-key']);
    expect(validateDefinition(doc, { strict: true }).errors.map(key)).toEqual([
      '/pages/0/content/0/hieght unknown-key',
    ]);
  });

  it('ignores annotation keys that start with an underscore, and $schema', () => {
    const r = validateDefinition(minimal({ $schema: 'https://example.com/x.json', _note: 'hi' }));
    expect(r.valid).toBe(true);
    expect(r.warnings).toEqual([]);
  });

  it('rejects text that is not JSON, and a root that is not an object', () => {
    expect(validateDefinition('{ nope').errors[0].code).toBe('invalid-json');
    expect(validateDefinition('[1]').errors[0]).toMatchObject({ path: '', code: 'invalid-json' });
    expect(validateDefinition(5).errors[0].code).toBe('invalid-json');
  });

  it('accepts every length, spacing, border and colour form', () => {
    const r = validateDefinition(
      minimal({
        settings: { margin: '2cm', pageColor: '#fff', pageSize: { width: 300, height: 400 } },
        pages: [
          {
            content: [
              {
                type: 'Container',
                margin: [4, '1mm'],
                border: { width: '0.5pt', color: 'slate-300' },
                padding: { top: { value: 1, unit: 'in' } },
                backgroundColor: '#11223344',
                child: { type: 'Spacer' },
              },
            ],
          },
        ],
      })
    );
    expect(r.errors).toEqual([]);
  });

  it('rejects bad lengths, colours and tokens with invalid-value', () => {
    const r = validateDefinition(
      minimal({
        pages: [
          {
            content: [
              {
                type: 'Container',
                margin: [1, 2, 3],
                backgroundColor: 'slate-80',
                width: '10km',
                horizontalAlignment: 'diagonal',
              },
            ],
          },
        ],
      })
    );
    expect(r.errors.map(key).sort()).toEqual([
      '/pages/0/content/0/backgroundColor invalid-value',
      '/pages/0/content/0/horizontalAlignment invalid-value',
      '/pages/0/content/0/margin invalid-value',
      '/pages/0/content/0/width invalid-value',
    ]);
  });

  it('checks ids for shape and for duplicates', () => {
    const r = validateDefinition(
      minimal({
        pages: [
          {
            content: [
              { type: 'Spacer', id: '-bad' },
              { type: 'Spacer', id: 'a' },
              { type: 'Spacer', id: 'a' },
            ],
          },
        ],
      })
    );
    expect(r.errors.map(key).sort()).toEqual([
      '/pages/0/content/0/id invalid-value',
      '/pages/0/content/2/id duplicate-id',
    ]);
  });

  it('requires at least one page', () => {
    expect(validateDefinition(minimal({ pages: [] })).errors.map(key)).toEqual(['/pages invalid-value']);
  });

  it('checks tables: strict row width, and every cell form', () => {
    const table = {
      type: 'Table',
      columns: [1, 1],
      rows: [
        ['a', 'b', 'c'],
        [{ type: 'TableCell', content: 'span', columnSpan: 2 }],
        { cells: ['x', { type: 'Spacer' }], minHeight: 20 },
      ],
    };
    const doc = minimal({ pages: [{ content: [table] }] });
    expect(validateDefinition(doc).errors).toEqual([]);
    expect(validateDefinition(doc, { strict: true }).errors.map(key)).toEqual([
      '/pages/0/content/0/rows/0 table-row-width',
    ]);
  });

  it('rejects unsupported chart number formats', () => {
    const chart = {
      type: 'BarChart',
      data: { series: [{ dataPoints: [{ label: 'a', value: 1, labelFormat: 'C0' }] }] },
    };
    expect(validateDefinition(minimal({ pages: [{ content: [chart] }] })).errors.map(key)).toEqual([
      '/pages/0/content/0/data/series/0/dataPoints/0/labelFormat unsupported-format',
    ]);
  });

  it('reports duplicate font faces, and dangling attachment resources', () => {
    const r = validateDefinition(
      minimal({
        resources: {
          a: { kind: 'font', mediaType: 'font/ttf', data: 'AAAA', family: 'Inter', weight: 400 },
          b: { kind: 'font', mediaType: 'font/ttf', data: 'AAAA', family: 'inter', weight: 400 },
        },
        attachments: [{ resource: 'missing', fileName: 'x.txt' }],
      })
    );
    expect(r.errors.map(key).sort()).toEqual([
      '/attachments/0/resource dangling-reference',
      '/resources/b duplicate-font-face',
    ]);
  });

  describe('versions', () => {
    it('states the range this release reads', () => {
      expect(DEFINITION_VERSIONS).toEqual({ version: 1, minMinor: 0, maxMinor: 0 });
    });

    it('reads nothing without both stamps, and names an unsupported version', () => {
      expect(validateDefinition({ pages: [] }).errors.map(key)).toEqual([' missing-version']);
      expect(validateDefinition({ version: 1, pages: [] }).errors.map(key)).toEqual([' missing-version']);
      expect(validateDefinition({ version: 2, minorVersion: 0, pages: [] }).errors[0]).toMatchObject({
        path: '/version',
        code: 'unsupported-version',
      });
      expect(validateDefinition({ version: 'one', minorVersion: 0, pages: [] }).errors[0]).toMatchObject({
        path: '/version',
        code: 'invalid-type',
      });
    });

    it('warns when a newer minor version is claimed but nothing needed it', () => {
      const r = validateDefinition(minimal({ minorVersion: 4 }));
      expect(r.valid).toBe(true);
      expect(r.warnings.map(key)).toEqual(['/minorVersion newer-minor']);
    });
  });

  describe('limits', () => {
    it('refuses input that is too big, too deep, or has too many elements', () => {
      const big = JSON.stringify(minimal());
      expect(validateDefinition(big, { limits: { inputBytes: 10 } }).errors[0].code).toBe('limit-exceeded');
      expect(validateDefinition('['.repeat(200) + ']'.repeat(200)).errors[0].code).toBe('limit-exceeded');
      const many = minimal({ pages: [{ content: Array.from({ length: 6 }, () => ({ type: 'Spacer' })) }] });
      expect(validateDefinition(many, { limits: { elementNodes: 5 } }).errors.map(e => e.code)).toEqual([
        'limit-exceeded',
      ]);
      let deep: Record<string, unknown> = { type: 'Spacer' };
      for (let i = 0; i < 40; i++) deep = { type: 'Container', child: deep };
      expect(validateDefinition(minimal({ pages: [{ content: [deep] }] })).errors.map(e => e.code)).toEqual([
        'limit-exceeded',
      ]);
    });

    it('refuses a long string and too many pages', () => {
      const long = minimal({ pages: [{ content: [{ type: 'TextBlock', text: 'x'.repeat(50) }] }] });
      expect(validateDefinition(long, { limits: { stringLength: 10 } }).errors.map(e => e.code)).toEqual([
        'limit-exceeded',
      ]);
      const pages = minimal({ pages: [{ content: [] }, { content: [] }, { content: [] }] });
      expect(validateDefinition(pages, { limits: { pages: 2 } }).errors.map(e => e.code)).toEqual(['limit-exceeded']);
    });
  });
});

describe('reading', () => {
  it('rejects with every issue at once, never a half-built document', async () => {
    const bad = minimal({ pages: [{ content: [{ type: 'Spacer', height: 'far' }, { type: 'Nope' }] }] });
    const error = await fromDefinition(bad).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DefinitionError);
    expect((error as DefinitionError).issues).toHaveLength(2);
    expect((error as DefinitionError).message).toContain('2 problems');
  });

  it('carries an image by data, and by ref through the host, and checks the hash and the type', async () => {
    const sha = createHash('sha256').update(PNG).digest('hex');
    const definition = minimal({
      resources: {
        inline: { kind: 'image', mediaType: 'image/png', data: base64(PNG), sha256: sha },
        hosted: { kind: 'image', mediaType: 'image/png', ref: 'logo-file', sha256: sha },
      },
      pages: [
        {
          content: [
            { type: 'Image', resource: 'inline', width: 20 },
            { type: 'Image', resource: 'hosted', width: 20 },
          ],
        },
      ],
    });
    const requested: string[] = [];
    const doc = await fromDefinition(definition, {
      resources: ref => {
        requested.push(ref);
        return PNG;
      },
    });
    expect(requested).toEqual(['logo-file']);
    expect(pdfToText(await doc.generateBytesAsync())).toContain('/Subtype /Image');
    doc.dispose();

    const tampered = {
      ...definition,
      resources: {
        ...((definition as Record<string, unknown>).resources as object),
        inline: { kind: 'image', mediaType: 'image/png', data: base64(PNG), sha256: '0'.repeat(64) },
      },
    };
    const hash = await fromDefinition(tampered, { resources: () => PNG }).catch((e: DefinitionError) => e);
    expect((hash as DefinitionError).issues.map(key)).toEqual(['/resources/inline/sha256 resource-hash-mismatch']);

    const wrong = minimal({
      resources: { pic: { kind: 'image', mediaType: 'image/jpeg', data: base64(PNG) } },
      pages: [{ content: [{ type: 'Image', resource: 'pic' }] }],
    });
    const type = await fromDefinition(wrong).catch((e: DefinitionError) => e);
    expect((type as DefinitionError).issues.map(key)).toEqual(['/resources/pic resource-type-mismatch']);
  });

  it('lists every unresolved ref at once', async () => {
    const definition = minimal({
      resources: {
        a: { kind: 'image', mediaType: 'image/png', ref: 'one' },
        b: { kind: 'image', mediaType: 'image/png', ref: 'two' },
      },
    });
    const error = (await fromDefinition(definition, { resources: () => undefined }).catch(
      (e: unknown) => e
    )) as DefinitionError;
    expect(error.issues.map(key)).toEqual([
      '/resources/a/ref resource-unresolved',
      '/resources/b/ref resource-unresolved',
    ]);
    const none = (await fromDefinition(definition).catch((e: unknown) => e)) as DefinitionError;
    expect(none.issues).toHaveLength(2);
  });

  it('gives the document its own fonts, several faces of one family', async () => {
    const definition = minimal({
      resources: {
        inter: {
          kind: 'font',
          mediaType: 'font/ttf',
          data: base64(font('LiberationSans-Regular.ttf')),
          family: 'Inter',
        },
        interBold: {
          kind: 'font',
          mediaType: 'font/ttf',
          data: base64(font('LiberationSans-Bold.ttf')),
          family: 'Inter',
          weight: 'bold',
        },
      },
      pages: [
        {
          content: [
            { type: 'TextBlock', text: 'Plain', fontFamily: 'Inter' },
            { type: 'TextBlock', text: 'Strong', fontFamily: 'Inter', fontWeight: 'bold' },
          ],
        },
      ],
    });
    const doc = await fromDefinition(definition);
    expect(doc.fonts.faces.map(f => [f.family, f.weight])).toEqual([
      ['Inter', 400],
      ['Inter', 700],
    ]);
    const embedded = [
      ...pdfToText(await doc.generateBytesAsync()).matchAll(/\/BaseFont \/(?:[A-Z]{6}\+)?([A-Za-z-]+)/g),
    ].map(m => m[1]);
    expect([...new Set(embedded)].sort()).toEqual(['LiberationSans', 'LiberationSans-Bold']);
    doc.dispose();
  });

  it('applies settings, metadata and per-page sizes', async () => {
    const definition = minimal({
      settings: {
        pageSize: 'a5',
        orientation: 'landscape',
        margin: 30,
        conformance: 'pdf/a-2b',
        language: 'en-GB',
        pdfVersion: 'pdf-1.7',
        namedDestinations: { start: 0 },
        bookmarks: [{ title: 'One', pageIndex: 0 }],
      },
      metadata: {
        title: 'Titled',
        author: 'Someone',
        keywords: 'a, b',
        customProperties: { Project: 'X' },
        creationDate: '2026-09-30T10:00:00Z',
      },
      pages: [
        { size: 'letter', content: [] },
        { content: [] },
        { size: { width: 200, height: 300 }, margin: '1cm', pageColor: 'slate-100', content: [] },
      ],
    });
    const doc = await fromDefinition(definition);
    expect(doc.settings.pageSize.name?.toLowerCase()).toBe('a5');
    expect(doc.settings.margin).toBe(30);
    expect(doc.metadata.title).toBe('Titled');
    expect(doc.metadata.customProperties.get('Project')).toBe('X');
    expect(doc.metadata.creationDate?.toISOString()).toBe('2026-09-30T10:00:00.000Z');
    const sizes = doc.pages.map(p => [Math.round(p.size.width), Math.round(p.size.height)]);
    expect(sizes[0]).toEqual([792, 612]); // letter, in the document's landscape orientation
    expect(sizes[1]).toEqual([595, 420]); // a5 landscape: the document default
    expect(sizes[2]).toEqual([300, 200]); // its own size, in the document's landscape orientation
    expect(doc.pages[2].margin).toBeCloseTo(28.35, 1);
    doc.dispose();
  });

  it('marks each element with its id and leaves the output alone', async () => {
    const withIds = minimal({ pages: [{ content: [{ type: 'TextBlock', id: 'hello', text: 'Same' }] }] });
    const without = minimal({ pages: [{ content: [{ type: 'TextBlock', text: 'Same' }] }] });
    const a = await fromDefinition(withIds);
    const b = await fromDefinition(without);
    const strip = (t: string) =>
      t
        .replace(/\/ID \[[^\]]*\]/, '/ID []')
        .replace(/[A-Z]{6}\+/g, 'S+')
        .replace(/\/(Creation|Mod)Date[^\n]*/g, '');
    expect(strip(pdfToText(await a.generateBytesAsync()))).toBe(strip(pdfToText(await b.generateBytesAsync())));
    const ids: string[] = [];
    const walk = (n: { sourceId?: string; children: never[] }) => {
      if (n.sourceId) ids.push(n.sourceId);
      n.children.forEach(walk);
    };
    walk((await a.generateSvgDocumentAsync({ captureLayout: true })).snapshot!.root as never);
    expect(ids).toEqual(['hello']);
  });

  it('needs the owner password from the host for an encrypted definition, and never stores it', async () => {
    const definition = minimal({
      settings: { encryption: { algorithm: 'aes-256', permissions: ['print', 'copy'] }, pdfVersion: 'pdf-1.7' },
    });
    const missing = (await fromDefinition(definition).catch((e: unknown) => e)) as DefinitionError;
    expect(missing.issues.map(key)).toEqual(['/settings/encryption secret-required']);
    const doc = await fromDefinition(definition, { passwords: { owner: 'owner-secret' } });
    expect(pdfToText(await doc.generateBytesAsync())).toContain('/Encrypt');
    doc.dispose();
  });

  it('builds every kind of element', async () => {
    const definition = minimal({
      settings: { pageChrome: { footer: { default: { type: 'TextBlock', text: '{{CurrentPage}}' } } } },
      pages: [
        {
          content: [
            { type: 'Heading', text: 'H', level: 2, tocIdentifier: 'h', anchorId: 'a' },
            { type: 'VisualToc', headingIdentifiers: ['h'] },
            { type: 'Section', anchorId: 'sec' },
            { type: 'SectionLink', text: 'go', anchorTarget: 'sec' },
            { type: 'PageNumberOf', text: 'p {{CurrentPage}}', anchorTarget: 'a' },
            { type: 'Hyperlink', text: 'site', uri: 'https://example.com' },
            { type: 'Hyperlink', text: 'first', targetPageIndex: 0 },
            {
              type: 'HorizontalStack',
              spacing: 4,
              widthDistribution: 'weighted',
              children: [
                { weight: 2, element: { type: 'Circle', diameter: 10 } },
                { type: 'Ellipse', width: 20, height: 8 },
              ],
            },
            {
              type: 'Layers',
              primary: { type: 'Spacer', height: 30 },
              backgrounds: [{ type: 'Line', thickness: 2, orientation: 'horizontal' }],
              foregrounds: [{ type: 'Line', orientation: 'vertical', length: 10 }],
            },
            { type: 'SemanticGroup', role: 'Sect', children: [{ type: 'TextBlock', text: 'in a section' }] },
            { type: 'EnsureSpace', minHeight: '2cm', child: { type: 'TextBlock', text: 'kept' } },
            { type: 'PreventPageBreak', child: { type: 'Spacer' } },
            { type: 'ShowEntire', child: { type: 'Spacer' } },
            { type: 'StopPaging', child: { type: 'Spacer' } },
            { type: 'ShowOnce', child: { type: 'Spacer' } },
            { type: 'SkipOnce', child: { type: 'Spacer' } },
            { type: 'Unconstrained', child: { type: 'Spacer' } },
            { type: 'ShowIf', child: { type: 'Spacer' } },
            {
              type: 'OrderedList',
              numberFormat: 'lower-roman',
              startNumber: 3,
              items: ['one', { type: 'OrderedList', items: ['sub'] }],
            },
            { type: 'Grid', columns: [1, 2], rows: [['a', 'b']] },
            { type: 'QRCode', data: 'https://example.com', size: 60, errorCorrection: 'high', altText: 'link' },
            { type: 'Barcode', value: '123456789012', symbology: 'ean13', altText: 'code' },
            { type: 'DataMatrix', data: 'dm', size: 40, altText: 'dm' },
            {
              type: 'Svg',
              svgData:
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="#f00"/></svg>',
              width: 20,
              altText: 'red',
            },
            ...[
              'BarChart',
              'GroupedBarChart',
              'LineChart',
              'AreaChart',
              'DotPlotChart',
              'LollipopChart',
              'PieChart',
            ].map(type => ({
              type,
              altText: type,
              width: 300,
              height: 160,
              data: {
                series: [
                  {
                    name: 'S',
                    dataPoints: [
                      { label: 'a', value: 1.5 },
                      { label: 'b', value: 2, labelFormat: 'F1' },
                    ],
                  },
                ],
              },
            })),
          ],
        },
        {
          content: [{ type: 'PageBreak' }, { type: 'TextBlock', text: 'later' }],
          background: { type: 'Spacer' },
          foreground: { type: 'Spacer' },
        },
      ],
    });
    const doc = await fromDefinition(definition);
    const out = await doc.generateSvgDocumentAsync();
    expect(out.pages.length).toBeGreaterThanOrEqual(2);
    expect(pdfToText(await doc.generateBytesAsync())).toContain('%%EOF');
    doc.dispose();
  });
});
