import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { Container } from '../../src/Elements/Layout/Container';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { CanvasElement } from '../../src/Elements/Drawing/CanvasElement';
import { BarChart } from '../../src/Charts/BarChart';
import { ChartData } from '../../src/Charts/Models/ChartData';
import { ChartSeries } from '../../src/Charts/Models/ChartSeries';
import { ChartDataPoint } from '../../src/Charts/Models/ChartDataPoint';
import { Color } from '../../src/Core/Color';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { AccessibilityMode } from '../../src/Configuration/AccessibilityMode';
import { PdfAConformance } from '../../src/Configuration/PdfAConformance';
import type { IElement } from '../../src/Elements/IElement';
import { pdfToText } from '../helpers/test-base';

// PDF/UA-1 7.1 marked-content nesting for elements that draw onto a canvas from
// RenderContext.getCanvas (charts, canvas elements). That call hands back a fresh canvas that
// appends to the same content stream as the canvas already rendering; it has to see the scopes
// that canvas has open, or a chart inside the /Figure its parent opened wraps its own marks in
// /Artifact BMC: an artifact nested inside tagged content, which veraPDF rejects. The .NET
// suite asserts the same cases (ChartTaggingTests).

function sampleData(): ChartData {
  const series = new ChartSeries();
  for (const [label, value] of [
    ['A', 3],
    ['B', 5],
  ] as const) {
    const point = new ChartDataPoint();
    point.label = label;
    point.value = value;
    series.dataPoints.push(point);
  }
  const data = new ChartData();
  data.series.push(series);
  return data;
}

function renderTagged(populate: (doc: Document) => void): { pdf: string; doc: Document } {
  const doc = new Document();
  doc.settings.conformance = PdfAConformance.PdfA2a;
  doc.settings.accessibility = AccessibilityMode.PdfUa1;
  doc.settings.language = 'en-GB';
  populate(doc);
  return { pdf: pdfToText(doc.generateBytes()), doc };
}

// Fails if an /Artifact region opens while a tagged (MCID-bearing) scope is open.
function expectNoArtifactInsideTaggedContent(pdf: string): void {
  let taggedDepth = 0;
  for (const rawLine of pdf.split('\n')) {
    const line = rawLine.trim();
    if (line.endsWith('BDC') && line.includes('/MCID')) taggedDepth++;
    else if (line === '/Artifact BMC')
      expect(taggedDepth, 'an /Artifact region was opened inside tagged content').toBe(0);
    else if (line === 'EMC' && taggedDepth > 0) taggedDepth--;
  }
}

// As real documents do: inside a container that renders its own children, which opens the
// child's scope on the parent canvas while the chart draws on one from getCanvas.
function nested(child: IElement): Container {
  const stack = new VerticalStack();
  stack.add(child);
  const container = new Container();
  container.child = stack;
  return container;
}

describe('tagging of elements drawn on a positioned canvas', () => {
  it('a chart with alt text does not nest an artifact inside its figure', () => {
    const { pdf } = renderTagged(doc =>
      doc.add(
        nested(
          new BarChart({
            data: sampleData(),
            altText: 'Bar chart of two sample values.',
            height: 120,
            backgroundColor: Color.white,
          })
        )
      )
    );
    expect(pdf).toContain('/Figure');
    expectNoArtifactInsideTaggedContent(pdf);
  });

  it('a decorative chart does not nest an artifact', () => {
    const { pdf } = renderTagged(doc =>
      doc.add(
        nested(new BarChart({ data: sampleData(), isDecorative: true, height: 120, backgroundColor: Color.white }))
      )
    );
    expectNoArtifactInsideTaggedContent(pdf);
  });

  it('a canvas element with alt text does not nest an artifact inside its figure', () => {
    const canvas = new CanvasElement((c, size) => c.fillRect(0, 0, size.width, size.height, ColorPalette.slate[200]), {
      altText: 'A filled sample rectangle.',
      drawHeight: 40,
    });
    const { pdf, doc } = renderTagged(d => d.add(nested(canvas)));
    expectNoArtifactInsideTaggedContent(pdf);
    // Inside its figure, nothing was drawn untagged, so there is nothing to report.
    expect(doc.diagnostics.filter(d => d.category === 'tagging')).toHaveLength(0);
  });
});
