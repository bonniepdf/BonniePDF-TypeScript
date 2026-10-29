import * as PdfKeys from '../Pdf/PdfKeys';
import { IPdfWriter } from './IPdfWriter';
import { PdfSyntax } from '../Pdf/PdfSyntax';
import { Md5Hash } from '../../Security/Encryption/Md5Hash';
import { FileAttachment } from '../../Attachments/FileAttachment';
import { AttachmentRelationship } from '../../Attachments/AttachmentRelationship';

/**
 * The result of writing a document's attachments: the object ID of the
 * `/EmbeddedFiles` name-tree dictionary (referenced from the catalog as
 * `/Names << /EmbeddedFiles N 0 R >>`) and the filespec object IDs for the
 * catalog's `/AF` associated-files array. `namesEmbeddedFilesId` is 0 when
 * there is nothing to write.
 */
export interface AttachmentWriteResult {
  namesEmbeddedFilesId: number;
  associatedFileIds: number[];
}

/**
 * Writes embedded-file objects for document attachments: one `/EmbeddedFile`
 * stream and one `/Filespec` per attachment, plus the shared `/EmbeddedFiles`
 * name tree the catalog references from `/Names`. The filespec object IDs are
 * returned so the caller can list them in the catalog's `/AF` array
 * (PDF/A-3 section 6.8).
 *
 * Attachment bytes are plain data, so the sync `writeBinaryObject` covers both
 * the sync and async serialize paths (the async path delegates to the same
 * inner writer).
 */
export class AttachmentWriter {
  constructor(private writer: IPdfWriter) {}

  public writeAttachments(attachments: readonly FileAttachment[]): AttachmentWriteResult {
    const ordered = AttachmentWriter.orderAndValidate(attachments);
    if (ordered.length === 0) {
      return { namesEmbeddedFilesId: 0, associatedFileIds: [] };
    }

    const associatedFileIds: number[] = [];
    const nameEntries: Array<{ name: string; filespecId: number }> = [];

    for (const a of ordered) {
      const streamId = this.writer.getNewId();
      this.writer.writeBinaryObject(streamId, AttachmentWriter.buildEmbeddedFileDict(a), a.content);

      const filespecId = this.writer.getNewId();
      this.writer.writeObject(filespecId, AttachmentWriter.buildFilespecDict(a, streamId));

      associatedFileIds.push(filespecId);
      nameEntries.push({ name: a.fileName, filespecId });
    }

    const namesEmbeddedFilesId = this.writer.getNewId();
    this.writer.writeObject(namesEmbeddedFilesId, AttachmentWriter.buildNameTreeDict(nameEntries));

    return { namesEmbeddedFilesId, associatedFileIds };
  }

  /**
   * Drops attachments with no name or empty content, then orders the
   * survivors by file name. The name tree's `/Names` array must be sorted by
   * key (PDF §7.9.6), and a stable code-unit order also keeps output
   * deterministic against the .NET peer (which sorts ordinal).
   */
  private static orderAndValidate(attachments: readonly FileAttachment[]): FileAttachment[] {
    if (!attachments || attachments.length === 0) return [];
    return attachments
      .filter(a => a != null && !!a.fileName && a.content != null && a.content.length > 0)
      .slice()
      .sort((x, y) => (x.fileName < y.fileName ? -1 : x.fileName > y.fileName ? 1 : 0));
  }

  private static buildEmbeddedFileDict(a: FileAttachment): Map<string, string> {
    let params = `<< /Size ${a.content.length}`;
    if (a.modificationDate) params += ` /ModDate (${PdfSyntax.formatDate(a.modificationDate)})`;
    if (a.creationDate) params += ` /CreationDate (${PdfSyntax.formatDate(a.creationDate)})`;
    params += ` /CheckSum <${AttachmentWriter.md5Hex(a.content)}> >>`;

    const dict = new Map<string, string>([
      [PdfKeys.Common.Type, '/EmbeddedFile'],
      [PdfKeys.EmbeddedFile.Parameters, params],
    ]);
    if (a.mediaType) dict.set(PdfKeys.Common.Subtype, '/' + AttachmentWriter.encodeName(a.mediaType));
    return dict;
  }

  private static buildFilespecDict(a: FileAttachment, streamId: number): Map<string, string> {
    const relationship = a.relationship ?? AttachmentRelationship.Unspecified;
    const dict = new Map<string, string>([
      [PdfKeys.Common.Type, '/Filespec'],
      [PdfKeys.FileSpecification.FileName, PdfSyntax.encodeMetadataString(a.fileName)],
      [PdfKeys.FileSpecification.UnicodeFileName, PdfSyntax.encodeMetadataString(a.fileName)],
      [PdfKeys.FileSpecification.EmbeddedFiles, `<< /F ${streamId} 0 R /UF ${streamId} 0 R >>`],
      [PdfKeys.FileSpecification.AssociatedFileRelationship, '/' + relationship],
    ]);
    if (a.description) dict.set(PdfKeys.FileSpecification.Description, PdfSyntax.encodeMetadataString(a.description));
    return dict;
  }

  private static buildNameTreeDict(entries: Array<{ name: string; filespecId: number }>): Map<string, string> {
    let names = '[ ';
    for (const { name, filespecId } of entries) {
      names += `${PdfSyntax.encodeMetadataString(name)} ${filespecId} 0 R `;
    }
    names += ']';
    return new Map<string, string>([[PdfKeys.NameTree.Names, names]]);
  }

  private static md5Hex(data: Uint8Array): string {
    const hash = Md5Hash.compute(data);
    let out = '';
    for (const b of hash) out += b.toString(16).padStart(2, '0').toUpperCase();
    return out;
  }

  /**
   * Encodes an arbitrary string as a PDF name body, escaping any character
   * outside the regular name set as `#XX` over its UTF-8 bytes (PDF §7.3.5).
   * E.g. `"text/xml"` becomes `text#2Fxml`.
   */
  private static encodeName(value: string): string {
    const bytes = new TextEncoder().encode(value);
    let out = '';
    for (const b of bytes) {
      const regular =
        (b >= 0x61 && b <= 0x7a) || // a-z
        (b >= 0x41 && b <= 0x5a) || // A-Z
        (b >= 0x30 && b <= 0x39) || // 0-9
        b === 0x2d || // -
        b === 0x5f || // _
        b === 0x2e; // .
      out += regular ? String.fromCharCode(b) : '#' + b.toString(16).padStart(2, '0').toUpperCase();
    }
    return out;
  }
}
