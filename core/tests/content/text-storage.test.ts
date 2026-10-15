import { describe, it, expect } from 'vitest';
import { TextBlock } from '../../src/Elements/Text/TextBlock';

// Mirrors the .NET TextStorageTests: feature overrides are stored only when set, and
// paragraph metadata only when paragraph controls are in use, without changing layout.

describe('text element storage', () => {
  it('keeps feature overrides owned, validated and independent after a reset', () => {
    const first = new TextBlock('ffi');
    const second = new TextBlock('ffi');
    expect(first.fontFeatures).toBeUndefined();
    first.fontFeatures = undefined;
    const input: Record<string, number> = { liga: 0 };
    first.fontFeatures = input;
    input.liga = 1;
    expect(first.fontFeatures!.liga).toBe(0);
    expect(second.fontFeatures).toBeUndefined();
    expect(() => (first.fontFeatures = { bad: 1 })).toThrow();
    expect(first.fontFeatures!.liga).toBe(0);
    first.fontFeatures = undefined;
    expect(first.fontFeatures).toBeUndefined();
    expect(() => (first.fontFeatures = { liga: -1 })).toThrow();
    expect(first.fontFeatures).toBeUndefined();
    first.fontFeatures = input;
    expect(first.fontFeatures!.liga).toBe(1);
  });

  it.each([
    [0, 0],
    [15, 0],
    [0, 9],
    [15, 9],
  ])('keeps clamped layout across width changes and paragraph resets (indent %d, spacing %d)', (indent, spacing) => {
    const text =
      'A deliberately long paragraph wraps across several lines.\nAnother paragraph also wraps across several lines.';
    const make = (i: number, s: number) =>
      new TextBlock(text, { fontSize: 12, maxLines: 2, firstLineIndent: i, paragraphSpacing: s });
    const block = make(indent, spacing);
    for (const width of [100, 400, 70]) {
      const expected = make(indent, spacing).measureHeight(width);
      expect(block.measureHeight(width)).toBe(expected);
      expect(block.measureHeight(width)).toBe(expected);
    }
    block.firstLineIndent = 0;
    block.paragraphSpacing = 0;
    block.resetState();
    expect(block.measureHeight(400)).toBe(make(0, 0).measureHeight(400));
    block.firstLineIndent = 15;
    block.paragraphSpacing = 9;
    block.resetState();
    expect(block.measureHeight(400)).toBe(make(15, 9).measureHeight(400));
  });
});
