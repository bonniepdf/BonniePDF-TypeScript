import { IMargin } from '../Elements/IMargin';
import { Thickness } from '../Core/Thickness';

/**
 * Fluent extension methods for margins
 */
export class MarginExtensions {
  /**
   * Adds uniform margin to all sides of the element
   */
  static margin<T extends IMargin>(element: T, uniform: number): T {
    element.margin = new Thickness(uniform);
    return element;
  }

  /**
   * Adds horizontal and vertical margin to the element
   */
  static marginHV<T extends IMargin>(element: T, horizontal: number, vertical: number): T {
    element.margin = new Thickness(horizontal, vertical);
    return element;
  }

  /**
   * Adds individual margin values for each side of the element
   */
  static marginFull<T extends IMargin>(element: T, left: number, top: number, right: number, bottom: number): T {
    element.margin = new Thickness(left, top, right, bottom);
    return element;
  }

  /**
   * Adds left margin to the element
   */
  static marginLeft<T extends IMargin>(element: T, value: number): T {
    const m = element.margin!;
    element.margin = new Thickness(value, m.top, m.right, m.bottom);
    return element;
  }

  /**
   * Adds right margin to the element
   */
  static marginRight<T extends IMargin>(element: T, value: number): T {
    const m = element.margin!;
    element.margin = new Thickness(m.left, m.top, value, m.bottom);
    return element;
  }

  /**
   * Adds top margin to the element
   */
  static marginTop<T extends IMargin>(element: T, value: number): T {
    const m = element.margin!;
    element.margin = new Thickness(m.left, value, m.right, m.bottom);
    return element;
  }

  /**
   * Adds bottom margin to the element
   */
  static marginBottom<T extends IMargin>(element: T, value: number): T {
    const m = element.margin!;
    element.margin = new Thickness(m.left, m.top, m.right, value);
    return element;
  }

  /**
   * Adds horizontal margin to the element
   */
  static marginHorizontal<T extends IMargin>(element: T, value: number): T {
    const m = element.margin!;
    element.margin = new Thickness(value, m.top, value, m.bottom);
    return element;
  }

  /**
   * Adds vertical margin to the element
   */
  static marginVertical<T extends IMargin>(element: T, value: number): T {
    const m = element.margin!;
    element.margin = new Thickness(m.left, value, m.right, value);
    return element;
  }
}

/**
 * Shortcut functions for MarginExtensions
 */
export function margin<T extends IMargin>(element: T, uniform: number): T;
export function margin<T extends IMargin>(element: T, horizontal: number, vertical: number): T;
export function margin<T extends IMargin>(element: T, left: number, top: number, right: number, bottom: number): T;
export function margin<T extends IMargin>(element: T, arg1: number, arg2?: number, arg3?: number, arg4?: number): T {
  if (arg2 === undefined) {
    return MarginExtensions.margin(element, arg1);
  } else if (arg3 === undefined) {
    return MarginExtensions.marginHV(element, arg1, arg2);
  } else {
    return MarginExtensions.marginFull(element, arg1, arg2, arg3!, arg4!);
  }
}

export function marginLeft<T extends IMargin>(element: T, value: number): T {
  return MarginExtensions.marginLeft(element, value);
}

export function marginRight<T extends IMargin>(element: T, value: number): T {
  return MarginExtensions.marginRight(element, value);
}

export function marginTop<T extends IMargin>(element: T, value: number): T {
  return MarginExtensions.marginTop(element, value);
}

export function marginBottom<T extends IMargin>(element: T, value: number): T {
  return MarginExtensions.marginBottom(element, value);
}

export function marginHorizontal<T extends IMargin>(element: T, value: number): T {
  return MarginExtensions.marginHorizontal(element, value);
}

export function marginVertical<T extends IMargin>(element: T, value: number): T {
  return MarginExtensions.marginVertical(element, value);
}
