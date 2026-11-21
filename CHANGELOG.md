# Changelog

All notable changes to `@bonniepdf/core` are documented here. Versions use
CalVer (`yyyy.m.minor`), decided by the versioning tool and released
by pushing a `v<version>` tag (see `.github/workflows/release.yml`).

## Unreleased

### Highlights

- Generate tagged PDF 2.0 documents with PDF/UA-2.
- Combine PDF/UA-2 and PDF/A-4f to retain attachments in an accessible archival PDF.
- Select PDF/A through the conformance setting. The legacy enable flag has been removed.

### Document Engine & API

- **`pdfAEnabled` is removed:** `DocumentSettings.pdfAEnabled` and the `pdfAEnabled` options key are gone. `conformance` is the only setting that selects PDF/A; replace `pdfAEnabled = true` with `conformance = 'pdf/a-2b'`, the level it selected. `asPdfA()` still selects PDF/A-2b.
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
