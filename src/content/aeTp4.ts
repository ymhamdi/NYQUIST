/**
 * Automatique TP4, statements quoted verbatim from the fascicule
 * (TP Automatique Echantillonnée, INSAT 2024-2025, pages 16-18), typos
 * included. Checked against the PDF on 2026-11-24 (COVERAGE.md).
 */
import { findQuestion, type Question, type TpMeta } from './types'

export const TP: TpMeta = {
  course: 'Automatique linéaire échantillonnée',
  number: 4,
  title: 'Asservissement des systèmes continus',
  pages: '16–18',
  verified: true,
  but: 'Dans ce TP on va étudier la régulation des systèmes asservis par un régulateur PID.',
}

export const RAPPEL = [
  'La régulation des systèmes regroupe l’ensemble des moyens matériels et techniques mis en œuvre pour maintenir une grandeur physique à régler, égale à une valeur désirée, appelée consigne.',
  'Un régulateur PID est un organe de contrôle qui permet d’effectuer une régulation en boucle fermée d’un système.',
  'Le PID contient trois actions en fonction de l’erreur :',
  'Une action proportionnelle : l’erreur est multipliée par un gain kp',
  'Une action intégrale : l’erreur est intégrée par un intervalle de temps, puis multiplié par un gain ki.',
  'Une action dérivée : l’erreur est dérivée suivant un temps, puis multipliée par un gain kd.',
  'Chaque fonction dans le PID joue un rôle important dans l’optimisation des performances du système (stabilité, rapidité et précision).',
  'Pour insérer le régulateur PID dans l’interface Sumilink on peut insérer chaque fonction du PID séparément ou on utilise directement le bloc PID Controller comme indique le schéma suivant :',
]

export const PART_III = {
  title: 'Asservissement de la hauteur d’eau d’un réservoir par un régulateur PID',
  intro: ['Considérons le schéma fonctionnel d’un réservoir d’eau suivant :', 'On choisi 2 m comme consigne: le régulateur PID vise à réguler la hauteur de l’eau dans le réservoir.'],
  figure: { number: '4.2', caption: 'Asservissement de la hauteur d’eau d’un réservoir d’eau par un contrôleur PID.' },
  questions: [
    { id: 'III.1', number: '1', page: 17, types: ['simulink'], text: 'Faire le schéma bloc de ce réservoir dans Simulink sans et avec le régulateur PID.' },
    { id: 'III.2', number: '2', page: 17, types: ['simulink', 'matlab'], text: 'Faire varié la valeur du gain kp, ki et kd affin d’obtenir une réponse désirée' },
    { id: 'III.3', number: '3', page: 17, types: ['interp'], text: 'Qu’elle est l’effet de chaque gain sur la stabilité, rapidité et précision du système.' },
    {
      id: 'III.4',
      number: '4',
      page: 17,
      types: ['matlab', 'simulink', 'main'],
      text: 'Déterminer l’erreur statique, le temps de réponse et le dépassement avant et après l’utilisation du régulateur PID avec Simulink et avec la commande >>stepinfo dans Malab',
    },
  ] satisfies Question[] as Question[],
}

export const PART_IV = {
  title: 'Asservissement de la vitesse d’un MCC',
  intro: [
    'Considérons le schéma fonctionnel d’un moteur à courant continu suivant :',
    'On choisi 10 rad/s comme commande : le régulateur PID vise à réguler la vitesse du moteur en prenant l’erreur comme entrée et fournit la tension nécessaire au moteur.',
  ],
  figure: { number: '4.3', caption: 'Asservissement de la vitesse d’un moteur à courant continu par un contrôleur PID.' },
  questions: [
    { id: 'IV.5', number: '5', page: 18, types: ['simulink'], text: 'Faire le schéma bloc du MCC dans Simulink sans et avec le régulateur PID.' },
    { id: 'IV.6', number: '6', page: 18, types: ['simulink', 'matlab'], text: 'Faire varié la valeur du gain kp, ki et kd affin d’obtenir une réponse désirée' },
    { id: 'IV.7', number: '7', page: 18, types: ['interp'], text: 'Qu’elle est l’effet de chaque gain sur la stabilité, rapidité et précision du système' },
    {
      id: 'IV.8',
      number: '8',
      page: 18,
      types: ['matlab', 'simulink'],
      text: 'Déterminer l’erreur statique, le temps de réponse et le dépassement avant et après l’utilisation du régulateur PID avec simulink et avec la commande >>stepinfo dans Malab',
    },
  ] satisfies Question[] as Question[],
  /** Tableau 4.1, as printed */
  table: [
    ['L', '0.011 mH'],
    ['R', '0.8 Ω'],
    ['J', '0.2 kg.m²'],
    ['f', '1.10⁻² N.m'],
    ['kem', '1.91 SI'],
    ['kc', '1.91 SI'],
    ['U', '10 V'],
  ],
}

export const question = (id: string): Question => findQuestion([...PART_III.questions, ...PART_IV.questions], id)
