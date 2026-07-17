import { ListElementBase } from './ListElementBase';
import { BulletStyle } from './BulletStyle';
import { Color } from '../../Core/Color';
import { RenderContext } from '../../Rendering/RenderContext';

/**
 * An unordered list element that displays bulleted items with various bullet styles
 */
export class UnorderedList extends ListElementBase {
  private readonly items: string[] = [];
  private readonly nestedLists: UnorderedList[] = [];
  private _bulletColor?: Color;

  /** Bullet style for the list (Disc, Circle, Square, Dash, Custom) */
  public bulletStyle: BulletStyle = BulletStyle.Disc;

  /** Custom bullet character (only used when BulletStyle is Custom) */
  public customBullet = '•';

  /** Color for the bullet character */
  public get bulletColor(): Color {
    return this._bulletColor ?? this.textColor;
  }
  public set bulletColor(value: Color) {
    this._bulletColor = value;
  }

  private get bulletChar(): string {
    return this.getBulletCharacter();
  }

  /**
   * Adds a text item to this list
   */
  public addItem(item: string): void {
    this.items.push(item ?? '');
  }

  /**
   * Adds a nested list to this list
   */
  public addNestedList(nestedList: UnorderedList): void {
    nestedList.indent = this.indent;
    this.nestedLists.push(nestedList);
  }

  public override getNestedLists(): readonly UnorderedList[] {
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

    // Render regular items
    for (const item of this.items) {
      const lines = this.computeLines(item, itemWidth);
      const bulletWidth = this.measureTextWidth(this.bulletChar);

      // Render each line with the bullet
      this.renderListItem(
        ctx,
        lines,
        (x, y) => {
          // Draw bullet
          ctx.canvas.drawText(x, y, this.bulletChar, this.bulletColor, this.fontSize, this.fontName, 0); // TextAlignment.Left
        },
        bulletWidth
      );
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

  private getBulletCharacter(): string {
    switch (this.bulletStyle) {
      case BulletStyle.Disc:
        return '•';
      case BulletStyle.Circle:
        return '◦';
      case BulletStyle.Square:
        return '■';
      case BulletStyle.Dash:
        return '-';
      case BulletStyle.Custom:
        return this.customBullet;
      default:
        return '•';
    }
  }
}
