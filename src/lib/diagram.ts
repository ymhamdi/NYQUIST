/** Declarative description of a block diagram (see components/BlockDiagram.svelte). */
export interface DBlock {
  id: string
  x: number
  y: number
  w: number
  h: number
  /** main text, shown in italics if `math` */
  label: string
  /** smaller text after the label (subscript, parentheses…) */
  sub?: string
  /** a triangle (gain) instead of a rectangle */
  gain?: boolean
}
export interface DSum {
  id: string
  x: number
  y: number
  /** sign labels around the junction: [text, dx, dy] */
  signs?: [string, number, number][]
}
export interface DWire {
  /** polyline points [x, y, x, y, …] */
  pts: number[]
  arrow?: boolean
}
export interface DText {
  x: number
  y: number
  text: string
  italic?: boolean
  anchor?: 'start' | 'middle' | 'end'
}
export interface DInfo {
  title: string
  text: string
  /** MathML (display) */
  formula?: string
  errata?: string
}
