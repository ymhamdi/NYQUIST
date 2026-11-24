/** Complex numbers as plain objects (immutable helpers). */
export interface Complex {
  re: number
  im: number
}

export const cx = (re: number, im = 0): Complex => ({ re, im })
export const cadd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im })
export const csub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im })
export const cmul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
})
export function cdiv(a: Complex, b: Complex): Complex {
  // Smith's algorithm: avoids overflow when |b| is large
  if (Math.abs(b.re) >= Math.abs(b.im)) {
    const r = b.im / b.re
    const d = b.re + b.im * r
    return { re: (a.re + a.im * r) / d, im: (a.im - a.re * r) / d }
  }
  const r = b.re / b.im
  const d = b.re * r + b.im
  return { re: (a.re * r + a.im) / d, im: (a.im * r - a.re) / d }
}
export const cscale = (a: Complex, k: number): Complex => ({ re: a.re * k, im: a.im * k })
export const cabs = (a: Complex): number => Math.hypot(a.re, a.im)
export const carg = (a: Complex): number => Math.atan2(a.im, a.re)
export const cconj = (a: Complex): Complex => ({ re: a.re, im: -a.im })
export function cexp(a: Complex): Complex {
  const m = Math.exp(a.re)
  return { re: m * Math.cos(a.im), im: m * Math.sin(a.im) }
}
/** e^{jθ} */
export const cis = (theta: number): Complex => ({ re: Math.cos(theta), im: Math.sin(theta) })

/** Sort roots like a person reading a list: by decreasing real part, then decreasing imaginary part. */
export function sortComplex(zs: readonly Complex[]): Complex[] {
  return [...zs].sort((a, b) => b.re - a.re || b.im - a.im)
}
