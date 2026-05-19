import { Color } from '../Core/Color';
import { IElement } from '../Elements/IElement';
import { Container } from '../Elements/Layout/Container';
import { Border } from '../Core/Border';
import { BorderColors } from '../Core/BorderColors';

/**
 * Fluent extension methods for borders
 */
export class BorderExtensions {
  /**
   * Adds a border to the element with the specified color and uniform width
   */
  static border(e: IElement, color: Color, width: number = 1): IElement {
    const c = BorderExtensions.asContainer(e);
    c.border = new Border(width);
    c.borderColors = new BorderColors(color);
    return c;
  }

  /**
   * Adds a left border to the element
   */
  static borderLeft(e: IElement, color: Color, width: number = 1): IElement {
    const c = BorderExtensions.asContainer(e);
    const b = c.border!;
    const bc = c.borderColors!;

    c.border = new Border(width, b.top, b.right, b.bottom);
    c.borderColors = new BorderColors(color, bc.top, bc.right, bc.bottom);
    return c;
  }

  /**
   * Adds a right border to the element
   */
  static borderRight(e: IElement, color: Color, width: number = 1): IElement {
    const c = BorderExtensions.asContainer(e);
    const b = c.border!;
    const bc = c.borderColors!;

    c.border = new Border(b.left, b.top, width, b.bottom);
    c.borderColors = new BorderColors(bc.left, bc.top, color, bc.bottom);
    return c;
  }

  /**
   * Adds a top border to the element
   */
  static borderTop(e: IElement, color: Color, width: number = 1): IElement {
    const c = BorderExtensions.asContainer(e);
    const b = c.border!;
    const bc = c.borderColors!;

    c.border = new Border(b.left, width, b.right, b.bottom);
    c.borderColors = new BorderColors(bc.left, color, bc.right, bc.bottom);
    return c;
  }

  /**
   * Adds a bottom border to the element
   */
  static borderBottom(e: IElement, color: Color, width: number = 1): IElement {
    const c = BorderExtensions.asContainer(e);
    const b = c.border!;
    const bc = c.borderColors!;

    c.border = new Border(b.left, b.top, b.right, width);
    c.borderColors = new BorderColors(bc.left, bc.top, bc.right, color);
    return c;
  }

  /**
   * Adds horizontal borders (left and right) to the element
   */
  static borderHorizontal(e: IElement, color: Color, width: number = 1): IElement {
    const c = BorderExtensions.asContainer(e);
    const b = c.border!;
    const bc = c.borderColors!;

    c.border = new Border(width, b.top, width, b.bottom);
    c.borderColors = new BorderColors(color, bc.top, color, bc.bottom);
    return c;
  }

  /**
   * Adds vertical borders (top and bottom) to the element
   */
  static borderVertical(e: IElement, color: Color, width: number = 1): IElement {
    const c = BorderExtensions.asContainer(e);
    const b = c.border!;
    const bc = c.borderColors!;

    c.border = new Border(b.left, width, b.right, width);
    c.borderColors = new BorderColors(bc.left, color, bc.right, color);
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
 * Shortcut functions for BorderExtensions
 */
export function border(e: IElement, color: Color, width?: number): IElement {
  return BorderExtensions.border(e, color, width);
}

export function borderLeft(e: IElement, color: Color, width?: number): IElement {
  return BorderExtensions.borderLeft(e, color, width);
}

export function borderRight(e: IElement, color: Color, width?: number): IElement {
  return BorderExtensions.borderRight(e, color, width);
}

export function borderTop(e: IElement, color: Color, width?: number): IElement {
  return BorderExtensions.borderTop(e, color, width);
}

export function borderBottom(e: IElement, color: Color, width?: number): IElement {
  return BorderExtensions.borderBottom(e, color, width);
}

export function borderHorizontal(e: IElement, color: Color, width?: number): IElement {
  return BorderExtensions.borderHorizontal(e, color, width);
}

export function borderVertical(e: IElement, color: Color, width?: number): IElement {
  return BorderExtensions.borderVertical(e, color, width);
}
