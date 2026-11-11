import { isPortableIdentifier } from './identifiers';
/** Editorial metadata is separate from the BonniePDF document definition. */
export type CodeTarget = 'typescript' | 'csharp';
export interface CodeNote {
  id: string;
  target: { kind: 'document' } | { kind: 'node'; nodeId: string; property?: string };
  placement: 'before' | 'after';
  text: string;
  overrides?: Partial<Record<CodeTarget, string>>;
}
export interface CodeSection {
  id: string;
  label: string;
  nodeIds: string[];
  helperName?: string;
}
export interface CodeAnnotations {
  version: 1;
  notes: CodeNote[];
  sections: CodeSection[];
}
export interface AuthoringIssue {
  path: string;
  code:
    | 'invalid-type'
    | 'unknown-key'
    | 'unsupported-version'
    | 'duplicate-id'
    | 'missing-target'
    | 'invalid-identifier'
    | 'limit-exceeded';
  message: string;
}
export interface AnnotationValidation {
  valid: boolean;
  issues: AuthoringIssue[];
}
const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const targets = ['typescript', 'csharp'];

export const emptyAnnotations = (): CodeAnnotations => ({ version: 1, notes: [], sections: [] });

/** Validate attachment identity/shape without executing or modifying document content. */
export function validateAnnotations(input: unknown, definition: unknown): AnnotationValidation {
  const issues: AuthoringIssue[] = [];
  const issue = (path: string, code: AuthoringIssue['code'], message: string) => issues.push({ path, code, message });
  const keys = (value: Record<string, unknown>, allowed: string[], path: string) => {
    for (const key of Object.keys(value))
      if (!allowed.includes(key)) issue(`${path}/${key}`, 'unknown-key', `Unknown editorial key ${key}.`);
  };
  const text = (value: unknown, path: string, nonempty = false) => {
    if (typeof value !== 'string' || (nonempty && !value.trim())) {
      issue(path, 'invalid-type', 'Expected text' + (nonempty ? ' with a value.' : '.'));
      return false;
    }
    if (value.length > 100000) issue(path, 'limit-exceeded', 'Editorial text exceeds 100,000 characters.');
    return true;
  };
  if (!object(input))
    return { valid: false, issues: [{ path: '', code: 'invalid-type', message: 'Expected editorial metadata.' }] };
  keys(input, ['version', 'notes', 'sections'], '');
  if (input.version !== 1) issue('/version', 'unsupported-version', 'Supported annotation version is 1.');
  // Identity addresses deliberately exclude unstable positions and generated line numbers.
  const nodes = new Map<string, Record<string, unknown>>();
  const visited = new Set<object>();
  const stack = [definition];
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== 'object' || visited.has(value)) continue;
    visited.add(value);
    if (visited.size > 100000) {
      issue('', 'limit-exceeded', 'Document traversal limit exceeded.');
      break;
    }
    if (object(value) && typeof value.type === 'string' && typeof value.id === 'string') {
      if (nodes.has(value.id)) issue('', 'duplicate-id', `Document ID ${value.id} is ambiguous.`);
      nodes.set(value.id, value);
    }
    stack.push(...Object.values(value));
  }
  const ids = new Set<string>();
  const identity = (id: unknown, path: string) => {
    if (!text(id, path, true)) return;
    if (ids.has(id as string)) issue(path, 'duplicate-id', 'Editorial IDs must be unique.');
    ids.add(id as string);
  };
  const array = (value: unknown, path: string): unknown[] => {
    if (!Array.isArray(value)) {
      issue(path, 'invalid-type', 'Expected an array.');
      return [];
    }
    if (value.length > 10000) {
      issue(path, 'limit-exceeded', 'Editorial array exceeds 10,000 entries.');
      return value.slice(0, 10000);
    }
    return value;
  };
  array(input.notes, '/notes').forEach((note, index) => {
    const path = `/notes/${index}`;
    if (!object(note)) {
      issue(path, 'invalid-type', 'Expected a code note.');
      return;
    }
    keys(note, ['id', 'target', 'placement', 'text', 'overrides'], path);
    identity(note.id, `${path}/id`);
    text(note.text, `${path}/text`);
    if (!['before', 'after'].includes(note.placement as string))
      issue(`${path}/placement`, 'invalid-type', 'Placement must be before or after.');
    if (!object(note.target)) issue(`${path}/target`, 'invalid-type', 'Expected a note target.');
    else if (note.target.kind === 'document') keys(note.target, ['kind'], `${path}/target`);
    else if (note.target.kind === 'node') {
      keys(note.target, ['kind', 'nodeId', 'property'], `${path}/target`);
      const node = nodes.get(note.target.nodeId as string);
      if (!node) issue(`${path}/target/nodeId`, 'missing-target', 'The target component is missing or ambiguous.');
      if (note.target.property !== undefined) {
        text(note.target.property, `${path}/target/property`, true);
        if (node && (typeof note.target.property !== 'string' || !Object.hasOwn(node, note.target.property)))
          issue(`${path}/target/property`, 'missing-target', 'The target property is no longer authored.');
      }
    } else issue(`${path}/target/kind`, 'invalid-type', 'Target must be document or node.');
    if (note.overrides !== undefined) {
      if (!object(note.overrides)) issue(`${path}/overrides`, 'invalid-type', 'Expected language overrides.');
      else {
        keys(note.overrides, targets, `${path}/overrides`);
        for (const [language, content] of Object.entries(note.overrides))
          text(content, `${path}/overrides/${language}`);
      }
    }
  });
  array(input.sections, '/sections').forEach((section, index) => {
    const path = `/sections/${index}`;
    if (!object(section)) {
      issue(path, 'invalid-type', 'Expected a code section.');
      return;
    }
    keys(section, ['id', 'label', 'nodeIds', 'helperName'], path);
    identity(section.id, `${path}/id`);
    text(section.label, `${path}/label`, true);
    const own = new Set<string>();
    array(section.nodeIds, `${path}/nodeIds`).forEach((id, i) => {
      if (typeof id !== 'string' || !nodes.has(id))
        issue(`${path}/nodeIds/${i}`, 'missing-target', 'The section component is missing or ambiguous.');
      else if (own.has(id)) issue(`${path}/nodeIds/${i}`, 'duplicate-id', 'A section cannot repeat a component.');
      else own.add(id);
    });
    if (
      section.helperName !== undefined &&
      (typeof section.helperName !== 'string' || !isPortableIdentifier(section.helperName))
    )
      issue(`${path}/helperName`, 'invalid-identifier', 'Use a portable non-keyword helper identifier.');
  });
  return { valid: issues.length === 0, issues };
}

/** Render all physical lines as comments; note text can never inject a statement. */
export function emitNote(note: CodeNote, language: CodeTarget, indent = ''): string {
  if (!/^[ \t]*$/.test(indent)) throw Error('Comment indentation must contain only spaces or tabs.');
  return (note.overrides?.[language] ?? note.text)
    .split(/\r\n|[\n\r\u2028\u2029]/)
    .map(line => {
      const directive =
        /^\s*(?:@ts-(?:ignore|expect-error|nocheck|check)\b|prettier-ignore\b|eslint(?:-|\s)|(?:istanbul|c8|v8) ignore\b)/.test(
          line
        );
      return `${indent}//${line ? ` ${directive ? 'Note: ' : ''}${line}` : ''}`;
    })
    .join('\n');
}

/** Remap only copied component targets; notes on the original remain unchanged. */
export function copyAnnotations(
  input: CodeAnnotations,
  nodeIds: ReadonlyMap<string, string>,
  nextId: () => string
): CodeAnnotations {
  return {
    version: 1,
    notes: input.notes
      .filter(note => note.target.kind === 'node' && nodeIds.has(note.target.nodeId))
      .map(note => {
        const copy = structuredClone(note);
        copy.id = nextId();
        if (copy.target.kind === 'node') copy.target.nodeId = nodeIds.get(copy.target.nodeId)!;
        return copy;
      }),
    sections: input.sections
      .filter(section => section.nodeIds.some(id => nodeIds.has(id)))
      .map(section => ({
        ...structuredClone(section),
        id: nextId(),
        nodeIds: section.nodeIds.filter(id => nodeIds.has(id)).map(id => nodeIds.get(id)!),
      })),
  };
}
