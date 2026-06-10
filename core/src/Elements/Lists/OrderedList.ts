import { ListElementBase } from './ListElementBase';
import { NumberFormat } from './NumberFormat';
import { RenderContext } from '../../Rendering/RenderContext';

/**
 * An ordered list element that displays numbered items with various numbering formats
 */
export class OrderedList extends ListElementBase {
  private readonly items: string[] = [];
  private readonly nestedLists: OrderedList[] = [];

  /** Number format for the list (Decimal, Roman, Alpha, etc.) */
  public numberFormat: NumberFormat = NumberFormat.Decimal;

  /** Starting number for the list (default: 1) */
  public startNumber = 1;

  /**
   * Adds a text item to this list
   */
  public addItem(item: string): void {
    this.items.push(item ?? '');
  }

  /**
   * Adds a nested list to this list
   */
  public addNestedList(nestedList: OrderedList): void {
    nestedList.indent = this.indent;
    this.nestedLists.push(nestedList);
  }

  public override getNestedLists(): readonly OrderedList[] {
    return this.nestedLists;
  }

  protected override measureContentHeight(contentWidth: number): number {
    const itemWidth = contentWidth - this.indent;
    let totalHeight = this.measureItemsHeight(this.items, itemWidth);

    // Measure nested lists
    for (const nestedList of this.nestedLists) {
      totalHeight += nestedList.measureHeight(contentWidth - this.indent) + this.itemSpacing;
    }

    return totalHeight;
  }

  protected override renderItems(ctx: RenderContext, contentWidth: number): void {
    const itemWidth = contentWidth - this.indent;

    let currentItemNumber = this.startNumber;
    const startY = ctx.currentY;

    // Render regular items
    for (const item of this.items) {
      const lines = this.computeLines(item, itemWidth);
      const numberText = this.formatNumber(currentItemNumber);
      const numberWidth = this.measureTextWidth(numberText + '.');

      // Render each line with the number
      this.renderListItem(
        ctx,
        lines,
        (x, y) => {
          // Draw number
          ctx.canvas.drawText(x, y, numberText + '.', this.textColor, this.fontSize, this.fontName, 0); // TextAlignment.Left
        },
        numberWidth
      );

      currentItemNumber++;
    }

    // Render nested lists
    for (const nestedList of this.nestedLists) {
      const originalX = ctx.currentX;
      ctx.currentX += this.indent;

      nestedList.render(ctx, contentWidth - this.indent);

      ctx.currentX = originalX;
      ctx.currentY += this.itemSpacing;
    }
  }

  private formatNumber(number: number): string {
    switch (this.numberFormat) {
      case NumberFormat.Decimal:
        return number.toString();
      case NumberFormat.UpperRoman:
        return OrderedList.toRomanNumeral(number);
      case NumberFormat.LowerRoman:
        return OrderedList.toRomanNumeral(number).toLowerCase();
      case NumberFormat.UpperAlpha:
        return OrderedList.toAlpha(number);
      case NumberFormat.LowerAlpha:
        return OrderedList.toAlpha(number).toLowerCase();
      default:
        return number.toString();
    }
  }

  private static toRomanNumeral(number: number): string {
    if (number <= 0 || number > 3999) {
      return number.toString();
    }

    const thousands = ['', 'M', 'MM', 'MMM'];
    const hundreds = ['', 'C', 'CC', 'CCC', 'CD', 'D', 'DC', 'DCC', 'DCCC', 'CM'];
    const tens = ['', 'X', 'XX', 'XXX', 'XL', 'L', 'LX', 'LXX', 'LXXX', 'XC'];
    const ones = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

    return (
      thousands[Math.floor(number / 1000)] +
      hundreds[Math.floor((number % 1000) / 100)] +
      tens[Math.floor((number % 100) / 10)] +
      ones[number % 10]
    );
  }

  private static toAlpha(number: number): string {
    if (number <= 0) {
      return number.toString();
    }

    let result = '';
    number--;

    do {
      result = String.fromCharCode('A'.charCodeAt(0) + (number % 26)) + result;
      number = Math.floor(number / 26);
    } while (number > 0);

    return result;
  }
}
