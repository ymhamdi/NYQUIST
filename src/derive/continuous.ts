/** Hand derivation for Automatique TP1: G(s) = b/(s + a) in the unity-feedback loop of figure 1.6. */
import { fmt } from '../lib/format'
import { eq, frac, math, mi, mn, mo, paren, row } from '../lib/mathml'
import type { Step } from './firstOrderLoop'

export function unityFeedbackFirstOrder(b: number, a: number, Uf: number): Step[] {
  const s = mi('s')
  const tau = 1 / (a + b)
  const gain = b / (a + b)
  return [
    {
      text: `Seul, G(s) = ${fmt(b, 4)}/(s + ${fmt(a, 4)}) a un gain statique G(0) = ${fmt(b / a, 4)} et une constante de temps 1/${fmt(a, 4)} = ${fmt(1 / a, 4)} s.`,
    },
    {
      text: 'La figure 1.6 ramène la sortie sur le comparateur : le Scope montre la boucle fermée.',
      math: math(
        eq(row(mi('F'), paren(s)), frac(row(mi('G'), paren(s)), row(mn(1), mo('+'), mi('G'), paren(s))), frac(mn(b, 4), row(s, mo('+'), mn(a, 4), mo('+'), mn(b, 4))), frac(mn(b, 4), row(s, mo('+'), mn(a + b, 4)))),
        { display: true },
      ),
    },
    {
      text: `Gain statique F(0) = ${fmt(b, 4)}/${fmt(a + b, 4)} = ${fmt(gain, 4)} : pour un échelon de ${fmt(Uf, 4)}, la sortie tend vers ${fmt(gain * Uf, 4)}. Constante de temps τ = 1/${fmt(a + b, 4)} = ${fmt(tau, 4)} s : la boucle fermée est ${fmt((a + b) / a, 3)} fois plus rapide que G seule, mais n'atteint pas l'échelon.`,
    },
    { text: `Temps de réponse à 5 % : 3τ = ${fmt(3 * tau, 4)} s après le saut.` },
  ]
}
