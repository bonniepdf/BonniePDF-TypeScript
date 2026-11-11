import { expect, test } from 'vitest';
import { createBundle } from '../src/bundle';
import { createProject } from '../src/project';
const definition: any = {
  version: 1,
  minorVersion: 0,
  resources: { data: { kind: 'attachment', mediaType: 'text/plain', data: 'SGVsbG8=' } },
  attachments: [{ resource: 'data', fileName: 'hello.txt' }],
  pages: [{ content: [{ type: 'TextBlock', id: 'intro', text: 'Hello' }] }],
};
test('exports deterministic project, both native languages, resources, runnable scaffolds and verified hashes', async () => {
  const project = createProject(definition, {
    version: 1,
    notes: [
      { id: 'note', target: { kind: 'node', nodeId: 'intro' }, placement: 'before', text: 'Explain this paragraph.' },
    ],
    sections: [],
  });
  const result = await createBundle(project);
  expect(result.diagnostics).toEqual([]);
  expect(await createBundle(project)).toEqual(result);
  const files = Object.fromEntries(result.files.map(f => [f.path, new TextDecoder().decode(f.content)]));
  expect(JSON.parse(files['Document.bonnie.project.json']).annotations).toEqual(project.annotations);
  expect(JSON.parse(files['Document.bonnie.json']).annotations).toBeUndefined();
  expect(files['typescript/DocumentFactory.generated.ts']).toContain('// Explain this paragraph.');
  expect(files['csharp/DocumentFactory.Generated.cs']).toContain('// Explain this paragraph.');
  expect(files['typescript/run.ts']).toContain('generate(resources');
  expect(files['csharp/Program.cs']).toContain('DocumentFactory.Generate(resources');
  const manifest = JSON.parse(files['manifest.json']);
  for (const entry of manifest.artifacts) {
    const bytes = result.files.find(f => f.path === entry.path)!.content;
    const digest = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)),
      n => n.toString(16).padStart(2, '0')
    ).join('');
    expect(digest).toBe(entry.sha256);
  }
  expect(project).toEqual(createProject(definition, project.annotations));
});
test('requires explicit resource resolution, embeds resolved bytes and rejects mismatched hashes atomically', async () => {
  const ref = structuredClone(definition);
  delete ref.resources.data.data;
  ref.resources.data.ref = 'host:opaque';
  const missing = await createBundle(createProject(ref));
  expect(missing.files).toEqual([]);
  expect(missing.diagnostics[0].code).toBe('missing-resource');
  const options = { resources: { data: new TextEncoder().encode('Hello') } };
  const result = await createBundle(createProject(ref), options);
  expect(result.diagnostics).toEqual([]);
  const reopened = JSON.parse(
    new TextDecoder().decode(result.files.find(f => f.path === 'Document.bonnie.project.json')!.content)
  );
  expect(reopened.definition.resources.data.data).toBe('SGVsbG8=');
  expect(reopened.definition.resources.data.ref).toBeUndefined();
  ref.resources.data.sha256 = '0'.repeat(64);
  expect((await createBundle(createProject(ref), options)).files).toEqual([]);
});

test('preserves resource notice text without treating it as source or a filename', async () => {
  const input = structuredClone(definition);
  input._resourceNotices = [
    { title: '../../Attribution', text: 'Resource copyright.\n*/ execute();', resourceKeys: ['data'] },
  ];
  const result = await createBundle(createProject(input));
  expect(result.diagnostics).toEqual([]);
  const files = Object.fromEntries(result.files.map(f => [f.path, new TextDecoder().decode(f.content)]));
  expect(files['notices/notice-001.txt']).toBe(input._resourceNotices[0].text);
  expect(JSON.parse(files['resources.json']).data.noticeFiles).toEqual(['notices/notice-001.txt']);
  expect(JSON.parse(files['manifest.json']).notices[0].title).toBe('../../Attribution');
  expect(files['typescript/DocumentFactory.generated.ts']).not.toContain('execute();');
  input._resourceNotices[0].resourceKeys = ['missing'];
  expect((await createBundle(createProject(input))).files).toEqual([]);
});
