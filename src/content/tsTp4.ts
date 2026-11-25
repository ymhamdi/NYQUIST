/**
 * Traitement du signal TP4, statements from a transcription of the handout
 * (p. 6), NOT verified against the original fascicule.
 */
import { findQuestion, type Question, type TpMeta } from './types'

export const TP: TpMeta = {
  course: 'Traitement du signal',
  number: 4,
  title: 'Analyse des filtres numériques',
  pages: null,
  verified: false,
}

export const OBJECTIF_I =
  'L’objectif de cette partie du TP est de se familiariser avec quelques fonctions Matlab concernant la transformée en Z. Par exemple : la fonction tf (Num, Den, Te) ou dfilt.df1 ou freqz qui détermine la TF à partir des coefficients du numérateur et dénominateur de la TZ et la période d’échantillonnage Te ; les fonctions roots, pour calculer les zéros du numérateur ou dénominateur ; la fonction pzmap ou zplane pour localiser les zéros et les pôles dans le plan complexe ; la fonction impz pour calculer la transformée en Z inverse ; la fonction invfreqz pour déterminer le numérateur et le dénominateur en utilisant la TF (freqz).'
export const DONNEES_I = 'Prenons deux exemples de fonctions de transferts (TF) de la forme suivantes : H(z) = (z − 0.3) / (z² − 1.3z + 0.7) ; H(z) = (z² − 0.3) / (z³ − 1.3z² + 0.7z + 1.5). On donne Te = 0.01.'
export const INTRO_II = 'La fonction de transfert du filtre passe-bas RII du second ordre est de la forme : H(z) = (0.079z² + 0.158z + 0.079) / (0.516z² − 1.2z + 1)'

const q = (id: string, number: string, text: string, types: Question['types']): Question => ({ id, number, text, page: null, types })

export const PART_I: Question[] = [
  q('I.1', '1', 'Déclarer la période d’échantillonnage, les coefficients du numérateur de la TZ et les coefficients du dénominateur de la TZ.', ['matlab']),
  q('I.2', '2', 'Déterminer la TZ. Ici il ne faut pas mettre le point-virgule afin de visualiser l’expression de la TZ dans l’invite Matlab (insérer une pause de 5s).', ['matlab']),
  q('I.3', '3', 'Localiser les zéros et les pôles dans le plan complexe (sans le point-virgule et une pause de 5s).', ['matlab', 'main', 'interp']),
  q('I.4', '4', 'Calculer la transformée en Z inverse et visualiser sa forme (stem) (pause de 5s).', ['matlab', 'main']),
  q('I.5', '5', 'Calculer la TF en utilisant la fonction freqz et représenter sa réponse en amplitude et sa réponse en phase (pause de 5s) dans la même figure.', ['matlab']),
]
export const PART_II: Question[] = [
  q('II.1', '1', 'Générer et tracer la réponse impulsionnelle du filtre RII par l’utilisation de la fonction impz. On donne l’ordre du filtre N = 32.', ['matlab']),
  q('II.2', '2', 'Calculer la réponse en fréquence de nombre de points L = 256 et représenter la réponse en amplitude (échelle logarithmique) et la réponse en phase.', ['matlab', 'interp']),
  q('II.3', '3', 'Représenter les pôles et les zéros dans le plan z.', ['matlab', 'main']),
]

export const question = (id: string): Question => findQuestion([...PART_I, ...PART_II], id)
