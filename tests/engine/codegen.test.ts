/**
 * Generated C code. Writes every case to build/mcu/: portable C with a test
 * main and the outputs mcu.ts expects, Arduino sketches and STM32 files.
 * tools/check-c.mjs then compiles the portable C with gcc (double precision)
 * and requires it to reproduce mcu.ts sample by sample (fixed point: exactly);
 * CI also compiles the sketches (arduino-cli) and the STM32 files
 * (arm-none-eabi-gcc).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { avrTimer1, cNumber, generateC, type FilterSpec, type PidSpec, type Spec } from '../../src/engine/codegen'
import { dfInit, dfStep, dfStepFixed, normalize, pidInit, pidStep, qIntBits, quantize } from '../../src/engine/mcu'

const OUT = 'build/mcu'

const PIDS: PidSpec[] = [
  {
    kind: 'pid', name: 'reservoir', title: "Hauteur d'eau du réservoir (TP4)", gains: { kp: 1, ki: 0.02, kd: 0, N: 100, Ts: 0.5 },
    limits: { umin: 0, umax: 0.3 }, antiWindup: true, setpoint: 2, measure: 'hauteur H (m)', command: 'débit Qe',
  },
  {
    kind: 'pid', name: 'moteur', title: 'Vitesse du moteur (TP4)', gains: { kp: 2, ki: 60, kd: 0.02, N: 100, Ts: 1e-3 },
    limits: { umin: -200, umax: 200 }, antiWindup: true, setpoint: 10, measure: 'vitesse (rad/s)', command: 'tension (V)',
  },
  {
    kind: 'pid', name: 'sans_antiwindup', title: 'PI saturé sans anti-windup', gains: { kp: 0.8, ki: 3, kd: 0, N: 100, Ts: 0.05 },
    limits: { umin: -1, umax: 1 }, antiWindup: false, setpoint: 1, measure: 'sortie', command: 'commande',
  },
  {
    kind: 'pid', name: 'proportionnel', title: 'Contrôleur proportionnel (TP3)', gains: { kp: 1, ki: 0, kd: 0, N: 100, Ts: 5 },
    limits: null, antiWindup: false, setpoint: 2, measure: 'hauteur H (m)', command: 'débit Qe',
  },
]
const RII = { b: [0.079, 0.158, 0.079], a: [1, -1.2, 0.516] }
const FILTERS: FilterSpec[] = [
  { kind: 'filter', name: 'rii', title: 'Passe-bas RII (TP4)', ...RII, Fe: 1000, frac: null },
  { kind: 'filter', name: 'rii_q14', title: 'Passe-bas RII, Q1.14', ...RII, Fe: 1000, frac: 15 - qIntBits([...RII.b, ...RII.a]) },
  { kind: 'filter', name: 'rii_q8', title: 'Passe-bas RII, 8 bits fractionnaires', ...RII, Fe: 1000, frac: 8 },
  { kind: 'filter', name: 'h1', title: 'H1 du TP4', b: [0, 1, -0.3], a: [1, -1.3, 0.7], Fe: 100, frac: null },
]

const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1
const arr = (xs: number[]) => `{ ${xs.map(cNumber).join(', ')} }`

/** Inputs, expected outputs and the C test main of one case. */
function testCase(s: Spec) {
  const r = rnd(s.name.length * 977)
  const n = 400
  if (s.kind === 'pid') {
    // setpoint steps and a noisy measurement, large enough to hit both limits
    const sp = Array.from({ length: n }, (_, k) => (k < 150 ? 1 : k < 300 ? -1 : 0.3) * (s.limits ? (s.limits.umax - s.limits.umin) * 2 : 3))
    const me = Array.from({ length: n }, () => r() * 0.5)
    const st = pidInit()
    const expected = sp.map((v, k) => pidStep(st, v, me[k], s.gains, s.limits, s.antiWindup))
    const main = `#include "${s.name}.c"
#include <stdio.h>
static const double sp[${n}] = ${arr(sp)};
static const double me[${n}] = ${arr(me)};
int main(void) {
  ${s.name}_etat_t s = {0};
  int k;
  for (k = 0; k < ${n}; k++) printf("%.17g\\n", (double)${s.name}_pas(&s, sp[k], me[k]));
  return 0;
}
`
    return { expected, main, exact: false }
  }
  const { b, a } = normalize(s.b, s.a)
  if (s.frac === null) {
    const x = Array.from({ length: n }, r)
    const st = dfInit(b, a)
    const expected = x.map((v) => dfStep(st, b, a, v))
    const main = `#include "${s.name}.c"
#include <stdio.h>
static const double x[${n}] = ${arr(x)};
int main(void) {
  ${s.name}_etat_t s = {0};
  int k;
  for (k = 0; k < ${n}; k++) printf("%.17g\\n", (double)${s.name}_pas(&s, x[k]));
  return 0;
}
`
    return { expected, main, exact: false }
  }
  const x = Array.from({ length: n }, () => Math.round(r() * 12000))
  const bq = quantize(b, s.frac).ints
  const aq = quantize(a, s.frac).ints
  const st = dfInit(bq, aq)
  const expected = x.map((v) => dfStepFixed(st, bq, aq, s.frac!, v))
  const main = `#include "${s.name}.c"
#include <stdio.h>
static const int16_t x[${n}] = { ${x.join(', ')} };
int main(void) {
  ${s.name}_etat_t s = {0};
  int k;
  for (k = 0; k < ${n}; k++) printf("%d\\n", (int)${s.name}_pas(&s, x[k]));
  return 0;
}
`
  return { expected, main, exact: true }
}

describe('generated C', () => {
  const all: Spec[] = [...PIDS, ...FILTERS]
  mkdirSync(join(OUT, 'c'), { recursive: true })
  mkdirSync(join(OUT, 'stm32'), { recursive: true })

  it('writes every target for every case (CI compiles the Arduino and STM32 files)', () => {
    for (const s of all) {
      for (const target of ['c', 'arduino', 'stm32'] as const) {
        const g = generateC(s, target)
        expect(g.code).not.toMatch(/NaN|undefined|Infinity/)
        expect(g.code.split('{').length).toBe(g.code.split('}').length)
        if (target === 'arduino') {
          mkdirSync(join(OUT, 'arduino', s.name), { recursive: true })
          writeFileSync(join(OUT, 'arduino', s.name, g.filename), g.code)
        } else writeFileSync(join(OUT, target, g.filename), g.code)
      }
    }
  })

  it('Timer1 settings of the Arduino Uno', () => {
    expect(avrTimer1(1e-3)).toMatchObject({ prescaler: 1, ocr: 15999, divider: 1 })
    expect(avrTimer1(0.5)).toMatchObject({ prescaler: 256, ocr: 31249, divider: 1 })
    const t = avrTimer1(5)
    expect(t.divider).toBe(2)
    expect(Math.abs(t.error)).toBeLessThan(1e-4)
  })

  it('writes a test main and the expected outputs for each case', () => {
    for (const s of all) {
      const { expected, main, exact } = testCase(s)
      writeFileSync(join(OUT, 'c', `${s.name}_test.c`), main)
      writeFileSync(join(OUT, 'c', `${s.name}_expected.json`), JSON.stringify({ exact, expected }))
      expect(expected.every(Number.isFinite)).toBe(true)
    }
  })

  it('the portable file is what the test compiles', () => {
    const code = readFileSync(join(OUT, 'c', 'reservoir.c'), 'utf8')
    expect(code).toContain('static inline nyq_real reservoir_pas(')
    expect(code).toContain('anti-windup')
  })
})
