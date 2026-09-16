# BonniePDF (TypeScript) — agent guide

The TypeScript implementation of BonniePDF. Runs in the **browser** (no WASM for generation), **Node**, **Bun**, and **Deno**. npm package name: `@bonniepdf/core`. Built with `tsup`, tested with `vitest`.

> **This repository is public.** Keep this file, the README, and code comments useful to an outside contributor who has cloned only this repo. Don't reference internal documents, private sibling repositories, or unshipped plans here.

## What BonniePDF is

BonniePDF generates PDF documents from code using an object-composition layout model: you build a tree of elements (text, tables, lists, images, shapes, charts), and the engine measures, flows, and paginates them into PDF bytes. It is **not** an HTML-to-PDF engine, **not** a PDF parser, and **not** a form filler. Zero runtime dependencies, no native binaries, no headless browser.

## The parity principle (read this first)

**BonniePDF is one library with two co-equal, first-class implementations.** TypeScript and .NET are peers. Neither is a port of the other; neither is "the reference" the other chases. Both implement the same **language-neutral specification** — the document model, the layout/pagination algorithm, the element catalogue, the compliance rules, and the expected PDF output. The spec is the source of truth; the two codebases are siblings that conform to it.

This has three consequences that govern almost every decision in this repo:

1. **Behavioural parity is the contract.** The same logical document produces the same PDF output in both implementations, byte-for-byte where the spec defines bytes (object structure, content streams, XMP, font subsetting), modulo the platform-mandated differences listed below. The shared conformance suite — not the other language's source — is what verifies this. If TypeScript and .NET disagree on output for equivalent input, one of them has a bug against the spec.

2. **The API surface is idiomatic, not transliterated.** TypeScript code must read like TypeScript and .NET code like C#. We do **not** copy the other language's casing, overload style, or naming. A C# `AddRow(TableRow)` overload does not become a TS `addRowRow`; a C# property does not keep its PascalCase in TS. Idiomatic divergence in _spelling_ is expected and correct. Behavioural divergence is a bug.

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
- **Factory functions as the front door.** `text(...)`, `container(...)`, `table(...)`, `document(...)` build elements without `new` and without per-property mutation. The underlying classes remain public for power users and parity, but the docs lead with factories.
- **Two tiers, not three.** Factories are the front door; the classes are the escape hatch. There is no TypeScript fluent builder (`Pdf.create`) and no transliterated static `Extensions/` classes — do not add either, and do not "restore parity" by mirroring the C# ones, which are idiomatic there and not here.
- **Forgiving inputs, normalised internally.** Colours accept palette tokens, `Color` instances, or hex strings; spacing accepts a number, a `[h, v]` pair, or a per-side object; enums accept their string-literal union. All are normalised to the canonical value object inside the engine. `ColorPalette` remains the single source of truth for token hex values.

When you touch public API, move it toward this shape; do not add new surface that violates it.

## Repository layout

- `core/` — the published `@bonniepdf/core` package (engine + public API). Tests in `core/tests/`.
- `examples/src/` — the shared example catalogue (`@bonniepdf/examples`), split into `recipes/`, `showcases/`, and `conformance/`. Examples double as smoke tests of the public surface; they must use the idiomatic front-door API, not construct-then-mutate patterns. **One deliberate exception:** a `*-classes.ts` file (e.g. `recipes/basics/simple-document-classes.ts`) is a construct-then-mutate _companion_ to its options-object sibling, kept to document the underlying class/escape-hatch surface. Do **not** "fix" it to the front-door style — `scripts/verify-equivalence.ts` asserts each companion renders byte-for-byte identically to its canonical form.
- `docs/` — **README assets only**: `docs/images/showcase/` (first-page SVG previews) and `docs/pdf/` (the full PDFs those previews link to), both regenerated by `pnpm generate-showcase`. There is **no prose documentation here** and none should be added — the docs site is built elsewhere. Don't hand-place files in `docs/`; change the showcase example and re-run the script.

**Example copy style:** example descriptions, headers, and in-PDF prose must not expose PDF internals (`/H1`, `/Artifact`, "structure tree", "associated file"). Write for someone who wants a document, not for someone reading the spec.

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
- **The `.notdef` guard.** The encoder must never emit GID 0 for a real code point (PDF/A-2 6.2.11.8, PDF/UA-1 7.21.8). `resolveTextRuns` splits text into per-font runs, routes uncovered code points to registered fallback fonts in registration order, drops control/default-ignorable code points before shaping, and drops truly uncovered code points with a `font` diagnostic rather than emitting `.notdef`. Plain Latin in a covering primary font stays a single run, byte-identical to the non-fallback path.

### Licence declaration

- **`settings.license` is a declaration, never an enforcement mechanism.** No key, no activation, no network call, no telemetry, no tier-dependent feature gating. `Licensing/` contains the whole of it; nothing else in the engine may read the declared tier.
- **It must never change output.** `licence-declaration.test.ts` generates the same document under every tier and compares bytes (masking only the trailer's random `/ID`). A watermark, a metadata field, or any free-tier degradation is a spec violation, not a product decision to be made here.
- **It never throws without positive evidence** of a development, test, or CI environment — `classifySignals` decides, as a pure function. `unknown` warns. Do not "improve" this by treating an unset `NODE_ENV` as development: that would make a production deployment fail on upgrade, which is the failure mode the design exists to avoid.
- **The notice writes to `console.warn`**, which is a deliberate, documented exception to the rule that the library never writes to a global sink the caller did not opt into (see `Core/Diagnostics.ts`). It fires at most once per process. Don't widen the exception; don't route ordinary diagnostics through it.
- Every first-party surface that generates documents declares its own tier — the test setup, the tooling scripts, the website. Adding a new generating script means adding a declaration to it.

### Writers

- **`Rendering/Writers/` is one type per file**, mirroring the shared spec's writer decomposition: `IPdfWriter`, `IAsyncPdfWriter`, `CatalogOptions`, `PdfWriter`, `AsyncPdfWriter`, `FontWriter`, `MetadataWriter`, `NavigationWriter`, `ComplianceWriter`, `StructureTreeWriter`. Import each from its own module (no barrel). Metadata/Navigation writers reuse `PdfSyntax.escape`/`encodeMetadataString`/`formatDate` — keep it that way.

### Fonts in the browser

- `LocalExampleSource.ensureFontsLoaded()` fetches Liberation TTFs from `public/fonts/liberation/` and registers them via `FontManager.registerFont(bytes, { family, subfamily })` **before** generating. `registerFontFilePath` is Node-only.

## Implementation status

Encryption (RC4 40/128, AES-256 V5/R6) and PDF/A XMP are implemented and serialized, verified by `core/tests/encryption.test.ts` and the conformance suite. Verify against the tests, not against assumptions. PDF/UA-2 and PDF/A-4e/4f are not implemented in either language.

## Commands

This repo is a nested pnpm workspace (`core`, `examples`) orchestrated by **turbo**.

```bash
# from this repo
pnpm build          # turbo run build   (tsup + emitDeclarationOnly)
pnpm typecheck
pnpm lint           # eslint core/src core/tests  (currently fails - see below)
pnpm generate-tagged

# from core/
pnpm test           # vitest run
pnpm test:watch
pnpm test:coverage
pnpm test:pdf-validation   # builds, then validates PDF/A-4 samples
```

`pnpm --filter @bonniepdf/examples verify-equivalence` asserts each `*-classes.ts` companion renders byte-for-byte identically to its options-object sibling.

**`pnpm lint` does not currently run.** typescript-eslint refuses to load against the TypeScript 7 native compiler this repo builds with, and throws before linting anything ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)). The `eslint --fix` step has been removed from the lint-staged pre-commit config for the same reason - it blocked every commit touching `core/src` instead of catching defects. Restore both once upstream supports the TypeScript version pinned in `core/package.json`; the reasoning is repeated in `.husky/pre-commit`.

## Tests

- `pnpm test` from `core/`. The vitest suite and the .NET xUnit suite are both derived from the **shared conformance fixtures**, not from each other. When you change behaviour, update the fixtures and both suites together — that is how parity is enforced.
- `helpers/test-base.ts` and `helpers/mock-canvas.ts` set up the browser-ish environment for chart/font tests.
- **The suite is on strict TypeScript, and `pnpm typecheck` covers it.** Two configs, because one cannot do both jobs: `tsconfig.json` has `rootDir: "src"` and drives the build's declaration emit, so it cannot include `tests/`; [`core/tsconfig.tests.json`](core/tsconfig.tests.json) typechecks the suite. `typecheck` runs both — keep it that way, and don't loosen either to land a change. (Until Sept 2026 only the first ran, so the suite was never typechecked and had accumulated 132 errors. Most were calls passing three arguments to two-argument constructors, where the extras were silently dropped: tests naming `HelveticaBold` or a 48pt size were in fact rendering 12pt Helvetica.)
- **This repo builds with the TypeScript 7 native compiler**, which does not expose the classic compiler API (`ts.createProgram`, `ts.ScriptTarget`, …). Tooling that needs the classic API must pin its own alias; don't assume `import ts from 'typescript'` provides it.

## When in doubt

- The **spec** is the authority, not the other language's source. If a change here would force a behavioural divergence from the spec (and therefore from .NET), surface it — it likely needs a spec change applied to both implementations.
- `README.md` is the authoritative user-facing description. Keep it in sync with public-API changes.
