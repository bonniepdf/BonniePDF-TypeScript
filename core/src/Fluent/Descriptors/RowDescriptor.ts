import { HorizontalAlignment } from '../../Core/HorizontalAlignment';
import { HorizontalStack } from '../../Elements/Layout/HorizontalStack';
import { Container } from '../../Elements/Layout/Container';
import { WidthDistribution } from '../../Elements/Layout/WidthDistribution';
import { ContentSlot } from '../ContentSlot';
import { IContentContainer } from '../IContentContainer';


  /**
   * Describes a horizontal row layout. Provides scoped methods for adding items with
   * relative, constant, or auto sizing. Maps to a HorizontalStack element internally.
   */
  export class RowDescriptor {
    stack: HorizontalStack = new HorizontalStack();
    private hasRelativeOrConstant: boolean = false;

    /**
     * Sets the horizontal spacing between items in points.
     */
    spacing(value: number): void {
      this.stack.spacing = value;
    }

    /**
     * Sets the vertical alignment of items within the row.
     */
    alignItems(alignment: HorizontalAlignment): void {
      this.stack.alignment = alignment;
    }

    /**
     * Adds an item that takes proportional space (like CSS flex-grow).
     * Multiple relative items share available space according to their weights.
     * @param weight The proportional weight (default 1). Higher values take more space.
     * @returns An IContentContainer for chaining content and styling.
     */
    relativeItem(weight: number = 1): IContentContainer {
      this.ensureWeightedDistribution();
      const slot = new ContentSlot();
      this.stack.addChild(slot, weight);
      return slot;
    }

    /**
     * Adds an item with a fixed width in points.
     * @param width The fixed width in points.
     * @returns An IContentContainer for chaining content and styling.
     */
    constantItem(width: number): IContentContainer {
      this.ensureWeightedDistribution();
      // Use a container with fixed width wrapping a slot
      const slot = new ContentSlot();
      const container = new Container();
      container.width = width;
      container.child = slot;
      this.stack.addChild(container, 0); // Weight 0 = uses preferred width (the fixed Width)
      return slot;
    }

    /**
     * Adds an item that sizes to its content.
     * @returns An IContentContainer for chaining content and styling.
     */
    autoItem(): IContentContainer {
      const slot = new ContentSlot();
      if (this.hasRelativeOrConstant) {
        // In weighted mode, auto items get weight 0 (use preferred width)
        this.stack.addChild(slot, 0);
      } else {
        this.stack.addChild(slot);
      }

      return slot;
    }

    private ensureWeightedDistribution(): void {
      if (!this.hasRelativeOrConstant) {
        this.stack.widthDistribution = WidthDistribution.Weighted;
        this.hasRelativeOrConstant = true;
      }
    }
  }
