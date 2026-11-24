/**
 * Two steps, run by CI (.github/workflows/octave-refs.yml):
 *   NYQ_VARIANTS=generate  writes build/variants/*.m (+ list.txt, manifest.json)
 *   (Octave runs them into build/variants-out/)
 *   NYQ_VARIANTS=compare   checks the engine against every Octave output
 * Without NYQ_VARIANTS, only the generator's own properties are checked.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parseParams } from '../../src/engine/matlabScript'
import { expectCell, type Tolerance } from '../helpers/reference'
import { makeVariants, MODELS, type Variant } from './variants'

const root = fileURLToPath(new URL('../../', import.meta.url))
const DIR = `${root}build/variants`
const OUT = `${root}build/variants-out`
const mode = process.env.NYQ_VARIANTS

/** Simulation-grid quantities (stepinfo) are compared at 1e-6. */
const GRID: Tolerance = { rel: 1e-6, abs: 1e-9 }
const GRID_VARS = /^(S|Sm)_|^info_|^variation_|^tr5_/
/**
 * "ecart_*" variables measure round-off (hand vs toolbox, ≈ 0); on an
 * unstable random setting the signals grow to 1e14 and the round-off itself
 * differs between FFTW/LAPACK and the engine, so they are not compared.
 */
const SKIP = /^ecart/

describe('slider variants of the scripts', () => {
  const variants = makeVariants(Number(process.env.NYQ_VARIANTS_PER_SCRIPT ?? 4))

  it('every variant keeps each value inside its range, on its step, or among its choices', () => {
    for (const v of variants) {
      for (const p of parseParams(v.source)) {
        const x = v.params[p.name]
        if (p.range && typeof x === 'number') {
          expect(x).toBeGreaterThanOrEqual(p.range.min)
          expect(x).toBeLessThanOrEqual(p.range.max)
        }
        if (p.choices) expect(p.choices).toContain(x)
        expect(p.value).toEqual(x) // the substituted script reads back the variant's value
      }
    }
  })

  it.runIf(mode === 'generate')('writes the variant scripts for Octave', () => {
    mkdirSync(DIR, { recursive: true })
    for (const v of variants) writeFileSync(`${DIR}/${v.name}.m`, v.source)
    writeFileSync(`${DIR}/list.txt`, variants.map((v) => `build/variants/${v.name}.m`).join('\n') + '\n')
    writeFileSync(`${DIR}/manifest.json`, JSON.stringify(variants.map(({ name, script, params }) => ({ name, script, params })), null, 1))
  })

  describe.runIf(mode === 'compare')('engine vs Octave at random slider positions', () => {
    const manifest: Omit<Variant, 'source'>[] = existsSync(`${DIR}/manifest.json`)
      ? JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'))
      : []
    it('Octave produced every variant', () => {
      expect(manifest.length).toBeGreaterThan(0)
      for (const v of manifest) expect(existsSync(`${OUT}/${v.name}.json`), v.name).toBe(true)
    })
    for (const v of manifest) {
      it(`${v.name} ${JSON.stringify(v.params)}`, () => {
        const ref = JSON.parse(readFileSync(`${OUT}/${v.name}.json`, 'utf8')).cells as Record<string, Record<string, unknown>>
        const out = MODELS[v.script](v.params)
        let compared = 0
        for (const [id, cell] of Object.entries(out)) {
          const kept = Object.fromEntries(Object.entries(cell).filter(([k]) => !SKIP.test(k)))
          if (!Object.keys(kept).some((k) => k in (ref[id] ?? {}))) continue
          const tolFor = Object.fromEntries(Object.keys(kept).filter((k) => GRID_VARS.test(k)).map((k) => [k, GRID]))
          compared += expectCell(kept, ref[id], `${v.name} ${id}`, { tolFor, minShared: 1 }).length
        }
        expect(compared).toBeGreaterThan(10)
      })
    }
  })
})
