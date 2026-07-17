# @bonniepdf/core

[![npm](https://img.shields.io/npm/v/@bonniepdf/core?label=%40bonniepdf%2Fcore&color=2196F3)](https://www.npmjs.com/package/@bonniepdf/core)
[![npm downloads](https://img.shields.io/npm/dm/@bonniepdf/core)](https://www.npmjs.com/package/@bonniepdf/core)
[![CI](https://github.com/bonniepdf/bonniepdf-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/bonniepdf/bonniepdf-typescript/actions/workflows/ci.yml)
[![License](<https://img.shields.io/badge/license-BonniePDF%20Community%201.0-blue.svg>)](./LICENSE)

High-performance, zero-dependency PDF generation for TypeScript and JavaScript - runs in the **browser** and **Node.js**.

> Interactive examples → [bonniepdf.dev/examples](https://bonniepdf.dev/examples)  
> Also available for **.NET** → [BonniePDF/bonniepdf](https://github.com/BonniePDF/bonniepdf)

---

## Installation

```bash
npm install @bonniepdf/core
# or
pnpm add @bonniepdf/core
# or
yarn add @bonniepdf/core
```

---

## Quick start

```typescript
import { Document, Heading, TextBlock, StandardFonts } from '@bonniepdf/core';

const doc = new Document();

const title = new Heading('Hello, BonniePDF!');
title.level = 1;
title.fontName = StandardFonts.HelveticaBold;
title.fontSize = 24;
doc.add(title);

doc.add(new TextBlock('Generated entirely in TypeScript - no server required.'));

const bytes = await doc.generateBytesAsync();

// Browser: trigger a download
const blob = new Blob([bytes], { type: 'application/pdf' });
window.open(URL.createObjectURL(blob));

// Node.js: write to disk
import { writeFileSync } from 'fs';
writeFileSync('output.pdf', bytes);
```

---

## Features

| Category       | Capabilities                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Text**       | Built-in fonts + custom TTF/OTF, bold, italic, underline, strikethrough, letter-spacing, alignment, overflow |
| **Layout**     | Pages, margins, padding, vertical stacks, horizontal stacks, columns, headers & footers                      |
| **Tables**     | Multi-column, cell styling, borders, merged cells                                                            |
| **Images**     | JPEG & PNG embed, aspect-ratio fit modes                                                                     |
| **Shapes**     | Rectangles, lines, ellipses, borders, fills                                                                  |
| **Charts**     | Bar, grouped bar, line, multi-series line, area, pie, dot-plot, lollipop                                     |
| **Lists**      | Ordered & unordered, nested                                                                                  |
| **Links**      | Internal anchors, external hyperlinks                                                                        |
| **Security**   | AES-128/256 encryption, owner/user passwords, print/copy permissions                                         |
| **Metadata**   | XMP metadata, PDF version control, document properties                                                       |
| **Watermarks** | Text or image watermarks with opacity and rotation                                                           |
| **Unicode**    | Full Unicode support including emoji                                                                         |
| **Platform**   | Browser · Node.js · Bun · Deno · Cloudflare Workers                                                          |

No native addons. No WASM. No server.

---

## Environment support

| Environment                 | ESM | CJS |
| --------------------------- | --- | --- |
| Node.js ≥ 18                | ✅  | ✅  |
| Browser (native ESM)        | ✅  | -   |
| Vite / webpack / esbuild    | ✅  | ✅  |
| Bun                         | ✅  | ✅  |
| Deno (via `npm:` specifier) | ✅  | -   |
| Cloudflare Workers          | ✅  | -   |

---

## API overview

### Document

```typescript
import { Document, DocumentSettings, DocumentMetadata, PdfSize } from '@bonniepdf/core';

const settings = new DocumentSettings(PdfSize.a4);

const metadata = new DocumentMetadata();
metadata.title = 'My Report';
metadata.author = 'ACME Corp';

const doc = new Document(settings, metadata);
doc.add(/* elements */);
doc.addPage(); // start a new page; elements added after this land on it

const bytes = await doc.generateBytesAsync();
```

### Text

```typescript
import { TextBlock, RichText, StandardFonts, Color, ColorPalette } from '@bonniepdf/core';

// Simple - style via properties. Colours are Color instances or palette tokens.
const heading = new TextBlock('Hello world');
heading.fontName = StandardFonts.HelveticaBold;
heading.fontSize = 14;
heading.textColor = Color.fromHex('#1a1a1a');

// Rich text with mixed styles - one span per run
const rich = new RichText();
rich.span('Normal ');
rich.spanWithConfigure('bold', s => {
  s.bold = true;
});
rich.span(' and ');
rich.spanWithConfigure('coloured', s => {
  s.color = ColorPalette.blue[500];
});
```

### Tables

```typescript
import { Table, TextBlock, StandardFonts } from '@bonniepdf/core';

// Constructor args are relative column weights (2 : 1 : 1 here).
const table = new Table(2, 1, 1);

const th = (s: string) => {
  const c = new TextBlock(s);
  c.fontName = StandardFonts.HelveticaBold;
  return c;
};

table.addHeader(th('Product'), th('Qty'), th('Total'));
table.addRow(new TextBlock('Widget'), new TextBlock('3'), new TextBlock('£30.00'));
```

### Charts

```typescript
import { BarChart, ChartElement, ChartData, ChartSeries, ChartDataPoint, Color } from '@bonniepdf/core';

const points = [
  { label: 'Jan', value: 42000 },
  { label: 'Feb', value: 58000 },
  { label: 'Mar', value: 51000 },
].map(({ label, value }) => {
  const p = new ChartDataPoint();
  p.label = label;
  p.value = value;
  return p;
});

const series = new ChartSeries();
series.color = Color.fromHex('#2196F3');
series.dataPoints = points;

const data = new ChartData();
data.title = 'Monthly Revenue';
data.series = [series];

const chart = new BarChart();
chart.height = 200;
chart.barColor = Color.fromHex('#2196F3');

// Add to the document with alt-text for accessibility.
doc.add(new ChartElement(chart, data, 'Monthly revenue, Jan-Mar.'));
```

### Custom fonts

```typescript
import { Document, TextBlock } from '@bonniepdf/core';

// Set `fontName` to a URL (browser) or an absolute file path (Node.js).
// BonniePDF embeds a compact subset of only the glyphs you actually use.
const text = new TextBlock('Custom font');
text.fontName = '/fonts/Inter-Regular.ttf';

const doc = new Document();
doc.add(text);
```

### Security

```typescript
import { Document, DocumentSettings, PdfSize, PdfVersion, withEncryptionAes256 } from '@bonniepdf/core';

const settings = new DocumentSettings(PdfSize.a4);
settings.version = PdfVersion.Pdf17; // AES-256 requires PDF 1.7

withEncryptionAes256(settings, opts =>
  opts.withUserPassword('viewer-pass').withOwnerPassword('admin-pass').allowPrinting()
);

const doc = new Document(settings);
// ...add content...
const bytes = await doc.generateBytesAsync();
```

---

## Platform configuration

BonniePDF abstracts file I/O and compression behind a `configurePlatform()` call. This is only required when loading fonts from disk or saving files - pure in-memory generation works without it.

```typescript
// Node.js
import { configurePlatform, NodePlatformIO } from '@bonniepdf/core';
configurePlatform(new NodePlatformIO());

// Browser
import { configurePlatform, BrowserPlatformIO } from '@bonniepdf/core';
configurePlatform(new BrowserPlatformIO());
```

---

## License

BonniePDF is **source-available** (BonniePDF Community License 1.0) - not OSI open source. The full source
is included.

| Use case                                      | License                                             |
| --------------------------------------------- | --------------------------------------------------- |
| Individuals, non-profits, education           | [BonniePDF Community License 1.0](./LICENSE) - free       |
| Commercial use under $1M USD annual revenue   | [BonniePDF Community License 1.0](./LICENSE) - free       |
| Commercial use at or above $1M annual revenue | [Commercial License](https://bonniepdf.dev/license) |

The only restriction, for everyone, is that you may not resell BonniePDF itself as
a competing PDF library or PDF-generation service.

Visit **[bonniepdf.dev/license](https://bonniepdf.dev/license)** for Commercial license details.

© 2026-present BonniePDF Contributors
