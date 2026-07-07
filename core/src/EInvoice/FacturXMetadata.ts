/**
 * The XMP namespace URI for the Factur-X / ZUGFeRD 2.x block.
 */
export const FACTUR_X_NAMESPACE_URI = 'urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#';

/** The XML prefix used for the Factur-X namespace. */
export const FACTUR_X_PREFIX = 'fx';

/**
 * Resolved Factur-X / ZUGFeRD XMP metadata written into the document-level
 * XMP packet under the `fx` namespace. Populated by {@link applyFacturX} from
 * a {@link FacturXProfile}; carried on `settings.facturX` and consumed by the
 * XMP writer.
 *
 * These are the four properties the Factur-X / ZUGFeRD 2.x technical
 * specification requires: already-resolved strings, not the domain profile
 * enum (the profile→level mapping lives in `facturXConformanceLevel`).
 */
export interface FacturXMetadata {
  /** `fx:DocumentType` — normally `"INVOICE"` (also `"ORDER"` for Order-X). */
  documentType: string;
  /** `fx:DocumentFileName` — MUST match the embedded XML attachment's file name. */
  documentFileName: string;
  /** `fx:Version` — the Factur-X specification version, e.g. `"1.0"`. */
  version: string;
  /** `fx:ConformanceLevel` — the profile name, e.g. `"EN 16931"`. */
  conformanceLevel: string;
}
