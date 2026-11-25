/**
 * Automatique TP2, statements quoted verbatim from the fascicule
 * (TP Automatique Echantillonnée, INSAT 2024-2025, pages 10-11), typos
 * included. Checked against the PDF on 2026-11-24 (COVERAGE.md).
 */
import { findQuestion, type Question, type TpMeta } from './types'

export const TP: TpMeta = {
  course: 'Automatique linéaire échantillonnée',
  number: 2,
  title: 'Discrétisation d’un signal à temps continu',
  pages: '10–11',
  verified: true,
  but: 'Ce TP vise à étudier la discrétisation d’un signal à temps continu par un bloqueur d’ordre zéro, on va prendre comme exemple le système Moteur à courant continu (MCC)',
}

export const PART_II = {
  title: 'Effet de la période d’échantillonnage',
  questions: [
    {
      id: 'II.1',
      number: '1',
      page: 10,
      types: ['simulink'],
      text: 'Utiliser l’interface Simulink dans Matlab pour voir l’effet d’un bloqueur d’ordre zero (le bloc Zero order Hold dans Simulink) sur la discrétisation d’un signal sinusoïdal de fréquence 1 rad/sec.',
    },
    { id: 'II.2', number: '2', page: 10, types: ['simulink', 'interp'], text: 'Varier la période d’échantillonnage pour voir son effet sur la discrétisation de ce signal.' },
  ] satisfies Question[] as Question[],
}

export const PART_III = {
  title: 'Discrétisation d’un signal à temps continu',
  intro: 'Un système continu de fonction de transfert G(s) = 9/(S+9) discrétisé par un bloqueur d’ordre zero dont l’équation de transfert est (1−e^(−sT))/S avec T est la période d’échantillonnage.',
  questions: [
    { id: 'III.1', number: '1', page: 10, types: ['matlab'], text: 'En utilisant la commande >>tf dans Matlab, créer un système continu de premier ordre' },
    { id: 'III.2', number: '2', page: 10, types: ['matlab', 'main'], text: 'Déterminer les pôles et les zéros de ce système en utilisant la commande >>rlocus.' },
    { id: 'III.3', number: '3', page: 10, types: ['simulink'], text: 'En utilsant le bloc zéro-pole dans l’interface Simulink déterminer le digramme des pôles et des zeros.' },
    { id: 'III.4', number: '4', page: 10, types: ['matlab', 'main'], text: 'En utilisant la commande >>c2d dans Matlab déterminer la transformation en Z G(Z) de la fonction G(s).' },
    { id: 'III.5', number: '5', page: 10, types: ['simulink'], text: 'Faire le schéma bloc par simulink nécessaire pour créer ce système continu.' },
    {
      id: 'III.6',
      number: '6',
      page: 10,
      types: ['matlab', 'main', 'interp'],
      text: 'Comparer la discrétisation de ce système sans la présence du bloqueur d’ordre zéro en utilisant la commande ‘imp’',
    },
  ] satisfies Question[] as Question[],
}

export const PART_IV = {
  title: 'Discrétisation d’un signal à temps continu : Moteur à Courant Continu',
  intro: [
    'Un moteur à courant continu est constitué d’un bobinage inducteur alimenté par une tension continue U réglable. Il en résulte une vitesse de rotation Ω.',
    'La transformation de Laplace de l’équation électrique trouvée : U(s) = RI(s) +Ls I(s) + kemΩ(s) ; I(s) = (U(s)−kemΩ)/(Ls+R) (1)',
    'Avec kem est la constant de la force électromotrice induite, L est l’inductance, R est la résistance et U est la tension d’alimentation',
    'La transformation de la Place pour l’équation mécanique trouvée : JsΩ(s) - kcI(s) – Cr – fΩ(s) =0 ; Ω(s) = (kcI(s)−Cr)/(Js+f) (2)',
    'Avec kc est la constante du couple électromagnétique, f est le coefficient de frottement et J est le moment d’inertie',
  ],
  questions: [
    { id: 'IV.1', number: '1', page: 11, types: ['simulink'], text: 'Créer le schéma bloc de ce système en utilisant Simulink' },
    { id: 'IV.2', number: '2', page: 11, types: ['main', 'matlab'], text: 'Déterminer la transformation en Z de ce système' },
    {
      id: 'IV.3',
      number: '3',
      page: 11,
      types: ['simulink', 'interp'],
      text: 'Ce système est attaqué par un signal discrétisé par un bloqueur d’ordre zéro, déterminer la réponse du système dans ce cas en utilisant simulink.',
    },
    { id: 'IV.4', number: '4', page: 11, types: ['simulink', 'matlab', 'interp'], text: 'Déterminer sa réponse en cas d’absence du bloqueur d’ordre zero.' },
  ] satisfies Question[] as Question[],
  /** Tableau 2.1, as printed */
  table: [
    ['L', '0.011 H'],
    ['R', '0.8 Ω'],
    ['J', '0.2 kg.m²'],
    ['f', '1.10⁻² N.m'],
    ['kem', '1.91 SI'],
    ['kc', '1.91 SI'],
    ['U', '200 V'],
  ],
}

export const question = (id: string): Question => findQuestion([...PART_II.questions, ...PART_III.questions, ...PART_IV.questions], id)
