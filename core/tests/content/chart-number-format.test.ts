import { describe, it, expect } from 'vitest';
import {
  formatChartNumber,
  isChartNumberFormat,
  sumChartNumbers,
  toChartDecimal,
} from '../../src/Charts/ChartNumberFormat';
import { ChartDataPoint } from '../../src/Charts/Models/ChartDataPoint';

/**
 * Chart number formatting - shared conformance fixture `charts/number-format` (spec 15 §19).
 * The same culture-invariant grammar, on the value's decimal digits, in both implementations.
 *
 * Mirrors the .NET ChartNumberFormatTests.
 */

const BY_FORMAT: Record<string, Record<string, string>> = {
  G: {
    '0': '0',
    '1': '1',
    '12.5': '12.5',
    '2.5': '2.5',
    '3.5': '3.5',
    '-3.5': '-3.5',
    '0.5': '0.5',
    '-0.5': '-0.5',
    '100': '100',
    '0.1': '0.1',
    '0.3': '0.3',
    '1234.5': '1234.5',
    '10000': '10000',
    '999.995': '999.995',
    '1.005': '1.005',
    '-0.001': '-0.001',
    '1234567.891': '1234567.891',
    '-1234567.5': '-1234567.5',
    '0.000001': '0.000001',
    '0.0000001': '0.0000001',
    '1000000000000000000000': '1000000000000000000000',
  },
  F0: {
    '0': '0',
    '1': '1',
    '12.5': '13',
    '2.5': '3',
    '3.5': '4',
    '-3.5': '-4',
    '0.5': '1',
    '-0.5': '-1',
    '100': '100',
    '0.1': '0',
    '0.3': '0',
    '1234.5': '1235',
    '10000': '10000',
    '999.995': '1000',
    '1.005': '1',
    '-0.001': '0',
    '1234567.891': '1234568',
    '-1234567.5': '-1234568',
    '0.000001': '0',
    '0.0000001': '0',
    '1000000000000000000000': '1000000000000000000000',
  },
  F2: {
    '0': '0.00',
    '1': '1.00',
    '12.5': '12.50',
    '2.5': '2.50',
    '3.5': '3.50',
    '-3.5': '-3.50',
    '0.5': '0.50',
    '-0.5': '-0.50',
    '100': '100.00',
    '0.1': '0.10',
    '0.3': '0.30',
    '1234.5': '1234.50',
    '10000': '10000.00',
    '999.995': '1000.00',
    '1.005': '1.01',
    '-0.001': '0.00',
    '1234567.891': '1234567.89',
    '-1234567.5': '-1234567.50',
    '0.000001': '0.00',
    '0.0000001': '0.00',
    '1000000000000000000000': '1000000000000000000000.00',
  },
  N0: {
    '0': '0',
    '1': '1',
    '12.5': '13',
    '2.5': '3',
    '3.5': '4',
    '-3.5': '-4',
    '0.5': '1',
    '-0.5': '-1',
    '100': '100',
    '0.1': '0',
    '0.3': '0',
    '1234.5': '1,235',
    '10000': '10,000',
    '999.995': '1,000',
    '1.005': '1',
    '-0.001': '0',
    '1234567.891': '1,234,568',
    '-1234567.5': '-1,234,568',
    '0.000001': '0',
    '0.0000001': '0',
    '1000000000000000000000': '1,000,000,000,000,000,000,000',
  },
  N2: {
    '0': '0.00',
    '1': '1.00',
    '12.5': '12.50',
    '2.5': '2.50',
    '3.5': '3.50',
    '-3.5': '-3.50',
    '0.5': '0.50',
    '-0.5': '-0.50',
    '100': '100.00',
    '0.1': '0.10',
    '0.3': '0.30',
    '1234.5': '1,234.50',
    '10000': '10,000.00',
    '999.995': '1,000.00',
    '1.005': '1.01',
    '-0.001': '0.00',
    '1234567.891': '1,234,567.89',
    '-1234567.5': '-1,234,567.50',
    '0.000001': '0.00',
    '0.0000001': '0.00',
    '1000000000000000000000': '1,000,000,000,000,000,000,000.00',
  },
  P0: {
    '0': '000%',
    '1': '100%',
    '12.5': '1,250%',
    '2.5': '250%',
    '3.5': '350%',
    '-3.5': '-350%',
    '0.5': '50%',
    '-0.5': '-50%',
    '100': '10,000%',
    '0.1': '10%',
    '0.3': '30%',
    '1234.5': '123,450%',
    '10000': '1,000,000%',
    '999.995': '100,000%',
    '1.005': '101%',
    '-0.001': '0%',
    '1234567.891': '123,456,789%',
    '-1234567.5': '-123,456,750%',
    '0.000001': '0%',
    '0.0000001': '0%',
    '1000000000000000000000': '100,000,000,000,000,000,000,000%',
  },
  P1: {
    '0': '000.0%',
    '1': '100.0%',
    '12.5': '1,250.0%',
    '2.5': '250.0%',
    '3.5': '350.0%',
    '-3.5': '-350.0%',
    '0.5': '50.0%',
    '-0.5': '-50.0%',
    '100': '10,000.0%',
    '0.1': '10.0%',
    '0.3': '30.0%',
    '1234.5': '123,450.0%',
    '10000': '1,000,000.0%',
    '999.995': '99,999.5%',
    '1.005': '100.5%',
    '-0.001': '-0.1%',
    '1234567.891': '123,456,789.1%',
    '-1234567.5': '-123,456,750.0%',
    '0.000001': '0.0%',
    '0.0000001': '0.0%',
    '1000000000000000000000': '100,000,000,000,000,000,000,000.0%',
  },
};

const DEFAULTS: [string, string, string][] = [
  ['1234.5', '', '1234.5'],
  ['1234.5', 'F', '1234.50'],
  ['1234.5', 'N', '1,234.50'],
  ['0.256', 'P', '25.60%'],
  ['1234.567', 'f1', '1234.6'],
  ['1234.567', 'n0', '1,235'],
  ['0.1', 'F15', '0.100000000000000'],
];

const UNSUPPORTED = ['C0', 'C', 'E2', 'D', 'D4', 'X', 'G2', 'F16', 'N99', '0.00', '#,##0', 'N-1', 'F 2', 'currency'];

const SUMS: { values: string[]; format: string; expect: string }[] = [
  {
    values: ['0.1', '0.2'],
    format: 'G',
    expect: '0.3',
  },
  {
    values: ['0.1', '0.2', '1234.5678'],
    format: 'G',
    expect: '1234.8678',
  },
  {
    values: ['0.1', '0.2', '1234.5678'],
    format: 'F2',
    expect: '1234.87',
  },
  {
    values: ['1234.5', '2500', '-0.5'],
    format: 'N0',
    expect: '3,734',
  },
  {
    values: ['0.7', '0.1'],
    format: 'P0',
    expect: '80%',
  },
  {
    values: ['1e-7', '2e-7'],
    format: 'G',
    expect: '0.0000003',
  },
];

describe('formatChartNumber', () => {
  for (const [format, results] of Object.entries(BY_FORMAT)) {
    it(`formats every fixture value under ${format}`, () => {
      for (const [value, expected] of Object.entries(results)) {
        expect(formatChartNumber(Number(value), format), `${format} of ${value}`).toBe(expected);
      }
    });
  }

  it('takes the default number of decimals, an empty format as G, and any letter case', () => {
    for (const [value, format, expected] of DEFAULTS) {
      expect(formatChartNumber(Number(value), format), `'${format}' of ${value}`).toBe(expected);
    }
    expect(formatChartNumber(1234.5)).toBe('1234.5');
  });

  it('rejects everything outside the grammar', () => {
    for (const format of UNSUPPORTED) {
      expect(isChartNumberFormat(format), format).toBe(false);
      expect(() => formatChartNumber(1, format), format).toThrow(/Unsupported chart number format/);
    }
  });

  it('rejects values that are not finite', () => {
    expect(() => formatChartNumber(Number.NaN)).toThrow();
    expect(() => formatChartNumber(Number.POSITIVE_INFINITY)).toThrow();
  });

  it('formats a double as its shortest decimal, not its binary expansion', () => {
    expect(toChartDecimal(0.1 + 0.2).digits).toBe('30000000000000004');
    expect(formatChartNumber(0.1, 'F15')).toBe('0.100000000000000');
    expect(formatChartNumber(1.005, 'F2')).toBe('1.01');
  });
});

describe('sumChartNumbers', () => {
  it('adds the values exactly, then formats', () => {
    for (const s of SUMS) {
      const total = formatChartNumber(sumChartNumbers(s.values.map(Number)), s.format);
      expect(total, `${s.values.join('+')} ${s.format}`).toBe(s.expect);
    }
  });
});

describe('ChartDataPoint.formattedValue', () => {
  it('honours labelFormat', () => {
    const point = new ChartDataPoint({ label: 'x', value: 1234.5, labelFormat: 'N0' });
    expect(point.formattedValue).toBe('1,235');
  });

  it('defaults to G', () => {
    expect(new ChartDataPoint({ label: 'x', value: 12.5 }).formattedValue).toBe('12.5');
  });

  it('throws for an unsupported format', () => {
    const point = new ChartDataPoint({ label: 'x', value: 1, labelFormat: 'C0' });
    expect(() => point.formattedValue).toThrow(/Unsupported chart number format/);
  });
});
