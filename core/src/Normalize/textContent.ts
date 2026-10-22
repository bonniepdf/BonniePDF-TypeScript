/** Join lines into one paragraph, rejecting missing or non-string lines. @internal */
export function textContent(content: string | readonly string[]): string {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) throw new TypeError('Text content must be a string or an array of strings.');
  for (const line of content) {
    if (typeof line !== 'string') throw new TypeError('Every text line must be a string.');
  }
  return content.join('\n');
}
