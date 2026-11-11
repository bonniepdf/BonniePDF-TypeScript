import { generateCode, type GeneratedFile, type GenerationDiagnostic } from './generate';
import { parseProject, serializeProject, type AuthoringProject } from './project';
export interface BundleFile {
  path: string;
  content: Uint8Array;
}
export interface BundleOptions {
  /** Explicit bytes for opaque resource refs. No path or URL is opened. */
  resources?: Readonly<Record<string, Uint8Array>>;
  signal?: AbortSignal;
}
export interface BundleResult {
  files: BundleFile[];
  diagnostics: GenerationDiagnostic[];
  projectSha256?: string;
}
const utf8 = (text: string) => new TextEncoder().encode(text);
const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
const hash = async (bytes: Uint8Array) =>
  Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>)), n =>
    n.toString(16).padStart(2, '0')
  ).join('');
const extension = (mediaType: string) =>
  (
    ({
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/svg+xml': 'svg',
      'font/ttf': 'ttf',
      'font/otf': 'otf',
      'text/plain': 'txt',
      'text/csv': 'csv',
      'application/xml': 'xml',
      'text/xml': 'xml',
    }) as Record<string, string>
  )[mediaType] || 'bin';

/** Assemble a deterministic portable source project. The host chooses archive and storage APIs. */
export async function createBundle(input: AuthoringProject, options: BundleOptions = {}): Promise<BundleResult> {
  const result: BundleResult = { files: [], diagnostics: [] };
  const files = new Map<string, Uint8Array>();
  const add = (path: string, value: string | Uint8Array) =>
    files.set(path, typeof value === 'string' ? utf8(value) : value.slice());
  try {
    options.signal?.throwIfAborted();
    const project = parseProject(serializeProject(input));
    const sourceProjectSha256 = await hash(utf8(serializeProject(project)));
    const resources: Record<
      string,
      { file: string; kind: string; mediaType: string; sha256: string; bytes: number; noticeFiles?: string[] }
    > = {};
    for (const [name, resource] of Object.entries(project.definition.resources || {}) as [
      string,
      { kind: string; mediaType: string; data?: string; ref?: string; sha256?: string },
    ][]) {
      options.signal?.throwIfAborted();
      const bytes =
        resource.data !== undefined
          ? Uint8Array.from(atob(resource.data), c => c.charCodeAt(0))
          : options.resources?.[name];
      if (!bytes) {
        result.diagnostics.push({
          code: 'missing-resource',
          path: '/resources/' + name,
          message: `Supply bytes for resource ${name}.`,
        });
        continue;
      }
      const sha256 = await hash(bytes);
      if (resource.sha256 && resource.sha256 !== sha256) {
        result.diagnostics.push({
          code: 'resource-hash-mismatch',
          path: '/resources/' + name,
          message: 'Resource bytes do not match the declared SHA-256.',
        });
        continue;
      }
      const file = `assets/${sha256}.${extension(resource.mediaType)}`;
      resources[name] = { file, kind: resource.kind, mediaType: resource.mediaType, sha256, bytes: bytes.byteLength };
      add(file, bytes);
      // A reopened authoring project remains self-contained even when its input used refs.
      if (resource.data === undefined) {
        let binary = '';
        for (const byte of bytes) binary += String.fromCharCode(byte);
        resource.data = btoa(binary);
        delete resource.ref;
      }
    }
    const rawNotices = project.definition._resourceNotices;
    const notices: { title: string; file: string; resourceKeys: string[] }[] = [];
    if (rawNotices !== undefined) {
      if (!Array.isArray(rawNotices) || rawNotices.length > 64)
        result.diagnostics.push({
          code: 'invalid-notice',
          path: '/_resourceNotices',
          message: 'Expected at most 64 resource notices.',
        });
      else
        for (const [index, input] of rawNotices.entries()) {
          const notice = input as Record<string, unknown> | null;
          const keys = notice?.resourceKeys ?? Object.keys(resources);
          if (
            !notice ||
            Array.isArray(notice) ||
            typeof notice !== 'object' ||
            Object.keys(notice).some(k => !['title', 'text', 'resourceKeys'].includes(k)) ||
            typeof notice.title !== 'string' ||
            !notice.title.trim() ||
            notice.title.length > 1000 ||
            typeof notice.text !== 'string' ||
            !notice.text.trim() ||
            notice.text.length > 100000 ||
            !Array.isArray(keys) ||
            keys.some(k => typeof k !== 'string' || !Object.hasOwn(resources, k))
          ) {
            result.diagnostics.push({
              code: 'invalid-notice',
              path: '/_resourceNotices/' + index,
              message: 'Expected a title, bounded notice text and existing resource keys.',
            });
            continue;
          }
          const file = `notices/notice-${String(index + 1).padStart(3, '0')}.txt`;
          add(file, notice.text);
          notices.push({ title: notice.title, file, resourceKeys: [...new Set(keys as string[])] });
          for (const key of new Set(keys as string[])) {
            resources[key].noticeFiles ||= [];
            resources[key].noticeFiles.push(file);
          }
        }
    }
    if (result.diagnostics.length) return result;
    const generated = await generateCode(project.definition, {
      annotations: project.annotations,
      documentName: 'DocumentFactory',
      signal: options.signal,
    });
    if (generated.diagnostics.length) return { files: [], diagnostics: generated.diagnostics };
    for (const file of generated.files)
      add(`${file.language === 'csharp' ? 'csharp' : 'typescript'}/${file.path}`, file.content);
    const projectText = serializeProject(project);
    const projectSha256 = await hash(utf8(projectText));
    add('Document.bonnie.project.json', projectText);
    add('Document.bonnie.json', json(project.definition));
    add('resources.json', json(resources));
    add(
      'typescript/package.json',
      json({
        name: 'bonniepdf-document',
        version: '1.0.0',
        private: true,
        type: 'module',
        scripts: { build: 'tsc', start: 'npm run build && node dist/run.js' },
        dependencies: { '@bonniepdf/core': '2026.10.28' },
        devDependencies: { typescript: '5.9.3', '@types/node': '22.19.0' },
      })
    );
    add(
      'typescript/tsconfig.json',
      json({
        compilerOptions: {
          target: 'ES2022',
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          skipLibCheck: true,
          outDir: 'dist',
          rootDir: '.',
        },
        include: ['*.ts'],
      })
    );
    add('typescript/run.ts', typescriptRunner(generated.files.find(f => f.language === 'typescript')!));
    add(
      'csharp/Document.csproj',
      `<Project Sdk="Microsoft.NET.Sdk">\n  <PropertyGroup>\n    <OutputType>Exe</OutputType>\n    <TargetFramework>net8.0</TargetFramework>\n    <ImplicitUsings>enable</ImplicitUsings>\n    <Nullable>enable</Nullable>\n  </PropertyGroup>\n  <ItemGroup>\n    <PackageReference Include="BonniePDF" Version="2026.10.28" />\n    <None Include="../resources.json" Link="resources.json" CopyToOutputDirectory="PreserveNewest" />\n    <None Include="../assets/**/*" Link="assets/%(RecursiveDir)%(Filename)%(Extension)" CopyToOutputDirectory="PreserveNewest" />\n  </ItemGroup>\n</Project>\n`
    );
    add('csharp/Program.cs', csharpRunner(Boolean(project.definition.settings?.encryption)));
    add(
      'README.md',
      `# BonniePDF document source\n\nThis bundle captures one authoring-project revision. Reopen Document.bonnie.project.json in Designer to retain comments and named sections. Document.bonnie.json contains the plain definition. The generated factories use native BonniePDF APIs and take explicit resource bytes; resources.json maps their keys to content-addressed assets.\n\n## TypeScript\n\nRequires Node.js 22 or newer and the pinned BonniePDF npm package (or a local package feed):\n\n\`\`\`sh\ncd typescript\nnpm install\nnpm start\n\`\`\`\n\nThe PDF is written to the bundle root.\n\n## C#\n\nRequires a .NET SDK supporting net8.0 and the pinned BonniePDF NuGet package (or a local package feed):\n\n\`\`\`sh\ncd csharp\ndotnet run\n\`\`\`\n\nThe PDF is written to the current directory. Configure the BonniePDF licence appropriate to your use through BONNIEPDF_LICENSE. The runners default to evaluation. For encrypted documents supply BONNIEPDF_OWNER_PASSWORD and optional BONNIEPDF_USER_PASSWORD at runtime; passwords are never included in the definition or generated factory.\n\nRedistribution notices supplied with the project are retained in notices/ and linked from the manifests. BonniePDF package terms are available at https://www.bonniepdf.dev/legal.\n\nmanifest.json identifies the project and hashes every artifact. No website publication or original teaching-source/profile equivalence is implied by this export.\n`
    );
    const totalBytes = [...files.values()].reduce((sum, bytes) => sum + bytes.byteLength, 0);
    if (totalBytes > 128 * 1024 * 1024)
      return {
        files: [],
        diagnostics: [{ code: 'bundle-limit', path: '', message: 'Bundle exceeds the 128 MiB output limit.' }],
      };
    const artifacts = [];
    for (const [path, bytes] of [...files.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      artifacts.push({ path, bytes: bytes.byteLength, sha256: await hash(bytes) });
    add(
      'manifest.json',
      json({
        format: 'bonniepdf-source-bundle',
        version: 1,
        generatorVersion: generated.generatorVersion,
        sourceProjectSha256,
        projectSha256,
        profiles: { typescript: 'native-options', csharp: 'traditional' },
        notices,
        artifacts,
      })
    );
    return {
      files: [...files.entries()]
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([path, content]) => ({ path, content })),
      diagnostics: [],
      projectSha256,
    };
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return { files: [], diagnostics: [{ code: 'invalid-bundle', path: '', message: (error as Error).message }] };
  }
}
function typescriptRunner(file: GeneratedFile): string {
  return `import { readFile, writeFile } from 'node:fs/promises';\nimport { settings } from '@bonniepdf/core';\nimport { generate } from './${file.path.replace(/\.ts$/, '.js')}';\n\nsettings.license = (process.env.BONNIEPDF_LICENSE || 'evaluation') as typeof settings.license;\nconst manifest: Record<string, { file: string }> = JSON.parse(await readFile(new URL('../../resources.json', import.meta.url), 'utf8'));\nconst resources = Object.fromEntries(await Promise.all(Object.entries(manifest).map(async ([name, item]) => [name, new Uint8Array(await readFile(new URL('../../' + item.file, import.meta.url)))])));\nconst document = generate(resources, { owner: process.env.BONNIEPDF_OWNER_PASSWORD, user: process.env.BONNIEPDF_USER_PASSWORD });\nawait writeFile(new URL('../../Document.pdf', import.meta.url), await document.generateBytesAsync());\n`;
}
function csharpRunner(encrypted: boolean): string {
  return `using System.Text.Json;\nusing BonniePDF;\nusing GeneratedDocuments;\n\nif (!Enum.TryParse<LicenseTier>(Environment.GetEnvironmentVariable("BONNIEPDF_LICENSE") ?? "Evaluation", true, out var tier))\n    throw new ArgumentException("Invalid BONNIEPDF_LICENSE.");\nBonniePdfLicense.Tier = tier;\nvar manifest = JsonDocument.Parse(File.ReadAllText(Path.Combine(AppContext.BaseDirectory, "resources.json")));\nvar resources = new Dictionary<string, byte[]>();\nforeach (var entry in manifest.RootElement.EnumerateObject())\n    resources[entry.Name] = File.ReadAllBytes(Path.Combine(AppContext.BaseDirectory, entry.Value.GetProperty("file").GetString()!));\nvar document = DocumentFactory.Generate(resources${encrypted ? ', new DocumentFactory.RuntimeSecrets(Environment.GetEnvironmentVariable("BONNIEPDF_OWNER_PASSWORD") ?? throw new ArgumentException("Supply BONNIEPDF_OWNER_PASSWORD."), Environment.GetEnvironmentVariable("BONNIEPDF_USER_PASSWORD") ?? "")' : ''});\nFile.WriteAllBytes("Document.pdf", await document.GenerateBytesAsync());\n`;
}
