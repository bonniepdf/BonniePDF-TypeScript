/** Entries in the document information dictionary. */
export const Information = {
  /** Title of the document recorded in its information dictionary. */
  Title: '/Title',

  /** Author of the document recorded in its information dictionary. */
  Author: '/Author',

  /** Subject of the document recorded in its information dictionary. */
  Subject: '/Subject',

  /** Keywords describing the document's content. */
  Keywords: '/Keywords',

  /** Application that created the original document before PDF conversion. */
  Creator: '/Creator',

  /** Application or library that produced the PDF file. */
  Producer: '/Producer',

  /** Date and time when the document was created. */
  CreationDate: '/CreationDate',

  /** Date and time when the document was last modified. */
  ModifiedDate: '/ModDate',

  /** Whether trapping has been applied to the document's printed output. */
  Trapped: '/Trapped',
} as const;
