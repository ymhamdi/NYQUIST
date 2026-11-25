/**
 * Automatique TP1, statements quoted verbatim from the fascicule
 * (TP Automatique Echantillonnée, INSAT 2024-2025, pages 5-9), typos
 * included. Checked against the PDF on 2026-11-24 (COVERAGE.md).
 */
import { findQuestion, type Question, type TpMeta } from './types'

export const TP: TpMeta = {
  course: 'Automatique linéaire échantillonnée',
  number: 1,
  title: 'Initialisation à Matlab Simulink',
  pages: '5–9',
  verified: true,
  but: 'Au cours de cette séance de TP on va se familiariser avec Matlab simulink, voir les différents blocs de cette interface et ces caractéristiques. De plus on va créer un model en utilisant Simulink d’un système du premier ordre dans le but de voir sa réponse temporelle.',
}

/** Part II of the handout is a tutorial without questions; its steps, summarized. */
export const PART_II = {
  title: 'Matlab Simulink',
  steps: [
    'Ouvrir la bibliothèque : taper simulink dans la Command Window, ou cliquer sur « Simulink Library » (figures 1.1 et 1.2).',
    'Les blocs utiles sont dans la bibliothèque Simulink : Continuous (Transfer Fcn, PID Controller), Sources (Step, Ramp), Sinks (Scope), Math Operations (Sum) et Signal Routing (Mux) (figure 1.3).',
    'Créer un nouveau modèle, l’enregistrer en .slx, y glisser les blocs, les relier, puis lancer la simulation avec « Run » (figure 1.4).',
    'Régler un bloc par double-clic (numérateur, dénominateur, valeur finale du Step…) ; les paramètres peuvent aussi être déclarés dans un script MATLAB ou dans les Callbacks du modèle (figure 1.5).',
  ],
}

export const PART_III = {
  title: 'Réponse d’un système du premier ordre avec Simulink',
  figure: { number: '1.6', caption: 'Schémas bloc d’un système du premier ordre avec Simulink' },
  questions: [
    {
      id: 'III.1',
      number: '1',
      page: 9,
      types: ['simulink', 'main'],
      text: 'Faire le schéma bloc d’un système de fonction de transfert G(p) = 9/(s+9) en utilisant les blocs ‘Transfer Fcn’, ‘Step’,‘sum’, ‘mux’ et ‘Scope’ (voir figure 6)',
    },
    { id: 'III.2', number: '2', page: 9, types: ['simulink', 'interp'], text: 'Faire varier la valeur finale du bloc step et voir la réponse du système' },
  ] satisfies Question[] as Question[],
}

export const question = (id: string): Question => findQuestion(PART_III.questions, id)
