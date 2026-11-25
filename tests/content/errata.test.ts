/** The errata texts are computed (engine and script defaults): none may be broken. */
import { describe, expect, it } from 'vitest'
import { ERRATA_AE, ERRATA_TS } from '../../src/content/errata'

describe('errata', () => {
  it('every text is complete and every id unique', () => {
    const all = [...ERRATA_AE, ...ERRATA_TS]
    for (const e of all) for (const t of [e.where, e.says, e.issue, e.choice]) expect(t, e.id).not.toMatch(/NaN|undefined|Infinity|—\s|\[object/)
    expect(new Set(all.map((e) => e.id)).size).toBe(all.length)
  })
})
