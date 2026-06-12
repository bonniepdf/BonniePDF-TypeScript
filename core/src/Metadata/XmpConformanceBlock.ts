import { PdfAConformance } from '../Configuration/PdfAConformance';
import { XmpExtensionSchema, XmpExtensionSchemaProperty } from './XmpExtensionSchema';

/**
 * A conformance-namespace block emitted inside the document-level
 * `rdf:Description` in the XMP packet. One block per claim (PDF/A,
 * PDF/UA, ZUGFeRD/Factur-X, …). Multiple blocks compose: the writer
 * emits them all into the same RDF description, each with its own XML
 * namespace prefix.
 *
 * Per the this feature design (`the specification`),
 * XMP injection must be additive - every conformance feature
 * (current PDF/A, PDF/UA from this feature, ZUGFeRD's `fx` later) registers
 * through this same hook so no one feature has to rewrite the packet.
 */
export class XmpConformanceBlock {
  /** XML namespace prefix (e.g. `"pdfuaid"`, `"pdfaid"`, `"fx"`). */
  public readonly prefix: string;
  /** XML namespace URI for the block's elements. */
  public readonly namespaceUri: string;
  /** Element name + value pairs written inside the namespace. */
  public readonly elements: ReadonlyArray<readonly [string, string]>;
  /**
   * Optional PDF/A extension-schema descriptor. Set when this block's
   * namespace is NOT one of the schemas predefined by ISO 19005 - in
   * which case PDF/A-2/3 §6.6.2.3.1 requires the namespace to be
   * declared in a `pdfaExtension:schemas` bag. `undefined` when the
   * namespace is already predefined (e.g. `pdfaid`).
   */
  public readonly extensionSchema?: XmpExtensionSchema;

  constructor(
    prefix: string,
    namespaceUri: string,
    elements: ReadonlyArray<readonly [string, string]>,
    extensionSchema?: XmpExtensionSchema
  ) {
    this.prefix = prefix;
    this.namespaceUri = namespaceUri;
    this.elements = elements;
    this.extensionSchema = extensionSchema;
  }

  private static pdfAid(part: string, conformance?: string, rev?: string): XmpConformanceBlock {
    const elements: Array<readonly [string, string]> = [['part', part]];
    if (conformance) elements.push(['conformance', conformance]);
    if (rev) elements.push(['rev', rev]);
    return new XmpConformanceBlock('pdfaid', 'http://www.aiim.org/pdfa/ns/id/', elements);
  }

  /** PDF/A-1b: ISO 19005-1, part 1, conformance B. */
  static pdfA1B(): XmpConformanceBlock {
    return XmpConformanceBlock.pdfAid('1', 'B');
  }

  /** PDF/A-1a: ISO 19005-1, part 1, conformance A (tagged). */
  static pdfA1A(): XmpConformanceBlock {
    return XmpConformanceBlock.pdfAid('1', 'A');
  }

  /** PDF/A-2b: ISO 19005-2, part 2, conformance B. */
  static pdfA2B(): XmpConformanceBlock {
    return XmpConformanceBlock.pdfAid('2', 'B');
  }

  /** PDF/A-2a: ISO 19005-2, part 2, conformance A (tagged). */
  static pdfA2A(): XmpConformanceBlock {
    return XmpConformanceBlock.pdfAid('2', 'A');
  }

  /** PDF/A-3b: ISO 19005-3, part 3, conformance B (allows embedded files). */
  static pdfA3B(): XmpConformanceBlock {
    return XmpConformanceBlock.pdfAid('3', 'B');
  }

  /** PDF/A-3a: ISO 19005-3, part 3, conformance A (tagged; allows embedded files). */
  static pdfA3A(): XmpConformanceBlock {
    return XmpConformanceBlock.pdfAid('3', 'A');
  }

  /** PDF/A-4: ISO 19005-4:2020 baseline. No legacy A/B/U conformance suffix. */
  static pdfA4(): XmpConformanceBlock {
    return XmpConformanceBlock.pdfAid('4', undefined, '2020');
  }

  /**
   * Returns the conformance block matching `conformance`, or
   * `undefined` if no PDF/A claim should be emitted.
   */
  static forPdfA(conformance: PdfAConformance): XmpConformanceBlock | undefined {
    switch (conformance) {
      case PdfAConformance.PdfA1b:
        return XmpConformanceBlock.pdfA1B();
      case PdfAConformance.PdfA1a:
        return XmpConformanceBlock.pdfA1A();
      case PdfAConformance.PdfA2b:
        return XmpConformanceBlock.pdfA2B();
      case PdfAConformance.PdfA2a:
        return XmpConformanceBlock.pdfA2A();
      case PdfAConformance.PdfA3b:
        return XmpConformanceBlock.pdfA3B();
      case PdfAConformance.PdfA3a:
        return XmpConformanceBlock.pdfA3A();
      case PdfAConformance.PdfA4:
        return XmpConformanceBlock.pdfA4();
      default:
        return undefined;
    }
  }

  /**
   * PDF/UA-1 conformance claim (ISO 14289-1). One `pdfuaid:part` element
   * with value `"1"`. Required for veraPDF profile `ua1` metadata rules
   * (6-2-1, 6-2-2).
   *
   * The `pdfuaid` namespace is not predefined by ISO 19005, so the
   * block carries an {@link XmpExtensionSchema} descriptor that the
   * writer emits as a `pdfaExtension:schemas` entry whenever this
   * block coexists with a PDF/A claim.
   */
  static pdfUa1(): XmpConformanceBlock {
    return new XmpConformanceBlock(
      'pdfuaid',
      'http://www.aiim.org/pdfua/ns/id/',
      [['part', '1']],
      new XmpExtensionSchema('http://www.aiim.org/pdfua/ns/id/', 'pdfuaid', 'PDF/UA identification schema', [
        new XmpExtensionSchemaProperty(
          'part',
          'Integer',
          'internal',
          'Indicates, which part of ISO 14289 standard is followed'
        ),
      ])
    );
  }
}
