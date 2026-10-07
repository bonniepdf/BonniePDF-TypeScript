/** Entries describing an individual page. */
export const Page = {
  /** Reference to the parent node in the page tree. */
  Parent: '/Parent',

  /** Rectangle defining the physical page boundaries, in default user-space coordinates. */
  MediaBox: '/MediaBox',

  /** Content stream or stream array containing the page's drawing instructions. */
  Contents: '/Contents',

  /** Resource dictionary used by the page's content streams. */
  Resources: '/Resources',

  /** Parent-tree key for the page's marked-content identifiers. */
  StructureParents: '/StructParents',

  /** Ordering rule used to navigate the page's annotations with the keyboard. */
  TabOrder: '/Tabs',

  /** Array of annotation references belonging to the page. */
  Annotations: '/Annots',
} as const;
