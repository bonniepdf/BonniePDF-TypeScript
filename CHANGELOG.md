# Changelog

All notable changes to `@bonniepdf/core` are documented here. Versions use
CalVer (`yyyy.m.minor`), decided by the versioning tool and released
by pushing a `v<version>` tag (see `.github/workflows/release.yml`).

## 2026.11.12

Status: Prerelease

### Highlights

- Table rows taller than a page, and rounded containers, now split across pages
- Carried-forward page subtotals for tables that break across pages
- Links inside a sentence, and link addresses outside ASCII open correctly
- Modern chart theme, gradient pie slices and donut totals in the centre
- Corrupt or oversized images fail with a catchable error before any pixel data is inflated

### Packaging

- **Types resolve under `moduleResolution: "node16"` and `"nodenext"`:** the published declaration files now import their siblings with explicit `.js` extensions, as the JavaScript already did. Before, TypeScript applications using those settings saw no exports at all (`Module '"@bonniepdf/core"' has no exported member 'Document'`). Bundler resolution and runtime behaviour are unchanged. CI and the release workflow now typecheck a NodeNext consumer of every entry point against the built package.
- **CommonJS declarations for `require`:** every entry point now ships `.d.cts` declarations, and the `require` conditions in `exports` point at them. CommonJS TypeScript projects on `moduleResolution: "node16"` (or on `"nodenext"` with TypeScript older than 5.8) used to get `TS1479` on every import, because the CommonJS build was described by ES module declarations. Runtime files and ES module consumers are unchanged. The consumer check now covers an ES module and a CommonJS consumer under `node16`.

### Document Engine & API

- **Corrupt PNG data no longer escapes as an unhandled rejection:** a PNG whose pixel data was truncated or was not a valid compressed stream made generation reject with an empty `TypeError` and, separately, left a second rejection unhandled, which ends a Node process by default. Both are now one catchable `ImageDecodeError` with a message.

- **Images have a size limit:** `ImageLoader.maxPixels` (100 million by default, about 10,000 x 10,000) is checked against the dimensions a PNG or JPEG declares, before any pixel data is inflated, and a PNG's pixel data may not inflate beyond what its header declares. A small file that claims or unpacks to an enormous image is refused with an `ImageDecodeError` where it used to consume gigabytes of memory. A corrupt embedded colour profile, or one over 16 MiB, is dropped and the image uses its device colour space. Raise the limit for large-format print work.

- **Table rows taller than a page split across pages:** a row too tall for any page used to be drawn past the bottom margin, or skipped when repeated headers left too little room. It now continues onto as many pages as it needs. Each cell carries on from where it stopped; content that cannot split, such as an image or a fixed-height box, is drawn once in the first fragment. Header rows repeat, a running total adds the row once, and in tagged documents the row stays one row with one cell per column.

- **Rounded containers split across pages:** a container with `cornerRadius` used to be kept whole, so one taller than a page ran off it. It now splits like any other container, rounding its top corners on the first page and its bottom corners on the last.

- **Content that fits on no page is clipped and reported:** content that cannot split, such as a fixed-height container, an image, a chart or a rotated element, and is taller than the page body is drawn at the top of a page, clipped at the bottom of the body so the footer and margin stay clean, and recorded as an error diagnostic (source `pagination`) naming the page and how much is cut off. Rotated and flipped elements used to throw in this case. Set `oversizedContent: 'throw'` to make generation fail with `OversizedContentError` instead.

- **Content that cannot split moves to the next page:** an image, barcode or other element placed directly in the document that did not fit in the space left on a page was drawn past the bottom margin. It now starts on the next page.

- **SVG text in OpenType (CFF) fonts is drawn:** text in an imported SVG that resolved to a registered `.otf` font with CFF outlines was drawn as nothing, with no diagnostic. Its glyphs are now drawn from their cubic outlines.
- **Text drawn as shapes in SVG export is announced correctly:** colour emoji and text drawn as glyph outlines (CFF fonts, shaped runs) were written as a group with an `aria-label` but no role, which ARIA does not allow, so assistive technology could ignore the label. The group now carries `role="img"`.
- **SVG `<use>` expansion is bounded:** references that expand to more than 50,000 elements in one drawing are reported as an unsupported feature, so a file of a few hundred bytes can no longer expand to hundreds of thousands of shapes. With strict checking, the default, the import fails; otherwise the expansion stops there.

- **Links with characters outside ASCII open the right address:** a link target such as `https://example.com/café` was written byte for byte, which truncated each such character and produced a different URI. Characters outside printable ASCII, and spaces, are now percent-encoded as UTF-8; an ASCII URI is written exactly as before.

- **A tree that contains itself is reported as such:** adding an element to itself, directly or through a descendant, used to overflow the stack. Generation now throws `ElementCycleError`, naming the element type.

- **Table grid lines no longer disappear beside shaded cells:** each cell used to paint its fill, content and edges before the next cell began, so the next cell's fill, or the next row's, covered half of an edge already drawn. Thin lines beside a shaded header, a banded row or a shaded cell all but vanished. A row now paints all its fills first, then the bottom edges of the row above, then the cells' content, then its own edges, and holds its bottom edges until the next row's fills are down or the table leaves the page. Tables without fills look the same; the order of drawing operations changes in every table with borders.

- **Table footers inside a container:** a table placed inside a container, stack or other element dropped its footer rows, because the footer was drawn only when the document's current page was its last. Footers now follow the table's last body row wherever the table is placed.

- **Mixed font sizes share one baseline:** in rich text, a span smaller than the text beside it used to be drawn from the top of the line, so it sat high, and a subscript (the 2 in H₂O) appeared raised. Every span on a line now sits on the baseline of the line's largest font, a subscript drops below it and a superscript rises above it. Lines in a single font size are unchanged.

- **Right-to-left text keeps its spaces beside fallback fonts:** a right-to-left line whose digits or Latin come from a fallback font (a Hebrew face without digits, for example) is now resolved and ordered as one line. It used to be resolved one font at a time, so the pieces were painted in logical order and the spaces next to a number landed on the wrong side ("12," lost its spaces). The pieces are now painted in visual order in PDF and SVG, and in PDF the line carries one ActualText in reading order. Lines in a single font are unchanged.

- **Carried-forward page subtotals:** `Table` gains `runningTotalColumn` (`RunningTotalColumn` in .NET) and `TableRow` gains `runningValue`. When a table with a running-total column breaks across pages, each page it leaves ends with a "Carried forward" row and the next opens with a "Brought forward" row, both showing the sum of `runningValue` so far, formatted with `runningTotalFormat` (default `N2`) after `runningTotalPrefix`. `carriedForwardLabel` and `broughtForwardLabel` change the wording. The rows are artifacts in tagged documents, so a screen reader does not read the repeated figure. All the options round-trip through document definitions; tables without them are unchanged.

- **Links inside a sentence, and underlined links:** `RichText` gains `link(text, uri, style?)` (`Link` in .NET), backed by a new `TextSpan.link`. The span wraps with the paragraph like any other text; each line it lands on becomes a clickable region described by the whole span text and, in tagged documents, a Link inside the paragraph. The span's style is the link's look. `Hyperlink` gains `underline` (default `false`), drawn at the position and weight of an underline decoration. Both round-trip through document definitions.

- **Donut totals in the centre:** `PieChart` gains `totalPosition` (`TotalPosition` in .NET), `legend` by default. With `center`, a donut draws its total as a large figure with `totalLabel` beneath it in the hole, which widens to fit, instead of as a legend row. A full pie keeps the total in the legend. The option round-trips through document definitions; charts that do not set it are unchanged.

- **Wrapping text no longer fails when its font lacks a character:** a paragraph long enough to wrap, set in an embedded font that lacks a character fallback draws (a full stop or digit in a Hebrew-only face, for example), used to throw `Font has no glyph` from the line breaker. It now lays out and draws the character from the fallback font, as shorter text already did.

- **List markers appear once per item:** a list item that wraps onto more lines now shows its bullet or number beside the first line only. Untagged documents used to repeat the marker on every wrapped line, so one long item read as several; tagged (PDF/UA) documents already drew it once. Items that fit on one line are unchanged.

- **Accented and typographic characters show in standard fonts:** the font dictionary of a non-embedded Helvetica, Times or Courier face now declares `/Encoding /WinAnsiEncoding`. The text was already written as WinAnsi bytes, but without the entry viewers decoded it with the font's built-in StandardEncoding, so ’ “ ” – — … € ™ disappeared and é showed as Ø. Documents that claim PDF/A or PDF/UA, whose standard faces are embedded, were not affected. Symbol and ZapfDingbats are unchanged.

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
