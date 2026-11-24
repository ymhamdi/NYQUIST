/**
 * Step-by-step hand derivations (in French, with live numbers) for a
 * first-order plant k/(τs + 1) behind a zero-order hold, with a
 * proportional digital controller K and unity feedback: the situation of
 * Automatique TP3 (parts II and III) and of the Mode DS exercises.
 * Every number comes from the arguments; nothing is typed by hand.
 */
import { fmt } from '../lib/format'
import { abs, eq, exp, frac, math, mi, minus, mn, mo, paren, row, sub, type MathNode } from '../lib/mathml'

export interface Step {
  /** French sentence explaining the step */
  text: string
  /** MathML of the step (display) */
  math?: string
}

export interface FirstOrderLoop {
  k: number
  tau: number
  T: number
  K: number
  /** name of the plant in the handout (G₁) */
  plant?: string
  /** name of e^{−T/τ} in the script: "a" (part II) or "b" (part III) */
  sym?: string
}

const z = mi('z')
const s = mi('s')
const G = (n: number) => sub(mi('G'), mn(n))
const show = (v: number) => mn(v, 6)
/** k·x, written x alone when k = 1 */
const times = (k: number, ...x: MathNode[]) => (k === 1 ? row(...x) : row(show(k), ...x))
/** τs + 1, written s + 1 when τ = 1 */
const lag = (tau: number) => row(tau === 1 ? s : row(show(tau), s), mo('+'), mn(1))

export function zohFirstOrder({ k, tau, T: Tval, plant = 'G₁', sym = 'b' }: FirstOrderLoop): { steps: Step[]; b: number; num: number } {
  const b = Math.exp(-Tval / tau)
  const num = k * (1 - b)
  const B = mi(sym)
  const steps: Step[] = [
    {
      text: `Le bloqueur d'ordre zéro et le procédé forment un seul bloc. Sa transformée en z s'obtient à partir de la réponse indicielle de ${plant} :`,
      math: math(eq(row(G(0), paren(z)), row(paren(mn(1), mo('−'), sup1()), mi('𝒵'), mo('{'), frac(row(G(1), paren(s)), s), mo('}'))), { display: true }),
    },
    {
      text: `Avec ${plant}(s) = ${fmt(k, 6)}/(${tau === 1 ? '' : fmt(tau, 6)}s + 1), on décompose en éléments simples :`,
      math: math(
        eq(frac(show(k), row(s, paren(lag(tau)))), times(k, paren(frac(mn(1), s), mo('−'), frac(mn(1), row(s, mo('+'), mn(1 / tau, 6)))))),
        { display: true },
      ),
    },
    {
      text: `D'après la table des transformées en z, 1/s donne z/(z − 1) et 1/(s + c) donne z/(z − e^(−cT)), avec ici c = 1/τ = ${fmt(1 / tau, 6)} s⁻¹ :`,
      math: math(eq(B, exp(row(mo('−'), frac(mi('T'), mi('τ')))), exp(row(mo('−'), frac(show(Tval), show(tau)))), mn(b, 6)), { display: true }),
    },
    {
      text: 'En multipliant par (1 − z⁻¹) = (z − 1)/z, le terme en z/(z − 1) se simplifie :',
      math: math(eq(row(G(0), paren(z)), frac(times(k, paren(mn(1), mo('−'), B)), row(z, mo('−'), B)), frac(mn(num, 4), minus(z, b, 6))), {
        display: true,
      }),
    },
  ]
  return { steps, b, num }
}

const sup1 = () => '<msup><mi>z</mi><mrow><mo>−</mo><mn>1</mn></mrow></msup>'

export function closedLoop(p: FirstOrderLoop): {
  steps: Step[]
  pole: number
  Kmax: number
  stable: boolean
  staticGain: number
} {
  const { k, T: Tval, K, sym = 'b' } = p
  const { steps, b, num } = zohFirstOrder(p)
  const B = mi(sym)
  const pole = b - K * num
  const Kmax = (1 + b) / (k * (1 - b))
  const stable = Math.abs(pole) < 1
  const staticGain = (K * k) / (1 + K * k)
  const kK = row(mi('k'), mi('K'))
  steps.push(
    {
      text: `En boucle fermée, avec le gain K = ${fmt(K, 6)}, le procédé de gain k = ${fmt(k, 6)} et le retour unitaire :`,
      math: math(
        eq(
          row(mi('G'), paren(z)),
          frac(row(mi('K'), G(0), paren(z)), row(mn(1), mo('+'), mi('K'), G(0), paren(z))),
          frac(row(kK, paren(mn(1), mo('−'), B)), row(z, mo('−'), B, mo('+'), kK, paren(mn(1), mo('−'), B))),
          frac(mn(K * num, 4), minus(z, pole, 6)),
        ),
        { display: true },
      ),
    },
    {
      text: `C'est un système du premier ordre, sans zéro, avec un seul pôle p = ${sym} − kK(1 − ${sym}) = ${fmt(pole, 6)}. ${
        stable ? 'Il est dans le cercle unité : la boucle est stable.' : 'Il est hors du cercle unité : la boucle est instable.'
      }`,
      math: math(row(abs(mi('p')), mo('='), mn(Math.abs(pole), 6), mo(stable ? '<' : '≥'), mn(1)), { display: true }),
    },
    {
      text: `Stabilité : il faut −1 < p < 1. La borne p < 1 donne K > −1/k ; la borne p > −1 donne la valeur limite du gain :`,
      math: math(
        eq(
          sub(mi('K'), '<mtext>max</mtext>'),
          frac(row(mn(1), mo('+'), B), row(mi('k'), paren(mn(1), mo('−'), B))),
          frac(row(mn(1), mo('+'), mn(b, 6)), times(k, paren(mn(1), mo('−'), mn(b, 6)))),
          mn(Kmax, 5),
        ),
        { display: true },
      ),
    },
    {
      text: `Plus T est grand, plus ${sym} = e^(−T/τ) est petit et plus Kmax diminue : échantillonner lentement réduit la marge de stabilité. Ici T = ${fmt(Tval, 6)} s.`,
    },
    {
      text: `Gain statique (z = 1) : G(1) = kK/(1 + kK) = ${fmt(staticGain, 6)}. Pour un échelon de consigne r, l'erreur statique vaut r/(1 + kK) : elle n'est jamais nulle avec un contrôleur proportionnel.`,
      math: math(eq(sub(mi('ε'), mi('∞')), frac(mi('r'), row(mn(1), mo('+'), kK)), row(mi('r'), mo('×'), mn(1 / (1 + K * k), 6))), { display: true }),
    },
  )
  return { steps, pole, Kmax, stable, staticGain }
}

/** Smallest K giving a relative static error ≤ eps, and the largest T for which it is stable. */
export function gainForTolerance(k: number, tau: number, eps: number, Tval: number): { steps: Step[]; Kmin: number; Tmax: number; feasible: boolean } {
  const Kmin = (1 - eps) / (k * eps)
  const b = Math.exp(-Tval / tau)
  const Kmax = (1 + b) / (k * (1 - b))
  const Tmax = -tau * Math.log((k * Kmin - 1) / (k * Kmin + 1))
  const feasible = Kmin < Kmax
  const steps: Step[] = [
    {
      text: `L'erreur relative vaut 1/(1 + kK), avec k = ${fmt(k, 6)}. Pour qu'elle soit au plus ${fmt(eps * 100, 4)} % :`,
      math: math(
        row(
          frac(mn(1), row(mn(1), mo('+'), show(k), mi('K'))),
          mo('≤'),
          show(eps),
          mo('⟺'),
          mi('K'),
          mo('≥'),
          frac(row(mn(1), mo('−'), show(eps)), row(show(k), mo('×'), show(eps))),
          mo('='),
          mn(Kmin, 5),
        ),
        { display: true },
      ),
    },
    {
      text: `Il faut aussi K < Kmax(T). Avec T = ${fmt(Tval, 6)} s, Kmax = ${fmt(Kmax, 5)} : ${
        feasible ? `K = ${fmt(Kmin, 5)} est stable, la tolérance est atteignable.` : `K = ${fmt(Kmin, 5)} rendrait la boucle instable, la tolérance est impossible à cette période.`
      }`,
    },
    {
      text: `La période maximale vérifie Kmax(T) = ${fmt(Kmin, 5)}, soit T = −τ ln((kK − 1)/(kK + 1)) = ${fmt(Tmax, 5)} s.`,
    },
  ]
  return { steps, Kmin, Tmax, feasible }
}
