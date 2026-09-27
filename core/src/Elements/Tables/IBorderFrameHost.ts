/**
 * Marks an element that takes the border of a container wrapped directly around it as its own outer frame
 * (a table). The container then centres its border on the element's outer edge, does not inset the element
 * by it, and paints it over the element, so the frame wins the outermost cell edges.
 */
export interface IBorderFrameHost {
  readonly acceptsBorderFrame: true;
}

export function isBorderFrameHost(element: unknown): element is IBorderFrameHost {
  return typeof element === 'object' && element !== null && 'acceptsBorderFrame' in element;
}
