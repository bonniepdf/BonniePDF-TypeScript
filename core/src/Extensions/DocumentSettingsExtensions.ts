import { DocumentSettings } from '../Configuration/DocumentSettings';
import { PdfVersion } from '../Configuration/PdfVersion';
import { BookmarkItem } from '../Configuration/BookmarkItem';
import { WatermarkSettings } from '../Configuration/WatermarkSettings';
import { PdfAConformance } from '../Configuration/PdfAConformance';

/**
 * Extension methods for configuring PDF version, PDF/A, and bookmarks.
 */
export class DocumentSettingsExtensions {
  /**
   * Sets the PDF version to 1.7 and enables all PDF 1.7 features.
   */
  static asPdf17(settings: DocumentSettings): DocumentSettings {
    if (settings === null) throw new Error('settings cannot be null');
    settings.version = PdfVersion.Pdf17;
    return settings;
  }

  /**
   * Sets the PDF version to 2.0. This is the foundation for PDF/A-4 and PDF/UA-2,
   * but does not enable either conformance claim by itself.
   */
  static asPdf20(settings: DocumentSettings): DocumentSettings {
    if (settings === null) throw new Error('settings cannot be null');
    settings.version = PdfVersion.Pdf20;
    return settings;
  }

  /**
   * Enables PDF/A archival mode. Automatically sets version to PDF 1.7.
   * Cannot be used with encryption.
   */
  static asPdfA(settings: DocumentSettings): DocumentSettings {
    if (settings === null) throw new Error('settings cannot be null');
    settings.version = PdfVersion.Pdf17;
    settings.pdfAEnabled = true;
    return settings;
  }

  /**
   * Enables PDF/A-4 baseline archival mode. Automatically sets version to PDF 2.0.
   * This does not enable PDF/A-4f attachments, PDF/A-4e engineering features, or PDF/UA-2.
   */
  static asPdfA4(settings: DocumentSettings): DocumentSettings {
    if (settings === null) throw new Error('settings cannot be null');
    settings.version = PdfVersion.Pdf20;
    settings.conformance = PdfAConformance.PdfA4;
    return settings;
  }

  /**
   * Adds a bookmark (outline item) to the document.
   * Automatically sets version to PDF 1.7.
   * @param settings The document settings
   * @param title Display title of the bookmark
   * @param pageIndex 0-based page index this bookmark navigates to
   * @returns The document settings for method chaining
   */
  static addBookmark(settings: DocumentSettings, title: string, pageIndex: number): DocumentSettings {
    if (settings === null) throw new Error('settings cannot be null');
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
  static addBookmarks(settings: DocumentSettings, bookmarks: BookmarkItem[]): DocumentSettings {
    if (settings === null) throw new Error('settings cannot be null');
    if (bookmarks === null) throw new Error('bookmarks cannot be null');
    settings.version = PdfVersion.Pdf17;
    settings.bookmarks.push(...bookmarks);
    return settings;
  }

  /**
   * Adds a text watermark with default settings (gray, 15% opacity, -45 degree rotation, 72pt).
   */
  static withWatermark(settings: DocumentSettings, text: string): DocumentSettings {
    if (settings === null) throw new Error('settings cannot be null');
    const watermark = new WatermarkSettings();
    watermark.text = text;
    settings.watermark = watermark;
    return settings;
  }

  /**
   * Adds a text watermark with custom opacity and rotation.
   */
  static withWatermarkCustom(
    settings: DocumentSettings,
    text: string,
    opacity: number,
    rotationDegrees: number
  ): DocumentSettings {
    if (settings === null) throw new Error('settings cannot be null');
    const watermark = new WatermarkSettings();
    watermark.text = text;
    watermark.opacity = opacity;
    watermark.rotationDegrees = rotationDegrees;
    settings.watermark = watermark;
    return settings;
  }
}

/**
 * Shortcut functions for DocumentSettingsExtensions
 */
export function asPdf17(settings: DocumentSettings): DocumentSettings {
  return DocumentSettingsExtensions.asPdf17(settings);
}

export function asPdf20(settings: DocumentSettings): DocumentSettings {
  return DocumentSettingsExtensions.asPdf20(settings);
}

export function asPdfA(settings: DocumentSettings): DocumentSettings {
  return DocumentSettingsExtensions.asPdfA(settings);
}

export function asPdfA4(settings: DocumentSettings): DocumentSettings {
  return DocumentSettingsExtensions.asPdfA4(settings);
}

export function addBookmark(settings: DocumentSettings, title: string, pageIndex: number): DocumentSettings {
  return DocumentSettingsExtensions.addBookmark(settings, title, pageIndex);
}

export function addBookmarks(settings: DocumentSettings, bookmarks: BookmarkItem[]): DocumentSettings {
  return DocumentSettingsExtensions.addBookmarks(settings, bookmarks);
}

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
  if (opacity === undefined) {
    return DocumentSettingsExtensions.withWatermark(settings, text);
  } else {
    return DocumentSettingsExtensions.withWatermarkCustom(settings, text, opacity!, rotationDegrees!);
  }
}
