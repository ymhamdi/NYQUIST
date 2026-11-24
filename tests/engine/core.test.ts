/**
 * Engine building blocks against closed forms (independent of Octave, so a
 * mistake shared by both cannot hide).
 */
import { describe, expect, it } from 'vitest'
import { cabs, sortComplex } from '../../src/engine/complex'
import { cconv, conv, dtft, fft, fftshift, freqz, ifft, shiftedAxis } from '../../src/engine/dsp'
import { charpoly, expm } from '../../src/engine/linalg'
import {
  c2dImpulse,
  c2dZoh,
  dcgain,
  feedback,
  filter,
  impz,
  isStable,
  pid,
  poles,
  series,
  ss2tf,
  stepContinuous,
  stepDiscrete,
  tf,
  tf2ss,
} from '../../src/engine/lti'
import { formatMatlab, parseParams, splitCells, substitute } from '../../src/engine/matlabScript'
import { fromRoots, roots } from '../../src/engine/poly'
import { linspace, stepinfo } from '../../src/engine/stepinfo'

const near = (a: number, b: number, tol = 1e-12) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol * Math.max(1, Math.abs(b)))

describe('polynomials', () => {
  it('roots of z² − 1.3z + 0.7: 0.65 ± j√(0.7 − 0.4225)', () => {
    const r = sortComplex(roots([1, -1.3, 0.7]))
    near(r[0].re, 0.65)
    near(r[0].im, Math.sqrt(0.7 - 0.65 ** 2))
    near(r[1].im, -Math.sqrt(0.7 - 0.65 ** 2))
  })
  it('roots of a cubic with a real root and a conjugate pair are exact conjugates', () => {
    const want = [{ re: -0.5, im: 0 }, { re: 0.3, im: 0.8 }, { re: 0.3, im: -0.8 }]
    const got = sortComplex(roots(fromRoots(want)))
    expect(got[0].im).toBe(-got[1].im)
    sortComplex(want).forEach((w, i) => {
      near(got[i].re, w.re, 1e-12)
      near(got[i].im, w.im, 1e-12)
    })
  })
  it('roots at the origin are exact, double root of (z + 1)² is real', () => {
    expect(roots([1, 0, 0]).map((z) => z.re)).toEqual([0, 0])
    const d = roots([0.079, 0.158, 0.079])
    d.forEach((z) => {
      expect(z.im).toBe(0)
      near(z.re, -1, 1e-7)
    })
  })
})

describe('linear algebra', () => {
  it('expm of a rotation generator is a rotation', () => {
    const th = 2.3
    const E = expm([[0, -th], [th, 0]])
    near(E[0][0], Math.cos(th))
    near(E[1][0], Math.sin(th))
  })
  it('expm of a stiff diagonal matrix', () => {
    const E = expm([[-72704 * 1e-3, 0], [0, -22.858 * 1e-3]])
    near(E[0][0], Math.exp(-72.704), 1e-10)
    near(E[1][1], Math.exp(-0.022858))
  })
  it('characteristic polynomial of a companion matrix', () => {
    expect(charpoly([[1.3, -0.7], [1, 0]]).map((v) => +v.toFixed(12))).toEqual([1, -1.3, 0.7])
  })
})

describe('transfer functions', () => {
  it('tf → ss → tf round trip (biproper)', () => {
    const g = tf([2, 3, 4], [1, 5, 6])
    const back = ss2tf(tf2ss(g))
    back.num.forEach((v, i) => near(v, g.num[i]))
    back.den.forEach((v, i) => near(v, g.den[i]))
  })
  it('c2d zoh of k/(τs + 1) is k(1 − b)/(z − b), b = e^{−T/τ}', () => {
    const g = c2dZoh(tf(12.5, [50, 1]), 5)
    const b = Math.exp(-0.1)
    near(g.num[g.num.length - 1], 12.5 * (1 - b))
    near(-g.den[1] / g.den[0], b)
  })
  it('c2d impulse of 9/(s + 9) is 9z/(z − e^{−9T}) (× T on request)', () => {
    const T = 0.01
    const a = Math.exp(-9 * T)
    const g = c2dImpulse(tf(9, [1, 9]), T)
    near(g.num[0] / g.den[0], 9)
    near(-g.den[1] / g.den[0], a)
    near(dcgain(c2dImpulse(tf(9, [1, 9]), T, true)), (9 * T) / (1 - a))
  })
  it('feedback keeps a cancelled pole (no automatic cancellation), like MATLAB', () => {
    const F = feedback(series(pid(1, 0.02, 0), tf(12.5, [50, 1])), 1)
    expect(F.den.length).toBe(3)
    expect(sortComplex(poles(F)).map((z) => +z.re.toFixed(10))).toEqual([-0.02, -0.25])
  })
  it('pid builds only the terms that exist', () => {
    expect(pid(2, 0, 0)).toEqual(tf(2, 1))
    expect(pid(1, 0.02, 0).den).toEqual([1, 0])
    expect(pid(1, 0.02, 0, 0.01)).toEqual(pid(1, 0.02, 0)) // no derivative, no filter
    expect(pid(2, 0.1, 1, 0.01).num).toEqual([1.02, 2.001, 0.1])
  })
  it('stability: continuous left half-plane, discrete unit disc', () => {
    expect(isStable(tf(1, [1, 1]))).toBe(true)
    expect(isStable(tf(1, [1, -1]))).toBe(false)
    expect(isStable(tf(1, [1, 0.99], 1))).toBe(true)
    expect(isStable(tf(1, [1, 1.01], 1))).toBe(false)
  })
})

describe('time responses', () => {
  it('continuous step of 1/(τs + 1) is exact at the grid points', () => {
    const t = linspace(0, 5, 501)
    const y = stepContinuous(tf(1, [2, 1]), t, 3)
    t.forEach((tk, k) => near(y[k], 3 * (1 - Math.exp(-tk / 2)), 1e-12))
  })
  it('discrete step equals the continuous one at kT behind a zero-order hold', () => {
    const G = tf(1.91, [0.0022, 0.16011, 3.6561])
    const T = 0.0025
    const yd = stepDiscrete(c2dZoh(G, T), 81)
    const yc = stepContinuous(G, linspace(0, 80 * T, 81))
    yd.forEach((v, k) => near(v, yc[k], 1e-10))
  })
  it('filter and impz: h1 = 0, 1, 1, 0.6, 0.08 (long division)', () => {
    const h = impz([0, 1, -0.3], [1, -1.3, 0.7], 5)
    ;[0, 1, 1, 0.6, 0.08].forEach((v, k) => near(h[k], v, 1e-14))
    expect(filter([1], [1, -0.5], [1, 0, 0])).toEqual([1, 0.5, 0.25])
  })
})

describe('stepinfo (MATLAB R2021a+ definitions)', () => {
  it('first order: Ts = τ ln 50, Tr = τ ln 9, no overshoot', () => {
    const S = stepinfo(tf(1, [3.7, 1]))
    near(S.SettlingTime, 3.7 * Math.log(50), 1e-6)
    near(S.RiseTime, 3.7 * Math.log(9), 1e-6)
    expect(S.Overshoot).toBe(0)
  })
  it('second order ζ = 0.5: overshoot 100·e^{−πζ/√(1−ζ²)}', () => {
    near(stepinfo(tf(1, [1, 1, 1])).Overshoot, 100 * Math.exp(-Math.PI * 0.5 / Math.sqrt(0.75)), 1e-6)
  })
  it('unstable system: NaN', () => {
    expect(stepinfo(tf(1, [1, -1])).SettlingTime).toBeNaN()
  })
})

describe('DFT', () => {
  const naive = (x: number[]) =>
    x.map((_, k) => {
      let re = 0
      let im = 0
      x.forEach((v, n) => {
        re += v * Math.cos((2 * Math.PI * k * n) / x.length)
        im -= v * Math.sin((2 * Math.PI * k * n) / x.length)
      })
      return { re, im }
    })
  for (const N of [8, 50, 64, 100, 101]) {
    it(`fft matches the DFT definition for N = ${N} (radix-2 or Bluestein)`, () => {
      const x = Array.from({ length: N }, (_, n) => Math.sin(0.37 * n) + 0.2 * n - 5 * Math.cos(1.1 * n))
      const X = fft(x)
      naive(x).forEach((v, k) => {
        expect(Math.abs(X.re[k] - v.re)).toBeLessThan(1e-9)
        expect(Math.abs(X.im[k] - v.im)).toBeLessThan(1e-9)
      })
      const back = ifft(X)
      back.re.forEach((v, n) => expect(Math.abs(v - x[n])).toBeLessThan(1e-10))
    })
  }
  it('3cos(2π·100t) at 1 kHz on 100 samples: lines of 150 at ±100 Hz', () => {
    const x = Array.from({ length: 100 }, (_, n) => 3 * Math.cos((2 * Math.PI * 100 * n) / 1000))
    const X = fft(x)
    const m = fftshift(X.re.map((r, i) => Math.hypot(r, X.im[i])))
    const f = shiftedAxis(100, 1000)
    near(m[f.indexOf(100)], 150, 1e-12)
    near(m[f.indexOf(-100)], 150, 1e-12)
  })
  it('fftshift and its axis for odd N', () => {
    expect(fftshift([0, 1, 2, 3, 4])).toEqual([3, 4, 0, 1, 2])
    expect(shiftedAxis(5, 5)).toEqual([-2, -1, 0, 1, 2])
  })
  it('zero-padded fft samples the DTFT', () => {
    const x = [1, 2, 3]
    const X = fft(x, 8)
    const D = dtft(x, [0, 1, 2, 3, 4, 5, 6, 7].map((k) => k / 8), 1)
    X.re.forEach((v, k) => near(v, D.re[k], 1e-12))
  })
  it('freqz: DC gain of the corrected IIR filter is 1', () => {
    near(cabs(freqz([0.079, 0.158, 0.079], [1, -1.2, 0.516], 256).H[0]), 1, 1e-12)
  })
  it('linear and circular convolution', () => {
    expect(conv([1, 1], [1, 2, 3])).toEqual([1, 3, 5, 3])
    expect(cconv([1, 1, 1], [1, 2, 3])).toEqual([6, 6, 6])
  })
})

describe('MATLAB script parameters', () => {
  const src = [
    '%% II.3 Calcul',
    'T = 0.1;                        % @param T [s] 0.01..3 période (non donnée)',
    'L = 0.011;    % @param L [H] {0.011, 0.000011} inductance',
    'Tl = [1 5 10];  % @param Tl [s] périodes',
    'x = T*2;',
    '%% II.4 Suite',
    'y = 3;',
    '',
    'function z = f(a)',
    'z = a;',
    'end',
  ].join('\n')
  it('parses value, unit, range, choices and lists', () => {
    const p = parseParams(src)
    expect(p.map((q) => q.name)).toEqual(['T', 'L', 'Tl'])
    expect(p[0]).toMatchObject({ value: 0.1, unit: 's', range: { min: 0.01, max: 3 }, description: 'période (non donnée)' })
    expect(p[1].choices).toEqual([0.011, 0.000011])
    expect(p[2].value).toEqual([1, 5, 10])
  })
  it('substitutes values and keeps the comment', () => {
    const out = substitute(src, { T: 0.25, Tl: [2, 4] })
    expect(out).toContain('T = 0.25;')
    expect(out).toContain('% @param T [s] 0.01..3 période (non donnée)')
    expect(out).toContain('Tl = [2 4];')
    expect(parseParams(out)[0].value).toBe(0.25)
  })
  it('formats numbers so MATLAB reads back the same double', () => {
    expect(formatMatlab(0.1 + 0.2)).toBe('0.30000000000000004')
    expect(formatMatlab(1e-5)).toBe('0.00001')
    expect(Number(formatMatlab(Math.PI))).toBe(Math.PI)
  })
  it('splits cells and leaves local functions out', () => {
    const c = splitCells(src)
    expect(c.map((x) => x.id)).toEqual(['II.3', 'II.4'])
    expect(c[1].end).toBe(6)
  })
})
