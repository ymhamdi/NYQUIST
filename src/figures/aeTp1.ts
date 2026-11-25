/** Figure 1.6 of the fascicule as block-diagram data. */
import type { TF } from '../engine/lti'
import { fmt } from '../lib/format'
import { eq, frac, math, mi, mn, mo, paren, poly, row } from '../lib/mathml'
import type { Diagram } from './aeTp4'

export function fig16(G: TF, F: TF, Uf: number, tStep: number): Diagram {
  return {
    width: 640,
    height: 170,
    blocks: [
      { id: 'step', x: 14, y: 46, w: 70, h: 40, label: 'Step' },
      { id: 'tf', x: 190, y: 44, w: 130, h: 44, label: '', sub: `${fmt(G.num.at(-1)!, 4)}/(s+${fmt(G.den.at(-1)!, 4)})` },
      { id: 'mux', x: 420, y: 30, w: 16, h: 72, label: '' },
      { id: 'scope', x: 500, y: 44, w: 90, h: 44, label: 'Scope' },
    ],
    sums: [{ id: 'sum', x: 130, y: 66, signs: [['+', -18, -12], ['−', -14, 30]] }],
    wires: [
      { pts: [84, 66, 115, 66] },
      { pts: [143, 66, 188, 66] },
      { pts: [320, 66, 418, 66] },
      { pts: [100, 66, 100, 22, 400, 22, 400, 44, 418, 44] },
      { pts: [436, 66, 498, 66] },
      { pts: [370, 66, 370, 140, 130, 140, 130, 81] },
    ],
    texts: [{ x: 428, y: 120, text: 'Mux', anchor: 'middle' }],
    info: {
      step: { title: 'Step', text: `Échelon de valeur finale ${fmt(Uf, 4)}, appliqué à t = ${fmt(tStep, 4)} s (réglage par défaut du bloc : 1 s).` },
      sum: { title: 'Sum (+ −)', text: 'Il soustrait la sortie de l’échelon : la figure 1.6 ferme donc la boucle, ce que l’énoncé ne dit pas.', errata: 'E-AE15' },
      tf: {
        title: 'Transfer Fcn',
        text: `Numérateur [${fmt(G.num.at(-1)!, 4)}], dénominateur [1 ${fmt(G.den.at(-1)!, 4)}]. Seule, G a un gain statique de 1 ; avec le retour unitaire de la figure, le Scope montre :`,
        formula: math(eq(row(mi('F'), paren(mi('s'))), frac(row(mi('G'), paren(mi('s'))), row(mn(1), mo('+'), mi('G'), paren(mi('s')))), frac(mn(F.num.at(-1)!, 4), poly(F.den))), { display: true }),
      },
      mux: { title: 'Mux', text: 'Il regroupe l’échelon et la sortie sur un seul fil, pour les voir ensemble dans le Scope.' },
      scope: { title: 'Scope', text: 'Il trace l’échelon et la réponse.' },
    },
  }
}
