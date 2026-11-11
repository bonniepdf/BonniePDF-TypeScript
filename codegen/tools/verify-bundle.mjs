// Verify the exported consumer scaffolds against explicitly built public engine artifacts.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
const { values: o } = parseArgs({
  options: {
    project: { type: 'string' },
    'core-source-root': { type: 'string' },
    out: { type: 'string' },
    'dotnet-assembly': { type: 'string' },
    dotnet: { type: 'string', default: 'dotnet' },
  },
});
if (!o.project || !o['core-source-root'] || !o.out) throw Error('Supply --project, --core-source-root and --out.');
const out = resolve(o.out),
  core = resolve(o['core-source-root']);
await mkdir(out, { recursive: true });
await build({
  entryPoints: [new URL('../src/bundle.ts', import.meta.url).pathname],
  outfile: join(out, 'bundle.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  plugins: [
    {
      name: 'public-entry',
      setup(c) {
        c.onResolve({ filter: /^@bonniepdf\/core\/definition$/ }, () => ({
          path: join(core, 'core/src/definition.ts'),
        }));
      },
    },
  ],
  logLevel: 'warning',
});
const { createBundle } = await import(pathToFileURL(join(out, 'bundle.mjs')).href);
const input = JSON.parse(await readFile(o.project, 'utf8'));
const project = input.format
  ? input
  : {
      format: 'bonniepdf-authoring-project',
      version: 1,
      definition: input,
      annotations: { version: 1, notes: [], sections: [] },
    };
const result = await createBundle(project);
if (result.diagnostics.length) throw Error(JSON.stringify(result.diagnostics));
for (const file of result.files) {
  const path = resolve(out, file.path);
  if (!path.startsWith(out + '/')) throw Error('Unsafe artifact path.');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, file.content);
}
const link = async (target, path) => {
  await mkdir(dirname(path), { recursive: true });
  await rm(path, { force: true, recursive: true });
  await symlink(target, path, 'dir');
};
await link(join(core, 'core'), join(out, 'typescript/node_modules/@bonniepdf/core'));
await link(
  new URL('../node_modules/@types/node', import.meta.url).pathname,
  join(out, 'typescript/node_modules/@types/node')
);
async function run(cmd, args, cwd) {
  const status = await new Promise((done, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', done);
  });
  if (status !== 0) throw Error(`${cmd} failed: ${status}`);
}
await run(
  process.execPath,
  [new URL('../node_modules/typescript/bin/tsc', import.meta.url).pathname, '-p', 'tsconfig.json'],
  join(out, 'typescript')
);
await run(process.execPath, ['dist/run.js'], join(out, 'typescript'));
if ((await readFile(join(out, 'Document.pdf'))).subarray(0, 5).toString() !== '%PDF-')
  throw Error('TypeScript runner did not produce a PDF.');
const report = {
  typescript: { consumerTypecheck: true, runnerPdf: true },
  csharp: null,
  projectSha256: result.projectSha256,
};
if (o['dotnet-assembly']) {
  const path = join(out, 'csharp/Document.csproj'),
    xml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  // Only this verification copy replaces the package feed with the supplied built library.
  await writeFile(
    path,
    (await readFile(path, 'utf8')).replace(
      '<PackageReference Include="BonniePDF" Version="2026.10.28" />',
      `<Reference Include="BonniePDF"><HintPath>${xml(resolve(o['dotnet-assembly']))}</HintPath></Reference>`
    )
  );
  await run(o.dotnet, ['run', '--project', 'Document.csproj', '--verbosity', 'quiet'], join(out, 'csharp'));
  if ((await readFile(join(out, 'csharp/Document.pdf'))).subarray(0, 5).toString() !== '%PDF-')
    throw Error('C# runner did not produce a PDF.');
  report.csharp = { consumerCompile: true, runnerPdf: true };
}
await writeFile(join(out, 'verification.json'), JSON.stringify(report, null, 2));
console.log(report);
