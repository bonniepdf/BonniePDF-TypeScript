// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
/**
 * Shared number scanning for SVG attribute grammars.
 *
 * SVG number lists are comma-or-whitespace separated and allow forms a plain
 * `parseFloat` split would mishandle: `1-2` is two numbers, `.5.5` is two
 * numbers, and exponents may carry signs. Path data and `points` both need
 * this, so it lives in one place.
 */
export class NumberScanner {
  private index = 0;

  private readonly text: string;

  constructor(text: string) {
    this.text = text;
  }

  get position(): number {
    return this.index;
  }

  atEnd(): boolean {
    this.skipSeparators();
    return this.index >= this.text.length;
  }

  skipSeparators(): void {
    while (this.index < this.text.length) {
      const ch = this.text[this.index]!;
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f' || ch === ',') this.index++;
      else break;
    }
  }

  /** Peek the next non-separator character without consuming it. */
  peek(): string | undefined {
    this.skipSeparators();
    return this.text[this.index];
  }

  take(): string | undefined {
    this.skipSeparators();
    return this.text[this.index++];
  }

  /** Scan one number, or throw. */
  number(): number {
    this.skipSeparators();
    const start = this.index;

    if (this.text[this.index] === '+' || this.text[this.index] === '-') this.index++;
    while (this.isDigit(this.text[this.index])) this.index++;
    if (this.text[this.index] === '.') {
      this.index++;
      while (this.isDigit(this.text[this.index])) this.index++;
    }
    // Only consume an exponent if it is actually well-formed; `10e` in a path
    // is a number followed by junk, not a broken exponent.
    if (this.text[this.index] === 'e' || this.text[this.index] === 'E') {
      const save = this.index;
      this.index++;
      if (this.text[this.index] === '+' || this.text[this.index] === '-') this.index++;
      if (this.isDigit(this.text[this.index])) {
        while (this.isDigit(this.text[this.index])) this.index++;
      } else {
        this.index = save;
      }
    }

    const slice = this.text.slice(start, this.index);
    const value = Number(slice);
    if (slice === '' || !Number.isFinite(value)) {
      throw new SvgParseError(`expected a number at offset ${start}`, start, this.text);
    }
    return value;
  }

  /** A flag is exactly `0` or `1`, with no sign and no decimal point. */
  flag(): boolean {
    this.skipSeparators();
    const ch = this.text[this.index];
    if (ch !== '0' && ch !== '1') {
      throw new SvgParseError(`expected a 0 or 1 flag at offset ${this.index}`, this.index, this.text);
    }
    this.index++;
    return ch === '1';
  }

  private isDigit(ch: string | undefined): boolean {
    return ch !== undefined && ch >= '0' && ch <= '9';
  }
}

/** Thrown when an attribute value cannot be parsed. Carries enough to locate it. */
export class SvgParseError extends Error {
  readonly offset: number;
  readonly source: string;

  constructor(message: string, offset: number, source: string) {
    const excerpt = source.slice(Math.max(0, offset - 16), offset + 16);
    super(`${message} (near "${excerpt}")`);
    this.name = 'SvgParseError';
    this.offset = offset;
    this.source = source;
  }
}

/** Scan every number in a list, e.g. a `points` attribute. */
export function numberList(text: string): number[] {
  const scanner = new NumberScanner(text);
  const values: number[] = [];
  while (!scanner.atEnd()) values.push(scanner.number());
  return values;
}
