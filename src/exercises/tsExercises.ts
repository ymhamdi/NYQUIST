/**
 * Mode DS (Traitement du signal): exam-style exercises generated from a seed,
 * in the spirit of TP3 (DFT) and TP4 (digital filters). Expected answers come
 * from the engine's toolbox path (fft, roots, impz, freqz); the corrections are
 * the hand derivations. A test checks both paths agree for many seeds.
 */
import type { Step } from '../derive/firstOrderLoop'
import { cosineLines, dcLine, delayPhase, longDivision, resolution, stabilityFromPoles, zConvention, zeroPadding } from '../derive/signal'
import { cabs, carg } from '../engine/complex'
import { fft, freqz, magnitude, shiftedAxis } from '../engine/dsp'
import { impz } from '../engine/lti'
import { evalReal, padLeft, roots } from '../engine/poly'
import { exposantPuissance2 } from '../engine/tp/tsTp3'
import { fmt, polyText, superscript } from '../lib/format'
import { choice, pick, rng, type Exercise as BaseExercise } from './common'

export { grade, type Item } from './common'

export type ExerciseKind = 'tfd' | 'resolution' | 'filtre'

export const KIND_LABEL: Record<ExerciseKind, string> = {
  tfd: 'Raies de la TFD (comme le TP3)',
  resolution: 'Résolution et ajout de zéros (comme le TP3)',
  filtre: 'Filtre numérique du second ordre (comme le TP4)',
}

export type Exercise = BaseExercise<ExerciseKind>

const PHASES = [
  { v: 0, t: '0' },
  { v: Math.PI / 6, t: 'π/6' },
  { v: Math.PI / 4, t: 'π/4' },
  { v: Math.PI / 3, t: 'π/3' },
  { v: Math.PI / 2, t: 'π/2' },
  { v: -Math.PI / 6, t: '−π/6' },
  { v: -Math.PI / 4, t: '−π/4' },
  { v: -Math.PI / 3, t: '−π/3' },
]
/** N with only factors 2 and 5, so that Fe/N is a terminating decimal */
const SIZES_TFD = [16, 20, 25, 32, 40, 50, 64, 80, 100, 128]
const SIZES_RES = [40, 50, 60, 75, 80, 100, 120, 150, 200, 250, 300]
const range = (n: number) => Array.from({ length: n }, (_, k) => k)
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
const v = (x: number) => fmt(x, 8)

function tfd(seed: number, rand: () => number): Exercise {
  const Fe = pick(rand, [100, 200, 500, 1000, 2000, 8000])
  const N = pick(rand, SIZES_TFD)
  const k0 = 1 + Math.floor(rand() * (Math.floor(N / 2) - 2)) // 1 … N/2 − 2
  const f0 = (k0 * Fe) / N
  const A = pick(rand, [0.5, 1, 2, 3, 4, 5, 10])
  const c = pick(rand, [0, 1, 2, 5])
  const ph = pick(rand, PHASES)
  // toolbox path: fft of the samples, the line is the largest bin of the positive half
  const X = fft(range(N).map((n) => c + A * Math.cos((2 * Math.PI * f0 * n) / Fe + ph.v)))
  const mag = magnitude(X)
  let k = 1
  for (let i = 2; i < Math.ceil(N / 2); i++) if (mag[i] > mag[k]) k = i
  const axis = shiftedAxis(N, Fe)
  const signal = `${c ? `${v(c)} + ` : ''}${A === 1 ? '' : v(A) + '·'}cos(2π·${v(f0)}·t${ph.v ? (ph.v < 0 ? ' − ' : ' + ') + ph.t.replace('−', '') : ''})`
  return {
    seed,
    kind: 'tfd',
    statement: [
      `On échantillonne x(t) = ${signal} à la fréquence Fe = ${v(Fe)} Hz et on garde N = ${N} échantillons x[n] = x(nTe), n = 0 … N − 1.`,
      'On calcule X = fft(x) (sans diviser par N). Les indices k vont de 0 à N − 1, avant fftshift.',
    ],
    items: [
      { id: 'df', prompt: 'Calculer la résolution Δf.', kind: 'number', unit: 'Hz', answer: axis[1] - axis[0], tol: 0.001 },
      { id: 'k', prompt: 'À quel indice k se trouve la raie de fréquence +f₀ ?', kind: 'number', answer: k, tol: 0 },
      { id: 'h', prompt: 'Calculer la hauteur |X(k)| de cette raie.', kind: 'number', answer: mag[k], tol: 0.01 },
      { id: 'dc', prompt: 'Calculer |X(0)|, la raie à f = 0.', kind: 'number', answer: mag[0], tol: 0.01 },
      { id: 'phase', prompt: "Calculer l'argument de X(k), en radians.", kind: 'number', unit: 'rad', answer: carg({ re: X.re[k], im: X.im[k] }), tol: 0.01 },
      choice(rand, 'amp', "Comment retrouve-t-on l'amplitude A du cosinus à partir de |X(k)| ?", '2|X(k)|/N', ['|X(k)|/N', '|X(k)|', '|X(k)|/2']),
    ],
    correction: [...cosineLines(A, f0, N, Fe), { text: `Indice de la raie : k = f₀/Δf = ${v(f0)} / ${v(Fe / N)} = ${k0}.` }, ...dcLine(c, N), ...delayPhase(ph.v, f0)],
    given: { Fe, N, f0, A, c, phi: ph.v, k0 },
  }
}

function res(seed: number, rand: () => number): Exercise {
  const Fe = pick(rand, [500, 1000, 2000, 4000, 8000])
  const N = pick(rand, SIZES_RES)
  const tmax = N / Fe
  const f1 = 5 * (1 + Math.floor(rand() * (Fe / 20))) // 5 … Fe/4 Hz
  // toolbox path: f1 falls on a line iff the fft of the cosine has exactly two non-zero lines
  const mag = magnitude(fft(range(N).map((n) => Math.cos((2 * Math.PI * f1 * n) / Fe))))
  const peak = Math.max(...mag)
  const onBin = mag.filter((m) => m > 1e-6 * peak).length <= 2
  let Nmin = 1
  while (Math.abs((Nmin * f1) / Fe - Math.round((Nmin * f1) / Fe)) > 1e-9) Nmin++
  const L = 2 ** exposantPuissance2(N)
  const g = gcd(Fe, f1)
  const steps: Step[] = [
    ...resolution(tmax, f1, Fe),
    {
      text: `f₁ tombe sur une raie si N·f₁/Fe est entier. f₁/Fe = ${f1}/${Fe} = ${f1 / g}/${Fe / g} en fraction irréductible : il faut N multiple de ${Fe / g}, soit tmax multiple de ${Fe / g}/Fe = ${v(Nmin / Fe)} s.`,
    },
    { text: `2ᵖ doit dépasser N = ${N} : 2${superscript(exposantPuissance2(N) - 1)} = ${L / 2} ≤ ${N} < 2${superscript(exposantPuissance2(N))} = ${L}, donc L = ${L}.` },
    ...zeroPadding(N, L, Fe),
  ]
  return {
    seed,
    kind: 'resolution',
    statement: [
      `On acquiert x(t) = 5 + cos(2π·${f1}·t) pendant tmax = ${v(tmax)} s, à la fréquence d'échantillonnage Fe = ${v(Fe)} Hz, puis on calcule sa TFD.`,
      "On complète ensuite les échantillons par des zéros jusqu'à une longueur L = 2ᵖ, où 2ᵖ est la première puissance de 2 qui dépasse N.",
    ],
    items: [
      { id: 'N', prompt: "Combien d'échantillons N acquiert-on ?", kind: 'number', answer: Math.round(tmax * Fe), tol: 0 },
      { id: 'df', prompt: 'Calculer la résolution Δf.', kind: 'number', unit: 'Hz', answer: Fe / N, tol: 0.001 },
      { id: 'onbin', prompt: `La fréquence f₁ = ${f1} Hz tombe-t-elle exactement sur une raie ?`, kind: 'choice', options: ['oui', 'non'], answer: onBin ? 0 : 1, tol: 0 },
      { id: 'tmin', prompt: 'Quelle est la plus petite durée tmax pour laquelle f₁ tombe sur une raie ?', kind: 'number', unit: 's', answer: Nmin / Fe, tol: 0.001 },
      { id: 'L', prompt: 'Calculer la longueur L après ajout de zéros.', kind: 'number', answer: L, tol: 0 },
      { id: 'dfL', prompt: 'Calculer le pas entre deux points de la FFT après ajout de zéros.', kind: 'number', unit: 'Hz', answer: Fe / L, tol: 0.001 },
      choice(rand, 'gain', "Après l'ajout de zéros, la résolution fréquentielle est…", 'inchangée (1/tmax)', ['plus fine (Fe/L)', 'moins fine (2·Fe/N)']),
    ],
    correction: steps,
    given: { Fe, N, tmax, f1 },
  }
}

function filtre(seed: number, rand: () => number): Exercise {
  let a1 = 0
  let a2 = 0
  do {
    a1 = pick(rand, [-1.6, -1.4, -1.2, -1, -0.8, -0.5, 0.5, 1])
    a2 = pick(rand, [0.25, 0.36, 0.5, 0.64, 0.7, 0.81, 0.9, 1.21, 1.44])
  } while (Math.abs(1 + a1 + a2) < 0.05 || Math.abs(1 - a1 + a2) < 0.05) // no pole at z = ±1
  const shape = pick(rand, ['premier', 'passe-bas', 'passe-bande'] as const)
  const g = pick(rand, [0.1, 0.2, 0.25, 0.5])
  const num = shape === 'premier' ? [1, -pick(rand, [0.2, 0.3, 0.5, -0.5])] : shape === 'passe-bas' ? [g, 2 * g, g] : [g, 0, -g]
  const den = [1, a1, a2]
  const b = padLeft(num, den.length)
  // toolbox path: impz, roots, freqz
  const h = impz(b, den, 5)
  const moduli = roots(den).map(cabs).sort((x, y) => y - x)
  const H0 = freqz(b, den, 1).H[0].re
  const Hpi = evalReal(b, -1) / evalReal(den, -1)
  const sum = (c: number[]) => c.reduce((s, x) => s + x, 0)
  const alt = (c: number[]) => evalReal(c, -1)
  return {
    seed,
    kind: 'filtre',
    statement: [
      `Un filtre numérique causal a pour fonction de transfert H(z) = (${polyText(num)}) / (${polyText(den)}), écrite en puissances de z.`,
      'On étudie sa réponse impulsionnelle (impz), ses pôles (roots) et sa réponse en fréquence (freqz).',
    ],
    items: [
      { id: 'h0', prompt: 'Calculer h[0].', kind: 'number', answer: h[0], tol: 0.01 },
      { id: 'h1', prompt: 'Calculer h[1].', kind: 'number', answer: h[1], tol: 0.01 },
      { id: 'h2', prompt: 'Calculer h[2].', kind: 'number', answer: h[2], tol: 0.01 },
      { id: 'r', prompt: 'Calculer le plus grand module des pôles.', kind: 'number', answer: moduli[0], tol: 0.01 },
      { id: 'stable', prompt: 'Le filtre est-il stable ?', kind: 'choice', options: ['oui', 'non'], answer: moduli[0] < 1 ? 0 : 1, tol: 0 },
      { id: 'H0', prompt: 'Calculer le gain en f = 0, H(1).', kind: 'number', answer: H0, tol: 0.01 },
      { id: 'Hpi', prompt: 'Calculer le gain en f = Fe/2, H(−1).', kind: 'number', answer: Hpi, tol: 0.01 },
    ],
    correction: [
      ...zConvention(num, den),
      ...longDivision(b, den, h),
      ...stabilityFromPoles('H', moduli),
      { text: `En f = 0, z = e^(j0) = 1 : H(1) = (somme des coefficients de N(z)) / (somme de ceux de D(z)) = ${fmt(sum(num), 4)} / ${fmt(sum(den), 4)} = ${fmt(H0, 4)}.` },
      { text: `En f = Fe/2, z = e^(jπ) = −1 : H(−1) = N(−1)/D(−1) = ${fmt(alt(b), 4)} / ${fmt(alt(den), 4)} = ${fmt(Hpi, 4)}.` },
    ],
    given: { a1, a2, b0: b[0], b1: b[1], b2: b[2] },
  }
}

export function makeExercise(seed: number, kind?: ExerciseKind): Exercise {
  const rand = rng(seed)
  const chosen: ExerciseKind = kind ?? pick(rand, ['tfd', 'resolution', 'filtre'] as const)
  if (chosen === 'tfd') return tfd(seed, rand)
  if (chosen === 'resolution') return res(seed, rand)
  return filtre(seed, rand)
}
