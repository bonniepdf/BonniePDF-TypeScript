import { ELEMENT_DESCRIPTION } from './ElementDescription';
import type { Limits } from './ElementDescriptionTypes';

/** One problem found in a definition, located by JSON Pointer (RFC 6901). */
export interface DefinitionIssue {
  /** JSON Pointer to the value at fault; `''` is the whole document. */
  path: string;
  /** The `id` of the element the problem is in, when it has one. */
  id?: string;
  /** A stable, kebab-case code. */
  code: string;
  /** English text for a person. May improve between releases; the code may not change meaning. */
  message: string;
  /** What the definition should have contained here, when that can be stated. */
  expected?: string;
  /** What the definition contained instead, when that can be stated. */
  found?: string;
  /** The definition format version that introduced the thing the issue is about, when relevant. */
  since?: string;
}

/** A Document Definition: plain JSON data. Its shape is checked by {@link validateDefinition}. */
export interface DocumentDefinition {
  /** Optional URL of the JSON Schema that describes this document. */
  $schema?: string;
  /** Major version of the definition format. */
  version: number;
  /** Minor version of the definition format the document was written for. */
  minorVersion: number;
  /** Document settings, using the same keys as {@link DocumentSettingsOptions}. */
  settings?: Record<string, unknown>;
  /** Document metadata, using the same keys as {@link DocumentMetadataOptions}. */
  metadata?: Record<string, unknown>;
  /** Named resources (images, fonts, SVG and attachments) that elements refer to by name. */
  resources?: Record<string, unknown>;
  /** Files to attach to the PDF. */
  attachments?: unknown[];
  /** The pages of the document, each holding its elements. */
  pages: unknown[];
  [key: string]: unknown;
}

/** The outcome of validating a document definition. */
export interface ValidationResult {
  /** `true` when the definition has no errors. */
  valid: boolean;
  /** Problems that prevent the definition from being used. */
  errors: DefinitionIssue[];
  /** Problems that do not prevent use, such as unrecognised keys. */
  warnings: DefinitionIssue[];
  /** The parsed definition; present only when `valid`. */
  definition?: DocumentDefinition;
}

/** Options for validating a document definition. */
export interface ValidateOptions {
  /** Treat unrecognised keys as errors instead of warnings. */
  strict?: boolean;
  /** Read a document written for a newer minor version, ignoring what is not recognised (each item becomes a warning). */
  bestEffort?: boolean;
  /** Override the default limits. */
  limits?: Partial<Limits>;
}

/** The versions this release reads and writes. */
export const DEFINITION_VERSIONS = Object.freeze({
  /** Major version of the definition format. */
  version: ELEMENT_DESCRIPTION.definition.version,
  /** Oldest minor version that is read. */
  minMinor: 0,
  /** Newest minor version that is read. */
  maxMinor: ELEMENT_DESCRIPTION.definition.minorVersion,
});

export type { Limits as DefinitionLimits };

/** The default {@link DefinitionLimits} applied when reading an untrusted definition. */
export const DEFAULT_DEFINITION_LIMITS: Readonly<Limits> = Object.freeze({ ...ELEMENT_DESCRIPTION.limits });
