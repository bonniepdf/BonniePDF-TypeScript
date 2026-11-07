import { TextBlock, type TextBlockOptions } from './TextBlock';
import { TextElementBase } from './TextElementBase';

/** A text element whose {page} and {total} placeholders resolve when the document renders. */
export function pageNumber(format = 'Page {page} of {total}', options?: TextBlockOptions): TextBlock {
  return new TextBlock({
    ...options,
    text: format
      .replaceAll('{page}', TextElementBase.CurrentPageToken)
      .replaceAll('{total}', TextElementBase.TotalPagesToken),
  });
}
