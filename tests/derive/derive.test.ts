/** The hand derivations compute their own numbers: they must agree with Octave. */
import { describe, expect, it } from 'vitest'
import { closedLoop, gainForTolerance } from '../../src/derive/firstOrderLoop'
import { fmt, fixed } from '../../src/lib/format'
import { compareValue, loadReference } from '../helpers/reference'

const ref = loadReference('automatique_tp3_stabilite_precision')

describe('first-order loop derivation vs Octave (AE TP3 defaults)', () => {
  it('part II: pole and Kmax', () => {
    const d = closedLoop({ k: 1, tau: 1, T: 0.1, K: 1 })
    compareValue(d.pole, ref['II.5'].pole_main, 'pole')
    compareValue(d.Kmax, ref['II.7'].Kmax, 'Kmax')
    expect(d.stable).toBe(true)
    expect(d.steps.length).toBeGreaterThanOrEqual(8)
    for (const s of d.steps) if (s.math) expect(s.math).toMatch(/^<math display="block">.*<\/math>$/s)
  })
  it('part III (tank): pole, Kmax, tolerance', () => {
    const d = closedLoop({ k: 12.5, tau: 50, T: 5, K: 1 })
    compareValue(d.pole, ref['III.5'].pole_r_main, 'pole')
    compareValue(d.Kmax, ref['III.4'].Kmax_r, 'Kmax')
    const t = gainForTolerance(12.5, 50, 0.02, 5)
    compareValue(t.Kmin, ref['III.4'].K_min, 'K_min')
    compareValue(t.Tmax, ref['III.4'].T_max_tolerance, 'T_max')
    expect(t.feasible).toBe(ref['III.4'].realisable)
  })
})

describe('French number formatting', () => {
  it('decimal comma, true minus, thousands in the integer part only', () => {
    expect(fmt(0.9048374180359595)).toBe('0,9048')
    expect(fmt(20.016663889)).toBe('20,02')
    expect(fmt(-72704.465, 6)).toBe('−72 704,5')
    expect(fmt(0.904837418, 6)).toBe('0,904837')
    expect(fmt(1e-5)).toBe('1·10⁻⁵')
    expect(fmt(Infinity)).toBe('∞')
    expect(fixed(-0.0001, 2)).toBe('0,00')
  })
})
