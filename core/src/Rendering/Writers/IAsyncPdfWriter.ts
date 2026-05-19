import { CatalogOptions } from './CatalogOptions';
import { DocumentSettings } from '../../Configuration/DocumentSettings';
import { Hyperlink } from '../../Core/Hyperlink';
import { PdfEncryptor } from '../../Security/Encryption/pdfEncryptor';

/**
 * Interface for async PDF writers
 */
export interface IAsyncPdfWriter {
  /**
   * Gets or sets the encryptor for this writer. When set, streams are encrypted.
   */
  encryptor: PdfEncryptor | undefined;

  /**
   * Gets a new unique object ID for the PDF
   */
  getNewId(): number;

  /**
   * Writes a PDF object with the specified ID and dictionary
   */
  writeObjectAsync(
    id: number,
    dict: Map<string, string>,
    streamContent?: string,
    cancellationToken?: AbortSignal
  ): Promise<void>;

  /**
   * Compresses and writes a PDF object
   */
  writeCompressedObjectAsync(
    id: number,
    dict: Map<string, string>,
    content: string,
    cancellationToken?: AbortSignal
  ): Promise<void>;

  /**
   * Writes a PDF object with binary stream content
   */
  writeBinaryObjectAsync(
    id: number,
    dict: Map<string, string>,
    streamContent: Uint8Array,
    length: number,
    cancellationToken?: AbortSignal
  ): Promise<void>;

  /**
   * Compresses binary data using FlateDecode and writes it as a PDF stream object
   */
  writeCompressedBinaryObjectAsync(
    id: number,
    dict: Map<string, string>,
    streamContent: Uint8Array,
    length: number,
    cancellationToken?: AbortSignal
  ): Promise<void>;

  /**
   * Writes a link annotation object for a hyperlink
   */
  writeLinkAnnotationAsync(
    id: number,
    hyperlink: Hyperlink,
    pageIds?: number[],
    cancellationToken?: AbortSignal
  ): Promise<number>;

  /**
   * Writes viewer preferences to the document catalog asynchronously.
   */
  writeViewerPreferencesAsync(id: number, settings: DocumentSettings, cancellationToken?: AbortSignal): Promise<number>;

  /**
   * Writes a PDF catalog object with catalog options
   */
  writeCatalogAsync(
    id: number,
    pagesId: number,
    firstPageId: number,
    settings: DocumentSettings,
    options: CatalogOptions,
    cancellationToken?: AbortSignal
  ): Promise<void>;

  /**
   * Writes an uncompressed binary stream object, bypassing encryption.
   * Used for XMP metadata which must not be encrypted.
   */
  writeUnencryptedBinaryObjectAsync(
    id: number,
    dict: Map<string, string>,
    streamContent: Uint8Array,
    cancellationToken?: AbortSignal
  ): Promise<void>;

  /**
   * Finalizes the PDF by writing the xref table and trailer
   */
  closeAsync(rootId: number, infoId?: number, cancellationToken?: AbortSignal): Promise<void>;

  /**
   * Writes the encryption dictionary object
   */
  writeEncryptDictionaryAsync(id: number, cancellationToken?: AbortSignal): Promise<number>;
}
