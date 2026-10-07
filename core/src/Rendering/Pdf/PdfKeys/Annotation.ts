/** Entries describing annotations and their actions. */
export const Annotation = {
  /** Rectangle enclosing the annotation, in PDF coordinates. */
  Rectangle: '/Rect',

  /** Annotation flags controlling printing, visibility and other viewer behavior. */
  Flags: '/F',

  /** Human-readable annotation text, including the accessible description of a link. */
  Contents: '/Contents',

  /** Parent-tree key linking this annotation to its structure element. */
  StructureParent: '/StructParent',

  /** Action executed when the annotation is activated. */
  Action: '/A',
} as const;
