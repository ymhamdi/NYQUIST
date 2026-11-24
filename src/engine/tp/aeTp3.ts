/**
 * Automatique TP3: stability and precision of a sampled loop.
 * Mirrors matlab/automatique/tp3_stabilite_precision.m cell by cell, with the
 * script's variable names, so every value can be checked against the Octave
 * references (reference/automatique_tp3_stabilite_precision.json).
 */
import { cabs } from '../complex'
import {
  c2dZoh,
  dcgain,
  feedback,
  gain,
  isStable,
  lsimDiscrete,
  order,
  poles,
  stepDiscrete,
  tf,
  zeros,
  type TF,
} from '../lti'
import { linspace } from '../stepinfo'

export interface AeTp3Params {
  T: number
  K: number
  e: number
  T_r: number
  K_r: number
  consigne: number
  T_liste: number[]
  eps_tol: number
}

/** |G(1) − H(1)| + |p_G − p_H| for two first-order systems (the script's hand-vs-toolbox check). */
const ecart = (a: TF, b: TF) => Math.abs(dcgain(a) - dcgain(b)) + Math.abs(poles(a)[0].re - poles(b)[0].re)

export function aeTp3(p: AeTp3Params) {
  const { T, K, e, T_r, K_r, consigne, T_liste, eps_tol } = p

  // II.3 — hand calculation
  const a = Math.exp(-T)
  const G0_main = tf(1 - a, [1, -a], T)
  const G_bf_main = tf(K * (1 - a), [1, -a + K * (1 - a)], T)

  // II.4 — tf, c2d, feedback
  const G1 = tf(1, [1, 1])
  const G0 = c2dZoh(G1, T)
  const G_bf = feedback(gain(K, G0), 1)

  // II.5 — order, poles, zeros
  const poles_bf = poles(G_bf)
  const pole_main = a - K * (1 - a)

  // II.6 — the loop as Simulink shows it (continuous output between samples)
  const duree = 5
  const N = Math.round(duree / T)
  const kk = Array.from({ length: N + 1 }, (_, k) => k)
  const s_k = stepDiscrete(G_bf, N + 1, e)
  const u_k = s_k.map((s) => K * (e - s))
  const t_fin = Array.from({ length: 20 * N + 1 }, (_, j) => j * (T / 20))
  const u_maintenue = t_fin.map((t) => u_k[Math.min(Math.floor(t / T + 1e-9), N)])
  const G1_fin = c2dZoh(G1, T / 20)
  const s_continue = lsimDiscrete(G1_fin, u_maintenue)
  const ecart_instants = Math.max(...s_k.map((s, k) => Math.abs(s_continue[20 * k] - s)))

  // II.7 — limit gain
  const Kmax = (1 + a) / (1 - a)
  const K_essais = [1, 0.5 * Kmax, 0.9 * Kmax, 1.1 * Kmax]
  const poles_essais = K_essais.map((k) => a - k * (1 - a))
  const T_grille = linspace(0.01, 3, 300)
  const Kmax_T = T_grille.map((t) => (1 + Math.exp(-t)) / (1 - Math.exp(-t)))
  const reponses_essais = K_essais.map((k) => stepDiscrete(feedback(gain(k, G0), 1), 41))

  // III.1 — tank, hand calculation
  const b = Math.exp(-T_r / 50)
  const G0r_main = tf(12.5 * (1 - b), [1, -b], T_r)
  const G_bf_r_main = tf(12.5 * K_r * (1 - b), [1, -b + 12.5 * K_r * (1 - b)], T_r)

  // III.2 — tf, c2d, feedback
  const G1r = tf(12.5, [50, 1])
  const G0r = c2dZoh(G1r, T_r)
  const G_bf_r = feedback(gain(K_r, G0r), 1)

  // III.3 — several sampling periods
  const kmaxTank = (t: number) => (1 + Math.exp(-t / 50)) / (12.5 * (1 - Math.exp(-t / 50)))
  const Kmax_liste = T_liste.map(kmaxTank)
  const stable_liste = Kmax_liste.map((km) => K_r < km)
  const T_limite = 12.5 * K_r > 1 ? -50 * Math.log((12.5 * K_r - 1) / (12.5 * K_r + 1)) : Infinity
  const duree_r = 300
  const hauteurs = T_liste.map((Ti, i) => {
    const Fi = feedback(gain(K_r, c2dZoh(G1r, Ti)), 1)
    let n = Math.floor(duree_r / Ti) + 1
    if (!stable_liste[i]) n = Math.min(n, 5)
    return { T: Ti, t: Array.from({ length: n }, (_, k) => k * Ti), H: stepDiscrete(Fi, n, consigne) }
  })

  // III.4 — K for a height within eps_tol of the setpoint
  const K_min = (1 - eps_tol) / (12.5 * eps_tol)
  const Kmax_r = kmaxTank(T_r)

  // III.6 — static error
  const erreur_statique = consigne - consigne * dcgain(G_bf_r)

  return {
    'II.3': { T, K, a, G0_main, G_bf_main },
    'II.4': { G1, G0, G_bf, ecart_bo: ecart(G0, G0_main), ecart_bf: ecart(G_bf, G_bf_main) },
    'II.5': { ordre: order(G_bf), poles_bf, zeros_bf: zeros(G_bf), pole_main, stable: poles_bf.map((z) => cabs(z) < 1) },
    'II.6': {
      e,
      duree,
      N,
      kk,
      s_k,
      u_k,
      t_fin,
      u_maintenue,
      G1_fin,
      s_continue,
      ecart_instants,
      s_final: e * dcgain(G_bf),
    },
    'II.7': {
      Kmax,
      pole_a_Kmax: poles(feedback(gain(Kmax, G0), 1)),
      K_essais,
      poles_essais,
      stables_essais: poles_essais.map((z) => Math.abs(z) < 1),
      T_grille,
      Kmax_T,
      reponses_essais,
    },
    'III.1': { T_r, K_r, b, G0r_main, G_bf_r_main },
    'III.2': { G1r, G0r, G_bf_r, ecart_r: ecart(G_bf_r, G_bf_r_main) },
    'III.3': { consigne, T_liste, Kmax_liste, stable_liste, T_limite, duree_r, hauteurs },
    'III.4': {
      eps_tol,
      K_min,
      Kmax_r,
      realisable: K_min < Kmax_r,
      T_max_tolerance: -50 * Math.log((12.5 * K_min - 1) / (12.5 * K_min + 1)),
      erreur_min_atteignable: 1 / (1 + 12.5 * Kmax_r),
      H_final_Kmin: (consigne * 12.5 * K_min) / (1 + 12.5 * K_min),
    },
    'III.5': {
      poles_r: poles(G_bf_r),
      zeros_r: zeros(G_bf_r),
      pole_r_main: b - 12.5 * K_r * (1 - b),
      stable_r: poles(G_bf_r).map((z) => cabs(z) < 1),
      stable_bf_r: isStable(G_bf_r),
    },
    'III.6': {
      erreur_statique,
      erreur_statique_main: consigne / (1 + 12.5 * K_r),
      H_final: consigne * dcgain(G_bf_r),
    },
  }
}

export type AeTp3Result = ReturnType<typeof aeTp3>
