/** The microcontroller reference: discrete PID, digital loop, saturation and anti-windup, fixed point. */
import { describe, expect, it } from 'vitest'
import { cis, cabs, cadd, cdiv, cmul, type Complex } from '../../src/engine/complex'
import { c2dZoh, feedback, filter, series, stepDiscrete, tf } from '../../src/engine/lti'
import { dfInit, dfStep, dfStepFixed, discretePid, pidInit, pidStep, poleModuli, qIntBits, quantize, simulateDigitalLoop, type PidGains } from '../../src/engine/mcu'

const GAINS: PidGains[] = [
  { kp: 1, ki: 0.02, kd: 0, N: 100, Ts: 0.5 },
  { kp: 2, ki: 60, kd: 0.02, N: 100, Ts: 1e-3 },
  { kp: 1.5, ki: 0, kd: 0.3, N: 20, Ts: 0.01 },
  { kp: 3, ki: 0, kd: 0, N: 100, Ts: 0.1 },
  { kp: 0.5, ki: 4, kd: 0.1, N: 50, Ts: 0.02 },
]
const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1
const evalZinv = (c: number[], w: number): Complex => c.reduce<Complex>((s, v, k) => cadd(s, cmul({ re: v, im: 0 }, cis(-w * k))), { re: 0, im: 0 })

describe('discrete PID', () => {
  for (const g of GAINS) {
    it(`step-by-step = its transfer function b/a (kp ${g.kp}, ki ${g.ki}, kd ${g.kd})`, () => {
      const { b, a } = discretePid(g)
      const r = rnd(7)
      const e = Array.from({ length: 300 }, r)
      const s = pidInit()
      const u = e.map((x) => pidStep(s, x, 0, g, null, false))
      const ref = filter(b, a, e)
      const scale = Math.max(...ref.map(Math.abs))
      u.forEach((v, i) => expect(Math.abs(v - ref[i])).toBeLessThan(1e-9 * scale))
    })
    it(`tends to the continuous filtered PID at low frequency (kp ${g.kp}, ki ${g.ki}, kd ${g.kd})`, () => {
      const { b, a } = discretePid(g)
      const w = 1e-4 / g.Ts // ω·Ts = 1e-4
      const Cz = cdiv(evalZinv(b, w * g.Ts), evalZinv(a, w * g.Ts))
      const jw: Complex = { re: 0, im: w }
      let Cs: Complex = { re: g.kp, im: 0 }
      if (g.ki) Cs = cadd(Cs, cdiv({ re: g.ki, im: 0 }, jw))
      if (g.kd) Cs = cadd(Cs, cdiv(cmul({ re: g.kd * g.N, im: 0 }, jw), cadd(jw, { re: g.N, im: 0 })))
      expect(cabs({ re: Cz.re - Cs.re, im: Cz.im - Cs.im }) / cabs(Cs)).toBeLessThan(1e-3)
    })
  }
})

describe('digital loop', () => {
  it('without saturation it is the discrete closed loop feedback(C(z)G(z), 1)', () => {
    const plant = tf(12.5, [50, 1])
    const g = GAINS[0]
    const run = simulateDigitalLoop(plant, g, 2, 200, null, false)
    const { b, a } = discretePid(g)
    const Cz = tf(b, a, g.Ts) // same length lists: powers of z⁻¹ = powers of z
    const ref = stepDiscrete(feedback(series(Cz, c2dZoh(plant, g.Ts)), 1), 200, 2)
    run.y.forEach((v, i) => expect(Math.abs(v - ref[i])).toBeLessThan(1e-9))
  })
  it('the command stays within the limits, and anti-windup reduces the overshoot', () => {
    const plant = tf(12.5, [50, 1])
    const g: PidGains = { kp: 1, ki: 0.05, kd: 0, N: 100, Ts: 0.5 }
    const lim = { umin: 0, umax: 0.3 }
    const sans = simulateDigitalLoop(plant, g, 2, 800, lim, false)
    const avec = simulateDigitalLoop(plant, g, 2, 800, lim, true)
    for (const run of [sans, avec]) run.u.forEach((u) => expect(u >= lim.umin - 1e-12 && u <= lim.umax + 1e-12).toBe(true))
    const peak = (y: number[]) => Math.max(...y)
    expect(peak(avec.y)).toBeLessThan(peak(sans.y))
    expect(Math.abs(avec.y.at(-1)! - 2)).toBeLessThan(1e-3)
  })
})

describe('direct form I and fixed point', () => {
  const b = [0.079, 0.158, 0.079]
  const a = [1, -1.2, 0.516]
  it('dfStep = filter', () => {
    const r = rnd(3)
    const x = Array.from({ length: 200 }, r)
    const s = dfInit(b, a)
    const y = x.map((v) => dfStep(s, b, a, v))
    const ref = filter(b, a, x)
    y.forEach((v, i) => expect(Math.abs(v - ref[i])).toBeLessThan(1e-12))
  })
  it('Q-format, quantized coefficients and poles', () => {
    expect(qIntBits(a)).toBe(1)
    expect(qIntBits([0.5, -0.25])).toBe(0)
    expect(qIntBits([2.5])).toBe(2)
    const q = quantize(a, 14)
    q.values.forEach((v, i) => expect(Math.abs(v - a[i])).toBeLessThanOrEqual(2 ** -15))
    expect(poleModuli(a)[0]).toBeCloseTo(Math.sqrt(0.516), 12)
  })
  it('the fixed-point filter follows the float filter to within the rounding', () => {
    const frac = 15 - qIntBits([...b, ...a])
    const bq = quantize(b, frac).ints
    const aq = quantize(a, frac).ints
    const r = rnd(11)
    const x = Array.from({ length: 400 }, () => Math.round(r() * 8000))
    const sq = dfInit(bq, aq)
    const yq = x.map((v) => dfStepFixed(sq, bq, aq, frac, v))
    const yf = filter(quantize(b, frac).values, quantize(a, frac).values, x)
    // rounding noise of the recursion: a few LSB amplified by the poles
    yq.forEach((v, i) => expect(Math.abs(v - yf[i])).toBeLessThan(20))
  })
})
