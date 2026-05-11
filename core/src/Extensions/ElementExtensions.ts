import { IElement } from '../Elements/IElement';
import { Container } from '../Elements/Layout/Container';



  /**
   * Fluent extension methods for building PDF elements with a clean API
   */
  export class ElementExtensions {
    /**
     * Returns the element as a Container, wrapping it if necessary
     */
    static asContainer(e: IElement): Container {
      const c = new Container(); c.child = e; return e instanceof Container ? e : c;
    }
  }

  /**
   * Shortcut function for ElementExtensions
   */
  export function asContainer(e: IElement): Container {
    return ElementExtensions.asContainer(e);
  }
