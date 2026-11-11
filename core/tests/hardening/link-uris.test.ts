import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { Hyperlink } from '../../src/Core/Hyperlink';

/**
 * A PDF URI action holds a 7-bit ASCII string (ISO 32000-1, 12.6.4.7), so a
 * link containing characters outside ASCII has to be percent-encoded as UTF-8
 * before it is written. Writing the characters as they are truncates each one
 * to a single byte, and the link opens a different address.
 */

async function writtenUri(uri: string): Promise<string | undefined> {
  const doc = new Document();
  doc.add(new Hyperlink('link', uri));
  const bytes = await doc.generateBytesAsync();
  const pdf = Buffer.from(bytes).toString('latin1');
  return pdf.match(/\/URI \(((?:\\.|[^\\)])*)\)/)?.[1];
}

describe('link URIs', () => {
  it('control: an ASCII URI is written unchanged', async () => {
    expect(await writtenUri('https://example.com/a?b=c#d')).toBe('https://example.com/a?b=c#d');
  });

  it('percent-encodes characters outside ASCII as UTF-8', async () => {
    expect(await writtenUri('https://example.com/café/日本')).toBe('https://example.com/caf%C3%A9/%E6%97%A5%E6%9C%AC');
  });

  it('percent-encodes spaces', async () => {
    expect(await writtenUri('https://example.com/a b')).toBe('https://example.com/a%20b');
  });

  it('does not double-encode a URI that is already percent-encoded', async () => {
    expect(await writtenUri('https://example.com/caf%C3%A9')).toBe('https://example.com/caf%C3%A9');
  });
});
