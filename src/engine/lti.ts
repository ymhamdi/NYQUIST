/**
 * SISO linear time-invariant systems as transfer functions, with the
 * MATLAB / Control System Toolbox semantics the TP scripts rely on:
 * polynomial arithmetic without automatic cancellation (feedback(C*G, 1)
 * keeps a cancelled pole, as MATLAB and Octave do).
 */
import { cabs, cdiv, cx, type Complex } from './complex'
import { balance, charpoly, expm, matmul, type Mat, zeros as matZeros } from './linalg'
import { add, evalComplex, evalReal, mul, padLeft, roots, scale, trim, type Poly } from './poly'

export interface TF {
  num: Poly
  den: Poly
  /** sample time; 0 for a continuous-time system */
  Ts: number
}

export function tf(num: number | readonly number[], den: number | readonly number[], Ts = 0): TF {
  const n = trim(typeof num === 'number' ? [num] : [...num])
  const d = trim(typeof den === 'number' ? [den] : [...den])
  if (d.length === 1 && d[0] === 0) throw new Error('tf: zero denominator')
  return { num: n, den: d, Ts }
}

const sameTs = (a: TF, b: TF): number => {
  if (a.Ts && b.Ts && Math.abs(a.Ts - b.Ts) > 1e-12 * a.Ts) throw new Error('sample times differ')
  return a.Ts || b.Ts
}
const asTF = (x: TF | number): TF => (typeof x === 'number' ? tf(x, 1) : x)

/** Series connection a·b. */
export function series(a: TF | number, b: TF | number): TF {
  const A = asTF(a)
  const B = asTF(b)
  return tf(mul(A.num, B.num), mul(A.den, B.den), sameTs(A, B))
}

/** Parallel connection a + b. */
export function parallel(a: TF | number, b: TF | number): TF {
  const A = asTF(a)
  const B = asTF(b)
  return tf(add(mul(A.num, B.den), mul(B.num, A.den)), mul(A.den, B.den), sameTs(A, B))
}

export const gain = (k: number, g: TF): TF => tf(scale(g.num, k), g.den, g.Ts)

/** Negative feedback G/(1 + G·H) (MATLAB feedback(G, H)). */
export function feedback(g: TF | number, h: TF | number = 1): TF {
  const G = asTF(g)
  const H = asTF(h)
  return tf(mul(G.num, H.den), add(mul(G.den, H.den), mul(G.num, H.num)), sameTs(G, H))
}

/**
 * PID in parallel form kp + ki/s + kd·s/(Tf·s + 1), converted to a transfer
 * function like MATLAB's tf(pid(kp, ki, kd, Tf)): the integrator pole exists
 * only if ki ≠ 0, and the derivative filter only if kd ≠ 0 (pid(2, 0, 0) is
 * the gain 2, not 2s/s).
 */
export function pid(kp: number, ki: number, kd: number, Tf = 0): TF {
  const filtered = kd !== 0 && Tf > 0
  if (kd === 0) return ki === 0 ? tf(kp, 1) : tf([kp, ki], [1, 0])
  if (!filtered) return ki === 0 ? tf([kd, kp], 1) : tf([kd, kp, ki], [1, 0])
  // common denominator (Tf·s + 1)·s, or (Tf·s + 1) without integrator
  if (ki === 0) return tf([kp * Tf + kd, kp], [Tf, 1])
  return tf([kp * Tf + kd, kp + ki * Tf, ki], [Tf, 1, 0])
}

export const poles = (g: TF): Complex[] => roots(g.den)
export const zeros = (g: TF): Complex[] => roots(g.num)

/** Static gain: G(0) in continuous time, G(1) in discrete time (Infinity on a pole). */
export function dcgain(g: TF): number {
  const x = g.Ts ? 1 : 0
  const d = evalReal(g.den, x)
  const n = evalReal(g.num, x)
  if (d === 0) return n === 0 ? NaN : n > 0 ? Infinity : -Infinity
  return n / d
}

export function isStable(g: TF): boolean {
  const p = poles(g)
  return g.Ts ? p.every((z) => cabs(z) < 1) : p.every((z) => z.re < 0)
}

/** Frequency response value G(s) at a complex point. */
export const evalfr = (g: TF, s: Complex): Complex => cdiv(evalComplex(g.num, s), evalComplex(g.den, s))

/** Order = degree of the denominator (MATLAB order for a SISO tf). */
export const order = (g: TF): number => trim(g.den).length - 1

// ───────────────────────────── state space ──────────────────────────────

export interface SS {
  A: Mat
  B: number[]
  C: number[]
  D: number
}

/**
 * Balanced realization of a proper transfer function: the controllable
 * canonical form, then a diagonal power-of-2 similarity (see `balance`) so
 * that stiff systems (poles −22.9 and −72 700 rad/s) stay well conditioned.
 */
export function tf2ss(g: TF): SS {
  const s = companion(g)
  if (s.A.length < 2) return s
  const { A, d } = balance(s.A)
  return { A, B: s.B.map((v, i) => v / d[i]), C: s.C.map((v, i) => v * d[i]), D: s.D }
}

/** Controllable canonical realization of a proper transfer function. */
function companion(g: TF): SS {
  const den = trim(g.den)
  const n = den.length - 1
  const a0 = den[0]
  const d = den.map((v) => v / a0)
  const numT = trim(g.num)
  if (numT.length > den.length) throw new Error('tf2ss: improper transfer function')
  const b = padLeft(numT, n + 1).map((v) => v / a0)
  const D = b[0]
  const A = matZeros(n)
  for (let j = 0; j < n; j++) A[0][j] = -d[j + 1]
  for (let i = 1; i < n; i++) A[i][i - 1] = 1
  const B = new Array<number>(n).fill(0)
  if (n) B[0] = 1
  const C = Array.from({ length: n }, (_, j) => b[j + 1] - D * d[j + 1])
  return { A, B, C, D }
}

/** Transfer function of (A, B, C, D): den = det(zI − A), num = det(zI − A + BC) − det(zI − A) + D·den. */
export function ss2tf(s: SS, Ts = 0): TF {
  const n = s.A.length
  if (!n) return tf(s.D, 1, Ts)
  const den = charpoly(s.A)
  const ABC = s.A.map((row, i) => row.map((v, j) => v - s.B[i] * s.C[j]))
  const num = add(scale(den, s.D), add(charpoly(ABC), scale(den, -1)))
  return tf(num, den, Ts)
}

/** Zero-order-hold matrices Φ = e^{AT}, Γ = ∫₀ᵀ e^{Aτ}dτ B (Van Loan block exponential). */
export function zohMatrices(s: SS, T: number): { Phi: Mat; Gamma: number[] } {
  const n = s.A.length
  const M = matZeros(n + 1)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) M[i][j] = s.A[i][j] * T
    M[i][n] = s.B[i] * T
  }
  const E = expm(M)
  return { Phi: E.slice(0, n).map((r) => r.slice(0, n)), Gamma: E.slice(0, n).map((r) => r[n]) }
}

/** c2d(G, T, 'zoh'): exact discretization behind a zero-order hold. */
export function c2dZoh(g: TF, T: number): TF {
  if (g.Ts) throw new Error('c2dZoh: system is already discrete')
  const s = tf2ss(g)
  const { Phi, Gamma } = zohMatrices(s, T)
  return ss2tf({ A: Phi, B: Gamma, C: s.C, D: s.D }, T)
}

/**
 * c2d(G, T, 'impulse'): impulse-invariant discretization, H(z) = Z{g(kT)}
 * = z·C(zI − Φ)⁻¹B for a strictly proper G. GNU Octave returns exactly this;
 * `timesT` multiplies by T (the other convention, see OCTAVE_VS_MATLAB.md, V1).
 */
export function c2dImpulse(g: TF, T: number, timesT = false): TF {
  const s = tf2ss(g)
  if (s.D !== 0) throw new Error('c2dImpulse: G must be strictly proper')
  const { Phi } = zohMatrices(s, T)
  const inner = ss2tf({ A: Phi, B: s.B, C: s.C, D: 0 }, T) // C(zI − Φ)⁻¹B
  let num = [...inner.num, 0] // × z
  let den = inner.den
  // A very fast pole maps to e^{pT} = 0 (underflow): z·N(z)/(z·D(z)). Cancel
  // the exact factor z, as Octave's minimal state-space conversion does.
  const scaleDen = Math.max(...den.map(Math.abs))
  while (num.length > 1 && den.length > 1 && num[num.length - 1] === 0 && Math.abs(den[den.length - 1]) <= 1e-14 * scaleDen) {
    num = num.slice(0, -1)
    den = den.slice(0, -1)
  }
  return tf(timesT ? scale(num, T) : num, den, T)
}

// ───────────────────────────── time responses ───────────────────────────

/**
 * Step response of amplitude `amp` on a uniform grid t (t[0] = 0), exact at
 * the grid points (the system is discretized with a zero-order hold on the
 * constant input, as step(sys, t) does).
 */
export function stepContinuous(g: TF, t: readonly number[], amp = 1): number[] {
  const s = tf2ss(g)
  const n = s.A.length
  if (t.length < 2) return t.map(() => amp * s.D)
  const dt = t[1] - t[0]
  const { Phi, Gamma } = zohMatrices(s, dt)
  // two preallocated state buffers, swapped each step: stepinfo runs this on
  // up to 400 001 samples (stiff motor), so no allocation inside the loop
  const P = Float64Array.from(Phi.flat())
  const Gm = Float64Array.from(Gamma, (g) => g * amp)
  const C = Float64Array.from(s.C)
  let x = new Float64Array(n)
  let nx = new Float64Array(n)
  const y = new Array<number>(t.length)
  const d = s.D * amp
  for (let k = 0; k < t.length; k++) {
    let yk = d
    for (let i = 0; i < n; i++) yk += C[i] * x[i]
    y[k] = yk
    for (let i = 0; i < n; i++) {
      let v = Gm[i]
      for (let j = 0; j < n; j++) v += P[i * n + j] * x[j]
      nx[i] = v
    }
    const tmp = x
    x = nx
    nx = tmp
  }
  return y
}

/** Numerator aligned with the denominator for powers of z⁻¹ (H(z) proper). */
export function toZinv(g: TF): { b: number[]; a: number[] } {
  const a = trim(g.den)
  const b = trim(g.num)
  if (b.length > a.length) throw new Error('toZinv: improper (non-causal) H(z)')
  return { b: padLeft(b, a.length), a }
}

/** MATLAB filter(b, a, x): direct form II transposed, a normalized by a[0]. */
export function filter(b: readonly number[], a: readonly number[], x: readonly number[]): number[] {
  const n = Math.max(a.length, b.length)
  const A = padRight(a, n).map((v) => v / a[0])
  const B = padRight(b, n).map((v) => v / a[0])
  const z = new Array<number>(n).fill(0)
  const y = new Array<number>(x.length)
  for (let k = 0; k < x.length; k++) {
    const yk = B[0] * x[k] + z[0]
    for (let i = 1; i < n; i++) z[i - 1] = B[i] * x[k] + (i < n - 1 ? z[i] : 0) - A[i] * yk
    y[k] = yk
  }
  return y
}

const padRight = (p: readonly number[], n: number): number[] => [...p, ...new Array<number>(Math.max(0, n - p.length)).fill(0)]

/** Step response of a discrete system at samples k = 0 … n−1 (step(sys, (0:n-1)*Ts)). */
export function stepDiscrete(g: TF, n: number, amp = 1): number[] {
  const { b, a } = toZinv(g)
  return filter(b, a, new Array<number>(n).fill(amp))
}

/** Response of a discrete system to an input sequence (lsim for a discrete model). */
export function lsimDiscrete(g: TF, u: readonly number[]): number[] {
  const { b, a } = toZinv(g)
  return filter(b, a, u)
}

/** Impulse response h[0 … n−1] of b/a in powers of z⁻¹ (MATLAB impz). */
export function impz(b: readonly number[], a: readonly number[], n: number): number[] {
  const x = new Array<number>(n).fill(0)
  if (n) x[0] = 1
  return filter(b, a, x)
}

/** Discrete-time pole map: s → e^{sT}. */
export const zFromS = (p: Complex, T: number): Complex => {
  const m = Math.exp(p.re * T)
  return cx(m * Math.cos(p.im * T), m * Math.sin(p.im * T))
}

/** Exposes matmul for callers that need state propagation. */
export { matmul }
