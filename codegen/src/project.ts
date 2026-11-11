import { validateDefinition, type DocumentDefinition } from '@bonniepdf/core/definition';
import { emptyAnnotations, validateAnnotations, type CodeAnnotations } from './authoring';
export interface AuthoringProject {
  format: 'bonniepdf-authoring-project';
  version: 1;
  definition: DocumentDefinition;
  annotations: CodeAnnotations;
  catalogue?: { id: string; title: string; description?: string; category?: string };
}
export interface ProjectIssue {
  path: string;
  code: string;
  message: string;
}
export class ProjectError extends Error {
  constructor(public readonly issues: readonly ProjectIssue[]) {
    super(issues.map(issue => `${issue.path || '/'}: ${issue.message}`).join('\n'));
    this.name = 'ProjectError';
  }
}
const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);
/** Validate the envelope separately; editorial data never enters core definitions. */
export function validateProject(input: unknown): { valid: boolean; issues: ProjectIssue[] } {
  const issues: ProjectIssue[] = [];
  if (!isObject(input))
    return { valid: false, issues: [{ path: '', code: 'invalid-type', message: 'Expected an authoring project.' }] };
  const issue = (path: string, code: string, message: string) => issues.push({ path, code, message });
  for (const key of Object.keys(input))
    if (!['format', 'version', 'definition', 'annotations', 'catalogue'].includes(key))
      issue(`/${key}`, 'unknown-key', `Unknown authoring-project key ${key}.`);
  if (input.format !== 'bonniepdf-authoring-project')
    issue('/format', 'unsupported-format', 'Expected bonniepdf-authoring-project.');
  if (input.version !== 1) issue('/version', 'unsupported-version', 'Supported authoring-project version is 1.');
  const definition = validateDefinition(input.definition, { strict: true });
  for (const error of definition.errors) issues.push({ ...error, path: '/definition' + error.path });
  for (const warning of definition.warnings || [])
    if (warning.code === 'unknown-key') issues.push({ ...warning, path: '/definition' + warning.path });
  const annotations = validateAnnotations(input.annotations, input.definition);
  for (const error of annotations.issues) issues.push({ ...error, path: '/annotations' + error.path });
  try {
    if (new TextEncoder().encode(JSON.stringify(input.annotations)).length > 2 * 1024 * 1024)
      issue('/annotations', 'limit-exceeded', 'Editorial metadata exceeds 2 MiB.');
  } catch {
    issue('/annotations', 'invalid-type', 'Editorial metadata must be JSON data without cycles.');
  }
  if (input.catalogue !== undefined) {
    if (!isObject(input.catalogue)) issue('/catalogue', 'invalid-type', 'Expected catalogue metadata.');
    else {
      for (const key of Object.keys(input.catalogue))
        if (!['id', 'title', 'description', 'category'].includes(key))
          issue(`/catalogue/${key}`, 'unknown-key', `Unknown catalogue key ${key}.`);
      for (const key of ['id', 'title', 'description', 'category']) {
        const value = input.catalogue[key];
        if (value === undefined && ['description', 'category'].includes(key)) continue;
        if (typeof value !== 'string' || !value.trim() || value.length > 10000)
          issue(`/catalogue/${key}`, 'invalid-type', 'Expected nonempty catalogue text of at most 10,000 characters.');
      }
      if (typeof input.catalogue.id === 'string' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.catalogue.id))
        issue('/catalogue/id', 'invalid-identifier', 'Use a kebab-case catalogue ID.');
    }
  }
  return { valid: issues.length === 0, issues };
}
export function createProject(
  definition: DocumentDefinition,
  annotations: CodeAnnotations = emptyAnnotations()
): AuthoringProject {
  const project: AuthoringProject = { format: 'bonniepdf-authoring-project', version: 1, definition, annotations };
  const validation = validateProject(project);
  if (!validation.valid) throw new ProjectError(validation.issues);
  return structuredClone(project);
}
export function serializeProject(project: AuthoringProject): string {
  const validation = validateProject(project);
  if (!validation.valid) throw new ProjectError(validation.issues);
  return JSON.stringify(project, null, 2) + '\n';
}
export function parseProject(contents: string): AuthoringProject {
  if (new TextEncoder().encode(contents).length > 20 * 1024 * 1024)
    throw new ProjectError([
      {
        path: '',
        code: 'limit-exceeded',
        message: 'Authoring-project JSON exceeds 20 MiB; use a resource-backed bundle.',
      },
    ]);
  let project: unknown;
  try {
    project = JSON.parse(contents);
  } catch {
    throw new ProjectError([{ path: '', code: 'invalid-json', message: 'Authoring project is not valid JSON.' }]);
  }
  const validation = validateProject(project);
  if (!validation.valid) throw new ProjectError(validation.issues);
  return project as AuthoringProject;
}
