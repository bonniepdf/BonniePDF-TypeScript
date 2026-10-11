/** Controls how registered emoji fonts are painted. */
export enum EmojiRendering {
  /** Use monochrome font outlines (the default). */
  Outline = 'outline',
  /** Prefer COLRv0 colour layers or CBDT images, with outline fallback. */
  Colour = 'colour',
}
