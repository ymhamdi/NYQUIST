/**
 * Automatique TP2: discretization behind a zero-order hold.
 * Mirrors matlab/automatique/tp2_discretisation.m.
 */
import { cexp, cscale } from '../complex'
import { add, mul } from '../poly'
import {
  c2dImpulse,
  c2dZoh,
  dcgain,
  feedback,
  gain,
  poles,
  series,
  stepContinuous,
  stepDiscrete,
  tf,
  zeros,
  type TF,
} from '../lti'
import { linspace, maxOf } from '../stepinfo'

export interface AeTp2Params {
  T_sin: number
  T_liste: number[]
  T: number
  L: number
  U: number
  Cr: number
  T_m: number
}

const maxAbsDiff = (a: readonly number[], b: readonly number[]) => maxOf(a.map((v, i) => Math.abs(v - b[i])))
const range = (n: number) => Array.from({ length: n }, (_, k) => k)

/** Motor transfer functions of figure 4.3 / equations (1)–(2): Ω/U and Ω/Cr. */
export function motor(L: number, R = 0.8, J = 0.2, f = 1e-2, kem = 1.91, kc = 1.91): { Gm: TF; Gcr: TF; Ge: TF; Gmeca: TF } {
  const Ge = tf(1, [L, R])
  const Gmeca = tf(1, [J, f])
  const Gm = feedback(gain(kc, series(Ge, Gmeca)), kem)
  const Gcr = gain(-1, feedback(Gmeca, gain(kc * kem, Ge)))
  return { Gm, Gcr, Ge, Gmeca }
}

export function aeTp2(p: AeTp2Params) {
  const { T_sin, T_liste, T, L, U, Cr, T_m } = p
  // II.1 — zero-order hold on sin(t)
  const w = 1
  const t = linspace(0, 4 * Math.PI, 4001)
  const x = t.map((v) => Math.sin(w * v))
  const k = range(Math.floor(t[t.length - 1] / T_sin) + 1)
  const tk = k.map((v) => v * T_sin)
  const xk = tk.map((v) => Math.sin(w * v))
  const held = (Ts: number) => t.map((v) => Math.sin(w * Ts * Math.floor(v / Ts)))
  const x_bloque = held(T_sin)
  // II.2 — effect of T
  const erreurs = T_liste.map((Ti) => maxAbsDiff(x, held(Ti)))

  // III — G(s) = 9/(s + 9)
  const G = tf(9, [1, 9])
  const Gzp = tf(9, [1, 9]) // Zero-Pole block: zeros [], pole −9, gain 9
  const a = Math.exp(-9 * T)
  const Gz = c2dZoh(G, T)
  const Gz_main = tf(1 - a, [1, -a], T)
  const tc = linspace(0, 1, 2001)
  const kz = range(Math.round(1 / T) + 1)
  const yz = stepDiscrete(Gz, kz.length)
  const yc_kT = kz.map((v) => 1 - Math.exp(-9 * v * T))
  // III.6 — without a hold: impulse invariance (Octave convention Z{g(kT)})
  const Gz_imp = c2dImpulse(G, T)
  const Gz_imp_main = tf([9, 0], [1, -a], T)
  const facteur_c2d = dcgain(Gz_imp) / dcgain(Gz_imp_main)
  const c2d_multiplie_par_T = Math.abs(facteur_c2d - T) < Math.abs(facteur_c2d - 1)
  const Gz_imp_T = gain(T, Gz_imp_main)
  const yi_T = stepDiscrete(Gz_imp_T, kz.length)

  // IV — DC motor (Tableau 2.1)
  const R = 0.8, J = 0.2, f = 1e-2, kem = 1.91, kc = 1.91
  const { Gm, Gcr, Ge, Gmeca } = motor(L, R, J, f, kem, kc)
  const poles_moteur = poles(Gm)
  const Gmz = c2dZoh(Gm, T_m)
  const t_m = linspace(0, 0.3, 3001)
  const km = range(Math.round(0.3 / T_m) + 1)
  const w_zoh = stepDiscrete(Gmz, km.length, U)
  const w_continu_kT = stepContinuous(Gm, km.map((v) => v * T_m), U)
  let Gmz_imp_T = c2dImpulse(Gm, T_m)
  if (!c2d_multiplie_par_T) Gmz_imp_T = gain(T_m, Gmz_imp_T)
  const w_imp = stepDiscrete(Gmz_imp_T, km.length, U)

  return {
    'II.1': { w, T_sin, t, x, k, tk, xk, x_bloque, erreur_max: maxAbsDiff(x, x_bloque), borne_erreur: w * T_sin },
    'II.2': {
      T_liste,
      erreurs,
      points_par_periode: T_liste.map((Ti) => (2 * Math.PI) / (w * Ti)),
      retard_moyen: T_liste.map((Ti) => Ti / 2),
      T_shannon: Math.PI / w,
      // engine only (figure): the held sine for each period
      bloques: T_liste.map(held),
    },
    'III.1': { G },
    'III.2': { poles_G: poles(G), zeros_G: zeros(G) },
    'III.3': { Gzp, ecart_zp_tf: Math.abs(dcgain(Gzp) - dcgain(G)) + Math.abs(poles(Gzp)[0].re - poles(G)[0].re) },
    'III.4': {
      T,
      a,
      Gz,
      Gz_main,
      ecart_c2d_main: Math.abs(dcgain(Gz) - dcgain(Gz_main)) + Math.abs(poles(Gz)[0].re - poles(Gz_main)[0].re),
      pole_z: poles(Gz),
      gain_statique_z: dcgain(Gz),
    },
    'III.5': {
      tc,
      yc: stepContinuous(G, tc),
      kz,
      yz,
      yc_kT,
      ecart_zoh_instants: maxAbsDiff(yz, yc_kT),
    },
    'III.6': {
      Gz_imp,
      Gz_imp_main,
      facteur_c2d,
      c2d_multiplie_par_T,
      Gz_imp_T,
      gain_statique_zoh: dcgain(Gz),
      gain_statique_imp_T: dcgain(Gz_imp_T),
      gain_statique_imp: dcgain(Gz_imp_main),
      yi_T,
      ecart_imp_continu: maxAbsDiff(yi_T, yc_kT),
    },
    'IV.1': {
      L, R, J, f, kem, kc, U, Cr,
      Ge,
      Gmeca,
      Gm,
      Gcr,
      den_moteur: add(mul([L, R], [J, f]), [0, 0, kc * kem]),
      poles_moteur,
      gain_statique_moteur: dcgain(Gm),
      omega_final: U * dcgain(Gm) + Cr * dcgain(Gcr),
    },
    'IV.2': {
      T_m,
      Gmz,
      poles_moteur_z: poles(Gmz),
      poles_moteur_exp: poles_moteur.map((z) => cexp(cscale(z, T_m))),
      gain_statique_moteur_z: dcgain(Gmz),
    },
    'IV.3': {
      t_m,
      w_continu: stepContinuous(Gm, t_m, U),
      km,
      w_zoh,
      w_continu_kT,
      ecart_moteur_zoh: maxAbsDiff(w_zoh, w_continu_kT),
    },
    'IV.4': {
      Gmz_imp_T,
      w_imp,
      ecart_moteur_imp: maxAbsDiff(w_imp, w_continu_kT),
      gain_statique_moteur_imp: dcgain(Gmz_imp_T),
    },
  }
}
