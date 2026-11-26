/** Small dense real matrices (row-major arrays). Sizes here are ≤ 4. */
export type Mat = number[][]

export const zeros = (r: number, c = r): Mat => Array.from({ length: r }, () => new Array<number>(c).fill(0))
export function eye(n: number): Mat {
  const m = zeros(n)
  for (let i = 0; i < n; i++) m[i][i] = 1
  return m
}

export function matmul(a: Mat, b: Mat): Mat {
  const n = a.length
  const m = b[0]?.length ?? 0
  const k = b.length
  const out = zeros(n, m)
  for (let i = 0; i < n; i++)
    for (let p = 0; p < k; p++) {
      const aip = a[i][p]
      if (aip === 0) continue
      for (let j = 0; j < m; j++) out[i][j] += aip * b[p][j]
    }
  return out
}

export const matadd = (a: Mat, b: Mat): Mat => a.map((row, i) => row.map((v, j) => v + b[i][j]))
export const matsub = (a: Mat, b: Mat): Mat => a.map((row, i) => row.map((v, j) => v - b[i][j]))
export const matscale = (a: Mat, k: number): Mat => a.map((row) => row.map((v) => v * k))
export const matvec = (a: Mat, x: readonly number[]): number[] => a.map((row) => row.reduce((s, v, j) => s + v * x[j], 0))

/** Induced 1-norm (max column sum). */
export function norm1(a: Mat): number {
  let best = 0
  for (let j = 0; j < (a[0]?.length ?? 0); j++) {
    let s = 0
    for (let i = 0; i < a.length; i++) s += Math.abs(a[i][j])
    best = Math.max(best, s)
  }
  return best
}

/** Solves A X = B by LU factorization with partial pivoting. */
export function solve(a: Mat, b: Mat): Mat {
  const n = a.length
  const m = b[0].length
  const A = a.map((r) => r.slice())
  const B = b.map((r) => r.slice())
  for (let k = 0; k < n; k++) {
    let piv = k
    for (let i = k + 1; i < n; i++) if (Math.abs(A[i][k]) > Math.abs(A[piv][k])) piv = i
    if (A[piv][k] === 0) throw new Error('solve: singular matrix')
    if (piv !== k) {
      ;[A[k], A[piv]] = [A[piv], A[k]]
      ;[B[k], B[piv]] = [B[piv], B[k]]
    }
    for (let i = k + 1; i < n; i++) {
      const f = A[i][k] / A[k][k]
      if (f === 0) continue
      for (let j = k; j < n; j++) A[i][j] -= f * A[k][j]
      for (let j = 0; j < m; j++) B[i][j] -= f * B[k][j]
    }
  }
  const X = zeros(n, m)
  for (let i = n - 1; i >= 0; i--)
    for (let j = 0; j < m; j++) {
      let s = B[i][j]
      for (let p = i + 1; p < n; p++) s -= A[i][p] * X[p][j]
      X[i][j] = s / A[i][i]
    }
  return X
}

/**
 * Matrix exponential: Padé (6, 6) approximant with scaling and squaring
 * (Moler & Van Loan). The matrix is scaled until its 1-norm is ≤ 1/2, where
 * the Padé error is below double precision, then squared back.
 */
export function expm(a: Mat): Mat {
  const n = a.length
  const nrm = norm1(a)
  const s = nrm > 0.5 ? Math.ceil(Math.log2(nrm / 0.5)) : 0
  const A = matscale(a, 2 ** -s)
  const c = [1, 1 / 2, 5 / 44, 1 / 66, 1 / 792, 1 / 15840, 1 / 665280]
  // numerator P(A) = Σ c_k A^k and denominator Q(A) = Σ (−1)^k c_k A^k
  let power = eye(n)
  let num = eye(n)
  let den = eye(n)
  for (let k = 1; k <= 6; k++) {
    power = matmul(A, power)
    num = matadd(num, matscale(power, c[k]))
    den = matadd(den, matscale(power, (k % 2 ? -1 : 1) * c[k]))
  }
  let E = solve(den, num)
  for (let k = 0; k < s; k++) E = matmul(E, E)
  return E
}

/**
 * Balancing (Parlett–Reinsch, as LAPACK gebal): a diagonal similarity
 * D⁻¹AD with powers of 2 (exact in floating point) that evens out row and
 * column norms. Companion matrices of stiff systems have entries spanning
 * ten orders of magnitude; balancing them first keeps expm accurate.
 * Returns the balanced matrix and the scaling d (A_bal[i][j] = A[i][j]·d[j]/d[i]).
 */
export function balance(a: Mat): { A: Mat; d: number[] } {
  const n = a.length
  const A = a.map((r) => r.slice())
  const d = new Array<number>(n).fill(1)
  for (let pass = 0; pass < 100; pass++) {
    let converged = true
    for (let i = 0; i < n; i++) {
      let c = 0
      let r = 0
      for (let j = 0; j < n; j++)
        if (j !== i) {
          c += Math.abs(A[j][i])
          r += Math.abs(A[i][j])
        }
      if (c === 0 || r === 0) continue
      const s = c + r
      let f = 1
      while (c < r / 2) {
        f *= 2
        c *= 4
      }
      while (c > r * 2) {
        f /= 2
        c /= 4
      }
      if ((c + r) / f < 0.95 * s) {
        converged = false
        d[i] *= f
        for (let j = 0; j < n; j++) {
          A[i][j] /= f
          A[j][i] *= f
        }
      }
    }
    if (converged) break
  }
  return { A, d }
}

/** Characteristic polynomial det(zI − A), descending powers (Faddeev–LeVerrier). */
export function charpoly(a: Mat): number[] {
  const n = a.length
  const c = new Array<number>(n + 1).fill(0)
  c[0] = 1
  let M = zeros(n)
  for (let k = 1; k <= n; k++) {
    M = matadd(matmul(a, M), matscale(eye(n), c[k - 1]))
    const AM = matmul(a, M)
    let tr = 0
    for (let i = 0; i < n; i++) tr += AM[i][i]
    c[k] = -tr / k
  }
  return c
}
