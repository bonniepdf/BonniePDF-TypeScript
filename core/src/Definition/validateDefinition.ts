import { isChartNumberFormat } from '../Charts/ChartNumberFormat';
import { ELEMENT_DESCRIPTION } from './ElementDescription';
import {
  DEFAULT_DEFINITION_LIMITS,
  DEFINITION_VERSIONS,
  type DefinitionIssue,
  type DocumentDefinition,
  type ValidateOptions,
  type ValidationResult,
} from './DefinitionTypes';
import type { KeySpec, Limits, SettingsCondition, ShapeSpec } from './ElementDescriptionTypes';

const D = ELEMENT_DESCRIPTION;

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const LENGTH_TOKEN = /^\s*[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?\s*(?:pt|in|cm|mm)\s*$/i;
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const PALETTE_COLOR = new RegExp(`^(?:${D.palette.families.join('|')})-(?:${D.palette.shades.join('|')})$`);
const DATE_TIME = /^\d{4}-\d{2}-\d{2}[Tt ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[Zz]|[+-]\d{2}:\d{2})$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const SHA256 = /^[0-9a-f]{64}$/;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const typeName = (v: unknown): string => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
/** JSON text with object keys in a fixed order, so equal values compare equal whatever order they were written in. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (isObject(value))
    return `{${Object.keys(value)
      .sort()
      .map(k => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

const escapeKey = (k: string): string => k.replace(/~/g, '~0').replace(/\//g, '~1');

interface Ref {
  kind: string;
  value: unknown;
  path: string;
  id?: string;
}

/** Merges the keys of a shape or element with the mixins it uses. */
const keyCache = new Map<ShapeSpec, Record<string, KeySpec>>();
function keysOf(spec: ShapeSpec): Record<string, KeySpec> {
  let merged = keyCache.get(spec);
  if (!merged) {
    merged = {};
    for (const use of spec.uses ?? []) Object.assign(merged, D.mixins[use]);
    Object.assign(merged, spec.keys);
    keyCache.set(spec, merged);
  }
  return merged;
}

/** Bytes of a base64 string once decoded, without decoding it. */
function base64Bytes(s: string): number {
  const padding = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
  return (s.length / 4) * 3 - padding;
}

class Validator {
  readonly errors: DefinitionIssue[] = [];
  readonly warnings: DefinitionIssue[] = [];
  private readonly limits: Limits;
  private newerMinor = false;
  private aborted = false;

  private readonly ids = new Map<string, string>();
  private readonly anchors = new Set<string>();
  private readonly tocIdentifiers = new Set<string>();
  private readonly refs: Ref[] = [];
  private resourceNames = new Set<string>();
  private pageCount = 0;
  private nodeCount = 0;
  private chartPoints = 0;
  private resourceBytes = 0;

  constructor(private readonly options: ValidateOptions) {
    this.limits = { ...DEFAULT_DEFINITION_LIMITS, ...options.limits };
  }

  // ── reporting ──────────────────────────────────────────────────────────────

  private add(
    list: DefinitionIssue[],
    path: string,
    code: string,
    message: string,
    extra?: Partial<DefinitionIssue>
  ): void {
    list.push({ path, code, message, ...extra });
  }
  error(path: string, code: string, message: string, extra?: Partial<DefinitionIssue>): void {
    this.add(this.errors, path, code, message, extra);
  }
  private warn(path: string, code: string, message: string, extra?: Partial<DefinitionIssue>): void {
    this.add(this.warnings, path, code, message, extra);
  }

  /** Something this release does not recognise: an error, unless a newer minor version explains it. */
  private unrecognised(path: string, what: string, code: string, id?: string): void {
    if (this.newerMinor) {
      const message = `${what} is not recognised by this release, which reads definitions up to 1.${DEFINITION_VERSIONS.maxMinor}.`;
      if (this.options.bestEffort) this.warn(path, 'newer-minor', message, { id });
      else this.error(path, 'newer-minor', message, { id });
    } else if (code === 'unknown-key') {
      const message = `${what} is not a key of this object; it is ignored.`;
      if (this.options.strict) this.error(path, code, message, { id });
      else this.warn(path, code, message, { id });
    } else {
      this.error(path, code, `${what} is not recognised.`, { id });
    }
  }

  private limit(path: string, what: string): void {
    if (!this.aborted) this.error(path, 'limit-exceeded', `${what} exceeds the limit for this reader.`);
    this.aborted = true;
  }

  // ── entry ──────────────────────────────────────────────────────────────────

  run(root: unknown): void {
    if (!isObject(root)) {
      this.error('', 'invalid-json', `A definition is a JSON object; found ${typeName(root)}.`);
      return;
    }
    if (!this.checkVersion(root)) return;
    this.validateShape(root, D.root, '', undefined, 'unknown-key');
    if (this.aborted) return;
    this.checkRoot(root);
    this.resolveRefs();
  }

  private checkVersion(root: Record<string, unknown>): boolean {
    const { version, minorVersion } = root;
    if (version === undefined || minorVersion === undefined) {
      this.error('', 'missing-version', 'A definition needs both `version` and `minorVersion`.');
      return false;
    }
    for (const [key, v] of [
      ['version', version],
      ['minorVersion', minorVersion],
    ] as const) {
      if (!Number.isInteger(v) || (v as number) < 0) {
        this.error(`/${key}`, 'invalid-type', `\`${key}\` is a non-negative integer; found ${JSON.stringify(v)}.`);
        return false;
      }
    }
    if (version !== DEFINITION_VERSIONS.version) {
      this.error(
        '/version',
        'unsupported-version',
        `Version ${String(version)} is not supported; this release reads version ${DEFINITION_VERSIONS.version}, minor versions ${DEFINITION_VERSIONS.minMinor} to ${DEFINITION_VERSIONS.maxMinor}.`,
        { found: String(version), expected: String(DEFINITION_VERSIONS.version) }
      );
      return false;
    }
    this.newerMinor = (minorVersion as number) > DEFINITION_VERSIONS.maxMinor;
    return true;
  }

  finish(): void {
    if (this.newerMinor && this.errors.every(e => e.code !== 'newer-minor')) {
      this.warn(
        '/minorVersion',
        'newer-minor',
        `The document is marked 1.x newer than this release reads (1.${DEFINITION_VERSIONS.maxMinor}), but nothing in it needed anything newer.`
      );
    } else if (this.newerMinor && this.options.bestEffort) {
      this.warn(
        '/minorVersion',
        'newer-minor',
        'The document was written for a newer minor version; unrecognised items were ignored.'
      );
    }
  }

  // ── root ───────────────────────────────────────────────────────────────────

  private checkRoot(root: Record<string, unknown>): void {
    const resources = root.resources;
    if (isObject(resources)) this.resourceNames = new Set(Object.keys(resources));

    const pages = root.pages;
    if (Array.isArray(pages)) {
      this.pageCount = pages.length;
      if (pages.length === 0) {
        this.error('/pages', 'invalid-value', 'A definition needs at least one page.', {
          expected: 'at least one page',
        });
      }
      if (pages.length > this.limits.pages) this.limit('/pages', 'The number of pages');
    }

    if (isObject(resources)) this.checkResources(resources);
    if (Array.isArray(root.attachments)) {
      root.attachments.forEach((a, i) => {
        if (isObject(a) && typeof a.resource === 'string')
          this.refs.push({ kind: 'resource', value: a.resource, path: `/attachments/${i}/resource` });
      });
    }
    this.checkSettingsRefs(root);
    this.checkSettingsRules(root);
  }

  private checkResources(resources: Record<string, unknown>): void {
    const fontIdentities = new Map<string, string>();
    for (const [name, value] of Object.entries(resources)) {
      if (!isObject(value)) continue;
      if (typeof value.data === 'string') {
        const bytes = base64Bytes(value.data);
        this.resourceBytes += bytes;
        const path = `/resources/${escapeKey(name)}/data`;
        if (bytes > this.limits.resourceBytes) this.limit(path, 'A resource');
        if (this.resourceBytes > this.limits.resourceBytesTotal)
          this.limit('/resources', 'The total size of resources');
      }
      if (value.kind === 'font' && typeof value.family === 'string') {
        const weight =
          typeof value.weight === 'number' ? value.weight : typeof value.weight === 'string' ? value.weight : 'auto';
        const identity = `${value.family.trim().toLowerCase()}:${weight}:${value.italic === true ? 'i' : 'n'}`;
        const earlier = fontIdentities.get(identity);
        if (earlier !== undefined) {
          this.error(
            `/resources/${escapeKey(name)}`,
            'duplicate-font-face',
            `Resource \`${name}\` has the same family, weight and italic as \`${earlier}\`.`
          );
        } else fontIdentities.set(identity, name);
      }
    }
  }

  /**
   * The cross-key rules of `settings` (spec 15 §5.2), from the description. A combination the document would
   * refuse at generation is refused here, so a definition that reads always generates.
   */
  private checkSettingsRules(root: Record<string, unknown>): void {
    if (!isObject(root.settings)) return;
    const settings = root.settings;
    const { defaults, rules } = D.settingsRules;
    const raised = new Map<string, string>();
    const lookup = (key: string): unknown => {
      if (raised.has(key)) return raised.get(key);
      let value: unknown = settings;
      for (const part of key.split('.')) value = isObject(value) ? value[part] : undefined;
      return value ?? defaults[key];
    };
    const holds = (c: SettingsCondition): boolean => {
      const value = lookup(c.key);
      if (c.present !== undefined) {
        const given = value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0);
        return given === c.present;
      }
      if (c.in) return typeof value === 'string' && c.in.includes(value);
      if (c.notIn) return !(typeof value === 'string' && c.notIn.includes(value));
      return true;
    };
    for (const rule of rules) {
      if (!rule.when.every(holds)) continue;
      if (rule.outcome === 'sets') {
        for (const [key, value] of Object.entries(rule.set ?? {})) raised.set(key, value);
      } else if (!(rule.require ?? []).every(holds)) {
        this.error('/settings', 'incompatible-settings', rule.text);
      }
    }
  }

  private checkSettingsRefs(root: Record<string, unknown>): void {
    const bookmarks = isObject(root.settings) ? root.settings.bookmarks : undefined;
    const walk = (list: unknown, path: string): void => {
      if (!Array.isArray(list)) return;
      list.forEach((b, i) => {
        if (!isObject(b)) return;
        if (typeof b.pageIndex === 'number')
          this.refs.push({ kind: 'pageIndex', value: b.pageIndex, path: `${path}/${i}/pageIndex` });
        walk(b.children, `${path}/${i}/children`);
      });
    };
    walk(bookmarks, '/settings/bookmarks');
    const destinations = isObject(root.settings) ? root.settings.namedDestinations : undefined;
    if (isObject(destinations)) {
      for (const [k, v] of Object.entries(destinations)) {
        if (typeof v === 'number')
          this.refs.push({ kind: 'pageIndex', value: v, path: `/settings/namedDestinations/${escapeKey(k)}` });
      }
    }
  }

  private resolveRefs(): void {
    for (const ref of this.refs) {
      let ok = true;
      let message = '';
      switch (ref.kind) {
        case 'resource':
          ok = typeof ref.value === 'string' && this.resourceNames.has(ref.value);
          message = `No resource named ${JSON.stringify(ref.value)}.`;
          break;
        case 'anchor':
          ok = typeof ref.value === 'string' && this.anchors.has(ref.value);
          message = `No Section or Heading defines the anchor ${JSON.stringify(ref.value)}.`;
          break;
        case 'tocIdentifier':
          ok = typeof ref.value === 'string' && this.tocIdentifiers.has(ref.value);
          message = `No Heading has the tocIdentifier ${JSON.stringify(ref.value)}.`;
          break;
        case 'pageIndex':
          ok = typeof ref.value === 'number' && ref.value < this.pageCount;
          message = `Page index ${String(ref.value)} is beyond the last page (${this.pageCount} pages).`;
          break;
      }
      if (!ok) this.error(ref.path, 'dangling-reference', message, { id: ref.id });
    }
  }

  // ── shapes and values ──────────────────────────────────────────────────────

  /**
   * Checks an object against a shape. `owner` is the id of the enclosing element, for reporting.
   * Returns false when the value is not an object at all.
   */
  private validateShape(
    value: unknown,
    spec: ShapeSpec,
    path: string,
    owner: string | undefined,
    unknownCode: string,
    depth = 0
  ): boolean {
    if (!isObject(value)) {
      this.error(path, 'invalid-type', `Expected an object; found ${typeName(value)}.`, { id: owner });
      return false;
    }
    const keys = keysOf(spec);

    for (const [key, v] of Object.entries(value)) {
      if (key.startsWith('_') || key === '$schema') continue;
      if (spec.secrets?.includes(key)) {
        this.error(
          `${path}/${escapeKey(key)}`,
          'secret-in-definition',
          `\`${key}\` is a secret and is never stored in a definition; the host supplies it when reading.`,
          { id: owner }
        );
        continue;
      }
      const keySpec = keys[key];
      if (!keySpec) {
        this.unrecognised(`${path}/${escapeKey(key)}`, `\`${key}\``, 'unknown-key', owner);
        continue;
      }
      this.checkValue(keySpec, v, `${path}/${escapeKey(key)}`, key, owner, depth);
      if (this.aborted) return true;
    }

    for (const [key, keySpec] of Object.entries(keys)) {
      if (keySpec.required && value[key] === undefined) {
        this.error(path, 'missing-required', `Missing required key \`${key}\`.`, { id: owner, expected: key });
      }
    }
    this.checkGroups(value, spec, path, owner);
    return true;
  }

  private checkGroups(value: Record<string, unknown>, spec: ShapeSpec, path: string, owner: string | undefined): void {
    for (const group of spec.exactlyOne ?? []) {
      const present = group.filter(k => value[k] !== undefined);
      if (present.length !== 1) {
        this.error(
          path,
          'exactly-one-of',
          `Give exactly one of ${group.map(k => `\`${k}\``).join(', ')}; found ${present.length}.`,
          { id: owner }
        );
      }
    }
    for (const group of spec.conflicts ?? []) {
      const present = group.filter(k => value[k] !== undefined);
      if (present.length > 1) {
        this.error(path, 'conflicting-keys', `${present.map(k => `\`${k}\``).join(' and ')} cannot both be set.`, {
          id: owner,
        });
      }
    }
    if (spec.atLeastOne && !Object.keys(spec.keys).some(k => value[k] !== undefined)) {
      this.error(
        path,
        'invalid-value',
        `Give at least one of ${Object.keys(spec.keys)
          .map(k => `\`${k}\``)
          .join(', ')}.`,
        { id: owner }
      );
    }
  }

  private checkValue(
    spec: KeySpec,
    value: unknown,
    path: string,
    key: string,
    owner: string | undefined,
    depth: number
  ): void {
    if (value === null) {
      this.error(path, 'invalid-value', 'null is not a value in a definition; leave the key out instead.', {
        id: owner,
      });
      return;
    }
    this.checkKind(spec.kind, spec, value, path, owner, depth);
  }

  /** Reports a value of the wrong JSON type. */
  private wrongType(path: string, expected: string, value: unknown, owner: string | undefined): void {
    this.error(path, 'invalid-type', `Expected ${expected}; found ${typeName(value)}.`, {
      id: owner,
      expected,
      found: typeName(value),
    });
  }

  private badValue(path: string, message: string, owner: string | undefined, expected?: string): void {
    this.error(path, 'invalid-value', message, { id: owner, expected });
  }

  private checkKind(
    kind: string,
    spec: KeySpec,
    value: unknown,
    path: string,
    owner: string | undefined,
    depth: number
  ): void {
    const [head, ...rest] = kind.split(':');
    const arg = rest.join(':');
    switch (head) {
      case 'string':
        if (typeof value !== 'string') this.wrongType(path, 'a string', value, owner);
        else if (value.length > this.limits.stringLength) this.limit(path, 'A string');
        return;
      case 'boolean':
        if (typeof value !== 'boolean') this.wrongType(path, 'a boolean', value, owner);
        return;
      case 'number':
      case 'integer': {
        if (typeof value !== 'number')
          return this.wrongType(path, head === 'integer' ? 'an integer' : 'a number', value, owner);
        if (head === 'integer' && !Number.isInteger(value))
          return this.badValue(path, `Expected an integer; found ${value}.`, owner, 'an integer');
        if (spec.min !== undefined && value < spec.min)
          return this.badValue(path, `${value} is below the minimum ${spec.min}.`, owner, `>= ${spec.min}`);
        if (spec.max !== undefined && value > spec.max)
          return this.badValue(path, `${value} is above the maximum ${spec.max}.`, owner, `<= ${spec.max}`);
        return;
      }
      case 'integerOrUnlimited':
        if (value === 'unlimited') return;
        if (typeof value === 'string')
          return this.badValue(
            path,
            `${JSON.stringify(value)} is not "unlimited" or an integer.`,
            owner,
            'an integer or "unlimited"'
          );
        return this.checkKind('integer', spec, value, path, owner, depth);
      case 'length':
        return this.checkLength(value, path, owner);
      case 'spacing':
        return this.checkSpacing(value, path, owner);
      case 'border':
        return this.checkBorder(value, path, owner);
      case 'color':
        if (typeof value !== 'string') this.wrongType(path, 'a colour string', value, owner);
        else if (!PALETTE_COLOR.test(value) && !HEX_COLOR.test(value)) {
          this.badValue(
            path,
            `${JSON.stringify(value)} is not a palette token ('slate-800') or a hex colour ('#1e293b').`,
            owner,
            'palette token or #hex'
          );
        }
        return;
      case 'pageSize':
        return this.checkPageSize(value, path, owner);
      case 'fontWeight':
        if (typeof value === 'number') {
          if (!Number.isInteger(value) || value < 1 || value > 1000)
            this.badValue(path, `Font weight ${value} is outside 1 to 1000.`, owner, '1 to 1000');
        } else if (typeof value === 'string') this.checkEnum('FontWeightToken', value, path, owner);
        else this.wrongType(path, 'a weight token or a number', value, owner);
        return;
      case 'decoration':
        if (typeof value === 'string') return this.checkEnum('TextDecorationToken', value, path, owner);
        if (!Array.isArray(value)) return this.wrongType(path, 'a token or an array of tokens', value, owner);
        value.forEach((t, i) =>
          typeof t === 'string'
            ? this.checkEnum('TextDecorationToken', t, `${path}/${i}`, owner)
            : this.wrongType(`${path}/${i}`, 'a string', t, owner)
        );
        if (value.includes('none') && value.length > 1)
          this.badValue(path, '`none` cannot be combined with other decorations.', owner);
        return;
      case 'permissions':
        if (typeof value === 'string') {
          if (value !== 'all' && value !== 'none') this.checkEnum('PdfPermission', value, path, owner);
          return;
        }
        if (!Array.isArray(value)) return this.wrongType(path, 'an array of permission tokens', value, owner);
        value.forEach((t, i) =>
          typeof t === 'string'
            ? this.checkEnum('PdfPermission', t, `${path}/${i}`, owner)
            : this.wrongType(`${path}/${i}`, 'a string', t, owner)
        );
        return;
      case 'enum':
        if (typeof value !== 'string') this.wrongType(path, 'a token string', value, owner);
        else this.checkEnum(arg, value, path, owner);
        return;
      case 'dateTime':
        if (typeof value !== 'string') this.wrongType(path, 'a date-time string', value, owner);
        else if (!DATE_TIME.test(value))
          this.badValue(
            path,
            `${JSON.stringify(value)} is not an RFC 3339 date-time with an offset.`,
            owner,
            'RFC 3339 with offset'
          );
        return;
      case 'base64':
        if (typeof value !== 'string') this.wrongType(path, 'a base64 string', value, owner);
        else if (!BASE64.test(value)) this.badValue(path, 'Not standard, padded base64.', owner, 'RFC 4648 base64');
        return;
      case 'sha256':
        if (typeof value !== 'string') this.wrongType(path, 'a hex string', value, owner);
        else if (!SHA256.test(value))
          this.badValue(path, 'Expected 64 lower-case hex digits.', owner, '64 lower-case hex digits');
        return;
      case 'chartNumberFormat':
        if (typeof value !== 'string') this.wrongType(path, 'a format string', value, owner);
        else if (!isChartNumberFormat(value)) {
          this.error(
            path,
            'unsupported-format',
            `Chart number format ${JSON.stringify(value)} is not supported. Use G, F<n>, N<n> or P<n>, with n from 0 to 15.`,
            { id: owner }
          );
        }
        return;
      case 'array':
        return this.checkArray(arg, spec, value, path, owner, depth);
      case 'map':
        return this.checkMap(arg, spec, value, path, owner, depth);
      case 'object': {
        const shape = D.shapes[arg] ?? D.objects[arg];
        this.validateShape(value, shape, path, owner, 'unknown-key', depth);
        if (arg === 'ChartData') this.countChartPoints(value, path);
        return;
      }
      case 'element':
        return this.checkElement(value, path, depth + 1);
      case 'elements':
        return this.checkElements(value, path, depth);
      default:
        return this.checkSpecial(head, value, path, owner, depth);
    }
  }

  private checkEnum(name: string, token: string, path: string, owner: string | undefined): void {
    const enumSpec = D.enums[name];
    if (enumSpec.tokens.includes(token)) return;
    if (this.newerMinor) return this.unrecognised(path, `Token ${JSON.stringify(token)}`, 'invalid-value', owner);
    this.badValue(
      path,
      `${JSON.stringify(token)} is not a ${name} token. Expected one of: ${enumSpec.tokens.join(', ')}.`,
      owner,
      enumSpec.tokens.join(' | ')
    );
  }

  private checkLength(value: unknown, path: string, owner: string | undefined): void {
    if (typeof value === 'number') return;
    if (typeof value === 'string') {
      if (!LENGTH_TOKEN.test(value))
        this.badValue(
          path,
          `${JSON.stringify(value)} is not a length. Write points (72), a token ('1in', '10mm', '2.5cm', '72pt') or { value, unit }.`,
          owner,
          'points, unit token or { value, unit }'
        );
      return;
    }
    if (isObject(value)) {
      const extras = Object.keys(value).filter(k => k !== 'value' && k !== 'unit');
      if (typeof value.value !== 'number' || typeof value.unit !== 'string' || extras.length > 0) {
        return this.badValue(path, 'A length object is { value: number, unit: "pt" | "in" | "cm" | "mm" }.', owner);
      }
      return this.checkEnum('Unit', value.unit, `${path}/unit`, owner);
    }
    this.wrongType(path, 'a length', value, owner);
  }

  private checkSpacing(value: unknown, path: string, owner: string | undefined): void {
    if (typeof value === 'number' || typeof value === 'string') return this.checkLength(value, path, owner);
    if (Array.isArray(value)) {
      if (value.length !== 2 && value.length !== 4)
        return this.badValue(
          path,
          'Spacing as an array is [h, v] or [left, top, right, bottom].',
          owner,
          '2 or 4 lengths'
        );
      value.forEach((v, i) => this.checkLength(v, `${path}/${i}`, owner));
      return;
    }
    if (isObject(value)) {
      for (const [k, v] of Object.entries(value)) {
        if (!['top', 'right', 'bottom', 'left'].includes(k))
          this.badValue(`${path}/${escapeKey(k)}`, `\`${k}\` is not a side; use top, right, bottom or left.`, owner);
        else this.checkLength(v, `${path}/${k}`, owner);
      }
      return;
    }
    this.wrongType(path, 'a spacing value', value, owner);
  }

  private checkBorder(value: unknown, path: string, owner: string | undefined): void {
    if (typeof value === 'number' || typeof value === 'string') return this.checkLength(value, path, owner);
    if (!isObject(value)) return this.wrongType(path, 'a border', value, owner);
    for (const [k, v] of Object.entries(value)) {
      if (k === 'color') this.checkKind('color', { kind: 'color' }, v, `${path}/color`, owner, 0);
      else if (['width', 'top', 'right', 'bottom', 'left'].includes(k)) this.checkLength(v, `${path}/${k}`, owner);
      else this.badValue(`${path}/${escapeKey(k)}`, `\`${k}\` is not a border key.`, owner);
    }
    if (value.width !== undefined && ['top', 'right', 'bottom', 'left'].some(k => value[k] !== undefined)) {
      this.error(path, 'conflicting-keys', '`width` and per-side widths cannot both be set.', { id: owner });
    }
  }

  private checkPageSize(value: unknown, path: string, owner: string | undefined): void {
    if (typeof value === 'string') {
      if (!D.pageSizes.includes(value))
        this.badValue(
          path,
          `${JSON.stringify(value)} is not a page size. Expected one of: ${D.pageSizes.join(', ')}.`,
          owner,
          D.pageSizes.join(' | ')
        );
      return;
    }
    if (!isObject(value)) return this.wrongType(path, 'a page size token or { width, height }', value, owner);
    const extras = Object.keys(value).filter(k => !['width', 'height', 'name'].includes(k));
    if (
      typeof value.width !== 'number' ||
      typeof value.height !== 'number' ||
      value.width <= 0 ||
      value.height <= 0 ||
      extras.length
    ) {
      this.badValue(path, 'A page size object is { width, height, name? } with positive numbers of points.', owner);
    }
  }

  private checkArray(
    itemKind: string,
    spec: KeySpec,
    value: unknown,
    path: string,
    owner: string | undefined,
    depth: number
  ): void {
    if (!Array.isArray(value)) return this.wrongType(path, 'an array', value, owner);
    if (value.length > this.limits.arrayLength) return this.limit(path, 'An array');
    for (let i = 0; i < value.length; i++) {
      if (value[i] === null) this.badValue(`${path}/${i}`, 'null is not a value in a definition.', owner);
      else this.checkKind(itemKind, { ...spec, kind: itemKind }, value[i], `${path}/${i}`, owner, depth);
      if (this.aborted) return;
    }
  }

  private checkMap(
    valueKind: string,
    spec: KeySpec,
    value: unknown,
    path: string,
    owner: string | undefined,
    depth: number
  ): void {
    if (!isObject(value)) return this.wrongType(path, 'an object', value, owner);
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('_')) continue;
      if (v === null) this.badValue(`${path}/${escapeKey(k)}`, 'null is not a value in a definition.', owner);
      else this.checkKind(valueKind, { ...spec, kind: valueKind }, v, `${path}/${escapeKey(k)}`, owner, depth);
    }
  }

  private countChartPoints(chart: unknown, path: string): void {
    if (!isObject(chart) || !Array.isArray(chart.series)) return;
    for (const s of chart.series)
      if (isObject(s) && Array.isArray(s.dataPoints)) this.chartPoints += s.dataPoints.length;
    if (this.chartPoints > this.limits.chartDataPoints) this.limit(path, 'The number of chart data points');
  }

  // ── elements and slots ─────────────────────────────────────────────────────

  private checkElements(value: unknown, path: string, depth: number): void {
    if (!Array.isArray(value)) return this.wrongType(path, 'an array of elements', value, undefined);
    if (value.length > this.limits.arrayLength) return this.limit(path, 'An array');
    for (let i = 0; i < value.length; i++) {
      this.checkElement(value[i], `${path}/${i}`, depth + 1);
      if (this.aborted) return;
    }
  }

  /** Checks an element node: a `type`, its keys, and its children. */
  checkElement(node: unknown, path: string, depth: number, allowedType?: string): void {
    if (this.aborted) return;
    if (!isObject(node)) return this.wrongType(path, 'an element object', node, undefined);
    if (depth > this.limits.elementDepth) return this.limit(path, 'The nesting depth of elements');
    if (++this.nodeCount > this.limits.elementNodes) return this.limit(path, 'The number of elements');

    const type = node.type;
    if (type === undefined)
      return void this.error(path, 'missing-required', 'Missing required key `type`.', { expected: 'type' });
    if (typeof type !== 'string') return this.wrongType(`${path}/type`, 'a string', type, undefined);
    const spec = D.elements[type];
    if (!spec) return this.unrecognised(path, `Element type ${JSON.stringify(type)}`, 'unknown-type');
    if (allowedType !== undefined && type !== allowedType) {
      return void this.error(
        `${path}/type`,
        'invalid-value',
        `A nested list has the same type as its parent (${allowedType}); found ${type}.`,
        { expected: allowedType }
      );
    }

    let id: string | undefined;
    if (node.id !== undefined) {
      if (typeof node.id !== 'string' || !ID_PATTERN.test(node.id)) {
        this.badValue(
          `${path}/id`,
          'An id starts with a letter or digit and continues with letters, digits and _ . : - (128 characters at most).',
          undefined,
          ID_PATTERN.source
        );
      } else {
        id = node.id;
        const first = this.ids.get(id);
        if (first !== undefined)
          this.error(`${path}/id`, 'duplicate-id', `The id ${JSON.stringify(id)} is already used at ${first}.`, { id });
        else this.ids.set(id, path);
      }
    }

    // `type` and `id` are the node's own keys; everything else is checked against the element.
    const { type: _t, id: _i, ...body } = node;
    void _t;
    void _i;
    const isList = type === 'UnorderedList' || type === 'OrderedList';
    if (isList) this.listTypes.push(type);
    this.validateShape(body, spec, path, id, 'unknown-key', depth);
    if (isList) this.listTypes.pop();

    for (const [key, refKind] of Object.entries(spec.refs ?? {}))
      this.collectRef(refKind, body[key], `${path}/${key}`, id);
    for (const [key, defKind] of Object.entries(spec.defines ?? {})) {
      const v = body[key];
      if (typeof v === 'string') (defKind === 'anchor' ? this.anchors : this.tocIdentifiers).add(v);
    }
    for (const rule of spec.rules ?? []) {
      if (rule === 'singleSeries') this.singleSeries(body, path, id);
      else if (rule === 'chartDuplicates') this.chartDuplicates(body, path, id);
    }
    if (type === 'Table' || type === 'Grid') this.tableWidth(body, path, id);
  }

  private collectRef(kind: string, value: unknown, path: string, id?: string): void {
    if (value === undefined || value === null) return;
    if (Array.isArray(value))
      value.forEach((v, i) => typeof v === 'string' && this.refs.push({ kind, value: v, path: `${path}/${i}`, id }));
    else this.refs.push({ kind, value, path, id });
  }

  private singleSeries(body: Record<string, unknown>, path: string, id?: string): void {
    const data = body.data;
    if (isObject(data) && Array.isArray(data.series) && data.series.length > 1) {
      this.error(
        `${path}/data/series`,
        'invalid-value',
        'A pie chart draws its first series only; give it one series.',
        { id, expected: 'one series' }
      );
    }
  }

  /** A chart's own title and axes and the copies inside `data` may both be given, but must agree. */
  private chartDuplicates(body: Record<string, unknown>, path: string, id?: string): void {
    const data = body.data;
    if (!isObject(data)) return;
    for (const key of ['title', 'xAxis', 'yAxis']) {
      if (body[key] === undefined || data[key] === undefined) continue;
      if (canonical(body[key]) !== canonical(data[key])) {
        this.error(path, 'conflicting-keys', `\`${key}\` is given on the chart and in \`data\`, and the two differ.`, {
          id,
        });
      }
    }
  }

  /** Under `strict`, a row that occupies more columns than the table declares. */
  private tableWidth(body: Record<string, unknown>, path: string, id?: string): void {
    if (!this.options.strict || !Array.isArray(body.columns)) return;
    const declared = body.columns.length;
    for (const slot of ['header', 'rows', 'footer'] as const) {
      const rows = body[slot];
      if (!Array.isArray(rows)) continue;
      rows.forEach((row, r) => {
        const cells = Array.isArray(row) ? row : isObject(row) && Array.isArray(row.cells) ? row.cells : [];
        const width = cells.reduce(
          (sum: number, c: unknown) =>
            sum + (isObject(c) && c.type === 'TableCell' && typeof c.columnSpan === 'number' ? c.columnSpan : 1),
          0
        );
        if (width > declared)
          this.error(
            `${path}/${slot}/${r}`,
            'table-row-width',
            `Row occupies ${width} columns; the table declares ${declared}.`,
            { id }
          );
      });
    }
  }

  // ── named special kinds ────────────────────────────────────────────────────

  private checkSpecial(kind: string, value: unknown, path: string, owner: string | undefined, depth: number): void {
    switch (kind) {
      case 'stackChildren': {
        if (!Array.isArray(value)) return this.wrongType(path, 'an array', value, owner);
        value.forEach((child, i) => {
          const at = `${path}/${i}`;
          if (
            isObject(child) &&
            child.type === undefined &&
            (child.element !== undefined || child.weight !== undefined)
          ) {
            const extras = Object.keys(child).filter(k => k !== 'weight' && k !== 'element' && !k.startsWith('_'));
            for (const k of extras)
              this.badValue(
                `${at}/${escapeKey(k)}`,
                '`weight` and `element` are the only keys of a weighted child.',
                owner
              );
            if (typeof child.weight !== 'number' || child.weight <= 0)
              this.badValue(`${at}/weight`, 'A weight is a positive number.', owner, '> 0');
            if (child.element === undefined)
              this.error(at, 'missing-required', 'Missing required key `element`.', { id: owner, expected: 'element' });
            else this.checkElement(child.element, `${at}/element`, depth + 2);
          } else this.checkElement(child, at, depth + 1);
        });
        return;
      }
      case 'listItems': {
        if (!Array.isArray(value)) return this.wrongType(path, 'an array', value, owner);
        const parentType = this.currentListType(path);
        value.forEach((item, i) => {
          const at = `${path}/${i}`;
          if (typeof item === 'string') return;
          if (isObject(item) && (item.type === 'UnorderedList' || item.type === 'OrderedList')) {
            return this.checkElement(item, at, depth + 1, parentType);
          }
          this.wrongType(at, 'a string or a nested list', item, owner);
        });
        return;
      }
      case 'spans': {
        if (!Array.isArray(value)) return this.wrongType(path, 'an array', value, owner);
        value.forEach((span, i) => {
          const at = `${path}/${i}`;
          if (!this.validateShape(span, D.shapes.Span, at, owner, 'unknown-key')) return;
          const s = span as Record<string, unknown>;
          if (s.lineBreak === true) {
            if (s.text !== undefined || s.style !== undefined)
              this.error(at, 'conflicting-keys', 'A line break has no text or style.', { id: owner });
          } else if (typeof s.text !== 'string') {
            this.error(at, 'missing-required', 'A span needs `text`, or `lineBreak: true`.', {
              id: owner,
              expected: 'text',
            });
          }
        });
        return;
      }
      case 'rows': {
        if (!Array.isArray(value)) return this.wrongType(path, 'an array of rows', value, owner);
        value.forEach((row, r) => {
          const at = `${path}/${r}`;
          if (Array.isArray(row)) return this.checkCells(row, at, owner, depth);
          if (this.validateShape(row, D.shapes.TableRow, at, owner, 'unknown-key') && isObject(row)) {
            if (row.cells !== undefined) this.checkCells(row.cells, `${at}/cells`, owner, depth);
          }
        });
        return;
      }
      case 'cells':
        return this.checkCells(value, path, owner, depth);
      case 'cellContent':
        if (typeof value === 'string') return;
        return this.checkElement(value, path, depth + 1);
      default:
        this.error(path, 'invalid-value', `Internal: unknown value kind ${kind}.`, { id: owner });
    }
  }

  private readonly listTypes: string[] = [];
  private currentListType(_path: string): string | undefined {
    return this.listTypes[this.listTypes.length - 1];
  }

  private checkCells(cells: unknown, path: string, owner: string | undefined, depth: number): void {
    if (!Array.isArray(cells)) return this.wrongType(path, 'an array of cells', cells, owner);
    cells.forEach((cell, c) => {
      const at = `${path}/${c}`;
      if (typeof cell === 'string') return;
      if (isObject(cell) && cell.type === 'TableCell') {
        const { type: _t, ...body } = cell;
        void _t;
        this.validateShape({ type: 'TableCell', ...body }, D.shapes.TableCell, at, owner, 'unknown-key', depth + 1);
        return;
      }
      this.checkElement(cell, at, depth + 1);
    });
  }
}

/** Reads the raw text's nesting depth without parsing it, so a hostile document cannot reach the parser. */
function jsonDepth(text: string): number {
  let depth = 0;
  let max = 0;
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (inString) {
      if (c === 92) i++;
      else if (c === 34) inString = false;
    } else if (c === 34) inString = true;
    else if (c === 91 || c === 123) max = Math.max(max, ++depth);
    else if (c === 93 || c === 125) depth--;
  }
  return max;
}

function objectDepth(root: unknown, limit: number): number {
  const stack: [unknown, number][] = [[root, 1]];
  let max = 0;
  while (stack.length) {
    const [v, d] = stack.pop()!;
    if (typeof v !== 'object' || v === null) continue;
    max = Math.max(max, d);
    if (max > limit) return max;
    for (const child of Array.isArray(v) ? v : Object.values(v)) stack.push([child, d + 1]);
  }
  return max;
}

/**
 * Checks a Document Definition completely against the format and this reader's limits, and returns
 * every problem with its location. Nothing is constructed.
 *
 * Accepts JSON text or an already-parsed value.
 */
export function validateDefinition(input: unknown, options: ValidateOptions = {}): ValidationResult {
  const limits = { ...DEFAULT_DEFINITION_LIMITS, ...options.limits };
  const fail = (code: string, message: string, path = ''): ValidationResult => ({
    valid: false,
    errors: [{ path, code, message }],
    warnings: [],
  });

  let root: unknown = input;
  if (typeof input === 'string') {
    if (new TextEncoder().encode(input).byteLength > limits.inputBytes)
      return fail('limit-exceeded', 'The input exceeds the size limit for this reader.');
    if (jsonDepth(input) > limits.jsonDepth)
      return fail('limit-exceeded', 'The JSON nests deeper than this reader allows.');
    try {
      root = JSON.parse(input);
    } catch (e) {
      return fail('invalid-json', `The input is not valid JSON: ${(e as Error).message}`);
    }
  } else if (objectDepth(input, limits.jsonDepth) > limits.jsonDepth) {
    return fail('limit-exceeded', 'The value nests deeper than this reader allows.');
  }

  const validator = new Validator(options);
  validator.run(root);
  validator.finish();
  const valid = validator.errors.length === 0;
  return {
    valid,
    errors: validator.errors,
    warnings: validator.warnings,
    definition: valid ? (root as DocumentDefinition) : undefined,
  };
}
