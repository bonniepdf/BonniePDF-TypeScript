import { PdfResourceRegistry } from '../../src/Rendering/PdfResourceRegistry';
import { EmbeddedFontInfo } from '../../src/Typography/EmbeddedFontInfo';
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
import { SvgCanvas } from '../../src/Drawing/SvgCanvas';
import { Color } from '../../src/Core/Color';
import { TextAlignment } from '../../src/Elements/Text/TextAlignment';
import { TtfFont } from '../../src/Typography/TrueType/TtfFont';
import { GlyphUsageTracker } from '../../src/Typography/GlyphUsageTracker';
import { FontMetrics } from '../../src/Typography/FontMetrics';

const path = fileURLToPath(new URL('./fixtures/NotoSans-Regular.ttf', import.meta.url));
const bytes = new Uint8Array(readFileSync(path));
const longText = 'ffi AV é e\u0301 a\u0308\u0301 '.repeat(35);

function draw(mode: string, features: boolean, prepared: boolean) {
  const font = TtfFont.loadFromBytes(bytes);
  const spy = vi.spyOn(font, 'shape');
  const tracker = new GlyphUsageTracker(font);
  const run = {
    resourceName: '/F1',
    fontIdentifier: 'font',
    embeddedFont: font,
    tracker,
    canTrackPreparedGlyphs: prepared,
    text: longText,
  };
  const canvas = new PdfCanvas(
    800,
    0,
    0,
    undefined,
    undefined,
    () => font,
    (_, text) => tracker.markUsedText(text),
    undefined,
    () => [run]
  );
  canvas.setTextSpacing(0.2, 0.5);
  if (features) canvas.setTextFeatures({ liga: 0 });
  switch (mode) {
    case 'justify':
      canvas.drawTextJustified(10, 10, longText, Color.black, 12, 'font', 500);
      break;
    case 'rotate':
      canvas.drawTextRotated(10, 10, longText, Color.black, 12, 'font', 30);
      break;
    default:
      canvas.drawText(
        300,
        10,
        longText,
        Color.black,
        12,
        'font',
        mode === 'right' ? TextAlignment.Right : TextAlignment.Center
      );
  }
  expect(Object.keys(run)).not.toContain('glyphs');
  return { content: canvas.getStream().join(''), tracker, calls: spy.mock.calls.length };
}

describe('prepared text painting', () => {
  for (const [mode, features] of [
    ['center', false],
    ['center', true],
    ['right', false],
    ['justify', true],
    ['rotate', false],
  ] as const) {
    it(`preserves ${mode} output and font tracking with features=${features}`, () => {
      const legacy = draw(mode, features, false);
      const prepared = draw(mode, features, true);
      expect(prepared.content).toBe(legacy.content);
      expect(prepared.tracker.getGlyphSources()).toEqual(legacy.tracker.getGlyphSources());
      expect(prepared.tracker.getCidToGlyphMap()).toEqual(legacy.tracker.getCidToGlyphMap());
      expect(prepared.tracker.getUsedGlyphIds()).toEqual(legacy.tracker.getUsedGlyphIds());
      expect(prepared.tracker.getUsedCodepoints()).toEqual(legacy.tracker.getUsedCodepoints());
      expect(prepared.calls).toBe(features ? 2 : 1);
    });
  }

  it('tracks the glyphs of each registration of a shared face against its own tracker', () => {
    const font = TtfFont.loadFromBytes(bytes);
    const resources = new PdfResourceRegistry();
    for (const [name, resourceName] of [
      ['virtual:first', '/F1'],
      ['virtual:second', '/F2'],
    ]) {
      const info = new EmbeddedFontInfo();
      info.font = font;
      info.tracker = new GlyphUsageTracker(font);
      info.resourceName = resourceName;
      info.subsetPrefix = 'ABCDEF';
      resources.embeddedFonts.set(name, info);
      resources.fontNameMap.set(name, resourceName);
    }
    // A run is resolved to the registration its own identifier names, whichever order the registrations
    // were made in, so each one tracks prepared glyphs against its own tracker.
    for (const name of ['virtual:second', 'virtual:first']) {
      const run = resources.resolveTextRuns(name, 'ffi')[0];
      expect(run.canTrackPreparedGlyphs).toBe(true);
      expect(run.tracker).toBe(resources.embeddedFonts.get(name)!.tracker);
      expect(run.resourceName).toBe(resources.embeddedFonts.get(name)!.resourceName);
    }
    const whole = resources.wholeTextFont('virtual:second', 'ffi')!;
    expect(whole.canTrackPreparedGlyphs).toBe(true);
    expect(whole.tracker).toBe(resources.embeddedFonts.get('virtual:second')!.tracker);
  });

  it('keeps the tracking callback for a run that cannot track prepared glyphs', () => {
    const font = TtfFont.loadFromBytes(bytes);
    const resources = new PdfResourceRegistry();
    const info = new EmbeddedFontInfo();
    info.font = font;
    info.tracker = new GlyphUsageTracker(font);
    info.resourceName = '/F1';
    info.subsetPrefix = 'ABCDEF';
    resources.embeddedFonts.set('virtual:only', info);
    resources.fontNameMap.set('virtual:only', '/F1');
    const separate = { ...resources.resolveTextRuns('virtual:only', 'ffi')[0], canTrackPreparedGlyphs: false };
    const callback = vi.fn((name: string, text: string) => resources.trackGlyphUsage(name, text));
    const canvas = new PdfCanvas(800, 0, 0, undefined, undefined, undefined, callback, undefined, () => [separate]);
    canvas.drawText(0, 0, 'ffi', Color.black, 12, 'virtual:only', TextAlignment.Left);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(resources.embeddedFonts.get('virtual:only')!.tracker!.getUsedGlyphIds().size).toBeGreaterThan(1);
  });

  it('reuses one SVG shape between alignment and painting, without mutating resolver runs', () => {
    const font = TtfFont.loadFromBytes(bytes);
    const spy = vi.spyOn(font, 'shape');
    const run = { fontFamily: 'font', font, text: longText };
    const canvas = new SvgCanvas(600, 800, { resolveFont: () => font, resolveRuns: () => [run] });
    canvas.drawText(300, 10, longText, Color.black, 12, 'font', TextAlignment.Center);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(Object.keys(run)).not.toContain('glyphs');
    expect(canvas.toSvg()).toContain('aria-label="ffi AV');
    canvas.setTextFeatures({ liga: 0 });
    canvas.drawText(300, 30, longText, Color.black, 12, 'font', TextAlignment.Right);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('keeps a break predicate independent of later feature mutations', () => {
    const features = { liga: 1 };
    const safe = FontMetrics.getTextBreakPredicate('ffi' + 'a'.repeat(600), path, features);
    features.liga = 0;
    expect(safe(1)).toBe(false);
    expect(safe(2)).toBe(false);
    expect(safe(3)).toBe(true);
    expect(FontMetrics.getTextBreakPredicate('ffi', path, features)(1)).toBe(true);
    expect(FontMetrics.getTextBreakPredicate('ffi', 'Helvetica')(1)).toBe(true);
  });
});
