// Generated chart source. Do not edit here; the source manifest records its provenance.
import { Color, toColor, type ColorInput } from '../ChartHost';
import type { ChartPathCommand, ChartPathPlan, ChartResolvedEffect, ChartStrokePlan } from './ChartPathPlan';

/** A soft drop shadow beneath a shape. */
export interface ChartShadowOptions {
  type: 'shadow';
  /** Shadow colour (`#0f172a`). */
  color?: ColorInput;
  /** Peak opacity, `0..1` (`0.18`). */
  opacity?: number;
  /** Blur extent in points, `0..48` (`8`). */
  blur?: number;
  /** Horizontal offset in points, magnitude at most 48 (`0`). */
  offsetX?: number;
  /** Vertical offset in points, magnitude at most 48 (`3`). */
  offsetY?: number;
}

/** A soft halo around a shape or line. */
export interface ChartGlowOptions {
  type: 'glow';
  /** Glow colour (the shape's own colour). */
  color?: ColorInput;
  /** Peak opacity, `0..1` (`0.35`). */
  opacity?: number;
  /** Radius in points, `0..48` (`6`). */
  radius?: number;
}

/** A white highlight fading from the top of a shape, for a glassy look. */
export interface ChartGlossOptions {
  type: 'gloss';
  /** Opacity of the highlight at the top edge, `0..1` (`0.35`). */
  opacity?: number;
  /** Fraction of the shape's height the highlight covers, `(0, 1]` (`0.45`). */
  extent?: number;
}

/** Any visual effect a chart accepts. */
export type ChartEffectInput = ChartShadowOptions | ChartGlowOptions | ChartGlossOptions;

/** How a sink realises shadow and glow: natively (`native`), by the core layering shapes (default), or not at all. */
export type ChartEffectsMode = 'native' | 'geometry' | 'none';

/** Number of translucent layers that stand in for a blur. */
export const EFFECT_LAYERS = 8;
const MAX_EXTENT = 48;

function within(name: string, value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || value < min || value > max) throw new RangeError(`${name} must be a finite number from ${min} to ${max}.`);
  return value;
}

/** Validates and normalises effect options. */
export function toEffects(inputs: readonly ChartEffectInput[] | undefined): ChartResolvedEffect[] {
  if (inputs === undefined) return [];
  return inputs.map((e): ChartResolvedEffect => {
    switch (e.type) {
      case 'shadow':
        return {
          kind: 'shadow',
          color: toColor(e.color ?? '#0f172a'),
          opacity: within('Shadow opacity', e.opacity ?? 0.18, 0, 1),
          blur: within('Shadow blur', e.blur ?? 8, 0, MAX_EXTENT),
          offsetX: within('Shadow offsetX', e.offsetX ?? 0, -MAX_EXTENT, MAX_EXTENT),
          offsetY: within('Shadow offsetY', e.offsetY ?? 3, -MAX_EXTENT, MAX_EXTENT),
        };
      case 'glow':
        return {
          kind: 'glow',
          color: e.color === undefined ? undefined : toColor(e.color),
          opacity: within('Glow opacity', e.opacity ?? 0.35, 0, 1),
          radius: within('Glow radius', e.radius ?? 6, 0, MAX_EXTENT),
        };
      case 'gloss': {
        const extent = within('Gloss extent', e.extent ?? 0.45, 0, 1);
        if (extent === 0) throw new RangeError('Gloss extent must be greater than 0.');
        return { kind: 'gloss', opacity: within('Gloss opacity', e.opacity ?? 0.35, 0, 1), extent };
      }
      default:
        throw new RangeError("An effect type must be 'shadow', 'glow' or 'gloss'.");
    }
  });
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** The bounding box of every coordinate in a command list (control points included). */
export function commandBounds(commands: readonly ChartPathCommand[]): Bounds | undefined {
  let b: Bounds | undefined;
  for (const c of commands) {
    for (let i = 0; i + 1 < c.values.length; i += 2) {
      const x = c.values[i];
      const y = c.values[i + 1];
      b = b ? { minX: Math.min(b.minX, x), minY: Math.min(b.minY, y), maxX: Math.max(b.maxX, x), maxY: Math.max(b.maxY, y) } : { minX: x, minY: y, maxX: x, maxY: y };
    }
  }
  return b;
}

/**
 * Alpha of layer `i` (0 is the outermost). Cumulative opacity rises linearly from `opacity / EFFECT_LAYERS` at the rim
 * to `opacity` where every layer overlaps, so the edge fades instead of ending in a visible band.
 */
export function layerAlpha(opacity: number, i: number): number {
  const target = (opacity * (i + 1)) / EFFECT_LAYERS;
  const before = (opacity * i) / EFFECT_LAYERS;
  return i === 0 ? target : 1 - (1 - target) / (1 - before);
}

/** Scales a path about the centre of its bounding box so that box grows by `grow` on every side, then offsets it. */
function growCommands(commands: readonly ChartPathCommand[], b: Bounds, grow: number, dx: number, dy: number): ChartPathCommand[] {
  const w = b.maxX - b.minX;
  const h = b.maxY - b.minY;
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  const sx = (w + 2 * grow) / w;
  const sy = (h + 2 * grow) / h;
  return commands.map((c) => {
    const values = c.values.slice();
    for (let i = 0; i + 1 < values.length; i += 2) {
      values[i] = cx + (values[i] - cx) * sx + dx;
      values[i + 1] = cy + (values[i + 1] - cy) * sy + dy;
    }
    return { op: c.op, values };
  });
}

function glossPlan(plan: ChartPathPlan, gloss: Extract<ChartResolvedEffect, { kind: 'gloss' }>, b: Bounds): ChartPathPlan {
  const white = Color.white;
  const top = new Color(255, 255, 255, Math.round(gloss.opacity * 255));
  const clear = new Color(255, 255, 255, 0);
  return {
    commands: plan.commands.map((c) => ({ op: c.op, values: c.values.slice() })),
    color: white.withAlpha(gloss.opacity / 2),
    gradient: {
      startX: (b.minX + b.maxX) / 2,
      startY: b.minY,
      endX: (b.minX + b.maxX) / 2,
      endY: b.maxY,
      startColor: top,
      endColor: clear,
      stops: [
        { offset: 0, color: top },
        { offset: gloss.extent, color: clear },
        { offset: 1, color: clear },
      ],
    },
  };
}

/**
 * Expands a plan that carries effects into the plans a sink draws, in painter's order.
 * `native` leaves shadow and glow on the plan for the sink; `geometry` replaces them with translucent layers beneath it;
 * `none` drops them. A gloss is always a gradient overlay above the shape.
 */
export function expandEffects(plan: ChartPathPlan, mode: ChartEffectsMode): ChartPathPlan[] {
  const effects = plan.effects;
  if (!effects || effects.length === 0) return [plan];
  const b = commandBounds(plan.commands);
  const layers: ChartPathPlan[] = [];
  const overlays: ChartPathPlan[] = [];
  const kept = effects.filter((e) => e.kind !== 'gloss');
  const base: ChartPathPlan = { commands: plan.commands, color: plan.color, gradient: plan.gradient, radial: plan.radial };
  if (b && b.maxX > b.minX && b.maxY > b.minY) {
    if (mode === 'geometry') {
      for (const e of effects) {
        if (e.kind === 'shadow' || e.kind === 'glow') {
          const spread = e.kind === 'shadow' ? e.blur / 2 : e.radius;
          const base = e.color ?? plan.color;
          const dx = e.kind === 'shadow' ? e.offsetX : 0;
          const dy = e.kind === 'shadow' ? e.offsetY : 0;
          for (let i = 0; i < EFFECT_LAYERS; i++) {
            layers.push({ commands: growCommands(plan.commands, b, (spread * (EFFECT_LAYERS - i)) / EFFECT_LAYERS, dx, dy), color: base.withAlpha(layerAlpha(e.opacity, i)) });
          }
        }
      }
    }
    for (const e of effects) if (e.kind === 'gloss') overlays.push(glossPlan(plan, e, b));
  }
  if (mode === 'native' && kept.length > 0) base.effects = kept;
  return [...layers, base, ...overlays];
}

/** Expands the glow and shadow of a stroke into wider, translucent strokes beneath it. Strokes have no native form. */
export function expandStrokeEffects(plan: ChartStrokePlan, mode: ChartEffectsMode): ChartStrokePlan[] {
  const effects = plan.effects;
  if (!effects || effects.length === 0) return [plan];
  const { effects: _effects, ...base } = plan;
  if (mode === 'none') return [base];
  const layers: ChartStrokePlan[] = [];
  for (const e of effects) {
    if (e.kind === 'gloss') continue;
    const spread = e.kind === 'shadow' ? e.blur / 2 : e.radius;
    const tint = e.color ?? plan.color;
    const dx = e.kind === 'shadow' ? e.offsetX : 0;
    const dy = e.kind === 'shadow' ? e.offsetY : 0;
    for (let i = 0; i < EFFECT_LAYERS; i++) {
      const color = tint.withAlpha(layerAlpha(e.opacity, i));
      const commands = dx === 0 && dy === 0 ? base.commands : base.commands.map((c) => ({ op: c.op, values: c.values.map((v, n) => v + (n % 2 === 0 ? dx : dy)) }));
      layers.push({ ...base, commands, color, lineWidth: plan.lineWidth + (2 * spread * (EFFECT_LAYERS - i)) / EFFECT_LAYERS });
    }
  }
  return [...layers, base];
}
