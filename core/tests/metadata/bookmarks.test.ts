import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { PdfVersion } from '../../src/Configuration/PdfVersion';
import { BookmarkItem } from '../../src/Configuration/BookmarkItem';
import { addBookmark } from '../../src/Extensions/DocumentSettingsExtensions';
import { pdfToText } from '../helpers/test-base';

describe('Bookmarks', () => {
  let doc: Document;

  afterEach(() => {
    doc?.dispose();
  });

  it('addBookmark sets version to Pdf17', () => {
    doc = new Document();
    addBookmark(doc.settings, 'Chapter 1', 0);
    expect(doc.settings.version).toBe(PdfVersion.Pdf17);
  });

  it('addBookmark adds bookmark to settings', () => {
    doc = new Document();
    addBookmark(doc.settings, 'Chapter 1', 0);
    expect(doc.settings.bookmarks).toHaveLength(1);
    expect(doc.settings.bookmarks[0].title).toBe('Chapter 1');
    expect(doc.settings.bookmarks[0].pageIndex).toBe(0);
  });

  it('hasBookmarks returns true when bookmarks present', () => {
    doc = new Document();
    addBookmark(doc.settings, 'Chapter 1', 0);
    expect(doc.settings.hasBookmarks).toBe(true);
  });

  it('hasBookmarks returns false when no bookmarks', () => {
    doc = new Document();
    expect(doc.settings.hasBookmarks).toBe(false);
  });

  it('nested bookmarks have children', () => {
    doc = new Document();
    const parent = new BookmarkItem('Part 1', 0);
    const child = new BookmarkItem('Chapter 1', 0);
    parent.children.push(child);
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.bookmarks.push(parent);
    expect(doc.settings.bookmarks[0].children).toHaveLength(1);
    expect(doc.settings.bookmarks[0].children[0].title).toBe('Chapter 1');
  });

  it('Bookmarks_RequirePdf17_ThrowsOnPdf14', () => {
    doc = new Document();
    // Bypass addBookmark (which auto-sets Pdf17) by pushing directly
    doc.settings.bookmarks.push(new BookmarkItem('Test', 0));
    doc.settings.version = PdfVersion.Pdf14;
    expect(() => doc.generateBytes()).toThrow();
  });

  it('PDF 2.0 bytes contain /Outlines when bookmarks present', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf20;
    doc.settings.bookmarks.push(new BookmarkItem('Chapter 1', 0));
    const text = pdfToText(doc.generateBytes());
    expect(text.startsWith('%PDF-2.0')).toBe(true);
    expect(text).toContain('/Outlines');
  });

  it('PDF bytes contain /Outlines when bookmarks present', () => {
    doc = new Document();
    addBookmark(doc.settings, 'Chapter 1', 0);
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/Outlines');
  });

  it('PDF bytes contain bookmark title when bookmarks present', () => {
    doc = new Document();
    addBookmark(doc.settings, 'MyChapter', 0);
    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('MyChapter');
  });
});
