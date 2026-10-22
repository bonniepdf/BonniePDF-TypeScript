import { Color } from '../Core/Color';
import { ColorPalette } from '../Core/ColorPalette';
import { adler32 } from '../Rendering/Compression/Deflate';

const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Carol',
  'Dan',
  'Eve',
  'Frank',
  'Grace',
  'Hank',
  'Iris',
  'Jack',
  'Kate',
  'Leo',
  'Mia',
  'Nate',
  'Olivia',
  'Pete',
  'Quinn',
  'Rose',
  'Sam',
  'Tina',
  'Uma',
  'Victor',
  'Wendy',
  'Xander',
  'Yara',
  'Zach',
  'Amy',
  'Brian',
  'Chloe',
  'David',
  'Emma',
  'Felix',
  'Gina',
  'Hugo',
  'Isabel',
  'James',
  'Karen',
  'Liam',
  'Mona',
  'Neil',
  'Ophelia',
  'Paul',
  'Rachel',
  'Steven',
  'Theresa',
  'Ulrich',
  'Violet',
  'Will',
  'Xena',
  'Yvonne',
];

const LAST_NAMES = [
  'Smith',
  'Jones',
  'Brown',
  'Taylor',
  'Wilson',
  'Davis',
  'Moore',
  'Anderson',
  'Thomas',
  'Jackson',
  'White',
  'Harris',
  'Martin',
  'Garcia',
  'Martinez',
  'Lee',
  'Perez',
  'Thompson',
  'Walker',
  'Hall',
  'Allen',
  'Young',
  'Hernandez',
  'King',
  'Wright',
  'Lopez',
  'Hill',
  'Scott',
  'Green',
  'Adams',
  'Baker',
  'Nelson',
  'Carter',
  'Mitchell',
  'Roberts',
  'Turner',
  'Phillips',
  'Campbell',
  'Parker',
  'Evans',
  'Edwards',
  'Collins',
  'Stewart',
  'Sanchez',
  'Morris',
  'Rogers',
  'Reed',
  'Cook',
  'Morgan',
  'Bell',
];

const DEPARTMENTS = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Design', 'Operations'];
const ROLES = ['Manager', 'Lead', 'Senior', 'Junior', 'Intern', 'Director', 'VP'];
const LOCATIONS = ['New York', 'London', 'Berlin', 'Tokyo', 'Sydney', 'Toronto', 'Paris'];

const COMPANY_NAMES = [
  'Sample Company',
  'Sample Customer',
  'Sample Supplier',
  'Sample Software',
  'Sample Industries',
  'Sample Solutions',
  'Sample Systems',
  'Sample Services',
  'Sample Retail',
  'Sample Group',
];

const LOREM_SENTENCES = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.',
  'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',
  'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis.',
  'Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse.',
  'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis.',
  'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit.',
  'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus.',
  'Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis.',
  'Nulla facilisi cras fermentum odio eu feugiat pretium nibh ipsum consequat.',
  'Viverra justo nec ultrices dui sapien eget mi proin sed libero enim.',
];

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SERVICE_NAMES = [
  'Strategy Workshop',
  'Identity Design',
  'Website Design',
  'Development',
  'Motion Graphics',
  'Content Strategy',
  'SEO Audit',
  'Brand Guidelines',
  'UX Research',
  'Copywriting',
];

const SERVICE_DESCRIPTIONS = [
  '2-day brand strategy intensive',
  'Logo, colors, typography system',
  'Responsive website with animations',
  'Next.js with CMS integration',
  'Hero animations, micro-interactions',
  'Content calendar and editorial plan',
  'Technical SEO and keyword analysis',
  'Comprehensive style guide document',
  'User interviews and usability testing',
  'Website and marketing copy',
];

const BACKGROUND_COLORS = [
  ColorPalette.blue[50],
  ColorPalette.green[50],
  ColorPalette.amber[50],
  ColorPalette.rose[50],
  ColorPalette.indigo[50],
  ColorPalette.slate[50],
  ColorPalette.purple[50],
  ColorPalette.cyan[50],
];

const ACCENT_COLORS = [
  ColorPalette.indigo[600],
  ColorPalette.blue[600],
  ColorPalette.green[600],
  ColorPalette.amber[600],
  ColorPalette.rose[600],
  ColorPalette.purple[600],
  ColorPalette.cyan[600],
  ColorPalette.slate[600],
];

export interface InvoiceLineItem {
  service: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

/** Generates deterministic sample values for document prototypes. */
class PlaceholderSource {
  private index = 0;

  constructor(seed: number) {
    this.index = Math.abs(seed) % 1000;
  }

  private next(max: number): number {
    // Math.imul reproduces .NET's 32-bit signed integer multiply (low 32 bits,
    // overflow wraps). A plain `this.index * 1103515245` is a float64 multiply
    // whose product exceeds Number.MAX_SAFE_INTEGER, dropping low bits before
    // the mask and diverging from the .NET sequence. Keep this in lockstep.
    this.index = (Math.imul(this.index, 1103515245) + 12345) & 0x7fffffff;
    return this.index % max;
  }

  word(): string {
    const words = LOREM_SENTENCES[this.next(LOREM_SENTENCES.length)].split(' ');
    return words[this.next(words.length)].replace(/[.,]/g, '');
  }

  label(): string {
    return `${this.word()} ${this.word()}`.replace(/^\w/, c => c.toUpperCase());
  }

  sentence(): string {
    return LOREM_SENTENCES[this.next(LOREM_SENTENCES.length)];
  }

  paragraph(): string {
    const count = 3 + this.next(4);
    const sentences: string[] = [];
    for (let i = 0; i < count; i++) sentences.push(this.sentence());
    return sentences.join(' ');
  }

  paragraphs(count = 3): string {
    const result: string[] = [];
    for (let i = 0; i < count; i++) result.push(this.paragraph());
    return result.join('\n\n');
  }

  name(): string {
    return `${FIRST_NAMES[this.next(FIRST_NAMES.length)]} ${LAST_NAMES[this.next(LAST_NAMES.length)]}`;
  }

  firstName(): string {
    return FIRST_NAMES[this.next(FIRST_NAMES.length)];
  }

  lastName(): string {
    return LAST_NAMES[this.next(LAST_NAMES.length)];
  }

  email(): string {
    const first = FIRST_NAMES[this.next(FIRST_NAMES.length)].toLowerCase();
    const last = LAST_NAMES[this.next(LAST_NAMES.length)].toLowerCase();
    const domains = ['company.com', 'example.com', 'mail.org', 'work.net'];
    return `${first}.${last}@${domains[this.next(domains.length)]}`;
  }

  phoneNumber(): string {
    const area = 200 + this.next(800);
    const mid = 100 + this.next(900);
    const end = 1000 + this.next(9000);
    return `(${area}) ${mid}-${end}`;
  }

  companyName(): string {
    return COMPANY_NAMES[this.next(COMPANY_NAMES.length)];
  }

  department(): string {
    return DEPARTMENTS[this.next(DEPARTMENTS.length)];
  }

  role(): string {
    return ROLES[this.next(ROLES.length)];
  }

  location(): string {
    return LOCATIONS[this.next(LOCATIONS.length)];
  }

  integer(min = 0, max = 1000): number {
    return min + this.next(max - min + 1);
  }

  decimal(min = 0, max = 1000, decimals = 2): number {
    const raw = min + (this.next(10000) / 10000) * (max - min);
    const factor = Math.pow(10, decimals);
    return Math.round(raw * factor) / factor;
  }

  percent(min = 0, max = 100): string {
    return `${this.integer(min, max)}%`;
  }

  currency(min = 1, max = 10000, symbol = '$'): string {
    return `${symbol}${this.decimal(min, max, 2).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  shortDate(): string {
    const m = 1 + this.next(12);
    const d = 1 + this.next(28);
    const y = 2020 + this.next(7);
    return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`;
  }

  longDate(): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const m = this.next(12);
    const d = 1 + this.next(28);
    const y = 2020 + this.next(7);
    return `${d} ${months[m]} ${y}`;
  }

  monthLabel(): string {
    return MONTH_LABELS[this.next(MONTH_LABELS.length)];
  }

  backgroundColor(): Color {
    return BACKGROUND_COLORS[this.next(BACKGROUND_COLORS.length)];
  }

  color(): Color {
    return ACCENT_COLORS[this.next(ACCENT_COLORS.length)];
  }

  invoiceLines(count = 5): InvoiceLineItem[] {
    const items: InvoiceLineItem[] = [];
    for (let i = 0; i < count; i++) {
      const idx = this.next(SERVICE_NAMES.length);
      const qty = 1 + this.next(5);
      const price = 500 + this.next(12) * 500;
      items.push({
        service: SERVICE_NAMES[idx],
        description: SERVICE_DESCRIPTIONS[idx],
        quantity: qty,
        unitPrice: price,
        total: qty * price,
      });
    }
    return items;
  }

  tableRows(rows = 5, columns = 4): string[][] {
    const result: string[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: string[] = [];
      for (let c = 0; c < columns; c++) {
        if (c === 0) row.push(this.name());
        else if (c === 1) row.push(this.department());
        else if (c === 2) row.push(this.location());
        else row.push(this.percent());
      }
      result.push(row);
    }
    return result;
  }

  monthlyValues(count = 12, min = 50, max = 300): number[] {
    const values: number[] = [];
    for (let i = 0; i < count; i++) values.push(this.integer(min, max));
    return values;
  }

  image(opts: { width: number; height: number }): Uint8Array {
    return buildPlaceholderPng(opts.width, opts.height, this.next(360));
  }
}

let globalSource = new PlaceholderSource(42);

export const Placeholders = {
  word: () => globalSource.word(),
  label: () => globalSource.label(),
  sentence: () => globalSource.sentence(),
  paragraph: () => globalSource.paragraph(),
  paragraphs: (count?: number) => globalSource.paragraphs(count),

  name: () => globalSource.name(),
  firstName: () => globalSource.firstName(),
  lastName: () => globalSource.lastName(),
  email: () => globalSource.email(),
  phoneNumber: () => globalSource.phoneNumber(),
  companyName: () => globalSource.companyName(),
  department: () => globalSource.department(),
  role: () => globalSource.role(),
  location: () => globalSource.location(),

  integer: (min?: number, max?: number) => globalSource.integer(min, max),
  decimal: (min?: number, max?: number, decimals?: number) => globalSource.decimal(min, max, decimals),
  percent: (min?: number, max?: number) => globalSource.percent(min, max),
  currency: (min?: number, max?: number, symbol?: string) => globalSource.currency(min, max, symbol),

  shortDate: () => globalSource.shortDate(),
  longDate: () => globalSource.longDate(),
  monthLabel: () => globalSource.monthLabel(),

  backgroundColor: () => globalSource.backgroundColor(),
  color: () => globalSource.color(),

  invoiceLines: (count?: number) => globalSource.invoiceLines(count),
  tableRows: (rows?: number, columns?: number) => globalSource.tableRows(rows, columns),
  monthlyValues: (count?: number, min?: number, max?: number) => globalSource.monthlyValues(count, min, max),

  image: (opts: { width: number; height: number }) => globalSource.image(opts),

  withSeed(seed: number): PlaceholderSource {
    return new PlaceholderSource(seed);
  },

  reset(): void {
    globalSource = new PlaceholderSource(42);
  },
};

function buildPlaceholderPng(width: number, height: number, hueOffset: number): Uint8Array {
  const raw = new Uint8Array(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const rowStart = y * (1 + width * 3);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const r = 200 + Math.floor(40 * Math.sin((x + hueOffset) * 0.05));
      const g = 200 + Math.floor(40 * Math.sin((y + hueOffset) * 0.05));
      const b = 210;
      const off = rowStart + 1 + x * 3;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
    }
  }

  const deflated = deflateRawSimple(raw);
  const chunks: Uint8Array[] = [];

  // PNG signature
  chunks.push(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR
  const ihdr = new Uint8Array(13);
  writeU32(ihdr, 0, width);
  writeU32(ihdr, 4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  chunks.push(pngChunk('IHDR', ihdr));

  // IDAT
  chunks.push(pngChunk('IDAT', deflated));

  // IEND
  chunks.push(pngChunk('IEND', new Uint8Array(0)));

  let total = 0;
  for (const c of chunks) total += c.length;
  const result = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length);
  writeU32(chunk, 0, data.length);
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i);
  chunk.set(data, 8);
  const crc = crc32(chunk.subarray(4, 8 + data.length));
  writeU32(chunk, 8 + data.length, crc);
  return chunk;
}

function writeU32(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = (value >>> 24) & 0xff;
  buf[offset + 1] = (value >>> 16) & 0xff;
  buf[offset + 2] = (value >>> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function deflateRawSimple(data: Uint8Array): Uint8Array {
  // Minimal zlib wrapper around uncompressed deflate blocks
  const blocks: Uint8Array[] = [];
  const BLOCK_SIZE = 65535;
  for (let i = 0; i < data.length; i += BLOCK_SIZE) {
    const end = Math.min(i + BLOCK_SIZE, data.length);
    const len = end - i;
    const isFinal = end === data.length;
    const block = new Uint8Array(5 + len);
    block[0] = isFinal ? 0x01 : 0x00;
    block[1] = len & 0xff;
    block[2] = (len >>> 8) & 0xff;
    block[3] = ~len & 0xff;
    block[4] = (~len >>> 8) & 0xff;
    block.set(data.subarray(i, end), 5);
    blocks.push(block);
  }

  let totalLen = 2 + 4; // zlib header + adler32
  for (const b of blocks) totalLen += b.length;
  const result = new Uint8Array(totalLen);
  result[0] = 0x78; // CMF
  result[1] = 0x01; // FLG
  let offset = 2;
  for (const b of blocks) {
    result.set(b, offset);
    offset += b.length;
  }

  const adler = adler32(data);
  writeU32(result, offset, adler);
  return result;
}
