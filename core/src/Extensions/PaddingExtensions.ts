import { IElement } from '../Elements/IElement';
import { Container } from '../Elements/Layout/Container';
import { Thickness } from '../Core/Thickness';



  /**
   * Fluent extension methods for padding
   */
  export class PaddingExtensions {
    /**
     * Adds uniform padding to all sides of the element
     */
    static padding(e: IElement, uniform: number): IElement {
      const c = PaddingExtensions.asContainer(e);
      c.padding = new Thickness(uniform);
      return c;
    }

    /**
     * Adds horizontal and vertical padding to the element
     */
    static paddingHV(e: IElement, horizontal: number, vertical: number): IElement {
      const c = PaddingExtensions.asContainer(e);
      c.padding = new Thickness(horizontal, vertical);
      return c;
    }

    /**
     * Adds individual padding values for each side of the element
     */
    static paddingFull(e: IElement, left: number, top: number, right: number, bottom: number): IElement {
      const c = PaddingExtensions.asContainer(e);
      c.padding = new Thickness(left, top, right, bottom);
      return c;
    }

    /**
     * Adds left padding to the element
     */
    static paddingLeft(e: IElement, value: number): IElement {
      const c = PaddingExtensions.asContainer(e);
      const p = c.padding!;
      c.padding = new Thickness(value, p.top, p.right, p.bottom);
      return c;
    }

    /**
     * Adds right padding to the element
     */
    static paddingRight(e: IElement, value: number): IElement {
      const c = PaddingExtensions.asContainer(e);
      const p = c.padding!;
      c.padding = new Thickness(p.left, p.top, value, p.bottom);
      return c;
    }

    /**
     * Adds top padding to the element
     */
    static paddingTop(e: IElement, value: number): IElement {
      const c = PaddingExtensions.asContainer(e);
      const p = c.padding!;
      c.padding = new Thickness(p.left, value, p.right, p.bottom);
      return c;
    }

    /**
     * Adds bottom padding to the element
     */
    static paddingBottom(e: IElement, value: number): IElement {
      const c = PaddingExtensions.asContainer(e);
      const p = c.padding!;
      c.padding = new Thickness(p.left, p.top, p.right, value);
      return c;
    }

    /**
     * Adds horizontal padding to the element
     */
    static paddingHorizontal(e: IElement, value: number): IElement {
      const c = PaddingExtensions.asContainer(e);
      const p = c.padding!;
      c.padding = new Thickness(value, p.top, value, p.bottom);
      return c;
    }

    /**
     * Adds vertical padding to the element
     */
    static paddingVertical(e: IElement, value: number): IElement {
      const c = PaddingExtensions.asContainer(e);
      const p = c.padding!;
      c.padding = new Thickness(p.left, value, p.right, value);
      return c;
    }

    /**
     * Returns the element as a Container, wrapping it if necessary
     */
    private static asContainer(e: IElement): Container {
      const c = new Container(); c.child = e; return e instanceof Container ? e : c;
    }
  }

  /**
   * Shortcut functions for PaddingExtensions
   */
  export function padding(e: IElement, uniform: number): IElement;
  export function padding(e: IElement, horizontal: number, vertical: number): IElement;
  export function padding(e: IElement, left: number, top: number, right: number, bottom: number): IElement;
  export function padding(
    e: IElement,
    arg1: number,
    arg2?: number,
    arg3?: number,
    arg4?: number
  ): IElement {
    if (arg2 === undefined) {
      return PaddingExtensions.padding(e, arg1);
    } else if (arg3 === undefined) {
      return PaddingExtensions.paddingHV(e, arg1, arg2);
    } else {
      return PaddingExtensions.paddingFull(e, arg1, arg2, arg3!, arg4!);
    }
  }

  export function paddingLeft(e: IElement, value: number): IElement {
    return PaddingExtensions.paddingLeft(e, value);
  }

  export function paddingRight(e: IElement, value: number): IElement {
    return PaddingExtensions.paddingRight(e, value);
  }

  export function paddingTop(e: IElement, value: number): IElement {
    return PaddingExtensions.paddingTop(e, value);
  }

  export function paddingBottom(e: IElement, value: number): IElement {
    return PaddingExtensions.paddingBottom(e, value);
  }

  export function paddingHorizontal(e: IElement, value: number): IElement {
    return PaddingExtensions.paddingHorizontal(e, value);
  }

  export function paddingVertical(e: IElement, value: number): IElement {
    return PaddingExtensions.paddingVertical(e, value);
  }
