// Developer verification using explicitly supplied source/API artifacts.
import { build } from 'esbuild';
import ts from 'typescript';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { spawn } from 'node:child_process';
const { values } = parseArgs({ options: { definition: { type: 'string' }, annotations: { type: 'string' }, 'core-source-root': { type: 'string' }, out: { type: 'string' }, 'dotnet-assembly': { type: 'string' }, dotnet: { type: 'string', default: 'dotnet' } } });
if (!values.definition || !values['core-source-root'] || !values.out) throw Error('Supply --definition, --core-source-root and --out.');
const coreRoot = resolve(values['core-source-root']);
const out = resolve(values.out);await mkdir(out, { recursive: true });
const definition = JSON.parse(await readFile(values.definition, 'utf8'));
const codegenRoot = fileURLToPath(new URL('../', import.meta.url));
const resolver = { name: 'public-core-source', setup(context) {
  context.onResolve({ filter: /^@bonniepdf\/core(?:\/.+)?$/ }, ({ path }) => ({ path: join(coreRoot, 'core/src', path === '@bonniepdf/core' ? 'index.node.ts' : path.slice('@bonniepdf/core/'.length) + '.ts') }));
} };
const generatorModule = join(out, 'generator.mjs');
await build({ entryPoints: [join(codegenRoot, 'src/generate.ts')], outfile: generatorModule, bundle: true, platform: 'node', format: 'esm', target: 'node22', plugins: [resolver], logLevel: 'warning' });
const { generateCode } = await import(pathToFileURL(generatorModule).href);
const annotations = values.annotations ? JSON.parse(await readFile(values.annotations, 'utf8')) : undefined;
const result = await generateCode(definition, { documentName: 'CompiledDesign', annotations });
await writeFile(join(out, 'generation.json'), JSON.stringify(result, null, 2));
if (result.diagnostics.length) throw Error(JSON.stringify(result.diagnostics, null, 2));
for (const file of result.files) await writeFile(join(out, file.path), file.content);
const tsFile = join(out, 'CompiledDesign.generated.ts');
const program = ts.createProgram([tsFile], { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, noEmit: true, strict: true, skipLibCheck: true, esModuleInterop: true, baseUrl: out, paths: { '@bonniepdf/core': [join(coreRoot, 'core/src/index.ts')] }, types: ['node'], typeRoots: [join(codegenRoot, 'node_modules/@types')] });
const diagnostics = ts.getPreEmitDiagnostics(program);
if (diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: f => f, getCurrentDirectory: () => out, getNewLine: () => '\n' }));
const resourceObject = Object.fromEntries(Object.entries(definition.resources || {}).map(([key, value]) => { if (!value.data) throw Error('Verification currently requires embedded resources: ' + key); return [key, value.data]; }));
await writeFile(join(out, 'definition.json'), JSON.stringify(definition));
await writeFile(join(out, 'resources.json'), JSON.stringify(resourceObject));
const runtime = `
import { generate } from ${JSON.stringify(tsFile)};
import { FontManager, settings } from '@bonniepdf/core';
import { fromDefinition, toDefinition } from '@bonniepdf/core/definition';
settings.license = 'evaluation';
FontManager.autoRegisterBundledFonts(${JSON.stringify(join(coreRoot, 'core/assets/fonts'))});
const definition = ${JSON.stringify(definition)};
const resources = Object.fromEntries(Object.entries(${JSON.stringify(resourceObject)}).map(([key, data]) => [key, Uint8Array.from(Buffer.from(data as string, 'base64'))]));
const actual = generate(resources), expected = await fromDefinition(definition);
const actualDefinition = (await toDefinition(actual)).definition, expectedDefinition = (await toDefinition(expected)).definition;
const a = await actual.generateSvgDocumentAsync(), e = await expected.generateSvgDocumentAsync();
const pinDates = doc => {
  if (!definition.metadata?.creationDate) doc.metadata.creationDate = new Date('2026-11-09T12:00:00Z');
  if (!definition.metadata?.modifiedDate) doc.metadata.modifiedDate = new Date('2026-11-09T12:00:00Z');
  return doc;
};
const actualPdf = await pinDates(generate(resources)).generateBytesAsync();
const expectedPdf = await pinDates(await fromDefinition(definition)).generateBytesAsync();
export const report = { actualDefinition, expectedDefinition, actualPages: a.pages, expectedPages: e.pages, actualPdf: Buffer.from(actualPdf).toString('base64'), expectedPdf: Buffer.from(expectedPdf).toString('base64') };
`;
const runtimeModule = join(out, 'runtime.mjs');
await build({ stdin: { contents: runtime, loader: 'ts', resolveDir: out }, outfile: runtimeModule, bundle: true, platform: 'node', format: 'esm', target: 'node22', plugins: [resolver], logLevel: 'warning' });
const { report } = await import(pathToFileURL(runtimeModule).href);
await writeFile(join(out, 'typescript-report.json'), JSON.stringify(report, null, 2));
const stripObservationalIds = value => {
  if (Array.isArray(value)) return value.map(stripObservationalIds);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).filter(k => !(k === 'id' && typeof value.type === 'string')).sort().map(k => [k, stripObservationalIds(value[k])]));
  return value;
};
const definitionEqual = JSON.stringify(stripObservationalIds(report.actualDefinition)) === JSON.stringify(stripObservationalIds(report.expectedDefinition));
// Only a trailer ID and subset prefixes on font dictionary entries are volatile.
// Runtime runners pin engine-supplied metadata dates without overriding authored dates.
const maskPdf = (base64) => Buffer.from(base64, 'base64').toString('latin1')
  .replace(/\/ID\s*\[\s*<[^>]*>\s*<[^>]*>\s*\]/g, '/ID [<MASKED><MASKED>]')
  .replace(/(^|[\r\n])([ \t]*\/(?:BaseFont|FontName)[ \t]+\/)[A-Z]{6}\+/g, '$1$2FONTXX+');
const pdfEqual = maskPdf(report.actualPdf) === maskPdf(report.expectedPdf);
const svgEqual = JSON.stringify(report.actualPages) === JSON.stringify(report.expectedPages);
console.log('TypeScript:', { typecheck: true, definitionEqual, svgEqual, pdfEqual, pages: report.actualPages.length });
if (!definitionEqual || !svgEqual || !pdfEqual) throw Error('Generated TypeScript differs from direct-definition construction; inspect typescript-report.json.');
if (values['dotnet-assembly']) {
  const xml = value => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  await writeFile(join(out, 'Verify.csproj'), `<Project Sdk="Microsoft.NET.Sdk"><PropertyGroup><OutputType>Exe</OutputType><TargetFramework>net10.0</TargetFramework><ImplicitUsings>enable</ImplicitUsings><Nullable>enable</Nullable><NuGetAudit>false</NuGetAudit></PropertyGroup><ItemGroup><Reference Include="BonniePDF"><HintPath>${xml(resolve(values['dotnet-assembly']))}</HintPath></Reference></ItemGroup></Project>`);
  await writeFile(join(out, 'Program.cs'), `using System.Text.Json;
using BonniePDF;
using GeneratedDocuments;
BonniePdfLicense.Tier = LicenseTier.Evaluation;
var resources = JsonSerializer.Deserialize<Dictionary<string, string>>(File.ReadAllText("resources.json"))!.ToDictionary(p => p.Key, p => Convert.FromBase64String(p.Value));
var actual = CompiledDesign.Generate(resources);
var expected = await Document.FromDefinitionAsync(File.ReadAllText("definition.json"));
var actualDefinition = actual.ToDefinition().Definition;
var expectedDefinition = expected.ToDefinition().Definition;
var actualSvg = await actual.GenerateSvgDocumentAsync();
var expectedSvg = await expected.GenerateSvgDocumentAsync();
using var source = JsonDocument.Parse(File.ReadAllText("definition.json"));
Document PinDates(Document doc) {
    var hasMetadata = source.RootElement.TryGetProperty("metadata", out var metadata);
    if (!hasMetadata || !metadata.TryGetProperty("creationDate", out _)) doc.Metadata.CreationDate = DateTimeOffset.Parse("2026-11-09T12:00:00Z");
    if (!hasMetadata || !metadata.TryGetProperty("modifiedDate", out _)) doc.Metadata.ModifiedDate = DateTimeOffset.Parse("2026-11-09T12:00:00Z");
    return doc;
}
var actualPdf = await PinDates(CompiledDesign.Generate(resources)).GenerateBytesAsync();
var expectedPdf = await PinDates(await Document.FromDefinitionAsync(File.ReadAllText("definition.json"))).GenerateBytesAsync();
File.WriteAllText("csharp-report.json", JsonSerializer.Serialize(new { actualDefinition, expectedDefinition, actualPages = actualSvg.Pages, expectedPages = expectedSvg.Pages, actualPdf = Convert.ToBase64String(actualPdf), expectedPdf = Convert.ToBase64String(expectedPdf) }));
`);
  const status = await new Promise((done, reject) => { const child = spawn(values.dotnet, ['run', '--project', 'Verify.csproj', '--verbosity', 'quiet'], { cwd: out, stdio: 'inherit', env: process.env }); child.on('error', reject);child.on('exit', done); });
  if (status !== 0) throw Error('Generated C# failed compilation or execution.');
  const csharp = JSON.parse(await readFile(join(out, 'csharp-report.json'), 'utf8'));
  const csDefinitionEqual = JSON.stringify(stripObservationalIds(csharp.actualDefinition)) === JSON.stringify(stripObservationalIds(csharp.expectedDefinition));
  const csPdfEqual = maskPdf(csharp.actualPdf) === maskPdf(csharp.expectedPdf);
  const csSvgEqual = JSON.stringify(csharp.actualPages) === JSON.stringify(csharp.expectedPages);
  console.log('C#:', { compile: true, definitionEqual: csDefinitionEqual, svgEqual: csSvgEqual, pdfEqual: csPdfEqual });
  if (!csDefinitionEqual || !csSvgEqual || !csPdfEqual) throw Error('Generated C# differs from direct-definition construction; inspect csharp-report.json.');
}
