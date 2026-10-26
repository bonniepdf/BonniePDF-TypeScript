# Changelog

All notable changes to `@bonniepdf/core` are documented here. Versions use
CalVer (`yyyy.m.minor`), decided by the versioning tool and released
by pushing a `v<version>` tag (see `.github/workflows/release.yml`).

## Unreleased

### Examples

- Add focused page-break, practical-table, browser-download, font-fallback and diagnostics recipes with runnable browser, HTTP and async batch companions.
- Add large-order invoice, long-basket receipt and multilingual customer-letter examples.
- Refresh headers, image assets and receipt host instructions; remove the paper-size gallery.

## 2026.10.22

Status: Prerelease

### Highlights

- Granular `defaultTextStyle` cascading for family, weight, italic, and decoration
- Automatic Liberation font fallback for extended Latin, Greek, and Cyrillic scripts
- Strict glyph-coverage verification via `settings.missingGlyphs`
- Expanded Community and Commercial licensing for browser, desktop, and mobile apps

### Typography & Styling

- **Granular style inheritance:** `defaultTextStyle` cascades `fontFamily`, `fontWeight`, `italic`, and `decoration` independently across document elements.
- **Extended script coverage:** Standard fonts (`Helvetica`, `Times`, `Courier`) automatically fall back to bundled Liberation faces for extended Unicode ranges while deduplicating embedded font subsets.
- **Strict glyph validation:** `settings.missingGlyphs = 'throw'` enables CI and production pipelines to fail fast if a document contains unmapped characters.
- **Chart palette defaults:** Chart-level colour options (`barColor`, `lineColor`, `areaColor`, `dotColor`, `lollipopColor`) cascade automatically to series without explicit overrides.

## 2026.10.15

Status: Prerelease

### Highlights

- High-throughput text shaping, paragraph wrapping, and large-table layout
- Reduced memory footprint with cached font byte parsing
- Right-to-left (`contentDirection`) layout with Arabic and Hebrew shaping
- OpenType CFF (`.otf`) font support and opt-in colour emoji

### Performance Improvements

- **Accelerated layout engine:** Single-pass paragraph wrapping, optimised OpenType lookup tables, and single-pass table column sizing deliver multi-fold speedups on data-heavy reports.
- **Low-memory footprint:** Early page stream compression, shared style options, and cached font byte parsing in `doc.fonts.add` minimise memory use and GC pressure on large documents.
- **Fast image pipeline:** Optimised RGBA image resampling preserves exact pixel fidelity and resolution caps with lower overhead.

### Features

- **Right-to-left & bidi typography:** Inherited `settings.contentDirection` (`'ltr'` / `'rtl'`) with visual mirroring for rows and tables, plus native Arabic and Hebrew script shaping.
- **OpenType CFF & colour emoji:** Full layout, SVG preview, and PDF embedding support for static `.otf` (CFF 1) fonts and opt-in `emojiRendering: 'colour'` (COLRv0 and CBDT).
- **Authoring ergonomics:** Concise string and line shorthand across document, page, stack, and table cell builders.

## 2026.10.0

Status: Prerelease

### Highlights

- Portable JSON Document Definitions (`fromDefinition` and `toDefinition`)
- Native vector `Svg` element and automatic `maxImageDpi` downsampling
- Declarative `Rotate`, `Flip`, `Translate`, and pagination control elements
- Tree-shakable ESM build and WCAG 2.2 AA colour-contrast preflight checks

### Document Engine & API

- **JSON Document Definitions:** Build, validate, and serialise complete documents using language-neutral JSON definitions via `@bonniepdf/core/definition` (`fromDefinition`, `validateDefinition`, `toDefinition`).
- **Vector SVG & smart image pipeline:** Render crisp vector graphics with the `Svg` element and automatically cap embedded raster resolution via `DocumentSettings.maxImageDpi` (default 288 DPI).
- **Layout & transform primitives:** Native `Rotate`, `Flip`, and `Translate` wrappers, `Container.fillHeight`, declarative `pageTemplate`, and pagination controls (`EnsureSpace`, `PreventPageBreak`, `ShowEntire`, `ShowIf`).
- **Accessibility & e-invoicing:** Automated WCAG 2.2 AA text-contrast checks in `evaluateCompliance`, plus embedded file attachments and Factur-X / ZUGFeRD (`applyFacturX`) support.
- **Modern packaging & units:** Tree-shakable per-module ESM build, document-scoped fonts (`doc.fonts.add`), and unit-suffixed measurements (`'1in'`, `'10mm'`, `'2cm'`, `'14pt'`).
