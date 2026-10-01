import { ELEMENT_DESCRIPTION } from './ElementDescription';
import type { Limits } from './ElementDescriptionTypes';

/** One problem found in a definition, located by JSON Pointer (RFC 6901). */
export interface DefinitionIssue {
  /** JSON Pointer to the value at fault; `''` is the whole document. */
  path: string;
  /** The `id` of the element the problem is in, when it has one. */
  id?: string;
  /** A stable, kebab-case code; see spec 15 §12.4. */
  code: string;
  /** English text for a person. May improve between releases; the code may not change meaning. */
  message: string;
  expected?: string;
  found?: string;
  since?: string;
}

/** A Document Definition: plain JSON data. Its shape is checked by {@link validateDefinition}. */
export interface DocumentDefinition {
  $schema?: string;
  version: number;
  minorVersion: number;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  resources?: Record<string, unknown>;
  attachments?: unknown[];
  pages: unknown[];
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: DefinitionIssue[];
  warnings: DefinitionIssue[];
  /** The parsed definition; present only when `valid`. */
  definition?: DocumentDefinition;
}

export interface ValidateOptions {
  /** Treat unrecognised keys as errors instead of warnings. */
  strict?: boolean;
  /** Read a document written for a newer minor version, ignoring what is not recognised (each item becomes a warning). */
  bestEffort?: boolean;
  /** Override the default limits (spec 15 §12.3). */
  limits?: Partial<Limits>;
}

/** The versions this release reads and writes (spec 15 §12.2). */
export const DEFINITION_VERSIONS = Object.freeze({
  version: ELEMENT_DESCRIPTION.definition.version,
  minMinor: 0,
  maxMinor: ELEMENT_DESCRIPTION.definition.minorVersion,
});

export type { Limits as DefinitionLimits };

export const DEFAULT_DEFINITION_LIMITS: Readonly<Limits> = Object.freeze({ ...ELEMENT_DESCRIPTION.limits });
