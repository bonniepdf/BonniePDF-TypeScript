/** Entries describing files associated with the document. */
export const FileSpecification = {
  /** Filename in the file-specification dictionary. */
  FileName: '/F',

  /** Unicode filename in the file-specification dictionary. */
  UnicodeFileName: '/UF',

  /** Dictionary mapping filename entries to embedded-file stream references. */
  EmbeddedFiles: '/EF',

  /** Relationship between the associated file and the PDF document. */
  AssociatedFileRelationship: '/AFRelationship',

  /** Human-readable description of the file. */
  Description: '/Desc',
} as const;
