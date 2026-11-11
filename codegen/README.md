# BonniePDF authoring tooling

Experimental, private workspace package for generating native TypeScript and C# from validated Document Definitions, with versioned editorial metadata and authoring-project utilities. It is not yet a published or complete-surface generator.

`@bonniepdf/codegen/authoring` validates component-bound code notes, language overrides, section names and helper-name hints. Notes live outside Document Definition JSON. Stable IDs keep explanations attached to their components when order changes; missing/deleted targets produce diagnostics. `emitNote` emits each physical line as a line comment, including Unicode newline characters, so annotation text cannot inject statements.

`@bonniepdf/codegen/project` creates, validates, serialises and parses an authoring-project envelope containing a definition, annotations and optional catalogue metadata. Unknown fields/versions and orphaned notes are rejected. Plain definition export omits annotations; retain the authoring project to keep editorial content.

```ts
import { emptyAnnotations } from '@bonniepdf/codegen/authoring';
import { createProject, serializeProject } from '@bonniepdf/codegen/project';

const annotations = emptyAnnotations();
annotations.notes.push({
  id: 'explain-title',
  target: { kind: 'node', nodeId: 'report-title' },
  placement: 'before',
  text: 'The main heading identifies the report.',
});
const project = createProject(definition, annotations);
const contents = serializeProject(project);
```

The source-audit utility under `tools/dotnet-api` inspects only public types of an explicitly supplied BonniePDF assembly. It neither loads private members nor changes the assembly. Its output is build-time metadata, not reflection injected into generated application code.

## Native code generation

```ts
import { generateCode } from '@bonniepdf/codegen';

const result = await generateCode(definition, {
  documentName: 'Invoice',
  annotations,
});
if (result.diagnostics.length) {
  // Show located diagnostics; no partial source files are returned.
} else {
  // result.files contains Invoice.ts and Invoice.cs.
}
```

The generated factories construct BonniePDF objects through public APIs. They do not embed a JSON interpreter. Resource bytes and encryption secrets are explicit factory arguments. Comments remain line comments, language overrides are supported, and directive-like text is neutralised so annotations cannot disable type checking or formatting. Stable node IDs map generated source ranges back to the authored components. Generation performs no filesystem or network operations.

TypeScript formatting uses pinned Prettier 3.6.2 with a 100-column print width. C# initialisers use four-space indentation. Both outputs are deterministic for the same input and generator version.

Basic construction of all 45 definition element types has been compiled and reconstructed in both engines. A starter document and a resource-backed invoice also passed per-engine definition, SVG and PDF comparisons. This does **not** establish complete property or catalogue coverage. Page chrome, attachment resources, explicit first-page margins, chart orientation and concrete collection mappings are implemented. Helper extraction currently returns a diagnostic. A 107-document strict-export corpus compiles in both languages; per-engine reconstruction/SVG checks pass for all 107 TypeScript factories and 99 C# factories. Eight C# font portability failures remain under investigation, so this is not full original-source or cross-runtime equivalence. Only the default native construction profile is implemented; class/fluent teaching profiles and standalone bundles remain outstanding.

## Development

```sh
pnpm --filter @bonniepdf/codegen typecheck
pnpm --filter @bonniepdf/codegen test
```

For executable verification against explicitly supplied engine checkouts/assemblies:

```sh
node codegen/tools/verify-native.mjs \
  --definition /path/to/document.bonnie.json \
  --core-source-root /path/to/BonniePDF-TypeScript \
  --out /path/to/verification-output \
  --dotnet-assembly /path/to/BonniePDF.dll \
  --dotnet /path/to/dotnet
```

The verifier compiles both generated factories, compares canonical definitions and SVG against direct definition construction in each engine, and compares PDFs with fixed engine-supplied dates. Only random trailer IDs and font-subset prefixes are normalised. This is per-engine equivalence, not a claim that raw cross-runtime SVG/PDF bytes are identical. Generated source contains no reflection; the verification harness may use reflection to invoke compiled factories.

`api.generated.json` records mappings derived from the published definition schema and the public .NET assembly surface. Regenerate it with `scripts/build-metadata.mjs` using explicit `--schema` and `--dotnet-api` inputs after building the public-surface snapshot tool. Review metadata changes together with compilation/equivalence checks.

## Portable source bundles

`@bonniepdf/codegen/bundle` exports `createBundle(project, { resources?, signal? })`. It returns named byte artifacts for a host to archive/store, with no filesystem or network access. Bundles contain the editable project, plain definition, both native factories, deduplicated content-addressed resources, TypeScript/C# console project scaffolds, runtime secret injection and a SHA-256 artifact manifest. Opaque resource refs require explicit bytes; hash mismatches or generation diagnostics return no partial bundle. A reopened exported project embeds its resolved resources.

The invoice consumer scaffolds have been compiled and executed against explicitly supplied built public engine artifacts. Both runners produce PDFs. Registry/feed installation availability is a separate release check; `tools/verify-bundle.mjs` deliberately uses explicit local engine artifacts when verifying unpublished work. The tool replaces the NuGet reference only in its temporary verification copy.

Resource attribution may be retained in the definition's `_resourceNotices` extension: an array of `{ title, text, resourceKeys? }` entries. `createBundle` validates bounded notice data, writes text unchanged to generated safe filenames and links each notice from the artifact/resource manifests. Notice text is not injected into native source. Omit `resourceKeys` for a general resource notice. These extension fields are resource metadata, separate from editorial code comments.
