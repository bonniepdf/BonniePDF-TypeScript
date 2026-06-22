import { describe, it, expect, afterEach } from 'vitest';
import { Document } from '../../src/Document';
import { DataMatrix } from '../../src/Elements/Shapes/DataMatrix';
import { DataMatrixEncoder, DataMatrixContentException } from '../../src/Elements/Shapes/DataMatrixEncoder';
import { ColorPalette } from '../../src/Core/ColorPalette';
import { SemanticRole } from '../../src/Rendering/Tagging/SemanticRole';
import { Container } from '../../src/Elements/Layout/Container';
import { Pdf } from '../../src/Fluent/Pdf';
import { ContainerElementExtensions, dataMatrix } from '../../src/Fluent/Extensions/ContainerElementExtensions';
import { pdfToText } from '../helpers/test-base';

// Render a matrix to "#"/"." rows for compact comparison.
function toRows(message: string, rectangular = false): string[] {
  const m = DataMatrixEncoder.encode(message, rectangular);
  return m.modules.map(row => row.map(v => (v ? '#' : '.')).join(''));
}

// ── Golden matrices ──────────────────────────────────────────────────────────
// These are byte-for-byte identical to the upstream datalog/datamatrix-svg
// reference, and every one was confirmed to decode back to its source text with
// zxing-wasm (a real Data Matrix reader). They are the authoritative anchors for
// the encoder: any drift in encodation, Reed-Solomon, or module placement breaks
// them.
const GOLDEN: Record<string, { rectangular: boolean; rows: string[] }> = {
  '1234567890': {
    rectangular: false,
    rows: [
      '#.#.#.#.#.#.',
      '##..#..#.#.#',
      '##..##......',
      '##...###.###',
      '##..#...##..',
      '#.#......#.#',
      '##.#.###....',
      '###.##.##..#',
      '#####..#..#.',
      '##.###.###.#',
      '######.#..#.',
      '############',
    ],
  },
  'HELLO WORLD': {
    rectangular: false,
    rows: [
      '#.#.#.#.#.#.#.#.',
      '##..#.#....#####',
      '#...#.....#..#..',
      '###.#..#.#.#.#.#',
      '#.###...#..#..#.',
      '#.#..#..##...###',
      '#.#.#......###..',
      '#..##..#...#.###',
      '#..###..#######.',
      '#####.##...###.#',
      '##.#.#.#...##...',
      '#..###...##.#..#',
      '##.##.......#.#.',
      '#.#.....####.#.#',
      '#..###.##.##..#.',
      '################',
    ],
  },
  café: {
    rectangular: false,
    rows: [
      '#.#.#.#.#.#.#.',
      '#.#####.###..#',
      '##...#.##.#...',
      '#.#....#..#..#',
      '#.###..#.#.##.',
      '#.#.#.#.##.###',
      '#..###..#.....',
      '#.##.#.#.#..##',
      '##..##.###.#..',
      '#...#.####.#.#',
      '#.#.###..###..',
      '#.####..#...##',
      '##.....#..##..',
      '##############',
    ],
  },
  '12345-rect': {
    rectangular: true,
    rows: [
      '#.#.#.#.#.#.#.#.#.',
      '##.##........##.##',
      '##...#..#..#..##..',
      '##..##.#..#.#..#.#',
      '###..##.##....#...',
      '#.##....#.##.#.###',
      '#..#.##.#.##...#..',
      '##################',
    ],
  },
};

describe('DataMatrixEncoder - golden matrices (verified against a real reader)', () => {
  for (const [label, { rectangular, rows }] of Object.entries(GOLDEN)) {
    const message = label === '12345-rect' ? '12345' : label;
    it(`encodes ${JSON.stringify(message)}${rectangular ? ' (rectangular)' : ''}`, () => {
      expect(toRows(message, rectangular)).toEqual(rows);
    });
  }
});

describe('DataMatrixEncoder - structural invariants', () => {
  it('picks a valid ECC200 square size and stays square', () => {
    const m = DataMatrixEncoder.encode('Wikipedia');
    expect(m.width).toBe(m.height);
    // Valid square symbol dimensions (data region + 2 finder modules per region).
    expect([10, 12, 14, 16, 18, 20, 22, 24, 26, 32, 36, 40, 44, 48, 52, 64, 72, 80, 88, 104, 120, 132, 144]).toContain(
      m.width
    );
  });

  it('produces a rectangular symbol when asked and one fits', () => {
    const m = DataMatrixEncoder.encode('12345', true);
    expect(m.width).toBeGreaterThan(m.height);
    expect([
      [18, 8],
      [32, 8],
      [26, 12],
      [36, 12],
      [36, 16],
      [48, 16],
    ]).toContainEqual([m.width, m.height]);
  });

  it('has a solid finder pattern (left column and bottom row all dark)', () => {
    const m = DataMatrixEncoder.encode('FINDER PATTERN TEST');
    for (let y = 0; y < m.height; y++) expect(m.modules[y][0]).toBe(true); // solid left edge
    for (let x = 0; x < m.width; x++) expect(m.modules[m.height - 1][x]).toBe(true); // solid bottom edge
  });

  it('grows the symbol as the message grows', () => {
    const small = DataMatrixEncoder.encode('A');
    const large = DataMatrixEncoder.encode('A'.repeat(120));
    expect(large.width).toBeGreaterThan(small.width);
  });

  it('encodes binary/Unicode payloads via UTF-8 (Base-256) without throwing', () => {
    expect(() => DataMatrixEncoder.encode('日本語のテキスト')).not.toThrow();
  });

  it('throws DataMatrixContentException when the message is too long', () => {
    expect(() => DataMatrixEncoder.encode('9'.repeat(4000))).toThrow(DataMatrixContentException);
  });
});

describe('DataMatrix element', () => {
  let doc: Document | undefined;
  afterEach(() => doc?.dispose());

  function generate(populate: (d: Document) => void): string {
    doc = new Document();
    populate(doc);
    return pdfToText(doc.generateBytes());
  }

  it('renders into a valid PDF', () => {
    const pdf = generate(d => {
      const dm = new DataMatrix();
      dm.data = 'https://www.bonniepdf.dev';
      d.add(dm);
    });
    expect(pdf).toContain('%PDF-');
    expect(pdf).toContain('%%EOF');
  });

  it('measures a square symbol as exactly the configured size', () => {
    const dm = new DataMatrix();
    dm.data = 'SQUARE';
    dm.size = 120;
    expect(dm.measureHeight(500)).toBeCloseTo(120, 5);
  });

  it('measures a rectangular symbol shorter than it is wide', () => {
    const dm = new DataMatrix();
    dm.data = '12345';
    dm.rectangular = true;
    dm.size = 180; // 18 wide x 8 tall (no quiet zone) => height < width
    expect(dm.measureHeight(500)).toBeLessThan(180);
  });

  it('is a Figure when it carries alt text and an Artifact otherwise', () => {
    const described = new DataMatrix();
    described.data = 'X';
    described.altText = 'Data Matrix linking to the order';
    expect(described.semanticRole).toBe(SemanticRole.Figure);

    const bare = new DataMatrix();
    bare.data = 'X';
    expect(bare.semanticRole).toBe(SemanticRole.Artifact);
  });

  it('honours custom colours', () => {
    const pdf = generate(d => {
      const dm = new DataMatrix();
      dm.data = 'COLOURS';
      dm.foregroundColor = ColorPalette.indigo[700];
      dm.backgroundColor = ColorPalette.indigo[50];
      d.add(dm);
    });
    expect(pdf).toContain('%PDF-');
  });
});

describe('DataMatrix - fluent parity', () => {
  it('the dataMatrix container helper adds a DataMatrix element', () => {
    const container = new Container();
    const dm = ContainerElementExtensions.dataMatrix(container, 'FLUENT', 80);
    expect(dm).toBeInstanceOf(DataMatrix);
    expect(dm.data).toBe('FLUENT');
    expect(dm.size).toBe(80);
  });

  it('the free dataMatrix() function mirrors the static helper', () => {
    const container = new Container();
    const dm = dataMatrix(container, 'FREE');
    expect(dm).toBeInstanceOf(DataMatrix);
    expect(dm.data).toBe('FREE');
  });

  it('renders through the fluent Pdf.create builder', () => {
    const doc = Pdf.create(b => {
      b.page(p => {
        ContainerElementExtensions.dataMatrix(p.content(), 'https://www.bonniepdf.dev', 100);
      });
    }).build();
    const pdf = pdfToText(doc.generateBytes());
    expect(pdf).toContain('%PDF-');
    expect(pdf).toContain('%%EOF');
    doc.dispose();
  });
});
