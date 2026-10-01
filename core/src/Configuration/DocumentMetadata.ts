import { applyOptions } from '../Core/applyOptions';
/**
 * Contains metadata information about a PDF document
 */
/** Settable properties of {@link DocumentMetadata}. */
export const DOCUMENT_METADATA_OPTION_KEYS = [
  'title',
  'author',
  'subject',
  'keywords',
  'creator',
  'producer',
  'creationDate',
  'modifiedDate',
  'trapped',
  'customProperties',
] as const;

/** Options for {@link DocumentMetadata}. */
export type DocumentMetadataOptions = Partial<
  Omit<Pick<DocumentMetadata, (typeof DOCUMENT_METADATA_OPTION_KEYS)[number]>, 'customProperties'>
> & {
  /**
   * Custom XMP properties. Accepts a `Map` or a plain record - the record form
   * is the ergonomic one in an options literal.
   */
  customProperties?: Map<string, string> | Record<string, string>;
};

/**
 * The dates a metadata object gave itself when it was built. A date the author assigned is a different
 * object, so this tells "the time it was built" from "a date somebody chose" without another property.
 */
const builtInDates = new WeakSet<Date>();

/**
 * True when `date` is one a {@link DocumentMetadata} gave itself on construction rather than one that was
 * assigned. Used by tools that copy a document and must not turn "now" into a chosen date.
 */
export function isBuiltInMetadataDate(date: Date | undefined): boolean {
  return date !== undefined && builtInDates.has(date);
}

/** Contains descriptive metadata written to the PDF information and XMP records. */
export class DocumentMetadata {
  /**
   * Creates a new instance of DocumentMetadata with default values
   */
  constructor();
  /**
   * Creates a new instance of DocumentMetadata with the specified title
   * @param title - The document title
   */
  constructor(title: string);
  /**
   * Creates a new instance of DocumentMetadata with the specified title and author
   * @param title - The document title
   * @param author - The author name
   */
  constructor(title: string, author: string);
  constructor(options: DocumentMetadataOptions);
  constructor(titleOrOptions?: string | DocumentMetadataOptions, author?: string) {
    const isPositional = typeof titleOrOptions === 'string' || titleOrOptions === undefined;
    this.title = isPositional ? (titleOrOptions as string | undefined) : undefined;
    this.author = isPositional ? author : undefined;
    this.creator = 'BonniePDF';
    this.producer = 'BonniePDF';
    this.creationDate = new Date();
    this.modifiedDate = new Date();
    builtInDates.add(this.creationDate);
    builtInDates.add(this.modifiedDate);
    this.customProperties = new Map();

    if (!isPositional) {
      const { customProperties, ...rest } = titleOrOptions as DocumentMetadataOptions;
      applyOptions(this, rest);
      if (customProperties !== undefined) {
        // A plain record is the ergonomic form in an options literal; normalise
        // it to the canonical Map the writer consumes.
        this.customProperties =
          customProperties instanceof Map ? customProperties : new Map(Object.entries(customProperties));
      }
    }
  }

  /**
   * The document title
   */
  public title?: string;
  /**
   * The name of the person who created the document
   */
  public author?: string;
  /**
   * The subject of the document
   */
  public subject?: string;
  /**
   * Keywords associated with the document. For PDF generation, these are stored as a
   * comma-separated string.
   */
  public keywords?: string;
  /**
   * The application that created the original content
   */
  public creator: string;
  /**
   * The application that converted the document to PDF
   */
  public producer: string;
  /**
   * The date and time the document was created
   */
  public creationDate?: Date;
  /**
   * The date and time the document was last modified
   */
  public modifiedDate?: Date;
  /**
   * Indicates whether document-level trapping has been applied for professional printing.
   * True means trapped, false means not trapped, undefined means not specified.
   */
  public trapped?: boolean;
  /**
   * A collection of custom metadata key-value pairs to embed in the document's
   * Information Dictionary alongside the standard entries.
   */
  public customProperties: Map<string, string>;

  /**
   * Sets the Keywords property from a collection of individual tags,
   * joining them as a comma-separated string.
   * @param keywords - Collection of keyword strings
   */
  setKeywords(keywords: string[]): void {
    this.keywords = keywords.join(', ');
  }
}
