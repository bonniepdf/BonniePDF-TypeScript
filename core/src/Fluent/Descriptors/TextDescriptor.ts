import { RichText } from '../../Elements/Text/RichText';
import { TextStyle } from '../../Elements/Text/TextStyle';
import { TextElementBase } from '../../Elements/Text/TextElementBase';
import { TextSpanDescriptor } from './TextSpanDescriptor';

/**
 * Describes rich text content with multiple spans.
 * Provides methods for adding styled text spans, page numbers, and total page counts.
 * Maps to a RichText element internally.
 */
export class TextDescriptor {
  richText: RichText = new RichText();

  /**
   * Adds a text span with optional styling.
   * If style is provided, adds the span with that style.
   * Otherwise returns a TextSpanDescriptor for configuring the span's style.
   */
  span(text: string, style?: TextStyle): TextSpanDescriptor {
    const s = style ?? new TextStyle();
    this.richText.span(text, s);
    return new TextSpanDescriptor(s);
  }

  /**
   * Adds a text span followed by a line break.
   * @returns A TextSpanDescriptor for configuring the span's style.
   */
  line(text: string): TextSpanDescriptor {
    const style = new TextStyle();
    this.richText.line(text, style);
    return new TextSpanDescriptor(style);
  }

  /**
   * Adds a line break.
   */
  lineBreak(): void {
    this.richText.lineBreak();
  }

  /**
   * Inserts the current page number.
   */
  currentPageNumber(): TextSpanDescriptor {
    const style = new TextStyle();
    this.richText.span(TextElementBase.CurrentPageToken, style);
    return new TextSpanDescriptor(style);
  }

  /**
   * Inserts the total page count.
   */
  totalPages(): TextSpanDescriptor {
    const style = new TextStyle();
    this.richText.span(TextElementBase.TotalPagesToken, style);
    return new TextSpanDescriptor(style);
  }
}
