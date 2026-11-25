/** Mode DS, Traitement du signal: the toolbox-path answers (fft, roots, impz, freqz) agree with closed forms, for many seeds. */
import { describe, expect, it } from 'vitest'
import { grade, makeExercise, type ExerciseKind } from '../../src/exercises/tsExercises'

const close = (a: number, b: number, tol = 1e-9) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b))
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

describe('Mode DS, Traitement du signal', () => {
  const kinds: ExerciseKind[] = ['tfd', 'resolution', 'filtre']
  for (const kind of kinds) {
    it(`${kind}: 300 seeds, finite, deterministic, toolbox = closed form`, () => {
      for (let seed = 1; seed <= 300; seed++) {
        const ex = makeExercise(seed, kind)
        expect(makeExercise(seed, kind)).toEqual(ex)
        const by = Object.fromEntries(ex.items.map((i) => [i.id, i.answer]))
        for (const it of ex.items) expect(Number.isFinite(it.answer), `${kind} #${seed} ${it.id}`).toBe(true)
        for (const it of ex.items.filter((i) => i.kind === 'choice')) expect(it.answer).toBeGreaterThanOrEqual(0)
        const g = ex.given!
        if (kind === 'tfd') {
          expect(close(by.df, g.Fe / g.N)).toBe(true)
          expect(by.k).toBe(g.k0)
          expect(close(by.h, (g.N * g.A) / 2, 1e-9), `h #${seed}`).toBe(true)
          expect(close(by.dc, g.N * g.c, 1e-9), `dc #${seed}`).toBe(true)
          expect(Math.abs(by.phase - g.phi), `phase #${seed}`).toBeLessThan(1e-9)
          const amp = ex.items.find((i) => i.id === 'amp')!
          expect(amp.options![amp.answer]).toBe('2|X(k)|/N')
        }
        if (kind === 'resolution') {
          expect(by.N).toBe(g.N)
          const onBin = Number.isInteger((g.N * g.f1) / g.Fe)
          expect(by.onbin, `onbin #${seed}`).toBe(onBin ? 0 : 1)
          expect(close(by.tmin, 1 / gcd(g.Fe, g.f1)), `tmin #${seed}`).toBe(true)
          expect(by.L).toBeGreaterThan(g.N)
          expect(by.L / 2).toBeLessThanOrEqual(g.N)
          expect(Math.log2(by.L) % 1).toBe(0)
        }
        if (kind === 'filtre') {
          const { a1, a2, b0, b1, b2 } = g
          const h0 = b0
          const h1 = b1 - a1 * h0
          const h2 = b2 - a1 * h1 - a2 * h0
          expect(close(by.h0, h0) && close(by.h1, h1) && close(by.h2, h2), `h #${seed}`).toBe(true)
          const disc = a1 * a1 - 4 * a2
          const r = disc < 0 ? Math.sqrt(a2) : Math.max(Math.abs((-a1 + Math.sqrt(disc)) / 2), Math.abs((-a1 - Math.sqrt(disc)) / 2))
          // double roots come out of a polynomial solver to about sqrt(eps)
          expect(close(by.r, r, disc === 0 ? 1e-6 : 1e-9), `r #${seed}`).toBe(true)
          expect(by.stable).toBe(r < 1 ? 0 : 1)
          expect(close(by.H0, (b0 + b1 + b2) / (1 + a1 + a2)), `H(1) #${seed}`).toBe(true)
          expect(close(by.Hpi, (b0 - b1 + b2) / (1 - a1 + a2)), `H(-1) #${seed}`).toBe(true)
        }
      }
    })
  }
  it('every kind appears when the kind is random, and both stable and unstable filters occur', () => {
    const seen = new Set(Array.from({ length: 60 }, (_, s) => makeExercise(s + 1).kind))
    expect(seen.size).toBe(3)
    const stab = new Set(Array.from({ length: 100 }, (_, s) => makeExercise(s + 1, 'filtre').items.find((i) => i.id === 'stable')!.answer))
    expect(stab.size).toBe(2)
    const onb = new Set(Array.from({ length: 100 }, (_, s) => makeExercise(s + 1, 'resolution').items.find((i) => i.id === 'onbin')!.answer))
    expect(onb.size).toBe(2)
  })
  it('grading accepts a comma, a true minus sign, and the absolute tolerance near 0', () => {
    const ex = makeExercise(3, 'filtre')
    const h1 = ex.items.find((i) => i.id === 'h1')!
    expect(grade(h1, String(h1.answer).replace('.', ',').replace('-', '−'))).toBe(true)
    const t = makeExercise(5, 'tfd')
    const ph = t.items.find((i) => i.id === 'phase')!
    expect(grade(ph, (ph.answer + 0.0005).toFixed(4))).toBe(true)
  })
})
