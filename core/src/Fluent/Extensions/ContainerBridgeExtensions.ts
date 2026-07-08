import { IElement } from '../../Elements/IElement';
import { IContentContainer } from '../IContentContainer';

/**
 * Internal bridge methods that make the fluent API chain pattern work.
 */
export class ContainerBridgeExtensions {
  /**
   * Sets the child of this container and returns the child if it's also a container (for chaining).
   * This is the core method that enables: .Padding(10).Border(1).Text("Hello")
   */
  static element(parent: IContentContainer, child: IElement): IContentContainer {
    if (parent.child != null) {
      throw new Error(
        'This container already has a child element. ' +
          'Each container slot can only hold one child. ' +
          'Use Column() or Row() to add multiple elements.'
      );
    }

    parent.child = child;

    // If the child is also a content container, return it for continued chaining
    if (this.isContentContainer(child)) {
      return child;
    }

    // Otherwise return a dead-end (shouldn't happen with proper chaining)
    return parent;
  }

  /**
   * Sets the child and returns the child element typed for further styling.
   * Used by terminal methods like .Text() that return the concrete element type.
   */
  static elementTyped<T extends IElement>(parent: IContentContainer, child: T): T {
    if (parent.child != null) {
      throw new Error(
        'This container already has a child element. ' +
          'Each container slot can only hold one child. ' +
          'Use Column() or Row() to add multiple elements.'
      );
    }

    parent.child = child;
    return child;
  }

  private static isContentContainer(obj: unknown): obj is IContentContainer {
    return !!obj && typeof (obj as { addChild?: unknown }).addChild === 'function';
  }
}

/**
 * Shortcut functions for ContainerBridgeExtensions
 */
export function bridgeElement(parent: IContentContainer, child: IElement): IContentContainer {
  return ContainerBridgeExtensions.element(parent, child);
}

export function bridgeElementTyped<T extends IElement>(parent: IContentContainer, child: T): T {
  return ContainerBridgeExtensions.elementTyped(parent, child);
}
