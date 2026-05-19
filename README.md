# BonniePDF · TypeScript / JavaScript

[![npm](https://img.shields.io/npm/v/@bonniepdf/core?label=%40bonniepdf%2Fcore&color=2196F3)](https://www.npmjs.com/package/@bonniepdf/core)
[![npm downloads](https://img.shields.io/npm/dm/@bonniepdf/core)](https://www.npmjs.com/package/@bonniepdf/core)
[![CI](https://github.com/bonniepdf/bonniepdf-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/bonniepdf/bonniepdf-typescript/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-BonniePDF%20Community%201.0-blue.svg)](./core/LICENSE)

High-performance, zero-dependency PDF generation for TypeScript and JavaScript — runs in the **browser** and **Node.js**.

> Also available for **.NET** → [BonniePDF/bonniepdf](https://github.com/BonniePDF/bonniepdf)  
> Interactive examples → [bonniepdf.dev/examples](https://bonniepdf.dev/examples)

---

## Quick start

```bash
npm install @bonniepdf/core
# or
pnpm add @bonniepdf/core
```

```typescript
import { Document, TextBlock, PdfSize } from '@bonniepdf/core';

const bytes = await new Document()
  .addPage(page =>
    page
      .add(new TextBlock('Hello, BonniePDF!').fontSize(24).bold())
      .add(new TextBlock('Generated entirely in TypeScript — no server required.'))
  )
  .generateAsync();

// Browser: open in a new tab
const blob = new Blob([bytes], { type: 'application/pdf' });
window.open(URL.createObjectURL(blob));
```

---

## Features

| Category       | Capabilities                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| **Text**       | Fonts (built-in + custom TTF/OTF), bold, italic, underline, strikethrough, letter-spacing, alignment, overflow |
| **Layout**     | Pages, margins, padding, vertical stacks, horizontal stacks, columns, headers & footers                        |
| **Tables**     | Multi-column, cell styling, borders, merged cells                                                              |
| **Images**     | JPEG & PNG embed, aspect-ratio fit modes                                                                       |
| **Shapes**     | Rectangles, lines, ellipses, borders, fills                                                                    |
| **Charts**     | Bar, grouped bar, line, multi-series line, area, pie, dot-plot, lollipop                                       |
| **Lists**      | Ordered & unordered, nested                                                                                    |
| **Links**      | Internal anchors, external hyperlinks                                                                          |
| **Security**   | AES-128/256 encryption, owner/user passwords, print/copy permissions                                           |
| **Metadata**   | XMP metadata, PDF version control, document properties                                                         |
| **Watermarks** | Text or image watermarks with opacity and rotation                                                             |
| **Unicode**    | Full Unicode support including emoji                                                                           |
| **Platform**   | Browser (no WASM, no server) · Node.js · Bun · Deno                                                            |

---

## Examples

All examples run live in your browser at **[bonniepdf.dev/examples](https://bonniepdf.dev/examples)**.

| Example                                                                | What it shows                |
| ---------------------------------------------------------------------- | ---------------------------- |
| [Simple document](https://bonniepdf.dev/examples/01/simple-document)   | Basic text, paragraphs       |
| [Business invoice](https://bonniepdf.dev/examples/02/business-invoice) | Tables, alignment, branding  |
| [Charts showcase](https://bonniepdf.dev/examples/03/chart-showcase)    | All chart types in one doc   |
| [Custom fonts](https://bonniepdf.dev/examples/01/custom-fonts)         | Loading TTF/OTF at runtime   |
| [Encryption](https://bonniepdf.dev/examples/01/encryption)             | Password-protected PDFs      |
| [Headers & footers](https://bonniepdf.dev/examples/01/headers-footers) | Page-level repeating content |
| [Multi-page flow](https://bonniepdf.dev/examples/01/multi-page-flow)   | Content that spans pages     |

---

## API overview

### Document

```typescript
import { Document } from '@bonniepdf/core';

const doc = new Document()
  .metadata({ title: 'My Report', author: 'ACME Corp' })
  .addPage(page => page.size(PdfSize.A4).add(...elements));

const bytes: Uint8Array = await doc.generateAsync();
```

### Text

```typescript
import { TextBlock, RichText } from '@bonniepdf/core';

// Simple
new TextBlock('Hello world').fontSize(14).bold().color('#1a1a1a');

// Rich text (mixed styles in one block)
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
  .columns([150, 100, '*']) // px widths, '*' fills remaining
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

### Security

```typescript
import { Document, Encryption } from '@bonniepdf/core'

new Document()
  .security(
    new Encryption()
      .userPassword('viewer-pass')
      .ownerPassword('admin-pass')
      .allowPrinting()
      .denyкопирование()
  )
  .addPage(...)
```

---

## Installation & environment support

| Environment               | Support                 |
| ------------------------- | ----------------------- |
| Node.js ≥ 16 (ESM)        | ✅                      |
| Node.js ≥ 16 (CommonJS)   | ✅                      |
| Browser (native ESM)      | ✅                      |
| Vite / webpack / esbuild  | ✅                      |
| Bun                       | ✅                      |
| Deno                      | ✅ (via npm: specifier) |
| Edge / Cloudflare Workers | ✅                      |

No native addons. No WASM. No server. The library is a pure TypeScript/JavaScript implementation.

---

## Monorepo structure

```
bonniepdf-js/
├── core/          # @bonniepdf/core — the published npm package
├── examples/      # @bonniepdf/examples — source registry used by the website
└── ui-shared/     # @bonniepdf/ui-shared — React components for the demo site
```

Only `core` is published to npm. `examples` and `ui-shared` are internal packages used by [bonniepdf-website](https://github.com/BonniePDF/bonniepdf-website).

### Prerequisites

- [Node.js](https://nodejs.org) ≥ 18
- [pnpm](https://pnpm.io) ≥ 11 (`npm i -g pnpm`)

### Development

```bash
# Install all workspace dependencies
pnpm install

# Build @bonniepdf/core (outputs to core/dist/)
pnpm build

# Type-check all packages
pnpm typecheck

# Watch mode for core
cd core && pnpm dev
```

### Releasing

This repo uses [Changesets](https://github.com/changesets/changesets) for version management and npm publishing.

1. After making changes to `core/`, run:

   ```bash
   pnpm changeset
   ```

   Follow the prompts to describe your change (patch / minor / major).

2. Commit the generated `.changeset/*.md` file with your PR.

3. When the PR merges to `main`, the `release.yml` workflow automatically opens a **"Version Packages"** PR that accumulates all pending changesets.

4. Merging the Version Packages PR triggers the publish to npm with provenance attestation.

---

## Contributing

1. Fork the repo and create a branch from `main`
2. Make your changes in `core/src/`
3. Run `pnpm changeset` to document the change
4. Ensure `pnpm typecheck` and `pnpm build` both pass
5. Open a pull request — the CI and changeset check will run automatically

Please follow the [PR template](.github/PULL_REQUEST_TEMPLATE.md) and fill in all checklist items.

---

## License

BonniePDF uses a **dual-license** model:

| Use case                                    | License required                                    |
| ------------------------------------------- | --------------------------------------------------- |
| Personal projects                           | [Community](./core/LICENSE) — free            |
| Open source projects (OSI-approved license) | [Community](./core/LICENSE) — free            |
| Commercial / for-profit use                 | [Commercial License](https://bonniepdf.dev/license) |
| Internal business tools                     | [Commercial License](https://bonniepdf.dev/license) |

See [`core/LICENSE`](./core/LICENSE) for the full terms of both options, or visit **[bonniepdf.dev/license](https://bonniepdf.dev/license)** to purchase a Commercial license.

© 2024-present BonniePDF Contributors
