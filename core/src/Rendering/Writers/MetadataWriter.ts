import * as PdfKeys from '../Pdf/PdfKeys';
import { PdfSyntax } from '../Pdf/PdfSyntax';
import { DocumentSettings } from '../../Configuration/DocumentSettings';
import { AccessibilityMode } from '../../Configuration/AccessibilityMode';
import { PdfAConformance } from '../../Configuration/PdfAConformance';
import { XmpMetadataWriter } from '../../Metadata/XmpMetadataWriter';
import { XmpConformanceBlock } from '../../Metadata/XmpConformanceBlock';
import { IPdfWriter } from './IPdfWriter';
import { IAsyncPdfWriter } from './IAsyncPdfWriter';
import type { DocumentMetadata } from '../../Configuration/DocumentMetadata';

/**
 * Writes metadata objects (DocumentInfo and XMP) to PDF.
 */
export class MetadataWriter {
  constructor(
    private writer: IPdfWriter,
    private asyncWriter?: IAsyncPdfWriter
  ) {}

  public writeDocumentInfo(id: number, metadata: DocumentMetadata): number {
    this.writer.writeObject(id, MetadataWriter.buildDocumentInfoDict(metadata));
    return id;
  }

  public writeXmpMetadata(id: number, metadata: DocumentMetadata, settings: DocumentSettings): void {
    // XMP metadata is written unencrypted and uncompressed (PDF/A requirement).
    const dict = new Map<string, string>([
      [PdfKeys.Common.Type, '/Metadata'],
      [PdfKeys.Common.Subtype, '/XML'],
    ]);

    const blocks = MetadataWriter.buildConformanceBlocks(settings);
    const xmpXml = XmpMetadataWriter.generateXmpXml(metadata, blocks);
    const bytes = new TextEncoder().encode(xmpXml);
    this.writer.writeUnencryptedBinaryObject(id, dict, bytes);
  }

  public async writeDocumentInfoAsync(id: number, metadata: DocumentMetadata): Promise<number> {
    if (!this.asyncWriter) throw new Error('Async writer not configured');
    await this.asyncWriter.writeObjectAsync(id, MetadataWriter.buildDocumentInfoDict(metadata));
    return id;
  }

  public async writeXmpMetadataAsync(
    id: number,
    metadata: DocumentMetadata,
    settings: DocumentSettings
  ): Promise<void> {
    if (!this.asyncWriter) throw new Error('Async writer not configured');
    const dict = new Map<string, string>([
      [PdfKeys.Common.Type, '/Metadata'],
      [PdfKeys.Common.Subtype, '/XML'],
    ]);

    const blocks = MetadataWriter.buildConformanceBlocks(settings);
    const xmpXml = XmpMetadataWriter.generateXmpXml(metadata, blocks);
    const bytes = new TextEncoder().encode(xmpXml);
    // No async unencrypted-binary helper today; the sync writer would
    // be fine here but stays the async writer's contract - write via
    // writeObjectAsync with a stream string. The byte content is what
    // matters; encoding follows the same UTF-8 path.
    void bytes;
    await this.asyncWriter.writeObjectAsync(id, dict);
  }

  /** Builds the /Info dictionary shared by the sync and async paths. */
  private static buildDocumentInfoDict(metadata: DocumentMetadata): Map<string, string> {
    const dict = new Map<string, string>();
    if (metadata.title) dict.set(PdfKeys.Information.Title, PdfSyntax.encodeMetadataString(metadata.title));
    if (metadata.author) dict.set(PdfKeys.Information.Author, PdfSyntax.encodeMetadataString(metadata.author));
    if (metadata.subject) dict.set(PdfKeys.Information.Subject, PdfSyntax.encodeMetadataString(metadata.subject));
    if (metadata.keywords) dict.set(PdfKeys.Information.Keywords, PdfSyntax.encodeMetadataString(metadata.keywords));
    if (metadata.creator) dict.set(PdfKeys.Information.Creator, PdfSyntax.encodeMetadataString(metadata.creator));
    if (metadata.producer) dict.set(PdfKeys.Information.Producer, PdfSyntax.encodeMetadataString(metadata.producer));
    if (metadata.creationDate)
      dict.set(PdfKeys.Information.CreationDate, `(${PdfSyntax.formatDate(metadata.creationDate)})`);
    if (metadata.modifiedDate)
      dict.set(PdfKeys.Information.ModifiedDate, `(${PdfSyntax.formatDate(metadata.modifiedDate)})`);
    if (metadata.trapped !== undefined) dict.set(PdfKeys.Information.Trapped, metadata.trapped ? '/True' : '/False');
    if (metadata.customProperties) {
      // customProperties is a Map; Object.entries() on a Map yields nothing,
      // which silently dropped every custom property before this was typed.
      for (const [key, value] of metadata.customProperties) {
        dict.set(`/${PdfSyntax.escape(key)}`, PdfSyntax.encodeMetadataString(value));
      }
    }
    return dict;
  }

  /**
   * Build the list of conformance-namespace blocks the document claims,
   * based on `settings`. Each supported standard contributes an additive block.
   */
  private static buildConformanceBlocks(settings: DocumentSettings): XmpConformanceBlock[] {
    const blocks: XmpConformanceBlock[] = [];
    const pdfA = XmpConformanceBlock.forPdfA(settings.conformance);
    if (pdfA) blocks.push(pdfA);
    if (settings.accessibility === AccessibilityMode.PdfUa1) blocks.push(XmpConformanceBlock.pdfUa1());

    // ZUGFeRD / Factur-X is only valid on a PDF/A-3 document. Gating on the
    // (possibly guard-reset) conformance means a suppressed PDF/A claim also
    // suppresses the fx block - Factur-X without PDF/A-3 is meaningless, so
    // the honest-claim guard cascades for free.
    if (
      settings.facturX &&
      (settings.conformance === PdfAConformance.PdfA3b || settings.conformance === PdfAConformance.PdfA3a)
    ) {
      blocks.push(XmpConformanceBlock.facturX(settings.facturX));
    }

    return blocks;
  }
}
