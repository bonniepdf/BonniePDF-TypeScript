import { AccessibilityMode } from '../Configuration/AccessibilityMode';
import { DocumentSettings } from '../Configuration/DocumentSettings';
import { PdfAConformance } from '../Configuration/PdfAConformance';
import { PdfVersion } from '../Configuration/PdfVersion';
import { PdfAResourceIssue } from './PdfResourceRegistry';

export type PdfAClaimSuppressedReason = 'non-embedded-standard-fonts' | 'blocking-resource-policy-issue';

interface PdfAResourceAudit {
  hasNonEmbeddedStandardFont(): boolean;
  getNonEmbeddedStandardFonts?(): string[];
  getPdfAResourceIssues?(): PdfAResourceIssue[];
}

/** `PdfA2a` → `pdf/a-2a`, `PdfA4` → `pdf/a-4`: the claim's spec token. */
export function pdfAConformanceToken(conformance: PdfAConformance): string {
  const match = /^PdfA(\d)([a-z]?)$/i.exec(conformance);
  return match ? `pdf/a-${match[1]}${match[2].toLowerCase()}` : 'none';
}

/**
 * Centralizes PDF version and conformance decisions used during serialization,
 * so {@link PdfDocumentSerializer} can grow PDF 2.0 / PDF/A-4 / PDF/UA-2
 * support without scattering conformance branching through the writer.
 *
 * PDF/A and PDF/UA-1 claims are requests that the honest-claim guard may
 * withhold when standard-14 fonts cannot be embedded; PDF/UA tagging is emitted
 * only for PDF/UA-1 on PDF 1.7, and is kept even when its claim is withheld.
 */
export class ConformancePlan {
  public readonly requestedPdfA: PdfAConformance;
  public readonly effectivePdfA: PdfAConformance;
  public readonly requestedAccessibility: AccessibilityMode;
  public readonly effectiveAccessibility: AccessibilityMode;
  public readonly pdfVersion: (typeof PdfVersion)[keyof typeof PdfVersion];
  public readonly pdfAClaimSuppressedReason?: PdfAClaimSuppressedReason;
  public readonly pdfAResourceIssues: ReadonlyArray<PdfAResourceIssue>;
  /**
   * True when PDF/UA-1 tagging is written but its `pdfuaid` claim is withheld,
   * because standard-14 fonts cannot be embedded (ISO 14289-1 §7.21.4.1).
   */
  public readonly pdfUaClaimSuppressed: boolean;
  /** Standard-14 font references written without embedding, for diagnostics. */
  public readonly nonEmbeddedStandardFonts: ReadonlyArray<string>;
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
    const fontsUnembedded = registry?.hasNonEmbeddedStandardFont() === true;
    this.nonEmbeddedStandardFonts = fontsUnembedded ? (registry?.getNonEmbeddedStandardFonts?.() ?? []) : [];
    // The claim is withheld; the tagging (and the PDF/UA-only OutputIntent,
    // which is colour management rather than a claim) is not.
    this.pdfUaClaimSuppressed = this.effectiveAccessibility === AccessibilityMode.PdfUa1 && fontsUnembedded;
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
   * Returns settings for XMP emission. When the honest-claim guard withholds a
   * claim, clone the settings with `conformance = None` and/or `accessibility =
   * None` while preserving the DocumentSettings prototype (getters, methods, and
   * compatibility shims). The caller's settings are never modified.
   */
  public createXmpSettings(): DocumentSettings {
    const xmpAccessibility = this.pdfUaClaimSuppressed ? AccessibilityMode.None : this.effectiveAccessibility;
    if (this.effectivePdfA === this.requestedPdfA && xmpAccessibility === this.requestedAccessibility) {
      return this.settings;
    }

    return Object.assign(Object.create(Object.getPrototypeOf(this.settings)), this.settings, {
      conformance: this.effectivePdfA,
      accessibility: xmpAccessibility,
    });
  }
}
