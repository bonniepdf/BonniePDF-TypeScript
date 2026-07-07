---
'@bonniepdf/core': minor
---

Add file attachments and ZUGFeRD / Factur-X e-invoice support.

- `Document.attach(...)` / `document.attachments` and a fluent `PdfBuilder.attach(...)` embed files into generated PDFs as associated files: `/EmbeddedFile` streams, `/Filespec` with `/AFRelationship`, the `/EmbeddedFiles` name tree, and the catalog `/Names` + `/AF` array. Honoured under `None`, PDF/A-3, and PDF/A-4; dropped with an `attachment` diagnostic under PDF/A-1 and PDF/A-2 (which forbid embedded files), keeping the conformance claim honest.
- `applyFacturX(doc, xml, opts)` binds caller-supplied EN 16931 CII XML: forces PDF/A-3, embeds the XML with the `Data` relationship, and writes the `fx:` XMP conformance block. `FacturXProfile` selects the conformance level. The XML is a caller input; BonniePDF does not generate or validate it.
