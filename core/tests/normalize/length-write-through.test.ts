import { describe, it, expect } from 'vitest';
import { Container } from '../../src/Elements/Layout/Container';
import { HorizontalStack } from '../../src/Elements/Layout/HorizontalStack';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import { Spacer } from '../../src/Elements/Layout/Spacer';
import { CanvasElement } from '../../src/Elements/Drawing/CanvasElement';
import { TextBlock } from '../../src/Elements/Text/TextBlock';
import { Heading } from '../../src/Elements/Text/Heading';
import { TextStyle } from '../../src/Elements/Text/TextStyle';
import { VisualToc } from '../../src/Elements/Text/VisualToc';
import { OrderedList } from '../../src/Elements/Lists/OrderedList';
import { UnorderedList } from '../../src/Elements/Lists/UnorderedList';
import { Table } from '../../src/Elements/Tables/Table';
import { TableRow } from '../../src/Elements/Tables/TableRow';
import { Image } from '../../src/Elements/Media/Image';
import { Line } from '../../src/Elements/Shapes/Line';
import { Circle } from '../../src/Elements/Shapes/Circle';
import { Ellipse } from '../../src/Elements/Shapes/Ellipse';
import { QRCode } from '../../src/Elements/Shapes/QRCode';
import { DataMatrix } from '../../src/Elements/Shapes/DataMatrix';
import { Barcode } from '../../src/Elements/Shapes/Barcode';
import { Watermark } from '../../src/Configuration/Watermark';
import { DocumentSettings } from '../../src/Configuration/DocumentSettings';
import { Hyperlink } from '../../src/Core/Hyperlink';
import { LineChart } from '../../src/Charts/LineChart';
import { AreaChart } from '../../src/Charts/AreaChart';
import { ChartSeries } from '../../src/Charts/Models/ChartSeries';
import { ChartSeriesStyle } from '../../src/Charts/Models/ChartSeriesStyle';

/**
 * Every options key documented as taking a length must reach a property that
 * *normalises* it. A key widened in the options type while its property stayed
 * a plain number silently stores the raw token — the value reads back as the
 * string `'1in'` instead of `72`, and every downstream measurement turns into
 * `NaN` or string concatenation. TypeScript cannot catch it, because the
 * options applier assigns by key.
 *
 * One inch is 72 points, so a correct write-through always reads back `72`.
 */

const INCH = 72;

/** Builds the thing from options, reads the property back, expects points. */
const cases: [name: string, read: () => unknown][] = [
  ['Container.width', () => new Container({ width: '1in' }).width],
  ['Container.height', () => new Container({ height: '1in' }).height],
  ['Container.cornerRadius', () => new Container({ cornerRadius: '1in' }).cornerRadius],
  ['HorizontalStack.spacing', () => new HorizontalStack({ spacing: '1in' }).spacing],
  ['HorizontalStack.height', () => new HorizontalStack({ height: '1in' }).height],
  ['VerticalStack.spacing', () => new VerticalStack({ spacing: '1in' }).spacing],
  ['Spacer.height', () => new Spacer({ height: '1in' }).height],
  ['CanvasElement.drawWidth', () => new CanvasElement(() => {}, { drawWidth: '1in' }).drawWidth],
  ['CanvasElement.drawHeight', () => new CanvasElement(() => {}, { drawHeight: '1in' }).drawHeight],
  ['TextBlock.fontSize', () => new TextBlock('x', { fontSize: '1in' }).fontSize],
  ['TextBlock.letterSpacing', () => new TextBlock('x', { letterSpacing: '1in' }).letterSpacing],
  ['TextBlock.wordSpacing', () => new TextBlock('x', { wordSpacing: '1in' }).wordSpacing],
  ['TextBlock.decorationThickness', () => new TextBlock('x', { decorationThickness: '1in' }).decorationThickness],
  ['TextBlock.firstLineIndent', () => new TextBlock('x', { firstLineIndent: '1in' }).firstLineIndent],
  ['TextBlock.paragraphSpacing', () => new TextBlock('x', { paragraphSpacing: '1in' }).paragraphSpacing],
  ['Heading.fontSize', () => new Heading('x', { fontSize: '1in' }).fontSize],
  ['TextStyle.fontSize', () => new TextStyle({ fontSize: '1in' }).fontSize],
  ['TextStyle.letterSpacing', () => new TextStyle({ letterSpacing: '1in' }).letterSpacing],
  ['TextStyle.wordSpacing', () => new TextStyle({ wordSpacing: '1in' }).wordSpacing],
  ['TextStyle.decorationThickness', () => new TextStyle({ decorationThickness: '1in' }).decorationThickness],
  ['TextStyle.baselineShift', () => new TextStyle({ baselineShift: '1in' }).baselineShift],
  ['VisualToc.fontSize', () => new VisualToc({ fontSize: '1in' }).fontSize],
  ['OrderedList.indent', () => new OrderedList({ indent: '1in' }).indent],
  ['OrderedList.itemSpacing', () => new OrderedList({ itemSpacing: '1in' }).itemSpacing],
  ['UnorderedList.indent', () => new UnorderedList({ indent: '1in' }).indent],
  ['Table.cellPadding', () => new Table({ cellPadding: '1in' }).cellPadding],
  ['TableRow.minHeight', () => new TableRow({ minHeight: '1in' }).minHeight],
  ['Image.width', () => new Image({ width: '1in' }).width],
  ['Image.height', () => new Image({ height: '1in' }).height],
  ['Line.thickness', () => new Line({ thickness: '1in' }).thickness],
  ['Line.length', () => new Line({ length: '1in' }).length],
  ['Circle.diameter', () => new Circle({ diameter: '1in' }).diameter],
  ['Ellipse.width', () => new Ellipse({ width: '1in' }).width],
  ['Ellipse.height', () => new Ellipse({ height: '1in' }).height],
  ['QRCode.size', () => new QRCode({ size: '1in' }).size],
  ['DataMatrix.size', () => new DataMatrix({ size: '1in' }).size],
  ['Barcode.height', () => new Barcode({ height: '1in' }).height],
  ['Barcode.moduleWidth', () => new Barcode({ moduleWidth: '1in' }).moduleWidth],
  ['Barcode.textLabelFontSize', () => new Barcode({ textLabelFontSize: '1in' }).textLabelFontSize],
  ['Watermark.fontSize', () => new Watermark({ fontSize: '1in' }).fontSize],
  ['DocumentSettings.margin', () => new DocumentSettings({ margin: '1in' }).margin],
  ['Hyperlink.fontSize', () => new Hyperlink({ text: 'x', uri: 'https://example.com', fontSize: '1in' }).fontSize],
  ['LineChart.width', () => new LineChart({ width: '1in' }).width],
  ['LineChart.height', () => new LineChart({ height: '1in' }).height],
  ['LineChart.labelFontSize', () => new LineChart({ labelFontSize: '1in' }).labelFontSize],
  ['AreaChart.lineWidth', () => new AreaChart({ lineWidth: '1in' }).lineWidth],
  ['ChartSeriesStyle.lineWidth', () => new ChartSeriesStyle({ lineWidth: '1in' }).lineWidth],
  ['ChartSeriesStyle.markerRadius', () => new ChartSeriesStyle({ markerRadius: '1in' }).markerRadius],
  ['ChartSeriesStyle.stemWidth', () => new ChartSeriesStyle({ stemWidth: '1in' }).stemWidth],
  ['ChartSeries.style.lineWidth', () => new ChartSeries({ style: { lineWidth: '1in' } }).style.lineWidth],
];

describe('every length option normalises through to its property', () => {
  it.each(cases)('%s', (_name, read) => {
    const value = read();
    expect(typeof value).toBe('number');
    expect(value).toBeCloseTo(INCH, 6);
  });

  it('covers the spacing sides on the shared element base', () => {
    const c = new Container({ margin: { top: '1in' }, padding: ['1in', '1in'] });
    expect(c.margin.top).toBeCloseTo(INCH, 6);
    expect(c.padding.left).toBeCloseTo(INCH, 6);
  });
});
