/** Mode DS: expected answers (toolbox path) agree with the hand derivations, for many seeds. */
import { describe, expect, it } from 'vitest'
import { closedLoop, gainForTolerance } from '../../src/derive/firstOrderLoop'
import { grade, makeExercise, type ExerciseKind } from '../../src/exercises/aeExercises'

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b))
const num = (s: string) => Number(s.replace(/ /g, '').replace(',', '.').replace('−', '-'))

describe('Mode DS, Automatique', () => {
  const kinds: ExerciseKind[] = ['boucle', 'periode', 'discretisation']
  for (const kind of kinds) {
    it(`${kind}: 200 seeds, finite answers, deterministic, consistent with the derivation`, () => {
      for (let seed = 1; seed <= 200; seed++) {
        const ex = makeExercise(seed, kind)
        expect(makeExercise(seed, kind)).toEqual(ex)
        for (const it of ex.items) expect(Number.isFinite(it.answer), `${kind} #${seed} ${it.id}`).toBe(true)
        if (kind === 'boucle') {
          const k = num(/G₁\(s\) = ([\d, ]+)\//.exec(ex.statement[0])![1])
          const K = num(/K = ([\d, ]+),/.exec(ex.statement[0])![1])
          const T = num(/T = ([\d, ]+) s/.exec(ex.statement[0])![1])
          const tauM = /\/\(([\d, ]*)s \+ 1\)/.exec(ex.statement[0])![1]
          const tau = tauM ? num(tauM) : 1
          const d = closedLoop({ k, tau, T, K })
          const byId = Object.fromEntries(ex.items.map((i) => [i.id, i.answer]))
          expect(close(d.pole, byId.pole), `pole #${seed}`).toBe(true)
          expect(close(d.Kmax, byId.kmax), `Kmax #${seed}`).toBe(true)
          expect(byId.stable).toBe(d.stable ? 0 : 1)
        }
        if (kind === 'periode') {
          const byId = Object.fromEntries(ex.items.map((i) => [i.id, i.answer]))
          expect(byId.tlim).toBeGreaterThan(0)
          expect(byId.kmin).toBeGreaterThan(0)
        }
      }
    })
  }
  it('every kind appears when the kind is random', () => {
    const seen = new Set(Array.from({ length: 60 }, (_, s) => makeExercise(s + 1).kind))
    expect(seen.size).toBe(3)
  })
  it('grading: tolerance, comma decimals, choices, empty', () => {
    const ex = makeExercise(7, 'boucle')
    const kmax = ex.items.find((i) => i.id === 'kmax')!
    expect(grade(kmax, String(kmax.answer * 1.005).replace('.', ','))).toBe(true)
    expect(grade(kmax, kmax.answer * 1.2)).toBe(false)
    expect(grade(kmax, '')).toBe(null)
    const st = ex.items.find((i) => i.id === 'stable')!
    expect(grade(st, st.answer)).toBe(true)
  })
  it('the tolerance helper is the one the exercises use', () => {
    const t = gainForTolerance(12.5, 50, 0.02, 5)
    expect(t.feasible).toBe(false)
  })
})
