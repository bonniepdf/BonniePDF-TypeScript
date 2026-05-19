import { IElement } from '../Elements/IElement';
import { Container } from '../Elements/Layout/Container';

/**
 * Fluent extension methods for sizing elements
 */
export class SizeExtensions {
  /**
   * Sets a fixed width for the element
   */
  static width(e: IElement, value: number): IElement {
    const c = SizeExtensions.asContainer(e);
    c.width = value;
    return c;
  }

  /**
   * Sets a fixed height for the element
   */
  static height(e: IElement, value: number): IElement {
    const c = SizeExtensions.asContainer(e);
    c.height = value;
    return c;
  }

  /**
   * Sets a fixed size (width and height) for the element
   */
  static size(e: IElement, width: number, height: number): IElement {
    const c = SizeExtensions.asContainer(e);
    c.width = width;
    c.height = height;
    return c;
  }

  /**
   * Returns the element as a Container, wrapping it if necessary
   */
  private static asContainer(e: IElement): Container {
    const c = new Container();
    c.child = e;
    return e instanceof Container ? e : c;
  }
}

/**
 * Shortcut functions for SizeExtensions
 */
export function width(e: IElement, value: number): IElement {
  return SizeExtensions.width(e, value);
}

export function height(e: IElement, value: number): IElement {
  return SizeExtensions.height(e, value);
}

export function size(e: IElement, width: number, height: number): IElement {
  return SizeExtensions.size(e, width, height);
}
