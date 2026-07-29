import { DocumentSettings } from './DocumentSettings';
import { PdfVersion } from './PdfVersion';
import { BookmarkItem } from './BookmarkItem';
import { WatermarkSettings } from './WatermarkSettings';
import { PdfAConformance } from './PdfAConformance';

/**
 * Presets that set several coupled {@link DocumentSettings} fields at once.
 *
 * Each one exists because the fields it writes must move together (a PDF/A
 * claim implies a PDF version; a bookmark implies PDF 1.7). Plain property
 * assignment is fine for anything not listed here.
 */

/** Sets the PDF version to 1.7 and enables all PDF 1.7 features. */
export function asPdf17(settings: DocumentSettings): DocumentSettings {
  settings.version = PdfVersion.Pdf17;
  return settings;
}

/**
 * Sets the PDF version to 2.0. This is the foundation for PDF/A-4 and PDF/UA-2,
 * but does not enable either conformance claim by itself.
 */
export function asPdf20(settings: DocumentSettings): DocumentSettings {
  settings.version = PdfVersion.Pdf20;
  return settings;
}

/**
 * Enables PDF/A archival mode. Automatically sets version to PDF 1.7.
 * Cannot be used with encryption.
 */
export function asPdfA(settings: DocumentSettings): DocumentSettings {
  settings.version = PdfVersion.Pdf17;
  settings.pdfAEnabled = true;
  return settings;
}

/**
 * Enables PDF/A-4 baseline archival mode. Automatically sets version to PDF 2.0.
 * This does not enable PDF/A-4f attachments, PDF/A-4e engineering features, or PDF/UA-2.
 */
export function asPdfA4(settings: DocumentSettings): DocumentSettings {
  settings.version = PdfVersion.Pdf20;
  settings.conformance = PdfAConformance.PdfA4;
  return settings;
}

/**
 * Adds a bookmark (outline item) to the document.
 * Automatically sets version to PDF 1.7.
 * @param title Display title of the bookmark
 * @param pageIndex 0-based page index this bookmark navigates to
 */
export function addBookmark(settings: DocumentSettings, title: string, pageIndex: number): DocumentSettings {
  settings.version = PdfVersion.Pdf17;
  const item = new BookmarkItem();
  item.title = title;
  item.pageIndex = pageIndex;
  settings.bookmarks.push(item);
  return settings;
}

/**
 * Adds multiple bookmarks to the document.
 * Automatically sets version to PDF 1.7.
 */
export function addBookmarks(settings: DocumentSettings, bookmarks: BookmarkItem[]): DocumentSettings {
  settings.version = PdfVersion.Pdf17;
  settings.bookmarks.push(...bookmarks);
  return settings;
}

/**
 * Adds a text watermark. With no `opacity`/`rotationDegrees` the defaults apply
 * (gray, 15% opacity, -45 degree rotation, 72pt).
 */
export function withWatermark(settings: DocumentSettings, text: string): DocumentSettings;
export function withWatermark(
  settings: DocumentSettings,
  text: string,
  opacity: number,
  rotationDegrees: number
): DocumentSettings;
export function withWatermark(
  settings: DocumentSettings,
  text: string,
  opacity?: number,
  rotationDegrees?: number
): DocumentSettings {
  const watermark = new WatermarkSettings();
  watermark.text = text;
  if (opacity !== undefined) {
    watermark.opacity = opacity;
    watermark.rotationDegrees = rotationDegrees!;
  }
  settings.watermark = watermark;
  return settings;
}
