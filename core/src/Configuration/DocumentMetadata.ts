/**
 * Contains metadata information about a PDF document
 */
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
  constructor(title?: string, author?: string) {
    this.title = title;
    this.author = author;
    this.creator = 'BonniePDF';
    this.producer = 'BonniePDF';
    this.creationDate = new Date();
    this.modifiedDate = new Date();
    this.customProperties = new Map();
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
