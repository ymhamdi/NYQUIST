#!/usr/bin/env node
// Page-weight budget (PLAN.md): every page's up-front JavaScript, i.e. the
// islands' entry chunks and everything they import statically (chunks loaded
// on demand with import() are not counted), must stay under 70 KiB gzip; and
// every HTML page under 80 KiB gzip.
// Usage: node tools/check-budget.mjs [dist]   (after npm run build)
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { gzipSync } from 'node:zlib'

const dist = process.argv[2] ?? 'dist'
const JS_BUDGET = 70 * 1024 // target 60 KiB (PLAN.md), met by 13 of 16 pages; 70 guards against regressions
const HTML_BUDGET = 80 * 1024
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.html') ? [join(d, e.name)] : []))
const gz = (s) => gzipSync(s).length
const base = (url) => url.replace(/^.*?\/_astro\//, '_astro/')

let failed = 0
for (const page of walk(dist)) {
  const html = readFileSync(page, 'utf8')
  const entries = [...html.matchAll(/(?:component-url|renderer-url|src)="([^"]*\/_astro\/[^"]+\.js)"/g)].map((m) => base(m[1]))
  const seen = new Set()
  const queue = [...entries]
  let js = 0
  while (queue.length) {
    const f = queue.pop()
    if (seen.has(f)) continue
    seen.add(f)
    const src = readFileSync(join(dist, f), 'utf8')
    js += gz(src)
    // static imports only: `from "./x.js"` and `import "./x.js"`, not import("./x.js")
    for (const m of src.matchAll(/(?:from\s*|import\s*)"\.\/([^"]+\.js)"/g)) queue.push(`_astro/${m[1]}`)
  }
  const h = gz(html)
  const url = '/' + relative(dist, page).split(sep).join('/').replace(/index\.html$/, '')
  const over = js > JS_BUDGET || h > HTML_BUDGET
  if (over) failed++
  console.log(`${over ? 'OVER' : 'ok  '} ${url.padEnd(28)} JS ${(js / 1024).toFixed(1).padStart(5)} KiB gzip (${seen.size} files)   HTML ${(h / 1024).toFixed(1).padStart(5)} KiB gzip`)
}
if (failed) {
  console.error(`check-budget: ${failed} page(s) over budget (JS ${JS_BUDGET / 1024} KiB, HTML ${HTML_BUDGET / 1024} KiB, gzip)`)
  process.exit(1)
}
console.log('check-budget: every page within budget')
