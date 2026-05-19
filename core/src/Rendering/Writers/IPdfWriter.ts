import { CatalogOptions } from './CatalogOptions';
import { DocumentSettings } from '../../Configuration/DocumentSettings';
import { Hyperlink } from '../../Core/Hyperlink';
import { PdfEncryptor } from '../../Security/Encryption/pdfEncryptor';

/**
 * Interface for PDF writers, allowing both sync and async implementations
 */
export interface IPdfWriter {
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
  writeObject(id: number, dict: Map<string, string>, streamContent?: string): void;

  /**
   * Compresses and writes a PDF object
   */
  writeCompressedObject(id: number, dict: Map<string, string>, content: string): void;

  /**
   * Writes a PDF object with binary stream content
   */
  writeBinaryObject(id: number, dict: Map<string, string>, streamContent: Uint8Array): void;

  /**
   * Compresses binary data using FlateDecode and writes it as a PDF stream object
   */
  writeCompressedBinaryObject(id: number, dict: Map<string, string>, streamContent: Uint8Array): void;

  /**
   * Writes a link annotation object for a hyperlink
   */
  writeLinkAnnotation(id: number, hyperlink: Hyperlink, pageIds?: number[]): number;

  /**
   * Writes viewer preferences to the document catalog.
   */
  writeViewerPreferences(id: number, settings: DocumentSettings): number;

  /**
   * Writes a PDF catalog object with catalog options
   */
  writeCatalog(
    id: number,
    pagesId: number,
    firstPageId: number,
    settings: DocumentSettings,
    options: CatalogOptions
  ): void;

  /**
   * Writes an uncompressed binary stream object, bypassing encryption.
   * Used for XMP metadata which must not be encrypted.
   */
  writeUnencryptedBinaryObject(id: number, dict: Map<string, string>, streamContent: Uint8Array): void;

  /**
   * Finalizes the PDF by writing the xref table and trailer
   */
  close(rootId: number, infoId?: number): void;

  /**
   * Writes the encryption dictionary object
   */
  writeEncryptDictionary(id: number): number;
}
