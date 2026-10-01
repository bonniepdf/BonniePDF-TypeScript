import { describe, it, expect } from 'vitest';
import {
  DocumentSettings,
  DOCUMENT_SETTINGS_OPTION_KEYS,
  applyDocumentSettingsOptions,
} from '../../src/Configuration/DocumentSettings';
import { DocumentMetadata, DOCUMENT_METADATA_OPTION_KEYS } from '../../src/Configuration/DocumentMetadata';
import { Watermark, WATERMARK_OPTION_KEYS } from '../../src/Configuration/Watermark';
import { BookmarkItem, BOOKMARK_ITEM_OPTION_KEYS } from '../../src/Configuration/BookmarkItem';
import { PageLabel, PAGE_LABEL_OPTION_KEYS } from '../../src/Configuration/PageLabel';
import { EncryptionSettings, ENCRYPTION_SETTINGS_OPTION_KEYS } from '../../src/Security/Models/EncryptionSettings';
import { Document } from '../../src/Document';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { PdfSize } from '../../src/Configuration/PdfSize';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { ZoomLevel } from '../../src/Configuration/ZoomLevel';
import { PageModeEnum } from '../../src/Configuration/PageMode';
import { PageOrientation } from '../../src/Core/PageOrientation';
import { EncryptionAlgorithm } from '../../src/Security/Models/EncryptionAlgorithm';
import { ColorPalette } from '../../src/Core/ColorPalette';

/** Runtime settable surface, minus computed getters and private state. */
function settableSurface(instance: object, internal: readonly string[] = []): string[] {
  const skip = new Set(internal);
  const names = new Set<string>();
  for (const k of Object.keys(instance)) {
    if (!k.startsWith('_') && !skip.has(k)) names.add(k);
  }
  let proto: object | null = Object.getPrototypeOf(instance);
  while (proto && proto !== Object.prototype) {
    for (const [k, d] of Object.entries(Object.getOwnPropertyDescriptors(proto))) {
      if (typeof d.set === 'function' && !k.startsWith('_') && !skip.has(k)) names.add(k);
    }
    proto = Object.getPrototypeOf(proto);
  }
  return [...names].sort();
}

describe('simple config classes (09a Phase 2.D)', () => {
  it('Watermark: positional and options forms', () => {
    expect(new Watermark('DRAFT').text).toBe('DRAFT');
    const w = new Watermark({
      text: 'CONFIDENTIAL',
      color: 'rose-500',
      opacity: 0.3,
      rotationDegrees: -30,
      fontSize: 60,
    });
    expect(w.text).toBe('CONFIDENTIAL');
    expect(w.color).toBe(ColorPalette.rose[500]);
    expect(w.opacity).toBe(0.3);
    expect(w.rotationDegrees).toBe(-30);
    expect(w.fontSize).toBe(60);
    // Defaults survive when not overridden.
    expect(w.fontName).toBe('Helvetica');
  });

  it('BookmarkItem: positional, options, and nested children literals', () => {
    expect(new BookmarkItem('Intro', 0).title).toBe('Intro');
    const b = new BookmarkItem({
      title: 'Part I',
      pageIndex: 2,
      children: [{ title: 'Chapter 1', pageIndex: 3 }, new BookmarkItem('Chapter 2', 4)],
    });
    expect(b.title).toBe('Part I');
    expect(b.pageIndex).toBe(2);
    expect(b.children).toHaveLength(2);
    expect(b.children[0]).toBeInstanceOf(BookmarkItem);
    expect(b.children[0].title).toBe('Chapter 1');
    expect(b.children[1].title).toBe('Chapter 2');
  });

  it('PageLabel and EncryptionSettings options', () => {
    const l = new PageLabel({ style: 'lowercase-roman', startAt: 4, prefix: 'A-' });
    expect(l.style).toBe('lowercase-roman');
    expect(l.startAt).toBe(4);
    expect(l.prefix).toBe('A-');
    expect(new PageLabel().style).toBe('decimal');

    const e = new EncryptionSettings({ userPassword: 'u', ownerPassword: 'o', encryptMetadata: false });
    expect(e.userPassword).toBe('u');
    expect(e.ownerPassword).toBe('o');
    expect(e.encryptMetadata).toBe(false);
    expect(e.algorithm).toBe(EncryptionAlgorithm.RC4_128); // default preserved
  });

  it('covers their settable surfaces', () => {
    expect(settableSurface(new Watermark())).toEqual([...WATERMARK_OPTION_KEYS].sort());
    expect(settableSurface(new BookmarkItem())).toEqual([...BOOKMARK_ITEM_OPTION_KEYS].sort());
    expect(settableSurface(new PageLabel())).toEqual([...PAGE_LABEL_OPTION_KEYS].sort());
    expect(settableSurface(new EncryptionSettings())).toEqual([...ENCRYPTION_SETTINGS_OPTION_KEYS].sort());
  });
});

describe('DocumentMetadata options', () => {
  it('keeps the positional forms', () => {
    expect(new DocumentMetadata('T').title).toBe('T');
    const m = new DocumentMetadata('T', 'A');
    expect(m.title).toBe('T');
    expect(m.author).toBe('A');
  });

  it('accepts an options bag', () => {
    const m = new DocumentMetadata({
      title: 'Simple Document Example',
      author: 'BonniePDF',
      subject: 'Demo',
      keywords: 'pdf, example',
      trapped: false,
    });
    expect(m.title).toBe('Simple Document Example');
    expect(m.author).toBe('BonniePDF');
    expect(m.subject).toBe('Demo');
    expect(m.keywords).toBe('pdf, example');
    expect(m.trapped).toBe(false);
    expect(m.creator).toBe('BonniePDF'); // default preserved
  });

  it('normalises customProperties from a plain record to a Map', () => {
    const m = new DocumentMetadata({ customProperties: { Dept: 'Finance', Ref: 'X-1' } });
    expect(m.customProperties).toBeInstanceOf(Map);
    expect(m.customProperties.get('Dept')).toBe('Finance');
    expect(m.customProperties.get('Ref')).toBe('X-1');
  });

  it('passes a Map through unchanged', () => {
    const map = new Map([['A', 'B']]);
    expect(new DocumentMetadata({ customProperties: map }).customProperties).toBe(map);
  });

  it('covers its settable surface', () => {
    expect(settableSurface(new DocumentMetadata())).toEqual([...DOCUMENT_METADATA_OPTION_KEYS].sort());
  });
});

describe('DocumentSettings options', () => {
  it('keeps the positional overloads', () => {
    const s = new DocumentSettings(PdfSize.letter, PageOrientation.Landscape, 30);
    expect(s.pageSize).toEqual(PdfSize.letter);
    expect(s.orientation).toBe(PageOrientation.Landscape);
    expect(s.margin).toBe(30);
  });

  it('accepts tokens across the whole bag', () => {
    const s = new DocumentSettings({
      conformance: 'pdf/a-2a',
      accessibility: 'pdf/ua-1',
      pageSize: 'letter',
      orientation: 'landscape',
      defaultZoom: 'fit-page',
      pageMode: 'use-none',
      pageColor: 'slate-50',
      language: 'en-GB',
      displayDocTitle: true,
      margin: 40,
    });
    expect(s.conformance).toBe(PdfAConformance.PdfA2a);
    expect(s.accessibility).toBe(AccessibilityMode.PdfUa1);
    expect(s.pageSize).toEqual(PdfSize.letter);
    expect(s.orientation).toBe(PageOrientation.Landscape);
    expect(s.defaultZoom).toBe(ZoomLevel.FitPage);
    expect(s.pageMode).toBe(PageModeEnum.UseNone);
    expect(s.pageColor).toBe(ColorPalette.slate[50]);
    expect(s.language).toBe('en-GB');
    expect(s.displayDocTitle).toBe(true);
    expect(s.margin).toBe(40);
  });

  it('coerces nested settings from literals into canonical instances', () => {
    const s = new DocumentSettings({
      watermark: { text: 'DRAFT', color: 'gray-400' },
      encryption: { userPassword: 'pw' },
      pageLabel: { style: 'uppercase-roman', startAt: 1 },
      defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
      bookmarks: [{ title: 'Intro', pageIndex: 0 }],
    });
    expect(s.watermark).toBeInstanceOf(Watermark);
    expect(s.watermark?.text).toBe('DRAFT');
    expect(s.encryption).toBeInstanceOf(EncryptionSettings);
    expect(s.encryption?.userPassword).toBe('pw');
    expect(s.pageLabel).toBeInstanceOf(PageLabel);
    expect(s.pageLabel?.style).toBe('uppercase-roman');
    expect(s.defaultTextStyle).toBeInstanceOf(TextStyle);
    expect(s.defaultTextStyle?.color).toBe(ColorPalette.slate[600]);
    expect(s.bookmarks[0]).toBeInstanceOf(BookmarkItem);
    expect(s.bookmarks[0].title).toBe('Intro');
  });

  it('passes nested instances through unchanged', () => {
    const style = new TextStyle({ fontSize: 9 });
    const wm = new Watermark('X');
    const s = new DocumentSettings({ defaultTextStyle: style, watermark: wm });
    expect(s.defaultTextStyle).toBe(style);
    expect(s.watermark).toBe(wm);
  });

  it('resolves conformance over pdfAEnabled regardless of key order', () => {
    // `pdfAEnabled` is legacy sugar; `conformance` must win either way, so the
    // outcome does not depend on the literal's key order.
    const a = new DocumentSettings({ pdfAEnabled: true, conformance: 'pdf/a-4' });
    const b = new DocumentSettings({ conformance: 'pdf/a-4', pdfAEnabled: true });
    expect(a.conformance).toBe(PdfAConformance.PdfA4);
    expect(b.conformance).toBe(PdfAConformance.PdfA4);
  });

  it('still honours pdfAEnabled on its own', () => {
    const s = new DocumentSettings({ pdfAEnabled: true });
    expect(s.pdfAEnabled).toBe(true);
    expect(s.conformance).not.toBe(PdfAConformance.None);
  });

  it('covers its settable surface (30 keys)', () => {
    expect(DOCUMENT_SETTINGS_OPTION_KEYS).toHaveLength(30);
    expect(settableSurface(new DocumentSettings())).toEqual([...DOCUMENT_SETTINGS_OPTION_KEYS].sort());
  });

  it('applyDocumentSettingsOptions works on an existing instance', () => {
    const s = new DocumentSettings();
    applyDocumentSettingsOptions(s, { conformance: 'pdf/a-2b', margin: 25 });
    expect(s.conformance).toBe(PdfAConformance.PdfA2b);
    expect(s.margin).toBe(25);
  });
});

describe('Document accepts nested literals (the settings/metadata split)', () => {
  it('configures a whole document in one expression', () => {
    const doc = new Document({
      settings: {
        conformance: 'pdf/a-2a',
        accessibility: 'pdf/ua-1',
        language: 'en-GB',
        defaultTextStyle: { fontFamily: 'Helvetica', fontSize: 12, color: 'slate-600' },
        defaultZoom: 'fit-page',
        pageMode: 'use-none',
        displayDocTitle: true,
      },
      metadata: {
        title: 'Simple Document Example',
        author: 'BonniePDF',
        subject: 'Demonstrating the Document API',
        keywords: 'pdf, document, example',
      },
    });

    expect(doc.settings).toBeInstanceOf(DocumentSettings);
    expect(doc.metadata).toBeInstanceOf(DocumentMetadata);
    expect(doc.settings.conformance).toBe(PdfAConformance.PdfA2a);
    expect(doc.settings.accessibility).toBe(AccessibilityMode.PdfUa1);
    expect(doc.settings.defaultTextStyle?.color).toBe(ColorPalette.slate[600]);
    expect(doc.metadata.title).toBe('Simple Document Example');
    expect(doc.pages).toHaveLength(1); // first page still auto-created
    doc.dispose();
  });

  it('still accepts instances, and the legacy positional forms', () => {
    const settings = new DocumentSettings({ conformance: 'pdf/a-2b' });
    const metadata = new DocumentMetadata({ title: 'T' });

    const viaBag = new Document({ settings, metadata });
    expect(viaBag.settings).toBe(settings);
    expect(viaBag.metadata).toBe(metadata);

    const viaPositional = new Document(settings, metadata);
    expect(viaPositional.settings).toBe(settings);
    expect(viaPositional.metadata).toBe(metadata);

    const metadataOnly = new Document(metadata);
    expect(metadataOnly.metadata).toBe(metadata);

    expect(new Document().settings).toBeInstanceOf(DocumentSettings);

    viaBag.dispose();
    viaPositional.dispose();
    metadataOnly.dispose();
  });
});
