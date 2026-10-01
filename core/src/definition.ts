/**
 * Document Definitions: a whole document as JSON, and back.
 *
 * This is a subpath (`@bonniepdf/core/definition`) so that the reader, the writer and their element table
 * stay out of a bundle that only builds documents in code. Both directions build or inspect every element
 * type, so importing them from the main entry would keep every element in a consumer's bundle.
 */
export { validateDefinition } from './Definition/validateDefinition';
export { DefinitionError, documentFromDefinition as fromDefinition } from './Definition/fromDefinition';
export type { DefinitionReadOptions, DefinitionResourceRequest } from './Definition/fromDefinition';
export { documentToDefinition as toDefinition } from './Definition/toDefinition';
export type {
  DefinitionResourceDescriptor,
  DefinitionWriteOptions,
  DefinitionWriteResult,
} from './Definition/toDefinition';
export {
  DEFINITION_VERSIONS,
  DEFAULT_DEFINITION_LIMITS,
  type DefinitionIssue,
  type DefinitionLimits,
  type DocumentDefinition,
  type ValidateOptions,
  type ValidationResult,
} from './Definition/DefinitionTypes';
