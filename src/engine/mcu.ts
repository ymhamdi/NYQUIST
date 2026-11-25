/**
 * Digital controllers as they run on a microcontroller: the discrete PID
 * (backward Euler integral, derivative filtered by backward Euler),
 * saturation and anti-windup, a direct-form-I filter, and fixed-point
 * quantization of coefficients.
 *
 * These functions are the reference of the generated C code (codegen.ts):
 * the C performs the same operations in the same order, and a test compiles
 * it with gcc and compares it with this file sample by sample.
 */
import { c2dZoh, type TF } from './lti'
import { padLeft, roots } from './poly'
import { cabs } from './complex'

export interface PidGains {
  kp: number
  ki: number
  kd: number
  /** derivative filter coefficient (Simulink's N) */
  N: number
  /** sampling period (s) */
  Ts: number
}
export interface Limits {
  umin: number
  umax: number
}

/** Polynomials in ascending powers of z⁻¹. */
const addA = (p: readonly number[], q: readonly number[]) => Array.from({ length: Math.max(p.length, q.length) }, (_, i) => (p[i] ?? 0) + (q[i] ?? 0))
const mulA = (p: readonly number[], q: readonly number[]) => {
  const out = new Array<number>(p.length + q.length - 1).fill(0)
  p.forEach((x, i) => q.forEach((y, j) => (out[i + j] += x * y)))
  return out
}
const scaleA = (p: readonly number[], k: number) => p.map((x) => x * k)

/** 1/(1 + N·Ts): pole of the backward-Euler derivative filter */
export const derivPole = (g: PidGains) => 1 / (1 + g.N * g.Ts)

/**
 * Transfer function of the discrete PID, in powers of z⁻¹ (a[0] = 1):
 * C(z) = kp + ki·Ts/(1 − z⁻¹) + kd·N·c·(1 − z⁻¹)/(1 − c·z⁻¹), c = 1/(1 + N·Ts).
 * Only the existing terms are built (no integrator if ki = 0, no filter if kd = 0).
 */
export function discretePid(g: PidGains): { b: number[]; a: number[] } {
  const c = derivPole(g)
  const integ = g.ki !== 0
  const deriv = g.kd !== 0
  const I = [1, -1]
  const F = [1, -c]
  let a = [1]
  if (integ) a = mulA(a, I)
  if (deriv) a = mulA(a, F)
  let b = scaleA(a, g.kp)
  if (integ) b = addA(b, scaleA(deriv ? F : [1], g.ki * g.Ts))
  if (deriv) b = addA(b, scaleA(integ ? mulA(I, I) : I, g.kd * g.N * c))
  return { b, a }
}

export interface PidState {
  integral: number
  deriv: number
  ePrev: number
}
export const pidInit = (): PidState => ({ integral: 0, deriv: 0, ePrev: 0 })

/**
 * One sampling period of the PID: e = r − y, u = kp·e + I + D, then
 * saturation. Anti-windup by conditional integration: when the command
 * saturates and the error pushes further into the limit, the integral is
 * not updated. Mutates the state, returns the command.
 */
export function pidStep(s: PidState, r: number, y: number, g: PidGains, lim: Limits | null, antiWindup: boolean): number {
  const e = r - y
  const c = derivPole(g)
  const p = g.kp * e
  const d = c * (s.deriv + g.kd * g.N * (e - s.ePrev))
  let i = s.integral + g.ki * g.Ts * e
  let u = p + i + d
  if (lim && (u > lim.umax || u < lim.umin)) {
    const uSat = u > lim.umax ? lim.umax : lim.umin
    if (antiWindup && e > 0 === u > uSat) {
      i = s.integral
      u = p + i + d
      u = u > lim.umax ? lim.umax : u < lim.umin ? lim.umin : u
    } else u = uSat
  }
  s.integral = i
  s.deriv = d
  s.ePrev = e
  return u
}

/** Direct form I state: past inputs and outputs. */
export interface DfState {
  x: number[]
  y: number[]
}
export const dfInit = (b: readonly number[], a: readonly number[]): DfState => ({ x: new Array(b.length).fill(0), y: new Array(a.length).fill(0) })

/** One sample of y[n] = Σ b[k]x[n−k] − Σ_{k≥1} a[k]y[n−k] (a[0] = 1), optional saturation of y. */
export function dfStep(s: DfState, b: readonly number[], a: readonly number[], x: number, lim: Limits | null = null): number {
  s.x.pop()
  s.x.unshift(x)
  let acc = 0
  for (let k = 0; k < b.length; k++) acc += b[k] * s.x[k]
  for (let k = 1; k < a.length; k++) acc -= a[k] * s.y[k - 1]
  if (lim) acc = acc > lim.umax ? lim.umax : acc < lim.umin ? lim.umin : acc
  s.y.pop()
  s.y.unshift(acc)
  return acc
}

/** Divide b and a by a[0]. */
export function normalize(b: readonly number[], a: readonly number[]): { b: number[]; a: number[] } {
  return { b: b.map((v) => v / a[0]), a: a.map((v) => v / a[0]) }
}

/**
 * Integer bits m of the int16 format Qm.n (n = 15 − m) that holds every
 * coefficient: the smallest m with max|c| < 2^m.
 */
export function qIntBits(c: readonly number[]): number {
  const m = Math.max(...c.map(Math.abs))
  return m < 1 ? 0 : Math.floor(Math.log2(m)) + 1
}

/** Coefficients rounded to `frac` fractional bits: integers and the values they represent. */
export function quantize(c: readonly number[], frac: number): { ints: number[]; values: number[] } {
  const ints = c.map((v) => Math.round(v * 2 ** frac))
  return { ints, values: ints.map((q) => q / 2 ** frac) }
}

/** Pole moduli of a denominator in powers of z⁻¹ (largest first). */
export const poleModuli = (a: readonly number[]) =>
  a.length < 2
    ? []
    : roots([...a])
        .map(cabs)
        .sort((p, q) => q - p)

/**
 * Fixed-point direct form I, as the generated C does it: int16 samples,
 * int16 coefficients with `frac` fractional bits, 64-bit accumulator,
 * rounding shift and saturation to int16.
 */
export function dfStepFixed(s: DfState, bq: readonly number[], aq: readonly number[], frac: number, x: number): number {
  s.x.pop()
  s.x.unshift(x)
  let acc = 0 // exact: |products| < 2^31, a few terms
  for (let k = 0; k < bq.length; k++) acc += bq[k] * s.x[k]
  for (let k = 1; k < aq.length; k++) acc -= aq[k] * s.y[k - 1]
  let y = Math.floor((acc + 2 ** (frac - 1)) / 2 ** frac) // (acc + half) >> frac, arithmetic shift
  y = Math.max(-32768, Math.min(32767, y))
  s.y.pop()
  s.y.unshift(y)
  return y
}

export interface LoopRun {
  t: number[]
  r: number[]
  y: number[]
  u: number[]
}

/**
 * Closed loop with the digital PID and the plant seen through a zero-order
 * hold (exact at the sampling instants): y[n] from the plant's difference
 * equation, then u[n] = PID(r, y[n]).
 */
export function simulateDigitalLoop(plant: TF, g: PidGains, r: number, n: number, lim: Limits | null, antiWindup: boolean): LoopRun {
  const Gz = c2dZoh(plant, g.Ts)
  const len = Gz.den.length
  const bz = padLeft(Gz.num, len).map((v) => v / Gz.den[0])
  const az = Gz.den.map((v) => v / Gz.den[0])
  if (Math.abs(bz[0]) > 1e-12 * Math.max(...bz.map(Math.abs))) throw new Error('simulateDigitalLoop: the plant must be strictly proper')
  // uh[k − 1] = u[n − k], yh[k − 1] = y[n − k] at the start of step n
  const uh = new Array<number>(len - 1).fill(0)
  const yh = new Array<number>(len - 1).fill(0)
  const s = pidInit()
  const out: LoopRun = { t: [], r: [], y: [], u: [] }
  for (let k = 0; k < n; k++) {
    let y = 0
    for (let j = 1; j < len; j++) y += bz[j] * uh[j - 1] - az[j] * yh[j - 1] // b0 = 0: y[n] needs u up to n − 1
    const u = pidStep(s, r, y, g, lim, antiWindup)
    out.t.push(k * g.Ts)
    out.r.push(r)
    out.y.push(y)
    out.u.push(u)
    uh.pop()
    uh.unshift(u)
    yh.pop()
    yh.unshift(y)
  }
  return out
}

/** Largest value of the 1–2–2.5–5 series not above v (the project's rounding for sampling periods). */
export function roundDown125(v: number): number {
  const p = 10 ** Math.floor(Math.log10(v))
  const m = [5, 2.5, 2, 1].find((k) => k * p <= v * (1 + 1e-12)) ?? 1
  return m * p
}

/**
 * Default sampling period of a digital controller: a tenth of the closed
 * loop's dominant time constant, estimated as the 2 % settling time / 4,
 * rounded down to the 1–2–2.5–5 series.
 */
export const samplingFromSettling = (settlingTime: number) => roundDown125(settlingTime / 40)
