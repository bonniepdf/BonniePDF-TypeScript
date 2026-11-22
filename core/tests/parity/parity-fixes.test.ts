import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  AccessibilityMode,
  ChartLinearGradient,
  Color,
  Document,
  DocumentMetadata,
  EncryptionAlgorithm,
  EncryptionSettings,
  Flip,
  FontFamilyResolver,
  FontManager,
  FontWeight,
  Grid,
  Heading,
  Hyperlink,
  type OrderedListOptions,
  PdfAConformance,
  PdfVersion,
  Rotate,
  SectionLink,
  StandardFonts,
  Table,
  TableCell,
  TextBlock,
  TextStyle,
  Translate,
  VerticalStack,
  VisualToc,
  evaluateCompliance,
  toBorder,
  toTextDecoration,
  withEncryption40,
  withEncryption128,
} from '../../src/index.node';
import { fromDefinition, toDefinition, validateDefinition } from '../../src/definition';
import { XmpConformanceBlock } from '../../src/Metadata/XmpConformanceBlock';
import { XmpMetadataWriter } from '../../src/Metadata/XmpMetadataWriter';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
import { SvgCanvas } from '../../src/Drawing/SvgCanvas';
import { BonniePdfFontProvider } from '../../src/Drawing/BonniePdfFontProvider';
import { DEFINITION_FIXTURES } from '../definition/fixtures.generated';
import { pdfToText } from '../helpers/test-base';

const EXPECTED_CANONICAL_XMP =
  '<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>\n' +
  '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n' +
  '  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n' +
  '    <rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/">\n' +
  '      <pdfaid:part>2</pdfaid:part>\n' +
  '      <pdfaid:conformance>B</pdfaid:conformance>\n' +
  '    </rdf:Description>\n' +
  '    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">\n' +
  '      <dc:title>\n' +
  '        <rdf:Alt>\n' +
  '          <rdf:li xml:lang="x-default">Spec Report</rdf:li>\n' +
  '        </rdf:Alt>\n' +
  '      </dc:title>\n' +
  '      <dc:creator>\n' +
  '        <rdf:Seq>\n' +
  '          <rdf:li>Jane Doe</rdf:li>\n' +
  '        </rdf:Seq>\n' +
  '      </dc:creator>\n' +
  '      <dc:subject>\n' +
  '        <rdf:Bag>\n' +
  '          <rdf:li>alpha</rdf:li>\n' +
  '          <rdf:li>beta</rdf:li>\n' +
  '          <rdf:li>gamma</rdf:li>\n' +
  '        </rdf:Bag>\n' +
  '      </dc:subject>\n' +
  '      <dc:description>\n' +
  '        <rdf:Alt>\n' +
  '          <rdf:li xml:lang="x-default">Quarterly</rdf:li>\n' +
  '        </rdf:Alt>\n' +
  '      </dc:description>\n' +
  '    </rdf:Description>\n' +
  '    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">\n' +
  '      <pdf:Keywords>alpha, beta; gamma</pdf:Keywords>\n' +
  '      <pdf:Producer>BonniePDF</pdf:Producer>\n' +
  '    </rdf:Description>\n' +
  '    <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">\n' +
  '      <xmp:CreatorTool>BonniePDF Test</xmp:CreatorTool>\n' +
  '      <xmp:CreateDate>2026-01-15T09:30:45Z</xmp:CreateDate>\n' +
  '      <xmp:ModifyDate>2026-01-15T09:30:45Z</xmp:ModifyDate>\n' +
  '    </rdf:Description>\n' +
  '  </rdf:RDF>\n' +
  '</x:xmpmeta>\n' +
  '<?xpacket end="w"?>';

describe('Cross-language parity fixes', () => {
  it('emits numeric /V 1 and /V 2 in RC4 encrypt dictionaries', () => {
    const doc40 = new Document();
    doc40.add(new TextBlock('RC4-40'));
    withEncryption40(doc40.settings, o => o.withUserPassword('u').withOwnerPassword('o'));
    const text40 = pdfToText(doc40.generateBytes());
    expect(text40).toContain('/V 1');
    expect(text40).toContain('/R 2');
    doc40.dispose();

    const doc128 = new Document();
    doc128.add(new TextBlock('RC4-128'));
    withEncryption128(doc128.settings, o => o.withUserPassword('u').withOwnerPassword('o'));
    const text128 = pdfToText(doc128.generateBytes());
    expect(text128).toContain('/V 2');
    expect(text128).toContain('/R 3');
    doc128.dispose();
  });

  it('compresses the PDF/A sRGB ICC profile with FlateDecode and Length1', async () => {
    const doc = new Document();
    doc.settings.conformance = PdfAConformance.PdfA2b;
    doc.add(new TextBlock('PDF/A ICC'));
    const text = pdfToText(await doc.generateBytesAsync());
    expect(text).toMatch(/\/N 3[\s\S]*?\/Length1 \d+[\s\S]*?\/Filter \/FlateDecode/);
    doc.dispose();
  });

  it('emits canonical byte-identical XMP metadata with UTC Z timestamps and comma/semicolon keywords', () => {
    const meta = new DocumentMetadata();
    meta.title = 'Spec Report';
    meta.author = 'Jane Doe';
    meta.subject = 'Quarterly';
    meta.keywords = 'alpha, beta; gamma';
    meta.creator = 'BonniePDF Test';
    meta.producer = 'BonniePDF';
    meta.creationDate = new Date('2026-01-15T09:30:45Z');
    meta.modifiedDate = new Date('2026-01-15T09:30:45Z');

    const xml = XmpMetadataWriter.generateXmpXml(meta, [XmpConformanceBlock.pdfA2B()]);
    expect(xml).toBe(EXPECTED_CANONICAL_XMP);

    const empty = XmpMetadataWriter.generateXmpXml(new DocumentMetadata(), []);
    expect(empty).toContain('<?xpacket begin=');
    expect(empty).toContain('<?xpacket end="w"?>');
  });

  it('checks PDF/A + encryption conflict before AES-256 version check without mutating settings.version', () => {
    const doc = new Document();
    doc.settings.conformance = PdfAConformance.PdfA2b;
    doc.settings.version = PdfVersion.Pdf14;
    const enc = new EncryptionSettings();
    enc.algorithm = EncryptionAlgorithm.AES_256;
    enc.ownerPassword = 'owner';
    doc.settings.encryption = enc;
    doc.add(new TextBlock('Conflict'));

    expect(() => doc.generateBytes()).toThrow(/PDF\/A.*encrypt|encrypt.*PDF\/A/i);
    expect(doc.settings.version).toBe(PdfVersion.Pdf14);
    doc.dispose();
  });

  it('writes /DisplayDocTitle true for tagged documents without mutating settings.displayDocTitle', async () => {
    const doc = new Document();
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en';
    doc.metadata.title = 'Tagged';
    doc.add(new TextBlock('Body'));

    const text = pdfToText(await doc.generateBytesAsync());
    expect(text).toContain('/DisplayDocTitle true');
    expect(doc.settings.displayDocTitle).toBe(false);
    doc.dispose();
  });

  it('writes /A before /StructParent in tagged /Link annotations', async () => {
    const doc = new Document();
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en';
    doc.metadata.title = 'Links';
    doc.add(new Hyperlink('https://example.com', 'Example'));

    const text = pdfToText(await doc.generateBytesAsync());
    const linkStart = text.indexOf('/Subtype /Link');
    expect(linkStart).toBeGreaterThan(-1);
    const linkEnd = text.indexOf('endobj', linkStart);
    const dict = text.slice(linkStart, linkEnd);
    const aPos = dict.indexOf('/A ');
    const spPos = dict.indexOf('/StructParent ');
    expect(aPos).toBeGreaterThan(-1);
    expect(spPos).toBeGreaterThan(aPos);
    doc.dispose();
  });

  it('re-inherits defaultTextStyle.fontFeatures across regenerations when not set explicitly', async () => {
    const doc = new Document();
    const inherited = new TextBlock('Inherited');
    const explicit = new TextBlock('Explicit', { fontFeatures: { smcp: 1 } });
    doc.add(inherited);
    doc.add(explicit);

    doc.settings.defaultTextStyle = new TextStyle({ fontFeatures: { liga: 0 } });
    await doc.generateBytesAsync();
    expect(inherited.fontFeatures).toEqual({ liga: 0 });
    expect(explicit.fontFeatures).toEqual({ smcp: 1 });

    doc.settings.defaultTextStyle = new TextStyle({ fontFeatures: { tnum: 1 } });
    await doc.generateBytesAsync();
    expect(inherited.fontFeatures).toEqual({ tnum: 1 });
    expect(explicit.fontFeatures).toEqual({ smcp: 1 });
    doc.dispose();
  });

  it('supports bestEffort reading of newer-minor definitions, PageNumberOf without text, SectionLink.underline, Grid.alternateRowBackgroundColor, and border side overrides', async () => {
    const doc = await fromDefinition(DEFINITION_FIXTURES.invalid['newer-minor'], { bestEffort: true });
    const exported = await doc.generateSvgDocumentAsync();
    expect(exported.pages.join('\n')).toContain('Kept');
    doc.dispose();

    const defWithSchemaAdditions = {
      version: 1,
      minorVersion: 0,
      pages: [
        {
          content: [
            { type: 'Section', anchorId: 'intro' },
            { type: 'SectionLink', anchorTarget: 'intro', text: 'Go to intro', underline: true },
            { type: 'PageNumberOf', anchorTarget: 'intro' },
            {
              type: 'Grid',
              columns: [1, 1],
              alternateRowBackgroundColor: '#f5f5f5',
              rows: [
                {
                  cells: [
                    { type: 'TableCell', content: { type: 'TextBlock', text: 'A' } },
                    { type: 'TableCell', content: { type: 'TextBlock', text: 'B' } },
                  ],
                },
              ],
            },
            {
              type: 'Container',
              border: { top: 1, left: 1, right: 1, bottom: 3, color: '#000000' },
              child: { type: 'TextBlock', text: 'Box' },
            },
          ],
        },
      ],
    };

    const validation = validateDefinition(defWithSchemaAdditions);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);

    const built = await fromDefinition(defWithSchemaAdditions);
    const elements = built.pages[0].getElements();
    const sectionLink = elements[1] as SectionLink;
    expect(sectionLink.underline).toBe(true);
    const grid = elements[3] as Grid;
    expect(grid.alternateRowBackgroundColor).toEqual(Color.fromHex('#f5f5f5'));

    const roundTrip = await toDefinition(built);
    const pages = roundTrip.definition.pages as Array<{ content?: Record<string, unknown>[] }>;
    const serializedPage = pages[0].content ?? [];
    expect(serializedPage[1].underline).toBe(true);
    expect(serializedPage[3].alternateRowBackgroundColor).toBe('#f5f5f5');
    built.dispose();

    const { border } = toBorder({ width: 1, bottom: 3 });
    expect(border.top).toBe(1);
    expect(border.left).toBe(1);
    expect(border.right).toBe(1);
    expect(border.bottom).toBe(3);
  });

  it('rejects combining none with other text decorations, exports OrderedListOptions, and ignores undefined options', () => {
    const _opts: OrderedListOptions = { startNumber: 2 };
    expect(_opts.startNumber).toBe(2);

    expect(() => toTextDecoration(['none', 'underline'])).toThrow();

    const child = new TextBlock('x');
    expect(new Flip({ child, horizontal: undefined }).horizontal).toBe(false);
    expect(new Rotate({ child, angle: undefined }).angle).toBe(0);
    expect(new Translate({ child, x: undefined, y: undefined }).x).toBe(0);
    const gradient = new ChartLinearGradient({ startColor: undefined, endColor: undefined, scope: undefined });
    expect(gradient.scope).toBe('bar');
    expect(gradient.startColor).toEqual(Color.fromHex('#93c5fd'));
  });

  it('uses font-display:block and scopes SVG @font-face subsets to maxPages', async () => {
    const doc = new Document();
    const sans = new Uint8Array(readFileSync(resolve(__dirname, '../../assets/fonts/LiberationSans-Regular.ttf')));
    const mono = new Uint8Array(readFileSync(resolve(__dirname, '../../assets/fonts/LiberationMono-Regular.ttf')));
    doc.fonts.add(sans, { family: 'PageOneFont' });
    doc.fonts.add(mono, { family: 'PageTwoFont' });

    doc.add(new TextBlock('Page one text', { fontFamily: 'PageOneFont' }));
    const p2 = doc.addPage();
    p2.add(new TextBlock('Page two text', { fontFamily: 'PageTwoFont' }));

    const onePage = await doc.generateSvgDocumentAsync({ maxPages: 1 });
    const twoPages = await doc.generateSvgDocumentAsync();

    expect(onePage.fontFaceCss).toContain('font-display:block');
    expect(onePage.fontFaceCss).not.toContain('font-display:swap');
    expect((onePage.fontFaceCss.match(/@font-face/g) ?? []).length).toBe(1);
    expect((twoPages.fontFaceCss.match(/@font-face/g) ?? []).length).toBe(2);
    doc.dispose();
  });

  it('captures VisualToc paint, annotates split-row Table cell fills, and gives actionable table-no-header fixHint', async () => {
    const doc = new Document();
    doc.metadata.title = 'Parity Snapshot';
    doc.settings.language = 'en';

    const toc = new VisualToc();
    toc.headingIdentifiers = ['ch1'];
    toc.color = Color.fromHex('#123456');
    toc.fontSize = 11;
    doc.add(toc);

    const h1 = new Heading('Chapter 1', { level: 1 });
    h1.tocIdentifier = 'ch1';
    doc.add(h1);

    // Split-row table (row taller than a single page) with dark row fill + white text
    const table = new Table(1);
    table.rowBackgroundColor = Color.fromHex('#111111');
    const longStack = new VerticalStack();
    for (let i = 0; i < 65; i++) {
      longStack.add(new TextBlock(`Split row line ${i}`, { color: '#ffffff', fontSize: 12 }));
    }
    table.addRow(new TableCell({ content: longStack }));
    doc.add(table);

    const exported = await doc.generateSvgDocumentAsync({ captureLayout: true });
    expect(exported.pages.length).toBeGreaterThan(1);

    const nodes: NonNullable<typeof exported.snapshot>['root'][] = [];
    const walk = (n: NonNullable<typeof exported.snapshot>['root']) => {
      nodes.push(n);
      for (const c of n.children) walk(c);
    };
    walk(exported.snapshot!.root);

    const tocNode = nodes.find(n => n.type === 'VisualToc');
    expect(tocNode?.paint?.text).toBe('#123456');
    expect(tocNode?.paint?.fontSize).toBe(11);

    const cellNode = nodes.find(n => n.type === 'TableCell');
    expect(cellNode?.paint?.background).toBe('#111111');

    const report = evaluateCompliance(exported.snapshot!);
    const contrastFails = report.findings.filter(f => f.code === 'contrast-insufficient');
    expect(contrastFails).toEqual([]);

    const noHeader = report.findings.find(f => f.code === 'table-no-header');
    expect(noHeader?.fixHint).toContain('addHeader');
    expect(noHeader?.fixHint).toContain('Grid');
    expect(noHeader?.fixHint).toContain('presentation = true');
    expect(noHeader?.fixHint).not.toContain('addHeaderRow');
    doc.dispose();
  });

  it('clears the current path after fillCurrentPath, strokeCurrentPath, and clipToCurrentPath on both canvases', () => {
    const pdf = new PdfCanvas(200);
    pdf.beginPath();
    pdf.addRect(0, 0, 20, 20);
    pdf.fillCurrentPath(Color.red);
    const afterFill = pdf.getStream().length;
    pdf.strokeCurrentPath({ paint: Color.black, width: 1 });
    expect(pdf.getStream().length).toBe(afterFill);

    pdf.beginPath();
    pdf.addRect(0, 0, 20, 20);
    pdf.clipToCurrentPath();
    const afterClip = pdf.getStream().length;
    pdf.fillCurrentPath(Color.blue);
    expect(pdf.getStream().length).toBe(afterClip);

    const svg = new SvgCanvas(200, 200);
    svg.beginPath();
    svg.addRect(0, 0, 20, 20);
    svg.fillCurrentPath(Color.red);
    const svgAfterFill = svg.toSvg();
    svg.strokeCurrentPath({ paint: Color.black, width: 1 });
    expect(svg.toSvg()).toBe(svgAfterFill);
  });

  it('lets FontManager registrations shadow standard aliases in FontFamilyResolver.resolveKnown and imported SVG', () => {
    const monoBytes = new Uint8Array(readFileSync(resolve(__dirname, '../../assets/fonts/LiberationMono-Regular.ttf')));
    const fontsDir = resolve(__dirname, '../../assets/fonts');
    try {
      FontManager.registerFont(monoBytes, { family: 'Arial', subfamily: 'Regular' });
      const resolved = FontFamilyResolver.resolveKnown('Arial', FontWeight.Normal, false);
      expect(resolved).toBeDefined();
      expect(resolved).not.toBe(StandardFonts.Helvetica);

      const provider = new BonniePdfFontProvider();
      const face = provider.resolve('Arial', 400, false);
      expect(face).toBeDefined();
    } finally {
      FontManager.clear();
      FontManager.autoRegisterBundledFonts(fontsDir);
    }
  });
});
