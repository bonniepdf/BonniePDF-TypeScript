// Generated chart source. Do not edit here; the source manifest records its provenance.
import { formatChartNumber } from '../ChartNumberFormat';

/**
 * Fills a text template. `{name}` inserts a token; a numeric token takes an optional format, `{name:P0}`, from the chart
 * number formats (`G` when omitted). A token the template names but the caller did not supply throws.
 */
export function applyChartTemplate(template: string, tokens: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)(?::([^}]+))?\}/g, (_, name: string, format: string | undefined) => {
    if (!Object.prototype.hasOwnProperty.call(tokens, name)) throw new RangeError(`Unknown template token '${name}'.`);
    const value = tokens[name];
    return typeof value === 'number' ? formatChartNumber(value, format ?? 'G') : value;
  });
}
