import { expect, test } from 'vitest';
import { generateCode } from '../src/generate';
const definition = {
  version: 1,
  minorVersion: 0,
  settings: { margin: 36, pageSize: 'a4' },
  pages: [
    {
      content: [
        {
          type: 'VerticalStack',
          id: 'body',
          spacing: 8,
          children: [
            { type: 'Heading', id: 'title', text: 'Invoice', fontSize: 24 },
            { type: 'TextBlock', text: 'Customer details' },
            {
              type: 'Table',
              id: 'items',
              columns: [2, 1],
              header: [['Description', 'Amount']],
              rows: [['Design', '$100.00']],
            },
          ],
        },
      ],
    },
  ],
};
test('emits deterministic native construction in both languages', async () => {
  const options = { documentName: 'Invoice' };
  const first = await generateCode(definition, options);
  expect(first.diagnostics).toEqual([]);
  expect(first.files).toHaveLength(2);
  expect(first.files[0].content).toContain('new Heading');
  expect(first.files[1].content).toContain('new Heading');
  expect(first.files[0].content).not.toContain('fromDefinition');
  expect(first.files[1].content).not.toContain('FromDefinition');
  expect(await generateCode(definition, options)).toEqual(first);
});
test('emits component notes in the selected language and maps stable IDs', async () => {
  const result = await generateCode(definition, {
    annotations: {
      version: 1,
      sections: [],
      notes: [
        {
          id: 'explain',
          target: { kind: 'node', nodeId: 'title' },
          placement: 'before',
          text: 'The title.\n*/ harmless();',
          overrides: { csharp: 'The C# title.' },
        },
      ],
    },
  });
  expect(result.diagnostics).toEqual([]);
  expect(result.files[0].content).toContain('// The title.\n  // */ harmless();');
  expect(result.files[1].content).toContain('// The C# title.');
  for (const range of result.sourceMap.filter(x => x.nodeId === 'title')) {
    const file = result.files.find(x => x.language === range.language)!;
    expect(file.content.split('\n')[range.startLine - 1]).toContain('new Heading');
  }
});
test('rejects unsupported behaviour and unsafe names without returning partial code', async () => {
  expect((await generateCode(definition, { documentName: 'X; escape()' })).files).toEqual([]);
  const unsupported = structuredClone(definition) as any;
  const result = await generateCode(unsupported, {
    annotations: {
      version: 1,
      notes: [],
      sections: [{ id: 'helper', label: 'Title', nodeIds: ['title'], helperName: 'BuildTitle' }],
    },
  });
  expect(result.files).toEqual([]);
  expect(result.diagnostics).toContainEqual(expect.objectContaining({ code: 'unsupported-helper-section' }));
});

test('rejects unsupported generation options and keyword identifiers explicitly', async () => {
  expect((await generateCode(definition, { typescript: { profile: 'unknown' } } as any)).diagnostics).toContainEqual(
    expect.objectContaining({ code: 'unknown-option' })
  );
  expect((await generateCode(definition, { documentName: 'foreach' })).files).toEqual([]);
  expect((await generateCode(definition, { targets: 'typescript' } as any)).diagnostics[0].code).toBe(
    'unsupported-target'
  );
});

test('section headings cannot enable compiler or formatter directives', async () => {
  const result = await generateCode(definition, {
    annotations: { version: 1, notes: [], sections: [{ id: 'heading', label: '@ts-ignore', nodeIds: ['title'] }] },
  });
  expect(result.diagnostics).toEqual([]);
  for (const file of result.files) expect(file.content).toContain('// Note: @ts-ignore');
});
