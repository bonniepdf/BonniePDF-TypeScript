import { describe, it, expect, vi } from 'vitest';
import { PdfCanvas } from '../../src/Drawing/PdfCanvas';
import { Color } from '../../src/Core/Color';
import { StructureTreeBuilder } from '../../src/Rendering/Tagging/StructureTreeBuilder';
import { TaggingContext } from '../../src/Rendering/Tagging/TaggingContext';

/**
 * The artifact fallback wraps unscoped drawing in /Artifact so tagged
 * documents don't leave bare (untagged) real content (PDF/UA 7.1). These tests
 * pin the tightened behaviour: it must not double-wrap content that is already
 * inside an explicit /Artifact region, and it must surface a diagnostic when it
 * auto-artifacts an image rather than silently demoting meaningful content.
 */
describe('PdfCanvas — artifact fallback', () => {
  const imageInfo = { orientation: 1 } as any;

  function taggedCanvas(reportUntaggedImage?: () => void): PdfCanvas {
    const ctx = new TaggingContext(new StructureTreeBuilder());
    const canvas = new PdfCanvas(
      800,
      0,
      0,
      undefined,
      () => '/Im0',
      undefined,
      undefined,
      undefined,
      undefined,
      reportUntaggedImage
    );
    canvas.setTaggingContext(ctx);
    return canvas;
  }

  function count(haystack: string, needle: string): number {
    return haystack.split(needle).length - 1;
  }

  it('wraps a bare vector draw in exactly one /Artifact BMC', () => {
    const canvas = taggedCanvas();
    canvas.fillRect(0, 0, 10, 10, Color.black);
    const out = canvas.getStream().join('');
    expect(count(out, '/Artifact BMC')).toBe(1);
  });

  it('does not double-wrap an image already inside an explicit /Artifact', () => {
    const canvas = taggedCanvas();
    canvas.beginArtifact(); // e.g. a header/footer/slot wrapper
    canvas.drawImage(imageInfo, 0, 0, 10, 10);
    canvas.endArtifact();

    const out = canvas.getStream().join('');
    // One BMC from beginArtifact, none added by the image fallback.
    expect(count(out, '/Artifact BMC')).toBe(1);
    expect(count(out, 'EMC')).toBe(1);
  });

  it('does not artifact an image already inside a structure scope (e.g. /Figure)', () => {
    const canvas = taggedCanvas();
    canvas.beginContainerContent('Figure'); // opens a structure marked-content scope
    canvas.drawImage(imageInfo, 0, 0, 10, 10);
    canvas.endMarkedContent();

    const out = canvas.getStream().join('');
    expect(out).not.toContain('/Artifact BMC');
  });

  it('reports (does not silently demote) a genuinely untagged image', () => {
    const report = vi.fn();
    const canvas = taggedCanvas(report);
    canvas.drawImage(imageInfo, 0, 0, 10, 10);

    expect(report).toHaveBeenCalledTimes(1);
    expect(canvas.getStream().join('')).toContain('/Artifact BMC');
  });

  it('does not report when the image is inside an artifact scope', () => {
    const report = vi.fn();
    const canvas = taggedCanvas(report);
    canvas.beginArtifact();
    canvas.drawImage(imageInfo, 0, 0, 10, 10);
    canvas.endArtifact();

    expect(report).not.toHaveBeenCalled();
  });
});
