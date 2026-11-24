/**
 * Real polynomials as coefficient arrays in DESCENDING powers, as in MATLAB:
 * [1, -1.3, 0.7] is z² − 1.3z + 0.7.
 */
import { cabs, cadd, cdiv, cmul, csub, cx, type Complex } from './complex'

export type Poly = number[]

/** Removes leading zeros (keeps at least one coefficient). */
export function trim(p: readonly number[]): Poly {
  let i = 0
  while (i < p.length - 1 && p[i] === 0) i++
  return p.length ? p.slice(i) : [0]
}

export const degree = (p: readonly number[]): number => trim(p).length - 1

export function padLeft(p: readonly number[], length: number): Poly {
  return [...new Array<number>(Math.max(0, length - p.length)).fill(0), ...p]
}

export function add(p: readonly number[], q: readonly number[]): Poly {
  const n = Math.max(p.length, q.length)
  const a = padLeft(p, n)
  const b = padLeft(q, n)
  return a.map((v, i) => v + b[i])
}

export const sub = (p: readonly number[], q: readonly number[]): Poly => add(p, scale(q, -1))
export const scale = (p: readonly number[], k: number): Poly => p.map((v) => v * k)

/** Product = convolution of the coefficient arrays (MATLAB conv). */
export function mul(p: readonly number[], q: readonly number[]): Poly {
  if (!p.length || !q.length) return []
  const out = new Array<number>(p.length + q.length - 1).fill(0)
  for (let i = 0; i < p.length; i++) for (let j = 0; j < q.length; j++) out[i + j] += p[i] * q[j]
  return out
}

/** Horner evaluation at a real point. */
export function evalReal(p: readonly number[], x: number): number {
  let y = 0
  for (const c of p) y = y * x + c
  return y
}

/** Horner evaluation at a complex point. */
export function evalComplex(p: readonly number[], z: Complex): Complex {
  let y = cx(0)
  for (const c of p) y = cadd(cmul(y, z), cx(c))
  return y
}

export function derivative(p: readonly number[]): Poly {
  const n = p.length - 1
  if (n < 1) return [0]
  return p.slice(0, n).map((c, i) => c * (n - i))
}

/** Monic polynomial with the given roots (MATLAB poly). Conjugate pairs give real coefficients. */
export function fromRoots(rs: readonly Complex[]): Poly {
  let re: number[] = [1]
  let im: number[] = [0]
  for (const r of rs) {
    // (re + j im)(z − r)
    const nre = new Array<number>(re.length + 1).fill(0)
    const nim = new Array<number>(re.length + 1).fill(0)
    for (let i = 0; i < re.length; i++) {
      nre[i] += re[i]
      nim[i] += im[i]
      nre[i + 1] -= re[i] * r.re - im[i] * r.im
      nim[i + 1] -= re[i] * r.im + im[i] * r.re
    }
    re = nre
    im = nim
  }
  return re
}

/**
 * Roots of a real polynomial (MATLAB roots).
 * Degree 1 and 2 in closed form (numerically stable quadratic); higher
 * degrees by Aberth–Ehrlich simultaneous iteration, then a Newton polish.
 * Roots at z = 0 (trailing zeros) are exact. Imaginary parts below
 * round-off are set to 0, and complex roots come in exact conjugate pairs.
 */
export function roots(p: readonly number[]): Complex[] {
  let q = trim(p)
  if (q.length <= 1) return []
  const out: Complex[] = []
  while (q.length > 1 && q[q.length - 1] === 0) {
    out.push(cx(0))
    q = q.slice(0, -1)
  }
  const n = q.length - 1
  if (n === 0) return out
  if (n === 1) return [...out, cx(-q[1] / q[0])]
  if (n === 2) return [...out, ...quadratic(q[0], q[1], q[2])]
  return [...out, ...cleanConjugates(aberth(q))]
}

function quadratic(a: number, b: number, c: number): Complex[] {
  const disc = b * b - 4 * a * c
  const scaleTol = 1e-12 * Math.max(b * b, Math.abs(4 * a * c))
  if (disc >= -scaleTol) {
    const s = Math.sqrt(Math.max(disc, 0))
    if (s === 0) return [cx(-b / (2 * a)), cx(-b / (2 * a))]
    const qq = -0.5 * (b + Math.sign(b || 1) * s) // avoids cancellation
    return [cx(qq / a), cx(c / qq)]
  }
  const re = -b / (2 * a)
  const im = Math.sqrt(-disc) / (2 * Math.abs(a))
  return [cx(re, im), cx(re, -im)]
}

function aberth(p: Poly): Complex[] {
  const n = p.length - 1
  const dp = derivative(p)
  // initial guesses on a circle whose radius is the geometric mean of the roots' moduli
  const r = Math.pow(Math.abs(p[n] / p[0]), 1 / n) || 1
  let z: Complex[] = Array.from({ length: n }, (_, k) => {
    const th = (2 * Math.PI * k) / n + 0.4
    return cx(r * Math.cos(th), r * Math.sin(th))
  })
  for (let iter = 0; iter < 500; iter++) {
    let maxStep = 0
    const next = z.slice()
    for (let i = 0; i < n; i++) {
      const ratio = cdiv(evalComplex(p, z[i]), evalComplex(dp, z[i]))
      let sum = cx(0)
      for (let j = 0; j < n; j++) if (j !== i) sum = cadd(sum, cdiv(cx(1), csub(z[i], z[j])))
      const w = cdiv(ratio, csub(cx(1), cmul(ratio, sum)))
      if (Number.isFinite(w.re) && Number.isFinite(w.im)) {
        next[i] = csub(z[i], w)
        maxStep = Math.max(maxStep, cabs(w) / Math.max(1, cabs(z[i])))
      }
    }
    z = next
    if (maxStep < 1e-15) break
  }
  // Newton polish on the original polynomial
  return z.map((zi) => {
    let x = zi
    for (let k = 0; k < 3; k++) {
      const d = evalComplex(dp, x)
      if (cabs(d) === 0) break
      const step = cdiv(evalComplex(p, x), d)
      if (!Number.isFinite(step.re) || !Number.isFinite(step.im)) break
      x = csub(x, step)
    }
    return x
  })
}

function cleanConjugates(zs: Complex[]): Complex[] {
  const out: Complex[] = []
  const used = new Array<boolean>(zs.length).fill(false)
  for (let i = 0; i < zs.length; i++) {
    if (used[i]) continue
    const z = zs[i]
    const tol = 1e-9 * Math.max(1, cabs(z))
    if (Math.abs(z.im) <= tol) {
      out.push(cx(z.re))
      used[i] = true
      continue
    }
    // pair with the closest conjugate
    let best = -1
    let bestD = Infinity
    for (let j = i + 1; j < zs.length; j++) {
      if (used[j]) continue
      const d = Math.hypot(zs[j].re - z.re, zs[j].im + z.im)
      if (d < bestD) {
        bestD = d
        best = j
      }
    }
    used[i] = true
    if (best >= 0) {
      used[best] = true
      const re = (z.re + zs[best].re) / 2
      const im = (Math.abs(z.im) + Math.abs(zs[best].im)) / 2
      out.push(cx(re, im), cx(re, -im))
    } else out.push(z)
  }
  return out
}
