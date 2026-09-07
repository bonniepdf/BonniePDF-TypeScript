# Changelog

All notable changes to `@bonniepdf/core` are documented here. Versions use
CalVer (`yyyy.m.minor`), decided by the versioning tool and released
by pushing a `v<version>` tag (see `.github/workflows/release.yml`).

This file is maintained by hand. Add an entry under **Unreleased** with each
change to `core/`; on release, rename it to the version being tagged.

## Unreleased

### Fixed

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
