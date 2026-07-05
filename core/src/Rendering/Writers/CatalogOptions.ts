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
}
