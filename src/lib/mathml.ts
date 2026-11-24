/**
 * A tiny MathML builder for formulas that contain live numbers
 * (G(z) = 0,0952/(z − 0,9048) at the current T). Browsers render MathML
 * natively, so no math library is shipped to the client. Static formulas
 * are pre-rendered at build time instead (src/lib/tex.ts).
 */
import { fmt } from './format'

export type MathNode = string

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export const mi = (s: string, normal = false): MathNode => (normal ? `<mi mathvariant="normal">${esc(s)}</mi>` : `<mi>${esc(s)}</mi>`)
export const mo = (s: string): MathNode => `<mo>${esc(s)}</mo>`
export const mtext = (s: string): MathNode => `<mtext>${esc(s)}</mtext>`
export const mn = (v: number | string, digits = 4): MathNode => {
  const s = typeof v === 'number' ? fmt(v, digits) : v
  return s.startsWith('−') ? `<mo>−</mo><mn>${esc(s.slice(1))}</mn>` : `<mn>${esc(s)}</mn>`
}
export const row = (...xs: MathNode[]): MathNode => `<mrow>${xs.join('')}</mrow>`
export const frac = (a: MathNode, b: MathNode): MathNode => `<mfrac>${row(a)}${row(b)}</mfrac>`
export const sub = (a: MathNode, b: MathNode): MathNode => `<msub>${row(a)}${row(b)}</msub>`
export const sup = (a: MathNode, b: MathNode): MathNode => `<msup>${row(a)}${row(b)}</msup>`
export const paren = (...xs: MathNode[]): MathNode => row(mo('('), ...xs, mo(')'))
export const abs = (...xs: MathNode[]): MathNode => row(mo('|'), ...xs, mo('|'))
export const sqrt = (...xs: MathNode[]): MathNode => `<msqrt>${xs.join('')}</msqrt>`
export const eq = (...xs: MathNode[]): MathNode => xs.join(mo('='))

/** z − p, written z + |p| when p < 0 */
export function minus(v: MathNode, p: number, digits = 4): MathNode {
  return p >= 0 ? row(v, mo('−'), mn(p, digits)) : row(v, mo('+'), mn(-p, digits))
}

/** e^{x} */
export const exp = (x: MathNode): MathNode => sup(mi('e', true), x)

/** A complete <math> element; `display` for a block formula. */
export function math(body: MathNode, opts: { display?: boolean; label?: string } = {}): string {
  const disp = opts.display ? ' display="block"' : ''
  const label = opts.label ? ` aria-label="${esc(opts.label)}"` : ''
  return `<math${disp}${label}>${body}</math>`
}
