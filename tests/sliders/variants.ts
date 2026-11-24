/**
 * "The code follows the sliders", tested: random slider positions (within
 * each @param range) are written into copies of the TP scripts with the same
 * `substitute` the site uses; GNU Octave runs them (CI), and the engine must
 * reproduce every result at those positions.
 */
import { aeTp1 } from '../../src/engine/tp/aeTp1'
import { aeTp2 } from '../../src/engine/tp/aeTp2'
import { aeTp3 } from '../../src/engine/tp/aeTp3'
import { aeTp4 } from '../../src/engine/tp/aeTp4'
import { tsTp3 } from '../../src/engine/tp/tsTp3'
import { tsTp4 } from '../../src/engine/tp/tsTp4'
import { parseParams, substitute, type ParamValue } from '../../src/engine/matlabScript'
import { loadScript } from '../helpers/reference'

export interface Variant {
  /** output name, also the .m file name (without extension) */
  name: string
  script: string
  params: Record<string, ParamValue>
  source: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MODELS: Record<string, (p: any) => Record<string, Record<string, unknown>>> = {
  'automatique/tp1_simulink_premier_ordre.m': aeTp1,
  'automatique/tp2_discretisation.m': aeTp2,
  'automatique/tp3_stabilite_precision.m': aeTp3,
  'automatique/tp4_regulation_pid.m': aeTp4,
  'signal/tp3_tfd.m': tsTp3,
  'signal/tp4_filtres_numeriques.m': tsTp4,
}

/** Mulberry32: small seeded PRNG, so a failing variant can be reproduced. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A value a slider could show: on the step grid, or rounded to 3 significant digits. */
function sliderValue(min: number, max: number, step: number | undefined, u: number): number {
  const v = min + u * (max - min)
  if (step) return Number((min + Math.round((v - min) / step) * step).toFixed(10))
  return Number(v.toPrecision(3))
}

/**
 * Variant k of script i always gets the seed seed + 1000·i + k, whatever the
 * number of variants requested: the CI's variants are a subset of a larger
 * local run, and a failing variant is reproducible by its name.
 */
export function makeVariants(perScript = 4, seed = 20261124): Variant[] {
  const out: Variant[] = []
  Object.keys(MODELS).forEach((script, i) => {
    const source = loadScript(script)
    const specs = parseParams(source)
    for (let k = 1; k <= perScript; k++) {
      const rand = rng(seed + 1000 * i + k)
      const params: Record<string, ParamValue> = {}
      for (const p of specs) {
        if (p.choices) params[p.name] = p.choices[Math.floor(rand() * p.choices.length)]
        else if (p.range && typeof p.value === 'number') params[p.name] = sliderValue(p.range.min, p.range.max, p.range.step, rand())
        else params[p.name] = p.value
      }
      const name = `${script.replace(/\//g, '__').replace(/\.m$/, '')}__v${k}`
      out.push({ name, script, params, source: substitute(source, params) })
    }
  })
  return out
}
