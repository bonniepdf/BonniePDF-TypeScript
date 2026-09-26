// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { readXml } from '../Xml/SvgXmlReader';

/**
 * A parsed element. Slice 1 needed no tree - the cascade and transform stack are
 * just the stack of open elements, so it resolved straight from the event stream.
 *
 * `<use>` and gradients changed that: both reference elements by id, and a
 * forward reference is legal, so `<use href="#x">` may appear before `#x` is
 * defined. That needs random access, which needs a tree.
 */
export interface SvgElement {
  readonly name: string;
  readonly attributes: ReadonlyMap<string, string>;
  readonly children: SvgElement[];
  /** Character data directly inside this element, concatenated - for `<title>`, `<desc>`, `<style>`. */
  text: string;
  /**
   * Character data and child elements interleaved, in document order.
   *
   * `text` loses where the characters sat relative to the children, which is
   * harmless for a title and fatal for `<text>`: `a<tspan>b</tspan>c` concatenates
   * to "ac", placed before "b". Adjacent character data - text next to a CDATA
   * section - is one entry.
   */
  readonly content: (string | SvgElement)[];
}

export interface SvgDom {
  readonly root: SvgElement | undefined;
  /**
   * Elements by `id`. First definition wins, matching how browsers resolve a
   * duplicate id, rather than the last.
   */
  readonly byId: ReadonlyMap<string, SvgElement>;
}

export function parseDom(source: string): SvgDom {
  const byId = new Map<string, SvgElement>();
  const stack: SvgElement[] = [];
  let root: SvgElement | undefined;

  for (const event of readXml(source)) {
    if (event.kind === 'text') {
      const current = stack[stack.length - 1];
      if (current) {
        current.text += event.text;
        const last = current.content.length - 1;
        if (last >= 0 && typeof current.content[last] === 'string') current.content[last] += event.text;
        else current.content.push(event.text);
      }
      continue;
    }

    if (event.kind === 'end') {
      // Tolerate a mismatched end tag by closing the innermost element, as
      // browsers do; a stricter reading discards documents that render fine.
      stack.pop();
      continue;
    }

    const element: SvgElement = {
      name: event.name,
      attributes: event.attributes,
      children: [],
      text: '',
      content: [],
    };

    const id = event.attributes.get('id');
    if (id !== undefined && id !== '' && !byId.has(id)) byId.set(id, element);

    const parent = stack[stack.length - 1];
    if (parent) {
      parent.children.push(element);
      parent.content.push(element);
    }
    else root ??= element;

    if (!event.selfClosing) stack.push(element);
  }

  return { root, byId };
}
