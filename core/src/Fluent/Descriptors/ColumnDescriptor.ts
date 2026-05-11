import { VerticalStack } from '../../Elements/Layout/VerticalStack';
import { ContentSlot } from '../ContentSlot';
import { IContentContainer } from '../IContentContainer';


  /**
   * Describes a vertical column layout. Provides scoped methods for adding items and configuring spacing.
   * Maps to a VerticalStack element internally.
   */
  export class ColumnDescriptor {
    stack: VerticalStack = new VerticalStack();

    /**
     * Sets the vertical spacing between items in points.
     */
    spacing(value: number): void {
      this.stack.spacing = value;
    }

    /**
     * Adds an item to the column and returns a container for configuring its content.
     * @returns An IContentContainer for chaining content and styling.
     */
    item(): IContentContainer {
      const slot = new ContentSlot();
      this.stack.addChild(slot);
      return slot;
    }
  }
