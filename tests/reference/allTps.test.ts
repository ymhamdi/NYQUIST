/**
 * Engine vs Octave for every TP script, at the script's own default
 * parameters. Each cell must share at least `min` variables with the
 * reference, so a renamed variable cannot silently skip its comparison.
 */
import { describe, expect, it } from 'vitest'
import { aeTp1 } from '../../src/engine/tp/aeTp1'
import { aeTp2 } from '../../src/engine/tp/aeTp2'
import { aeTp4 } from '../../src/engine/tp/aeTp4'
import { tsTp3 } from '../../src/engine/tp/tsTp3'
import { tsTp4 } from '../../src/engine/tp/tsTp4'
import { expectCell, loadReference, scriptDefaults, type Tolerance } from '../helpers/reference'

/** stepinfo values come from interpolation on a simulation grid: compare at 1e-6. */
const GRID: Tolerance = { rel: 1e-6, abs: 1e-9 }

interface Case {
  title: string
  script: string
  reference: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: (p: any) => Record<string, Record<string, unknown>>
  header: string
  min: Record<string, number>
  tolFor?: Record<string, Tolerance>
}

const STEPINFO_VARS = [
  'info_kp', 'info_ki', 'info_kd', 'variation_kp', 'variation_ki', 'variation_kd',
  'S_sans', 'S_avec', 'S_sans_5', 'S_avec_5', 'tr5_sans', 'tr5_avec',
  'info_kpm', 'info_kim', 'info_kdm', 'variation_kpm', 'variation_kim', 'variation_kdm',
  'Sm_sans', 'Sm_avec', 'Sm_sans_5', 'Sm_avec_5', 'tr5_m_sans', 'tr5_m_avec',
]

const CASES: Case[] = [
  {
    title: 'AE TP1',
    script: 'automatique/tp1_simulink_premier_ordre.m',
    reference: 'automatique_tp1_simulink_premier_ordre',
    model: aeTp1,
    header: 'TP1',
    min: { 'III.1': 14, 'III.2': 3 },
  },
  {
    title: 'AE TP2',
    script: 'automatique/tp2_discretisation.m',
    reference: 'automatique_tp2_discretisation',
    model: aeTp2,
    header: 'TP2',
    min: {
      'II.1': 9, 'II.2': 5, 'III.1': 1, 'III.2': 2, 'III.3': 2, 'III.4': 7, 'III.5': 6, 'III.6': 10,
      'IV.1': 16, 'IV.2': 5, 'IV.3': 6, 'IV.4': 4,
    },
  },
  {
    title: 'AE TP4',
    script: 'automatique/tp4_regulation_pid.m',
    reference: 'automatique_tp4_regulation_pid',
    model: aeTp4,
    header: 'TP4',
    min: { 'III.1': 18, 'III.2': 10, 'III.3': 3, 'III.4': 9, 'IV.5': 25, 'IV.6': 10, 'IV.7': 3, 'IV.8': 9 },
    tolFor: Object.fromEntries(STEPINFO_VARS.map((k) => [k, GRID])),
  },
  {
    title: 'TS TP3',
    script: 'signal/tp3_tfd.m',
    reference: 'signal_tp3_tfd',
    model: tsTp3,
    header: 'TP3',
    min: {
      Q1: 7, Q2: 3, Q3: 0, Q4: 4, Q5: 2, Q6: 3, Q7: 2, Q8: 8, Q9: 6, Q10: 4, Q11: 4, Q12: 13,
    },
  },
  {
    title: 'TS TP4',
    script: 'signal/tp4_filtres_numeriques.m',
    reference: 'signal_tp4_filtres_numeriques',
    model: tsTp4,
    header: 'TP4',
    min: {
      'I.1': 5, 'I.2': 2, 'I.3': 8, 'I.4': 9, 'I.5': 9, 'Hors-fascicule': 3, 'II.1': 8, 'II.2': 7, 'II.3': 3,
    },
  },
]

for (const c of CASES) {
  describe(`${c.title} engine vs Octave (default parameters of the script)`, () => {
    const ref = loadReference(c.reference)
    const out = c.model(scriptDefaults(c.script))

    it('covers every cell of the script', () => {
      const cells = Object.keys(ref).filter((id) => id !== c.header)
      expect(Object.keys(out).sort()).toEqual(cells.sort())
    })

    for (const id of Object.keys(c.min)) {
      it(`cell ${id}`, () => {
        const shared = expectCell(out[id], ref[id], `${c.title} ${id}`, { minShared: c.min[id], tolFor: c.tolFor })
        expect(shared.length).toBeGreaterThanOrEqual(c.min[id])
      })
    }
  })
}
