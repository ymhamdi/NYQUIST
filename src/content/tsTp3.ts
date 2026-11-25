/**
 * Traitement du signal TP3, statements from a transcription of the handout
 * (p. 5), NOT verified against the original fascicule (the user does not
 * have it). Numbering: questions 1-12 of section 2.2.
 */
import { findQuestion, type Question, type TpMeta } from './types'

export const TP: TpMeta = {
  course: 'Traitement du signal',
  number: 3,
  title: 'Transformée de Fourier Discrète',
  pages: null,
  verified: false,
  but: 'Étudier l’influence du choix de la fréquence d’échantillonnage et de la durée d’observation d’un signal sur ses caractéristiques temporelles et fréquentielles.',
}

export const INTRO = 'Le signal analogique x(t) = 3cos(2π100t) est échantillonné à la fréquence d’échantillonnage Fe = 1000 Hz pour donner le signal x1[n].'

const q = (id: string, text: string, types: Question['types']): Question => ({ id, number: id.slice(1), text, page: null, types })

export const QUESTIONS: Question[] = [
  q('Q1', 'Générer le signal x1[n] sur une durée (temps d’acquisition) tmax = 0.1 s.', ['matlab']),
  q('Q2', 'Tracer sur la même figure que vous allez subdiviser sur deux lignes, la partie réelle et la partie imaginaire de la transformée de Fourier X1(f) de x1[n]. Utiliser la fonction fft pour le calcul de la transformée de Fourier, la fonction fftshift pour obtenir un spectre symétrique par rapport à f = 0 et la fonction stem pour tracer le spectre sous forme discrète.', ['matlab']),
  q('Q3', 'Tracer le spectre d’amplitude sur une nouvelle fenêtre.', ['matlab']),
  q('Q4', 'Que constatez-vous concernant l’amplitude des raies ? Que faut-il faire pour trouver les bonnes amplitudes et les bonnes fréquences ?', ['main', 'interp']),
  q('Q5', 'Soit le signal discret x2[n] = 5 + x1[n]. Refaire les questions 1, 2, 3 et 4 pour le signal x2[n].', ['matlab']),
  q('Q6', 'Quel est l’effet de la composante continue de x2[n].', ['interp']),
  q('Q7', 'Soit le signal discret x3[n] = 5 + cos[2π100nTe − π/3]. Tracer les parties réelle et imaginaire de X3(f) ainsi que le spectre d’amplitude.', ['matlab']),
  q('Q8', 'Quel est l’effet du retard sur les parties réelle et imaginaire du spectre (comparées à X2(f)) ainsi que sur le spectre d’amplitude ?', ['main', 'interp']),
  q('Q9', 'Tracer le spectre du signal x4[n] = 5 + cos[2π105nTe]. Que constatez-vous ?', ['matlab', 'interp']),
  q('Q10', 'Refaire la question 9) pour des temps d’acquisition tmax = 0.05 s et tmax = 0.2 s. Que constatez-vous ? Pourquoi ?', ['matlab', 'main', 'interp']),
  q('Q11', 'On se fixe un temps d’acquisition tmax = 0.05 s, programmer une fonction qui permet de déterminer l’indice p tel que 2^p est la première valeur qui dépasse le nombre d’échantillons N.', ['matlab']),
  q('Q12', 'On considère un signal x5[n] tel que : x5[n] = x4[n] si n ≤ N ; 0 si N ≤ n ≤ 2^p. Tracer le spectre d’amplitude de x5[n]. Que constatez-vous ? Quelle est l’utilité de l’ajout des zéros.', ['matlab', 'interp']),
]

export const question = (id: string): Question => findQuestion(QUESTIONS, id)
