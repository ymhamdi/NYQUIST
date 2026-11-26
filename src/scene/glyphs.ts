/**
 * Card glyphs, computed at build time from the engine and the TP models:
 * each is a small SVG description (paths, stems, bars) of the TP's main
 * concept. The pages render them statically; CSS animates them on hover or
 * focus (nothing ships to the browser but the SVG).
 */
import aeTp2Source from '../../matlab/automatique/tp2_discretisation.m?raw'
import aeTp3Source from '../../matlab/automatique/tp3_stabilite_precision.m?raw'
import aeTp4Source from '../../matlab/automatique/tp4_regulation_pid.m?raw'
import tsTp4Source from '../../matlab/signal/tp4_filtres_numeriques.m?raw'
import { fft, freqz, conv } from '../engine/dsp'
import { c2dZoh, feedback, gain, pid, poles, series, stepContinuous, tf } from '../engine/lti'
import { defaults } from '../engine/matlabScript'
import { linspace } from '../engine/stepinfo'
import { aeTp2, type AeTp2Params } from '../engine/tp/aeTp2'
import { aeTp4Motor } from '../engine/tp/aeTp4'
import { tsTp4, type TsTp4Params } from '../engine/tp/tsTp4'

export const GW = 120
export const GH = 64
const PAD = 6

export interface Glyph {
  /** smooth curves; `draw` ones are traced on hover */
  paths: { d: string; cls: string }[]
  /** stems or bars, grown on hover one after the other */
  bars: { x: number; y: number; w: number; h: number; cls: string; i: number }[]
  dots: { cx: number; cy: number; r: number; cls: string; i: number }[]
  /** horizontal reference lines (setpoint, levels), dashed */
  rules: { y: number; cls: string }[]
  /** a ±band behind a setpoint */
  band?: { y: number; h: number }
  /** z-plane: unit circle, and a pole that moves from `from` to `to` on hover */
  zplane?: { cx: number; cy: number; r: number; from: number; to: number; unstableAt: number }
}

const empty = (): Glyph => ({ paths: [], bars: [], dots: [], rules: [] })
/** linear map of data to the glyph box */
function scaler(xs: readonly number[], ys: readonly number[], w = GW, h = GH, pad = PAD) {
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)]
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)]
  const sx = (x: number) => pad + ((x - x0) / (x1 - x0 || 1)) * (w - 2 * pad)
  const sy = (y: number) => h - pad - ((y - y0) / (y1 - y0 || 1)) * (h - 2 * pad)
  return { sx, sy }
}
const r1 = (v: number) => Math.round(v * 10) / 10
const pathOf = (xs: readonly number[], ys: readonly number[], sx: (x: number) => number, sy: (y: number) => number) =>
  xs.map((x, i) => `${i ? 'L' : 'M'}${r1(sx(x))} ${r1(sy(ys[i]))}`).join('')
const stairsOf = (xs: readonly number[], ys: readonly number[], sx: (x: number) => number, sy: (y: number) => number, xEnd: number) =>
  xs.map((x, i) => `${i ? `H${r1(sx(x))}V` : `M${r1(sx(x))} `}${r1(sy(ys[i]))}`).join('') + `H${r1(sx(xEnd))}`

/** Traitement du signal (course card): a sine that turns into its samples. */
export function courseSignal(w = 200, h = 90): Glyph {
  const g = empty()
  const t = linspace(0, 2, 161)
  const x = t.map((v) => Math.sin(2 * Math.PI * v + 0.4))
  const { sx, sy } = scaler(t, [...x, -1.1, 1.1], w, h, 10)
  g.paths.push({ d: pathOf(t, x, sx, sy), cls: 'wave' })
  const n = 16
  for (let k = 0; k <= n; k++) {
    const tk = (2 * k) / n
    const v = Math.sin(2 * Math.PI * tk + 0.4)
    const y0 = sy(0)
    const y1 = sy(v)
    g.bars.push({ x: r1(sx(tk)) - 0.75, y: Math.min(y0, y1), w: 1.5, h: Math.abs(y1 - y0), cls: 'stem', i: k })
    g.dots.push({ cx: r1(sx(tk)), cy: r1(y1), r: 2.6, cls: 'head', i: k })
  }
  return g
}

/** Automatique (course card): a step response with overshoot settling in the ±5 % band of its setpoint. */
export function courseAuto(w = 200, h = 90): Glyph {
  const g = empty()
  const wn = 2.2
  const z = 0.35
  const t = linspace(0, 8, 241)
  const y = stepContinuous(tf(wn * wn, [1, 2 * z * wn, wn * wn]), t)
  const { sx, sy } = scaler(t, [...y, 0, 1.45], w, h, 10)
  g.band = { y: r1(sy(1.05)), h: r1(sy(0.95) - sy(1.05)) }
  g.rules.push({ y: r1(sy(1)), cls: 'setpoint' })
  g.paths.push({ d: pathOf(t, y, sx, sy), cls: 'draw response' })
  return g
}

/** AE TP1: figure 1.6, the loop around 9/(s+9) answering a step at t = 1 s (final value 0.5). */
export function ae1(): Glyph {
  const g = empty()
  const t = linspace(0, 1, 101)
  const y = stepContinuous(feedback(tf(9, [1, 9]), 1), t)
  const T = [0, 0.25, ...t.map((v) => v + 0.25)]
  const Y = [0, 0, ...y]
  const { sx, sy } = scaler(T, [...Y, 1.05])
  g.paths.push({ d: `M${r1(sx(0))} ${r1(sy(0))}H${r1(sx(0.25))}V${r1(sy(1))}H${r1(sx(1.25))}`, cls: 'input' })
  g.paths.push({ d: pathOf(T, Y, sx, sy), cls: 'draw response' })
  g.rules.push({ y: r1(sy(0.5)), cls: 'setpoint' })
  return g
}

/** AE TP2: sin(t) through the zero-order hold (the script's period). */
export function ae2(): Glyph {
  const g = empty()
  const r = aeTp2(defaults(aeTp2Source) as unknown as AeTp2Params)['II.1']
  const keep = r.t.map((v, i) => i).filter((i) => r.t[i] <= 2 * Math.PI)
  const t = keep.map((i) => r.t[i])
  const x = keep.map((i) => r.x[i])
  const ks = r.tk.map((v, i) => i).filter((i) => r.tk[i] <= 2 * Math.PI)
  const { sx, sy } = scaler(t, [...x, -1.1, 1.1])
  g.paths.push({ d: pathOf(t, x, sx, sy), cls: 'wave' })
  g.paths.push({ d: stairsOf(ks.map((i) => r.tk[i]), ks.map((i) => r.xk[i]), sx, sy, 2 * Math.PI), cls: 'draw hold' })
  return g
}

/** AE TP3: the closed-loop pole p = a − K(1 − a) walking to −1 as K grows (T of the script). */
export function ae3(): Glyph {
  const g = empty()
  const { T } = defaults(aeTp3Source) as Record<string, number>
  const G0 = c2dZoh(tf(1, [1, 1]), T)
  const pole = (K: number) => poles(feedback(gain(K, G0), 1))[0].re
  // the limit gain, where the pole reaches −1
  let lo = 0
  let hi = 100
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2
    if (Math.abs(pole(m)) < 1) lo = m
    else hi = m
  }
  const r = 22
  g.zplane = { cx: GW / 2, cy: GH / 2, r, from: r1(pole(1) * r), to: r1(pole(lo * 1.12) * r), unstableAt: r1(-r) }
  return g
}

/** AE TP4: P, I and D contributions of the motor PID stacking up after a setpoint step. */
export function ae4(): Glyph {
  const g = empty()
  const p = defaults(aeTp4Source) as Record<string, number>
  const m = aeTp4Motor(p as never)['IV.5']
  const C = pid(m.kp_m, m.ki_m, m.kd_m, 1 / p.N_filtre)
  const E = feedback(1, series(C, m.Gm)) // error per unit setpoint
  const t = linspace(0, 0.3, 601)
  const e = stepContinuous(E, t)
  const u = stepContinuous(series(C, E), t)
  const dt = t[1] - t[0]
  const I: number[] = [0]
  for (let k = 1; k < t.length; k++) I.push(I[k - 1] + (m.ki_m * dt * (e[k] + e[k - 1])) / 2)
  const n = 12
  const idx = Array.from({ length: n }, (_, k) => Math.round(((k + 0.5) / n) * (t.length - 1)))
  const P = idx.map((k) => m.kp_m * e[k])
  const Ii = idx.map((k) => I[k])
  const D = idx.map((k, j) => u[k] - P[j] - Ii[j])
  const top = Math.max(...idx.map((_, j) => Math.abs(P[j]) + Math.abs(Ii[j]) + Math.abs(D[j])))
  const bw = (GW - 2 * PAD) / n
  const base = GH - PAD
  const scale = (GH - 2 * PAD) / top
  idx.forEach((_, j) => {
    let y = base
    for (const [v, cls] of [
      [P[j], 'p'],
      [Ii[j], 'i'],
      [D[j], 'd'],
    ] as const) {
      const hh = Math.abs(v) * scale
      y -= hh
      g.bars.push({ x: r1(PAD + j * bw + 1), y: r1(y), w: r1(bw - 2), h: r1(hh), cls: `bar ${cls}`, i: j })
    }
  })
  return g
}

/** TS TP1: a sine and its quantized staircase (3 bits), with the error between them. */
export function ts1(): Glyph {
  const g = empty()
  const n = 24
  const t = Array.from({ length: n + 1 }, (_, k) => k / n)
  const x = t.map((v) => 0.9 * Math.sin(2 * Math.PI * v))
  const q = 2 / 8
  const xq = x.map((v) => q * (Math.floor(v / q) + 0.5))
  const tf_ = linspace(0, 1, 121)
  const { sx, sy } = scaler(t, [-1, 1])
  for (let k = 0; k < 8; k++) g.rules.push({ y: r1(sy(-1 + q / 2 + k * q)), cls: 'level' })
  g.paths.push({ d: pathOf(tf_, tf_.map((v) => 0.9 * Math.sin(2 * Math.PI * v)), sx, sy), cls: 'wave' })
  g.paths.push({ d: stairsOf(t, xq, sx, sy, 1), cls: 'draw hold' })
  return g
}

/** TS TP2: two rectangles convolved (engine conv) give a triangle, built bar by bar. */
export function ts2(): Glyph {
  const g = empty()
  const y = conv(new Array(6).fill(1), new Array(6).fill(1))
  const xs = y.map((_, k) => k)
  const { sx, sy } = scaler([-1, y.length], [0, Math.max(...y) * 1.08])
  y.forEach((v, k) => {
    g.bars.push({ x: r1(sx(xs[k])) - 0.75, y: r1(sy(v)), w: 1.5, h: r1(sy(0) - sy(v)), cls: 'stem', i: k })
    g.dots.push({ cx: r1(sx(xs[k])), cy: r1(sy(v)), r: 2.2, cls: 'head', i: k })
  })
  return g
}

/** TS TP3: |X(f)| of 5 + cos(2π·105 nTe) on 100 points (engine fft): the leakage of question 9. */
export function ts3(): Glyph {
  const g = empty()
  const N = 100
  const x = Array.from({ length: N }, (_, n) => 5 + Math.cos((2 * Math.PI * 105 * n) / 1000))
  const X = fft(x)
  const half = 26
  const mag = Array.from({ length: half }, (_, k) => Math.hypot(X.re[k], X.im[k]) / N)
  const top = Math.sqrt(Math.max(...mag))
  const bw = (GW - 2 * PAD) / half
  mag.forEach((v, k) => {
    const hh = (Math.sqrt(v) / top) * (GH - 2 * PAD) // square root: the small lines stay visible
    g.bars.push({ x: r1(PAD + k * bw + bw * 0.2), y: r1(GH - PAD - hh), w: r1(bw * 0.6), h: r1(hh), cls: 'bar', i: k })
  })
  return g
}

/** TS TP4: |H| in dB of the second-order IIR low-pass (engine freqz), with its −3 dB level. */
export function ts4(): Glyph {
  const g = empty()
  const r = tsTp4(defaults(tsTp4Source) as unknown as TsTp4Params)['II.1']
  const fr = freqz(r.b, r.a_corrige, 120)
  const db = fr.H.map((h) => Math.max(-40, 20 * Math.log10(Math.hypot(h.re, h.im))))
  const { sx, sy } = scaler(fr.w, [...db, 4])
  g.rules.push({ y: r1(sy(-3)), cls: 'level' })
  g.paths.push({ d: pathOf(fr.w, db, sx, sy), cls: 'draw response' })
  return g
}

export const TP_GLYPHS: Record<string, () => Glyph> = {
  'automatique-1': ae1,
  'automatique-2': ae2,
  'automatique-3': ae3,
  'automatique-4': ae4,
  'signal-1': ts1,
  'signal-2': ts2,
  'signal-3': ts3,
  'signal-4': ts4,
}
