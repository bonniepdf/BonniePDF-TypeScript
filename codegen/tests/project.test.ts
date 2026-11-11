import { expect, test } from 'vitest';
import { createProject, parseProject, serializeProject, validateProject } from '../src/project';
import { emptyAnnotations } from '../src/authoring';
const definition = {
  version: 1,
  minorVersion: 0,
  pages: [{ content: [{ type: 'TextBlock', id: 'message', text: 'Hello' }] }],
};
test('saves and reopens editorial content alongside an unmodified portable definition', () => {
  const project = createProject(definition, {
    ...emptyAnnotations(),
    notes: [
      {
        id: 'explain',
        target: { kind: 'node', nodeId: 'message' },
        placement: 'before',
        text: 'Explain the greeting.\nこんにちは',
      },
    ],
  });
  project.catalogue = { id: 'hello-document', title: 'Hello document' };
  expect(parseProject(serializeProject(project))).toEqual(project);
  expect(project.definition).toEqual(definition);
  (project.definition as typeof definition).pages[0].content[0].text = 'Changed';
  expect(definition.pages[0].content[0].text).toBe('Hello');
});
test('refuses missing note targets, newer formats and unknown fields', () => {
  const project = createProject(definition);
  project.annotations.notes.push({
    id: 'orphan',
    target: { kind: 'node', nodeId: 'gone' },
    placement: 'after',
    text: 'Orphan',
  });
  expect(() => serializeProject(project)).toThrow('target component');
  expect(validateProject({ ...project, version: 2 }).issues.some(x => x.code === 'unsupported-version')).toBe(true);
  expect(
    validateProject({ ...createProject(definition), code: 'execute()' }).issues.some(x => x.code === 'unknown-key')
  ).toBe(true);
});
test('reports malformed input and excludes editorial fields from core definition JSON', () => {
  expect(() => parseProject('{')).toThrow('not valid JSON');
  const project = createProject(definition);
  expect(() => parseProject(JSON.stringify({ ...project, definition: { ...definition, annotations: {} } }))).toThrow();
});
