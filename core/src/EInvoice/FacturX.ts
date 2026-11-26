import { Document } from '../Document';
import { PdfAConformance } from '../Configuration/PdfAConformance';
import { AttachmentRelationship } from '../Attachments/AttachmentRelationship';
import { FacturXProfile, facturXConformanceLevel } from './FacturXProfile';
import { FacturXError } from './FacturXError';
import { checkFacturXXml } from './FacturXXmlCheck';

/** The Factur-X-mandated file name for the embedded invoice XML. */
export const FACTUR_X_DEFAULT_FILENAME = 'factur-x.xml';

/** Options for {@link applyFacturX}. */
export interface FacturXOptions {
  /**
   * The semantic profile the XML conforms to. When omitted, it is read from the XML's profile
   * identifier (BT-24). When given, it must match that identifier, or {@link applyFacturX} throws
   * a {@link FacturXError} with code `profile-mismatch`.
   */
  profile?: FacturXProfile;
  /** Embedded file name. Default `factur-x.xml`; must match the XMP. */
  fileName?: string;
  /** The `fx:DocumentType` value. Default `"INVOICE"`. */
  documentType?: string;
}

/**
 * Binds caller-supplied invoice XML to a generated document to produce a
 * ZUGFeRD / Factur-X e-invoice. A thin, dependency-free binding over
 * capabilities the engine already has: it forces PDF/A-3, embeds the XML as an
 * associated file with the `Data` relationship, and registers the `fx:` XMP
 * metadata block. Mutates and returns the document for chaining.
 *
 * Before changing the document it checks only what the Factur-X claim
 * depends on: the XML is well-formed UTF-8 CII (no DOCTYPE) and declares a
 * recognised profile identifier (BT-24) that matches `options.profile`. Any
 * failure throws a {@link FacturXError} and leaves the document unchanged.
 *
 * **BonniePDF does not generate or validate the invoice XML.** The XML is a
 * caller input — produced by an ERP or a dedicated e-invoicing toolchain
 * (Mustangproject, the Factur-X reference libraries, …). The check above does
 * not read the CII schema, totals or VAT rules. Validate generated files
 * against veraPDF (PDF/A-3) *and* an independent ZUGFeRD validator before
 * claiming conformance.
 */
export function applyFacturX(doc: Document, invoiceXml: Uint8Array, options: FacturXOptions = {}): Document {
  if (!invoiceXml || invoiceXml.length === 0) {
    throw new Error('Invoice XML cannot be null or empty.');
  }
  const declared = checkFacturXXml(invoiceXml);
  if (options.profile !== undefined && options.profile !== declared.profile) {
    throw new FacturXError(
      'profile-mismatch',
      `Factur-X profile ${facturXConformanceLevel(options.profile)} was requested, but the invoice XML declares ` +
        `${facturXConformanceLevel(declared.profile)} ("${declared.guideline}")`
    );
  }
  const profile = declared.profile;
  const fileName = options.fileName ?? FACTUR_X_DEFAULT_FILENAME;
  const documentType = options.documentType ?? 'INVOICE';

  // Factur-X is defined on PDF/A-3. Force the "b" level unless the caller
  // already selected a PDF/A-3 level (so an explicit tagged 3a choice
  // survives).
  if (doc.settings.conformance !== PdfAConformance.PdfA3b && doc.settings.conformance !== PdfAConformance.PdfA3a) {
    doc.settings.conformance = PdfAConformance.PdfA3b;
  }

  doc.attach({
    fileName,
    content: invoiceXml,
    relationship: AttachmentRelationship.Data,
    mediaType: 'text/xml',
    description: 'Factur-X invoice',
  });

  doc.settings.facturX = {
    documentType,
    documentFileName: fileName,
    version: '1.0',
    conformanceLevel: facturXConformanceLevel(profile),
  };

  return doc;
}
