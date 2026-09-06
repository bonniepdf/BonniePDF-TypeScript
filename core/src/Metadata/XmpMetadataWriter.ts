import { DocumentMetadata } from '../Configuration/DocumentMetadata';
import { XmpConformanceBlock } from './XmpConformanceBlock';

/**
 * Builds the XMP metadata packet from document properties and active
 * conformance claims. The packet body is composed of:
 *
 *   1. **Conformance blocks** - pdfaid, pdfuaid, and any further additive
 *      namespace, emitted via the `conformanceBlocks` hook. Required by
 *      PDF/A and PDF/UA-1.
 *
 *   2. **Dublin Core (dc)** - title, creator (author), description (subject).
 *      Required by Matterhorn Protocol section 6 for PDF/UA-1 and by
 *      ISO 19005-1 section 6.7.3 for PDF/A: every key in the document-info
 *      dictionary that has an analogous XMP property must be mirrored.
 *
 *   3. **PDF schema (pdf)** - Keywords, Producer. Mirrors the /Keywords and
 *      /Producer entries from the info dictionary.
 *
 *   4. **XMP basic schema (xmp)** - CreatorTool, CreateDate, ModifyDate.
 *      Mirrors /Creator, /CreationDate, /ModDate.
 *
 * Returns an empty string when no conformance blocks are provided, which is the
 * "no XMP body" path plain (non-tagged, non-PDF/A) documents rely on.
 */
export class XmpMetadataWriter {
  public static generateXmpXml(
    metadata: DocumentMetadata,
    conformanceBlocks?: ReadonlyArray<XmpConformanceBlock>
  ): string {
    if (!conformanceBlocks || conformanceBlocks.length === 0) {
      return '';
    }

    const parts: string[] = [];
    parts.push('<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>\n');
    parts.push('<x:xmpmeta xmlns:x="adobe:ns:meta/">\n');
    parts.push('  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n');

    // 1. Conformance namespaces (pdfaid, pdfuaid, …) in one rdf:Description
    parts.push('    <rdf:Description rdf:about=""');
    for (const block of conformanceBlocks) {
      parts.push(` xmlns:${block.prefix}="${block.namespaceUri}"`);
    }
    parts.push('>\n');
    for (const block of conformanceBlocks) {
      for (const [name, value] of block.elements) {
        parts.push(`      <${block.prefix}:${name}>${escapeXmlText(value)}</${block.prefix}:${name}>\n`);
      }
    }
    parts.push('    </rdf:Description>\n');

    // 2. Dublin Core - title, creator (author), subject (keywords),
    //    description (subject). Naming is unintuitive because PDF and
    //    Dublin Core overlap: PDF /Subject → dc:description, while
    //    PDF /Keywords → dc:subject (an unordered Bag of topic words).
    if (metadata?.title || metadata?.author || metadata?.keywords || metadata?.subject) {
      parts.push('    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">\n');
      if (metadata.title) {
        parts.push('      <dc:title>\n');
        parts.push('        <rdf:Alt>\n');
        parts.push(`          <rdf:li xml:lang="x-default">${escapeXmlText(metadata.title)}</rdf:li>\n`);
        parts.push('        </rdf:Alt>\n');
        parts.push('      </dc:title>\n');
      }
      if (metadata.author) {
        // dc:creator is an ordered Seq of strings per XMP §8.6.
        parts.push('      <dc:creator>\n');
        parts.push('        <rdf:Seq>\n');
        parts.push(`          <rdf:li>${escapeXmlText(metadata.author)}</rdf:li>\n`);
        parts.push('        </rdf:Seq>\n');
        parts.push('      </dc:creator>\n');
      }
      if (metadata.keywords) {
        // dc:subject - Bag of individual keywords (comma- or
        // semicolon-separated in PDF /Keywords). Matches .NET behaviour.
        const tokens = metadata.keywords
          .split(/[,;]/)
          .map(t => t.trim())
          .filter(t => t.length > 0);
        parts.push('      <dc:subject>\n');
        parts.push('        <rdf:Bag>\n');
        for (const kw of tokens) {
          parts.push(`          <rdf:li>${escapeXmlText(kw)}</rdf:li>\n`);
        }
        parts.push('        </rdf:Bag>\n');
        parts.push('      </dc:subject>\n');
      }
      if (metadata.subject) {
        // PDF /Subject ↔ dc:description (language alternative).
        parts.push('      <dc:description>\n');
        parts.push('        <rdf:Alt>\n');
        parts.push(`          <rdf:li xml:lang="x-default">${escapeXmlText(metadata.subject)}</rdf:li>\n`);
        parts.push('        </rdf:Alt>\n');
        parts.push('      </dc:description>\n');
      }
      parts.push('    </rdf:Description>\n');
    }

    // 3. PDF schema - Keywords, Producer.
    if (metadata?.keywords || metadata?.producer) {
      parts.push('    <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">\n');
      if (metadata.keywords) {
        parts.push(`      <pdf:Keywords>${escapeXmlText(metadata.keywords)}</pdf:Keywords>\n`);
      }
      if (metadata.producer) {
        parts.push(`      <pdf:Producer>${escapeXmlText(metadata.producer)}</pdf:Producer>\n`);
      }
      parts.push('    </rdf:Description>\n');
    }

    // 4. XMP basic schema - CreatorTool, CreateDate, ModifyDate.
    if (metadata?.creator || metadata?.creationDate || metadata?.modifiedDate) {
      parts.push('    <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">\n');
      if (metadata.creator) {
        // PDF /Creator (the tool) ↔ xmp:CreatorTool.
        parts.push(`      <xmp:CreatorTool>${escapeXmlText(metadata.creator)}</xmp:CreatorTool>\n`);
      }
      if (metadata.creationDate) {
        parts.push(`      <xmp:CreateDate>${toXmpDate(metadata.creationDate)}</xmp:CreateDate>\n`);
      }
      if (metadata.modifiedDate) {
        parts.push(`      <xmp:ModifyDate>${toXmpDate(metadata.modifiedDate)}</xmp:ModifyDate>\n`);
      }
      parts.push('    </rdf:Description>\n');
    }

    // 5. PDF/A extension schema declarations (ISO 19005-2/3 §6.6.2.3).
    // Every conformance block whose namespace is NOT predefined by ISO
    // 19005 must be declared in a pdfaExtension:schemas bag. Only emit
    // when a PDF/A claim is also present - without PDF/A there's no
    // validator that checks this rule and the bag is dead weight.
    const hasPdfA = conformanceBlocks.some(b => b.prefix === 'pdfaid');
    const extensionSchemas = conformanceBlocks
      .map(b => b.extensionSchema)
      .filter((s): s is NonNullable<typeof s> => !!s);
    if (hasPdfA && extensionSchemas.length > 0) {
      parts.push('    <rdf:Description rdf:about=""\n');
      parts.push('        xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/"\n');
      parts.push('        xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#"\n');
      parts.push('        xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">\n');
      parts.push('      <pdfaExtension:schemas>\n');
      parts.push('        <rdf:Bag>\n');
      for (const schema of extensionSchemas) {
        parts.push('          <rdf:li rdf:parseType="Resource">\n');
        parts.push(
          `            <pdfaSchema:namespaceURI>${escapeXmlText(schema.namespaceUri)}</pdfaSchema:namespaceURI>\n`
        );
        parts.push(`            <pdfaSchema:prefix>${escapeXmlText(schema.prefix)}</pdfaSchema:prefix>\n`);
        parts.push(`            <pdfaSchema:schema>${escapeXmlText(schema.schemaName)}</pdfaSchema:schema>\n`);
        parts.push('            <pdfaSchema:property>\n');
        parts.push('              <rdf:Seq>\n');
        for (const prop of schema.properties) {
          parts.push('                <rdf:li rdf:parseType="Resource">\n');
          parts.push(`                  <pdfaProperty:name>${escapeXmlText(prop.name)}</pdfaProperty:name>\n`);
          parts.push(
            `                  <pdfaProperty:valueType>${escapeXmlText(prop.valueType)}</pdfaProperty:valueType>\n`
          );
          parts.push(
            `                  <pdfaProperty:category>${escapeXmlText(prop.category)}</pdfaProperty:category>\n`
          );
          parts.push(
            `                  <pdfaProperty:description>${escapeXmlText(prop.description)}</pdfaProperty:description>\n`
          );
          parts.push('                </rdf:li>\n');
        }
        parts.push('              </rdf:Seq>\n');
        parts.push('            </pdfaSchema:property>\n');
        parts.push('          </rdf:li>\n');
      }
      parts.push('        </rdf:Bag>\n');
      parts.push('      </pdfaExtension:schemas>\n');
      parts.push('    </rdf:Description>\n');
    }

    parts.push('  </rdf:RDF>\n');
    parts.push('</x:xmpmeta>\n');
    parts.push('<?xpacket end="w"?>');
    return parts.join('');
  }
}

function escapeXmlText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Formats a Date as an XMP-compliant ISO 8601 string (e.g. 2026-05-24T07:23:11Z). */
function toXmpDate(d: Date): string {
  const iso = d.toISOString(); // 2026-05-24T07:23:11.123Z
  // Strip milliseconds - XMP allows them but writing whole seconds keeps
  // generated PDFs byte-stable across CI runs that re-parse the date.
  return iso.replace(/\.\d{3}Z$/, 'Z');
}
