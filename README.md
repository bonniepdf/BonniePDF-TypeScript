# BonniePDF for TypeScript and JavaScript

[![npm](https://img.shields.io/npm/v/@bonniepdf/core?label=%40bonniepdf%2Fcore&color=2196F3&style=flat-square&logo=npm)](https://www.npmjs.com/package/@bonniepdf/core)
[![npm downloads](https://img.shields.io/npm/dm/@bonniepdf/core?style=flat-square&logo=npm)](https://www.npmjs.com/package/@bonniepdf/core)
[![License: BonniePDF Community](https://img.shields.io/badge/license-BonniePDF%20Community%201.0-blue.svg?style=flat-square)](./core/LICENSE)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@bonniepdf/core?style=flat-square)](https://bundlephobia.com/package/@bonniepdf/core)
![coverage](./badges/coverage.svg)

[Live examples](https://www.bonniepdf.dev/examples) | [Documentation](https://www.bonniepdf.dev) | [.NET package](https://www.nuget.org/packages/BonniePDF)

BonniePDF generates PDF documents in pure TypeScript: text, tables, charts, images, and accessible tagged output. The same code runs in the browser, Node.js, Bun, and Deno. There are no native add-ons, no headless browser, and no print server; it writes the PDF byte stream directly. That means you can build a document on the client and let the user download it without involving your backend.

BonniePDF creates new PDFs. It does not convert HTML, read or parse existing PDFs, or fill forms.

## Highlights

- Runs anywhere JavaScript runs, including the browser with no WASM and no server.
- No runtime dependencies. No node-canvas, no Chromium, no native binaries.
- Automatic flow layout: you describe structure, and content reflows across pages on its own.
- Vector charts (bar, line, area, pie, and others) drawn straight into the PDF, with optional SVG export.
- The 14 standard PDF fonts plus your own TrueType and OpenType files, embedded with automatic glyph subsetting and full Unicode coverage, emoji included.
- PDF/A archival output (A-1b through A-3a) and PDF/UA-1 tagged output for accessibility.

## Install

```bash
npm install @bonniepdf/core
```

pnpm, bun, and yarn work the same way.

## Quick start

```typescript
import { Document, TextBlock, StandardFonts, Color } from '@bonniepdf/core';

// A new Document comes with its first page ready to use.
const doc = new Document();

const title = new TextBlock('Hello, BonniePDF!');
title.fontName = StandardFonts.HelveticaBold;
title.fontSize = 24;
title.textColor = ColorPalette.slate[800];
doc.add(title);

doc.add(new TextBlock('Generated entirely in TypeScript, no server required.'));

const bytes: Uint8Array = await doc.generateBytesAsync();
```

In the browser, offer the result as a download or open it in a new tab:

```typescript
const blob = new Blob([bytes], { type: 'application/pdf' });
window.open(URL.createObjectURL(blob));
```

In Node.js, write it to disk:

```typescript
import { writeFileSync } from 'node:fs';
writeFileSync('hello.pdf', bytes);
```

## A few more building blocks

Styled text with a document-wide default:

```typescript
import { Document, TextBlock, TextStyle, Color, Thickness } from '@bonniepdf/core';

const doc = new Document();

// Every text element inherits this unless it sets its own values.
doc.settings.defaultTextStyle = new TextStyle().withFamily('Helvetica').withSize(12).withColor(ColorPalette.slate[700]);

const heading = new TextBlock('Quarterly Report');
heading.fontSize = 22;
heading.textColor = ColorPalette.indigo[600];
heading.margin = new Thickness(0, 0, 0, 12); // left, top, right, bottom
doc.add(heading);
```

A bar chart:

```typescript
import { Document, BarChart, ChartElement, ChartData, ChartSeries, ChartDataPoint, Color } from '@bonniepdf/core';

const points = [
  ['Jan', 42000],
  ['Feb', 58000],
  ['Mar', 51000],
].map(([label, value]) => Object.assign(new ChartDataPoint(), { label, value }));

const series = Object.assign(new ChartSeries(), { color: Color.fromHex('#4f46e5'), dataPoints: points });
const data = Object.assign(new ChartData(), { title: 'Monthly Revenue', series: [series] });

const chart = new BarChart();
chart.height = 300;
chart.barColor = Color.fromHex('#4f46e5');

const doc = new Document();
doc.add(new ChartElement(chart, data, 'Monthly revenue: Jan 42k, Feb 58k, Mar 51k.'));
```

A synchronous fluent builder, `Pdf.create(builder => ...)`, is also available for Node. The [example gallery](https://www.bonniepdf.dev/examples) shows every API in use.

## Features

| Area                       | Capabilities                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text                       | 14 standard fonts plus embedded TTF/OTF (auto-subset); bold, italic, underline, strikethrough; left, centre, right, and justified; mixed inline styles; full Unicode and emoji           |
| Layout                     | Pages, margins and padding, vertical and horizontal stacks, containers, headers and footers, inline z-stacking with `Layers`, automatic multi-page flow                                  |
| Tables                     | Multi-column, cell styling, borders, repeating headers                                                                                                                                   |
| Charts                     | Bar, grouped bar, line, multi-series line, area, pie, lollipop, dot-plot, drawn as vectors with optional SVG export                                                                      |
| Images                     | PNG and JPEG with contain, cover, and fill modes plus alpha transparency; native QR codes                                                                                                |
| Accessibility and archival | PDF/A-1b through A-3a and PDF/UA-1 tagged output, validated against veraPDF                                                                                                              |
| Pages                      | All standard sizes, portrait and landscape, full-page background and foreground slots (bleed images, letterhead, "DRAFT" overlays), watermarks with opacity and rotation, page numbering |
| Platform                   | Browser (no WASM, no server), Node.js, Bun, Deno, edge runtimes                                                                                                                          |

Document encryption (passwords and permissions) exists in the API, but output encryption is not implemented yet: the generated file is not actually encrypted. It is being brought over from the .NET version.

## Runtime support

| Environment                    | Status    |
| ------------------------------ | --------- |
| Browser (native ESM)           | Supported |
| Node.js 16+ (ESM and CommonJS) | Supported |
| Vite, webpack, esbuild         | Supported |
| Bun                            | Supported |
| Deno (via npm: specifier)      | Supported |
| Edge and Cloudflare Workers    | Supported |

## Repository layout

This is a pnpm workspace. Only `core` is published to npm.

```
BonniePDF-TypeScript/
├── core/        @bonniepdf/core, the published library (engine and public API)
├── examples/    shared example catalogue, consumed by the website
└── ui-shared/   React components for the live demo viewer
```

```bash
pnpm install      # install workspace dependencies
pnpm build        # build @bonniepdf/core into core/dist/
pnpm typecheck    # type-check every package
```

The API here mirrors the [.NET reference implementation](https://www.nuget.org/packages/BonniePDF) so that moving between the two languages feels familiar.

## License

BonniePDF is dual-licensed:

- Free for personal and open-source use.
- Commercial for proprietary and commercial use. There are no license keys, activation servers, or runtime checks.

See [`core/LICENSE`](./core/LICENSE) for the full terms, or [bonniepdf.dev/license](https://www.bonniepdf.dev/license) to buy a commercial license.

## Contributing

Issues and pull requests are welcome. For anything non-trivial, please open an issue first to discuss the approach. The .NET library is the reference implementation, so changes here should keep the two ports in parity.

© 2026 BonniePDF
