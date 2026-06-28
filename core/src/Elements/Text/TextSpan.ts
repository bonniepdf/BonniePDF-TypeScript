import { TextStyle } from './TextStyle';

/**
 * A styled segment of text within a RichText element.
 * Each span carries its own TextStyle that is merged with the parent's default style at render time.
 */
export class TextSpan {
  /** The text content of this span. */
  public text?: string;

  /** The style for this span. Properties set to null inherit from the parent RichText's defaultStyle. */
  public style?: TextStyle;

  /** When true, a line break is inserted after this span's text. */
  public isLineBreak = false;
}
