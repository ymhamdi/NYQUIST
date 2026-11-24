/**
 * Automatique TP1: first-order system in Simulink (figure 1.6).
 * Mirrors matlab/automatique/tp1_simulink_premier_ordre.m.
 */
import { dcgain, feedback, poles, stepContinuous, tf } from '../lti'
import { linspace } from '../stepinfo'

export interface AeTp1Params {
  t_step: number
  Uf: number
  Uf_liste: number[]
}

/** Step of height `amp` applied at t_step: the step response shifted in time. */
function shiftedStep(g: ReturnType<typeof tf>, t: number[], t_step: number, amp: number): number[] {
  const first = t.findIndex((v) => v >= t_step)
  if (first < 0) return t.map(() => 0)
  const ys = stepContinuous(g, t.slice(first).map((v) => v - t_step), amp)
  return t.map((_, i) => (i < first ? 0 : ys[i - first]))
}

export function aeTp1(p: AeTp1Params) {
  const { t_step, Uf, Uf_liste } = p
  const G = tf(9, [1, 9])
  const F = feedback(G, 1)
  const t = linspace(0, 10, 2001)
  const y = shiftedStep(F, t, t_step, Uf)
  const y_bo = shiftedStep(G, t, t_step, Uf)
  const tau = -1 / poles(F)[0].re
  const reponses = Uf_liste.map((u) => shiftedStep(F, t, t_step, u))
  const y_finaux = reponses.map((r) => r[r.length - 1])
  return {
    'III.1': {
      G,
      F,
      F_main: tf(9, [1, 18]),
      gain_statique: dcgain(F),
      tau,
      gain_statique_bo: dcgain(G),
      tau_bo: -1 / poles(G)[0].re,
      t_step,
      Uf,
      t,
      u: t.map((v) => (v >= t_step ? Uf : 0)),
      y,
      y_bo,
      y_final: y[y.length - 1],
      t5: t_step + 3 * tau,
    },
    'III.2': { Uf_liste, y_finaux, rapport_sortie_entree: y_finaux.map((v, i) => v / Uf_liste[i]), reponses },
  }
}
