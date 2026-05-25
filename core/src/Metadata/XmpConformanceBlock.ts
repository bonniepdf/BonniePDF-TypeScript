/**
 * A conformance-namespace block emitted inside the document-level
 * `rdf:Description` in the XMP packet. One block per claim (PDF/A,
 * PDF/UA, ZUGFeRD/Factur-X, …). Multiple blocks compose: the writer
 * emits them all into the same RDF description, each with its own XML
 * namespace prefix.
 *
 * Per the this feature design (`the specification`),
 * XMP injection must be additive — every conformance feature
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

  constructor(prefix: string, namespaceUri: string, elements: ReadonlyArray<readonly [string, string]>) {
    this.prefix = prefix;
    this.namespaceUri = namespaceUri;
    this.elements = elements;
  }

  /**
   * PDF/A-1B conformance claim. The historic behaviour of BonniePDF's
   * pdfAEnabled flag — claimed as "part 1, conformance B". See
   * `the specification` for the open question of
   * which PDF/A level the writer actually produces.
   */
  static pdfA1B(): XmpConformanceBlock {
    return new XmpConformanceBlock('pdfaid', 'http://www.aiim.org/pdfa/ns/id/', [
      ['part', '1'],
      ['conformance', 'B'],
    ]);
  }

  /**
   * PDF/UA-1 conformance claim (ISO 14289-1). One `pdfuaid:part` element
   * with value `"1"`. Required for VeraPDF profile `ua1` metadata rules
   * (6-2-1, 6-2-2).
   */
  static pdfUa1(): XmpConformanceBlock {
    return new XmpConformanceBlock('pdfuaid', 'http://www.aiim.org/pdfua/ns/id/', [['part', '1']]);
  }
}
