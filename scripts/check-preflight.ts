// Runs the accessibility preflight over the whole example catalogue and fails
// the build on any error-severity finding.
// Run with: pnpm check:preflight  (tsx scripts/check-preflight.ts)
//
// This is the authoring-time counterpart to the veraPDF gate. veraPDF validates
// finished bytes against a profile; this evaluates the layout the engine actually
// produced and reports which *element* is at fault. The two catch different
// things — most sharply, image-like content that fell back to /Artifact for want
// of alt text, which veraPDF passes as a legitimately untagged artifact.
//
// Gating policy (deliberate):
//   - Only `error` severity fails the build. Warnings and info are printed.
//     Contrast lands as a warning, and `contrast-unknown` as info, so a
//     deliberately artistic showcase cannot block a build over a backdrop the
//     preflight cannot resolve.
//   - `preflight-baseline.json` lists findings that are known and accepted, as
//     `"<exampleId>:<code>"`. Adopting the gate therefore does not require
//     fixing every existing example on day one. A baseline entry that no longer
//     matches anything is reported, so the file cannot rot silently.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { evaluateCompliance, ComplianceSeverity } from '@bonniepdf/core';
import type { ComplianceFinding } from '@bonniepdf/core';
import { examples } from '../examples/src/index.ts';
import { configureExampleRuntime, loadAssets } from './example-runtime.ts';

configureExampleRuntime();

const baselinePath = resolve(import.meta.dirname, 'preflight-baseline.json');
const baseline: string[] = existsSync(baselinePath)
  ? (JSON.parse(readFileSync(baselinePath, 'utf8')) as { allow: string[] }).allow
  : [];
const unusedBaseline = new Set(baseline);

async function main(): Promise<void> {
  const severityRank: Record<string, number> = { error: 0, warning: 1, info: 2 };

  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;
  let suppressed = 0;
  const failures: string[] = [];

  for (const example of examples) {
    // Variants render the same document as their parent; evaluating both would
    // just double every finding.
    if (example.variantOf) continue;

    let findings: ComplianceFinding[];
    try {
      const doc = example.generate(loadAssets(example));
      const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
      if (!snapshot) throw new Error('no snapshot captured');
      findings = evaluateCompliance(snapshot).findings;
    } catch (error) {
      // An example that cannot be rendered is a build failure in its own right —
      // reporting it as "no findings" would be the wrong kind of green.
      failures.push(`${example.id}: failed to render — ${(error as Error).message}`);
      errorCount++;
      continue;
    }

    const reportable = findings
      .filter(f => {
        const key = `${example.id}:${f.code}`;
        if (baseline.includes(key)) {
          unusedBaseline.delete(key);
          suppressed++;
          return false;
        }
        return true;
      })
      .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);

    if (reportable.length === 0) continue;

    console.log(`\n${example.id}`);
    for (const f of reportable) {
      const where = f.page === undefined ? '' : ` (page ${f.page + 1})`;
      console.log(`  [${f.severity}] ${f.code}${where} — ${f.message}`);
      if (f.severity === ComplianceSeverity.Error) {
        errorCount++;
        failures.push(`${example.id}: ${f.code} — ${f.message}`);
      } else if (f.severity === ComplianceSeverity.Warning) {
        warningCount++;
      } else {
        infoCount++;
      }
    }
  }

  console.log(
    `\nPreflight: ${errorCount} error(s), ${warningCount} warning(s), ${infoCount} info` +
      (suppressed > 0 ? `, ${suppressed} suppressed by baseline` : '')
  );

  if (unusedBaseline.size > 0) {
    console.log(`\nStale baseline entries (no longer reported — remove them):\n  ${[...unusedBaseline].join('\n  ')}`);
  }

  if (errorCount > 0) {
    console.error(`\nFAILED — ${errorCount} error-severity finding(s):`);
    for (const f of failures) console.error(`  ${f}`);
    process.exit(1);
  }

  console.log('\nNo error-severity findings. ✓');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
