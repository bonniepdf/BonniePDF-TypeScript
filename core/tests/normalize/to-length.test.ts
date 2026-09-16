import { describe, it, expect } from 'vitest';
import { toLength, toOptionalLength } from '../../src/Normalize/toLength';
import { toThickness } from '../../src/Normalize/toThickness';
import { Unit } from '../../src/Core/Unit';

/**
 * The length grammar - shared conformance fixture `layout/length-grammar`.
 * Every public authoring position that takes a measurement accepts a number of
 * points, a unit-suffixed token, or `{ value, unit }`, and normalises to points
 * on write (`the specification` §4A.3, §4A.6).
 *
 * Mirrors the .NET LengthGrammarTests.
 */

describe('toLength', () => {
  it('passes a bare number through as points', () => {
    expect(toLength(72)).toBe(72);
    expect(toLength(0)).toBe(0);
    expect(toLength(-12.5)).toBe(-12.5);
  });

  it('converts each unit token to points', () => {
    expect(toLength('72pt')).toBeCloseTo(72, 6);
    expect(toLength('1in')).toBeCloseTo(72, 6);
    expect(toLength('2.54cm')).toBeCloseTo(72, 6);
    expect(toLength('25.4mm')).toBeCloseTo(72, 6);
  });

  it('accepts the { value, unit } form', () => {
    expect(toLength({ value: 1, unit: Unit.Inch })).toBeCloseTo(72, 6);
    expect(toLength({ value: 10, unit: Unit.Millimeter })).toBeCloseTo(28.3465, 3);
  });

  it('is case-insensitive and tolerates space before the unit', () => {
    expect(toLength('1IN' as '1in')).toBeCloseTo(72, 6);
    expect(toLength('1 in' as '1in')).toBeCloseTo(72, 6);
    expect(toLength('  2.5 CM  ' as '2.5cm')).toBeCloseTo(toLength('2.5cm'), 6);
  });

  it('accepts signs, bare decimals, and exponents', () => {
    expect(toLength('-1in' as '1in')).toBeCloseTo(-72, 6);
    expect(toLength('+1in' as '1in')).toBeCloseTo(72, 6);
    expect(toLength('.5in' as '0.5in')).toBeCloseTo(36, 6);
    expect(toLength('1e1mm' as '10mm')).toBeCloseTo(toLength('10mm'), 6);
  });

  it('throws on an unknown unit rather than silently reading zero', () => {
    expect(() => toLength('10km' as '10mm')).toThrow(/Invalid length/);
    expect(() => toLength('inch' as '1in')).toThrow(/Invalid length/);
    expect(() => toLength('12' as '12pt')).toThrow(/Invalid length/);
    expect(() => toLength('1in please' as '1in')).toThrow(/Invalid length/);
  });

  it('names the accepted forms in the failure', () => {
    expect(() => toLength('10km' as '10mm')).toThrow(/unit token/);
  });

  it('passes undefined through for optional positions', () => {
    expect(toOptionalLength(undefined)).toBeUndefined();
    expect(toOptionalLength('1in')).toBeCloseTo(72, 6);
  });
});

describe('lengths inside the spacing grammar', () => {
  it('accepts a uniform length', () => {
    expect(toThickness('1in').top).toBeCloseTo(72, 6);
  });

  it('accepts lengths in the [h, v] form', () => {
    const t = toThickness(['1in', 12]);
    expect(t.left).toBeCloseTo(72, 6);
    expect(t.top).toBe(12);
  });

  it('accepts lengths in the [l, t, r, b] form', () => {
    const t = toThickness(['1in', '10mm', 0, '2.54cm']);
    expect(t.left).toBeCloseTo(72, 6);
    expect(t.top).toBeCloseTo(28.3465, 3);
    expect(t.right).toBe(0);
    expect(t.bottom).toBeCloseTo(72, 6);
  });

  it('accepts lengths per side by name, with omitted sides zero', () => {
    const t = toThickness({ top: '0.5in', bottom: 6 });
    expect(t.top).toBeCloseTo(36, 6);
    expect(t.bottom).toBe(6);
    expect(t.left).toBe(0);
    expect(t.right).toBe(0);
  });

  it('reads { value, unit } as a uniform length, not a per-side object', () => {
    const t = toThickness({ value: 1, unit: Unit.Inch });
    expect(t.top).toBeCloseTo(72, 6);
    expect(t.left).toBeCloseTo(72, 6);
  });
});
