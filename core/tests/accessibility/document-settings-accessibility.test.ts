import { describe, it, expect } from 'vitest';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';

/**
 * Round-trip tests for the new accessibility-related properties on
 * DocumentSettings. Only verifies the
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

  it('keeps accessibility and PDF/A conformance orthogonal', () => {
    // ZUGFeRD-style: PDF/A on, accessibility off.
    const zugferdStyle = new DocumentSettings();
    zugferdStyle.conformance = PdfAConformance.PdfA3b;
    zugferdStyle.accessibility = AccessibilityMode.None;
    expect(zugferdStyle.conformance).toBe(PdfAConformance.PdfA3b);
    expect(zugferdStyle.accessibility).toBe(AccessibilityMode.None);

    // PDF/UA on, PDF/A off.
    const uaOnly = new DocumentSettings();
    uaOnly.conformance = PdfAConformance.None;
    uaOnly.accessibility = AccessibilityMode.PdfUa1;
    expect(uaOnly.conformance).toBe(PdfAConformance.None);
    expect(uaOnly.accessibility).toBe(AccessibilityMode.PdfUa1);

    // Both on (e.g. PDF/A-3a + PDF/UA-1).
    const both = new DocumentSettings();
    both.conformance = PdfAConformance.PdfA3a;
    both.accessibility = AccessibilityMode.PdfUa1;
    expect(both.conformance).toBe(PdfAConformance.PdfA3a);
    expect(both.accessibility).toBe(AccessibilityMode.PdfUa1);
  });
});
