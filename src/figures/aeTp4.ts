/**
 * Figures 4.1, 4.2 and 4.3 of the fascicule as block-diagram data, with the
 * role and transfer function of each block at the current values.
 */
import type { DBlock, DInfo, DSum, DText, DWire } from '../lib/diagram'
import type { TF } from '../engine/lti'
import { fmt } from '../lib/format'
import { eq, frac, math, mi, mn, mo, paren, poly, row, sub } from '../lib/mathml'

export interface Diagram {
  width: number
  height: number
  blocks: DBlock[]
  sums: DSum[]
  wires: DWire[]
  texts: DText[]
  info: Record<string, DInfo>
}

const pidFormula = (kp: number, ki: number, kd: number) =>
  math(
    eq(
      row(mi('C'), paren(mi('s'))),
      row(sub(mi('k'), mi('p')), mo('+'), frac(sub(mi('k'), mi('i')), mi('s')), mo('+'), sub(mi('k'), mi('d')), mi('s')),
      row(mn(kp, 6), mo('+'), frac(mn(ki, 6), mi('s')), mo('+'), mn(kd, 6), mi('s')),
    ),
    { display: true },
  )
const tfMath = (name: string, g: TF) => math(eq(row(mi(name), paren(mi('s'))), frac(poly(g.num), poly(g.den))), { display: true })

/** Figure 4.1: the PID built from three branches, and the PID Controller block. */
export function fig41(kp: number, ki: number, kd: number, N: number): Diagram {
  return {
    width: 560,
    height: 230,
    blocks: [
      { id: 'kp', x: 180, y: 22, w: 46, h: 36, label: 'kp', gain: true },
      { id: 'int', x: 86, y: 97, w: 56, h: 36, label: '1/s' },
      { id: 'ki', x: 180, y: 97, w: 46, h: 36, label: 'ki', gain: true },
      { id: 'der', x: 86, y: 172, w: 62, h: 36, label: 'du/dt' },
      { id: 'kd', x: 180, y: 172, w: 46, h: 36, label: 'kd', gain: true },
      { id: 'pidc', x: 420, y: 92, w: 110, h: 46, label: 'PID', sub: '(s)' },
    ],
    sums: [{ id: 'sum', x: 300, y: 115, signs: [['+', -14, -16], ['+', -18, 4], ['+', -14, 26]] }],
    wires: [
      { pts: [10, 115, 60, 115], arrow: false },
      { pts: [60, 115, 60, 40, 178, 40] },
      { pts: [60, 115, 84, 115] },
      { pts: [142, 115, 178, 115] },
      { pts: [60, 115, 60, 190, 84, 190] },
      { pts: [148, 190, 178, 190] },
      { pts: [226, 40, 300, 40, 300, 100] },
      { pts: [226, 115, 285, 115] },
      { pts: [226, 190, 300, 190, 300, 130] },
      { pts: [313, 115, 370, 115] },
      { pts: [390, 115, 418, 115] },
      { pts: [530, 115, 552, 115] },
    ],
    texts: [
      { x: 12, y: 106, text: 'ε', italic: true },
      { x: 475, y: 160, text: 'bloc PID Controller', anchor: 'middle' },
    ],
    info: {
      kp: { title: 'Action proportionnelle', text: `L'écart est multiplié par kp = ${fmt(kp, 6)} : la commande réagit tout de suite, proportionnellement à l'écart.` },
      int: { title: 'Intégrateur', text: "Il cumule l'écart dans le temps : tant qu'il reste un écart, la commande continue d'augmenter. C'est ce qui annule l'erreur statique." },
      ki: { title: 'Action intégrale', text: `Gain ki = ${fmt(ki, 6)} appliqué à l'intégrale de l'écart.` },
      der: { title: 'Dérivateur', text: "Il réagit à la vitesse de variation de l'écart : il anticipe et amortit. Une dérivée pure amplifie le bruit." },
      kd: { title: 'Action dérivée', text: `Gain kd = ${fmt(kd, 6)} appliqué à la dérivée de l'écart.` },
      sum: { title: 'Somme des trois actions', text: 'La commande est la somme des actions proportionnelle, intégrale et dérivée.', formula: pidFormula(kp, ki, kd) },
      pidc: {
        title: 'Bloc PID Controller de Simulink',
        text: `Il réalise les trois actions en un seul bloc, mais filtre la dérivée : kd·s devient kd·N·s/(s + N), ici N = ${fmt(N, 6)}. Sans dérivée (kd = 0), il donne exactement le même résultat que les trois branches.`,
        errata: 'E-AE14',
      },
    },
  }
}

/** Figure 4.2: the tank under PID control. */
export function fig42(kp: number, ki: number, kd: number, G: TF, consigne: number): Diagram {
  return {
    width: 600,
    height: 170,
    blocks: [
      { id: 'pid', x: 160, y: 46, w: 90, h: 40, label: 'PID' },
      { id: 'g', x: 320, y: 41, w: 130, h: 50, label: '', sub: `${fmt(G.num.at(-1)! / G.den.at(-1)!, 4)}/(${fmt(G.den[0] / G.den.at(-1)!, 4)}s+1)` },
    ],
    sums: [{ id: 'cmp', x: 86, y: 66, signs: [['+', -18, -12], ['−', -14, 30]] }],
    wires: [
      { pts: [8, 66, 71, 66] },
      { pts: [99, 66, 158, 66] },
      { pts: [250, 66, 318, 66] },
      { pts: [450, 66, 590, 66] },
      { pts: [520, 66, 520, 140, 86, 140, 86, 81] },
    ],
    texts: [
      { x: 8, y: 52, text: 'Qₑ(S)', italic: true },
      { x: 112, y: 52, text: 'ε', italic: true },
      { x: 560, y: 52, text: 'H(s)', italic: true, anchor: 'middle' },
    ],
    info: {
      cmp: {
        title: 'Comparateur',
        text: `Écart ε entre la consigne (${fmt(consigne, 4)} m) et la hauteur mesurée. La figure note la consigne Qₑ(S), un débit : c'est en fait une hauteur.`,
        errata: 'E-AE5',
      },
      pid: { title: 'Régulateur PID', text: `kp = ${fmt(kp, 6)}, ki = ${fmt(ki, 6)}, kd = ${fmt(kd, 6)}.`, formula: pidFormula(kp, ki, kd) },
      g: {
        title: 'Réservoir',
        text: `Gain statique ${fmt(G.num.at(-1)! / G.den.at(-1)!, 4)} m par unité de débit, constante de temps ${fmt(G.den[0] / G.den.at(-1)!, 4)} s.`,
        formula: tfMath('G', G),
      },
    },
  }
}

/** Figure 4.3: the DC motor (inner back-EMF loop) under PID speed control. */
export function fig43(p: { kp: number; ki: number; kd: number; L: number; R: number; J: number; f: number; kem: number; kc: number; Gm: TF; Cr: number; U: number }): Diagram {
  return {
    width: 760,
    height: 230,
    blocks: [
      { id: 'pid', x: 124, y: 46, w: 76, h: 40, label: 'PID' },
      { id: 'elec', x: 300, y: 44, w: 100, h: 44, label: '1/(Ls+R)' },
      { id: 'kc', x: 430, y: 48, w: 40, h: 36, label: 'kc', gain: true },
      { id: 'meca', x: 590, y: 44, w: 100, h: 44, label: '1/(Js+f)' },
      { id: 'ke', x: 360, y: 142, w: 46, h: 36, label: 'ke' },
    ],
    sums: [
      { id: 's1', x: 78, y: 66, signs: [['+', -18, -12], ['−', -14, 30]] },
      { id: 's2', x: 254, y: 66, signs: [['+', -18, -12], ['−', -14, 30]] },
      { id: 's3', x: 534, y: 66, signs: [['+', -18, -12], ['−', -14, 30]] },
    ],
    wires: [
      { pts: [8, 66, 63, 66] },
      { pts: [91, 66, 122, 66] },
      { pts: [200, 66, 239, 66] },
      { pts: [267, 66, 298, 66] },
      { pts: [400, 66, 428, 66] },
      { pts: [470, 66, 519, 66] },
      { pts: [534, 150, 534, 81] },
      { pts: [547, 66, 588, 66] },
      { pts: [690, 66, 750, 66] },
      { pts: [712, 66, 712, 160, 408, 160] },
      { pts: [360, 160, 254, 160, 254, 81] },
      { pts: [728, 66, 728, 212, 78, 212, 78, 81] },
    ],
    texts: [
      { x: 8, y: 52, text: 'U', italic: true },
      { x: 742, y: 52, text: 'Ω', italic: true, anchor: 'middle' },
      { x: 534, y: 168, text: 'cr', italic: true, anchor: 'middle' },
    ],
    info: {
      s1: { title: 'Comparateur de vitesse', text: `Écart entre la consigne U = ${fmt(p.U, 4)} rad/s et la vitesse Ω. U est une consigne de vitesse, pas une tension.`, errata: 'E-AE13' },
      pid: { title: 'Régulateur PID', text: 'Il fournit la tension appliquée au moteur.', formula: pidFormula(p.kp, p.ki, p.kd) },
      s2: { title: 'Tension utile', text: "Tension appliquée moins la force contre-électromotrice ke·Ω : c'est elle qui fait circuler le courant." },
      elec: {
        title: "Circuit d'induit",
        text: `I = (U − ke·Ω)/(Ls + R), avec L = ${fmt(p.L, 4)} H, R = ${fmt(p.R, 4)} Ω (constante électrique L/R = ${fmt(p.L / p.R, 3)} s).`,
        errata: 'E-AE7',
      },
      kc: { title: 'Constante de couple', text: `Couple moteur = kc·I, kc = ${fmt(p.kc, 4)} N·m/A.`, errata: 'E-AE8' },
      s3: { title: 'Couple résistant', text: `Le couple de charge cr = ${fmt(p.Cr, 4)} N·m s'oppose au couple moteur (valeur non donnée par l'énoncé).`, errata: 'E-AE12' },
      meca: {
        title: 'Partie mécanique',
        text: `Ω = (kc·I − cr)/(Js + f), J = ${fmt(p.J, 4)} kg·m², f = ${fmt(p.f, 4)} N·m·s/rad. Avec la boucle de f.c.e.m., le moteur seul (sans PID, cr = 0) vaut :`,
        formula: tfMath('Ω/U', p.Gm),
        errata: 'E-AE8',
      },
      ke: { title: 'Force contre-électromotrice', text: `Le moteur en rotation produit la tension ke·Ω, ke = ${fmt(p.kem, 4)} V·s/rad : c'est une boucle de retour physique, présente même sans régulateur.` },
    },
  }
}
