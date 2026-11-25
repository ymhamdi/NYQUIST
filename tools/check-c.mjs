#!/usr/bin/env node
// Compiles the generated portable C (build/mcu/c, written by
// tests/engine/codegen.test.ts) with gcc in double precision, runs each test
// main and compares its output with what the engine (mcu.ts) expects.
// Floating point: |C − engine| ≤ 1e-12 × scale; fixed point: identical.
// Also compiles each file in float (what runs on the board) with -Werror.
// Usage: node tools/check-c.mjs [dir]   (needs gcc on the PATH, or CC=...)
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] ?? 'build/mcu/c'
const cc = process.env.CC ?? 'gcc'
const flags = ['-std=c99', '-Wall', '-Wextra', '-Werror']
let failed = 0
const cases = readdirSync(dir).filter((f) => f.endsWith('_expected.json')).map((f) => f.replace('_expected.json', ''))
if (!cases.length) {
  console.error(`check-c: no cases in ${dir} (run npx vitest run tests/engine/codegen.test.ts first)`)
  process.exit(1)
}
for (const name of cases) {
  const { exact, expected } = JSON.parse(readFileSync(join(dir, `${name}_expected.json`), 'utf8'))
  const exe = join(dir, `${name}_test`)
  execFileSync(cc, [...flags, '-c', join(dir, `${name}.c`), '-o', join(dir, `${name}.o`)])
  execFileSync(cc, [...flags, '-O2', '-DNYQ_REAL=double', join(dir, `${name}_test.c`), '-o', exe, '-lm'])
  const got = execFileSync(exe).toString().trim().split('\n').map(Number)
  const scale = Math.max(1, ...expected.map(Math.abs))
  let worst = 0
  let bad = got.length !== expected.length
  got.forEach((v, k) => {
    const d = Math.abs(v - expected[k])
    worst = Math.max(worst, d)
    if (exact ? d !== 0 : d > 1e-12 * scale) bad = true
  })
  if (bad) failed++
  console.log(`${bad ? 'FAIL' : 'ok  '} ${name.padEnd(18)} ${got.length} samples, max |C - engine| = ${worst.toExponential(2)}${exact ? ' (fixed point, must be 0)' : ''}`)
}
if (failed) {
  console.error(`check-c: ${failed} case(s) differ`)
  process.exit(1)
}
console.log(`check-c: ${cases.length} generated C files reproduce the engine`)
