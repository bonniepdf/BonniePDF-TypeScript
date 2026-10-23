import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { DocumentMetadata } from '../../src/Configuration/DocumentMetadata';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { Heading } from '../../src/Elements/Text/Heading';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Thickness } from '../../src/Core/Thickness';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { StandardFonts } from '../../src/Typography/StandardFonts';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { ZoomLevel } from '../../src/Configuration/ZoomLevel';
import { PageModeEnum } from '../../src/Configuration/PageMode';
import { toSvg } from '../../src/Export/SvgElementExport';
import type { Page } from '../../src/Elements/Layout/Page';

/**
 * The authoring-equivalence property, in miniature: the same logical
 * document authored in the legacy construct-then-mutate style and in the new
 * options style must render identically.
 *
 * Compared via SVG rather than PDF bytes: PDF output embeds a creation timestamp
 * and a mandated random font-subset tag, so it is not byte-stable across two
 * runs. SVG export is uncompressed and fully deterministic, and reflects layout,
 * geometry and colour.
 */
function renderSvg(doc: Document): string {
  return (doc.pages as Page[]).map(p => toSvg(p)).join('\n');
}

/** Mirrors the opening of `examples/src/code-recipes/getting-started/simple-document.ts`. */
function legacyStyle(): Document {
  const settings = new DocumentSettings();
  settings.conformance = PdfAConformance.PdfA2a;
  settings.accessibility = AccessibilityMode.PdfUa1;
  settings.language = 'en-GB';
  const style = new TextStyle();
  style.fontFamily = 'Helvetica';
  style.fontSize = 12;
  style.color = ColorPalette.slate[600];
  settings.defaultTextStyle = style;
  settings.defaultZoom = ZoomLevel.FitPage;
  settings.pageMode = PageModeEnum.UseNone;
  settings.displayDocTitle = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Simple Document Example';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  const h1 = new Heading('Hello, Document API!');
  h1.tocIdentifier = 'intro';
  h1.level = 1;
  h1.fontName = StandardFonts.HelveticaBold;
  h1.fontSize = 24;
  h1.color = ColorPalette.slate[800];
  h1.margin = new Thickness(0, 0, 0, 12);
  doc.add(h1);

  const body = new TextBlock('This PDF was generated entirely in the browser.');
  body.fontSize = 11;
  body.margin = new Thickness(0, 0, 0, 6);
  doc.add(body);

  return doc;
}

/** The same document in the options style delivered by Phase 1 + 2.A-2.C. */
function optionsStyle(): Document {
  const settings = new DocumentSettings();
  settings.conformance = 'pdf/a-2a';
  settings.accessibility = 'pdf/ua-1';
  settings.language = 'en-GB';
  settings.defaultTextStyle = new TextStyle({
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: 'slate-600',
  });
  settings.defaultZoom = 'fit-page';
  settings.pageMode = 'use-none';
  settings.displayDocTitle = true;

  const metadata = new DocumentMetadata();
  metadata.title = 'Simple Document Example';
  metadata.author = 'BonniePDF';

  const doc = new Document(settings, metadata);

  doc.add(
    new Heading({
      text: 'Hello, Document API!',
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-800',
      margin: { bottom: 12 },
    })
  );

  doc.add(
    new TextBlock({
      text: 'This PDF was generated entirely in the browser.',
      fontSize: 11,
      margin: { bottom: 6 },
    })
  );

  return doc;
}

/**
 * The Phase 2.D form: the whole document configured in one expression, with
 * `settings` / `metadata` as nested literals and no sub-type imports.
 */
function nestedLiteralStyle(): Document {
  const doc = new Document({
    settings: {
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      language: 'en-GB',
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
      defaultZoom: 'fit-page',
      pageMode: 'use-none',
      displayDocTitle: true,
    },
    metadata: {
      title: 'Simple Document Example',
      author: 'BonniePDF',
    },
  });

  doc.add(
    new Heading({
      text: 'Hello, Document API!',
      tocIdentifier: 'intro',
      level: 1,
      fontName: StandardFonts.HelveticaBold,
      fontSize: 24,
      color: 'slate-800',
      margin: { bottom: 12 },
    })
  );

  doc.add(
    new TextBlock({
      text: 'This PDF was generated entirely in the browser.',
      fontSize: 11,
      margin: { bottom: 6 },
    })
  );

  return doc;
}

describe('authoring equivalence: options style === construct-then-mutate', () => {
  it('produces identical settings and metadata', () => {
    const a = legacyStyle();
    const b = optionsStyle();

    expect(b.settings.conformance).toBe(a.settings.conformance);
    expect(b.settings.accessibility).toBe(a.settings.accessibility);
    expect(b.settings.defaultZoom).toBe(a.settings.defaultZoom);
    expect(b.settings.pageMode).toBe(a.settings.pageMode);
    expect(b.settings.defaultTextStyle?.color).toBe(a.settings.defaultTextStyle?.color);
    expect(b.settings.defaultTextStyle?.fontSize).toBe(a.settings.defaultTextStyle?.fontSize);
    expect(b.metadata.title).toBe(a.metadata.title);

    a.dispose();
    b.dispose();
  });

  it('renders identical SVG', () => {
    const a = legacyStyle();
    const b = optionsStyle();

    expect(renderSvg(b)).toBe(renderSvg(a));

    a.dispose();
    b.dispose();
  });

  it('renders identical PDF byte length', () => {
    // Content equality is asserted via SVG above; length is the strongest
    // PDF-side invariant available given the timestamp and subset-tag entropy.
    const a = legacyStyle();
    const b = optionsStyle();

    expect(b.generateBytes().length).toBe(a.generateBytes().length);

    a.dispose();
    b.dispose();
  });

  it('the fully-nested Document literal renders identically too', () => {
    const a = legacyStyle();
    const c = nestedLiteralStyle();

    expect(renderSvg(c)).toBe(renderSvg(a));
    expect(c.settings.conformance).toBe(a.settings.conformance);
    expect(c.settings.defaultTextStyle?.color).toBe(a.settings.defaultTextStyle?.color);
    expect(c.metadata.title).toBe(a.metadata.title);

    a.dispose();
    c.dispose();
  });
});
