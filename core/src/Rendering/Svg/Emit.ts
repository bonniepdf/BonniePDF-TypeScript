// Vendored file: maintained upstream and copied into this folder by tooling.
// Do not edit it here. A hand edit fails the vendored-files check; see VENDORED.json.
import { isIdentity, multiply, type Matrix } from './Geometry/Matrix';
import type { IrDocument, IrNode, IrPath, ComputedStyle } from './Ir/Types';
import { transformSegments } from './Ir/Clipping';
import { SinkImage } from './Sink/Image';
import type { Paint } from './Sink/Paint';
import type { StrokeStyle } from './Sink/StrokeStyle';
import type { VectorSink } from './Sink/VectorSink';

/**
 * Walk the IR and drive a sink.
 *
 * No SVG concepts appear here: by this point everything is paths, matrices and
 * resolved paint. That is the whole purpose of the IR, and it is what lets one
 * emitter serve a PDF canvas, an SVG writer, or a test double.
 */
export function emit(document: IrDocument, sink: VectorSink, images?: ReadonlyMap<string, Uint8Array>): void {
  for (const child of document.children) emitNode(child, document.rootTransform, sink, images);
}

function emitNode(
  node: IrNode,
  parentTransform: Matrix,
  sink: VectorSink,
  images: ReadonlyMap<string, Uint8Array> | undefined
): void {
  if (node.kind === 'raster') {
    // The image covers the document's viewport in root user space; everything
    // that places the element within it is inside the rasterized snippet. With
    // no image for it - a synchronous emit - nothing is drawn, and the builder
    // has already listed the feature under `rasterized`.
    const png = images?.get(node.svg);
    if (png === undefined) return;
    sink.saveState();
    if (!isIdentity(parentTransform)) {
      const t = parentTransform;
      sink.transform(t.a, t.b, t.c, t.d, t.e, t.f);
    }
    sink.drawImage(new SinkImage(png), node.x, node.y, node.width, node.height);
    sink.restoreState();
    return;
  }

  if (node.kind === 'clip') {
    sink.saveState();
    for (const clip of node.clips) {
      // The clip's coordinates are flattened into the emitting space rather than
      // applied via a sink transform: a transform and a clip share one graphics
      // state, so the transform could not be undone without losing the clip.
      // Flattening is safe here in a way it is not for paths, because a clip has
      // no stroke width to be scaled.
      const matrix = multiply(parentTransform, clip.transform);
      sink.beginPath();
      for (const segment of transformSegments(clip.segments, matrix)) {
        switch (segment.kind) {
          case 'move':
            sink.moveTo(segment.x, segment.y);
            break;
          case 'line':
            sink.lineTo(segment.x, segment.y);
            break;
          case 'cubic':
            sink.cubicBezierTo(segment.c1x, segment.c1y, segment.c2x, segment.c2y, segment.x, segment.y);
            break;
          case 'close':
            sink.closePath();
            break;
        }
      }
      sink.clipToCurrentPath(clip.rule);
    }
    for (const child of node.children) emitNode(child, parentTransform, sink, images);
    sink.restoreState();
    return;
  }

  if (node.kind === 'group') {
    // Group alpha composites the subtree as a unit; the sink is responsible for
    // the transparency group, which is why this is not pushed onto each child.
    sink.saveState();
    if (node.opacity < 1) sink.setGlobalAlpha(node.opacity);
    for (const child of node.children) emitNode(child, parentTransform, sink, images);
    sink.restoreState();
    return;
  }
  emitPath(node, parentTransform, sink);
}

function emitPath(path: IrPath, parentTransform: Matrix, sink: VectorSink): void {
  const style = path.style;
  // Already resolved by the builder, opacity folded in - a gradient needs this
  // path's bounding box, which only the builder has.
  const fill = path.fillPaint;
  const stroke = path.strokePaint;
  // Nothing to draw: skip before touching the sink at all, so an invisible
  // element leaves no trace in the output.
  if (!fill && !stroke) return;

  const transform = multiply(parentTransform, path.transform);

  sink.saveState();
  // The transform is applied rather than folded into the coordinates because a
  // scaled group must scale its stroke width too. Flattening the points would
  // silently leave strokes at their unscaled width.
  if (!isIdentity(transform)) {
    sink.transform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f);
  }

  buildPath(path, sink);

  if (fill) sink.fillCurrentPath(fill, style.fillRule);

  if (stroke) {
    // Re-declare the path: a sink may consume the current path when it paints,
    // and relying on it surviving a fill is the kind of assumption that works
    // on one backend and not the next.
    if (fill) buildPath(path, sink);
    sink.strokeCurrentPath(strokeStyleFor(stroke, style));
  }

  sink.restoreState();
}

function buildPath(path: IrPath, sink: VectorSink): void {
  sink.beginPath();
  for (const segment of path.segments) {
    switch (segment.kind) {
      case 'move':
        sink.moveTo(segment.x, segment.y);
        break;
      case 'line':
        sink.lineTo(segment.x, segment.y);
        break;
      case 'cubic':
        sink.cubicBezierTo(segment.c1x, segment.c1y, segment.c2x, segment.c2y, segment.x, segment.y);
        break;
      case 'close':
        sink.closePath();
        break;
    }
  }
}

function strokeStyleFor(paint: Paint, style: ComputedStyle): StrokeStyle {
  return {
    paint,
    width: style.strokeWidth,
    ...(style.dashPattern !== undefined ? { dashPattern: style.dashPattern } : {}),
    ...(style.dashOffset !== undefined ? { dashOffset: style.dashOffset } : {}),
    lineCap: style.lineCap,
    lineJoin: style.lineJoin,
    // Passed through only when the source specified one - see the note on
    // ComputedStyle.miterLimit about the two implementations' differing defaults.
    ...(style.miterLimit !== undefined ? { miterLimit: style.miterLimit } : {}),
  };
}
