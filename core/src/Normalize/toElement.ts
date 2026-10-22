import type { IElement } from '../Elements/IElement';
import { TextBlock } from '../Elements/Text/TextBlock';

/** Normalise text shorthand before mutating a document or collection. @internal */
export function toElement(content: IElement | string | readonly string[]): IElement {
  if (content == null) throw new TypeError('Element cannot be null.');
  return typeof content === 'string' || Array.isArray(content)
    ? new TextBlock(content as string | readonly string[])
    : (content as IElement);
}
