# Changelog

All notable changes to `@bonniepdf/core` are documented here. Versions use
CalVer (`yyyy.m.minor`), decided by the versioning tool and released
by pushing a `v<version>` tag (see `.github/workflows/release.yml`).

## Unreleased

### Packaging

- **Types resolve under `moduleResolution: "node16"` and `"nodenext"`:** the published declaration files now import their siblings with explicit `.js` extensions, as the JavaScript already did. Before, TypeScript applications using those settings saw no exports at all (`Module '"@bonniepdf/core"' has no exported member 'Document'`). Bundler resolution and runtime behaviour are unchanged. CI and the release workflow now typecheck a NodeNext consumer of every entry point against the built package.
- **CommonJS declarations for `require`:** every entry point now ships `.d.cts` declarations, and the `require` conditions in `exports` point at them. CommonJS TypeScript projects on `moduleResolution: "node16"` (or on `"nodenext"` with TypeScript older than 5.8) used to get `TS1479` on every import, because the CommonJS build was described by ES module declarations. Runtime files and ES module consumers are unchanged. The consumer check now covers an ES module and a CommonJS consumer under `node16`.

### Document Engine & API

- **Links no longer draw a box:** link annotations now write `/Border [0 0 0]`. Without it a viewer applies the PDF default, a one-point border, and many draw it as a rectangle around every hyperlink, table-of-contents entry and cross-reference. The link text, its colour and the active region are unchanged; no other output changes.

- Added opt-in `theme: 'modern'`, measured label spacing and `barStyle` rounded value ends/opaque linear gradients on bar and grouped-bar charts. SVG and native PDF share resolved vector geometry; modern SVG text uses PDF baselines. Styles round-trip through document definitions. Legacy output is unchanged.

- **Gradient pie slices:** `PieChart` gains `sliceGradient` (default `false`). Each slice fades from a lighter tint of its colour at the centre, or the donut hole, to its own colour at the rim, drawn as a native PDF shading and an SVG linear gradient. Slice colours must be opaque. The option round-trips through document definitions; pies without it are unchanged.

- **Charts honour `minValue`:** Cartesian charts now place values linearly between `yAxis.minValue` and `yAxis.maxValue`, so marks line up with the axis tick labels; before, a non-zero `minValue` moved the tick labels but not the data. Bars, grouped bars, area fills and lollipop stems start at zero limited to the axis range: a zero line inside the plot when the range crosses zero, the top edge when every value is negative. The modern theme draws its baseline at that zero line in vertical charts. Drawing a chart with series now throws a `RangeError` when `maxValue` is not greater than `minValue` or either is not finite, where it used to produce non-finite geometry. Charts with `minValue: 0` are unchanged.

- **Chart value labels stay outside their marks:** A value below the axis origin (zero, limited to the axis range) is now labelled below its point, or to the left of it and right-aligned in horizontal charts, with the same gap as a label above. It used to be labelled on the far side of its own bar, stem or fill, where it was hidden by the mark. Applies to every cartesian chart in both themes; labels for values at or above the origin are unchanged. The modern theme still omits a moved label that would collide with another.

- Chart drawing sources are shared with the standalone BonnieCharts engine and compiled into this package. Existing chart APIs, document layout, accessibility and output are preserved; no runtime dependency is added.

- **Source layout matches the .NET implementation:** Internal source files are now named and split one type per file to match the .NET library: `ShowOnce`, `SkipOnce`, `ChartSeriesStyle`, `PageRenderOutput`, `PdfRenderResult`, `ImageFormat`, `ImageColorSpace` and `QrErrorCorrection` have their own modules, the encryption modules are named after their classes, and page-content compression goes through one `ContentCompression` helper. Public exports and output are unchanged.

## 2026.10.28

Status: Prerelease

### Highlights

- Faster paragraph wrapping for everyday prose with curly quotes, dashes, and accented letters
- Up to 25% faster DEFLATE stream compression with byte-identical output
- Multi-fold layout speedups on long documents formatted with embedded fonts
- New runnable recipes for page breaks, practical tables, downloads, font fallback, and batch generation
- New industry invoice, long-basket receipt, and customer letter examples

### Performance Improvements

- **Faster wrapping for everyday prose:** Paragraphs containing curly quotes, dashes, accented letters or symbols such as `€` and `™` now wrap from a single shaping pass, as plain ASCII already did. Long documents in embedded fonts, which PDF/A and PDF/UA always use, generate several times faster; a full novel under PDF/A-2a and PDF/UA-1 drops from about 16 s to about 2.4 s. Output is byte-for-byte unchanged.
- **Faster compression:** Stream compression is about a quarter faster and produces exactly the same bytes.

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
