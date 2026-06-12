import { AccessibilityMode } from '../Configuration/AccessibilityMode';
import { DocumentSettings } from '../Configuration/DocumentSettings';
import { PdfAConformance } from '../Configuration/PdfAConformance';
import { PdfVersion } from '../Configuration/PdfVersion';
import { PdfAResourceIssue } from './PdfResourceRegistry';

export type PdfAClaimSuppressedReason = 'non-embedded-standard-fonts' | 'blocking-resource-policy-issue';

interface PdfAResourceAudit {
  hasNonEmbeddedStandardFont(): boolean;
  getPdfAResourceIssues?(): PdfAResourceIssue[];
}

/**
 * Centralizes standards-related serialization decisions so the PDF writer can
 * grow PDF 2.0 / PDF/A-4 / PDF/UA-2 support without scattering conformance
 * branching through {@link PdfDocumentSerializer}.
 *
 * The current implementation deliberately preserves the existing PDF 1.7
 * behaviour: PDF/A claims are requests that may be suppressed by the this feature font
 * guard, and PDF/UA tagging is emitted only for PDF/UA-1 on PDF 1.7.
 */
export class ConformancePlan {
  public readonly requestedPdfA: PdfAConformance;
  public readonly effectivePdfA: PdfAConformance;
  public readonly requestedAccessibility: AccessibilityMode;
  public readonly effectiveAccessibility: AccessibilityMode;
  public readonly pdfVersion: (typeof PdfVersion)[keyof typeof PdfVersion];
  public readonly pdfAClaimSuppressedReason?: PdfAClaimSuppressedReason;
  public readonly pdfAResourceIssues: ReadonlyArray<PdfAResourceIssue>;
  public readonly needsXmpMetadata: boolean;
  public readonly needsOutputIntent: boolean;
  public readonly needsStructureTree: boolean;
  public readonly needsViewerPreferencesDisplayDocTitle: boolean;
  public readonly needsMarkInfo: boolean;
  public readonly needsPdf20Writer: boolean;

  private constructor(
    private readonly settings: DocumentSettings,
    registry?: PdfAResourceAudit
  ) {
    this.requestedPdfA = settings.conformance;
    this.requestedAccessibility = settings.accessibility;
    this.pdfVersion = settings.version;
    this.needsPdf20Writer = settings.version === PdfVersion.Pdf20;

    const fallbackResourceIssues: PdfAResourceIssue[] =
      registry?.hasNonEmbeddedStandardFont() === true
        ? [
            {
              code: 'non-embedded-standard-font',
              severity: 'blocking',
              message: 'At least one font would be emitted as a non-embedded standard Type1 font.',
            },
          ]
        : [];
    this.pdfAResourceIssues = registry?.getPdfAResourceIssues?.() ?? fallbackResourceIssues;
    const blockingIssues = this.pdfAResourceIssues.filter(issue => issue.severity === 'blocking');
    const suppressPdfA = settings.pdfAEnabled && blockingIssues.length > 0;
    this.effectivePdfA = suppressPdfA ? PdfAConformance.None : settings.conformance;
    this.pdfAClaimSuppressedReason = suppressPdfA
      ? blockingIssues.some(issue => issue.code === 'non-embedded-standard-font')
        ? 'non-embedded-standard-fonts'
        : 'blocking-resource-policy-issue'
      : undefined;

    this.needsStructureTree =
      settings.accessibility !== AccessibilityMode.None && settings.version === PdfVersion.Pdf17;
    this.effectiveAccessibility = this.needsStructureTree ? settings.accessibility : AccessibilityMode.None;
    this.needsViewerPreferencesDisplayDocTitle = this.needsStructureTree;
    this.needsXmpMetadata = settings.version === PdfVersion.Pdf17 || settings.version === PdfVersion.Pdf20;

    const requestedPdfAEnabled = settings.pdfAEnabled;
    const effectivePdfAEnabled = this.effectivePdfA !== PdfAConformance.None;
    const supportsOutputIntent = settings.version === PdfVersion.Pdf17 || settings.version === PdfVersion.Pdf20;
    this.needsOutputIntent =
      supportsOutputIntent &&
      (effectivePdfAEnabled || (this.effectiveAccessibility === AccessibilityMode.PdfUa1 && !requestedPdfAEnabled));
    this.needsMarkInfo = effectivePdfAEnabled || this.needsStructureTree;
  }

  public static fromSettings(settings: DocumentSettings): ConformancePlan {
    return new ConformancePlan(settings);
  }

  public withResourceRegistry(registry?: PdfAResourceAudit): ConformancePlan {
    return new ConformancePlan(this.settings, registry);
  }

  public get requestedPdfAEnabled(): boolean {
    return this.requestedPdfA !== PdfAConformance.None;
  }

  public get effectivePdfAEnabled(): boolean {
    return this.effectivePdfA !== PdfAConformance.None;
  }

  /**
   * Returns settings for XMP emission. When the honest-claim guard suppresses
   * PDF/A, clone the settings with `conformance = None` while preserving the
   * DocumentSettings prototype (getters, methods, and compatibility shims).
   */
  public createXmpSettings(): DocumentSettings {
    if (this.effectivePdfA === this.requestedPdfA && this.effectiveAccessibility === this.requestedAccessibility) {
      return this.settings;
    }

    return Object.assign(Object.create(Object.getPrototypeOf(this.settings)), this.settings, {
      conformance: this.effectivePdfA,
      accessibility: this.effectiveAccessibility,
    });
  }
}
