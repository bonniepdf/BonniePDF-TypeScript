// Scratch renderer: build one showcase module directly to PDF + SVG for eyeballing.
import { writeFileSync } from 'node:fs';
import { registerBundledFonts } from './register-bundled-fonts.ts';

registerBundledFonts();

const mod = process.argv[2];
const out = process.argv[3] ?? 'out';
const { generate } = (await import(mod)) as { generate: () => import('@bonniepdf/core').Document };
const doc = generate();
const bytes = doc.generateBytes();
writeFileSync(`${out}.pdf`, bytes);
const { pages } = await generate().generateSvgDocumentAsync({ precision: 3, includeAccessibilityMetadata: true });
pages.forEach((p: string, i: number) => writeFileSync(`${out}-p${i + 1}.svg`, p));
const text = new TextDecoder('latin1').decode(bytes);
console.log(`pages=${pages.length} bytes=${bytes.length} structTree=${text.includes('/StructTreeRoot')} header=${text.slice(0, 8)}`);
