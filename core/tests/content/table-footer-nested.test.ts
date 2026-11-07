import { describe, it, expect } from 'vitest';
import { Document } from '../../src/Document';
import { Table } from '../../src/Elements/Tables/Table';
import { Container } from '../../src/Elements/Layout/Container';
import { VerticalStack } from '../../src/Elements/Layout/VerticalStack';
import type { IElement } from '../../src/Elements/IElement';

/** Spec 03, Table footers: the footer follows the last body row wherever the table is placed. */
describe('table footer placement', () => {
  function table(): Table {
    const t = new Table({ columns: [1, 1] });
    t.addHeader('Item', 'Amount');
    t.addRow('Widget', '12.00');
    t.addFooter('Total', '12.00');
    return t;
  }

  async function drawsFooter(wrap: (t: Table) => IElement): Promise<boolean> {
    const doc = new Document();
    doc.add(wrap(table()));
    try {
      return (await doc.generateSvgPagesAsync())[0].includes('>Total<');
    } finally {
      doc.dispose();
    }
  }

  it('draws the footer of a table placed on the page', async () => {
    expect(await drawsFooter(t => t)).toBe(true);
  });

  it('draws the footer of a table inside a container', async () => {
    expect(await drawsFooter(t => new Container({ width: 300, child: t }))).toBe(true);
  });

  it('draws the footer of a table inside a stack', async () => {
    expect(await drawsFooter(t => new VerticalStack({ children: [t] }))).toBe(true);
  });
});
