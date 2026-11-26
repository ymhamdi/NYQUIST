/**
 * Hand derivations for Automatique TP4 (PID control of the tank and of the
 * DC motor), in French with live numbers. Results that the page shows next
 * to them come from the engine (src/engine/tp/aeTp4.ts).
 */
import type { Complex } from '../engine/complex'
import { feedback, poles, series, type TF, pid, tf } from '../engine/lti'
import { fmt } from '../lib/format'
import { eq, frac, math, mi, mn, mo, paren, poly, row, sub, sup } from '../lib/mathml'
import type { Step } from './firstOrderLoop'

const s = mi('s')
const fmtPole = (p: Complex) => (Math.abs(p.im) < 1e-9 ? fmt(p.re, 5) : `${fmt(p.re, 5)} ${p.im < 0 ? '−' : '+'} ${fmt(Math.abs(p.im), 5)}j`)

/** Tank k/(τs + 1) without PID: open loop (constant inflow) and unity feedback. */
export function tankWithoutPid(k: number, tau: number, r: number, Hmax: number): Step[] {
  const Hbo = k * r
  const steps: Step[] = [
    {
      text: `Boucle ouverte : le débit d'entrée est fixé à la valeur de la consigne. La hauteur tend vers k·r = ${fmt(k, 4)} × ${fmt(r, 4)} = ${fmt(Hbo, 4)} m.`,
    },
  ]
  if (Hbo > Hmax)
    steps.push({
      text: `C'est plus que la hauteur du réservoir (${fmt(Hmax, 4)} m) : il déborde quand k·r(1 − e^(−t/τ)) = ${fmt(Hmax, 4)}, soit t = −τ ln(1 − ${fmt(Hmax, 4)}/${fmt(Hbo, 4)}) = ${fmt(-tau * Math.log(1 - Hmax / Hbo), 4)} s.`,
    })
  steps.push(
    {
      text: 'Retour unitaire, sans régulateur (C = 1) : la boucle fermée reste du premier ordre.',
      math: math(
        eq(row(mi('F'), paren(s)), frac(mn(k, 4), row(mn(tau, 4), s, mo('+'), mn(1), mo('+'), mn(k, 4))), frac(mn(k / (1 + k), 4), row(mn(tau / (1 + k), 4), s, mo('+'), mn(1)))),
        { display: true },
      ),
    },
    {
      text: `Elle est ${fmt(1 + k, 4)} fois plus rapide (τ = ${fmt(tau / (1 + k), 4)} s) mais n'atteint que r·k/(1 + k) = ${fmt((r * k) / (1 + k), 4)} m : erreur statique r/(1 + k) = ${fmt(r / (1 + k), 4)} m.`,
    },
  )
  return steps
}

/** PI on k/(τs + 1): characteristic polynomial, and the pole-cancelling choice ki/kp = 1/τ. */
export function tankPi(k: number, tau: number, kp: number, ki: number, kd: number): Step[] {
  const G = tf(k, [tau, 1])
  const F = feedback(series(pid(kp, ki, kd), G), 1)
  const char = F.den
  const ps = poles(F)
  const steps: Step[] = [
    {
      text: 'Avec C(s) = kp + ki/s + kd·s, la boucle fermée F = CG/(1 + CG) a pour dénominateur :',
      math: math(eq(row(mi('s'), paren(row(mn(tau, 4), s, mo('+'), mn(1))), mo('+'), mn(k, 4), paren(row(sub(mi('k'), mi('d')), sup(mi('s'), mn(2)), mo('+'), sub(mi('k'), mi('p')), s, mo('+'), sub(mi('k'), mi('i'))))), poly(char)), {
        display: true,
      }),
    },
    { text: `Ses racines, les pôles de la boucle fermée : ${ps.map(fmtPole).join(' ; ')}. ${ps.every((p) => p.re < 0) ? 'Toutes à partie réelle négative : la boucle est stable.' : 'Une racine a une partie réelle positive : la boucle est instable.'}` },
  ]
  if (ki !== 0 && kd === 0 && Math.abs(ki / kp - 1 / tau) < 1e-9 * (1 / tau))
    steps.push({
      text: `Ici ki/kp = 1/τ = ${fmt(1 / tau, 4)} : le zéro du PI (s = −ki/kp) compense le pôle du réservoir. Il reste CG = k·kp/(τs), un intégrateur pur, et la boucle fermée est un premier ordre de constante de temps τ/(k·kp) = ${fmt(tau / (k * kp), 4)} s : pas de dépassement, temps de réponse à 2 % de ${fmt((tau / (k * kp)) * Math.log(50), 4)} s.`,
    })
  steps.push({
    text: `Erreur statique (théorème de la valeur finale) : ε∞ = r/(1 + C(0)G(0)). ${
      ki !== 0 ? "Avec l'intégrateur, C(0) est infini : ε∞ = 0." : `Sans intégrateur, C(0) = kp = ${fmt(kp, 4)} : ε∞ = r/(1 + k·kp), non nulle.`
    }`,
  })
  return steps
}

/** DC motor from equations (1)–(2): Ω/U and its poles. */
export function motorModel(p: { L: number; R: number; J: number; f: number; kem: number; kc: number }, Gm: TF): Step[] {
  const ps = poles(Gm)
  const fastSlow = ps.length === 2 && Math.abs(ps[0].im) < 1e-9 && Math.abs(ps[0].re / ps[1].re) > 100
  return [
    {
      text: "Équation électrique (1) : I(s) = (U(s) − kem·Ω(s))/(Ls + R). Équation mécanique (2) : Ω(s) = (kc·I(s) − Cr)/(Js + f). (L'équation mécanique écrite avant (2) dans le fascicule a une erreur de signe : on utilise (2).)",
    },
    {
      text: 'En éliminant I (Cr = 0), la boucle de force contre-électromotrice donne :',
      math: math(
        eq(
          frac(mi('Ω'), mi('U')),
          frac(sub(mi('k'), mi('c')), row(paren(row(mi('L'), s, mo('+'), mi('R'))), paren(row(mi('J'), s, mo('+'), mi('f'))), mo('+'), sub(mi('k'), mi('c')), sub(mi('k'), mi('em')))),
          frac(mn(Gm.num.at(-1)!, 4), poly(Gm.den, 's', 4)),
        ),
        { display: true },
      ),
    },
    {
      text: `Gain statique : kc/(Rf + kc·kem) = ${fmt(Gm.num.at(-1)! / Gm.den.at(-1)!, 4)} rad/s par volt. Pôles : ${ps.map(fmtPole).join(' ; ')}.${
        fastSlow ? ' Le pôle électrique est des centaines de fois plus rapide que le pôle mécanique : le moteur se comporte comme un premier ordre (cas de L = 0,011 mH).' : ''
      }`,
    },
  ]
}

/** PID on the motor: closed-loop characteristic polynomial and poles. */
export function motorPid(Gm: TF, kp: number, ki: number, kd: number): Step[] {
  const F = feedback(series(pid(kp, ki, kd), Gm), 1)
  const ps = poles(F)
  return [
    {
      text: 'Avec le PID, le dénominateur de la boucle fermée est s·D(s) + kc·(kd·s² + kp·s + ki), où D(s) est celui du moteur :',
      math: math(poly(F.den, 's', 4), { display: true }),
    },
    {
      text: `Pôles : ${ps.map(fmtPole).join(' ; ')}. ${ps.every((p) => p.re < 0) ? 'La boucle est stable.' : 'La boucle est instable.'} ${ki !== 0 ? "L'intégrateur annule l'erreur statique, y compris face à un couple résistant constant." : ''}`,
    },
  ]
}
