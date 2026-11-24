/**
 * Automatique TP3, statements quoted verbatim from the fascicule
 * (TP Automatique Echantillonnée, INSAT 2024-2025, pages 13-15), typos
 * included. Checked against the PDF on 2026-11-24 (COVERAGE.md).
 */
export type QType = 'main' | 'matlab' | 'simulink' | 'interp'

export const QTYPE_LABEL: Record<QType, string> = {
  main: 'calcul à la main',
  matlab: 'MATLAB',
  simulink: 'Simulink',
  interp: 'interprétation',
}

export interface Question {
  /** handout number, also the MATLAB cell id */
  id: string
  /** number as printed */
  number: string
  text: string
  page: number
  types: QType[]
}

export const TP = {
  course: 'Automatique linéaire échantillonnée',
  number: 3,
  title: "Stabilité et précision d'un système échantillonné asservi",
  pages: '13–15',
  but: "Dans ce TP on va étudier la stabilité d'un système Echantillonné en tenant compte de l'effet de la période d'échantillonnage ainsi que du contrôleur numérique proportionnel.",
}

export const PART_II = {
  title: "Stabilité d'un système Echantillonné par un contrôleur numérique",
  intro: [
    'Soit un système échantillonné dont la fonction de transfert est donnée par G₁(s) = 1/(S+1) et le schéma bloc est représenté ci-dessous :',
    "On donne C(s) =K qui est un contrôleur numérique proportionnel et la fonction de transfert du bloqueur d'ordre zéro B₀(s) est (1−e^(−sT))/s",
  ],
  figure: { number: '3.1', caption: "Schéma bloc d'un système échantillonné avec un bloqueur d'ordre 0 et un contrôleur numérique." },
  questions: [
    { id: 'II.3', number: '3', page: 13, types: ['main'], text: 'Calculer la transformation en z G(z) en boucle fermé de ce système.' },
    { id: 'II.4', number: '4', page: 13, types: ['matlab'], text: 'Vérifier par Matlab votre calcule par les commandes tf, c2d et feedback' },
    {
      id: 'II.5',
      number: '5',
      page: 14,
      types: ['main', 'matlab', 'interp'],
      text: "Déterminer l'ordre de ce système ainsi que les pôles et les zéros et vérifier la stabilité de ce système en utilisant la commande rlocus.",
    },
    { id: 'II.6', number: '6', page: 14, types: ['simulink'], text: "Utiliser l'interface Simulink dans Matlab pour voir la réponse de ce système." },
    {
      id: 'II.7',
      number: '7',
      page: 14,
      types: ['main', 'matlab', 'interp'],
      text: 'Vérifier la stabilité du système pour différent valeur de K et indiquer la valeur limite de K.',
    },
  ] satisfies Question[] as Question[],
}

export const PART_III = {
  title: "Stabilité d'un système Echantillonné par un contrôleur numérique : Réservoir d'eau",
  intro: [
    "Dans cette partie on essaye de faire la simulation d'un système hydraulique qui comporte un réservoir d'eau de section constant. Le réservoir est alimenté par un débit Qₑ(t). H est la hauteur de 20 m d'eau dans le réservoir.",
    'La fonction de transfert de ce système est G₁(s) = H(s)/Qₑ(s) = 12.5/(50s+1)',
    "Ce système est contrôlé par contrôleur numérique C(s) =K avec un temps d'échantillonnage T. La fonction de transfert du bloqueur d'ordre zéro est (1−e^(−sT))/s.",
  ],
  figure: { number: '3.2', caption: "Schéma bloc d'un réservoir d'eau avec un bloqueur d'ordre 0 et un contrôleur numérique." },
  questions: [
    { id: 'III.1', number: '1', page: 14, types: ['main'], text: 'Calculer la transformation en z G(z) en boucle fermé de ce système.' },
    { id: 'III.2', number: '2', page: 14, types: ['matlab'], text: 'Vérifier par Matlab votre calcule par les commandes tf, c2d et feedback' },
    {
      id: 'III.3',
      number: '3',
      page: 15,
      types: ['simulink', 'interp'],
      text: "Utiliser l'interface Simulink dans Matlab pour voir la réponse de ce système pour différent période d'échantillonnage T.",
    },
    { id: 'III.4', number: '4', page: 15, types: ['main', 'interp'], text: "Qu'elle est la valeur de K pour remplir 2m (consigne) de la hauteur du réservoir." },
    {
      id: 'III.5',
      number: '5',
      page: 15,
      types: ['main', 'matlab'],
      text: 'Déterminer les pôles et les zéros et vérifier la stabilité de ce système en utilisant la commande rlocus.',
    },
    { id: 'III.6', number: '6', page: 15, types: ['main', 'matlab'], text: "Qu'elle est l'erreur statique de ce système." },
  ] satisfies Question[] as Question[],
}

export const question = (id: string): Question => {
  const q = [...PART_II.questions, ...PART_III.questions].find((x) => x.id === id)
  if (!q) throw new Error(`no question ${id}`)
  return q
}
