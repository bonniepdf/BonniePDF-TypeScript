# BonniePDF examples

Each catalogue example is one TypeScript file. It imports only `@bonniepdf/core`
and includes its own sample data, formatting functions, and drawing helpers.
The public `generate()` function builds the document; local helpers follow it.

Start with `src/recipes/basics/first-pdf.ts`, then explore the recipes for an
individual feature. The exampless combine those features into complete documents.
Files ending in `-classes.ts` demonstrate the underlying class API and produce
the same document as their corresponding options-based example.

Copy an example into your application and export its document:

```ts
settings.license = 'evaluation'; // Declare the tier that applies to your application.
const doc = generate();
const bytes = await doc.generateBytesAsync();
```

Import `settings` from `@bonniepdf/core`. The playground declares its licence and
loads fonts before running the example. Examples with a `generate(assets)`
parameter accept a map of image, font, text, or attachment bytes. The playground
supplies those assets; your application can load its own bytes under the same
keys. Asset loading stays separate from document layout so the same example
works with browser fetches or server-side files.

Run `pnpm --filter @bonniepdf/examples verify-standalone` to execute every source
file with the playground's single-file import rules, compare its SVG output with
the catalogue, and export a PDF. `verify-equivalence` checks the class companions.
