# BonniePDF (TypeScript) — agent guide

TypeScript/JavaScript port of the .NET library. Runs in the **browser** (no WASM for generation itself), **Node**, **Bun**, and **Deno**. Distributed on npm as `@bonniepdf/core`. Built with `tsup`, tested with `vitest`.

For the cross-project picture, see [`../AGENTS.md`](../AGENTS.md). The .NET library at [`../BonniePDF-NET/`](../BonniePDF-NET/) is the **reference implementation** — the API shape here intentionally mirrors it.

## Scope

Same as .NET: generate PDFs from code. Not a parser, not HTML-to-PDF, not a form filler.

## Layout

- `core/` — the published `@bonniepdf/core` package (engine + public API). Tests live in `core/tests/`.
- `examples/registry/` — the shared example catalogue (`@bonniepdf/examples`) consumed by the website.
- `ui-shared/` — React components, nanostores, and `LocalExampleSource` used by the website's live viewer.

## API divergences from .NET (intentional — don't "fix")

These differ on purpose. If you spot what looks like a bug in matching the .NET API, check this list first:

- **Generation is async only in browser contexts.** `await doc.generateAsync()` returns `Uint8Array`. The .NET sync `GenerateBytes()` has no browser equivalent.
- **Encryption builder names:** `withUserPassword(...)` and `withOwnerPassword(...)` — there is no `withPassword(...)`.
- **`versionValue()` is a method**, but `revisionValue` is a getter, on `EncryptionSettings`. Don't unify them.
- **SVG export of charts is a standalone function:** `chartToSvg(chart, data)`, not `chart.toSvg(data)`.
- **`Document` auto-creates the first page on construction.** Calling `addPage()` once after `new Document()` gives you two pages, not one. (The .NET version is lazier.)

## Active stubs (do not treat as implemented)

These have public-API shape but the serializer is incomplete. Tests assert what _is_ written, not what would be in a finished implementation:

- **Encryption serialization** — `/Encrypt` dictionary is **not** written to PDF output yet (Session 4 in the porting plan). The encryption API accepts settings, but the output is not actually encrypted.
- **XMP `pdfaid` namespace content** — only the `/Metadata /Subtype /XML` object is written; the inner pdfaid claims are stubbed.

If a task involves either, confirm scope before implementing — the user may want the stub completed, or may want behaviour around the existing stub.

## Gotchas

### Build / runtime

- **ESM `require('fs')` is broken in tsup output.** `tsup` compiles dynamic `require()` to a shim that throws _"Dynamic require of 'fs' is not supported"_ in Node ESM. A try/catch will silently swallow it and the call site will appear to no-op. **Use static `import * as fs from 'fs'`** in Node-only entry points (`index.node.ts`). The browser bundle must not import `fs` at all.
- **Browser bundle vs Node bundle are distinct entry points.** Don't import Node built-ins from any module that ends up in the browser graph.

### PDF/A-1b + PDF/UA-1 compliance

This is the most accident-prone area. Some hard rules:

- **`FontManager` keys are `family:weight` lowercase.** Mismatched casing means lookup miss → fallback to standard-14 → PDF/A failure.
- **`STANDARD_FONT_MAP`** maps standard-14 names (Helvetica, Times-Roman, Courier) to Liberation family/weight. PDF/A output substitutes Liberation for the standard-14 references so glyphs are actually embedded.
- **`effectivePdfA = settings.pdfAEnabled && !registry.hasNonEmbeddedStandardFont()`.** If any standard-14 font slipped through without embedding, the pdfaid XMP claim is suppressed — that's the this feature guard, not a bug to remove.
- **`OutputIntent` is written conditionally:**
  - PDF/A enabled → only when no non-embedded standard fonts are present (matches the this feature guard).
  - PDF/UA-1 only (no PDF/A) → always written, for colour management.
- **XMP extension schema is required** for any non-predefined namespace (e.g. `pdfuaid`) per ISO 19005-1 §6.7.9. `XmpMetadataWriter` emits a `pdfaExtension:schemas` block when `pdfuaid` is in use. Don't strip it.
- **`ComplianceWriter`:** the one re-exported from the `PdfWriter.ts` barrel is the live implementation. The standalone `ComplianceWriter.ts` file is dead code — don't edit it expecting changes to take effect.
- **Browser font registration:** in the website, `LocalExampleSource.ensureFontsLoaded()` fetches Liberation TTFs from `public/fonts/liberation/` and registers them via `FontManager.registerFont(bytes, { family, subfamily })` **before** generating each PDF. The `registerFontFilePath` path is for Node only and is currently broken under ESM (see above).

## Tests

- Run with `pnpm test` from `core/`. ~165 tests, 1 intentionally skipped.
- Vitest suite was derived from the .NET xUnit suite — keep them conceptually aligned when adding behaviour.
- `helpers/test-base.ts` and `helpers/mock-canvas.ts` set up the browser-ish environment used by chart and font tests.

## When in doubt

- The .NET library is the spec. If a divergence isn't documented above, surface it to the user before "fixing" it — it might be intentional and undocumented, or it might be a real porting bug.
