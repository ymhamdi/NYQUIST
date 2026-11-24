/**
 * Number formatting for the French UI: decimal comma, thin no-break space
 * between thousands, a true minus sign. Code and MATLAB values keep the
 * dot (see matlabScript.formatMatlab).
 */
const NBSP = ' '

/** `digits` significant digits, trailing zeros removed: 0.904837 → "0,9048", 20.0167 → "20,02". */
export function fmt(v: number, digits = 4): string {
  if (Number.isNaN(v)) return '—'
  if (v === Infinity) return '∞'
  if (v === -Infinity) return '−∞'
  if (v === 0 || Math.abs(v) < 1e-12) return '0'
  const a = Math.abs(v)
  let s: string
  if (a >= 1e6 || a < 1e-4) {
    const [m, e] = v.toExponential(digits - 1).split('e')
    s = `${trimZeros(m)}·10${superscript(Number(e))}`
    return s.replace('-', '−').replace('.', ',')
  }
  const decimals = Math.max(0, digits - 1 - Math.floor(Math.log10(a)))
  s = trimZeros(v.toFixed(Math.min(decimals, 12)))
  const [int, frac] = s.replace('-', '−').split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) // thousands, integer part only
  return frac === undefined ? grouped : `${grouped},${frac}`
}

/** Fixed number of decimals, French style. */
export function fixed(v: number, decimals: number): string {
  if (!Number.isFinite(v)) return fmt(v)
  const s = (Math.abs(v) < 0.5 * 10 ** -decimals ? 0 : v).toFixed(decimals)
  return s.replace('-', '−').replace('.', ',')
}

/** "12,5 %" */
export const pct = (v: number, digits = 3) => `${fmt(v, digits)}${NBSP}%`

/** "0,1 s" */
export const withUnit = (v: number, unit: string, digits = 4) => (unit ? `${fmt(v, digits)}${NBSP}${unit}` : fmt(v, digits))

function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s
}

const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
const superscript = (e: number) => String(e).split('').map((c) => SUP[c] ?? c).join('')
