/**
 * Forgiving-input normalisation: the single shared boundary between the
 * ergonomic authoring forms and the canonical value objects the engine uses.
 *
 * Every public input path - options constructors, factories, and widened class
 * property setters - resolves through these functions. Two code paths for one
 * grammar is a defect.
 */

export * from './Tokens';
export * from './toColor';
export * from './toLength';
export * from './toThickness';
export * from './toBorder';
export * from './toPageSize';
export * from './toEnum';
