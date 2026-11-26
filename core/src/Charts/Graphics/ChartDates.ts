// Generated chart source. Do not edit here; the source manifest records its provenance.
/** A date as an ISO 8601 string (`2026-11-24`, `2026-11-24T09:30:00Z`), a `Date`, or milliseconds since the Unix epoch. */
export type ChartDateInput = string | number | Date;

/** A time axis: where it starts and ends, its tick unit and the tick label format. */
export interface ChartTimeAxis {
  /** The left edge. Defaults to the earliest date. */
  minDate?: ChartDateInput;
  /** The right edge. Defaults to the latest date. */
  maxDate?: ChartDateInput;
  /** `auto` (default), `year`, `quarter`, `month`, `week`, `day` or `hour`. */
  unit?: 'auto' | ChartTimeUnit;
  /** Tick label format: `yyyy`, `yy`, `Q`, `MMM`, `MM`, `dd`, `d`, `HH`, `mm` and `'literal'`. Defaults per unit. */
  format?: string;
  /** Draw vertical gridlines at the ticks (default `true`). */
  showGridLines?: boolean;
}

/** Calendar units a time axis ticks in. */
export type ChartTimeUnit = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour';

const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const UNITS: readonly ChartTimeUnit[] = ['hour', 'day', 'week', 'month', 'quarter', 'year'];

/** Days since 1970-01-01 of a proleptic Gregorian date. */
function daysFromCivil(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const doy = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** The proleptic Gregorian date of a day count since 1970-01-01. */
function civilFromDays(days: number): { year: number; month: number; day: number } {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  return { year: yoe + era * 400 + (month <= 2 ? 1 : 0), month, day };
}

function daysInMonth(year: number, month: number): number {
  return [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

/**
 * Parses an ISO 8601 date (`2026-11-24`) or UTC date-time (`2026-11-24T09:30:00Z`) into milliseconds since the Unix epoch.
 * A `Date` or a number of milliseconds is accepted as is. There is no time-zone database: callers convert first.
 */
export function parseChartDate(input: string | number | Date): number {
  if (input instanceof Date) return input.getTime();
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new RangeError('A chart date must be finite.');
    return input;
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?Z)?$/.exec(input);
  if (m === null) throw new RangeError(`'${input}' is not an ISO 8601 date or UTC date-time.`);
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const [hour, minute, second] = [Number(m[4] ?? 0), Number(m[5] ?? 0), Number(m[6] ?? 0)];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month) || hour > 23 || minute > 59 || second > 59) throw new RangeError(`'${input}' is not a valid date.`);
  return daysFromCivil(year, month, day) * MS_PER_DAY + hour * MS_PER_HOUR + minute * 60_000 + second * 1000;
}

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

const DEFAULT_FORMATS: Readonly<Record<ChartTimeUnit, string>> = {
  year: 'yyyy',
  quarter: "'Q'Q yyyy",
  month: 'MMM yyyy',
  week: 'dd MMM',
  day: 'dd MMM',
  hour: 'HH:mm',
};

/** The default tick format of a unit. */
export function defaultDateFormat(unit: ChartTimeUnit): string {
  return DEFAULT_FORMATS[unit];
}

/**
 * Formats milliseconds since the epoch. Tokens: `yyyy`, `yy`, `Q` (quarter), `MMM` (English abbreviation), `MM`, `dd`, `d`, `HH`, `mm`;
 * text in single quotes is literal. Culture-invariant, always UTC.
 */
export function formatChartDate(ms: number, format: string): string {
  const days = Math.floor(ms / MS_PER_DAY);
  const { year, month, day } = civilFromDays(days);
  const rest = ms - days * MS_PER_DAY;
  const hour = Math.floor(rest / MS_PER_HOUR);
  const minute = Math.floor((rest - hour * MS_PER_HOUR) / 60_000);
  let out = '';
  for (let i = 0; i < format.length; ) {
    if (format[i] === "'") {
      const end = format.indexOf("'", i + 1);
      if (end < 0) throw new RangeError('A date format has an unterminated quote.');
      out += format.slice(i + 1, end);
      i = end + 1;
    } else if (format.startsWith('yyyy', i)) {
      out += pad(year, 4);
      i += 4;
    } else if (format.startsWith('yy', i)) {
      out += pad(year % 100);
      i += 2;
    } else if (format.startsWith('MMM', i)) {
      out += MONTHS[month - 1];
      i += 3;
    } else if (format.startsWith('MM', i)) {
      out += pad(month);
      i += 2;
    } else if (format.startsWith('dd', i)) {
      out += pad(day);
      i += 2;
    } else if (format[i] === 'd') {
      out += String(day);
      i += 1;
    } else if (format.startsWith('HH', i)) {
      out += pad(hour);
      i += 2;
    } else if (format.startsWith('mm', i)) {
      out += pad(minute);
      i += 2;
    } else if (format[i] === 'Q') {
      out += String(Math.floor((month - 1) / 3) + 1);
      i += 1;
    }
    else out += format[i++];
  }
  return out;
}

/** The start of the unit that contains `ms`: 1 January, the first of a quarter or month, an ISO Monday, midnight or the hour. */
export function startOfUnit(ms: number, unit: ChartTimeUnit): number {
  const days = Math.floor(ms / MS_PER_DAY);
  const { year, month } = civilFromDays(days);
  switch (unit) {
    case 'year':
      return daysFromCivil(year, 1, 1) * MS_PER_DAY;
    case 'quarter':
      return daysFromCivil(year, Math.floor((month - 1) / 3) * 3 + 1, 1) * MS_PER_DAY;
    case 'month':
      return daysFromCivil(year, month, 1) * MS_PER_DAY;
    case 'week': {
      const weekday = (((days + 4) % 7) + 7) % 7; // 0 = Sunday
      return (days - ((weekday + 6) % 7)) * MS_PER_DAY;
    }
    case 'day':
      return days * MS_PER_DAY;
    default:
      return Math.floor(ms / MS_PER_HOUR) * MS_PER_HOUR;
  }
}

/** The start of the unit after the one starting at `ms`. */
export function nextUnit(ms: number, unit: ChartTimeUnit): number {
  const days = Math.floor(ms / MS_PER_DAY);
  const { year, month } = civilFromDays(days);
  switch (unit) {
    case 'year':
      return daysFromCivil(year + 1, 1, 1) * MS_PER_DAY;
    case 'quarter':
    case 'month': {
      const step = unit === 'quarter' ? 3 : 1;
      const total = year * 12 + (month - 1) + step;
      return daysFromCivil(Math.floor(total / 12), (total % 12) + 1, 1) * MS_PER_DAY;
    }
    case 'week':
      return ms + 7 * MS_PER_DAY;
    case 'day':
      return ms + MS_PER_DAY;
    default:
      return ms + MS_PER_HOUR;
  }
}

/** The tick positions of `unit` from `min` to `max`: every unit start within the range. */
export function timeTicks(min: number, max: number, unit: ChartTimeUnit): number[] {
  const out: number[] = [];
  let t = startOfUnit(min, unit);
  if (t < min) t = nextUnit(t, unit);
  while (t <= max && out.length < 10_000) {
    out.push(t);
    t = nextUnit(t, unit);
  }
  return out;
}

/** The smallest unit from hour to year whose tick count fits `plotLength / 64` ticks. */
export function chooseTimeUnit(min: number, max: number, plotLength: number): ChartTimeUnit {
  const limit = Math.max(1, Math.floor(plotLength / 64));
  for (const unit of UNITS) if (timeTicks(min, max, unit).length <= limit) return unit;
  return 'year';
}
