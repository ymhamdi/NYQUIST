/**
 * Proposed diagrams for Automatique TP2 (the fascicule has no figure for
 * it): the zero-order-hold demo of part II and the motor of part IV built
 * from equations (1)-(2).
 */
import type { TF } from '../engine/lti'
import { fmt } from '../lib/format'
import { eq, exp, frac, math, mi, mn, mo, paren, poly, row, sub } from '../lib/mathml'
import type { Diagram } from './aeTp4'

/** Sine Wave → Zero-Order Hold → Scope (part II). */
export function figZohChain(w: number, T: number): Diagram {
  return {
    width: 560,
    height: 110,
    blocks: [
      { id: 'sine', x: 20, y: 30, w: 110, h: 46, label: 'Sine Wave' },
      { id: 'zoh', x: 210, y: 30, w: 140, h: 46, label: 'Zero-Order Hold' },
      { id: 'scope', x: 430, y: 30, w: 100, h: 46, label: 'Scope' },
    ],
    sums: [],
    wires: [
      { pts: [130, 53, 208, 53] },
      { pts: [350, 53, 428, 53] },
      { pts: [170, 53, 170, 96, 400, 96, 400, 66, 428, 66] },
    ],
    texts: [],
    info: {
      sine: {
        title: 'Sine Wave',
        text: `Sinusoïde de pulsation ω = ${fmt(w, 4)} rad/s (le champ « Frequency » du bloc est en rad/s). L'énoncé écrit « fréquence 1 rad/sec » : c'est une pulsation, f = ω/2π.`,
        errata: 'E-AE16',
      },
      zoh: {
        title: "Bloqueur d'ordre zéro",
        text: `Il prélève x(kT) toutes les T = ${fmt(T, 4)} s et le maintient jusqu'à l'échantillon suivant.`,
        formula: math(eq(row(sub(mi('B'), mn(0)), paren(mi('s'))), frac(row(mn(1), mo('−'), exp(row(mo('−'), mi('s'), mi('T')))), mi('s'))), { display: true }),
      },
      scope: { title: 'Scope', text: 'Il affiche le signal continu et le signal bloqué (le second fil, vers la deuxième entrée).' },
    },
  }
}

/** The motor of part IV from equations (1)-(2): back-EMF loop, load torque, no controller. */
export function figMotorOpen(p: { L: number; R: number; J: number; f: number; kem: number; kc: number; Gm: TF; U: number; Cr: number }): Diagram {
  return {
    width: 700,
    height: 190,
    blocks: [
      { id: 'elec', x: 120, y: 44, w: 100, h: 44, label: '1/(Ls+R)' },
      { id: 'kc', x: 250, y: 48, w: 40, h: 36, label: 'kc', gain: true },
      { id: 'meca', x: 410, y: 44, w: 100, h: 44, label: '1/(Js+f)' },
      { id: 'kem', x: 260, y: 132, w: 50, h: 36, label: 'kem' },
    ],
    sums: [
      { id: 's1', x: 70, y: 66, signs: [['+', -18, -12], ['−', -14, 30]] },
      { id: 's2', x: 354, y: 66, signs: [['+', -18, -12], ['−', -14, 30]] },
    ],
    wires: [
      { pts: [8, 66, 55, 66] },
      { pts: [83, 66, 118, 66] },
      { pts: [220, 66, 248, 66] },
      { pts: [290, 66, 339, 66] },
      { pts: [354, 140, 354, 81] },
      { pts: [367, 66, 408, 66] },
      { pts: [510, 66, 690, 66] },
      { pts: [560, 66, 560, 150, 312, 150] },
      { pts: [260, 150, 70, 150, 70, 81] },
    ],
    texts: [
      { x: 8, y: 52, text: 'U', italic: true },
      { x: 680, y: 52, text: 'Ω', italic: true, anchor: 'middle' },
      { x: 354, y: 156, text: 'Cr', italic: true, anchor: 'middle' },
    ],
    info: {
      s1: { title: 'Tension utile', text: `U − kem·Ω : la tension d'alimentation (${fmt(p.U, 4)} V) moins la force contre-électromotrice.` },
      elec: { title: "Circuit d'induit — équation (1)", text: `I = (U − kem·Ω)/(Ls + R), L = ${fmt(p.L, 4)} H, R = ${fmt(p.R, 4)} Ω.`, errata: 'E-AE22' },
      kc: { title: 'Constante de couple', text: `Couple moteur kc·I, kc = ${fmt(p.kc, 4)} N·m/A.` },
      s2: { title: 'Couple résistant', text: `kc·I − Cr, avec Cr = ${fmt(p.Cr, 4)} N·m (non donné par l'énoncé).`, errata: 'E-AE24' },
      meca: {
        title: 'Partie mécanique — équation (2)',
        text: `Ω = (kc·I − Cr)/(Js + f), J = ${fmt(p.J, 4)} kg·m², f = ${fmt(p.f, 4)} N·m·s/rad. (L'équation écrite juste avant (2) a une erreur de signe.) Le moteur entier, Cr = 0 :`,
        formula: math(eq(frac(mi('Ω'), mi('U')), frac(mn(p.Gm.num.at(-1)!, 4), poly(p.Gm.den, 's', 4))), { display: true }),
        errata: 'E-AE21',
      },
      kem: { title: 'Force contre-électromotrice', text: `kem·Ω, kem = ${fmt(p.kem, 4)} V·s/rad : la boucle interne qui existe même sans régulateur.` },
    },
  }
}
