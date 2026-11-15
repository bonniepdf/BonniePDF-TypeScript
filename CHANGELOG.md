# Changelog

All notable changes to `@bonniepdf/core` are documented here. Versions use
CalVer (`yyyy.m.minor`), decided by the versioning tool and released
by pushing a `v<version>` tag (see `.github/workflows/release.yml`).

## Unreleased

### Document Engine & API

- **PDF/UA-2:** `AccessibilityMode.PdfUa2` (`'pdf/ua-2'`) writes PDF/UA-2 (ISO 14289-2:2024) on PDF 2.0, alone or with `PdfAConformance.PdfA4`, and passes veraPDF's PDF/UA-2 profile. On top of PDF/UA-1's tagging it writes the structure tree in the PDF 2.0 namespace, gives every list its numbering style, links each table-of-contents entry to its heading, and makes in-document links, bookmarks and the opening view go to structure elements as well as pages, so assistive technology lands on the right heading. It raises the default PDF version to 2.0; an explicit PDF 1.7, or PDF/A-1, -2 or -3, throws. PDF/UA-1 output is unchanged.
- **PDF/A-4 drops attachments:** a PDF/A-4 document with attachments embedded them and claimed PDF/A-4, which veraPDF rejects: PDF/A-4 accepts only embedded files that are themselves PDF/A, and the engine cannot check that. As under PDF/A-1 and -2, the attachments are now dropped with an `attachment` warning and the claim kept. Use PDF/A-3 for e-invoices; PDF/A-4f is not implemented.

### Tests

- Make the length-unit equivalence test independent of the system clock by fixing its PDF metadata timestamps.

## 2026.11.13

Status: Released
Date: 2026-11-13

### Highlights

- Align the safety data sheet's hazard banner with the .NET example.
- Improve text contrast on the orange rating band in the energy performance certificate.

### Examples

- **Safety data sheet:** the hazard banner now matches the .NET example.
- **Energy performance certificate:** text on the orange rating band has higher contrast.
