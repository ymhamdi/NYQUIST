/**
 * Hand derivations for Automatique TP2 (zero-order hold, impulse
 * invariance, discretized motor), in French with live numbers.
 */
import type { Complex } from '../engine/complex'
import { fmt } from '../lib/format'
import { eq, exp, frac, math, mi, minus, mn, mo, row, sub } from '../lib/mathml'
import type { Step } from './firstOrderLoop'

/** What a zero-order hold does to sin(ωt). */
export function zohSine(w: number, T: number): Step[] {
  const per = (2 * Math.PI) / (w * T)
  return [
    { text: `La sinusoïde a une période 2π/ω = ${fmt((2 * Math.PI) / w, 4)} s : avec T = ${fmt(T, 4)} s, on prend ${fmt(per, 3)} échantillons par période.` },
    {
      text: `Entre deux instants, le bloqueur garde x(kT). Comme la pente de sin(ωt) ne dépasse pas ω, l'écart reste sous ω·T = ${fmt(w * T, 4)}. En moyenne, le signal bloqué est en retard de T/2 = ${fmt(T / 2, 4)} s.`,
    },
    {
      text: `Shannon : il faut au moins deux échantillons par période, soit T < π/ω = ${fmt(Math.PI / w, 4)} s ; au-delà, la sinusoïde n'est plus reconstituable à partir des échantillons.`,
    },
  ]
}

/** Impulse invariance (no hold) for k/(τs + 1), compared with the ZOH result. */
export function impulseInvariance(k: number, tau: number, T: number): Step[] {
  const a = Math.exp(-T / tau)
  const c = k / tau
  return [
    {
      text: `Sans bloqueur, on échantillonne la réponse impulsionnelle g(t) = (k/τ)·e^(−t/τ) = ${fmt(c, 4)}·e^(−t/${fmt(tau, 4)}). Sa transformée en z est une série géométrique :`,
      math: math(
        eq(
          row(mi('𝒵'), mo('{'), mi('g'), mo('('), mi('k'), mi('T'), mo(')'), mo('}')),
          frac(row(mn(c, 4), mi('z')), row(mi('z'), mo('−'), exp(row(mo('−'), mi('T'), mo('/'), mi('τ'))))),
          frac(row(mn(c, 4), mi('z')), minus(mi('z'), a, 6)),
        ),
        { display: true },
      ),
    },
    {
      text: `Le pôle est le même qu'avec le bloqueur (z = e^(−T/τ) = ${fmt(a, 6)}) ; c'est le numérateur qui change. Gain statique en z = 1 : (k/τ)/(1 − a) = ${fmt(c / (1 - a), 5)}, environ k/T ; multiplié par T, il vaut ${fmt((T * c) / (1 - a), 5)}, proche de k = ${fmt(k, 4)} seulement si T est petit devant τ.`,
    },
    {
      text: "Le bloqueur, lui, conserve exactement le gain statique et reproduit exactement la réponse à un échelon aux instants kT : c'est la discrétisation adaptée à une commande numérique, qui maintient sa sortie entre deux calculs.",
    },
  ]
}

/** Discretized motor: each continuous pole p becomes z = e^{pT}. */
export function motorPolesZ(ps: Complex[], T: number): Step[] {
  return [
    {
      text: `Avec un bloqueur, chaque pôle continu p devient z = e^(pT). Ici T = ${fmt(T, 4)} s :`,
      math: math(
        row(...ps.flatMap((p, i) => [i ? mo(';') : '', sub(mi('z'), mn(i + 1)), mo('='), exp(row(mn(p.re, 5), mo(p.im >= 0 ? '+' : '−'), mn(Math.abs(p.im), 5), mi('j'), mo('·'), mn(T, 4))), mo('='), mn(Math.exp(p.re * T), 5), mo('∠'), mn(p.im * T, 4)])),
        { display: true },
      ),
    },
    {
      text: `Module e^(Re(p)·T) = ${fmt(Math.exp(ps[0].re * T), 5)} < 1 : les pôles restent dans le cercle unité, le modèle discret est stable comme le moteur. Le gain statique ne change pas.`,
    },
  ]
}
