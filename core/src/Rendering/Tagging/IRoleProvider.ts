import { SemanticRole } from './SemanticRole';

/**
 * Marker interface for elements that declare a PDF structure role
 * (heading level, paragraph, figure, …). When tagging is enabled, the
 * render pipeline reads this role, pushes a corresponding structure
 * element onto the tree, wraps the element's render in a
 * marked-content sequence, and pops the element afterwards.
 *
 * Elements that don't implement this interface render as before with
 * no structure-tree contribution. Implementing the interface is
 * strictly additive — untagged documents are unaffected because the
 * pipeline checks `RenderContext.tagging` first.
 */
export interface IRoleProvider {
  /**
   * The PDF structure role this element claims (e.g.
   * {@link SemanticRole.H1}, {@link SemanticRole.P},
   * {@link SemanticRole.Figure}).
   */
  readonly semanticRole: SemanticRole;
}

/** Type guard for IRoleProvider — used by the pipeline to detect role-providing elements. */
export function isRoleProvider(x: unknown): x is IRoleProvider {
  return x != null && typeof x === 'object' && 'semanticRole' in (x as object);
}
