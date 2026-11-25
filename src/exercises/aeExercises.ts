/**
 * Mode DS (Automatique): exam-style exercises generated from a seed, in the
 * spirit of TP2 and TP3. Expected answers come from the engine's toolbox
 * functions (c2d, feedback, poles, dcgain); the corrections reuse the hand
 * derivations. A test checks both paths agree for many seeds.
 */
import { closedLoop, gainForTolerance, zohFirstOrder, type Step } from '../derive/firstOrderLoop'
import { fmt } from '../lib/format'
import { pick, rng, sig, type Exercise as BaseExercise } from './common'
import { c2dImpulse, c2dZoh, dcgain, feedback, gain, poles, tf } from '../engine/lti'

export { grade, type Item } from './common'

export type ExerciseKind = 'boucle' | 'periode' | 'discretisation'

export const KIND_LABEL: Record<ExerciseKind, string> = {
  boucle: 'Boucle échantillonnée (comme le TP3)',
  periode: "Choix de la période d'échantillonnage",
  discretisation: 'Discrétisation avec et sans bloqueur (comme le TP2)',
}

export type Exercise = BaseExercise<ExerciseKind>

const GAINS = [0.5, 1, 2, 2.5, 4, 5, 8, 10, 12.5, 20]
const TAUS = [0.2, 0.5, 1, 2, 5, 10, 20, 50]
const RATIOS = [0.02, 0.05, 0.1, 0.2, 0.5, 1]

export function makeExercise(seed: number, kind?: ExerciseKind): Exercise {
  const rand = rng(seed)
  const k = pick(rand, GAINS)
  const tau = pick(rand, TAUS)
  const T = sig(tau * pick(rand, RATIOS), 3)
  const chosen: ExerciseKind = kind ?? pick(rand, ['boucle', 'periode', 'discretisation'] as const)
  const plant = `G₁(s) = ${fmt(k, 6)}/(${tau === 1 ? '' : fmt(tau, 6)}s + 1)`

  if (chosen === 'boucle') {
    const G0 = c2dZoh(tf(k, [tau, 1]), T)
    const b = -G0.den[1] / G0.den[0]
    const Kmax = (1 + b) / (k * (1 - b))
    const K = sig(Kmax * pick(rand, [0.2, 0.5, 0.8, 1.2, 2]), 2)
    const r = pick(rand, [1, 2, 5, 10])
    const F = feedback(gain(K, G0), 1)
    const p = poles(F)[0].re
    const d = closedLoop({ k, tau, T, K, plant: 'G₁', sym: 'b' })
    return {
      seed,
      kind: chosen,
      statement: [
        `Un procédé ${plant} est commandé par un contrôleur numérique proportionnel C(z) = K = ${fmt(K, 6)}, à travers un bloqueur d'ordre zéro. La période d'échantillonnage est T = ${fmt(T, 6)} s et le retour est unitaire.`,
        `On note b = e^(−T/τ), G₀(z) la transformée en z du bloqueur suivi du procédé et G(z) la fonction de transfert en boucle fermée. La consigne est un échelon d'amplitude r = ${fmt(r, 6)}.`,
      ],
      items: [
        { id: 'b', prompt: 'Calculer b.', kind: 'number', answer: b, tol: 0.005 },
        { id: 'num', prompt: 'G₀(z) = n/(z − b) : calculer le numérateur n.', kind: 'number', answer: G0.num[G0.num.length - 1] / G0.den[0], tol: 0.01 },
        { id: 'pole', prompt: 'Calculer le pôle de G(z).', kind: 'number', answer: p, tol: 0.01 },
        { id: 'stable', prompt: 'La boucle est-elle stable ?', kind: 'choice', options: ['oui', 'non'], answer: Math.abs(p) < 1 ? 0 : 1, tol: 0 },
        { id: 'kmax', prompt: 'Calculer la valeur limite Kmax du gain.', kind: 'number', answer: Kmax, tol: 0.01 },
        {
          id: 'err',
          prompt: "Calculer l'erreur statique (en supposant la boucle stable).",
          kind: 'number',
          answer: r - r * dcgain(F),
          tol: 0.01,
        },
      ],
      correction: d.steps,
    }
  }

  if (chosen === 'periode') {
    // kK > 1 so that a limit period exists
    const K = sig((pick(rand, [1.5, 2, 4, 8, 20]) / k) * 1, 2)
    const eps = pick(rand, [0.01, 0.02, 0.05])
    const kK = k * K
    const Tlim = -tau * Math.log((kK - 1) / (kK + 1))
    const tol = gainForTolerance(k, tau, eps, T)
    const steps: Step[] = [
      {
        text: `Avec le bloqueur, G₀(z) = k(1 − b)/(z − b), b = e^(−T/τ). En boucle fermée, le pôle vaut p = b − kK(1 − b) ; la boucle reste stable tant que p > −1, c'est-à-dire b > (kK − 1)/(kK + 1) = ${fmt((kK - 1) / (kK + 1), 5)}.`,
      },
      { text: `D'où la période limite T = −τ ln((kK − 1)/(kK + 1)) = −${fmt(tau, 6)} × ln(${fmt((kK - 1) / (kK + 1), 5)}) = ${fmt(Tlim, 5)} s.` },
      ...tol.steps,
    ]
    return {
      seed,
      kind: chosen,
      statement: [
        `Un procédé ${plant} est commandé par un contrôleur numérique proportionnel de gain K = ${fmt(K, 6)}, à travers un bloqueur d'ordre zéro, avec un retour unitaire.`,
        `On veut choisir la période d'échantillonnage T. Dans la dernière question, T = ${fmt(T, 6)} s et la tolérance sur l'erreur statique est de ${fmt(eps * 100, 3)} %.`,
      ],
      items: [
        { id: 'tlim', prompt: 'Au-delà de quelle période T la boucle devient-elle instable ?', kind: 'number', unit: 's', answer: Tlim, tol: 0.01 },
        { id: 'kmin', prompt: `Quel gain minimal donne une erreur statique relative d'au plus ${fmt(eps * 100, 3)} % ?`, kind: 'number', answer: tol.Kmin, tol: 0.01 },
        { id: 'tmax', prompt: 'Avec ce gain, quelle est la période maximale qui garde la boucle stable ?', kind: 'number', unit: 's', answer: tol.Tmax, tol: 0.01 },
        { id: 'ok', prompt: `Avec T = ${fmt(T, 6)} s, ce gain est-il utilisable ?`, kind: 'choice', options: ['oui', 'non'], answer: tol.feasible ? 0 : 1, tol: 0 },
      ],
      correction: steps,
    }
  }

  // discretisation: G(s) = k/(τs + 1) with and without a zero-order hold
  const G = tf(k, [tau, 1])
  const Gz = c2dZoh(G, T)
  const Gi = c2dImpulse(G, T)
  const b = Math.exp(-T / tau)
  const z = zohFirstOrder({ k, tau, T, K: 1, plant: 'G' })
  const steps: Step[] = [
    ...z.steps,
    {
      text: `Sans bloqueur (invariance impulsionnelle), on échantillonne la réponse impulsionnelle g(t) = (k/τ)e^(−t/τ) : Z{g(kT)} = (k/τ)·z/(z − b) = ${fmt(k / tau, 5)}·z/(z − ${fmt(b, 5)}).`,
    },
    {
      text: `Gains statiques (z = 1) : avec bloqueur G₀(1) = k = ${fmt(dcgain(Gz), 5)} ; sans bloqueur (k/τ)/(1 − b) = ${fmt(dcgain(Gi), 5)}, et T fois cette valeur = ${fmt(T * dcgain(Gi), 5)}, proche de k seulement si T est petit devant τ.`,
    },
  ]
  return {
    seed,
    kind: 'discretisation',
    statement: [
      `On discrétise le système continu G(s) = ${fmt(k, 6)}/(${tau === 1 ? '' : fmt(tau, 6)}s + 1) avec la période T = ${fmt(T, 6)} s.`,
      "D'abord avec un bloqueur d'ordre zéro (c2d(G, T, 'zoh')), puis sans bloqueur, par invariance impulsionnelle : H(z) = Z{g(kT)}.",
    ],
    items: [
      { id: 'pole', prompt: 'Pôle de G(z) avec bloqueur.', kind: 'number', answer: poles(Gz)[0].re, tol: 0.005 },
      { id: 'num', prompt: 'Numérateur n de G(z) = n/(z − b) avec bloqueur.', kind: 'number', answer: Gz.num[Gz.num.length - 1] / Gz.den[0], tol: 0.01 },
      { id: 'dc', prompt: 'Gain statique de G(z) avec bloqueur.', kind: 'number', answer: dcgain(Gz), tol: 0.01 },
      { id: 'dci', prompt: 'Gain statique de H(z) = Z{g(kT)} (sans bloqueur).', kind: 'number', answer: dcgain(Gi), tol: 0.01 },
    ],
    correction: steps,
  }
}
