import { describe, expect, test } from 'vitest';
import { copyAnnotations, emitNote, validateAnnotations, type CodeAnnotations } from '../src/authoring';
const definition = {
  pages: [
    {
      content: [
        { type: 'Heading', id: 'title', text: 'Invoice' },
        { type: 'Table', id: 'items', columns: [1, 1] },
      ],
    },
  ],
};
const annotations: CodeAnnotations = {
  version: 1,
  notes: [
    { id: 'intro', target: { kind: 'document' }, placement: 'before', text: 'Invoice example' },
    {
      id: 'repeat-header',
      target: { kind: 'node', nodeId: 'items', property: 'columns' },
      placement: 'before',
      text: 'Repeat the header on each page.',
      overrides: { csharp: 'A C# explanation.' },
    },
  ],
  sections: [{ id: 'details', label: 'Invoice details', nodeIds: ['title', 'items'], helperName: 'BuildDetails' }],
};
describe('editorial metadata', () => {
  test('accepts document/node/property notes with language overrides and sections', () => {
    expect(validateAnnotations(annotations, definition)).toEqual({ valid: true, issues: [] });
    expect(emitNote(annotations.notes[1], 'typescript')).toBe('// Repeat the header on each page.');
    expect(emitNote(annotations.notes[1], 'csharp', '  ')).toBe('  // A C# explanation.');
  });
  test('detects deleted targets and reset properties rather than attaching to another position', () => {
    const edited = structuredClone(definition);
    edited.pages[0].content.reverse();
    expect(validateAnnotations(annotations, edited).valid).toBe(true);
    delete (edited.pages[0].content[0] as any).columns;
    expect(validateAnnotations(annotations, edited).issues).toContainEqual(
      expect.objectContaining({ code: 'missing-target', path: '/notes/1/target/property' })
    );
    edited.pages[0].content.shift();
    expect(validateAnnotations(annotations, edited).issues).toContainEqual(
      expect.objectContaining({ code: 'missing-target', path: '/notes/1/target/nodeId' })
    );
  });
  test('copies editorial data onto copied component IDs without mutating originals', () => {
    const before = structuredClone(annotations);
    let n = 0;
    const copied = copyAnnotations(annotations, new Map([['items', 'items-copy']]), () => `new-${++n}`);
    expect(copied.notes).toHaveLength(1);
    expect(copied.notes[0].target).toEqual({ kind: 'node', nodeId: 'items-copy', property: 'columns' });
    expect(copied.sections[0].nodeIds).toEqual(['items-copy']);
    expect(annotations).toEqual(before);
  });
  test('keeps comment terminators and every newline form inside line comments', () => {
    const note = { ...annotations.notes[0], text: '*/ attack();\r\nnext();\u2028third();\u2029fourth();\rlast();' };
    expect(emitNote(note, 'typescript').split('\n')).toEqual([
      '// */ attack();',
      '// next();',
      '// third();',
      '// fourth();',
      '// last();',
    ]);
    expect(() => emitNote(note, 'csharp', 'evil();')).toThrow();
  });
  test('rejects duplicate and ambiguous IDs, executable-shaped metadata and unsafe helper names', () => {
    const invalid = structuredClone(annotations);
    invalid.notes[1].id = 'intro';
    invalid.sections[0].helperName = 'class';
    expect(validateAnnotations(invalid, definition).issues.map(x => x.code)).toEqual(
      expect.arrayContaining(['duplicate-id', 'invalid-identifier'])
    );
    expect(validateAnnotations({ ...annotations, rawCode: 'execute()' }, definition).issues[0].code).toBe(
      'unknown-key'
    );
    const duplicate = structuredClone(definition);
    duplicate.pages[0].content.push({ type: 'Heading', id: 'items', text: 'Wrong' });
    expect(validateAnnotations(annotations, duplicate).issues.some(x => x.code === 'duplicate-id')).toBe(true);
  });
  test('preserves editorial text in a JSON save/reopen without modifying the document', () => {
    const before = structuredClone(definition);
    const reopened = JSON.parse(JSON.stringify({ definition, annotations }));
    expect(reopened.annotations).toEqual(annotations);
    expect(validateAnnotations(reopened.annotations, reopened.definition).valid).toBe(true);
    expect(definition).toEqual(before);
  });
});

test('directive-like teaching text cannot disable the compiler or formatter', () => {
  for (const text of [
    '@ts-ignore',
    '@ts-expect-error',
    '@ts-nocheck',
    'prettier-ignore',
    'eslint-disable',
    'istanbul ignore next',
  ]) {
    expect(emitNote({ ...annotations.notes[0], text }, 'typescript')).toBe('// Note: ' + text);
  }
});
