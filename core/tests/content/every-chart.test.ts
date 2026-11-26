import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as core from '../../src/index';
import * as chartsEntry from '../../src/charts';
import { Document } from '../../src/Document';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import { ELEMENT_DESCRIPTION } from '../../src/Definition/ElementDescription';
import { evaluateCompliance } from '../../src/Compliance/ComplianceEvaluator';
import type { ChartBase } from '../../src/Charts/ChartBase';
import { pdfToText } from '../helpers/test-base';

// Every chart type must work in a document. `chart-types.json` is generated with the chart sources (see
// core/chart-sources.json): one shared case per chart type, taken from the chart feature fixtures. The .NET
// suite runs the same cases (EveryChartTests).

interface ChartTypeCase {
  chart: string;
  id: string;
  options: Record<string, unknown>;
}

const cases: ChartTypeCase[] = JSON.parse(
  fs.readFileSync(new URL('./fixtures/chart-types.json', import.meta.url), 'utf8')
) as ChartTypeCase[];

/**
 * Chart types that Document Definition 1.0 does not describe yet. Remove a type from this list when its
 * element description lands; the test below fails if a listed type is already described.
 */
const NOT_YET_IN_DEFINITIONS = [
  'ArcDiagramChart',
  'BoxPlotChart',
  'CandlestickChart',
  'ChordChart',
  'DumbbellChart',
  'FunnelChart',
  'GanttChart',
  'GaugeChart',
  'HistogramChart',
  'NightingaleRoseChart',
  'PackedCircleChart',
  'PartitionChart',
  'PictographChart',
  'ProgressRingChart',
  'PyramidChart',
  'RadarChart',
  'RadialBarChart',
  'RangeAreaChart',
  'SankeyChart',
  'SlopeChart',
  'StatTileChart',
  'SunburstChart',
  'TimelineChart',
  'TreemapChart',
  'VennChart',
  'WaffleChart',
];

type ChartConstructor = new (options?: Record<string, unknown>) => ChartBase;

function constructorOf(module: object, name: string): ChartConstructor | undefined {
  return (module as Record<string, ChartConstructor | undefined>)[name];
}

describe('every chart type', () => {
  it('has one case for each chart class in the copied sources', () => {
    const declared = fs
      .readdirSync(new URL('../../src/Charts/', import.meta.url))
      .filter(f => f.endsWith('.ts'))
      .flatMap(f => {
        const source = fs.readFileSync(new URL(`../../src/Charts/${f}`, import.meta.url), 'utf8');
        const match = /^export class (\w+Chart) extends \w+/m.exec(source);
        return match ? [match[1]] : [];
      })
      .sort();
    expect(cases.map(c => c.chart).sort()).toEqual(declared);
  });

  for (const c of cases) {
    describe(c.chart, () => {
      it('is exported from the package and from the charts entry point', () => {
        expect(constructorOf(core, c.chart), `@bonniepdf/core exports ${c.chart}`).toBeTypeOf('function');
        expect(constructorOf(chartsEntry, c.chart), `@bonniepdf/core/charts exports ${c.chart}`).toBe(
          constructorOf(core, c.chart)
        );
      });

      it(`renders case ${c.id} as a tagged figure with its alt text`, () => {
        const Chart = constructorOf(core, c.chart)!;
        const altText = `${c.chart} sample`;
        const doc = new Document();
        doc.settings.conformance = PdfAConformance.PdfA2a;
        doc.settings.accessibility = AccessibilityMode.PdfUa1;
        doc.settings.language = 'en-GB';
        doc.add(new Chart({ ...c.options, altText }));
        const pdf = pdfToText(doc.generateBytes());
        expect(pdf).toContain('/Figure');
        expect(pdf).toContain(`/Alt (${altText})`);
        expect(doc.diagnostics.filter(d => d.severity === 'error')).toEqual([]);
      });

      it('is reported by preflight when it has no alt text', async () => {
        const Chart = constructorOf(core, c.chart)!;
        const doc = new Document();
        doc.settings.accessibility = AccessibilityMode.PdfUa1;
        doc.settings.language = 'en-GB';
        doc.add(new Chart(c.options));
        const { snapshot } = await doc.generateSvgDocumentAsync({ captureLayout: true });
        const findings = evaluateCompliance(snapshot!).findings;
        expect(findings.some(f => f.code === 'figure-missing-alt' && f.message.startsWith(`${c.chart} `))).toBe(true);
      });

      it('is described by Document Definition, or listed as not yet described', () => {
        const described = c.chart in ELEMENT_DESCRIPTION.elements;
        expect(described, `${c.chart} described: remove it from NOT_YET_IN_DEFINITIONS when it is`).toBe(
          !NOT_YET_IN_DEFINITIONS.includes(c.chart)
        );
      });
    });
  }

  it('lists only chart types that exist', () => {
    for (const name of NOT_YET_IN_DEFINITIONS) expect(cases.map(c => c.chart)).toContain(name);
  });
});
