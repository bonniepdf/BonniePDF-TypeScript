import { DocumentSettings } from '../../Configuration/DocumentSettings';
import { Hyperlink } from '../../Core/Hyperlink';


  /**
   * Options for writing the PDF catalog dictionary.
   * Groups optional object IDs that may be referenced from the catalog.
   */
  export class CatalogOptions {
    /**
     * The viewer preferences object ID (0 if none).
     */
    viewerPrefsId: number = 0;

    /**
     * The outlines (bookmarks) root object ID (0 if none).
     */
    outlinesId: number = 0;

    /**
     * The XMP metadata stream object ID (0 if none).
     */
    xmpMetadataId: number = 0;

    /**
     * Output intent object IDs for PDF/A compliance (null or empty if none).
     */
    outputIntentIds: number[] | undefined;

    /**
     * Whether PDF/A mode is enabled (adds /MarkInfo to catalog).
     */
    pdfAEnabled: boolean = false;

    /**
     * The named destinations dictionary object ID (0 if none).
     */
    destsId: number = 0;
  }
