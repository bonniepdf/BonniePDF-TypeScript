import type { Plugin } from 'prettier';
import { format } from 'prettier/standalone';
import * as typescript from 'prettier/plugins/typescript';
import * as estree from 'prettier/plugins/estree';
import type { CodeTarget } from './authoring';
import type { GeneratedRange } from './generate';

/** Pinned formatting is part of the generator output contract. */
export async function formatSource(source: string, target: CodeTarget): Promise<string> {
  if (target === 'typescript')
    return format(source, {
      parser: 'typescript',
      plugins: [typescript, estree as unknown as Plugin],
      printWidth: 100,
      tabWidth: 2,
      singleQuote: true,
      endOfLine: 'lf',
    });
  return source.split('\n').flatMap(formatCSharpLine).join('\n');
}
function formatCSharpLine(line: string): string[] {
  if (!line.includes('{') || line.trimStart().startsWith('//')) return [line];
  const base = line.match(/^\s*/)?.[0] || '';
  const output: string[] = [];
  let current = base,
    depth = 0,
    quoted = false,
    escaped = false;
  const delimiters: string[] = [];
  const flush = () => {
    output.push(current.trimEnd());
    current = base + '    '.repeat(depth);
  };
  const input = line.slice(base.length);
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      current += c;
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') quoted = false;
      continue;
    }
    if (c === '"') {
      quoted = true;
      current += c;
      continue;
    }
    if (c === '{') {
      delimiters.push(c);
      current += c;
      depth++;
      flush();
      while (input[i + 1] === ' ') i++;
      continue;
    }
    if (c === '}') {
      if (current.trim()) flush();
      depth--;
      current = base + '    '.repeat(depth) + '}';
      delimiters.pop();
      continue;
    }
    if (['(', '[', '<'].includes(c)) delimiters.push(c);
    if ([')', ']', '>'].includes(c)) delimiters.pop();
    current += c;
    if (c === ',' && delimiters.at(-1) === '{') {
      flush();
      while (input[i + 1] === ' ') i++;
    }
  }
  if (current.trim()) output.push(current.trimEnd());
  return output;
}
/** Locate complete construction statements after formatting without parsing comments as code. */
export function updateSourceRanges(source: string, ranges: GeneratedRange[]): void {
  const endOfStatement = (start: number): number => {
    let quoted: string | undefined,
      escaped = false,
      depth = 0;
    for (let i = start; i < source.length; i++) {
      const c = source[i];
      if (quoted) {
        if (escaped) escaped = false;
        else if (c === '\\') escaped = true;
        else if (c === quoted) quoted = undefined;
        continue;
      }
      if (c === '"' || c === "'") {
        quoted = c;
        continue;
      }
      if ('({['.includes(c)) depth++;
      if (')}]'.includes(c)) depth--;
      if (c === ';' && depth === 0) return i + 1;
    }
    return source.length;
  };
  const line = (position: number) => source.slice(0, position).split('\n').length;
  for (const range of ranges) {
    const match = new RegExp(`^\\s*(?:const|var) ${range.symbolName}\\s*=`, 'm').exec(source);
    if (!match) throw Error(`Cannot locate generated symbol ${range.symbolName}.`);
    const start = match.index + (match[0].match(/^\s*/)?.[0].length || 0);
    let end = endOfStatement(start);
    while (true) {
      const rest = source.slice(end),
        whitespace = rest.match(/^\s*/)?.[0] || '';
      if (!rest.slice(whitespace.length).startsWith(range.symbolName + '.')) break;
      end = endOfStatement(end + whitespace.length);
    }
    range.startLine = line(start);
    range.endLine = line(end);
  }
}
