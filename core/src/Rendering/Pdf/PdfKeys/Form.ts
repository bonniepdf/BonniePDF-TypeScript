/** Entries describing reusable form XObjects. */
export const Form = {
  /** Rectangle bounding the form XObject in its own coordinate system. */
  BoundingBox: '/BBox',

  /** Resource dictionary used by the form XObject's drawing instructions. */
  Resources: '/Resources',

  /** Form XObject format identifier; the supported value is 1. */
  FormType: '/FormType',

  /** Group dictionary describing the form's transparency-group behavior. */
  Group: '/Group',
} as const;
