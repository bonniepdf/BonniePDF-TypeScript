/** Inline progression and paragraph base direction. */
export enum ContentDirection {
  LeftToRight = 'leftToRight',
  RightToLeft = 'rightToLeft',
}

/** Accepted paragraph and layout directions. */
export type ContentDirectionInput = ContentDirection | 'leftToRight' | 'rightToLeft';

/** @internal */
export function toContentDirection(value: ContentDirectionInput): ContentDirection {
  if (value !== 'leftToRight' && value !== 'rightToLeft') throw new RangeError('Invalid content direction');
  return value as ContentDirection;
}
