# Changelog

All notable changes to `@bonniepdf/core` are documented here. Versions use
CalVer (`yyyy.m.minor`), decided by the versioning tool and released
by pushing a `v<version>` tag (see `.github/workflows/release.yml`).

This file is maintained by hand. Add an entry under **Unreleased** with each
change to `core/`; on release, rename it to the version being tagged.

## Unreleased

### Added

- **`RichText` substitutes `{{CurrentPage}}` and `{{TotalPages}}`.** A span whose text
  holds a page token now behaves as it does in a `TextBlock`: the current page number
  is filled in as each page is drawn, the total is a deferred object that resolves
  once the whole document is laid out, and layout reserves the width of two digits
  for each. Alignment corrects for the page number's real width. Rich text with no
  tokens is unchanged. (The .NET implementation gained the same behaviour, which its
  fluent `CurrentPageNumber()` and `TotalPages()` depend on.)

- **Images are reduced to the resolution their printed size can use.** An image
  used to be embedded at its source resolution however small it was drawn: a
  2658 x 512 logo placed 175 pt wide was stored at about 1,090 pixels per inch,
  173 KB of a 178 KB invoice. `DocumentSettings.maxImageDpi` (default 288)
  now caps that. When a PNG carries at least 1.5 times the pixels its drawn size
  needs at the cap, the embedded copy is reduced to `floor(drawn size in points
x cap / 72)` pixels per axis, never enlarged. The reduction is an exact area
  average in integer arithmetic with premultiplied alpha, so both
  implementations produce identical pixels; it never re-encodes an image
  lossily. The same invoice is 21 KB. An image used more than once is embedded
  once, sized for its largest use. Set `maxImageDpi` to `null` to embed every image
  as it is, or set `keepResolution` on an image to exempt that image (one exempt
  placement exempts a shared image everywhere it is used). JPEG, indexed-colour
  and 16-bit images are always embedded as they are, and `Document.diagnostics` carries an
  `image.resampled` or `image.passed-through` entry for each image the cap
  looked at, so an unexpectedly large file can be traced to its image.

- **The `Svg` element draws an SVG document as vector content.** Paths,
  fills, strokes, gradients, clips and text drawn as glyph outlines go through
  the page's canvas like any other drawing, so the result stays sharp at any
  zoom. Pass markup as `svgData`, a file as `filePath` (Node only), or an
  `svgGenerator` given the box to fill. It sizes itself exactly as `Image`
  does, with the same `width`, `height` and `fitMode`, and the document's own
  `viewBox` and `preserveAspectRatio` place its content in that box.
  Text uses the fonts registered with the document, resolved as for a
  paragraph (`Arial` and `sans-serif` are Helvetica, drawn from Liberation
  Sans), and is never drawn in a font nobody chose. Features outside the
  supported profile - filters, masks, stylesheets and so on - fail generation
  by default with `SvgUnsupportedFeatureError`, naming each one; with
  `strictUnsupportedFeatures: false` the rest is drawn and each skipped feature
  becomes a diagnostic. Under PDF/UA-1 the element is a figure whose alternate
  text is `altText`, else the document's own `<title>`.
- **`document.registerSvgRasterizer(fn)`** lets an `Svg` element with
  `strictUnsupportedFeatures: false` draw what the importer cannot as images in
  their place, using any renderer you supply (SVG markup in, PNG bytes out).
  BonniePDF rasterizes nothing itself. It runs on the async generate paths; a
  synchronous generate whose document would need it fails rather than drawing
  something different.

- **The SVG import engine and its canvas adapter.**
  The engine that parses SVG and draws it as vector content now lives under
  `core/src/Rendering/Svg/`. It is vendored - maintained upstream and copied
  here by tooling - so its files are never edited in this repository, and a
  test checks each against the hash recorded in `VENDORED.json`. An internal
  adapter draws what it emits onto any `ICanvas`, giving a stroke with no
  miter limit SVG's default of 4 rather than PDF's 10. The `Svg` element above
  is built on them.

### Changed

- **The PDF canvas scales a stroke's width and dashes with the transform.**
  Under a canvas transform, path points were transformed but line width and
  dash lengths were not, so a scaled stroke came out too thick or too thin. They
  now scale by the transform's scale factor (exact for uniform scaling and
  rotation). Drawing without a transform is unchanged.
- **The PDF canvas places images under its transform.** `drawImage` ignored any
  canvas transform; it now draws in the transformed space. Drawing without a
  transform is unchanged.
- **Transformed drawing on the PDF canvas matches the .NET implementation byte
  for byte.** Under a transform, the canvas now computes and prints in single
  precision, as the .NET canvas does, so the same transformed drawing writes
  the same operators in both. Untransformed drawing keeps full precision.

- **The PDF canvas writes the same bytes as the .NET implementation for fills
  and strokes.** The two had drifted apart. A solid `fillCurrentPath` now sits
  in its own `q`/`Q`, so its colour no longer leaks into what is drawn next; a
  translucent stroke sets its transparency outside the stroke's `q`, as fills
  already did; a gradient fill is one `q`/`Q` rather than two; an empty path, or
  a gradient stroke whose transform cannot be inverted, writes nothing; and a
  miter limit of 10, PDF's default, is no longer written. Pages look the same;
  their content streams change wherever the canvas fills or strokes a path.

- **`VerticalStack` honours `breakAllowed` on stateful children.** The keep-together
  check ran for every stateful child regardless of the flag, so
  setting `breakAllowed` had no effect and content the specification says may
  split always moved to the next page whole. .NET has always gated on the flag;
  the check is now gated here too. Documents that relied on the old behaviour
  repaginate.

- **SVG export now agrees with the .NET implementation, element for element.**
  The shared specification names SVG as the artefact the conformance tooling
  compares, so four differences between the two exporters were defects in that
  contract rather than formatting preferences. Three of them are fixed here:

  - A rounded rectangle writes `ry` alongside `rx`. SVG defaults `ry` to `rx`,
    so nothing renders differently; .NET already wrote both.
  - A composited child canvas — a chart, or a `CanvasElement` — has its
    translate rounded to the export precision, instead of printing the full
    double expansion of the offset (`translate(44 491.59999999999997)`).
  - A glyph run accumulates its advance cursor from the _rounded_ origin. The
    origin is emitted rounded, so accumulating from the unrounded value left
    every later position in the run inconsistent with the origin printed
    beside it.

  The fourth, hex colour case, was already lower case here and is fixed on the
  .NET side.

### Added

- **Pagination control primitives.** `EnsureSpace`, `PreventPageBreak`,
  `ShowEntire`, `StopPaging`, `ShowIf` (with `ShowOnce` and `SkipOnce`) and
  `Unconstrained` are single-child wrappers that decide whether and where their
  child renders, and draw nothing themselves, so they compose with any element
  and with each other. .NET has the same set.

- **Any measurement can now be written in a unit.** Every public authoring
  position that takes a length — widths, heights, padding and margin sides,
  spacing, corner radii, font sizes, letter and word spacing, decoration
  thickness, stroke widths, shape and barcode dimensions, chart sizes, and the
  page margin — accepts a number of points (as before), a unit-suffixed token,
  or `{ value, unit }`:

  ```typescript
  new Container({ height: '1in', padding: { top: '10mm' }, cornerRadius: '2mm' });
  new TextBlock('Heading', { fontSize: { value: 14, unit: Unit.Point } });
  doc.settings.margin = '2cm';
  ```

  The four units are `pt` `in` `cm` `mm`, matching the `Unit` enumeration; the
  unit is case-insensitive and a space before it is allowed. Lengths compose
  with the spacing forms, so `['1cm', 12]` and `{ top: '0.5in' }` are both
  well-formed.

  Lengths normalise to points **on write** and read back as a plain `number`, so
  engine code, measurement, and the layout snapshot never see a unit, and a
  document authored entirely in inches produces byte-identical output to the
  same document in points. A bare number still means points, so no existing code
  changes.

  An unrecognised unit throws, naming the accepted forms, rather than resolving
  to zero — a silent zero is the one outcome a measurement grammar must never
  produce. Dimensionless numbers are deliberately **not** widened: `lineHeight`
  is a multiple of the font size, `opacity` a ratio, `rotationDegrees` an angle,
  and a weighted column width a share rather than a distance.

- **`Container.fillHeight`** takes the body content height left on the current
  page instead of sizing to content. This is the piece that was missing for the
  header / body / footer page shape: the middle band is whatever the page chrome
  leaves over, which an author cannot compute up front because both templates
  are functions of the page number.

  ```typescript
  new Container({ fillHeight: true, verticalAlignment: 'bottom', child: body });
  ```

  An explicit `height` wins outright, and fill never _shrinks_ content — a
  container whose child outgrows the space left keeps the child's height and
  paginates normally. Measurement is unchanged: it reports the natural content
  height, because a pure measure has no cursor to measure from. Fill re-resolves
  after a page break, against the new page's own reserved band.

- **Licence declaration.** Applications now declare which BonniePDF licence
  applies to them, once at startup:
  `settings.license = 'community'` (or `'evaluation'`, `'professional'`,
  `'enterprise'`), or `BONNIEPDF_LICENSE=community` in the environment. An
  in-code declaration takes precedence.

  It is a **declaration, not an enforcement mechanism**: no licence key, no
  activation, no network call, no telemetry, and no tier-dependent feature
  gating. Every tier includes the complete feature set.

  Generating a document without a declaration throws `BonniePdfLicenseError` in
  an environment positively identified as development, test, or CI, and
  otherwise writes a single warning to the console and continues — a production
  workload that never declared a tier warns rather than failing. `'evaluation'`
  warns once. Declaring any other tier is silent. The notice appears at most
  once per process. `BONNIEPDF_LICENSE_ENFORCEMENT=throw|warn` moves it between
  fatal and non-fatal; there is deliberately no way to switch it off.

  The declared tier **never changes a byte of generated output** — no watermark,
  no metadata field, no free-tier degradation — and the test suite asserts
  byte-identical output across every tier.

- `evaluateCompliance` takes an options object selecting which **rule families**
  run: `evaluateCompliance(snapshot, { includeWcag: false })` skips the WCAG 2.2
  contrast rules entirely. The suppressed findings are absent from `findings`
  _and_ from the counts, as if the document had no contrast problems; the
  PDF/UA-1 findings are untouched, and `passed` cannot change, because no WCAG
  rule emits an error. Omitting the argument runs everything, so the existing
  one-argument call is unchanged.

  The two families answer different questions — PDF/UA-1 findings are conformance
  to a claim the document makes, contrast is an adjacent standard an author may
  be tracking separately — and on a colour-rich document the contrast findings
  can bury the structural ones.

- The accessibility preflight now checks **text colour contrast** against the
  WCAG 2.2 AA thresholds (4.5:1, or 3:1 for text at 18pt and above, or 14pt and
  above when bold). `evaluateCompliance` reports `contrast-insufficient` as a
  warning, with the measured ratio and the threshold that applied, so the fix is
  a colour change rather than an investigation.

  Contrast is measured wherever the background can be determined from the
  document model: text inside a container with a fill, a table cell under its
  row/header/footer colour, a page colour, or the default white page. Where it
  cannot — text over layered or freely drawn content, a page painted with a
  background element, or anything partly transparent — the preflight reports
  `contrast-unknown` (info) instead of assuming a colour. Reporting a confident
  wrong verdict would be worse than reporting none.

  These are the first findings that do not cite PDF/UA-1: ISO 14289-1 states no
  numeric contrast requirement, so they carry `standard: 'WCAG 2.2'` and clause
  `WCAG 2.2 SC 1.4.3 (AA)`. Existing findings are unchanged, and because the new
  findings are warnings and info, `report.passed` keeps its meaning.

  Supporting this, the layout snapshot moves to **schema version 4**: nodes carry
  an optional `paint` block (text colour, size, weight, background fill, alpha)
  and pages carry their resolved fill and whether they paint a background
  element. Capture remains opt-in and observational — output is byte-identical
  with and without it. `contrastRatio`, `relativeLuminance` and `requiredRatio`
  are exported for callers that want the maths directly.

### Fixed

- **A `Container`'s horizontal alignment now reaches wrapped text.** A centred `Container` wrapping a
  `Text` centred a one-line title (block positioning of a child narrower than the container) but silently
  left a paragraph long enough to wrap flush left, because there was no narrower child box left to
  position once the text filled the container. A `Container` whose `horizontalAlignment` is
  `start`/`center`/`end` now also establishes that as the **ambient horizontal text alignment** for
  descendant `TextBlock`/`Heading`/`RichText` that set no `alignment` of their own, through any nesting
  depth, the way CSS `text-align` cascades — an explicit `alignment` on the text element still always
  wins, and a nested `Container` can set its own ambient for its own subtree. `HorizontalStack.alignment`
  is a different, cross-axis concept (vertical positioning of row children) and does not feed this.

- **A table's own border was never drawn.** `table.Border(...)` (`table.border`) applies a border to
  every cell, but a cell's own border is never null, so it always shadowed the table's and the setting did
  nothing. A cell that sets a border uses it; every other cell now takes the table's.
- **A table's cell borders are drawn once per shared edge.** Adjacent cells each drew the edge they share, so
  every internal edge was stroked twice. The earlier cell (left, upper) now draws it, and the later cell draws it
  only when its own border is more prominent (wider, then darker) and so paints over it. A 2 x 2 grid is 12
  strokes rather than 16, and cells with different borders show the more prominent line where they meet.
- **A bordered container around a table is now the table's frame.** The container's border used to be drawn
  before the table and the table inset inside it, so the frame and the outermost cell edges sat side by side as
  a double line. The border is now centred on the table's outer edge, the table is not inset, and the border is
  painted over it, so the frame wins the outer edges. Every other bordered container is unchanged.

- **A table inside padding, a border, a background or a row now splits across pages.**
  Wrapping a tall table, column or paragraph in a `Container` (padding, border, background) used to turn it into an
  unsplittable box: the whole thing jumped to a fresh page, leaving the page it
  should have started on empty, and a `HorizontalStack` did the same. A box whose child can split
  now splits with it. Each page carries a fragment of the box, with the top border and
  padding on the first fragment and the bottom border and padding on the last, and its
  background drawn behind that page's content. A `HorizontalStack` whose items can split lets each
  paginate independently, side by side, until all are done. A box or row that fits, or
  whose items cannot split, is drawn whole exactly as before, and a box with a fixed or
  filling height, or rounded corners, is still unsplittable.

- **A border or background on a table cell's content now spans the whole row.** The
  container a cell's content is wrapped in was drawn at the height of its own text, so
  a short cell beside a tall one, or an empty one, was drawn as a short box and the grid
  came out ragged: the borders and shading of one row had three different heights. The
  container that is the cell's own content now fills the row. Containers nested deeper in
  the cell, and cells styled through the table's own cell properties, are unchanged.

- **Header and footer content in a container was pushed onto the wrong page.** A
  `Container` checks that it fits above the bottom margin, and the footer is painted
  inside the bottom margin, so it broke the page in the middle of painting the
  footer: the footer text landed at the top of a new page. Header and footer chrome
  no longer paginates.
- **Rich text sized by its container no longer wraps.** A container that gives a text
  its own preferred width as the maximum (a centred footer, an auto-width column)
  could wrap the last word onto a second line: preferred width summed whole span
  widths, while line breaking measures word by word, and the two disagree by
  float rounding and by trailing spaces. Preferred width now comes from the same
  word flow that breaks lines. A centred "Page 1 of 2" footer stays on one line.

- **Regression coverage for RGBA PNG defiltering.** `ImageLoader.loadPngAsync`
  is now tested against PNGs using each of the five row filters (None, Sub, Up,
  Average, Paeth) and a mix of them, checking that colour and alpha match the
  original pixels. The behaviour was already correct; the .NET implementation
  had a defect on the Up, Average and Paeth filters for alpha PNGs, now fixed,
  and both suites now check the same pattern.

- **A page header or footer now reserves body content space.** Previously the
  header and footer were painted into the margin band while body layout still
  ran from the top margin to the bottom margin, so page chrome taller than the
  margin silently overlapped the content underneath it. The body content band is
  now inset per page by `max(margin, headerHeight)` at the top and
  `max(margin, footerHeight)` at the bottom, on every page including pages
  created by overflow — the cursor reset that accompanies a page break uses the
  new page's own content top rather than the margin.

  Chrome that fits inside its margin band reserves nothing beyond the margin the
  page already had, so documents whose header and footer are shorter than the
  margin — which is essentially all of them — produce byte-identical output. A
  header or footer that outgrows the margin is also now flush against its own
  page edge instead of being centred in a band it no longer fits, which is what
  stops an oversized footer running off the bottom of the page.

  A header and footer that between them leave no usable body height now throw,
  naming the page and both measured heights, rather than paginating against a
  content band of zero or negative height.

- The accessibility preflight now detects bold text styled by setting
  `fontName` directly to a bold PostScript name (`"Helvetica-Bold"`,
  `"Times-BoldItalic"`, …), not only via the `fontWeight` property. That idiom
  is how most examples in this repository author bold text, and the only one
  `Hyperlink` exposes at all — without it, bold-but-large text was held to the
  regular-text 4.5:1 WCAG threshold instead of the 3:1 large-text threshold it
  actually qualifies for. This can only relax an existing finding (a lower
  required ratio, never a higher one), so no prior finding becomes stricter.

- A `TableCell` with `columnSpan` greater than 1 no longer displaces the cells
  after it. The row loop measured and placed each cell by its **index in the
  row** rather than by the column it actually starts in, so once a cell spanned
  more than one column every later cell in that row was drawn one column short
  of its true position - overlapping the spanned cell - and took its width from
  the wrong column, leaving the row short of the table's full width when the
  weights were uneven. Both the row cursor and the width lookup now advance by
  the number of columns each cell covers. Rows without a `columnSpan` are
  unaffected: the starting column equals the cell index, and the arithmetic is
  the same as before.

- A `Table` with fewer declared column weights than a row actually fills no
  longer lays out incorrectly. Column widths came from the constructor weights
  alone, so a table built as `new Table()` produced an empty width array and
  every cell measured against `undefined`; the resulting `NaN` propagated
  silently into cell geometry, giving zero-width rows and cells stacked at the
  same position rather than an error. A table built as `new Table(3)` with
  two-cell rows was wrong the same way from its second column on. The declared
  weights are now extended with equal weights out to the widest row - counting
  `columnSpan`, and across headers, rows and footers alike - so the columns a row
  implies share the width evenly rather than being left without one. Tables whose
  weights already cover every row are unaffected, their widths being computed
  from the same weights as before.

- Page breaks left graphics state unbalanced. The render pipeline wraps each
  element in `saveState`/`restoreState`; when an element broke the page from
  inside its own `render`, the restore ran against the new page and the page the
  element started on kept an unclosed `q` - an invalid content stream per ISO
  32000-1. SVG export hid this, because its group-balancing sweep closed the
  stray `<g>`; the PDF was affected all the same. `newPage` now closes open
  graphics-state scopes on the outgoing page and reopens them on the new one, as
  it already did for marked content.

- The ESM build now preserves module structure, one output file per source
  module, so a bundler can drop what an application does not use. Previously
  the ESM output was bundled, which welded the optional subsystems into the
  core chunk: importing only `Document` also paid for charts, QR codes, Data
  Matrix and barcodes, none of which `Document` uses. Bundled and gzipped, an
  application importing the elements a typical document needs goes from about
  97 KB to about 75 KB. The CommonJS build stays bundled, because `require`
  is dynamic and cannot tree-shake either way. Published output is unchanged
  in behaviour and byte-identical in the PDFs it produces.
- Consolidated duplicated internal logic with no change in behaviour:
  letter/word spacing advance is now calculated in one place shared by the
  text elements and both canvases, the nested-list measure and render loops
  moved to a common base, and `GroupedBarChartElement` extends `ChartElement`
  rather than repeating it. `GroupedBarChartElement` continues to report no
  preferred content width, so auto-sizing inside horizontal stacks and
  shrink-to-fit containers is unchanged.
- Add file attachments and ZUGFeRD / Factur-X e-invoice support.
  `Document.attach(...)` / `document.attachments` and fluent `PdfBuilder.attach(...)`
  embed files as associated files (`/EmbeddedFile`, `/Filespec` with `/AFRelationship`,
  the `/EmbeddedFiles` name tree, catalog `/Names` + `/AF`). Honoured under `None`,
  PDF/A-3, and PDF/A-4; dropped with an `attachment` diagnostic under PDF/A-1 and
  PDF/A-2. `applyFacturX(doc, xml, opts)` binds caller-supplied EN 16931 CII XML,
  forcing PDF/A-3 and writing the `fx:` XMP conformance block.
  _(migrated from the final Changesets entry.)_
- Release pipeline: retired Changesets in favour of tag-triggered publishing
  with npm OIDC trusted publishing (no long-lived `NPM_TOKEN`). Provenance is
  attested on every publish.

## 2026.7.2

- Baseline at the introduction of the hand-maintained changelog.
