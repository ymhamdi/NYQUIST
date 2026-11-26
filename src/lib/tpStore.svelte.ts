/**
 * One store per TP page, built from the TP's MATLAB script itself: its
 * @param lines give the defaults, ranges and units. Every island of the
 * page (and the report) reads the same values and the same engine result.
 * Values are mirrored in the URL (shareable link) and in localStorage
 * (per-browser convenience; the page works without it).
 */
import { cellSource, defaults, parseParams, substitute, type ParamSpec, type ParamValue } from '../engine/matlabScript'

export interface TpStore<R> {
  readonly key: string
  readonly specs: ParamSpec[]
  readonly defaults: Record<string, ParamValue>
  readonly values: Record<string, ParamValue>
  readonly result: R
  /** the submitted script with the current values */
  readonly script: string
  cell(id: string): string
  reset(): void
  isDefault(name: string): boolean
  /**
   * Applies the URL and stored values. Called by each island once it is
   * hydrated (in an $effect): the islands must hydrate with the same values
   * as the server render (the script's defaults), because Svelte does not
   * repair a mismatched {@html} (the MathML formulas) during hydration.
   */
  restore(): void
}

const storageKey = (key: string) => `nyq-params-${key}`

function readStored(key: string, specs: ParamSpec[]): Record<string, ParamValue> {
  const out: Record<string, ParamValue> = {}
  if (typeof window === 'undefined') return out
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(key)) ?? '{}') as Record<string, ParamValue>
    for (const s of specs) if (s.name in saved && typeof saved[s.name] === typeof s.value) out[s.name] = saved[s.name]
  } catch {
    /* storage unavailable: defaults */
  }
  const q = new URLSearchParams(window.location.search)
  for (const s of specs) {
    const raw = q.get(s.name)
    if (raw === null) continue
    const v = Array.isArray(s.value) ? raw.split(',').map(Number) : Number(raw)
    if (Array.isArray(v) ? v.every(Number.isFinite) : Number.isFinite(v)) out[s.name] = v
  }
  return out
}

/**
 * A part of a TP model that depends on a few parameters only: recomputed
 * only when they change, and computed only when an island reads one of its
 * outputs (an island of part III never pays for part IV).
 */
export interface ModelPart {
  keys: readonly string[]
  /** the cell ids it returns */
  outputs: readonly string[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (p: any) => Record<string, unknown>
}

export function createTpStore<R>(
  key: string,
  source: string,
  model: ((p: Record<string, ParamValue>) => R) | Record<string, ModelPart>,
): TpStore<R> {
  const specs = parseParams(source)
  const defs = defaults(source)
  const values = $state<Record<string, ParamValue>>({ ...defs })
  const pick = (keys: readonly string[]) => Object.fromEntries(keys.map((k) => [k, $state.snapshot(values[k])]))
  const parts =
    typeof model === 'function'
      ? null
      : Object.values(model).map((part) => {
          const d = $derived(part.fn(pick(part.keys)))
          return { outputs: part.outputs, get: () => d }
        })
  // one getter per cell id: reading r['III.1'] evaluates (and tracks) only the part that returns it
  const lazy: Record<string, unknown> = {}
  for (const part of parts ?? []) {
    for (const id of part.outputs) Object.defineProperty(lazy, id, { enumerable: true, get: () => part.get()[id] })
  }
  const whole = $derived(typeof model === 'function' ? model($state.snapshot(values) as Record<string, ParamValue>) : null)
  const script = $derived(substitute(source, $state.snapshot(values) as Record<string, ParamValue>))
  let restored = $state(false)

  if (typeof window !== 'undefined') {
    $effect.root(() => {
      $effect(() => {
        const snap = $state.snapshot(values) as Record<string, ParamValue>
        if (!restored) return // never overwrite the saved values with the defaults
        const changed = Object.fromEntries(Object.entries(snap).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(defs[k])))
        try {
          localStorage.setItem(storageKey(key), JSON.stringify(changed))
        } catch {
          /* ignore */
        }
        const url = new URL(window.location.href)
        for (const s of specs) url.searchParams.delete(s.name)
        for (const [k, v] of Object.entries(changed)) url.searchParams.set(k, Array.isArray(v) ? v.join(',') : String(v))
        history.replaceState(history.state, '', url)
      })
    })
  }

  return {
    key,
    specs,
    defaults: defs,
    values,
    get result() {
      return (parts ? lazy : whole) as R
    },
    get script() {
      return script
    },
    cell: (id: string) => cellSource(script, id),
    reset() {
      for (const [k, v] of Object.entries(defs)) values[k] = Array.isArray(v) ? [...v] : v
    },
    isDefault: (name: string) => JSON.stringify(values[name]) === JSON.stringify(defs[name]),
    restore() {
      if (restored || typeof window === 'undefined') return
      Object.assign(values, readStored(key, specs))
      restored = true
    },
  }
}
