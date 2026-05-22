import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../src/Document';
import { Image } from '../src/Elements/Media/Image';
import { QRCode } from '../src/Elements/Shapes/QRCode';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { SemanticRole } from '../src/Rendering/Tagging/SemanticRole';
import { isRoleProvider } from '../src/Rendering/Tagging/IRoleProvider';
import { isAltTextProvider } from '../src/Rendering/Tagging/IAltTextProvider';
import { pdfToText } from './helpers/test-base';

/**
 * alt-text on media + implicit Figure / Artifact tagging.
 * Mirrors the .NET MediaAltTextTests: Image is tested at the property
 * level (no real-image fixture needed), QRCode is tested end-to-end.
 */
describe('Media — alt-text and Figure tagging', () => {
  // ── Image role / alt-text wiring ────────────────────────────────

  it('Image with altText => Figure role', () => {
    const img = new Image();
    img.filePath = 'logo.png';
    img.altText = 'Company logo';
    expect(img.semanticRole).toBe(SemanticRole.Figure);
  });

  it('Image without altText => Artifact role', () => {
    const img = new Image();
    img.filePath = 'border.png';
    expect(img.semanticRole).toBe(SemanticRole.Artifact);
  });

  it('Image isDecorative overrides altText', () => {
    const img = new Image();
    img.filePath = 'border.png';
    img.altText = 'leftover from a copy-paste';
    img.isDecorative = true;
    expect(img.semanticRole).toBe(SemanticRole.Artifact);
  });

  it('Image implements IRoleProvider and IAltTextProvider', () => {
    const img = new Image();
    expect(isRoleProvider(img)).toBe(true);
    expect(isAltTextProvider(img)).toBe(true);
  });

  // ── QRCode role / alt-text wiring ──────────────────────────────

  it('QRCode with altText => Figure role', () => {
    const qr = new QRCode();
    qr.data = 'https://example.com';
    qr.altText = 'QR code to example.com';
    expect(qr.semanticRole).toBe(SemanticRole.Figure);
  });

  it('QRCode without altText => Artifact role', () => {
    const qr = new QRCode();
    qr.data = 'https://example.com';
    expect(qr.semanticRole).toBe(SemanticRole.Artifact);
  });

  // ── End-to-end via QRCode ──────────────────────────────────────

  let doc: Document;
  afterEach(() => {
    doc?.dispose();
  });

  it('tagged document, QRCode with altText => Figure with /Alt', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;
    doc.settings.language = 'en-GB';

    const qr = new QRCode();
    qr.data = 'https://example.com';
    qr.size = 60;
    qr.altText = 'QR code linking to example.com';
    doc.add(qr);

    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/S /Figure');
    expect(text).toContain('/Alt (QR code linking to example.com)');
  });

  it('tagged document, QRCode without altText => Artifact', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.PdfUa1;

    const qr = new QRCode();
    qr.data = 'https://example.com';
    qr.size = 60;
    doc.add(qr);

    const text = pdfToText(doc.generateBytes());
    expect(text).toContain('/S /Artifact');
    expect(text).not.toContain('/Alt (');
  });

  it('untagged document does not emit Figure or /Alt', () => {
    doc = new Document();
    doc.settings.version = PdfVersion.Pdf17;
    doc.settings.accessibility = AccessibilityMode.None;

    const qr = new QRCode();
    qr.data = 'https://example.com';
    qr.size = 60;
    qr.altText = 'ignored when tagging off';
    doc.add(qr);

    const text = pdfToText(doc.generateBytes());
    expect(text).not.toContain('/S /Figure');
    expect(text).not.toContain('/Alt (');
  });
});
