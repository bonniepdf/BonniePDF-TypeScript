import { BonniePdfError } from '../Core/BonniePdfError';

/**
 * Why {@link applyFacturX} rejected the invoice XML:
 *
 * - `unsupported-encoding`: a UTF-16 byte order mark, or a declared encoding other than UTF-8.
 * - `malformed-xml`: invalid UTF-8, or the XML is not well-formed.
 * - `doctype-forbidden`: the XML contains a document type declaration.
 * - `not-cii`: the root is not a UN/CEFACT CII `CrossIndustryInvoice` (Factur-X carries CII only).
 * - `guideline-missing`: the XML has no profile identifier (BT-24).
 * - `guideline-unrecognized`: the profile identifier is not a Factur-X / ZUGFeRD 2.1+ profile.
 * - `profile-mismatch`: the stated profile differs from the one the XML declares.
 */
export type FacturXErrorCode =
  | 'unsupported-encoding'
  | 'malformed-xml'
  | 'doctype-forbidden'
  | 'not-cii'
  | 'guideline-missing'
  | 'guideline-unrecognized'
  | 'profile-mismatch';

/**
 * Raised by {@link applyFacturX} when the invoice XML cannot back the Factur-X claim: it is not
 * well-formed UTF-8 CII, or the profile it declares is missing, unknown, or not the one stated.
 * The document is left unchanged.
 *
 * This is not invoice validation. Passing the check says nothing about the schema, totals or VAT
 * rules; validate the XML with a dedicated e-invoicing validator as well.
 */
export class FacturXError extends BonniePdfError {
  /** Which check failed. */
  public readonly code: FacturXErrorCode;

  constructor(code: FacturXErrorCode, message: string) {
    super(`${message} (${code})`);
    this.code = code;
  }
}
