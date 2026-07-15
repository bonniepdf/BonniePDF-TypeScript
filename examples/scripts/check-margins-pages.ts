import { writeFileSync } from 'node:fs';
import { registerBundledFonts } from './register-bundled-fonts.ts';
import { generate } from '../src/recipes/basics/margins-and-padding.ts';

registerBundledFonts();

const doc = generate();
const bytes = await doc.generateBytesAsync();
const text = Buffer.from(bytes).toString('latin1');
const pages = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
console.log(`margins-and-padding: ${pages} page(s), ${bytes.length} bytes`);

const svgs = await doc.generateSvgPagesAsync();
svgs.forEach((svg, i) => writeFileSync(`page-${i + 1}.svg`, svg));
console.log(`wrote ${svgs.length} svg page(s)`);
