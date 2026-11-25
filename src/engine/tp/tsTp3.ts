/**
 * Traitement du signal TP3: discrete Fourier transform.
 * Mirrors matlab/signal/tp3_tfd.m (statement not verified against the handout).
 */
import { cdiv, carg, cabs, type Complex } from '../complex'
import { fft, fftshift, shiftedAxis, type Spectrum } from '../dsp'

export interface TsTp3Params {
  tmax: number
  inclure_tmax: number
  tmax_liste: number[]
}

const range = (n: number) => Array.from({ length: n }, (_, k) => k)

/** fftshift(fft(x, nfft)) / div */
function centred(x: readonly number[], div = 1, nfft = x.length): Spectrum {
  const X = fft(x, nfft)
  return { re: fftshift(X.re).map((v) => v / div), im: fftshift(X.im).map((v) => v / div) }
}

const mag = (X: Spectrum) => X.re.map((r, i) => Math.hypot(r, X.im[i]))
const at = (X: Spectrum, i: number): Complex => ({ re: X.re[i], im: X.im[i] })

/** First index of the maximum of v·mask (MATLAB [~, i] = max(...)), 0-based. */
function argmaxMasked(v: readonly number[], mask: (i: number) => boolean): number {
  let best = 0
  let bestV = -Infinity
  v.forEach((x, i) => {
    const y = mask(i) ? x : 0
    if (y > bestV) {
      bestV = y
      best = i
    }
  })
  return best
}

/** Smallest p with 2^p > N (strictly: errata E-TS6). */
export function exposantPuissance2(N: number): number {
  let p = 0
  while (2 ** p <= N) p++
  return p
}

export function tsTp3(p: TsTp3Params) {
  const Fe = 1000
  const Te = 1 / Fe
  const { tmax, inclure_tmax, tmax_liste } = p
  // Q1
  const N = Math.round(tmax * Fe) + inclure_tmax
  const n = range(N)
  const x1 = n.map((k) => 3 * Math.cos(2 * Math.PI * 100 * k * Te))
  // Q2–Q4
  const X1 = centred(x1)
  const f = shiftedAxis(N, Fe)
  const m1 = mag(X1)
  const i_raie = argmaxMasked(m1, () => true)
  const amplitude_raie = m1[i_raie]
  // Q5–Q6
  const x2 = x1.map((v) => 5 + v)
  const X2 = centred(x2)
  const i0 = Math.floor(N / 2)
  // Q7–Q8
  const x3 = n.map((k) => 5 + Math.cos(2 * Math.PI * 100 * k * Te - Math.PI / 3))
  const X3 = centred(x3)
  const X_ref = centred(n.map((k) => 5 + Math.cos(2 * Math.PI * 100 * k * Te)))
  let i100 = f.findIndex((v) => Math.abs(v - 100) < 1e-9)
  if (i100 < 0) i100 = argmaxMasked(f.map((v) => -Math.abs(v - 100)), () => true)
  const raie_x3 = cdiv(at(X3, i100), { re: N, im: 0 })
  const raie_ref = cdiv(at(X_ref, i100), { re: N, im: 0 })
  // Q9
  const N9 = Math.round(0.1 * Fe)
  const x4 = range(N9).map((k) => 5 + Math.cos(2 * Math.PI * 105 * k * Te))
  const X4 = centred(x4, N9)
  const f9 = shiftedAxis(N9, Fe)
  const peakAbove50 = (X: Spectrum, fx: number[]) => Math.max(...mag(X).filter((_, i) => fx[i] > 50))
  // Q10
  const spectra = tmax_liste.map((tm) => {
    const Ni = Math.round(tm * Fe)
    const Xi = centred(range(Ni).map((k) => 5 + Math.cos(2 * Math.PI * 105 * k * Te)), Ni)
    const fi = shiftedAxis(Ni, Fe)
    return { tmax: tm, N: Ni, f: fi, mag: mag(Xi), pic: peakAbove50(Xi, fi) }
  })
  const delta_f_liste = tmax_liste.map((tm) => 1 / tm)
  // Q11–Q12
  const tmax11 = 0.05
  const N11 = Math.round(tmax11 * Fe)
  const p2 = exposantPuissance2(N11)
  const L = 2 ** p2
  const x4_11 = range(N11).map((k) => 5 + Math.cos(2 * Math.PI * 105 * k * Te))
  const x5 = [...x4_11, ...new Array<number>(L - N11).fill(0)]
  const X5 = centred(x5, N11)
  const f5 = shiftedAxis(L, Fe)
  const X4_11 = centred(x4_11, N11)
  const f11 = shiftedAxis(N11, Fe)
  const Ld = 4096
  const Xd = centred(x4_11, N11, Ld)
  const fd = shiftedAxis(Ld, Fe)
  const peakFreq = (X: Spectrum, fx: number[]) => fx[argmaxMasked(mag(X), (i) => fx[i] > 50)]

  return {
    // f0: engine only (the script's 100 Hz, for the page's text)
    Q1: { Fe, Te, tmax, inclure_tmax, N, n, x1, f0: 100 },
    Q2: { X1, f, delta_f: Fe / N },
    Q3: {},
    Q4: {
      amplitude_raie,
      f_raie: Math.abs(f[i_raie]),
      amplitude_bilaterale: amplitude_raie / N,
      amplitude_cosinus: (2 * amplitude_raie) / N,
    },
    Q5: { x2, X2 },
    Q6: { i0: i0 + 1, raie_continue: Math.hypot(X2.re[i0], X2.im[i0]) / N, raie_100_x2: cabs(at(X2, i_raie)) / N },
    Q7: { x3, X3 },
    Q8: {
      tau_retard: Math.PI / 3 / (2 * Math.PI * 100),
      X_ref,
      i100: i100 + 1,
      raie_x3,
      raie_ref,
      dephasage_mesure: carg(cdiv(raie_x3, raie_ref)),
      rapport_modules: cabs(raie_x3) / cabs(raie_ref),
      rapport_x3_x2: cabs(raie_x3) / (cabs(at(X2, i100)) / N),
    },
    // f4: engine only (the script's 105 Hz, for the page's text)
    Q9: { N9, n9: range(N9), x4, X4, f9, pic_x4: peakAbove50(X4, f9), f4: 105 },
    Q10: {
      tmax_liste,
      delta_f_liste,
      sur_une_raie: delta_f_liste.map((d) => Math.abs(105 / d - Math.round(105 / d)) < 1e-9),
      pics: spectra.map((s) => s.pic),
      spectra,
    },
    Q11: { tmax11, N11, p: p2, L },
    Q12: {
      n11: range(N11),
      x4_11,
      x5,
      X5,
      f5,
      X4_11,
      f11,
      Ld,
      Xd,
      fd,
      f_pic_N: peakFreq(X4_11, f11),
      f_pic_L: peakFreq(X5, f5),
      f_pic_tftd: peakFreq(Xd, fd),
    },
  }
}
