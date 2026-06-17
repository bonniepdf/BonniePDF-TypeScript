import type { RenderContext, IElement } from '../../Elements/IElement';
import { isRoleProvider } from './IRoleProvider';
import { isAltTextProvider } from './IAltTextProvider';
import { toPdfTag, SemanticRole, isContainerRole } from './SemanticRole';

/**
 * Records whether {@link beginChildTag} opened an /Artifact region or a
 * structure-tagged marked-content scope, so {@link endChildTag} can close the
 * matching one. Both `false` means the child declared no role and nothing was
 * opened.
 */
export interface ChildTagToken {
  isArtifact: boolean;
  tagThis: boolean;
}

/**
 * Opens the marked-content / structure scope for a child element about to be
 * rendered, exactly as {@link PdfRenderPipeline} does for page-level elements.
 *
 * Every layout container that renders children itself (stacks, Container, …)
 * must call this (and {@link endChildTag} in a `finally`) around each child, or
 * a role-bearing leaf whose nearest container is one of those would emit
 * untagged real content and fail PDF/UA 7.1 ("content shall be marked as
 * Artifact or tagged as real content"). It is a no-op when tagging is off or
 * the child declares no role, so untagged documents are unaffected.
 */
export function beginChildTag(ctx: RenderContext, child: IElement): ChildTagToken {
  const tagging = ctx.tagging;
  // Inside an /Artifact region (header/footer/slot/decorative subtree) nothing
  // may be tagged as real content - PDF/UA 7.1-2. The child renders as part of
  // the enclosing artifact, so open no structure scope.
  if (tagging != null && typeof ctx.canvas?.isInsideArtifact === 'function' && ctx.canvas.isInsideArtifact()) {
    return { isArtifact: false, tagThis: false };
  }
  const role = tagging != null && isRoleProvider(child) ? child.semanticRole : null;
  // Artifact is a marked-content type, NOT a structure type: a decorative child
  // is wrapped in /Artifact and kept out of the structure tree.
  const isArtifact = role === SemanticRole.Artifact;
  const tagThis = role != null && !isArtifact;

  if (isArtifact) {
    ctx.canvas.beginArtifact();
  } else if (tagThis) {
    const elem = tagging!.tree.begin(role!);
    if (isAltTextProvider(child) && child.altText) tagging!.tree.setAlt(child.altText);
    // Wire the struct element back to a Hyperlink so the serializer can write
    // /StructParent + /OBJR on the annotation.
    if ('linkedStructElement' in child)
      (child as unknown as { linkedStructElement: unknown }).linkedStructElement = elem;
    if (isContainerRole(role!)) {
      ctx.canvas.beginContainerContent(toPdfTag(role!));
    } else {
      ctx.canvas.beginMarkedContent(toPdfTag(role!));
    }
  }

  return { isArtifact, tagThis };
}

/** Closes the scope opened by {@link beginChildTag}. Safe to call with any token. */
export function endChildTag(ctx: RenderContext, token: ChildTagToken): void {
  if (token.isArtifact) {
    ctx.canvas.endArtifact();
  } else if (token.tagThis) {
    ctx.canvas.endMarkedContent();
    ctx.tagging!.tree.end();
  }
}
