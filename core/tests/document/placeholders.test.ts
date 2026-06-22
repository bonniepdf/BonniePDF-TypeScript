import { describe, it, expect, beforeEach } from 'vitest';
import { Placeholders } from '../../src/Prototyping/Placeholders';
import { Color } from '../../src/Core/Color';

describe('Placeholders', () => {
  beforeEach(() => {
    Placeholders.reset();
  });

  describe('text', () => {
    it('returns a non-empty word', () => {
      expect(Placeholders.word().length).toBeGreaterThan(0);
    });

    it('returns a label with at least two words', () => {
      expect(Placeholders.label()).toContain(' ');
    });

    it('returns a sentence ending with a period', () => {
      expect(Placeholders.sentence()).toMatch(/\.$/);
    });

    it('returns a paragraph with multiple sentences', () => {
      const p = Placeholders.paragraph();
      expect(p.split('.').length).toBeGreaterThan(2);
    });

    it('returns multiple paragraphs separated by double newlines', () => {
      const p = Placeholders.paragraphs(3);
      expect(p.split('\n\n').length).toBe(3);
    });
  });

  describe('identity', () => {
    it('returns a name with first and last', () => {
      const name = Placeholders.name();
      expect(name.split(' ').length).toBe(2);
    });

    it('returns a plausible email', () => {
      expect(Placeholders.email()).toMatch(/.+@.+\..+/);
    });

    it('returns a phone number with area code', () => {
      expect(Placeholders.phoneNumber()).toMatch(/\(\d+\) \d+-\d+/);
    });

    it('returns a company name', () => {
      expect(Placeholders.companyName().length).toBeGreaterThan(0);
    });

    it('returns a department', () => {
      expect(Placeholders.department().length).toBeGreaterThan(0);
    });

    it('returns a role', () => {
      expect(Placeholders.role().length).toBeGreaterThan(0);
    });

    it('returns a location', () => {
      expect(Placeholders.location().length).toBeGreaterThan(0);
    });
  });

  describe('numeric', () => {
    it('returns integer within range', () => {
      const n = Placeholders.integer(10, 50);
      expect(n).toBeGreaterThanOrEqual(10);
      expect(n).toBeLessThanOrEqual(50);
    });

    it('returns decimal with correct precision', () => {
      const d = Placeholders.decimal(0, 100, 2);
      const parts = d.toString().split('.');
      if (parts.length === 2) {
        expect(parts[1].length).toBeLessThanOrEqual(2);
      }
    });

    it('returns a percent string', () => {
      expect(Placeholders.percent()).toMatch(/^\d+%$/);
    });

    it('returns a currency string', () => {
      expect(Placeholders.currency()).toMatch(/^\$/);
    });
  });

  describe('temporal', () => {
    it('returns a short date', () => {
      expect(Placeholders.shortDate()).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('returns a long date', () => {
      expect(Placeholders.longDate()).toMatch(/^\d+ \w+ \d{4}$/);
    });

    it('returns a month label', () => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      expect(months).toContain(Placeholders.monthLabel());
    });
  });

  describe('colors', () => {
    it('returns a Color instance for background', () => {
      const c = Placeholders.backgroundColor();
      expect(c).toBeInstanceOf(Color);
    });

    it('returns a Color instance for accent', () => {
      const c = Placeholders.color();
      expect(c).toBeInstanceOf(Color);
    });
  });

  describe('data', () => {
    it('returns invoice line items', () => {
      const items = Placeholders.invoiceLines(3);
      expect(items).toHaveLength(3);
      for (const item of items) {
        expect(item.service.length).toBeGreaterThan(0);
        expect(item.quantity).toBeGreaterThanOrEqual(1);
        expect(item.total).toBe(item.quantity * item.unitPrice);
      }
    });

    it('returns table rows with correct dimensions', () => {
      const rows = Placeholders.tableRows(4, 3);
      expect(rows).toHaveLength(4);
      for (const row of rows) {
        expect(row).toHaveLength(3);
      }
    });

    it('returns monthly values', () => {
      const values = Placeholders.monthlyValues(12, 100, 500);
      expect(values).toHaveLength(12);
      for (const v of values) {
        expect(v).toBeGreaterThanOrEqual(100);
        expect(v).toBeLessThanOrEqual(500);
      }
    });
  });

  describe('image', () => {
    it('returns valid PNG bytes', () => {
      const img = Placeholders.image({ width: 10, height: 10 });
      expect(img).toBeInstanceOf(Uint8Array);
      // PNG signature
      expect(img[0]).toBe(137);
      expect(img[1]).toBe(80);
      expect(img[2]).toBe(78);
      expect(img[3]).toBe(71);
    });
  });

  describe('seeded source', () => {
    it('produces deterministic output', () => {
      const a = Placeholders.withSeed(123);
      const b = Placeholders.withSeed(123);
      expect(a.name()).toBe(b.name());
      expect(a.sentence()).toBe(b.sentence());
      expect(a.integer(0, 1000)).toBe(b.integer(0, 1000));
    });

    it('different seeds produce different output', () => {
      const a = Placeholders.withSeed(1);
      const b = Placeholders.withSeed(2);
      const aName = a.name();
      const bName = b.name();
      // Not guaranteed to differ, but very likely with different seeds
      expect(aName).not.toBe(bName);
    });
  });
});
