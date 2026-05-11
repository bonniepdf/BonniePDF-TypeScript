import { IElement } from '../../Elements/IElement';
import { TableRow } from '../../Elements/Tables/TableRow';
import { TextBlock } from '../../Elements/Text/TextBlock';
import { ContentSlot } from '../ContentSlot';
import { IContentContainer } from '../IContentContainer';


  /**
   * Describes a table row (used for headers and footers).
   * Provides a Cell() method that returns a container for each cell's content.
   */
  export class TableRowDescriptor {
    private readonly cellSlots: ContentSlot[] = [];

    /**
     * Returns a container for the next cell in this row.
     */
    cell(): IContentContainer {
      const slot = new ContentSlot();
      this.cellSlots.push(slot);
      return slot;
    }

    /**
     * Builds a TableRow from the configured cells.
     */
    build(): TableRow {
      const cells: IElement[] = new Array(this.cellSlots.length);
      for (let i = 0; i < this.cellSlots.length; i++) {
        cells[i] = this.cellSlots[i].child ?? new TextBlock();
        if (!cells[i]) {
          const tb = new TextBlock();
          tb.text = "";
          cells[i] = tb;
        }
      }

      return TableRow.fromElements(...cells);
    }
  }
