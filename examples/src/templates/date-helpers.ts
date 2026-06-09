/**
 * Shared date-formatting utilities for BonniePDF examples.
 *
 * All methods are static - import the class and call directly:
 *   import { DateHelper } from './date-helpers'
 *   const { quarter, year, endDate } = DateHelper.previousQuarter()
 */
export class DateHelper {
  private static readonly DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // ── Quarter helpers ─────────────────────────────────────────────────────────

  /** Returns the calendar quarter (1–4) for a given date. */
  static quarter(date: Date): number {
    return Math.floor(date.getMonth() / 3) + 1;
  }

  /**
   * Returns the last day of a given quarter / year.
   * Q1 → 31 Mar   Q2 → 30 Jun   Q3 → 30 Sep   Q4 → 31 Dec
   */
  static quarterEndDate(quarter: number, year: number): Date {
    // Month index (0-based) of the last month of each quarter
    const lastMonths = [2, 5, 8, 11];
    const lastDays = [31, 30, 30, 31];
    return new Date(year, lastMonths[quarter - 1], lastDays[quarter - 1]);
  }

  /**
   * Returns metadata for the most recently *completed* quarter relative to
   * `date` (defaults to today).  Financial reports are typically issued for the
   * quarter that just closed, not the one currently in progress.
   *
   * @example
   *   // Called on 14 May 2026  →  { quarter: 1, year: 2026, endDate: 2026-03-31 }
   *   const { quarter, year, endDate } = DateHelper.previousQuarter()
   */
  static previousQuarter(date: Date = new Date()): { quarter: number; year: number; endDate: Date } {
    const q = DateHelper.quarter(date);
    const y = date.getFullYear();
    const prevQ = q === 1 ? 4 : q - 1;
    const prevY = q === 1 ? y - 1 : y;
    return { quarter: prevQ, year: prevY, endDate: DateHelper.quarterEndDate(prevQ, prevY) };
  }

  // ── Formatting ──────────────────────────────────────────────────────────────

  /**
   * Formats a date as "D Month YYYY" (no zero-padding on the day).
   * @example  DateHelper.formatLong(new Date(2026, 4, 14))  →  "14 May 2026"
   */
  static formatLong(date: Date): string {
    return DateHelper.DATE_FORMAT.format(date);
  }

  /**
   * Returns a "Generated D Month YYYY" stamp using today's date by default.
   * @example  DateHelper.generatedStamp()  →  "Generated 14 May 2026"
   */
  static generatedStamp(date: Date = new Date()): string {
    return `Generated ${DateHelper.formatLong(date)}`;
  }

  /**
   * Returns a short quarter label such as "Q1 2026".
   */
  static quarterLabel(quarter: number, year: number): string {
    return `Q${quarter} ${year}`;
  }

  /**
   * Returns a report title such as "Q1 2026 Financial Report".
   */
  static reportTitle(quarter: number, year: number, suffix = 'Financial Report'): string {
    return `${DateHelper.quarterLabel(quarter, year)} ${suffix}`;
  }
}
