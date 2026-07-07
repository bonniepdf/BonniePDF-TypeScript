/**
 * Factur-X / ZUGFeRD 2.x semantic profile. Determines the
 * `fx:ConformanceLevel` written to the XMP and constrains what the embedded
 * invoice XML is expected to contain. BonniePDF does not generate or validate
 * the XML against the profile schema — the profile is metadata about
 * caller-supplied XML (see {@link applyFacturX}).
 */
export enum FacturXProfile {
  /** MINIMUM — header + totals only. Not a valid VAT invoice on its own. */
  Minimum = 'Minimum',
  /** BASIC WL (without lines) — header + totals, no line items. */
  BasicWl = 'BasicWl',
  /** BASIC — line-level detail, subset of EN 16931. */
  Basic = 'Basic',
  /** EN 16931 (COMFORT) — the full European semantic standard. The EU baseline. */
  En16931 = 'En16931',
  /** EXTENDED — EN 16931 plus additional business terms. */
  Extended = 'Extended',
  /** XRECHNUNG — the German CIUS of EN 16931. */
  XRechnung = 'XRechnung',
}

/**
 * The `fx:ConformanceLevel` string for a profile, spelled exactly as the
 * Factur-X / ZUGFeRD specification requires (note the spaces in `"EN 16931"`
 * and `"BASIC WL"`).
 */
export function facturXConformanceLevel(profile: FacturXProfile): string {
  switch (profile) {
    case FacturXProfile.Minimum:
      return 'MINIMUM';
    case FacturXProfile.BasicWl:
      return 'BASIC WL';
    case FacturXProfile.Basic:
      return 'BASIC';
    case FacturXProfile.En16931:
      return 'EN 16931';
    case FacturXProfile.Extended:
      return 'EXTENDED';
    case FacturXProfile.XRechnung:
      return 'XRECHNUNG';
  }
}
