# @bonniepdf/core

[![npm](https://img.shields.io/npm/v/@bonniepdf/core?label=%40bonniepdf%2Fcore&color=2196F3)](https://www.npmjs.com/package/@bonniepdf/core)
[![npm downloads](https://img.shields.io/npm/dm/@bonniepdf/core)](https://www.npmjs.com/package/@bonniepdf/core)
[![CI](https://github.com/bonniepdf/bonniepdf-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/bonniepdf/bonniepdf-typescript/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-BonniePDF%20Community%201.0-blue.svg)](./LICENSE)

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
import { Document, Heading, TextBlock, StandardFonts, settings } from '@bonniepdf/core';

// Declare which licence applies to you, once at startup (see License below).
settings.license = 'community';

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

const settings = new DocumentSettings({ pageSize: PdfSize.a4 });

const metadata = new DocumentMetadata();
metadata.title = 'My Report';
metadata.author = 'Sample Company';

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
heading.color = Color.fromHex('#1a1a1a');

// Rich text with mixed styles - one span per run
const rich = new RichText();
rich.span('Normal ');
rich.span('bold', s => {
  s.bold();
});
rich.span(' and ');
rich.span('coloured', s => {
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
import { BarChart, ChartData, ChartSeries, ChartDataPoint, Color } from '@bonniepdf/core';

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

const chart = new BarChart({
  data,
  height: 200,
  barColor: Color.fromHex('#2196F3'),
  altText: 'Monthly revenue, Jan-Mar.',
});

doc.add(chart);
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

const settings = new DocumentSettings({ pageSize: PdfSize.a4 });
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

BonniePDF core is **source available** under the
[BonniePDF Community License 1.0](./LICENSE). It is not OSI-approved open
source. Each version remains governed by the licence supplied with it.

| Use case                                                                                                                         | Licence                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Non-production evaluation, independent non-commercial projects, and qualifying charity, education, research, and open-source use | [Community License](./LICENSE) - free                                     |
| Commercial production, where the organisation the documents are for has annual gross revenue below US $1,000,000                 | [Community License](./LICENSE) - free                                     |
| Commercial production at or above US $1,000,000 annual gross revenue                                                             | [Professional or Enterprise commercial licence](./COMMERCIAL-LICENSE.txt) |

Evaluation excludes live use, live customer data, and external distribution.
The revenue test applies to the organisation receiving the primary business
benefit of the documents, aggregated with its affiliates - for client work that
is the client, not the contractor. Crossing the threshold allows ninety days to
obtain a paid licence.
The competing-product restriction prevents redistributing BonniePDF as a
general-purpose PDF library, SDK, or hosted PDF generation service; ordinary
applications and domain-specific SaaS products may generate their own PDFs
under a paid licence.

One commercial core licence covers both TypeScript/JavaScript and .NET. Paid
tiers have no developer-seat, document, server, deployment, or end-user fees.
The core has no activation or telemetry.
Digital signing is included with every paid core licence at no extra charge,
under the same Commercial License Agreement. The signing packages are not
covered by the Community License.

### Declaring your licence

BonniePDF asks your application to state which tier applies to it, once at
startup:

```typescript
import { settings } from '@bonniepdf/core';

settings.license = 'community'; // or 'evaluation' / 'professional' / 'enterprise'
```

Or set `BONNIEPDF_LICENSE=community` in the environment. An in-code declaration
takes precedence.

This is a declaration, not an enforcement mechanism: there is no licence key,
activation, telemetry, or feature gate, and the declared tier never changes a
byte of output. Generating a document without a declaration throws
`BonniePdfLicenseError` in development, test, or CI, and otherwise logs a single
warning and continues. `BONNIEPDF_LICENSE_ENFORCEMENT=throw` or `=warn` makes
the notice fatal or non-fatal everywhere.

Visit **[bonniepdf.dev/license](https://bonniepdf.dev/license)** for current
evaluation rights, commercial editions, and pricing.

© 2026 CodeFocus Limited
