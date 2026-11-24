/**
 * Step-response characteristics with MATLAB's stepinfo definitions.
 *
 * R2021a and later (the default here):
 *   SettlingTime  first T with |y − y_final| ≤ thr·|y_final − y_init| for all t ≥ T
 *   TransientTime first T with |y − y_final| ≤ thr·max|y − y_final|   (= SettlingTime up to R2020b)
 *   RiseTime      lo → hi of (y_final − y_init)
 *   Overshoot     100·(max y − y_final)/(y_final − y_init), ≥ 0
 * Continuous data are interpolated linearly between samples; discrete data
 * use the sample instants. Same algorithm as matlab/compat/stepinfo.m, so
 * the engine reproduces the Octave references.
 */
import { cabs } from './complex'
import { dcgain, isStable, poles, stepContinuous, stepDiscrete, type TF } from './lti'

export interface StepInfo {
  RiseTime: number
  TransientTime: number
  SettlingTime: number
  SettlingMin: number
  SettlingMax: number
  Overshoot: number
  Undershoot: number
  Peak: number
  PeakTime: number
}

export interface StepInfoOptions {
  yFinal?: number
  yInit?: number
  settlingThreshold?: number
  riseLimits?: [number, number]
  discrete?: boolean
}

/** max/min by loop: spreading 400 001 samples into Math.max overflows the call stack. */
export function maxOf(v: readonly number[]): number {
  let m = -Infinity
  for (const x of v) if (x > m) m = x
  return m
}
export function minOf(v: readonly number[]): number {
  let m = Infinity
  for (const x of v) if (x < m) m = x
  return m
}

const NAN_INFO: StepInfo = {
  RiseTime: NaN,
  TransientTime: NaN,
  SettlingTime: NaN,
  SettlingMin: NaN,
  SettlingMax: NaN,
  Overshoot: NaN,
  Undershoot: NaN,
  Peak: NaN,
  PeakTime: NaN,
}

/** stepinfo(y, t, yfinal, yinit) on response data. */
export function stepinfoData(t: readonly number[], y: readonly number[], opts: StepInfoOptions = {}): StepInfo {
  const yFinal = opts.yFinal ?? y[y.length - 1]
  const yInit = opts.yInit ?? 0
  const thr = opts.settlingThreshold ?? 0.02
  const [lo, hi] = opts.riseLimits ?? [0.1, 0.9]
  const discrete = opts.discrete ?? false
  const S: StepInfo = { ...NAN_INFO }
  let ipk = 0
  for (let i = 1; i < y.length; i++) if (Math.abs(y[i]) > Math.abs(y[ipk])) ipk = i
  S.Peak = Math.abs(y[ipk])
  S.PeakTime = t[ipk]
  const span = yFinal - yInit
  if (span === 0 || !Number.isFinite(span)) return S
  const yn = y.map((v) => (v - yInit) / span)
  const tLo = crossTime(t, yn, lo, discrete)
  const tHi = crossTime(t, yn, hi, discrete)
  S.RiseTime = tHi - tLo
  const err = y.map((v) => Math.abs(v - yFinal))
  S.SettlingTime = bandTime(t, err, thr * Math.abs(span), discrete)
  S.TransientTime = bandTime(t, err, thr * maxOf(err), discrete)
  S.Overshoot = Math.max(0, 100 * (maxOf(yn) - 1))
  S.Undershoot = Math.max(0, -100 * minOf(yn))
  if (Number.isFinite(tHi)) {
    const after = y.filter((_, i) => t[i] >= tHi)
    S.SettlingMin = minOf(after)
    S.SettlingMax = maxOf(after)
  }
  return S
}

function crossTime(t: readonly number[], yn: readonly number[], level: number, discrete: boolean): number {
  const i = yn.findIndex((v) => v >= level)
  if (i < 0) return NaN
  if (i === 0 || discrete) return t[i]
  return t[i - 1] + ((level - yn[i - 1]) / (yn[i] - yn[i - 1])) * (t[i] - t[i - 1])
}

function bandTime(t: readonly number[], err: readonly number[], band: number, discrete: boolean): number {
  let k = -1
  for (let i = err.length - 1; i >= 0; i--)
    if (err[i] > band) {
      k = i
      break
    }
  if (k < 0) return t[0]
  if (k === t.length - 1) return NaN
  if (discrete) return t[k + 1]
  return t[k] + ((err[k] - band) / (err[k] - err[k + 1])) * (t[k + 1] - t[k])
}

/**
 * stepinfo(sys): simulates the step response on the same horizon and grid
 * as the Octave shim (15 time constants of the slowest pole, at least 20
 * points per time constant of the fastest one).
 */
export function stepinfo(g: TF, opts: Omit<StepInfoOptions, 'yFinal' | 'yInit' | 'discrete'> = {}): StepInfo {
  if (!isStable(g)) return { ...NAN_INFO }
  const p = poles(g)
  const yFinal = dcgain(g)
  let t: number[]
  let y: number[]
  if (g.Ts) {
    const r = p.map(cabs).filter((v) => v > 0)
    let nmax = r.length ? Math.ceil(15 / Math.max(-Math.log(Math.max(...r)), 1e-6)) : 50
    nmax = Math.min(Math.max(nmax, 50), 1e5)
    t = Array.from({ length: nmax + 1 }, (_, k) => k * g.Ts)
    y = stepDiscrete(g, nmax + 1)
  } else {
    const re = p.map((z) => Math.abs(z.re)).filter((v) => v > 0)
    const tEnd = re.length ? 15 / Math.min(...re) : 10
    const fast = Math.max(...p.map(cabs), 1)
    const n = Math.min(Math.max(Math.ceil(tEnd * fast * 20), 20001), 400001)
    t = linspace(0, tEnd, n)
    y = stepContinuous(g, t)
  }
  return stepinfoData(t, y, { ...opts, yFinal, yInit: 0, discrete: g.Ts > 0 })
}

/** linspace(a, b, n) as GNU Octave computes it: a + k·Δ, Δ = (b − a)/(n − 1), last point exactly b. */
export function linspace(a: number, b: number, n: number): number[] {
  if (n === 1) return [b]
  const delta = (b - a) / (n - 1)
  const out = Array.from({ length: n }, (_, k) => a + k * delta)
  out[n - 1] = b
  return out
}
