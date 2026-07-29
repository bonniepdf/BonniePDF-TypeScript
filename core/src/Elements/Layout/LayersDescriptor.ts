import { IElement } from '../IElement';
import { Layers } from './Layers';

/**
 * Builder for the {@link Layers} inline z-stacking primitive, used by
 * `Container.layers(...)`. Layers paint in declaration order: background
 * behind, the primary layer in the middle (it defines the flow height), and
 * foreground on top.
 */
export class LayersDescriptor {
  private readonly layersElement = new Layers();

  /** Adds a layer painted behind the primary layer. */
  background(element: IElement): LayersDescriptor {
    this.layersElement.addBackground(element);
    return this;
  }

  /**
   * Sets the primary content layer - the layer that determines the flow height
   * of the stack.
   */
  primaryLayer(element: IElement): LayersDescriptor {
    this.layersElement.primaryLayer = element;
    return this;
  }

  /** Adds a layer painted on top of the primary layer. */
  foreground(element: IElement): LayersDescriptor {
    this.layersElement.addForeground(element);
    return this;
  }

  /** @internal */
  build(): Layers {
    return this.layersElement;
  }
}
