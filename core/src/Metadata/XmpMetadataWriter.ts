import { DocumentMetadata } from '../Configuration/DocumentMetadata';
import { XmpConformanceBlock } from './XmpConformanceBlock';

/**
 * Generates the XMP metadata packet for PDF documents.
 *
 * this feature scope: the full dc/xmp/pdf metadata emission is still stubbed
 * (the .NET side has it via System.Xml — TS will get a hand-rolled
 * version in a separate task). What's wired here is the additive
 * conformance-block hook per the this feature this feature design: each block claims
 * a namespace and a set of element values that get embedded in the
 * single document-level `rdf:Description`. PDF/A, PDF/UA, and later
 * ZUGFeRD's `fx` namespace all compose through this hook.
 *
 * dc:title is emitted alongside conformance blocks whenever
 * metadata.title is set — required by PDF/UA-1 Matterhorn clause 6-1.
 */
export class XmpMetadataWriter {
  /**
   * Generate the XMP XML string for a document, optionally including
   * one or more conformance namespace blocks.
   *
   * Returns an empty string when no blocks are provided — preserves
   * existing behaviour for the pre-T-14 "no XMP body" code path.
   */
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

    // Conformance namespaces (pdfaid, pdfuaid, …) in one rdf:Description
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

    // Dublin Core metadata (dc:title) — required by PDF/UA-1 Matterhorn §6-1.
    // Uses rdf:Alt with an x-default language tag per the XMP spec §8.2.2.4.
    if (metadata?.title) {
      parts.push('    <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">\n');
      parts.push('      <dc:title>\n');
      parts.push('        <rdf:Alt>\n');
      parts.push(`          <rdf:li xml:lang="x-default">${escapeXmlText(metadata.title)}</rdf:li>\n`);
      parts.push('        </rdf:Alt>\n');
      parts.push('      </dc:title>\n');
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
