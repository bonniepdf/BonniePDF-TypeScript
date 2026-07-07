/**
 * Options for writing the PDF catalog dictionary.
 * Groups optional object IDs that may be referenced from the catalog.
 */
export class CatalogOptions {
  public viewerPrefsId?: number;
  public xmpMetadataId?: number;
  public outlinesId?: number;
  public destsId?: number;
  public pdfAEnabled = false;
  public outputIntentIds: number[] = [];

  /**
   * The structure tree root object ID (0 if none). Set when the document
   * opts into PDF/UA tagging.
   */
  public structTreeRootId = 0;

  /**
   * Whether the document carries a structure tree and should claim to be
   * tagged in the catalog. When true the catalog emits
   * `/MarkInfo <</Marked true>>` regardless of {@link pdfAEnabled}
   * (the two flags are orthogonal).
   */
  public tagged = false;

  /**
   * BCP-47 language tag for the document (e.g. `"en-GB"`). When non-empty,
   * emitted as `/Lang` on the catalog. Required by PDF/UA-1.
   */
  public language?: string;

  /**
   * The /PageLabels number-tree object ID (0 or undefined if none).
   * When set, the catalog emits `/PageLabels N 0 R`.
   */
  public pageLabelsId?: number;

  /**
   * The object ID of the `/EmbeddedFiles` name-tree dictionary for document
   * attachments (0 or undefined if none). When set, the catalog emits
   * `/Names << /EmbeddedFiles N 0 R >>`.
   */
  public namesEmbeddedFilesId?: number;

  /**
   * The filespec object IDs of the document's associated files. When
   * non-empty, the catalog emits an `/AF` array - required for PDF/A-3 so
   * conforming readers treat the attachments as associated files.
   */
  public associatedFileIds: number[] = [];
}
