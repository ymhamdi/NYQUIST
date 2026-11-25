/**
 * Shared pieces of the Mode DS generators: the exercise shape, a seeded
 * random generator, and the grading rule.
 */
import type { Step } from '../derive/firstOrderLoop'

export interface Item {
  id: string
  prompt: string
  kind: 'number' | 'choice'
  answer: number
  /** for kind = choice: labels; answer is the index */
  options?: string[]
  unit?: string
  /** relative tolerance */
  tol: number
}

export interface Exercise<K extends string = string> {
  seed: number
  kind: K
  statement: string[]
  items: Item[]
  correction: Step[]
  /** the drawn values (used by the tests) */
  given?: Record<string, number>
}

/** Mulberry32 PRNG (deterministic per seed). */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const pick = <T>(rand: () => number, xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]
export const sig = (v: number, n = 2) => Number(v.toPrecision(n))

/** A choice item whose options are shuffled; `right` is the correct label. */
export function choice(rand: () => number, id: string, prompt: string, right: string, wrong: string[]): Item {
  const options = [right, ...wrong]
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[options[i], options[j]] = [options[j], options[i]]
  }
  return { id, prompt, kind: 'choice', options, answer: options.indexOf(right), tol: 0 }
}

/** Grades one answer: number within the relative tolerance (or 1e-3 absolute near 0), or the right choice. */
export function grade(item: Item, given: string | number | null): boolean | null {
  if (given === null || given === '') return null
  if (item.kind === 'choice') return Number(given) === item.answer
  const x = Number(String(given).replace(',', '.').replace('−', '-').replace(/\s/g, ''))
  if (!Number.isFinite(x)) return false
  return Math.abs(x - item.answer) <= Math.max(item.tol * Math.abs(item.answer), 1e-3)
}
