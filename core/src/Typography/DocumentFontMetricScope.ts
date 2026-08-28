import { TtfFont } from './TrueType/TtfFont';
import { FontManager } from './FontManager';

interface DocumentFontMetricScope {
  embedStandardFonts: boolean;
  pathAliases: Map<string, string>;
  instanceAliases: Map<string, TtfFont>;
}

const globalPathAliases = new Map<string, string>();
const globalInstanceAliases = new Map<string, TtfFont>();
let currentScope: DocumentFontMetricScope | undefined;
const parsedStandardFonts = new WeakMap<Uint8Array, TtfFont | null>();
const registryFontInstances = new WeakMap<object, Map<string, TtfFont>>();
const registryFontPaths = new WeakMap<object, Map<string, string>>();

/** Opens a scope around one synchronous document layout/render pass. */
export function beginDocumentFontMetricScope(
  embedStandardFonts: boolean,
  instanceAliases?: ReadonlyMap<string, TtfFont>,
  pathAliases?: ReadonlyMap<string, string>
): { dispose(): void } {
  const previous = currentScope;
  const scope: DocumentFontMetricScope = {
    embedStandardFonts,
    pathAliases: new Map(globalPathAliases),
    instanceAliases: new Map(globalInstanceAliases),
  };
  for (const [name, path] of pathAliases ?? []) scope.pathAliases.set(name, path);
  for (const [name, font] of instanceAliases ?? []) scope.instanceAliases.set(name, font);
  currentScope = scope;

  let disposed = false;
  return {
    dispose: () => {
      if (disposed) return;
      currentScope = previous;
      disposed = true;
    },
  };
}

/** Application registrations are global except when made inside a render callback. */
export function registerFontPathAlias(logicalName: string, path: string): void {
  (currentScope?.pathAliases ?? globalPathAliases).set(logicalName, path);
}

export function registerFontInstanceAlias(logicalName: string, font: TtfFont): void {
  (currentScope?.instanceAliases ?? globalInstanceAliases).set(logicalName, font);
}

/** Renderer-discovered aliases are never published outside their document. */
export function registerDocumentFontPathAlias(logicalName: string, path: string): void {
  currentScope?.pathAliases.set(logicalName, path);
}

export function registerDocumentFontInstanceAlias(logicalName: string, font: TtfFont): void {
  currentScope?.instanceAliases.set(logicalName, font);
}

export function recordRegistryFontInstance(registry: object, logicalName: string, font: TtfFont): void {
  let aliases = registryFontInstances.get(registry);
  if (!aliases) {
    aliases = new Map();
    registryFontInstances.set(registry, aliases);
  }
  aliases.set(logicalName, font);
  registerDocumentFontInstanceAlias(logicalName, font);
}

export function recordRegistryFontPath(registry: object, logicalName: string, path: string): void {
  let aliases = registryFontPaths.get(registry);
  if (!aliases) {
    aliases = new Map();
    registryFontPaths.set(registry, aliases);
  }
  aliases.set(logicalName, path);
  registerDocumentFontPathAlias(logicalName, path);
}

export function getRegistryFontInstances(registry: object | undefined): ReadonlyMap<string, TtfFont> | undefined {
  return registry ? registryFontInstances.get(registry) : undefined;
}

export function getRegistryFontPaths(registry: object | undefined): ReadonlyMap<string, string> | undefined {
  return registry ? registryFontPaths.get(registry) : undefined;
}

export function getFontPathAlias(logicalName: string): string | undefined {
  return (currentScope?.pathAliases ?? globalPathAliases).get(logicalName);
}

export function getFontInstanceAlias(logicalName: string): TtfFont | undefined {
  return (currentScope?.instanceAliases ?? globalInstanceAliases).get(logicalName);
}

export function shouldUseEmbeddedStandardMetrics(): boolean {
  return currentScope?.embedStandardFonts ?? false;
}

export function cacheDocumentFontInstance(logicalName: string, font: TtfFont): void {
  currentScope?.instanceAliases.set(logicalName, font);
}

/** Resolves and caches the current registered standard-font substitute by byte identity. */
export function resolveStandardFontMetric(logicalName: string): TtfFont | null {
  const bytes = FontManager.getBytesForStandardFont(logicalName);
  if (!bytes) return null;

  let font = parsedStandardFonts.get(bytes);
  if (font !== undefined) return font;
  try {
    font = TtfFont.loadFromBytes(bytes);
  } catch {
    font = null;
  }
  parsedStandardFonts.set(bytes, font);
  return font;
}
