/**
 * Describes one entry in the PDF/A `pdfaExtension:schemas` bag - the
 * mechanism ISO 19005-2/3 §6.6.2.3 provides for declaring XMP
 * namespaces that are NOT predefined by the standard (e.g. `pdfuaid`
 * for PDF/UA-1 identification, `fx` for ZUGFeRD / Factur-X).
 *
 * veraPDF profile `2b` rule 6.6.2.3.1 rejects any non-predefined XMP
 * property whose namespace is not described here.
 */
export class XmpExtensionSchema {
  /** Namespace URI being described. */
  public readonly namespaceUri: string;
  /** XML prefix used elsewhere for this namespace. */
  public readonly prefix: string;
  /** Human-readable schema name (free text). */
  public readonly schemaName: string;
  /** Property descriptors - one per property the schema exposes. */
  public readonly properties: ReadonlyArray<XmpExtensionSchemaProperty>;

  constructor(
    namespaceUri: string,
    prefix: string,
    schemaName: string,
    properties: ReadonlyArray<XmpExtensionSchemaProperty>
  ) {
    this.namespaceUri = namespaceUri;
    this.prefix = prefix;
    this.schemaName = schemaName;
    this.properties = properties;
  }
}

/**
 * Describes one property inside an {@link XmpExtensionSchema}. Maps to
 * the `pdfaProperty:*` fields required by ISO 19005-2/3 §6.6.2.3.2.
 */
export class XmpExtensionSchemaProperty {
  /** Property name (e.g. `"part"`). */
  public readonly name: string;
  /** XMP value type (e.g. `"Integer"`, `"Text"`). */
  public readonly valueType: string;
  /** Either `"internal"` or `"external"`. */
  public readonly category: string;
  /** Human-readable description of the property. */
  public readonly description: string;

  constructor(name: string, valueType: string, category: string, description: string) {
    this.name = name;
    this.valueType = valueType;
    this.category = category;
    this.description = description;
  }
}
