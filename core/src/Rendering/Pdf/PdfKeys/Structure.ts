/** Entries describing logical structure elements and their parent tree. */
export const Structure = {
  /** Structure type identifying the element's semantic role. */
  Role: '/S',

  /** Reference to the parent structure element or structure-tree root. */
  Parent: '/P',

  /** Child structure elements, marked-content identifiers or content-object references. */
  Kids: '/K',

  /** Reference to the page containing the structure element's content. */
  Page: '/Pg',

  /** Alternative description of the structure element and its content. */
  AlternativeText: '/Alt',

  /** Replacement text used when extracting or presenting the element's content. */
  ActualText: '/ActualText',

  /** Natural language of this structure element's content. */
  Language: '/Lang',

  /** Human-readable title of the structure element. */
  Title: '/T',

  /** Attribute dictionary or array describing this structure element. */
  Attributes: '/A',

  /** Number tree mapping content and annotation keys to their parent structure elements. */
  ParentTree: '/ParentTree',

  /** Next unused integer key available for the structure parent tree. */
  ParentTreeNextKey: '/ParentTreeNextKey',
} as const;
