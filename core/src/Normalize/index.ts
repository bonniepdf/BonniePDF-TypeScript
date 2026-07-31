/**
 * Forgiving-input normalisation: the single shared boundary between the
 * ergonomic authoring forms and the canonical value objects the engine uses.
 *
 * Contract: `the specification` §4 and its §4A token-grammar appendix.
 * Every public input path - options constructors, factories, and widened class
 * property setters - resolves through these functions. Two code paths for one
 * grammar is a defect (`09 §2.3` §4-B).
 */

export * from './Tokens';
export * from './toColor';
export * from './toThickness';
export * from './toBorder';
export * from './toPageSize';
export * from './toEnum';
