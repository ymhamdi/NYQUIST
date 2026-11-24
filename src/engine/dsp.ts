/** Discrete Fourier transform and digital-filter tools (MATLAB fft, fftshift, freqz, conv…). */
import { cis, type Complex } from './complex'
import { filter } from './lti'

export interface Spectrum {
  re: number[]
  im: number[]
}

/** In-place iterative radix-2 FFT (length must be a power of 2). */
function fftRadix2(re: number[], im: number[], inverse: boolean): void {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]]
      ;[im[i], im[j]] = [im[j], im[i]]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len
    const wr = Math.cos(ang)
    const wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const a = i + k
        const b = a + len / 2
        const tr = re[b] * cr - im[b] * ci
        const ti = re[b] * ci + im[b] * cr
        re[b] = re[a] - tr
        im[b] = im[a] - ti
        re[a] += tr
        im[a] += ti
        const ncr = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = ncr
      }
    }
  }
}

const isPow2 = (n: number) => n > 0 && (n & (n - 1)) === 0

/**
 * DFT X[k] = Σ x[n] e^{−j2πkn/N} for any N (MATLAB fft). Powers of 2 use
 * radix-2; other lengths use Bluestein's chirp-z algorithm. `nfft` zero-pads
 * (or truncates) like fft(x, nfft).
 */
export function fft(x: readonly number[], nfft = x.length, xIm?: readonly number[]): Spectrum {
  const N = nfft
  const re = Array.from({ length: N }, (_, i) => (i < x.length ? x[i] : 0))
  const im = Array.from({ length: N }, (_, i) => (xIm && i < xIm.length ? xIm[i] : 0))
  if (N <= 1) return { re, im }
  if (isPow2(N)) {
    fftRadix2(re, im, false)
    return { re, im }
  }
  return bluestein(re, im)
}

function bluestein(re: number[], im: number[]): Spectrum {
  const N = re.length
  let M = 1
  while (M < 2 * N - 1) M <<= 1
  // chirp w[n] = e^{−jπ n²/N}; n² mod 2N keeps the angle accurate
  const wr = new Array<number>(N)
  const wi = new Array<number>(N)
  for (let n = 0; n < N; n++) {
    const ang = (-Math.PI * ((n * n) % (2 * N))) / N
    wr[n] = Math.cos(ang)
    wi[n] = Math.sin(ang)
  }
  const ar = new Array<number>(M).fill(0)
  const ai = new Array<number>(M).fill(0)
  for (let n = 0; n < N; n++) {
    ar[n] = re[n] * wr[n] - im[n] * wi[n]
    ai[n] = re[n] * wi[n] + im[n] * wr[n]
  }
  const br = new Array<number>(M).fill(0)
  const bi = new Array<number>(M).fill(0)
  br[0] = wr[0]
  bi[0] = -wi[0]
  for (let n = 1; n < N; n++) {
    br[n] = br[M - n] = wr[n]
    bi[n] = bi[M - n] = -wi[n]
  }
  fftRadix2(ar, ai, false)
  fftRadix2(br, bi, false)
  for (let k = 0; k < M; k++) {
    const r = ar[k] * br[k] - ai[k] * bi[k]
    ai[k] = ar[k] * bi[k] + ai[k] * br[k]
    ar[k] = r
  }
  fftRadix2(ar, ai, true)
  const outRe = new Array<number>(N)
  const outIm = new Array<number>(N)
  for (let k = 0; k < N; k++) {
    const r = ar[k] / M
    const i = ai[k] / M
    outRe[k] = r * wr[k] - i * wi[k]
    outIm[k] = r * wi[k] + i * wr[k]
  }
  return { re: outRe, im: outIm }
}

/** Inverse DFT (MATLAB ifft). */
export function ifft(X: Spectrum): Spectrum {
  const N = X.re.length
  const s = fft(X.re, N, X.im.map((v) => -v))
  return { re: s.re.map((v) => v / N), im: s.im.map((v) => -v / N) }
}

/** MATLAB fftshift: moves the zero-frequency bin to index floor(N/2). */
export function fftshift<T>(x: readonly T[]): T[] {
  const N = x.length
  const k = Math.ceil(N / 2)
  return [...x.slice(k), ...x.slice(0, k)]
}

/** Frequency axis matching fftshift: f = (k − floor(N/2))·Fe/N (even or odd N). */
export const shiftedAxis = (N: number, Fe: number): number[] =>
  Array.from({ length: N }, (_, k) => ((k - Math.floor(N / 2)) * Fe) / N)

export const magnitude = (X: Spectrum): number[] => X.re.map((r, i) => Math.hypot(r, X.im[i]))

/** Discrete-time Fourier transform of x on arbitrary frequencies (Hz), Σ x[n] e^{−j2πfnTe}. */
export function dtft(x: readonly number[], f: readonly number[], Fe: number): Spectrum {
  const re = new Array<number>(f.length).fill(0)
  const im = new Array<number>(f.length).fill(0)
  f.forEach((fk, k) => {
    const w = (2 * Math.PI * fk) / Fe
    let r = 0
    let i = 0
    for (let n = 0; n < x.length; n++) {
      r += x[n] * Math.cos(w * n)
      i -= x[n] * Math.sin(w * n)
    }
    re[k] = r
    im[k] = i
  })
  return { re, im }
}

export interface FreqResponse {
  /** rad/sample, 0 … π(1 − 1/n) */
  w: number[]
  /** Hz when Fe is given */
  f: number[]
  H: Complex[]
}

/** MATLAB freqz(b, a, n, Fe): n points on [0, π), b and a in powers of z⁻¹. */
export function freqz(b: readonly number[], a: readonly number[], n: number, Fe?: number): FreqResponse {
  const w = Array.from({ length: n }, (_, k) => (Math.PI * k) / n)
  const H = w.map((wk) => {
    const num = sumZinv(b, wk)
    const den = sumZinv(a, wk)
    const d = den.re * den.re + den.im * den.im
    return { re: (num.re * den.re + num.im * den.im) / d, im: (num.im * den.re - num.re * den.im) / d }
  })
  return { w, f: Fe ? w.map((wk) => (wk * Fe) / (2 * Math.PI)) : w.slice(), H }
}

function sumZinv(c: readonly number[], w: number): Complex {
  let re = 0
  let im = 0
  c.forEach((v, k) => {
    const e = cis(-w * k)
    re += v * e.re
    im += v * e.im
  })
  return { re, im }
}

/** Linear convolution (MATLAB conv). */
export function conv(a: readonly number[], b: readonly number[]): number[] {
  const out = new Array<number>(a.length + b.length - 1).fill(0)
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j]
  return out
}

/** N-point circular convolution y[m] = Σ x[n] g[(m − n) mod N]. */
export function cconv(x: readonly number[], g: readonly number[], N = Math.max(x.length, g.length)): number[] {
  const y = new Array<number>(N).fill(0)
  for (let m = 0; m < N; m++)
    for (let n = 0; n < x.length; n++) {
      const k = (((m - n) % N) + N) % N
      if (k < g.length) y[m] += x[n] * g[k]
    }
  return y
}

export { filter }
