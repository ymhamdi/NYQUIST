/** The TPs of both courses, for the home page and the TP switcher of each TP page. */
export interface TpEntry {
  n: number
  title: string
  status: string
  /** path under the site's base, when the TP has a page */
  path?: string
}
export interface Course {
  id: 'automatique' | 'signal'
  name: string
  /** one sentence for the course card and page */
  blurb: string
  tps: TpEntry[]
}

export const COURSES: Course[] = [
  {
    id: 'automatique',
    name: 'Automatique linéaire échantillonnée',
    blurb: 'Du système continu à la boucle numérique : Simulink, bloqueur d’ordre zéro, transformée en Z, stabilité et précision, régulation PID.',
    tps: [
      { n: 1, title: 'Initialisation à Matlab Simulink', status: 'page interactive', path: 'automatique/tp1/' },
      { n: 2, title: "Discrétisation d'un signal à temps continu", status: 'page interactive', path: 'automatique/tp2/' },
      { n: 3, title: "Stabilité et précision d'un système échantillonné asservi", status: 'page interactive', path: 'automatique/tp3/' },
      { n: 4, title: 'Asservissement des systèmes continus', status: 'page interactive', path: 'automatique/tp4/' },
    ],
  },
  {
    id: 'signal',
    name: 'Traitement du signal',
    blurb: 'Signaux discrets, convolution, transformée de Fourier discrète et filtres numériques, des échantillons au spectre.',
    tps: [
      { n: 1, title: 'Signaux discrets', status: 'énoncé manquant' },
      { n: 2, title: 'Convolution des signaux numériques', status: 'énoncé manquant' },
      { n: 3, title: 'Transformée de Fourier Discrète', status: 'page interactive (énoncé non vérifié)', path: 'signal/tp3/' },
      { n: 4, title: 'Analyse des filtres numériques', status: 'page interactive (énoncé non vérifié)', path: 'signal/tp4/' },
    ],
  },
]

export const courseOf = (name: string): Course => COURSES.find((c) => c.name === name) ?? COURSES[0]
