import { Color } from '../../Core/Color';
import { ContainerBridgeExtensions } from './ContainerBridgeExtensions';
import { Thickness } from '../../Core/Thickness';
import { Border } from '../../Core/Border';
import { BorderColors } from '../../Core/BorderColors';
import { Container } from '../../Elements/Layout/Container';
import { IContentContainer } from '../IContentContainer';
import { HorizontalAlignment } from '../../Core/HorizontalAlignment';

/**
 * Fluent chaining extension methods for styling containers.
 * Each method creates a Container element and returns it as IContentContainer,
 * enabling continued chaining: .Padding(10).Border(1).Background(Color.Red)
 */
export class ContainerStyleExtensions {
  private static getOrCreateContainer(c: IContentContainer): Container {
    if (c instanceof Container && c.child == null) {
      return c;
    }

    const newContainer = new Container();
    ContainerBridgeExtensions.element(c, newContainer);
    return newContainer;
  }

  // --- Padding ---

  /**
   * Sets uniform padding on all sides.
   */
  static padding(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.padding = new Thickness(value);
    return container;
  }

  /**
   * Sets horizontal and vertical padding.
   */
  static paddingHV(c: IContentContainer, horizontal: number, vertical: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.padding = new Thickness(horizontal, vertical);
    return container;
  }

  /**
   * Sets padding for each side individually.
   */
  static paddingFull(
    c: IContentContainer,
    left: number,
    top: number,
    right: number,
    bottom: number
  ): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.padding = new Thickness(left, top, right, bottom);
    return container;
  }

  /**
   * Sets top padding.
   */
  static paddingTop(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.padding = new Thickness(0, value, 0, 0);
    return container;
  }

  /**
   * Sets bottom padding.
   */
  static paddingBottom(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.padding = new Thickness(0, 0, 0, value);
    return container;
  }

  /**
   * Sets left padding.
   */
  static paddingLeft(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.padding = new Thickness(value, 0, 0, 0);
    return container;
  }

  /**
   * Sets right padding.
   */
  static paddingRight(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.padding = new Thickness(0, 0, value, 0);
    return container;
  }

  /**
   * Sets horizontal padding (left and right).
   */
  static paddingHorizontal(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.padding = new Thickness(value, 0, value, 0);
    return container;
  }

  /**
   * Sets vertical padding (top and bottom).
   */
  static paddingVertical(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.padding = new Thickness(0, value, 0, value);
    return container;
  }

  // --- Background ---

  /**
   * Sets the background color.
   */
  static background(c: IContentContainer, color: Color): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.backgroundColor = color;
    return container;
  }

  // --- Border ---

  /**
   * Sets a uniform border on all sides.
   */
  static border(c: IContentContainer, width: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.border = new Border(width);
    container.borderColors = new BorderColors(Color.black);
    return container;
  }

  /**
   * Sets a uniform border with a specific color.
   */
  static borderWithColor(c: IContentContainer, width: number, color: Color): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.border = new Border(width);
    container.borderColors = new BorderColors(color);
    return container;
  }

  /**
   * Sets a bottom border.
   */
  static borderBottom(c: IContentContainer, width: number, color?: Color): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.border = Border.bottomOnly(width);
    container.borderColors = new BorderColors(color ?? Color.black);
    return container;
  }

  /**
   * Sets a top border.
   */
  static borderTop(c: IContentContainer, width: number, color?: Color): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.border = Border.topOnly(width);
    container.borderColors = new BorderColors(color ?? Color.black);
    return container;
  }

  /**
   * Sets a left border.
   */
  static borderLeft(c: IContentContainer, width: number, color?: Color): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.border = Border.leftOnly(width);
    container.borderColors = new BorderColors(color ?? Color.black);
    return container;
  }

  /**
   * Sets a right border.
   */
  static borderRight(c: IContentContainer, width: number, color?: Color): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.border = Border.rightOnly(width);
    container.borderColors = new BorderColors(color ?? Color.black);
    return container;
  }

  /**
   * Sets horizontal borders (left and right), matching the paddingHorizontal convention.
   */
  static borderHorizontal(c: IContentContainer, width: number, color?: Color): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.border = Border.verticalSides(width);
    container.borderColors = new BorderColors(color ?? Color.black);
    return container;
  }

  /**
   * Sets vertical borders (top and bottom), matching the paddingVertical convention.
   */
  static borderVertical(c: IContentContainer, width: number, color?: Color): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.border = Border.horizontalSides(width);
    container.borderColors = new BorderColors(color ?? Color.black);
    return container;
  }

  // --- Size Constraints ---

  /**
   * Sets a fixed width.
   */
  static width(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.width = value;
    return container;
  }

  /**
   * Sets a fixed height.
   */
  static height(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.height = value;
    return container;
  }

  /**
   * Sets a fixed width and height.
   */
  static size(c: IContentContainer, width: number, height: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.width = width;
    container.height = height;
    return container;
  }

  // --- Corner Radius ---

  /**
   * Sets the corner radius for rounded corners.
   */
  static cornerRadius(c: IContentContainer, radius: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.cornerRadius = radius;
    return container;
  }

  /**
   * Rounds the container's corners *and* clips its content to that rounded
   * outline. Unlike {@link cornerRadius} - which only rounds the
   * background fill and border stroke - this masks the child too, so a full-bleed
   * image or any overflowing content is cut to the rounded box. This is the
   * idiomatic way to build rounded image cards and avatars.
   *
   * ```typescript
   * roundedCorners(container, 12).image('avatar.png');
   * roundedCorners(container, 6).background(ColorPalette.slate[100]);
   * ```
   */
  static roundedCorners(c: IContentContainer, radius: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.cornerRadius = radius;
    container.clipContent = true;
    return container;
  }

  /**
   * Renders the container's subtree inside a crisp-edge region: on SVG
   * export, thin axis-aligned strokes/rects (grid/table lines, dividers) snap to
   * the pixel grid instead of being antialiased. No-op on PDF output. Apply only
   * to axis-aligned content - rounded shapes, diagonals, and text want
   * antialiasing.
   */
  static crispEdges(c: IContentContainer): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.crispEdges = true;
    return container;
  }

  // --- Margin ---

  /**
   * Sets uniform margin on all sides.
   */
  static margin(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.margin = new Thickness(value);
    return container;
  }

  /**
   * Sets horizontal and vertical margin.
   */
  static marginHV(c: IContentContainer, horizontal: number, vertical: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.margin = new Thickness(horizontal, vertical);
    return container;
  }

  /**
   * Sets margin for each side individually.
   */
  static marginFull(c: IContentContainer, left: number, top: number, right: number, bottom: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.margin = new Thickness(left, top, right, bottom);
    return container;
  }

  /**
   * Sets top margin.
   */
  static marginTop(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.margin = new Thickness(0, value, 0, 0);
    return container;
  }

  /**
   * Sets bottom margin.
   */
  static marginBottom(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.margin = new Thickness(0, 0, 0, value);
    return container;
  }

  /**
   * Sets left margin.
   */
  static marginLeft(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.margin = new Thickness(value, 0, 0, 0);
    return container;
  }

  /**
   * Sets right margin.
   */
  static marginRight(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.margin = new Thickness(0, 0, value, 0);
    return container;
  }

  /**
   * Sets horizontal margin (left and right).
   */
  static marginHorizontal(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.margin = new Thickness(value, 0, value, 0);
    return container;
  }

  /**
   * Sets vertical margin (top and bottom).
   */
  static marginVertical(c: IContentContainer, value: number): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.margin = new Thickness(0, value, 0, value);
    return container;
  }

  // --- Alignment ---

  /**
   * Centers the content horizontally.
   */
  static alignCenter(c: IContentContainer): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.horizontalAlignment = HorizontalAlignment.Center;
    return container;
  }

  /**
   * Aligns content to the right.
   */
  static alignRight(c: IContentContainer): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.horizontalAlignment = HorizontalAlignment.End;
    return container;
  }

  /**
   * Aligns content to the left (default).
   */
  static alignLeft(c: IContentContainer): IContentContainer {
    const container = ContainerStyleExtensions.getOrCreateContainer(c);
    container.horizontalAlignment = HorizontalAlignment.Start;
    return container;
  }
}

/**
 * Shortcut functions for ContainerStyleExtensions with overloads
 */
export function padding(c: IContentContainer, value: number): IContentContainer;
export function padding(c: IContentContainer, horizontal: number, vertical: number): IContentContainer;
export function padding(
  c: IContentContainer,
  left: number,
  top: number,
  right: number,
  bottom: number
): IContentContainer;
export function padding(
  c: IContentContainer,
  arg1: number,
  arg2?: number,
  arg3?: number,
  arg4?: number
): IContentContainer {
  if (arg2 === undefined) {
    return ContainerStyleExtensions.padding(c, arg1);
  } else if (arg3 === undefined) {
    return ContainerStyleExtensions.paddingHV(c, arg1, arg2);
  } else {
    return ContainerStyleExtensions.paddingFull(c, arg1, arg2, arg3!, arg4!);
  }
}

export function paddingTop(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.paddingTop(c, value);
}

export function paddingBottom(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.paddingBottom(c, value);
}

export function paddingLeft(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.paddingLeft(c, value);
}

export function paddingRight(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.paddingRight(c, value);
}

export function paddingHorizontal(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.paddingHorizontal(c, value);
}

export function paddingVertical(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.paddingVertical(c, value);
}

export function background(c: IContentContainer, color: Color): IContentContainer {
  return ContainerStyleExtensions.background(c, color);
}

export function border(c: IContentContainer, width: number): IContentContainer {
  return ContainerStyleExtensions.border(c, width);
}

export function borderWithColor(c: IContentContainer, width: number, color: Color): IContentContainer {
  return ContainerStyleExtensions.borderWithColor(c, width, color);
}

export function borderBottom(c: IContentContainer, width: number, color?: Color): IContentContainer {
  return ContainerStyleExtensions.borderBottom(c, width, color);
}

export function borderTop(c: IContentContainer, width: number, color?: Color): IContentContainer {
  return ContainerStyleExtensions.borderTop(c, width, color);
}

export function borderLeft(c: IContentContainer, width: number, color?: Color): IContentContainer {
  return ContainerStyleExtensions.borderLeft(c, width, color);
}

export function borderRight(c: IContentContainer, width: number, color?: Color): IContentContainer {
  return ContainerStyleExtensions.borderRight(c, width, color);
}

export function borderHorizontal(c: IContentContainer, width: number, color?: Color): IContentContainer {
  return ContainerStyleExtensions.borderHorizontal(c, width, color);
}

export function borderVertical(c: IContentContainer, width: number, color?: Color): IContentContainer {
  return ContainerStyleExtensions.borderVertical(c, width, color);
}

export function width(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.width(c, value);
}

export function height(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.height(c, value);
}

export function size(c: IContentContainer, width: number, height: number): IContentContainer {
  return ContainerStyleExtensions.size(c, width, height);
}

export function cornerRadius(c: IContentContainer, radius: number): IContentContainer {
  return ContainerStyleExtensions.cornerRadius(c, radius);
}

export function roundedCorners(c: IContentContainer, radius: number): IContentContainer {
  return ContainerStyleExtensions.roundedCorners(c, radius);
}

export function crispEdges(c: IContentContainer): IContentContainer {
  return ContainerStyleExtensions.crispEdges(c);
}

export function margin(c: IContentContainer, value: number): IContentContainer;
export function margin(c: IContentContainer, horizontal: number, vertical: number): IContentContainer;
export function margin(
  c: IContentContainer,
  left: number,
  top: number,
  right: number,
  bottom: number
): IContentContainer;
export function margin(
  c: IContentContainer,
  arg1: number,
  arg2?: number,
  arg3?: number,
  arg4?: number
): IContentContainer {
  if (arg2 === undefined) {
    return ContainerStyleExtensions.margin(c, arg1);
  } else if (arg3 === undefined) {
    return ContainerStyleExtensions.marginHV(c, arg1, arg2);
  } else {
    return ContainerStyleExtensions.marginFull(c, arg1, arg2, arg3!, arg4!);
  }
}

export function marginTop(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.marginTop(c, value);
}

export function marginBottom(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.marginBottom(c, value);
}

export function marginLeft(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.marginLeft(c, value);
}

export function marginRight(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.marginRight(c, value);
}

export function marginHorizontal(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.marginHorizontal(c, value);
}

export function marginVertical(c: IContentContainer, value: number): IContentContainer {
  return ContainerStyleExtensions.marginVertical(c, value);
}

export function alignCenter(c: IContentContainer): IContentContainer {
  return ContainerStyleExtensions.alignCenter(c);
}

export function alignRight(c: IContentContainer): IContentContainer {
  return ContainerStyleExtensions.alignRight(c);
}

export function alignLeft(c: IContentContainer): IContentContainer {
  return ContainerStyleExtensions.alignLeft(c);
}
