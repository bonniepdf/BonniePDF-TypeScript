import { TextStyle } from './TextStyle';
import { applyOptions } from '../../Core/applyOptions';

/**
 * A styled segment of text within a RichText element.
 * Each span carries its own TextStyle that is merged with the parent's default style at render time.
 */
/** Settable properties of {@link TextSpan} (a standalone value, no base class). */
export const TEXT_SPAN_OPTION_KEYS = ['text', 'style', 'isLineBreak'] as const;

type TextSpanKey = (typeof TEXT_SPAN_OPTION_KEYS)[number];

/** Options for {@link TextSpan}. */
export type TextSpanOptions = Partial<Pick<TextSpan, TextSpanKey>>;

export class TextSpan {
  /** The text content of this span. */
  public text?: string;

  /** The style for this span. Properties set to null inherit from the parent RichText's defaultStyle. */
  public style?: TextStyle;

  /** When true, a line break is inserted after this span's text. */
  public isLineBreak = false;

  /** Creates a span, optionally configured in one expression. */
  constructor(options?: TextSpanOptions) {
    applyOptions(this, options);
  }
}
