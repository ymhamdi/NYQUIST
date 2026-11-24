/**
 * Automatique TP4: PID control of the tank and of the DC motor.
 * Mirrors matlab/automatique/tp4_regulation_pid.m.
 */
import { dcgain, feedback, gain, pid, poles, series, stepContinuous, tf, type TF } from '../lti'
import { linspace, stepinfo, type StepInfo } from '../stepinfo'
import { motor } from './aeTp2'

export interface AeTp4Params {
  consigne: number
  kp: number
  ki: number
  kd: number
  N_filtre: number
  kp_liste: number[]
  ki_liste: number[]
  kd_liste: number[]
  L: number
  U: number
  Cr: number
  t_cr: number
  kp_m: number
  ki_m: number
  kd_m: number
  kpm_liste: number[]
  kim_liste: number[]
  kdm_liste: number[]
}

/** [overshoot %, settling time (2 %), static error] of r·F, as the script's info_* rows. */
function infoRow(F: TF, r: number): [number, number, number] {
  const S = stepinfo(gain(r, F))
  return [S.Overshoot, S.SettlingTime, r - r * dcgain(F)]
}

function sweep(G: TF, r: number, t: number[], gains: [number, number, number][]) {
  const loops = gains.map(([kp, ki, kd]) => feedback(series(pid(kp, ki, kd), G), 1))
  return {
    responses: loops.map((F) => stepContinuous(F, t, r)),
    info: loops.map((F) => infoRow(F, r)),
  }
}

const diffRow = (m: number[][]) => m[m.length - 1].map((v, j) => v - m[0][j])

/** Step of height `amp` applied at t0 (step response shifted in time). */
function shiftedStep(g: TF, t: number[], t0: number, amp: number): number[] {
  const first = t.findIndex((v) => v >= t0)
  if (first < 0) return t.map(() => 0)
  const ys = stepContinuous(g, t.slice(first).map((v) => v - t0), amp)
  return t.map((_, i) => (i < first ? 0 : ys[i - first]))
}

export function aeTp4(p: AeTp4Params) {
  const { consigne, kp, ki, kd, N_filtre } = p
  // III — tank
  const G = tf(12.5, [50, 1])
  const H_max = 20
  const H_bo_final = consigne * dcgain(G)
  const F0 = feedback(G, 1)
  const C = pid(kp, ki, kd)
  const F = feedback(series(C, G), 1)
  const F_simulink = feedback(series(pid(kp, ki, kd, 1 / N_filtre), G), 1)
  const t = linspace(0, 150, 1501)
  const t2 = linspace(0, 100, 1001)
  const swKp = sweep(G, consigne, t2, p.kp_liste.map((v) => [v, 0, 0]))
  const swKi = sweep(G, consigne, t2, p.ki_liste.map((v) => [1, v, 0]))
  const swKd = sweep(G, consigne, t2, p.kd_liste.map((v) => [1, 0.02, v]))
  const S_sans = stepinfo(gain(consigne, F0))
  const S_avec = stepinfo(gain(consigne, F))
  const S_sans_5 = stepinfo(gain(consigne, F0), { settlingThreshold: 0.05 })
  const S_avec_5 = stepinfo(gain(consigne, F), { settlingThreshold: 0.05 })
  const erreur_avec = consigne - consigne * dcgain(F)

  // IV — DC motor (Tableau 4.1, L per the toggle)
  const { L, U, Cr, t_cr, kp_m, ki_m, kd_m } = p
  const R = 0.8, J = 0.2, f = 1e-2, kem = 1.91, kc = 1.91
  const { Gm, Gcr } = motor(L, R, J, f, kem, kc)
  const Fm0 = feedback(Gm, 1)
  const Cm = pid(kp_m, ki_m, kd_m)
  const Fm = feedback(series(Cm, Gm), 1)
  const Fm_cr = series(Gcr, feedback(tf(1, 1), series(Cm, Gm)))
  const tm = linspace(0, 1, 2001)
  const w_cr = shiftedStep(Fm_cr, tm, t_cr, Cr)
  const w_step = stepContinuous(Fm, tm, U)
  const t3 = linspace(0, 0.5, 1001)
  const swKpm = sweep(Gm, U, t3, p.kpm_liste.map((v) => [v, 0, 0]))
  const swKim = sweep(Gm, U, t3, p.kim_liste.map((v) => [2, v, 0]))
  const swKdm = sweep(Gm, U, t3, p.kdm_liste.map((v) => [2, 60, v]))
  const Sm_sans = stepinfo(gain(U, Fm0))
  const Sm_avec = stepinfo(gain(U, Fm))
  const Sm_sans_5 = stepinfo(gain(U, Fm0), { settlingThreshold: 0.05 })
  const Sm_avec_5 = stepinfo(gain(U, Fm), { settlingThreshold: 0.05 })
  const erreur_m_avec = U - U * dcgain(Fm)

  return {
    'III.1': {
      G, consigne, H_max, H_bo_final,
      // no overflow when the open-loop level stays below the tank height (consigne < 1.6 m)
      t_debordement: H_bo_final > H_max ? -50 * Math.log(1 - H_max / H_bo_final) : Infinity,
      F0, kp, ki, kd, C, F, N_filtre, F_simulink, t,
      H_bo: stepContinuous(G, t, consigne),
      H_sans: stepContinuous(F0, t, consigne),
      H_avec: stepContinuous(F, t, consigne),
      H_avec_simulink: stepContinuous(F_simulink, t, consigne),
    },
    'III.2': {
      kp_liste: p.kp_liste, ki_liste: p.ki_liste, kd_liste: p.kd_liste, t2,
      rep_kp: swKp.responses, rep_ki: swKi.responses, rep_kd: swKd.responses,
      info_kp: swKp.info, info_ki: swKi.info, info_kd: swKd.info,
    },
    'III.3': { variation_kp: diffRow(swKp.info), variation_ki: diffRow(swKi.info), variation_kd: diffRow(swKd.info) },
    'III.4': {
      S_sans, S_avec,
      erreur_sans: consigne - consigne * dcgain(F0),
      erreur_avec,
      S_sans_5, S_avec_5,
      tr5_sans: S_sans_5.SettlingTime,
      tr5_avec: S_avec_5.SettlingTime,
      cahier_des_charges_respecte: S_avec.Overshoot <= 5 && Math.abs(erreur_avec) < 1e-9,
    },
    'IV.5': {
      L, R, J, f, kem, kc, U, Cr, t_cr, Gm, Gcr,
      poles_moteur: poles(Gm),
      omega_bo_final: U * dcgain(Gm),
      Fm0, kp_m, ki_m, kd_m, Cm, Fm, Fm_cr, tm,
      w_bo: stepContinuous(Gm, tm, U),
      w_sans: stepContinuous(Fm0, tm, U),
      w_cr,
      apres: tm.map((v) => v >= t_cr),
      w_avec: w_step.map((v, i) => v + w_cr[i]),
    },
    'IV.6': {
      kpm_liste: p.kpm_liste, kim_liste: p.kim_liste, kdm_liste: p.kdm_liste, t3,
      rep_kpm: swKpm.responses, rep_kim: swKim.responses, rep_kdm: swKdm.responses,
      info_kpm: swKpm.info, info_kim: swKim.info, info_kdm: swKdm.info,
    },
    'IV.7': { variation_kpm: diffRow(swKpm.info), variation_kim: diffRow(swKim.info), variation_kdm: diffRow(swKdm.info) },
    'IV.8': {
      Sm_sans, Sm_avec,
      erreur_m_sans: U - U * dcgain(Fm0),
      erreur_m_avec,
      Sm_sans_5, Sm_avec_5,
      tr5_m_sans: Sm_sans_5.SettlingTime,
      tr5_m_avec: Sm_avec_5.SettlingTime,
      cahier_des_charges_m_respecte: Sm_avec.Overshoot <= 5 && Math.abs(erreur_m_avec) < 1e-9,
    },
  }
}

export type { StepInfo }
