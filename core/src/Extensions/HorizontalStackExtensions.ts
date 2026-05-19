import { HorizontalStack } from '../Elements/Layout/HorizontalStack';
import { IElement } from '../Elements/IElement';
import { HorizontalAlignment } from '../Core/HorizontalAlignment';
import { WidthDistribution } from '../Elements/Layout/WidthDistribution';

/**
 * Fluent extension methods for horizontal stacks
 */
export class HorizontalStackExtensions {
  /**
   * Adds a child element to the horizontal stack
   */
  static item(s: HorizontalStack, element: IElement): HorizontalStack {
    s.addChild(element);
    return s;
  }

  /**
   * Adds a child element with a specific weight to the horizontal stack
   */
  static itemWeighted(s: HorizontalStack, element: IElement, weight: number): HorizontalStack {
    s.addChild(element, weight);
    return s;
  }

  /**
   * Sets the spacing between elements in the horizontal stack
   */
  static spacing(s: HorizontalStack, value: number): HorizontalStack {
    s.spacing = value;
    return s;
  }

  /**
   * Sets the vertical alignment to the start
   */
  static alignStart(s: HorizontalStack): HorizontalStack {
    s.alignment = HorizontalAlignment.Start;
    return s;
  }

  /**
   * Sets the vertical alignment to center
   */
  static alignCenter(s: HorizontalStack): HorizontalStack {
    s.alignment = HorizontalAlignment.Center;
    return s;
  }

  /**
   * Sets the vertical alignment to the end
   */
  static alignEnd(s: HorizontalStack): HorizontalStack {
    s.alignment = HorizontalAlignment.End;
    return s;
  }

  /**
   * Sets the width distribution to be equal for all children
   */
  static equalWidth(s: HorizontalStack): HorizontalStack {
    s.widthDistribution = WidthDistribution.Equal;
    return s;
  }

  /**
   * Sets the width distribution to be based on weights
   */
  static weightedWidth(s: HorizontalStack): HorizontalStack {
    s.widthDistribution = WidthDistribution.Weighted;
    return s;
  }

  /**
   * Sets the width distribution to be based on the intrinsic width of the children
   */
  static autoWidth(s: HorizontalStack): HorizontalStack {
    s.widthDistribution = WidthDistribution.Auto;
    return s;
  }
}

/**
 * Shortcut functions for HorizontalStackExtensions
 */
export function hstackItem(s: HorizontalStack, element: IElement, weight?: number): HorizontalStack {
  return weight === undefined
    ? HorizontalStackExtensions.item(s, element)
    : HorizontalStackExtensions.itemWeighted(s, element, weight);
}

export function hstackSpacing(s: HorizontalStack, value: number): HorizontalStack {
  return HorizontalStackExtensions.spacing(s, value);
}

export function hstackAlignStart(s: HorizontalStack): HorizontalStack {
  return HorizontalStackExtensions.alignStart(s);
}

export function hstackAlignCenter(s: HorizontalStack): HorizontalStack {
  return HorizontalStackExtensions.alignCenter(s);
}

export function hstackAlignEnd(s: HorizontalStack): HorizontalStack {
  return HorizontalStackExtensions.alignEnd(s);
}

export function hstackEqualWidth(s: HorizontalStack): HorizontalStack {
  return HorizontalStackExtensions.equalWidth(s);
}

export function hstackWeightedWidth(s: HorizontalStack): HorizontalStack {
  return HorizontalStackExtensions.weightedWidth(s);
}

export function hstackAutoWidth(s: HorizontalStack): HorizontalStack {
  return HorizontalStackExtensions.autoWidth(s);
}
