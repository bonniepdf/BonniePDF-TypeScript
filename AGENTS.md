# BonniePDF (TypeScript) - agent guide

TypeScript/JavaScript port of the .NET library. Runs in the **browser** (no WASM for generation itself), **Node**, **Bun**, and **Deno**. Distributed on npm as `@bonniepdf/core`. Built with `tsup`, tested with `vitest`.

For the cross-project picture, see [`../AGENTS.md`](../AGENTS.md). The .NET library at [`../BonniePDF-NET/`](../BonniePDF-NET/) is the **reference implementation** - the API shape here intentionally mirrors it.

## Scope

Same as .NET: generate PDFs from code. Not a parser, not HTML-to-PDF, not a form filler.

## Layout

- `core/` - the published `@bonniepdf/core` package (engine + public API). Tests live in `core/tests/`.
- `examples/registry/` - the shared example catalogue (`@bonniepdf/examples`) consumed by the website.
- `ui-shared/` - React components, nanostores, and `LocalExampleSource` used by the website's live viewer.

## API divergences from .NET (intentional - don't "fix")

These differ on purpose. If you spot what looks like a bug in matching the .NET API, check this list first:

- **Generation is async only in browser contexts.** `await doc.generateAsync()` returns `Uint8Array`. The .NET sync `GenerateBytes()` has no browser equivalent.
- **Encryption builder names:** `withUserPassword(...)` and `withOwnerPassword(...)` - there is no `withPassword(...)`.
- **`versionValue()` is a method**, but `revisionValue` is a getter, on `EncryptionSettings`. Don't unify them.
- **SVG export of charts is a standalone function:** `chartToSvg(chart, data)`, not `chart.toSvg(data)`.
- **`Document` auto-creates the first page on construction.** Calling `addPage()` once after `new Document()` gives you two pages, not one. (The .NET version is lazier.)
- **Tailwind palette tokens live on `ColorPalette`, not `Color`.** `Color` is just the RGBA primitive (`black`/`white`/`red`/`fromHex`/…); it does **not** carry `red500` etc. Access shades via `ColorPalette.red[500]` (bracket-on-a-frozen-`Record`, since TS has no class indexers). The .NET port uses a real indexer (`ColorPalette.Red[500]`) — same shape, different mechanism, don't "unify" them. `ColorPalette` is the **single source of truth** for the hex values; they are the exact Tailwind v4 swatches and are intentionally **not** computed from a base colour (Tailwind ramps are hand-tuned in OKLCH). See [`core/src/Core/ColorPalette.ts`](core/src/Core/ColorPalette.ts).

## Active stubs (do not treat as implemented)

These have public-API shape but the serializer is incomplete. Tests assert what _is_ written, not what would be in a finished implementation:

- ~~**Encryption serialization** - `/Encrypt` dictionary is **not** written to PDF output yet (Session 4 in the porting plan). The encryption API accepts settings, but the output is not actually encrypted.~~ **Shipped** (`feat(security): implement AES-256 encryption support`). The `/Encrypt` dictionary is written (`PdfDocumentSerializer` → `writer.writeEncryptDictionary`, referenced from the trailer), and content streams/strings are genuinely encrypted via `PdfEncryptor.encryptData` / `encryptString`. Supports **RC4 (40/128-bit)** and **AES-256 (V5/R6, ISO 32000-2:2020 Algorithm 2.B)**. Integration tests in `core/tests/encryption.test.ts` assert the emitted `/Encrypt`, `/V 5`, `/R 6`, `/OE`, `/UE`, `/Perms`, `/StmF /StdCF`, `/StrF /StdCF`, and that encrypted streams differ from plaintext.
  - **AES-256 needs the async generate path.** Key derivation runs via `SubtleCrypto`, so AES-256 requires `generateBytesAsync()` (the serializer does async key derivation, then a sync `SyncAesCipher` pass). RC4 works under sync `generateBytes()`. AES-256 also requires PDF 1.7 (throws on Pdf14). `AsyncPdfWriter.writeEncryptDictionaryAsync` itself is unimplemented, but the live `PdfWriter` path handles both.
- ~~**XMP `pdfaid` namespace content** - only the `/Metadata /Subtype /XML` object is written; the inner pdfaid claims are stubbed.~~ Shipped - `XmpConformanceBlock.forPdfA(settings.conformance)` emits the right `pdfaid:part` / `pdfaid:conformance` pair for every level.

Both items above are now shipped - the section is kept as a historical record. If a new task touches encryption or PDF/A XMP, treat them as implemented and verify against the tests rather than assuming a stub.

## Gotchas

### Build / runtime

- **ESM `require('fs')` is broken in tsup output.** `tsup` compiles dynamic `require()` to a shim that throws _"Dynamic require of 'fs' is not supported"_ in Node ESM. A try/catch will silently swallow it and the call site will appear to no-op. **Use static `import * as fs from 'fs'`** in Node-only entry points (`index.node.ts`). The browser bundle must not import `fs` at all.
- **Browser bundle vs Node bundle are distinct entry points.** Don't import Node built-ins from any module that ends up in the browser graph.

### PDF/A + PDF/UA-1 compliance

This is the most accident-prone area. Some hard rules:

- **`settings.conformance` is the source of truth.** `PdfAConformance` enum: `None`, `PdfA1b`, `PdfA1a`, `PdfA2b`, `PdfA2a`, `PdfA3b`, `PdfA3a`. The legacy boolean `settings.pdfAEnabled` is now a getter/setter shim - reading returns `conformance !== None`, writing `true` selects `PdfA2b`. All XMP emission paths read `conformance`, not the boolean.
- **"a" levels require tagged output.** `PdfA1a` / `PdfA2a` / `PdfA3a` need `settings.accessibility = AccessibilityMode.PdfUa1`. The serializer enforces this.
- **`FontManager` keys are `family:weight` lowercase.** Mismatched casing means lookup miss → fallback to standard-14 → PDF/A failure.
- **`STANDARD_FONT_MAP`** maps standard-14 names (Helvetica, Times-Roman, Courier) to Liberation family/weight. PDF/A output substitutes Liberation for the standard-14 references so glyphs are actually embedded.
- **PDF/UA-1 also forces standard-14 embedding** (veraPDF rule 7.21.4.1), independently of any PDF/A claim. The embedding gate in `PdfResourceRegistry.registerFont` is `shouldEmbedStandardFonts` (= PDF/A conformance **or** `embedStandardFonts`), and the serializer sets `resources.embedStandardFonts` from `settings.accessibility === PdfUa1`. Don't narrow that gate back to `pdfAEnabled` only - tagged-but-not-PDF/A documents would then ship unembedded Type1 fonts and fail the `ua1` veraPDF gate.
- **Honest-claim guard:** when standard-14 fonts slip through unembedded, the serializer clones `settings` with `conformance` reset to `None` and uses that clone for XMP / OutputIntent emission. The this feature guard suppresses the claim rather than emitting a dishonest one. Don't remove it; don't set `pdfAEnabled = false` on the clone (it's now a derived getter - the override won't take).
- **`OutputIntent` is written conditionally:**
  - PDF/A enabled → only when no non-embedded standard fonts are present (matches the this feature guard).
  - PDF/UA-1 only (no PDF/A) → always written, for colour management.
- **XMP extension schema is required** for any non-predefined namespace (e.g. `pdfuaid`) per ISO 19005-2/3 §6.6.2.3. The descriptor hangs off `XmpConformanceBlock.extensionSchema` (set by the `pdfUa1()` factory). `XmpMetadataWriter` emits a `pdfaExtension:schemas` bag whenever a PDF/A claim coexists with at least one schema-carrying block. Don't strip it - veraPDF profile `2a` and above will fail without it.
- **Resources live on the page, not the parent.** Each `/Page` carries its own `/Resources` indirect reference to a single object written via `IPdfWriter.writeRawObject` (PDF/A-2b clause 6.2.2.2). The `/Pages` parent does not carry `/Resources`. Don't "fix" this back to inheritance.
- **`Rendering/Writers/` is one type per file, mirroring the .NET `Rendering/Writers` layout:** `IPdfWriter`, `IAsyncPdfWriter`, `CatalogOptions`, `PdfWriter` (which also holds its private `BinaryOutputStream` + `encodeIso88591` infrastructure), `AsyncPdfWriter`, `FontWriter`, `MetadataWriter`, `NavigationWriter`, `ComplianceWriter`, `StructureTreeWriter`. Import each type from its own module (not from a barrel). `MetadataWriter`/`NavigationWriter` reuse `PdfSyntax.escape`/`encodeMetadataString`/`formatDate` rather than rolling their own — keep it that way.
- **Browser font registration:** in the website, `LocalExampleSource.ensureFontsLoaded()` fetches Liberation TTFs from `public/fonts/liberation/` and registers them via `FontManager.registerFont(bytes, { family, subfamily })` **before** generating each PDF. The `registerFontFilePath` path is for Node only and is currently broken under ESM (see above).

## Tests

- Run with `pnpm test` from `core/`. ~165 tests, 1 intentionally skipped.
- Vitest suite was derived from the .NET xUnit suite - keep them conceptually aligned when adding behaviour.
- `helpers/test-base.ts` and `helpers/mock-canvas.ts` set up the browser-ish environment used by chart and font tests.

## When in doubt

- The .NET library is the spec. If a divergence isn't documented above, surface it to the user before "fixing" it - it might be intentional and undocumented, or it might be a real porting bug.
