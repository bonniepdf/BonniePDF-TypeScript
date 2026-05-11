import { VerticalStack } from '../Elements/Layout/VerticalStack';
import { IElement } from '../Elements/IElement';



  /**
   * Fluent extension methods for vertical stacks
   */
  export class VerticalStackExtensions {
    /**
     * Adds a child element to the vertical stack
     */
    static item(s: VerticalStack, element: IElement): VerticalStack {
      s.addChild(element);
      return s;
    }

    /**
     * Adds multiple child elements to the vertical stack
     */
    static items(s: VerticalStack, elements: IElement[]): VerticalStack {
      for (const element of elements) {
        s.addChild(element);
      }
      return s;
    }
  }

  /**
   * Shortcut functions for VerticalStackExtensions
   */
  export function vstackItem(s: VerticalStack, element: IElement): VerticalStack {
    return VerticalStackExtensions.item(s, element);
  }

  export function vstackItems(s: VerticalStack, elements: IElement[]): VerticalStack {
    return VerticalStackExtensions.items(s, elements);
  }
