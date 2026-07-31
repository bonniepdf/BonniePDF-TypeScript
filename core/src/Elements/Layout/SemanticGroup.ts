import { VerticalStack, type VerticalStackOptions } from './VerticalStack';
import { IRoleProvider } from '../../Rendering/Tagging/IRoleProvider';
import { SemanticRole } from '../../Rendering/Tagging/SemanticRole';

/**
 * A layout container that wraps its children in an explicit PDF/UA semantic
 * structure role. Use this when a block of content has a specific role (e.g.
 * {@link SemanticRole.Sect}, {@link SemanticRole.Art},
 * {@link SemanticRole.BlockQuote}) that isn't expressed by any individual
 * child element.
 *
 * When tagging is enabled ({@link AccessibilityMode.PdfUa1}) the pipeline
 * wraps the whole group in a single structure element with the configured
 * {@link semanticRole}. Children that are themselves {@link IRoleProvider}
 * get their own nested structure elements.
 */
/**
 * Options for {@link SemanticGroup}. The role itself is not a settable property
 * (it is exposed read-only as `semanticRole`), so it stays a constructor value.
 */
export type SemanticGroupOptions = VerticalStackOptions;

export class SemanticGroup extends VerticalStack implements IRoleProvider {
  private readonly _role: SemanticRole;

  /** Creates a semantic group for the given role. */
  constructor(role: SemanticRole, options?: SemanticGroupOptions);
  /** Options-only form; `role` is required either way. */
  constructor(options: SemanticGroupOptions & { role: SemanticRole });
  constructor(
    roleOrOptions: SemanticRole | (SemanticGroupOptions & { role: SemanticRole }),
    options?: SemanticGroupOptions
  ) {
    // SemanticRole is a string enum, so a string first argument is the role.
    const isPositional = typeof roleOrOptions === 'string';
    super((isPositional ? options : roleOrOptions) ?? {});
    this._role = isPositional ? roleOrOptions : roleOrOptions.role;
  }

  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return this._role;
  }
}
