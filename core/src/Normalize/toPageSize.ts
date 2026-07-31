import { PdfSize } from '../Configuration/PdfSize';
import type { PageSizeToken } from './Tokens';

/** An explicit page size in points. */
export interface PageSizeObject {
  width: number;
  height: number;
  name?: string;
}

/** Every form a page size may be written as (`the specification` §4A.3). */
export type PageSizeInput = PdfSize | PageSizeToken | PageSizeObject;

/**
 * The 18 named sizes, resolved lazily through `PdfSize`'s static getters so this
 * module holds no dimension table of its own.
 */
const NAMED: Record<PageSizeToken, () => PdfSize> = {
  a0: () => PdfSize.a0,
  a1: () => PdfSize.a1,
  a2: () => PdfSize.a2,
  a3: () => PdfSize.a3,
  a4: () => PdfSize.a4,
  a5: () => PdfSize.a5,
  b0: () => PdfSize.b0,
  b1: () => PdfSize.b1,
  b2: () => PdfSize.b2,
  b3: () => PdfSize.b3,
  b4: () => PdfSize.b4,
  b5: () => PdfSize.b5,
  letter: () => PdfSize.letter,
  legal: () => PdfSize.legal,
  tabloid: () => PdfSize.tabloid,
  ledger: () => PdfSize.ledger,
  statement: () => PdfSize.statement,
  executive: () => PdfSize.executive,
};

/** Resolves a {@link PageSizeInput} to the canonical {@link PdfSize}. */
export function toPageSize(input: PageSizeInput): PdfSize {
  if (input instanceof PdfSize) return input;
  if (typeof input === 'string') return (NAMED[input] ?? NAMED.a4)();
  return new PdfSize(input.width, input.height, input.name);
}
