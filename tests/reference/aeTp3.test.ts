import { describe, expect, it } from 'vitest'
import { aeTp3, type AeTp3Params } from '../../src/engine/tp/aeTp3'
import { expectCell, loadReference, scriptDefaults } from '../helpers/reference'

const SCRIPT = 'automatique/tp3_stabilite_precision.m'
const ref = loadReference('automatique_tp3_stabilite_precision')
const params = scriptDefaults<AeTp3Params>(SCRIPT)
const out = aeTp3(params)

describe('AE TP3 engine vs Octave (default parameters of the script)', () => {
  it('uses the defaults written in the script', () => {
    expect(params).toEqual(expect.objectContaining({ T: 0.1, K: 1, T_r: 5, K_r: 1, consigne: 2, eps_tol: 0.02 }))
  })

  // every cell of the reference must be covered by the engine
  it('covers every cell of the script', () => {
    const cells = Object.keys(ref).filter((id) => id !== 'TP3')
    expect(cells.sort()).toEqual(Object.keys(out).sort())
  })

  it('the comparison is not vacuous: T off by 0.1 % is caught', () => {
    const wrong = aeTp3({ ...params, T: params.T * 1.001 })
    expect(() => expectCell(wrong['II.7'], ref['II.7'], 'II.7')).toThrow()
    expect(() => expectCell(wrong['II.4'], ref['II.4'], 'II.4')).toThrow()
  })

  const minShared: Record<string, number> = {
    'II.3': 5, 'II.4': 5, 'II.5': 5, 'II.6': 11, 'II.7': 7,
    'III.1': 5, 'III.2': 4, 'III.3': 6, 'III.4': 7, 'III.5': 4, 'III.6': 3,
  }
  for (const id of Object.keys(minShared)) {
    it(`cell ${id}`, () => {
      expectCell(out[id as keyof typeof out] as Record<string, unknown>, ref[id], id, { minShared: minShared[id] })
    })
  }
})
