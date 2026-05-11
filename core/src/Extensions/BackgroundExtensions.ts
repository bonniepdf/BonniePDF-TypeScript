import { Color } from '../Core/Color';
import { IElement } from '../Elements/IElement';
import { Container } from '../Elements/Layout/Container';
import { BorderedElementBase } from '../Elements/Layout/BorderedElementBase';



  /**
   * Fluent extension methods for background and rounding
   */
  export class BackgroundExtensions {
    /**
     * Sets the background color of the element
     */
    static background(e: IElement, c: Color): IElement {
      const k = BackgroundExtensions.asContainer(e);
      k.backgroundColor = c;
      return k;
    }

    /**
     * Sets the corner radius for rounded corners, wrapping in a Container if needed
     */
    static rounded(e: IElement, radius: number): IElement {
      const c = BackgroundExtensions.asContainer(e);
      c.cornerRadius = radius;
      return c;
    }

    /**
     * Sets the corner radius for rounded corners on a bordered element
     */
    static roundedBase<T extends BorderedElementBase>(e: T, radius: number): T {
      e.cornerRadius = radius;
      return e;
    }

    /**
     * Returns the element as a Container, wrapping it if necessary
     */
    private static asContainer(e: IElement): Container {
      const c = new Container(); c.child = e; return e instanceof Container ? e : c;
    }
  }

  /**
   * Shortcut functions for BackgroundExtensions
   */
  export function background(e: IElement, c: Color): IElement {
    return BackgroundExtensions.background(e, c);
  }

  export function rounded(e: IElement, radius: number): IElement {
    return BackgroundExtensions.rounded(e, radius);
  }
