# Changelog

All notable changes to `@bonniepdf/core` are documented here. Versions use
CalVer (`yyyy.m.minor`), decided by the versioning tool and released
by pushing a `v<version>` tag (see `.github/workflows/release.yml`).

## Unreleased

### Features

- **Charting engine:** sync updated BonnieCharts sources across 40 chart families, presentation themes, paint gradients, visual effects, annotations, pseudo-3D depth, and generated chart exports and fixtures.

## 2026.11.23

Status: Released
Date: 2026-11-23

### Highlights

- Expand built-in vector charting to 14 chart families with stacked bar, stacked area, dual-axis combo, waterfall, scatter and bubble, bullet, and heatmap charts.
- Add automatic chart axis scaling and layout, compact `K`/`M`/`B`/`T` number formatting, and `modern`, `dark`, and monochrome hatch-pattern `print` themes.

### Features

- **New chart families:** added `StackedBarChart` (`absolute` and 100% `percent` modes), `StackedAreaChart`, dual-axis `ComboChart`, `WaterfallChart`, `ScatterChart` (with bubble sizing and OLS linear trendlines), `BulletChart`, and `HeatmapChart`, with full Document Definition 1.0, PDF/UA tagging, and layout snapshot support.
- **Chart rendering, themes & layout:** added `dark` and monochrome `print` (pure-vector hatch patterns) themes, composable `ChartThemeDefinition`, `autoScale` (Heckbert nice ticks), `autoLayout` dynamic margins, `K<n>` compact number formatting (`K`/`M`/`B`/`T`), smooth monotone splines and step curves, dashed series, shaped/hollow/haloed markers, vertical `areaGradient` fades, `PieChart` radial-elbow callout labels and configurable `donutHoleRatio`/`sliceBorderWidth`, annotated `ChartReference` labels, card borders, subtitles/captions, flexible `legendPosition`, and `inheritDocumentFont`.

### Fixes

- **Encryption:** emit numeric `/V` values for RC4-40/128, and throw from synchronous `generateBytes()` when AES-256 is configured.
- **PDF/A & XMP:** Flate-compress the sRGB ICC profile with `/Length1`, await `writeOutputIntentAsync`, always emit well-formed XMP with UTC `Z` dates, and split keywords on `,` and `;`.
- **Settings validation:** check PDF/A and encryption conflicts before AES-256 version checks without mutating `settings.version`.
- **Text `fontFeatures`:** track explicit assignment so inherited `defaultTextStyle.fontFeatures` updates on regeneration.
- **Document Definition:** skip unknown element types and enum tokens under `bestEffort: true`, make `PageNumberOf.text` optional, and support `SectionLink.underline` and `Grid.alternateRowBackgroundColor`.
- **Authoring & normalisers:** export `OrderedListOptions`, let per-side `toBorder` widths override `width`, reject combining `'none'` in `toTextDecoration`, and ignore explicit `undefined` in `Flip`, `Rotate`, `Translate`, and `ChartLinearGradient`.
- **Layout snapshots & preflight:** record cell fills on split table rows and update the `table-no-header` fix hint (`addHeader`, `isHeader`, `Grid`, `presentation = true`).
- **Canvas & SVG fonts:** clear the current path after fill, stroke, and clip on `PdfCanvas` and `SvgCanvas`; check `FontManager` before standard aliases in `FontFamilyResolver.resolveKnown`.

## 2026.11.21

Status: Released
Date: 2026-11-21

### Highlights

- Generate tagged PDF 2.0 documents with PDF/UA-2.
- Combine PDF/UA-2 and PDF/A-4f to retain attachments in an accessible archival PDF.

### Document Engine & API

- **PDF/UA-2:** `AccessibilityMode.PdfUa2` (`'pdf/ua-2'`) writes PDF/UA-2 (ISO 14289-2:2024) on PDF 2.0, alone or with `PdfAConformance.PdfA4`, and passes veraPDF's PDF/UA-2 profile. On top of PDF/UA-1's tagging it writes the structure tree in the PDF 2.0 namespace, gives every list its numbering style, links each table-of-contents entry to its heading, and makes in-document links, bookmarks and the opening view go to structure elements as well as pages, so assistive technology lands on the right heading. It raises the default PDF version to 2.0; an explicit PDF 1.7, or PDF/A-1, -2 or -3, throws. PDF/UA-1 output is unchanged.
- **PDF/A-4 drops attachments:** a PDF/A-4 document with attachments embedded them and claimed PDF/A-4, which veraPDF rejects: PDF/A-4 accepts only embedded files that are themselves PDF/A, and the engine cannot check that. As under PDF/A-1 and -2, the attachments are now dropped with an `attachment` warning and the claim kept. Use PDF/A-4f to keep them, or PDF/A-3 for e-invoices.
- **PDF/A-4f:** `PdfAConformance.PdfA4f` (`'pdf/a-4f'`) writes PDF/A-4f (ISO 19005-4, conformance F), the PDF/A-4 level that carries attachments of any type, and passes veraPDF's PDF/A-4f profile. It is PDF 2.0, so it also combines with PDF/UA-2, the only way to have an accessible, archival PDF 2.0 file with attachments. A PDF/A-4f document must have at least one attachment, and throws without one. Factur-X and ZUGFeRD still require PDF/A-3.
- **Attachments state a type under PDF/A:** an attachment with no media type was written without one, which PDF/A-3 and PDF/A-4 forbid, so the document failed its claim. Under any PDF/A level it is now written as `application/octet-stream`. Outside PDF/A nothing changes.
- **Attachments are described under PDF/UA-2:** PDF/UA-2 requires a description on every attached file, and one without a description failed the claim. It is now described by its file name, and each attachment described this way records an `attachment` warning whose `source` is the file name. Give `description` for one that tells readers what the file is.

### Tests

- Make the length-unit equivalence test independent of the system clock by fixing its PDF metadata timestamps.

### Packaging & Documentation

- Point package homepage and README links directly at canonical `https://www.bonniepdf.dev` URLs and expand npm discovery keywords for PDF/UA-2, PDF/A-4, Factur-X, and ZUGFeRD.

### Examples

- Keep the delivery note on one page.

## 2026.11.13

Status: Released
Date: 2026-11-13

### Highlights

- Align the safety data sheet's hazard banner with the .NET example.
- Improve text contrast on the orange rating band in the energy performance certificate.

### Examples

- **Safety data sheet:** the hazard banner now matches the .NET example.
- **Energy performance certificate:** text on the orange rating band has higher contrast.
