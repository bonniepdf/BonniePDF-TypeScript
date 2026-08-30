# Changelog

All notable changes to `@bonniepdf/core` are documented here. Versions use
CalVer (`yyyy.m.minor`), decided by the versioning tool and released
by pushing a `v<version>` tag (see `.github/workflows/release.yml`).

This file is maintained by hand. Add an entry under **Unreleased** with each
change to `core/`; on release, rename it to the version being tagged.

## Unreleased

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
