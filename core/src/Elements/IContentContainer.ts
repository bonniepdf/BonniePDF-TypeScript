import { IElement } from './IElement';

/**
 * Structural contract for an element that wraps a single child.
 *
 * Used by the layout engine to walk single-child wrappers generically (see
 * `elementRequiresTwoPassLayout`) without needing to know every concrete type.
 */
export interface IContentContainer {
  child?: IElement;
}
