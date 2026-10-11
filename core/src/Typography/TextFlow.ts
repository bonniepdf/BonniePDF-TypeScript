import { ContentDirection } from '../Configuration/ContentDirection';

export type TextFlowLine = Readonly<{ paragraph: string; start: number; end: number }>;
type State = { direction: ContentDirection; line?: TextFlowLine };
// Scopes enclose synchronous measurement/painting only, never an await.
export class TextFlow {
  private static current?: State;
  private static readonly noop = (): void => {};
  static get rightToLeft(): boolean {
    return this.current?.direction === ContentDirection.RightToLeft;
  }
  static get line(): TextFlowLine | undefined {
    return this.current?.line;
  }
  static get cacheKey(): string {
    return this.current ? JSON.stringify(this.current) : '';
  }
  static enter(direction: ContentDirection, line?: TextFlowLine): () => void {
    const prior = this.current;
    if (!line && (prior?.direction ?? ContentDirection.LeftToRight) === direction) return this.noop;
    this.current = { direction, line };
    return () => {
      this.current = prior;
    };
  }
  static needsBidi(text: string): boolean {
    return /[\u0590-\u08ff\u200e-\u200f\u202a-\u202e\u2066-\u2069\ufb1d-\ufeff]/.test(text);
  }
  static mapLines(source: string, lines: readonly string[]): (TextFlowLine | undefined)[] {
    const paragraphs = source.replace(/\r\n?/g, '\n').split('\n');
    let paragraph = 0,
      offset = 0;
    return lines.map(line => {
      while (paragraph < paragraphs.length) {
        const value = paragraphs[paragraph];
        const start = value.indexOf(line, offset);
        if (start >= 0) {
          const result = { paragraph: value, start, end: start + line.length };
          offset = result.end;
          if (offset === value.length) {
            paragraph++;
            offset = 0;
          }
          return result;
        }
        paragraph++;
        offset = 0;
      }
      return undefined;
    });
  }
}
