/** Entries describing the bookmark outline tree. */
export const Outline = {
  /** Number of visible descendants; a negative value indicates a closed outline item. */
  Count: '/Count',

  /** Reference to the first child outline item. */
  First: '/First',

  /** Reference to the last child outline item. */
  Last: '/Last',

  /** Text displayed for the bookmark in the viewer's outline panel. */
  Title: '/Title',

  /** Reference to the parent outline item or outline root. */
  Parent: '/Parent',

  /** Destination displayed when the outline item is activated. */
  Destination: '/Dest',

  /** Reference to the previous sibling outline item. */
  Previous: '/Prev',

  /** Reference to the next sibling outline item. */
  Next: '/Next',
} as const;
