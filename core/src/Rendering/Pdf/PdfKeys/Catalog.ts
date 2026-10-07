/** Entries in the document catalog. */
export const Catalog = {
  /** Reference to the root of the document's page tree. */
  Pages: '/Pages',

  /** Destination or action applied when the document is opened. */
  OpenAction: '/OpenAction',

  /** Viewer panel or display mode requested when the document is opened. */
  PageMode: '/PageMode',

  /** Reference to the dictionary containing viewer presentation preferences. */
  ViewerPreferences: '/ViewerPreferences',

  /** Reference to the root of the document's bookmark outline tree. */
  Outlines: '/Outlines',

  /** Reference to the document-level metadata stream, typically XMP. */
  Metadata: '/Metadata',

  /** Array of output-intent dictionaries describing intended color reproduction. */
  OutputIntents: '/OutputIntents',

  /** Dictionary recording whether the document contains logical structure information. */
  MarkInfo: '/MarkInfo',

  /** Reference to the root of the document's logical structure tree. */
  StructureTreeRoot: '/StructTreeRoot',

  /** Default natural language of the document's text. */
  Language: '/Lang',

  /** Reference to the dictionary of named destinations. */
  Destinations: '/Dests',

  /** Reference to the number tree defining displayed page labels. */
  PageLabels: '/PageLabels',

  /** Dictionary containing document-level name trees, including embedded files. */
  Names: '/Names',

  /** Array of file-specification references associated with the document. */
  AssociatedFiles: '/AF',
} as const;
