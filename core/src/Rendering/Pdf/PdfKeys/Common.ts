/** Dictionary entries shared by multiple kinds of PDF objects. */
export const Common = {
  /** Identifies the kind of PDF object represented by the dictionary. */
  Type: '/Type',

  /** Identifies a more specific kind of object, such as an image or link. */
  Subtype: '/Subtype',
} as const;
