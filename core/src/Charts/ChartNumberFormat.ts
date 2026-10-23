/**
 * Number formatting for chart text: data-point labels, the pie total and the axis ticks.
 *
 * One small grammar, culture-invariant (`.` for decimals, `,` for thousands, always), and
 * computed on the value's decimal digits so a `number` and a .NET `decimal` produce the same
 * text:
 *
 * | Format | Meaning |
 * | --- | --- |
 * | `G` (default) | the shortest decimal that round-trips, plain notation, no grouping |
 * | `F<n>` | fixed-point, `n` decimals (`F` alone is `F2`) |
 * | `N<n>` | fixed-point, `n` decimals, grouped in thousands (`N` alone is `N2`) |
 * | `P<n>` | the value times 100, `n` decimals, grouped, then `%` (`P` alone is `P2`) |
 *
 * `n` is 0-15. Rounding is half away from zero. A negative result that rounds to zero is
 * written without its sign. Anything else is an error.
 */

/** An exact decimal: `digits` scaled by `10^-scale`. */
export interface ChartDecimal {
  /** `true` when the value is negative. */
  readonly negative: boolean;
  /** Decimal digits of the magnitude, no leading zeros (except a lone `0`). */
  readonly digits: string;
  /** Number of digits after the decimal point. */
  readonly scale: number;
}

const FORMAT_PATTERN = /^([GFNPgfnp])(\d{1,2})?$/;
const MAX_DECIMALS = 15;

interface ParsedFormat {
  kind: 'G' | 'F' | 'N' | 'P';
  decimals: number;
}

function parseFormat(format: string | undefined): ParsedFormat | undefined {
  if (format === undefined || format === '') return { kind: 'G', decimals: 0 };
  const match = FORMAT_PATTERN.exec(format);
  if (!match) return undefined;
  const kind = match[1].toUpperCase() as ParsedFormat['kind'];
  if (kind === 'G') return match[2] === undefined ? { kind, decimals: 0 } : undefined;
  const decimals = match[2] === undefined ? 2 : Number(match[2]);
  return decimals <= MAX_DECIMALS ? { kind, decimals } : undefined;
}

/** True when `format` is in the chart number grammar (`undefined` and `''` mean `G`). */
export function isChartNumberFormat(format: string | undefined): boolean {
  return parseFormat(format) !== undefined;
}

function normalise(negative: boolean, digits: string, scale: number): ChartDecimal {
  let d = digits.replace(/^0+(?=\d)/, '');
  let s = scale;
  while (s > 0 && d.endsWith('0')) {
    d = d.slice(0, -1);
    s--;
  }
  if (d === '0') return { negative: false, digits: '0', scale: 0 };
  return { negative, digits: d, scale: s };
}

/** The shortest decimal that round-trips `value`. Throws for NaN and infinities. */
export function toChartDecimal(value: number): ChartDecimal {
  if (!Number.isFinite(value)) throw new RangeError(`A chart value must be a finite number; got ${String(value)}.`);
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/i.exec(String(value));
  /* c8 ignore next */
  if (!match) throw new RangeError(`Cannot read ${String(value)} as a decimal.`);
  const [, sign, whole, fraction = '', exponent = '0'] = match;
  let digits = whole + fraction;
  let scale = fraction.length - Number(exponent);
  if (scale < 0) {
    digits += '0'.repeat(-scale);
    scale = 0;
  }
  return normalise(sign === '-', digits, scale);
}

function signed(d: ChartDecimal, scale: number): bigint {
  const magnitude = BigInt(d.digits + '0'.repeat(scale - d.scale));
  return d.negative ? -magnitude : magnitude;
}

/** The exact sum of `values`, as a decimal (`0.1 + 0.2` is `0.3`). */
export function sumChartNumbers(values: readonly number[]): ChartDecimal {
  const decimals = values.map(toChartDecimal);
  const scale = decimals.reduce((max, d) => Math.max(max, d.scale), 0);
  const total = decimals.reduce((sum, d) => sum + signed(d, scale), 0n);
  return normalise(total < 0n, (total < 0n ? -total : total).toString(), scale);
}

function group(whole: string): string {
  return whole.replace(/\B(?=(\d{3})+$)/g, ',');
}

/**
 * Formats `value` with `format`. Throws when the format is outside the grammar, or the value
 * is not finite.
 */
export function formatChartNumber(value: number | ChartDecimal, format?: string): string {
  const parsed = parseFormat(format);
  if (!parsed) {
    throw new Error(
      `Unsupported chart number format '${format}'. Use G, F<n>, N<n> or P<n>, with n from 0 to ${MAX_DECIMALS}.`
    );
  }
  const decimal = typeof value === 'number' ? toChartDecimal(value) : value;
  let { digits, scale } = decimal;

  if (parsed.kind === 'P') {
    if (scale >= 2) scale -= 2;
    else {
      digits += '0'.repeat(2 - scale);
      scale = 0;
    }
  }

  if (parsed.kind !== 'G') {
    const n = parsed.decimals;
    if (scale > n) {
      const cut = scale - n;
      const padded = digits.padStart(cut + 1, '0');
      const kept = padded.slice(0, padded.length - cut);
      const next = padded[padded.length - cut];
      digits = next >= '5' ? (BigInt(kept) + 1n).toString() : kept;
    } else {
      digits += '0'.repeat(n - scale);
    }
    scale = n;
  }

  const padded = digits.padStart(scale + 1, '0');
  let whole = padded.slice(0, padded.length - scale);
  let fraction = padded.slice(padded.length - scale);
  if (parsed.kind === 'G') fraction = fraction.replace(/0+$/, '');
  if (parsed.kind === 'N' || parsed.kind === 'P') whole = group(whole);

  const isZero = /^[0,]*$/.test(whole) && /^0*$/.test(fraction);
  const sign = decimal.negative && !isZero ? '-' : '';
  return `${sign}${whole}${fraction ? `.${fraction}` : ''}${parsed.kind === 'P' ? '%' : ''}`;
}
