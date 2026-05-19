# @bonniepdf/core

[![npm](https://img.shields.io/npm/v/@bonniepdf/core?label=%40bonniepdf%2Fcore&color=2196F3)](https://www.npmjs.com/package/@bonniepdf/core)
[![npm downloads](https://img.shields.io/npm/dm/@bonniepdf/core)](https://www.npmjs.com/package/@bonniepdf/core)
[![CI](https://github.com/bonniepdf/bonniepdf-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/bonniepdf/bonniepdf-typescript/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-BonniePDF%20Community%201.0-blue.svg)](./LICENSE)

High-performance, zero-dependency PDF generation for TypeScript and JavaScript — runs in the **browser** and **Node.js**.

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
import { Document, TextBlock, PdfSize } from '@bonniepdf/core';

const bytes = await new Document()
  .addPage(page =>
    page
      .add(new TextBlock('Hello, BonniePDF!').fontSize(24).bold())
      .add(new TextBlock('Generated entirely in TypeScript — no server required.'))
  )
  .generateAsync();

// Browser: trigger a download
const blob = new Blob([bytes], { type: 'application/pdf' });
window.open(URL.createObjectURL(blob));

// Node.js: write to disk
import { configurePlatform, NodePlatformIO } from '@bonniepdf/core';
import { writeFileSync } from 'fs';
configurePlatform(new NodePlatformIO());
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
| Browser (native ESM)        | ✅  | —   |
| Vite / webpack / esbuild    | ✅  | ✅  |
| Bun                         | ✅  | ✅  |
| Deno (via `npm:` specifier) | ✅  | —   |
| Cloudflare Workers          | ✅  | —   |

---

## API overview

### Document

```typescript
import { Document, PdfSize } from '@bonniepdf/core';

const bytes = await new Document()
  .metadata({ title: 'My Report', author: 'ACME Corp' })
  .addPage(page => page.size(PdfSize.A4).add(...elements))
  .generateAsync();
```

### Text

```typescript
import { TextBlock, RichText } from '@bonniepdf/core';

// Simple
new TextBlock('Hello world').fontSize(14).bold().color('#1a1a1a');

// Rich text with mixed styles
new RichText()
  .add('Normal ')
  .add('bold', t => t.bold())
  .add(' and ')
  .add('coloured', t => t.color('#2196F3'));
```

### Tables

```typescript
import { Table, TableRow, TableCell } from '@bonniepdf/core';

new Table()
  .columns([150, 100, '*']) // px widths; '*' fills remaining space
  .addRow(row =>
    row
      .addCell(cell => cell.text('Product'))
      .addCell(cell => cell.text('Qty'))
      .addCell(cell => cell.text('Total'))
  );
```

### Charts

```typescript
import { BarChart } from '@bonniepdf/core';

new BarChart()
  .title('Monthly Revenue')
  .data([
    { label: 'Jan', value: 42000 },
    { label: 'Feb', value: 58000 },
    { label: 'Mar', value: 51000 },
  ])
  .color('#2196F3')
  .height(200);
```

### Custom fonts

```typescript
import { TtfFont, configurePlatform, BrowserPlatformIO } from '@bonniepdf/core';

configurePlatform(new BrowserPlatformIO());

const font = await TtfFont.fromFile('/fonts/Inter-Regular.ttf');

new Document().addPage(page => page.add(new TextBlock('Custom font').fontFamily(font)));
```

### Security

```typescript
import { Document, EncryptionSettings, EncryptionAlgorithm } from '@bonniepdf/core'

new Document()
  .encrypt(
    new EncryptionSettings()
      .algorithm(EncryptionAlgorithm.AES256)
      .userPassword('viewer-pass')
      .ownerPassword('admin-pass')
  )
  .addPage(...)
```

---

## Platform configuration

BonniePDF abstracts file I/O and compression behind a `configurePlatform()` call. This is only required when loading fonts from disk or saving files — pure in-memory generation works without it.

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

BonniePDF uses a **dual-license** model:

| Use case                                    | License                                             |
| ------------------------------------------- | --------------------------------------------------- |
| Personal projects                           | [Community](./LICENSE) — free                 |
| Open source projects (OSI-approved license) | [Community](./LICENSE) — free                 |
| Commercial / for-profit use                 | [Commercial License](https://bonniepdf.dev/license) |
| Internal business tools                     | [Commercial License](https://bonniepdf.dev/license) |

Visit **[bonniepdf.dev/license](https://bonniepdf.dev/license)** for Commercial license details.

© 2024-present BonniePDF Contributors
