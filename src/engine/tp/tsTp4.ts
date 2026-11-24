/**
 * Traitement du signal TP4: analysis of digital filters.
 * Mirrors matlab/signal/tp4_filtres_numeriques.m (statement not verified).
 */
import { cabs, cis, type Complex } from '../complex'
import { freqz } from '../dsp'
import { filter, impz, tf } from '../lti'
import { solve } from '../linalg'
import { padLeft, roots } from '../poly'

export interface TsTp4Params {
  n_imp: number
  n_freq: number
  utiliser_imprime: number
}

const spectrumOf = (H: Complex[]) => ({ re: H.map((h) => h.re), im: H.map((h) => h.im) })

/**
 * Equation-error fit of b/a (powers of z⁻¹, a[0] = 1) to a frequency
 * response: least squares on B(e^{jw}) − H(w)·A(e^{jw}) = 0 (what invfreqz
 * computes without iterations). Exact when H is exactly rational of that order.
 */
export function invfreqz(H: readonly Complex[], w: readonly number[], nb: number, na: number): { b: number[]; a: number[] } {
  const nu = nb + 1 + na
  const rows: number[][] = []
  const rhs: number[] = []
  H.forEach((h, k) => {
    const re = new Array<number>(nu).fill(0)
    const im = new Array<number>(nu).fill(0)
    for (let i = 0; i <= nb; i++) {
      const e = cis(-w[k] * i)
      re[i] = e.re
      im[i] = e.im
    }
    for (let i = 1; i <= na; i++) {
      const e = cis(-w[k] * i) // −H·e^{−jwi}
      re[nb + i] = -(h.re * e.re - h.im * e.im)
      im[nb + i] = -(h.re * e.im + h.im * e.re)
    }
    rows.push(re, im)
    rhs.push(h.re, h.im)
  })
  // normal equations (nu ≤ 6 unknowns)
  const AtA = Array.from({ length: nu }, (_, i) => Array.from({ length: nu }, (_, j) => rows.reduce((s, r) => s + r[i] * r[j], 0)))
  const Atb = Array.from({ length: nu }, (_, i) => [rows.reduce((s, r, k) => s + r[i] * rhs[k], 0)])
  const x = solve(AtA, Atb).map((r) => r[0])
  return { b: x.slice(0, nb + 1), a: [1, ...x.slice(nb + 1)] }
}

export function tsTp4(p: TsTp4Params) {
  const { n_imp, n_freq, utiliser_imprime } = p
  const Te = 0.01
  const Num1 = [1, -0.3]
  const Den1 = [1, -1.3, 0.7]
  const Num2 = [1, 0, -0.3]
  const Den2 = [1, -1.3, 0.7, 1.5]
  const zeros1 = roots(Num1), poles1 = roots(Den1), zeros2 = roots(Num2), poles2 = roots(Den2)
  const b1 = padLeft(Num1, Den1.length)
  const b2 = padLeft(Num2, Den2.length)
  const h1 = impz(b1, Den1, n_imp)
  const h2 = impz(b2, Den2, n_imp)
  const delta = Array.from({ length: n_imp }, (_, k) => (k === 0 ? 1 : 0))
  const h1_division = filter(b1, Den1, delta)
  const Fe = 1 / Te
  const r1 = freqz(b1, Den1, n_freq, Fe)
  const r2 = freqz(b2, Den2, n_freq, Fe)
  const mag1 = r1.H.map(cabs)
  const iMax1 = mag1.indexOf(Math.max(...mag1))
  const est = invfreqz(r1.H, r1.w, b1.length - 1, Den1.length - 1)

  // II — low-pass IIR
  const b = [0.079, 0.158, 0.079]
  const a_imprime = [0.516, -1.2, 1]
  const a_corrige = [1, -1.2, 0.516]
  const a = utiliser_imprime ? a_imprime : a_corrige
  const L = 256
  const rr = freqz(b, a, L)
  const magR = rr.H.map(cabs)
  const gain_continu = magR[0]
  const iMax = magR.indexOf(Math.max(...magR))
  const iCut = magR.findIndex((v) => v < gain_continu / Math.SQRT2)
  const moduleSorted = (c: number[]) => roots(c).map(cabs).sort((x, y) => y - x)

  return {
    'I.1': { Te, Num1, Den1, Num2, Den2 },
    'I.2': { H1: tf(Num1, Den1, Te), H2: tf(Num2, Den2, Te) },
    'I.3': {
      zeros1, poles1, zeros2, poles2,
      module_poles1: poles1.map(cabs).sort((x, y) => y - x),
      module_poles2: poles2.map(cabs).sort((x, y) => y - x),
      stable1: poles1.every((z) => cabs(z) < 1),
      stable2: poles2.every((z) => cabs(z) < 1),
    },
    'I.4': {
      b1, b2, n_imp, h1, h2,
      n: Array.from({ length: n_imp }, (_, k) => k),
      h1_division,
      ecart_impz_filter: Math.max(...h1.map((v, i) => Math.abs(v - h1_division[i]))),
      premiers_termes_h1: h1.slice(0, 5),
    },
    'I.5': {
      n_freq, Fe,
      Hf1: spectrumOf(r1.H), f1: r1.f, Hf2: spectrumOf(r2.H), f2: r2.f,
      gain_continu_1: mag1[0], gain_max_1: mag1[iMax1], f_resonance_1: r1.f[iMax1],
    },
    'Hors-fascicule': {
      b1_estime: est.b,
      a1_estime: est.a,
      ecart_invfreqz: Math.max(...est.b.map((v, i) => Math.abs(v - b1[i])), ...est.a.map((v, i) => Math.abs(v - Den1[i]))),
    },
    'II.1': {
      b, a_imprime, a_corrige, utiliser_imprime, a,
      module_poles_imprime: moduleSorted(a_imprime),
      module_poles_corrige: moduleSorted(a_corrige),
      N: 32,
      h: impz(b, a, 32),
    },
    'II.2': {
      L,
      H: spectrumOf(rr.H),
      w: rr.w,
      gain_dB: magR.map((v) => 20 * Math.log10(v)),
      gain_continu,
      gain_max: magR[iMax],
      w_resonance: rr.w[iMax] / Math.PI,
      w_coupure: iCut >= 0 ? rr.w[iCut] / Math.PI : NaN,
    },
    'II.3': { zeros_rii: roots(b), poles_rii: roots(a), module_poles_rii: roots(a).map(cabs) },
  }
}
