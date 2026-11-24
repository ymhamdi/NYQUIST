/**
 * Reads the TP scripts themselves: their "%%" cells and their tunable
 * values, tagged on their own line as
 *
 *   T = 0.1;   % @param T [s] 0.01..3 période d'échantillonnage …
 *   L = 0.011; % @param L [H] {0.011, 0.000011} inductance …
 *
 * (unit in brackets, then a range min..max[/step] or a set of choices, then
 * a description). `substitute` rewrites the values in place, so the code
 * shown on the site is the submitted script with the current slider values.
 */

export type ParamValue = number | number[]

export interface ParamSpec {
  name: string
  value: ParamValue
  /** 0-based line index in the script */
  line: number
  unit?: string
  range?: { min: number; max: number; step?: number }
  choices?: number[]
  description: string
}

export interface Cell {
  /** handout number: first word after "%%" */
  id: string
  /** rest of the "%%" line */
  title: string
  /** 0-based index of the "%%" line */
  start: number
  /** 0-based index of the last line of the cell (inclusive) */
  end: number
}

const PARAM_LINE =
  /^(\s*)([A-Za-z]\w*)(\s*=\s*)([^;%]+?)(\s*;)(\s*)%\s*@param\s+(\w+)(?:\s+\[([^\]]+)\])?(?:\s+(\{[^}]*\}|-?[\d.eE+-]+\.\.-?[\d.eE+-]+(?:\/[\d.eE+-]+)?))?\s*(.*)$/

export function parseValue(text: string): ParamValue {
  const t = text.trim()
  if (t.startsWith('[')) {
    const body = t.replace(/^\[|\]$/g, '').trim()
    if (!body) return []
    return body.split(/[\s,]+/).map(parseNumber)
  }
  return parseNumber(t)
}

function parseNumber(s: string): number {
  const v = Number(s)
  if (!Number.isFinite(v)) throw new Error(`not a numeric literal: ${s}`)
  return v
}

export function parseParams(source: string): ParamSpec[] {
  const lines = source.replace(/\r/g, '').split('\n')
  const out: ParamSpec[] = []
  lines.forEach((line, i) => {
    const m = PARAM_LINE.exec(line)
    if (!m) return
    const [, , name, , rhs, , , tagName, unit, constraint, description] = m
    if (name !== tagName) throw new Error(`line ${i + 1}: @param ${tagName} on the line of ${name}`)
    const spec: ParamSpec = { name, value: parseValue(rhs), line: i, description: description.trim() }
    if (unit) spec.unit = unit
    if (constraint?.startsWith('{')) spec.choices = constraint.slice(1, -1).split(',').map((s) => parseNumber(s))
    else if (constraint) {
      const [bounds, step] = constraint.split('/')
      const [min, max] = bounds.split('..').map(parseNumber)
      spec.range = step ? { min, max, step: parseNumber(step) } : { min, max }
    }
    out.push(spec)
  })
  return out
}

/** Default values of a script, by parameter name. */
export function defaults(source: string): Record<string, ParamValue> {
  return Object.fromEntries(parseParams(source).map((p) => [p.name, p.value]))
}

/** Shortest decimal that reads back as the same double (what MATLAB needs to reproduce a plot). */
export function formatMatlab(v: ParamValue): string {
  if (Array.isArray(v)) return `[${v.map((x) => formatMatlab(x)).join(' ')}]`
  if (Object.is(v, -0)) return '0'
  return String(v)
}

/** The script with the right-hand side of every tagged line replaced by `values[name]`. */
export function substitute(source: string, values: Record<string, ParamValue>): string {
  const eol = source.includes('\r\n') ? '\r\n' : '\n'
  return source
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => {
      const m = PARAM_LINE.exec(line)
      if (!m || !(m[2] in values)) return line
      const [, indent, name, eq, rhs, semi] = m
      const before = indent + name + eq + rhs + semi
      const after = line.slice(before.length)
      const next = indent + name + eq + formatMatlab(values[name]) + semi
      // keep the comment column when the new value fits
      const pad = Math.max(1, before.length + after.length - after.trimStart().length - next.length)
      return next + ' '.repeat(pad) + after.trimStart()
    })
    .join(eol)
}

/** "%%" cells, with the 0-based lines they span. Local functions after the last cell are excluded. */
export function splitCells(source: string): Cell[] {
  const lines = source.replace(/\r/g, '').split('\n')
  const firstFunction = lines.findIndex((l) => /^function\s/.test(l))
  const last = firstFunction >= 0 ? firstFunction - 1 : lines.length - 1
  const cells: Cell[] = []
  for (let i = 0; i <= last; i++) {
    const m = /^\s*%%\s*(\S+)\s*(.*)$/.exec(lines[i])
    if (!m) continue
    if (cells.length) cells[cells.length - 1].end = i - 1
    cells.push({ id: m[1], title: m[2], start: i, end: last })
  }
  for (const c of cells) while (c.end > c.start && lines[c.end].trim() === '') c.end--
  return cells
}

/** Source lines of one cell (by handout number). */
export function cellSource(source: string, id: string): string {
  const cell = splitCells(source).find((c) => c.id === id)
  if (!cell) throw new Error(`no cell ${id}`)
  return source.replace(/\r/g, '').split('\n').slice(cell.start, cell.end + 1).join('\n')
}
