import { ImageFitMode } from './ImageFitMode';

/** What an element asks for: its own `width`, `height` and `fitMode`. */
export interface ImageBoxRequest {
  readonly width: number | undefined;
  readonly height: number | undefined;
  readonly fitMode: ImageFitMode;
  readonly maintainAspectRatio: boolean;
}

/**
 * The display box of image-like content with a natural size, under `fitMode`.
 *
 * Shared by `Image` and `Svg`, which size their box identically: one concept,
 * one set of rules. Writes into the result holder rather than returning a new
 * object, because layout calls it repeatedly.
 *
 * `narrow` is applied to every input and every intermediate result. `Svg`
 * passes `Math.fround`, so its box is computed in single precision exactly as
 * the .NET implementation computes it, which its drawing needs to be
 * byte-identical across the two; `Image` keeps full precision.
 */
export function resolveImageBox(
  request: ImageBoxRequest,
  nativeWidth: number,
  nativeHeight: number,
  availableWidth: number,
  out: { width: number; height: number },
  narrow: (value: number) => number = value => value
): void {
  const n = narrow;
  const width = request.width === undefined ? undefined : n(request.width);
  const height = request.height === undefined ? undefined : n(request.height);
  nativeWidth = n(nativeWidth);
  nativeHeight = n(nativeHeight);
  const aspectRatio = n(nativeWidth / nativeHeight);

  // Use specified width or available width
  const targetWidth = width ?? n(availableWidth);
  const targetHeight = height ?? (request.maintainAspectRatio ? n(targetWidth / aspectRatio) : nativeHeight);

  let displayWidth = targetWidth;
  let displayHeight = targetHeight;

  switch (request.fitMode) {
    case ImageFitMode.Contain:
      // Scale to fit within bounds, maintain aspect ratio
      if (width !== undefined && height !== undefined) {
        const scale = Math.min(n(width / nativeWidth), n(height / nativeHeight));
        displayWidth = n(nativeWidth * scale);
        displayHeight = n(nativeHeight * scale);
      } else if (width !== undefined) {
        displayWidth = width;
        displayHeight = n(displayWidth / aspectRatio);
      } else if (height !== undefined) {
        displayHeight = height;
        displayWidth = n(displayHeight * aspectRatio);
      }
      break;

    case ImageFitMode.Cover:
      // Scale to cover the bounds, maintaining aspect ratio. Nothing is clipped:
      // the content is drawn at the covering size.
      if (width !== undefined && height !== undefined) {
        const scale = Math.max(n(width / nativeWidth), n(height / nativeHeight));
        displayWidth = n(nativeWidth * scale);
        displayHeight = n(nativeHeight * scale);
      }
      break;

    case ImageFitMode.Fill:
      // Stretch to fill, ignore aspect ratio
      displayWidth = width ?? n(availableWidth);
      displayHeight = height ?? nativeHeight;
      break;

    case ImageFitMode.FitHeight:
      // Scale to fit height, maintain aspect ratio
      if (height !== undefined) {
        displayHeight = height;
        displayWidth = n(displayHeight * aspectRatio);
      }
      break;

    case ImageFitMode.ActualSize:
      displayWidth = nativeWidth;
      displayHeight = nativeHeight;
      break;
  }

  out.width = displayWidth;
  out.height = displayHeight;
}
