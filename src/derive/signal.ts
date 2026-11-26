/**
 * Hand derivations for Traitement du signal TP3 (DFT) and TP4 (digital
 * filters), in French with live numbers.
 */
import { fmt, superscript } from '../lib/format'
import { eq, frac, math, mi, mn, mo, poly, row, sub, sup } from '../lib/mathml'
import type { Step } from './firstOrderLoop'

/** Lines of A·cos(2πf0·nTe) in an N-point DFT. */
export function cosineLines(A: number, f0: number, N: number, Fe: number): Step[] {
  const df = Fe / N
  const onBin = Math.abs(f0 / df - Math.round(f0 / df)) < 1e-9
  return [
    {
      text: `A·cos(2πf₀t) = (A/2)·e^(+j2πf₀t) + (A/2)·e^(−j2πf₀t) : deux raies d'amplitude A/2 = ${fmt(A / 2, 4)}, à +f₀ et −f₀ = ±${fmt(f0, 4)} Hz.`,
    },
    {
      text: `La FFT additionne les N = ${N} échantillons sans diviser par N : chaque raie vaut N·A/2 = ${fmt((N * A) / 2, 4)}. Pour retrouver les bonnes amplitudes, on divise par N (puis par 2 de côté pour l'amplitude du cosinus, A = ${fmt(A, 4)}).`,
      math: math(eq(row(mo('|'), mi('X'), mo('('), mi('k'), mo(')'), mo('|')), row(mi('N'), mo('·'), frac(mi('A'), mn(2))), mn((N * A) / 2, 4)), { display: true }),
    },
    {
      text: `Bonnes fréquences : la case k correspond à f = k·Fe/N, avec un pas Δf = Fe/N = ${fmt(df, 4)} Hz ; après fftshift, l'axe va de −Fe/2 à Fe/2. ${
        onBin ? `f₀ = ${fmt(f0 / df, 4)}·Δf tombe exactement sur une raie.` : `f₀/Δf = ${fmt(f0 / df, 4)} n'est pas entier : f₀ tombe entre deux raies (fuite spectrale).`
      }`,
    },
  ]
}

export const dcLine = (c: number, N: number): Step[] => [
  { text: `Une constante c = ${fmt(c, 4)} est une raie à f = 0 : X(0) = Σ c = N·c = ${fmt(N * c, 4)}, soit ${fmt(c, 4)} après division par N. Les autres raies ne changent pas (linéarité).` },
]

export function delayPhase(phi: number, f0: number): Step[] {
  const tau = -phi / (2 * Math.PI * f0)
  return [
    {
      text: `cos(2πf₀nTe + φ) avec φ = ${fmt(phi, 4)} rad : la raie à +f₀ est multipliée par e^(jφ), celle à −f₀ par e^(−jφ). Parties réelle et imaginaire changent, le module ne change pas.`,
      math: math(eq(sub(mi('X'), mi('+f₀')), row(frac(mn(1), mn(2)), mo('·'), sup(mi('e'), row(mi('j'), mn(phi, 4)))), row(mn(0.5 * Math.cos(phi), 4), mo(Math.sin(phi) < 0 ? '−' : '+'), mn(Math.abs(0.5 * Math.sin(phi)), 4), mi('j'))), { display: true }),
    },
    { text: `C'est le même signal retardé de τ = −φ/(2πf₀) = ${fmt(tau, 4)} s : retarder un signal fait tourner la phase de chaque raie sans toucher à son module.` },
  ]
}

export function resolution(tmax: number, f0: number, Fe: number): Step[] {
  const N = Math.round(tmax * Fe)
  const df = Fe / N
  return [
    { text: `N = tmax·Fe = ${N} points : résolution Δf = Fe/N = 1/tmax = ${fmt(df, 4)} Hz.` },
    {
      text: `${fmt(f0, 4)} Hz = ${fmt(f0 / df, 4)}·Δf. ${
        Math.abs(f0 / df - Math.round(f0 / df)) < 1e-9 ? 'Entier : la raie est nette, de hauteur exacte.' : "Non entier : l'énergie s'étale sur plusieurs raies, et le pic reste sous sa vraie hauteur."
      }`,
    },
    { text: "Observer plus longtemps affine toujours la résolution ; la hauteur du pic dépend de la position de la fréquence par rapport aux raies." },
  ]
}

export function zeroPadding(N: number, L: number, Fe: number): Step[] {
  return [
    {
      text: `On complète les ${N} échantillons par ${L - N} zéros jusqu'à L = ${L}. La FFT calcule alors L points de la même courbe (la TFTD de x4), au pas Fe/L = ${fmt(Fe / L, 4)} Hz au lieu de Fe/N = ${fmt(Fe / N, 4)} Hz.`,
    },
    {
      text: `La résolution ne change pas : elle reste 1/tmax = ${fmt(Fe / N, 4)} Hz, fixée par la durée réellement observée. Les zéros interpolent le spectre (courbe plus lisse, pic mieux localisé sur la TFTD) et donnent une longueur 2^p, adaptée à la FFT radix-2.`,
    },
  ]
}

/** H(z) written in powers of z, read by impz/freqz in powers of z⁻¹. */
export function zConvention(num: number[], den: number[]): Step[] {
  const pad = den.length - num.length
  return [
    {
      text: `H(z) est écrit en puissances décroissantes de z. impz et freqz lisent b et a en puissances croissantes de z⁻¹ : on divise numérateur et dénominateur par z${superscript(den.length - 1)}.`,
      math: math(eq(row(mi('H'), mo('('), mi('z'), mo(')')), frac(poly(num, 'z'), poly(den, 'z'))), { display: true }),
    },
    {
      text: `Le numérateur, de degré inférieur, doit donc être complété à gauche par ${pad} zéro${pad > 1 ? 's' : ''} : b = [${[...new Array(pad).fill(0), ...num].map((x) => fmt(x, 4)).join(' ')}]. Sans cela, la réponse impulsionnelle serait avancée de ${pad} échantillon${pad > 1 ? 's' : ''}.`,
    },
  ]
}

export function longDivision(b: number[], a: number[], h: number[]): Step[] {
  return [
    {
      text: `Division selon les puissances de z⁻¹ : h[n] = (b[n] − a₁h[n−1] − a₂h[n−2] − …)/a₀. Avec b = [${b.map((x) => fmt(x, 4)).join(' ')}] et a = [${a.map((x) => fmt(x, 4)).join(' ')}] :`,
    },
    { text: `h[0 … 4] = ${h.slice(0, 5).map((x) => fmt(x, 4)).join(' ; ')}.` },
  ]
}

export function stabilityFromPoles(name: string, moduli: number[]): Step[] {
  const stable = moduli.every((m) => m < 1)
  return [
    {
      text: `${name} : pôles de module ${moduli.map((m) => fmt(m, 4)).join(' ; ')}. ${stable ? 'Tous dans le cercle unité : filtre stable, h[n] tend vers 0.' : 'Au moins un pôle hors du cercle unité : filtre instable, h[n] diverge.'}`,
    },
  ]
}
