import { formatChartNumber } from '../Charts/ChartNumberFormat';

/** Formats a number with the portable G, F, N, or P grammar, with optional prefix and positive sign. */
export function formatNumber(value: number, format?: string, prefix = '', showPositiveSign = false): string {
  const text = formatChartNumber(value, format);
  if (text.startsWith('-')) return '-' + prefix + text.slice(1);
  const sign = showPositiveSign && /[1-9]/.test(text) ? '+' : '';
  return sign + prefix + text;
}
