import { IPdfWriter } from './IPdfWriter';
import { IAsyncPdfWriter } from './IAsyncPdfWriter';
import { DocumentMetadata } from '../../Configuration/DocumentMetadata';
import { DocumentSettings } from '../../Configuration/DocumentSettings';
import { AccessibilityMode } from '../../Configuration/AccessibilityMode';
import { XmpMetadataWriter } from '../../Metadata/XmpMetadataWriter';
import { XmpConformanceBlock } from '../../Metadata/XmpConformanceBlock';
import { PdfSyntax } from '../Pdf/PdfSyntax';

function buildConformanceBlocks(settings: DocumentSettings): XmpConformanceBlock[] {
  const blocks: XmpConformanceBlock[] = [];
  const pdfA = XmpConformanceBlock.forPdfA(settings.conformance);
  if (pdfA) blocks.push(pdfA);
  if (settings.accessibility === AccessibilityMode.PdfUa1) blocks.push(XmpConformanceBlock.pdfUa1());
  return blocks;
}

/**
 * Writes metadata objects (DocumentInfo and XMP) to PDF.
 */
export class MetadataWriter {
  private readonly writer: IPdfWriter | undefined;
  private readonly asyncWriter: IAsyncPdfWriter | undefined;

  constructor(writer: IPdfWriter | IAsyncPdfWriter) {
    if ('writeObject' in writer) {
      this.writer = writer as IPdfWriter;
      this.asyncWriter = undefined;
    } else {
      this.asyncWriter = writer as IAsyncPdfWriter;
      this.writer = undefined;
    }
  }

  /**
   * Writes a document info dictionary with metadata
   */
  writeDocumentInfo(id: number, metadata: DocumentMetadata): number {
    if (!this.writer) throw new Error('Sync writer not available');
    const dict = new Map<string, string>();

    if (metadata.title !== '') {
      dict.set('/Title', PdfSyntax.encodeMetadataString(metadata.title));
    }

    if (metadata.author !== '') {
      dict.set('/Author', PdfSyntax.encodeMetadataString(metadata.author));
    }

    if (metadata.subject !== '') {
      dict.set('/Subject', PdfSyntax.encodeMetadataString(metadata.subject));
    }

    if (metadata.keywords !== '') {
      dict.set('/Keywords', PdfSyntax.encodeMetadataString(metadata.keywords));
    }

    if (metadata.creator !== '') {
      dict.set('/Creator', PdfSyntax.encodeMetadataString(metadata.creator));
    }

    if (metadata.producer !== '') {
      dict.set('/Producer', PdfSyntax.encodeMetadataString(metadata.producer));
    }

    if (metadata.creationDate) {
      dict.set('/CreationDate', `(${PdfSyntax.formatDate(metadata.creationDate)})`);
    }

    if (metadata.modifiedDate) {
      dict.set('/ModDate', `(${PdfSyntax.formatDate(metadata.modifiedDate)})`);
    }

    if (metadata.trapped !== undefined) {
      dict.set('/Trapped', metadata.trapped ? '/True' : '/False');
    }

    for (const [key, value] of Object.entries(metadata.customProperties)) {
      dict.set(`/${PdfSyntax.escape(key)}`, PdfSyntax.encodeMetadataString(value));
    }

    this.writer.writeObject(id, dict);
    return id;
  }

  /**
   * Writes a document info dictionary with metadata asynchronously
   */
  async writeDocumentInfoAsync(
    id: number,
    metadata: DocumentMetadata,
    cancellationToken?: AbortSignal
  ): Promise<number> {
    if (!this.asyncWriter) throw new Error('Async writer not available');
    const dict = new Map<string, string>();

    if (metadata.title !== '') {
      dict.set('/Title', PdfSyntax.encodeMetadataString(metadata.title));
    }

    if (metadata.author !== '') {
      dict.set('/Author', PdfSyntax.encodeMetadataString(metadata.author));
    }

    if (metadata.subject !== '') {
      dict.set('/Subject', PdfSyntax.encodeMetadataString(metadata.subject));
    }

    if (metadata.keywords !== '') {
      dict.set('/Keywords', PdfSyntax.encodeMetadataString(metadata.keywords));
    }

    if (metadata.creator !== '') {
      dict.set('/Creator', PdfSyntax.encodeMetadataString(metadata.creator));
    }

    if (metadata.producer !== '') {
      dict.set('/Producer', PdfSyntax.encodeMetadataString(metadata.producer));
    }

    if (metadata.creationDate) {
      dict.set('/CreationDate', `(${PdfSyntax.formatDate(metadata.creationDate)})`);
    }

    if (metadata.modifiedDate) {
      dict.set('/ModDate', `(${PdfSyntax.formatDate(metadata.modifiedDate)})`);
    }

    if (metadata.trapped !== undefined) {
      dict.set('/Trapped', metadata.trapped ? '/True' : '/False');
    }

    for (const [key, value] of Object.entries(metadata.customProperties)) {
      dict.set(`/${PdfSyntax.escape(key)}`, PdfSyntax.encodeMetadataString(value));
    }

    await this.asyncWriter.writeObjectAsync(id, dict, undefined, cancellationToken);
    return id;
  }

  /**
   * Writes XMP metadata to the PDF document, including any conformance
   * claims derived from `settings` (PDF/A, PDF/UA, …).
   */
  writeXmpMetadata(id: number, metadata: DocumentMetadata, settings: DocumentSettings): void {
    if (!this.writer) throw new Error('Sync writer not available');
    const blocks = buildConformanceBlocks(settings);
    const xmpXml = XmpMetadataWriter.generateXmpXml(metadata, blocks);
    const xmpBytes = new TextEncoder().encode(xmpXml);

    const dict = new Map<string, string>();
    dict.set('/Type', '/Metadata');
    dict.set('/Subtype', '/XML');

    // XMP metadata must NOT be encrypted and must NOT be compressed
    this.writer.writeUnencryptedBinaryObject(id, dict, xmpBytes);
  }

  /**
   * Writes XMP metadata to the PDF document asynchronously.
   */
  async writeXmpMetadataAsync(
    id: number,
    metadata: DocumentMetadata,
    settings: DocumentSettings,
    cancellationToken?: AbortSignal
  ): Promise<void> {
    if (!this.asyncWriter) throw new Error('Async writer not available');
    const blocks = buildConformanceBlocks(settings);
    const xmpXml = XmpMetadataWriter.generateXmpXml(metadata, blocks);
    const xmpBytes = new TextEncoder().encode(xmpXml);

    const dict = new Map<string, string>();
    dict.set('/Type', '/Metadata');
    dict.set('/Subtype', '/XML');

    await this.asyncWriter.writeUnencryptedBinaryObjectAsync(id, dict, xmpBytes, cancellationToken);
  }
}

// Constructor overloads
export namespace MetadataWriter {
  export function create(writer: IPdfWriter): MetadataWriter {
    return new MetadataWriter(writer as any);
  }

  export function createAsync(asyncWriter: IAsyncPdfWriter): MetadataWriter {
    return new MetadataWriter(asyncWriter as any);
  }
}
