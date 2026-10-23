/** The shape of the generated element description (`ElementDescription.ts`). */

export interface KeySpec {
  /** `string`, `length`, `enum:Name`, `array:kind`, `object:Shape`, `map:kind`, or a named special kind. */
  kind: string;
  required?: boolean;
  min?: number;
  max?: number;
}

export interface EnumSpec {
  tokens: string[];
  /** `options`: the code API's own option bag accepts the token. `member`: map to `members[token]` of enum `type`. */
  via: 'options' | 'member';
  type?: string;
  members?: Record<string, string>;
  /** Where the .NET enum is not the token in PascalCase; unused by this implementation. */
  dotnet?: { type?: string; members?: Record<string, string> };
}

export interface ShapeSpec {
  uses?: string[];
  keys: Record<string, KeySpec>;
  exactlyOne?: string[][];
  conflicts?: string[][];
  secrets?: string[];
  atLeastOne?: boolean;
}

export interface ElementSpec extends ShapeSpec {
  /** Reference checks: key -> kind of thing it must name (`resource`, `anchor`, `pageIndex`, `tocIdentifier`). */
  refs?: Record<string, string>;
  /** Names this element defines: key -> kind (`anchor`, `tocIdentifier`). */
  defines?: Record<string, string>;
  rules?: string[];
}

export interface SettingsCondition {
  /** A key of `settings`; a dotted key reaches into an object (`encryption.algorithm`). */
  key: string;
  in?: string[];
  notIn?: string[];
  /** True: the key is given (a list must be non-empty). False: it is not. */
  present?: boolean;
}

export interface SettingsRule {
  id: string;
  /** `error`: every `when` holds and a `require` does not. `sets`: raises later rules' view of a key. */
  outcome: 'error' | 'sets';
  when: SettingsCondition[];
  require?: SettingsCondition[];
  set?: Record<string, string>;
  text: string;
}

export interface SettingsRules {
  $comment?: string;
  defaults: Record<string, string>;
  rules: SettingsRule[];
}

/**
 * Bounds enforced while reading an untrusted document definition. A violation is reported as a `limit-exceeded` issue before anything is built.
 */
export interface Limits {
  /** Maximum size of the input, in bytes (default 16 MiB). */
  inputBytes: number;
  /** Maximum JSON nesting depth (default 64). */
  jsonDepth: number;
  /** Maximum element nesting depth (default 32). */
  elementDepth: number;
  /** Maximum number of elements in the whole document (default 50,000). */
  elementNodes: number;
  /** Maximum number of pages (default 5,000). */
  pages: number;
  /** Maximum length of any string value (default 1 MiB). */
  stringLength: number;
  /** Maximum length of any array (default 100,000). */
  arrayLength: number;
  /** Maximum decoded size of a single resource (default 32 MiB). */
  resourceBytes: number;
  /** Maximum decoded size of all resources together (default 128 MiB). */
  resourceBytesTotal: number;
  /** Maximum number of chart data points in the whole document (default 100,000). */
  chartDataPoints: number;
}

export interface ElementDescription {
  $comment?: string;
  format?: string;
  descriptionVersion: number;
  definition: { version: number; minorVersion: number };
  limits: Limits;
  palette: { families: string[]; shades: number[] };
  pageSizes: string[];
  enums: Record<string, EnumSpec>;
  mixins: Record<string, Record<string, KeySpec>>;
  shapes: Record<string, ShapeSpec>;
  elements: Record<string, ElementSpec>;
  root: ShapeSpec;
  objects: Record<string, ShapeSpec & { exactlyOne?: string[][] }>;
  settingsRules: SettingsRules;
}
