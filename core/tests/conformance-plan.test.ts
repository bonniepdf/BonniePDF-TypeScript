import { describe, expect, it } from 'vitest';
import { AccessibilityMode } from '../src/Configuration/AccessibilityMode';
import { DocumentSettings } from '../src/Configuration/DocumentSettings';
import { PdfAConformance } from '../src/Configuration/PdfAConformance';
import { PdfVersion } from '../src/Configuration/PdfVersion';
import { ConformancePlan } from '../src/Rendering/ConformancePlan';

function registryWithNonEmbeddedStandardFont(hasNonEmbeddedStandardFont: boolean) {
  return { hasNonEmbeddedStandardFont: () => hasNonEmbeddedStandardFont };
}

describe('ConformancePlan', () => {
  it('preserves default non-conformance decisions', () => {
    const settings = new DocumentSettings();

    const plan = ConformancePlan.fromSettings(settings);

    expect(plan.requestedPdfA).toBe(PdfAConformance.None);
    expect(plan.effectivePdfA).toBe(PdfAConformance.None);
    expect(plan.requestedPdfAEnabled).toBe(false);
    expect(plan.effectivePdfAEnabled).toBe(false);
    expect(plan.needsXmpMetadata).toBe(false);
    expect(plan.needsOutputIntent).toBe(false);
    expect(plan.needsStructureTree).toBe(false);
    expect(plan.needsViewerPreferencesDisplayDocTitle).toBe(false);
    expect(plan.needsPdf20Writer).toBe(false);
  });

  it('requests XMP metadata and PDF 2.0 writer support for plain PDF 2.0 documents', () => {
    const settings = new DocumentSettings();
    settings.version = PdfVersion.Pdf20;

    const plan = ConformancePlan.fromSettings(settings);

    expect(plan.needsPdf20Writer).toBe(true);
    expect(plan.needsXmpMetadata).toBe(true);
    expect(plan.needsStructureTree).toBe(false);
    expect(plan.needsOutputIntent).toBe(false);
  });

  it('suppresses PDF/A for blocking non-font resource policy issues', () => {
    const settings = new DocumentSettings();
    settings.version = PdfVersion.Pdf20;
    settings.conformance = PdfAConformance.PdfA4;

    const plan = ConformancePlan.fromSettings(settings).withResourceRegistry({
      hasNonEmbeddedStandardFont: () => false,
      getPdfAResourceIssues: () => [
        {
          code: 'png-soft-mask-flattened',
          severity: 'blocking',
          message: 'PNG soft mask would be emitted.',
        },
      ],
    });

    expect(plan.effectivePdfA).toBe(PdfAConformance.None);
    expect(plan.pdfAClaimSuppressedReason).toBe('blocking-resource-policy-issue');
    expect(plan.needsOutputIntent).toBe(false);
  });

  it('keeps PDF/A for mitigated resource policy issues', () => {
    const settings = new DocumentSettings();
    settings.version = PdfVersion.Pdf20;
    settings.conformance = PdfAConformance.PdfA4;

    const plan = ConformancePlan.fromSettings(settings).withResourceRegistry({
      hasNonEmbeddedStandardFont: () => false,
      getPdfAResourceIssues: () => [
        {
          code: 'alpha-graphics-state-flattened',
          severity: 'mitigated',
          message: 'Alpha was made opaque.',
        },
      ],
    });

    expect(plan.effectivePdfA).toBe(PdfAConformance.PdfA4);
    expect(plan.pdfAClaimSuppressedReason).toBeUndefined();
    expect(plan.needsOutputIntent).toBe(true);
  });

  it('requests PDF/A output intent for effective PDF/A-4 documents', () => {
    const settings = new DocumentSettings();
    settings.version = PdfVersion.Pdf20;
    settings.conformance = PdfAConformance.PdfA4;

    const plan = ConformancePlan.fromSettings(settings).withResourceRegistry(
      registryWithNonEmbeddedStandardFont(false)
    );

    expect(plan.needsPdf20Writer).toBe(true);
    expect(plan.effectivePdfA).toBe(PdfAConformance.PdfA4);
    expect(plan.needsXmpMetadata).toBe(true);
    expect(plan.needsOutputIntent).toBe(true);
  });

  it('suppresses requested PDF/UA-1 XMP claims when PDF 2.0 has no PDF/UA-2 support yet', () => {
    const settings = new DocumentSettings();
    settings.version = PdfVersion.Pdf20;
    settings.accessibility = AccessibilityMode.PdfUa1;

    const plan = ConformancePlan.fromSettings(settings);
    const xmpSettings = plan.createXmpSettings();

    expect(plan.requestedAccessibility).toBe(AccessibilityMode.PdfUa1);
    expect(plan.effectiveAccessibility).toBe(AccessibilityMode.None);
    expect(plan.needsStructureTree).toBe(false);
    expect(plan.needsOutputIntent).toBe(false);
    expect(xmpSettings.accessibility).toBe(AccessibilityMode.None);
  });

  it('requests PDF/UA-1 structure and output intent for PDF 1.7 UA-only documents', () => {
    const settings = new DocumentSettings();
    settings.version = PdfVersion.Pdf17;
    settings.accessibility = AccessibilityMode.PdfUa1;

    const plan = ConformancePlan.fromSettings(settings);

    expect(plan.needsXmpMetadata).toBe(true);
    expect(plan.needsStructureTree).toBe(true);
    expect(plan.needsViewerPreferencesDisplayDocTitle).toBe(true);
    expect(plan.needsOutputIntent).toBe(true);
    expect(plan.needsMarkInfo).toBe(true);
  });

  it('keeps the PDF/A claim when registered resources have no non-embedded standard fonts', () => {
    const settings = new DocumentSettings();
    settings.version = PdfVersion.Pdf17;
    settings.conformance = PdfAConformance.PdfA2b;

    const plan = ConformancePlan.fromSettings(settings).withResourceRegistry(
      registryWithNonEmbeddedStandardFont(false)
    );

    expect(plan.requestedPdfA).toBe(PdfAConformance.PdfA2b);
    expect(plan.effectivePdfA).toBe(PdfAConformance.PdfA2b);
    expect(plan.pdfAClaimSuppressedReason).toBeUndefined();
    expect(plan.needsOutputIntent).toBe(true);
    expect(plan.createXmpSettings()).toBe(settings);
  });

  it('suppresses the PDF/A claim when resources include non-embedded standard fonts', () => {
    const settings = new DocumentSettings();
    settings.version = PdfVersion.Pdf17;
    settings.conformance = PdfAConformance.PdfA2b;

    const plan = ConformancePlan.fromSettings(settings).withResourceRegistry(registryWithNonEmbeddedStandardFont(true));
    const xmpSettings = plan.createXmpSettings();

    expect(plan.requestedPdfA).toBe(PdfAConformance.PdfA2b);
    expect(plan.effectivePdfA).toBe(PdfAConformance.None);
    expect(plan.pdfAClaimSuppressedReason).toBe('non-embedded-standard-fonts');
    expect(plan.needsOutputIntent).toBe(false);
    expect(xmpSettings).not.toBe(settings);
    expect(xmpSettings.conformance).toBe(PdfAConformance.None);
    expect(xmpSettings.pdfAEnabled).toBe(false);
    expect(xmpSettings.getOrientedPageSize()).toEqual(settings.getOrientedPageSize());
  });
});
