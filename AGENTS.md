# BonniePDF (TypeScript) - agent guide

The TypeScript implementation of BonniePDF. Runs in the **browser** (no WASM for generation), **Node**, **Bun**, and **Deno**. Published on npm as `@bonniepdf/core`. Built with `tsup`, tested with `vitest`.

For the cross-project picture, see [`../AGENTS.md`](../AGENTS.md). The .NET implementation lives at [`../BonniePDF-NET/`](../BonniePDF-NET/).

## What BonniePDF is

BonniePDF generates PDF documents from code using an object-composition layout model: you build a tree of elements (text, tables, lists, images, shapes, charts), and the engine measures, flows, and paginates them into PDF bytes. It is **not** an HTML-to-PDF engine, **not** a PDF parser, and **not** a form filler. Zero runtime dependencies, no native binaries, no headless browser.

## The parity principle (read this first)

**BonniePDF is one library with two co-equal, first-class implementations.** TypeScript and .NET are peers. Neither is a port of the other; neither is "the reference" the other chases. Both implement the same **language-neutral specification** (`the shared specification` — the document model, the layout/pagination algorithm, the element catalogue, the compliance rules, and the expected PDF output). The spec is the source of truth; the two codebases are siblings that conform to it.

This has three consequences that govern almost every decision in this repo:

1. **Behavioural parity is the contract.** The same logical document produces the same PDF output in both implementations, byte-for-byte where the spec defines bytes (object structure, content streams, XMP, font subsetting), modulo the platform-mandated differences listed below. The shared conformance suite — not the other language's source — is what verifies this. If TS and .NET disagree on output for equivalent input, one of them has a bug against the spec.

2. **The API surface is idiomatic, not transliterated.** TypeScript code must read like TypeScript and .NET code like C#. We do **not** copy the other language's casing, overload style, or naming. A C# `AddRow(TableRow)` overload does not become a TS `addRowRow`; a C# property does not keep its PascalCase in TS. Idiomatic divergence in _spelling_ is expected and correct. Behavioural divergence is a bug. See [`the specification`](the specification) for the conventions that define "idiomatic" here.

3. **Features land in lockstep against the spec.** A capability is not "done" until it exists in the spec, in both implementations, and in the shared conformance suite. Adding a feature to one language only is a parity break — flag it, don't ship it silently.

When you find a difference between this code and .NET, classify it before acting: **(a)** a platform-mandated difference (allowed — see below), **(b)** an idiomatic-surface difference (allowed — same behaviour, different spelling), or **(c)** a behavioural divergence (a bug in one implementation). Only (c) is a defect. Don't "fix" (a) or (b) by transliterating .NET.

## Platform-mandated differences (allowed by the spec)

These exist because the runtimes differ, not because one side is behind. The spec explicitly permits them:

- **Async is the universal path; sync is Node-only.** `await doc.generateBytesAsync(): Promise<Uint8Array>` works everywhere and is the documented default. The synchronous `doc.generateBytes()` exists only where the platform allows it (Node font IO via `fs`, RC4). AES-256 and any path needing `SubtleCrypto` are async-only. The .NET sync `GenerateBytes()` has no browser equivalent — that is expected, not a gap.
- **Two distinct bundles.** A browser entry point and a Node entry point (`index.node.ts`). Node built-ins (`fs`, `crypto`) must never enter the browser graph. Image/font sources reflect this: `imageData`/byte sources are universal; `filePath` is Node-only.
- **Palette access mechanism.** `ColorPalette.red[500]` is bracket access on a frozen `Record` (TS has no class indexers); .NET exposes the same shape through a real indexer. Same tokens, same hex values, different mechanism. Don't unify the mechanism.

## The TypeScript surface (what idiomatic means here)

The public API targets the shape a TypeScript developer expects. Authoring code should be guessable from autocomplete and copy-pasteable without ceremony.

- **camelCase everywhere** for properties, methods, and accessors. No PascalCase members on the public surface — ever. (`fontSize`, not `FontFamily`; `children`, not `Children`.)
- **Options objects over positional overloads.** Constructors and factories take a single typed options object; positional forms are convenience sugar, not the primary surface.
- **Factory functions as the front door.** `text(...)`, `container(...)`, `table(...)`, `doc(...)` build elements without `new` and without per-property mutation. The underlying classes remain public for power users and parity, but the docs lead with factories.
- **Uniform fluent configuration.** Every element supports the same `.with*` / configure pattern; fluency is not limited to a privileged few types.
- **Forgiving inputs, normalised internally.** Colours accept palette tokens, `Color` instances, or hex strings; spacing accepts a number, a `[h, v]` pair, or a per-side object; enums accept their string-literal union. All are normalised to the canonical value object inside the engine. `ColorPalette` remains the single source of truth for token hex values.

The current code does not yet meet this bar in every place. [`the specification`](the specification) is the authoritative description of the target surface and the migration to it. When you touch public API, move it toward that guide; do not add new surface that violates it.

## Repository layout

- `core/` — the published `@bonniepdf/core` package (engine + public API). Tests in `core/tests/`.
- `examples/registry/` — the shared example catalogue (`@bonniepdf/examples`) consumed by the website. Examples double as smoke tests of the public surface; they must use the idiomatic front-door API, not legacy mutation patterns.
- `ui-shared/` — components, stores, and `LocalExampleSource` used by the website's live viewer.
- `docs/` — API specification notes and the refactoring guide.

## Engineering invariants (spec-level — both implementations honour these)

These are not TS quirks; they are correctness requirements of the format and the shared spec. Changing them changes output validity.

### Build / runtime

- **Use static `import * as fs from 'fs'` in Node-only modules.** `tsup` compiles dynamic `require()` to a shim that throws _"Dynamic require of 'fs' is not supported"_ under Node ESM; a try/catch swallows it and the call silently no-ops. The browser bundle must not import `fs` at all.

### PDF/A + PDF/UA-1 compliance (the most accident-prone area)

- **`settings.conformance` is the source of truth.** `PdfAConformance`: `None`, `PdfA1b`, `PdfA1a`, `PdfA2b`, `PdfA2a`, `PdfA3b`, `PdfA3a`, `PdfA4`. All XMP/OutputIntent emission reads `conformance`.
- **"a" levels require tagged output.** `PdfA1a`/`PdfA2a`/`PdfA3a` need `settings.accessibility = AccessibilityMode.PdfUa1`. The serializer enforces this.
- **Version auto-upgrade.** PDF/A-1/2/3 → `Pdf17`; PDF/A-4 → `Pdf20`.
- **Standard-14 embedding is forced under PDF/A _and_ under PDF/UA-1** (veraPDF 7.21.4.1), independently of any PDF/A claim. The embedding gate is `shouldEmbedStandardFonts` (PDF/A conformance **or** `embedStandardFonts`); the serializer sets `resources.embedStandardFonts` from `accessibility === PdfUa1`. Don't narrow it back to a PDF/A-only check.
- **`FontManager` keys are `family:weight` lowercase.** Casing mismatch → lookup miss → standard-14 fallback → compliance failure.
- **Honest-claim guard.** When standard-14 fonts slip through unembedded, the serializer emits XMP/OutputIntent from a `settings` clone with `conformance` reset to `None`, suppressing a claim it can't honour. Don't remove it.
- **`OutputIntent` is conditional:** PDF/A → only when no non-embedded standard fonts remain (matches the guard); PDF/UA-1-only → always, for colour management.
- **XMP extension schema is required** for any non-predefined namespace (e.g. `pdfuaid`) per ISO 19005-2/3 §6.6.2.3. Don't strip it — veraPDF `2a`+ fails without it.
- **Resources live on the page, not the `/Pages` parent** (PDF/A-2b 6.2.2.2). Don't "fix" this to inheritance.
- **The `.notdef` guard.** The encoder must never emit GID 0 for a real code point (PDF/A-2 6.2.11.8, PDF/UA-1 7.21.8). `resolveTextRuns` splits text into per-font runs, routes uncovered code points to registered fallback fonts in registration order, drops control/default-ignorable code points before shaping, and drops truly uncovered code points with a `font` diagnostic rather than emitting `.notdef`. Plain Latin in a covering primary font stays a single run, byte-identical to the pre-fallback path.

### Writers

- **`Rendering/Writers/` is one type per file**, mirroring the shared spec's writer decomposition: `IPdfWriter`, `IAsyncPdfWriter`, `CatalogOptions`, `PdfWriter`, `AsyncPdfWriter`, `FontWriter`, `MetadataWriter`, `NavigationWriter`, `ComplianceWriter`, `StructureTreeWriter`. Import each from its own module (no barrel). Metadata/Navigation writers reuse `PdfSyntax.escape`/`encodeMetadataString`/`formatDate` — keep it that way.

### Fonts in the browser

- `LocalExampleSource.ensureFontsLoaded()` fetches Liberation TTFs from `public/fonts/liberation/` and registers them via `FontManager.registerFont(bytes, { family, subfamily })` **before** generating. `registerFontFilePath` is Node-only.

## Implementation status

Encryption (RC4 40/128, AES-256 V5/R6) and PDF/A XMP are **shipped and serialized**, verified by `core/tests/encryption.test.ts` and the conformance suite. Treat them as implemented and verify against tests, not against assumptions. PDF/UA-2 and PDF/A-4e/4f are not implemented in either language (tracked in the spec roadmap).

## Tests

- `pnpm test` from `core/`. The vitest suite and the .NET xUnit suite are both derived from the **shared conformance fixtures**, not from each other. When you change behaviour, update the fixtures and both suites together — that is how parity is enforced.
- `helpers/test-base.ts` and `helpers/mock-canvas.ts` set up the browser-ish environment for chart/font tests.

## When in doubt

- The **spec** is the authority, not the other language's source. If a change here would force a behavioural divergence from the spec (and therefore from .NET), surface it — it likely needs a spec change applied to both implementations.
- For anything touching the public API shape, consult [`the specification`](the specification) before adding surface.
