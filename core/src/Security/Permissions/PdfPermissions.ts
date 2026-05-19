/**
 * Flags enumeration for PDF document permissions.
 * These control what actions users can perform on the encrypted document.
 */
export enum PdfPermissions {
  /**
   * No permissions granted.
   */
  None = 0,

  /**
   * Allow printing the document.
   */
  Print = 1 << 0,

  /**
   * Allow modifying the document contents.
   */
  Modify = 1 << 1,

  /**
   * Allow copying text and graphics from the document.
   */
  Copy = 1 << 2,

  /**
   * Allow adding or modifying annotations and filling form fields.
   */
  AnnotateAndFillForms = 1 << 3,

  /**
   * Allow filling in interactive form fields (including signature fields).
   */
  FillForms = 1 << 4,

  /**
   * Allow extracting text and graphics for accessibility purposes.
   */
  ExtractForAccessibility = 1 << 5,

  /**
   * Allow assembling the document (insert, rotate, delete pages, bookmarks).
   */
  Assemble = 1 << 6,

  /**
   * Allow printing in high quality (when Print is also set).
   */
  PrintHighQuality = 1 << 7,

  /**
   * All permissions granted.
   */
  All = Print |
    Modify |
    Copy |
    AnnotateAndFillForms |
    FillForms |
    ExtractForAccessibility |
    Assemble |
    PrintHighQuality,
}
