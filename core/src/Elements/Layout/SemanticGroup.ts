import { VerticalStack } from './VerticalStack';
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
export class SemanticGroup extends VerticalStack implements IRoleProvider {
  private readonly _role: SemanticRole;

  constructor(role: SemanticRole) {
    super();
    this._role = role;
  }

  /** @inheritdoc */
  get semanticRole(): SemanticRole {
    return this._role;
  }
}
