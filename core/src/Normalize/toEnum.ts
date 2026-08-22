/**
 * Token -> enumeration resolvers (`the specification` §4A.4).
 *
 * Each map is explicit and exhaustive because a token is **not** the
 * enumeration's underlying value: `PdfAConformance.PdfA2a` holds `'PdfA2a'`,
 * but its token is `'pdf/a-2a'`. The same strings must be accepted by .NET.
 */

import { TextAlignment } from '../Elements/Text/TextAlignment';
import { HorizontalAlignment } from '../Core/HorizontalAlignment';
import { VerticalAlignment } from '../Core/VerticalAlignment';
import { PageOrientation } from '../Core/PageOrientation';
import { ImageFitMode } from '../Elements/Media/ImageFitMode';
import { PdfAConformance } from '../Configuration/PdfAConformance';
import { AccessibilityMode } from '../Configuration/AccessibilityMode';
import { ZoomLevel } from '../Configuration/ZoomLevel';
import { PageModeEnum, type PageMode } from '../Configuration/PageMode';
import { WidthDistribution } from '../Elements/Layout/WidthDistribution';
import { BulletStyle } from '../Elements/Lists/BulletStyle';
import { NumberFormat } from '../Elements/Lists/NumberFormat';
import { QrEcc } from '../Elements/Shapes/QrEcc';
import { BaselineAlignment } from '../Elements/Text/BaselineAlignment';
import { DecorationStyle } from '../Elements/Text/DecorationStyle';
import { TextDecoration } from '../Elements/Text/TextDecoration';
import { FontWeight } from '../Typography/FontWeight';

import type {
  TextAlignmentToken,
  HorizontalAlignmentToken,
  VerticalAlignmentToken,
  PageOrientationToken,
  ImageFitModeToken,
  PdfAConformanceToken,
  AccessibilityModeToken,
  ZoomLevelToken,
  PageModeToken,
  WidthDistributionToken,
  BulletStyleToken,
  NumberFormatToken,
  QrEccToken,
  BaselineAlignmentToken,
  DecorationStyleToken,
  TextDecorationToken,
  FontWeightToken,
} from './Tokens';

/**
 * Builds a resolver from a complete token map. `Record<Token, Value>` makes the
 * map exhaustive at compile time - adding a token to `Tokens.ts` without
 * mapping it here is a build error.
 */
function resolver<Token extends string, Value>(map: Record<Token, Value>): (input: Value | Token) => Value {
  return (input: Value | Token): Value =>
    typeof input === 'string' && input in map ? map[input as Token] : (input as Value);
}

export type TextAlignmentInput = TextAlignment | TextAlignmentToken;
export const toTextAlignment = resolver<TextAlignmentToken, TextAlignment>({
  left: TextAlignment.Left,
  center: TextAlignment.Center,
  right: TextAlignment.Right,
  middle: TextAlignment.Middle,
  justify: TextAlignment.Justify,
});

export type HorizontalAlignmentInput = HorizontalAlignment | HorizontalAlignmentToken;
export const toHorizontalAlignment = resolver<HorizontalAlignmentToken, HorizontalAlignment>({
  start: HorizontalAlignment.Start,
  center: HorizontalAlignment.Center,
  end: HorizontalAlignment.End,
  stretch: HorizontalAlignment.Stretch,
});

export type VerticalAlignmentInput = VerticalAlignment | VerticalAlignmentToken;
export const toVerticalAlignment = resolver<VerticalAlignmentToken, VerticalAlignment>({
  top: VerticalAlignment.Start,
  middle: VerticalAlignment.Center,
  bottom: VerticalAlignment.End,
  stretch: VerticalAlignment.Stretch,
});

export type PageOrientationInput = PageOrientation | PageOrientationToken;
export const toPageOrientation = resolver<PageOrientationToken, PageOrientation>({
  portrait: PageOrientation.Portrait,
  landscape: PageOrientation.Landscape,
});

export type ImageFitModeInput = ImageFitMode | ImageFitModeToken;
export const toImageFitMode = resolver<ImageFitModeToken, ImageFitMode>({
  contain: ImageFitMode.Contain,
  cover: ImageFitMode.Cover,
  fill: ImageFitMode.Fill,
  'fit-height': ImageFitMode.FitHeight,
  'actual-size': ImageFitMode.ActualSize,
});

export type PdfAConformanceInput = PdfAConformance | PdfAConformanceToken;
export const toPdfAConformance = resolver<PdfAConformanceToken, PdfAConformance>({
  none: PdfAConformance.None,
  'pdf/a-1b': PdfAConformance.PdfA1b,
  'pdf/a-1a': PdfAConformance.PdfA1a,
  'pdf/a-2b': PdfAConformance.PdfA2b,
  'pdf/a-2a': PdfAConformance.PdfA2a,
  'pdf/a-3b': PdfAConformance.PdfA3b,
  'pdf/a-3a': PdfAConformance.PdfA3a,
  'pdf/a-4': PdfAConformance.PdfA4,
});

export type AccessibilityModeInput = AccessibilityMode | AccessibilityModeToken;
export const toAccessibilityMode = resolver<AccessibilityModeToken, AccessibilityMode>({
  none: AccessibilityMode.None,
  'pdf/ua-1': AccessibilityMode.PdfUa1,
});

export type ZoomLevelInput = ZoomLevel | ZoomLevelToken;
export const toZoomLevel = resolver<ZoomLevelToken, ZoomLevel>({
  'fit-page': ZoomLevel.FitPage,
  'fit-width': ZoomLevel.FitWidth,
  'fit-height': ZoomLevel.FitHeight,
  custom: ZoomLevel.Custom,
});

export type PageModeInput = PageMode | PageModeToken;
export const toPageMode = resolver<PageModeToken, PageMode>({
  'use-none': PageModeEnum.UseNone,
  'use-outlines': PageModeEnum.UseOutlines,
  'use-thumbs': PageModeEnum.UseThumbs,
  'full-screen': PageModeEnum.FullScreen,
  'use-oc': PageModeEnum.UseOC,
  'use-attachments': PageModeEnum.UseAttachments,
});

export type WidthDistributionInput = WidthDistribution | WidthDistributionToken;
export const toWidthDistribution = resolver<WidthDistributionToken, WidthDistribution>({
  equal: WidthDistribution.Equal,
  weighted: WidthDistribution.Weighted,
  auto: WidthDistribution.Auto,
});

export type BulletStyleInput = BulletStyle | BulletStyleToken;
export const toBulletStyle = resolver<BulletStyleToken, BulletStyle>({
  disc: BulletStyle.Disc,
  circle: BulletStyle.Circle,
  square: BulletStyle.Square,
  dash: BulletStyle.Dash,
  custom: BulletStyle.Custom,
});

export type NumberFormatInput = NumberFormat | NumberFormatToken;
export const toNumberFormat = resolver<NumberFormatToken, NumberFormat>({
  decimal: NumberFormat.Decimal,
  'upper-roman': NumberFormat.UpperRoman,
  'lower-roman': NumberFormat.LowerRoman,
  'upper-alpha': NumberFormat.UpperAlpha,
  'lower-alpha': NumberFormat.LowerAlpha,
});

export type QrEccInput = QrEcc | QrEccToken;
export const toQrEcc = resolver<QrEccToken, QrEcc>({
  low: QrEcc.Low,
  medium: QrEcc.Medium,
  quartile: QrEcc.Quartile,
  high: QrEcc.High,
});

export type BaselineAlignmentInput = BaselineAlignment | BaselineAlignmentToken;
export const toBaselineAlignment = resolver<BaselineAlignmentToken, BaselineAlignment>({
  baseline: BaselineAlignment.Baseline,
  superscript: BaselineAlignment.Superscript,
  subscript: BaselineAlignment.Subscript,
});

export type DecorationStyleInput = DecorationStyle | DecorationStyleToken;
export const toDecorationStyle = resolver<DecorationStyleToken, DecorationStyle>({
  solid: DecorationStyle.Solid,
  wavy: DecorationStyle.Wavy,
  dashed: DecorationStyle.Dashed,
  dotted: DecorationStyle.Dotted,
});

export type FontWeightInput = FontWeight | FontWeightToken;
export const toFontWeight = resolver<FontWeightToken, FontWeight>({
  thin: FontWeight.Thin,
  'extra-light': FontWeight.ExtraLight,
  light: FontWeight.Light,
  normal: FontWeight.Normal,
  medium: FontWeight.Medium,
  'semi-bold': FontWeight.SemiBold,
  bold: FontWeight.Bold,
  'extra-bold': FontWeight.ExtraBold,
  black: FontWeight.Black,
});

const DECORATION_FLAGS: Record<TextDecorationToken, TextDecoration> = {
  none: TextDecoration.None,
  underline: TextDecoration.Underline,
  strikethrough: TextDecoration.Strikethrough,
  overline: TextDecoration.Overline,
};

/**
 * {@link TextDecoration} is a bit-flags set, so it also accepts a list of
 * tokens for combinations - `['underline', 'overline']` (§4A.4).
 */
export type TextDecorationInput = TextDecoration | TextDecorationToken | readonly TextDecorationToken[];

export function toTextDecoration(input: TextDecorationInput): TextDecoration {
  if (typeof input === 'number') return input;
  if (typeof input === 'string') return DECORATION_FLAGS[input] ?? TextDecoration.None;
  return input.reduce<TextDecoration>(
    (flags, token) => flags | (DECORATION_FLAGS[token] ?? TextDecoration.None),
    TextDecoration.None
  );
}
