import { ICanvas } from '../Drawing/ICanvas';
import { RenderContext } from '../Rendering/RenderContext';
import { SemanticRole, toPdfTag } from '../Rendering/Tagging/SemanticRole';

export function renderTaggedChart(
  ctx: RenderContext,
  canvas: ICanvas,
  altText: string,
  isDecorative: boolean,
  draw: () => void
): void {
  const tagging = ctx.tagging;
  if (!tagging) {
    draw();
    return;
  }

  if (isDecorative || !altText) {
    canvas.beginArtifact();
    try {
      draw();
    } finally {
      canvas.endArtifact();
    }
    return;
  }

  tagging.tree.begin(SemanticRole.Figure);
  tagging.tree.setAlt(altText);
  canvas.beginMarkedContent(toPdfTag(SemanticRole.Figure));
  try {
    draw();
  } finally {
    canvas.endMarkedContent();
    tagging.tree.end();
  }
}
