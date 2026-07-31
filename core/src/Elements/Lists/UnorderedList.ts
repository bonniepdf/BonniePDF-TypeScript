import { ListElementBase } from './ListElementBase';
import { toBulletStyle, type BulletStyleInput } from '../../Normalize/toEnum';
import { toColor, type ColorInput } from '../../Normalize/toColor';
import { applyOptions } from '../../Core/applyOptions';
import { LIST_ELEMENT_OPTION_KEYS, type ListElementOptions } from './ListElementBase';
import { BulletStyle } from './BulletStyle';
import { Color } from '../../Core/Color';
import { RenderContext } from '../../Rendering/RenderContext';

/**
 * An unordered list element that displays bulleted items with various bullet styles
 */
/** Settable properties declared by {@link UnorderedList} itself. */
export const UNORDERED_LIST_OWN_OPTION_KEYS = ['bulletStyle', 'customBullet', 'bulletColor'] as const;

/** The full settable *property* surface, bases included. `items` is sugar. */
export const UNORDERED_LIST_OPTION_KEYS = [...LIST_ELEMENT_OPTION_KEYS, ...UNORDERED_LIST_OWN_OPTION_KEYS] as const;

/** Options for {@link UnorderedList}. Intersects {@link ListElementOptions}. */
export type UnorderedListOptions = ListElementOptions &
  Partial<Omit<Pick<UnorderedList, (typeof UNORDERED_LIST_OWN_OPTION_KEYS)[number]>, 'bulletStyle' | 'bulletColor'>> & {
    /** Bullet glyph. Accepts `'disc' | 'circle' | 'square' | 'dash' | 'custom'`. */
    bulletStyle?: BulletStyleInput;
    /** Bullet colour. Accepts a palette token or hex. Defaults to the text colour. */
    bulletColor?: ColorInput;
    /** List items, in order. Sugar over {@link UnorderedList.addItem}. */
    items?: string[];
  };

export class UnorderedList extends ListElementBase {
  private readonly items: string[] = [];

  /** Creates an unordered list, optionally configured in one expression. */
  constructor(options?: UnorderedListOptions) {
    super();
    const { items, ...rest } = options ?? {};
    applyOptions(this, rest);
    for (const item of items ?? []) this.addItem(item);
  }
  private readonly nestedLists: UnorderedList[] = [];
  private _bulletColor?: Color;

  /** Bullet style for the list (Disc, Circle, Square, Dash, Custom) */
  private _bulletStyle: BulletStyle = BulletStyle.Disc;

  /** Bullet glyph. Accepts `'disc' | 'circle' | 'square' | 'dash' | 'custom'`. */
  public get bulletStyle(): BulletStyle {
    return this._bulletStyle;
  }
  public set bulletStyle(value: BulletStyleInput) {
    this._bulletStyle = toBulletStyle(value);
  }

  /** Custom bullet character (only used when BulletStyle is Custom) */
  public customBullet = '•';

  /** Color for the bullet character */
  public get bulletColor(): Color {
    return this._bulletColor ?? this.textColor;
  }
  public set bulletColor(value: ColorInput) {
    this._bulletColor = toColor(value);
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
