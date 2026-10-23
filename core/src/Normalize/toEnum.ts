/**
 * Token -> enumeration resolvers.
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

/** A {@link TextAlignment} value or one of its string spellings ({@link TextAlignmentToken}). */
export type TextAlignmentInput = TextAlignment | TextAlignmentToken;
/**
 * Resolves a {@link TextAlignmentInput} to the {@link TextAlignment} value. A value that is already an enumeration value is returned unchanged.
 */
export const toTextAlignment = resolver<TextAlignmentToken, TextAlignment>({
  left: TextAlignment.Left,
  center: TextAlignment.Center,
  right: TextAlignment.Right,
  middle: TextAlignment.Middle,
  justify: TextAlignment.Justify,
  start: TextAlignment.Start,
  end: TextAlignment.End,
});

/** A {@link HorizontalAlignment} value or one of its string spellings ({@link HorizontalAlignmentToken}). */
export type HorizontalAlignmentInput = HorizontalAlignment | HorizontalAlignmentToken;
/**
 * Resolves a {@link HorizontalAlignmentInput} to the {@link HorizontalAlignment} value. A value that is already an enumeration value is returned unchanged.
 */
export const toHorizontalAlignment = resolver<HorizontalAlignmentToken, HorizontalAlignment>({
  start: HorizontalAlignment.Start,
  center: HorizontalAlignment.Center,
  end: HorizontalAlignment.End,
  stretch: HorizontalAlignment.Stretch,
  left: HorizontalAlignment.Left,
  right: HorizontalAlignment.Right,
});

/** A {@link VerticalAlignment} value or one of its string spellings ({@link VerticalAlignmentToken}). */
export type VerticalAlignmentInput = VerticalAlignment | VerticalAlignmentToken;
/**
 * Resolves a {@link VerticalAlignmentInput} to the {@link VerticalAlignment} value. A value that is already an enumeration value is returned unchanged.
 */
export const toVerticalAlignment = resolver<VerticalAlignmentToken, VerticalAlignment>({
  top: VerticalAlignment.Start,
  middle: VerticalAlignment.Center,
  bottom: VerticalAlignment.End,
  stretch: VerticalAlignment.Stretch,
});

/** A {@link PageOrientation} value or one of its string spellings ({@link PageOrientationToken}). */
export type PageOrientationInput = PageOrientation | PageOrientationToken;
/**
 * Resolves a {@link PageOrientationInput} to the {@link PageOrientation} value. A value that is already an enumeration value is returned unchanged.
 */
export const toPageOrientation = resolver<PageOrientationToken, PageOrientation>({
  portrait: PageOrientation.Portrait,
  landscape: PageOrientation.Landscape,
});

/** A {@link ImageFitMode} value or one of its string spellings ({@link ImageFitModeToken}). */
export type ImageFitModeInput = ImageFitMode | ImageFitModeToken;
/**
 * Resolves a {@link ImageFitModeInput} to the {@link ImageFitMode} value. A value that is already an enumeration value is returned unchanged.
 */
export const toImageFitMode = resolver<ImageFitModeToken, ImageFitMode>({
  contain: ImageFitMode.Contain,
  cover: ImageFitMode.Cover,
  fill: ImageFitMode.Fill,
  'fit-height': ImageFitMode.FitHeight,
  'actual-size': ImageFitMode.ActualSize,
});

/** A {@link PdfAConformance} value or one of its string spellings ({@link PdfAConformanceToken}). */
export type PdfAConformanceInput = PdfAConformance | PdfAConformanceToken;
/**
 * Resolves a {@link PdfAConformanceInput} to the {@link PdfAConformance} value. A value that is already an enumeration value is returned unchanged.
 */
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

/** A {@link AccessibilityMode} value or one of its string spellings ({@link AccessibilityModeToken}). */
export type AccessibilityModeInput = AccessibilityMode | AccessibilityModeToken;
/**
 * Resolves a {@link AccessibilityModeInput} to the {@link AccessibilityMode} value. A value that is already an enumeration value is returned unchanged.
 */
export const toAccessibilityMode = resolver<AccessibilityModeToken, AccessibilityMode>({
  none: AccessibilityMode.None,
  'pdf/ua-1': AccessibilityMode.PdfUa1,
});

/** A {@link ZoomLevel} value or one of its string spellings ({@link ZoomLevelToken}). */
export type ZoomLevelInput = ZoomLevel | ZoomLevelToken;
/**
 * Resolves a {@link ZoomLevelInput} to the {@link ZoomLevel} value. A value that is already an enumeration value is returned unchanged.
 */
export const toZoomLevel = resolver<ZoomLevelToken, ZoomLevel>({
  'fit-page': ZoomLevel.FitPage,
  'fit-width': ZoomLevel.FitWidth,
  'fit-height': ZoomLevel.FitHeight,
  custom: ZoomLevel.Custom,
});

/** A {@link PageMode} value or one of its string spellings ({@link PageModeToken}). */
export type PageModeInput = PageMode | PageModeToken;
/**
 * Resolves a {@link PageModeInput} to the {@link PageMode} value. A value that is already an enumeration value is returned unchanged.
 */
export const toPageMode = resolver<PageModeToken, PageMode>({
  'use-none': PageModeEnum.UseNone,
  'use-outlines': PageModeEnum.UseOutlines,
  'use-thumbs': PageModeEnum.UseThumbs,
  'full-screen': PageModeEnum.FullScreen,
  'use-oc': PageModeEnum.UseOC,
  'use-attachments': PageModeEnum.UseAttachments,
});

/** A {@link WidthDistribution} value or one of its string spellings ({@link WidthDistributionToken}). */
export type WidthDistributionInput = WidthDistribution | WidthDistributionToken;
/**
 * Resolves a {@link WidthDistributionInput} to the {@link WidthDistribution} value. A value that is already an enumeration value is returned unchanged.
 */
export const toWidthDistribution = resolver<WidthDistributionToken, WidthDistribution>({
  equal: WidthDistribution.Equal,
  weighted: WidthDistribution.Weighted,
  auto: WidthDistribution.Auto,
});

/** A {@link BulletStyle} value or one of its string spellings ({@link BulletStyleToken}). */
export type BulletStyleInput = BulletStyle | BulletStyleToken;
/**
 * Resolves a {@link BulletStyleInput} to the {@link BulletStyle} value. A value that is already an enumeration value is returned unchanged.
 */
export const toBulletStyle = resolver<BulletStyleToken, BulletStyle>({
  disc: BulletStyle.Disc,
  circle: BulletStyle.Circle,
  square: BulletStyle.Square,
  dash: BulletStyle.Dash,
  custom: BulletStyle.Custom,
});

/** A {@link NumberFormat} value or one of its string spellings ({@link NumberFormatToken}). */
export type NumberFormatInput = NumberFormat | NumberFormatToken;
/**
 * Resolves a {@link NumberFormatInput} to the {@link NumberFormat} value. A value that is already an enumeration value is returned unchanged.
 */
export const toNumberFormat = resolver<NumberFormatToken, NumberFormat>({
  decimal: NumberFormat.Decimal,
  'upper-roman': NumberFormat.UpperRoman,
  'lower-roman': NumberFormat.LowerRoman,
  'upper-alpha': NumberFormat.UpperAlpha,
  'lower-alpha': NumberFormat.LowerAlpha,
});

/** A {@link QrEcc} value or one of its string spellings ({@link QrEccToken}). */
export type QrEccInput = QrEcc | QrEccToken;
/**
 * Resolves a {@link QrEccInput} to the {@link QrEcc} value. A value that is already an enumeration value is returned unchanged.
 */
export const toQrEcc = resolver<QrEccToken, QrEcc>({
  low: QrEcc.Low,
  medium: QrEcc.Medium,
  quartile: QrEcc.Quartile,
  high: QrEcc.High,
});

/** A {@link BaselineAlignment} value or one of its string spellings ({@link BaselineAlignmentToken}). */
export type BaselineAlignmentInput = BaselineAlignment | BaselineAlignmentToken;
/**
 * Resolves a {@link BaselineAlignmentInput} to the {@link BaselineAlignment} value. A value that is already an enumeration value is returned unchanged.
 */
export const toBaselineAlignment = resolver<BaselineAlignmentToken, BaselineAlignment>({
  baseline: BaselineAlignment.Baseline,
  superscript: BaselineAlignment.Superscript,
  subscript: BaselineAlignment.Subscript,
});

/** A {@link DecorationStyle} value or one of its string spellings ({@link DecorationStyleToken}). */
export type DecorationStyleInput = DecorationStyle | DecorationStyleToken;
/**
 * Resolves a {@link DecorationStyleInput} to the {@link DecorationStyle} value. A value that is already an enumeration value is returned unchanged.
 */
export const toDecorationStyle = resolver<DecorationStyleToken, DecorationStyle>({
  solid: DecorationStyle.Solid,
  wavy: DecorationStyle.Wavy,
  dashed: DecorationStyle.Dashed,
  dotted: DecorationStyle.Dotted,
});

/** A {@link FontWeight} value or one of its string spellings ({@link FontWeightToken}). */
export type FontWeightInput = FontWeight | FontWeightToken;
/**
 * Resolves a {@link FontWeightInput} to the {@link FontWeight} value. A value that is already an enumeration value is returned unchanged.
 */
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
 * tokens for combinations - `['underline', 'overline']`.
 */
export type TextDecorationInput = TextDecoration | TextDecorationToken | readonly TextDecorationToken[];

/**
 * Resolves a {@link TextDecorationInput} to the {@link TextDecoration} value. A value that is already an enumeration value is returned unchanged.
 */
export function toTextDecoration(input: TextDecorationInput): TextDecoration {
  if (typeof input === 'number') return input;
  if (typeof input === 'string') return DECORATION_FLAGS[input] ?? TextDecoration.None;
  return input.reduce<TextDecoration>(
    (flags, token) => flags | (DECORATION_FLAGS[token] ?? TextDecoration.None),
    TextDecoration.None
  );
}
