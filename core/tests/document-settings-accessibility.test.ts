import { describe, it, expect } from 'vitest';
import { DocumentSettings } from '../src/Configuration/DocumentSettings';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';

/**
 * Round-trip tests for the new accessibility-related properties on
 * DocumentSettings. this feature of the this feature (PDF/UA) plan - only verifies the
 * public surface; no writer behaviour yet.
 */
describe('DocumentSettings - accessibility', () => {
  it('defaults accessibility to None', () => {
    const settings = new DocumentSettings();
    expect(settings.accessibility).toBe(AccessibilityMode.None);
  });

  it('defaults language to undefined', () => {
    const settings = new DocumentSettings();
    expect(settings.language).toBeUndefined();
  });

  it('round-trips accessibility', () => {
    const settings = new DocumentSettings();
    settings.accessibility = AccessibilityMode.PdfUa1;
    expect(settings.accessibility).toBe(AccessibilityMode.PdfUa1);
  });

  it('round-trips language', () => {
    const settings = new DocumentSettings();
    settings.language = 'en-GB';
    expect(settings.language).toBe('en-GB');
  });

  it('keeps accessibility and pdfAEnabled orthogonal', () => {
    // ZUGFeRD-style: PDF/A on, accessibility off.
    const zugferdStyle = new DocumentSettings();
    zugferdStyle.pdfAEnabled = true;
    zugferdStyle.accessibility = AccessibilityMode.None;
    expect(zugferdStyle.pdfAEnabled).toBe(true);
    expect(zugferdStyle.accessibility).toBe(AccessibilityMode.None);

    // PDF/UA on, PDF/A off.
    const uaOnly = new DocumentSettings();
    uaOnly.pdfAEnabled = false;
    uaOnly.accessibility = AccessibilityMode.PdfUa1;
    expect(uaOnly.pdfAEnabled).toBe(false);
    expect(uaOnly.accessibility).toBe(AccessibilityMode.PdfUa1);

    // Both on (e.g. PDF/A-3a + PDF/UA-1).
    const both = new DocumentSettings();
    both.pdfAEnabled = true;
    both.accessibility = AccessibilityMode.PdfUa1;
    expect(both.pdfAEnabled).toBe(true);
    expect(both.accessibility).toBe(AccessibilityMode.PdfUa1);
  });
});
