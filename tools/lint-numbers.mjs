#!/usr/bin/env node
// "Every number on screen comes from the engine": flags numbers typed by hand
// in the French prose of the pages (.svelte / .astro templates and their
// prose attributes) and in the errata explanations (src/content/errata.ts,
// fields issue and choice; the field says quotes the handout).
// Ignored: {expressions} and ${...} (engine values), <script>, <style>,
// frontmatter, <q> (verbatim handout quotes), <code>, <pre>, <math>, <svg>,
// references (TP3, figure 4.1, Tableau 2.1, E-AE7, Q9, p. 16, IIA 3/1, and
// ranges like "figures 1.1 à 1.5") and single digits (conventions: z = 1,
// −3 dB, Fe/2, 2 %). Handout data that is neither (a constant inside a
// formula, a section number) is listed in lint-numbers.allow.json.
// Usage: node tools/lint-numbers.mjs   (exit 1 when something is flagged)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOTS = ['src/components', 'src/pages', 'src/layouts']
const ERRATA = 'src/content/errata.ts'
const PROSE_ATTRS = ['label', 'prompt', 'title', 'summary', 'note', 'description', 'caption', 'placeholder', 'aria-label', 'xLabel', 'yLabel', 'valuesNote']
const allow = JSON.parse(readFileSync(new URL('./lint-numbers.allow.json', import.meta.url), 'utf8'))

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : /\.(svelte|astro)$/.test(f) ? [p] : []
  })
}

/** Replaces a region by spaces, keeping newlines (so line numbers stay right). */
const blank = (s) => s.replace(/[^\n]/g, ' ')

/** Blanks every balanced {...} expression, aware of quotes and template literals. */
function blankExpressions(src, open = '{') {
  const out = src.split('')
  let i = 0
  while (i < src.length) {
    if (!src.startsWith(open, i)) {
      i++
      continue
    }
    const start = i
    i += open.length - 1
    let depth = 0
    let quote = null
    const tpl = [] // template-literal nesting: brace depth at which each ${ opened
    for (; i < src.length; i++) {
      const c = src[i]
      if (quote) {
        if (c === '\\') i++
        else if (quote === '`' && c === '$' && src[i + 1] === '{') {
          tpl.push(depth)
          depth++
          i++
          quote = null
        } else if (c === quote) quote = null
        continue
      }
      if (c === '"' || c === "'" || c === '`') quote = c
      else if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (tpl.length && depth === tpl[tpl.length - 1]) {
          tpl.pop()
          quote = '`'
        } else if (depth === 0) break
      }
    }
    for (let k = start; k <= i && k < src.length; k++) if (out[k] !== '\n') out[k] = ' '
    i++
  }
  return out.join('')
}

function templateProse(src, astro) {
  let s = src
  if (astro) s = s.replace(/^---[\s\S]*?\n---/, blank)
  for (const tag of ['script', 'style', 'q', 'code', 'pre', 'math', 'svg']) {
    s = s.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, 'g'), blank)
  }
  s = s.replace(/<!--[\s\S]*?-->/g, blank)
  s = blankExpressions(s)
  // tags: keep only the values of prose attributes
  return s.replace(/<[^>]*>/g, (tag) => {
    const kept = []
    for (const m of tag.matchAll(/([\w:-]+)="([^"]*)"/g)) if (PROSE_ATTRS.includes(m[1])) kept.push(m[2])
    const text = kept.join(' ')
    return text + blank(tag.slice(text.length))
  })
}

/** errata.ts: only the strings of the fields issue and choice, ${...} blanked. */
function errataProse(src) {
  return src
    .split('\n')
    .map((line) => {
      const parts = []
      for (const m of line.matchAll(/\b(issue|choice): (`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)) parts.push(blankExpressions(m[2].slice(1, -1), '${'))
      return parts.join(' | ')
    })
    .join('\n')
}

// references and identifiers that contain numbers but are not results
const REF_CASE = /(?:TP|E-AE|E-TS|Q|IIA|R20\d\d[ab]?|n°)\s*$/
const REF_WORD = /(?:\b(?:parties?|figures?|tableaux?|tableau|questions?|cellules?|ordre|p|fig)\.?)\s*$/i
const RANGE = /(?:\b(?:parties?|figures?|tableaux?|questions?)|TP|E-AE|E-TS|Q)\s*\d+(?:[.,]\d+)?\s*(?:à|et|,|-|–)\s*$/i
const NUMBER = /(?<![\w\-−./])[−-]?\d+(?:[.,]\d+)?(?![\w])/g

let flagged = 0
function check(file, text, src) {
  const lines = text.split('\n')
  const srcLines = src.split('\n')
  lines.forEach((line, n) => {
    for (const m of line.matchAll(NUMBER)) {
      const v = m[0].replace('−', '-')
      if (/^-?\d$/.test(v)) continue // single digit: a convention (z = 1, Fe/2, 2 %)
      const before = line.slice(0, m.index)
      if (REF_CASE.test(before) || REF_WORD.test(before) || RANGE.test(before)) continue
      const context = srcLines[n] ?? ''
      if (allow.some((a) => a.file === file && context.includes(a.text))) continue
      flagged++
      console.log(`${file}:${n + 1}: "${m[0]}" in: …${line.slice(Math.max(0, m.index - 50), m.index + 40).trim()}…`)
    }
  })
}

for (const root of ROOTS) {
  for (const f of files(root)) {
    const src = readFileSync(f, 'utf8')
    check(f.replace(/\\/g, '/'), templateProse(src, f.endsWith('.astro')), src)
  }
}
const errata = readFileSync(ERRATA, 'utf8')
check(ERRATA, errataProse(errata), errata)

if (flagged) {
  console.error(`lint-numbers: ${flagged} number(s) typed in the prose; take them from the engine, or quote the handout in <q>`)
  process.exit(1)
}
console.log('lint-numbers: no hand-typed number in the prose')
