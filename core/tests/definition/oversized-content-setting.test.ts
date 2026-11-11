import { describe, it, expect } from 'vitest';
import { documentFromDefinition } from '../../src/Definition/fromDefinition';
import { documentToDefinition } from '../../src/Definition/toDefinition';
import { Document } from '../../src/Document';

const definition = (settings: Record<string, unknown>) => ({
  version: 1,
  minorVersion: 0,
  settings,
  pages: [{ content: [] }],
});

describe('oversizedContent in a document definition', () => {
  it('reads and writes the throw token', async () => {
    const doc = await documentFromDefinition(definition({ oversizedContent: 'throw' }));
    expect(doc.settings.oversizedContent).toBe('throw');
    const { definition: written } = await documentToDefinition(doc);
    expect((written.settings as Record<string, unknown>).oversizedContent).toBe('throw');
  });

  it('leaves the default out of the written definition', async () => {
    const { definition: written } = await documentToDefinition(new Document());
    expect((written.settings as Record<string, unknown> | undefined)?.oversizedContent).toBeUndefined();
  });

  it('rejects an unknown token', async () => {
    await expect(documentFromDefinition(definition({ oversizedContent: 'shrink' }))).rejects.toThrow();
  });
});
