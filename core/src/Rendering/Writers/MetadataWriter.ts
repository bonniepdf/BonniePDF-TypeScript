import { IPdfWriter } from './IPdfWriter';
import { IAsyncPdfWriter } from './IAsyncPdfWriter';
import { DocumentMetadata } from '../../Configuration/DocumentMetadata';
import { XmpMetadataWriter } from '../../Metadata/XmpMetadataWriter';
import { PdfSyntax } from '../Pdf/PdfSyntax';


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
    async writeDocumentInfoAsync(id: number, metadata: DocumentMetadata, cancellationToken?: AbortSignal): Promise<number> {
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
     * Writes XMP metadata to the PDF document.
     * XMP (Extensible Metadata Platform) provides standardized metadata
     * that is required for PDF/A compliance and optional for PDF 1.7.
     * @param id The object ID for the XMP metadata dictionary.
     * @param metadata The document metadata.
     * @param pdfAEnabled Indicates whether PDF/A compliance is enabled.
     */
    writeXmpMetadata(id: number, metadata: DocumentMetadata, pdfAEnabled: boolean): void {
      if (!this.writer) throw new Error('Sync writer not available');
      const xmpXml = XmpMetadataWriter.generateXmpXml(metadata, pdfAEnabled);
      const xmpBytes = new TextEncoder().encode(xmpXml);

      const dict = new Map<string, string>();
      dict.set('/Type', '/Metadata');
      dict.set('/Subtype', '/XML');

      // XMP metadata must NOT be encrypted and must NOT be compressed
      this.writer.writeUnencryptedBinaryObject(id, dict, xmpBytes);
    }

    /**
     * Writes XMP metadata to the PDF document asynchronously.
     * XMP (Extensible Metadata Platform) provides standardized metadata
     * that is required for PDF/A compliance and optional for PDF 1.7.
     * @param id The object ID for the XMP metadata dictionary.
     * @param metadata The document metadata.
     * @param pdfAEnabled Indicates whether PDF/A compliance is enabled.
     * @param cancellationToken Cancellation token.
     */
    async writeXmpMetadataAsync(id: number, metadata: DocumentMetadata, pdfAEnabled: boolean, cancellationToken?: AbortSignal): Promise<void> {
      if (!this.asyncWriter) throw new Error('Async writer not available');
      const xmpXml = XmpMetadataWriter.generateXmpXml(metadata, pdfAEnabled);
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
