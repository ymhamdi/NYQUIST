/**
 * "La chaîne d'échantillonnage vivante": the landing-page background.
 * One Canvas 2D, left to right: a continuous signal (sum of three drifting
 * sines), the sampling gate, the samples, the zero-order hold, the
 * quantizer; underneath, the live spectrum of the samples (engine fft);
 * lower right, a sampled loop whose gain sweeps: closed-loop poles (engine
 * c2dZoh, feedback, poles) and step response (engine stepDiscrete).
 * Pointer x sets Fe (aliasing below 2·fmax), pointer y (or scroll on touch)
 * nudges K, a click injects δ[n]. Pauses when hidden or off-screen; one
 * static frame under prefers-reduced-motion.
 */
import { fft } from '../engine/dsp'
import { c2dZoh, feedback, gain, poles, stepDiscrete, tf, type TF } from '../engine/lti'
import { fmt } from '../lib/format'

interface Sample {
  t: number
  v: number
}
interface Colors {
  bg: string
  grid: string
  gridMajor: string
  cyan: string
  amber: string
  zoh: string
  magenta: string
  red: string
  ink: string
  inkSoft: string
  panel: string
}
export interface SceneOptions {
  /** start paused (reduced motion or the remembered choice) */
  paused: boolean
  /** no z-plane, lower contrast (course pages) */
  calm?: boolean
}
export interface Scene {
  setPaused(p: boolean): void
  refreshColors(): void
  destroy(): void
}

const TAU = 2 * Math.PI
const FE_MIN = 0.9
const FE_MAX = 4.4
const F_AXIS = 2.2 // spectrum axis, Hz
const N_FFT = 32
const BITS = 3
const IMPULSE = 1.2

/** Component i: frequency f0 + df·sin(2πt/P + c); phase integrated in closed form. */
const COMP = [
  { f0: 0.3, df: 0.06, P: 47, c: 0, a0: 0.5, da: 0.1, Pa: 31, ph: 0 },
  { f0: 0.56, df: 0.08, P: 61, c: 1, a0: 0.28, da: 0.08, Pa: 37, ph: 1.3 },
  { f0: 0.84, df: 0.07, P: 53, c: 2, a0: 0.17, da: 0.06, Pa: 43, ph: 2.1 },
]
const freqAt = (i: number, t: number) => COMP[i].f0 + COMP[i].df * Math.sin((TAU * t) / COMP[i].P + COMP[i].c)
const phaseAt = (i: number, t: number) => {
  const k = COMP[i]
  return TAU * (k.f0 * t - ((k.df * k.P) / TAU) * Math.cos((TAU * t) / k.P + k.c)) + k.ph
}
const ampAt = (i: number, t: number) => COMP[i].a0 + COMP[i].da * Math.sin((TAU * t) / COMP[i].Pa + i)
const fmaxAt = (t: number) => Math.max(freqAt(0, t), freqAt(1, t), freqAt(2, t))

/** The sampled loop of the z-plane: G(s) = 1/(s(s + 1)) behind a zero-order hold, T = 0.5 s. */
const T_LOOP = 0.5
const GZ: TF = c2dZoh(tf(1, [1, 1, 0]), T_LOOP)
const loopAt = (K: number) => feedback(gain(K, GZ), 1)
const rho = (K: number) => Math.max(...poles(loopAt(K)).map((p) => Math.hypot(p.re, p.im)))
/** limit gain: max |pole| = 1, by bisection on the engine's poles */
const K_CRIT = (() => {
  let lo = 0
  let hi = 20
  for (let i = 0; i < 50; i++) {
    const m = (lo + hi) / 2
    if (rho(m) < 1) lo = m
    else hi = m
  }
  return lo
})()

export function mountScene(canvas: HTMLCanvasElement, opts: SceneOptions): Scene {
  const ctx = canvas.getContext('2d', { alpha: false })!
  const host = canvas.parentElement!
  const low = (navigator.hardwareConcurrency ?? 8) <= 4
  let W = 0
  let H = 0
  let dpr = 1
  let small = false
  let px = 2 // sampling step of the curves, CSS px
  let v = 80 // belt speed, px/s
  let col: Colors = readColors() // read again on resize and theme change
  let grid: HTMLCanvasElement | null = null
  let freeTop = 0 // the scene is laid out below the text panel

  // simulation state
  let now = 2 // starts calm: low gain, Shannon respected; the ambient loop then crosses both limits
  let Fe = 2.6
  let feTarget = Fe
  let K = K_CRIT * 0.6
  let kNudge = 0
  let kNudgeTarget = 0
  let lastPointer = -1e9
  let samples: Sample[] = []
  let tNext = 0
  const impulses: number[] = []
  const trail: { x: number; y: number; t: number }[] = []
  let redGlow = 0
  let gateTick = 0
  let paused = opts.paused
  let visible = true
  let raf = 0
  let last = 0

  const signal = (t: number) => {
    let s = 0
    for (let i = 0; i < 3; i++) s += ampAt(i, t) * Math.sin(phaseAt(i, t))
    for (const t0 of impulses) s += IMPULSE * Math.exp(-(((t - t0) / 0.035) ** 2))
    return s
  }
  /** the value of the sample taken at t: δ[n] lands on exactly one sample */
  const sampleAt = (t: number, te: number) => {
    let s = 0
    for (let i = 0; i < 3; i++) s += ampAt(i, t) * Math.sin(phaseAt(i, t))
    for (const t0 of impulses) if (t0 > t - te / 2 && t0 <= t + te / 2) s += IMPULSE
    return s
  }

  function readColors(): Colors {
    const cs = getComputedStyle(canvas)
    const g = (n: string) => cs.getPropertyValue(n).trim()
    return {
      bg: g('--s-bg'),
      grid: g('--s-grid'),
      gridMajor: g('--s-grid-major'),
      cyan: g('--s-cyan'),
      amber: g('--s-amber'),
      zoh: g('--s-zoh'),
      magenta: g('--s-magenta'),
      red: g('--s-red'),
      ink: g('--s-ink'),
      inkSoft: g('--s-ink-soft'),
      panel: g('--s-panel'),
    }
  }

  /** millimetre paper, drawn once per size or theme */
  function drawGrid() {
    grid = document.createElement('canvas')
    grid.width = Math.round(W * dpr)
    grid.height = Math.round(H * dpr)
    const g = grid.getContext('2d')!
    g.scale(dpr, dpr)
    g.fillStyle = col.bg
    g.fillRect(0, 0, W, H)
    const mm = small ? 6 : 8
    for (const [step, color] of [
      [mm, col.grid],
      [mm * 5, col.gridMajor],
    ] as const) {
      g.strokeStyle = color
      g.lineWidth = 1
      g.beginPath()
      for (let x = 0.5; x < W; x += step) {
        g.moveTo(x, 0)
        g.lineTo(x, H)
      }
      for (let y = 0.5; y < H; y += step) {
        g.moveTo(0, y)
        g.lineTo(W, y)
      }
      g.stroke()
    }
  }

  function resize() {
    const r = host.getBoundingClientRect()
    W = Math.max(320, Math.round(r.width))
    H = Math.max(420, Math.round(r.height))
    dpr = Math.min(2, window.devicePixelRatio || 1)
    small = W < 640
    px = small || low ? 4 : 2
    v = Math.min(90, Math.max(45, W / 18))
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    canvas.style.width = `${W}px`
    canvas.style.height = `${H}px`
    const text = host.querySelector('.hero-text')
    freeTop = text ? text.getBoundingClientRect().bottom - r.top : H * 0.35
    if (small) {
      // phone: the hero grows to hold the chain, the spectrum and the loop panels below the text
      const ay = Math.min(H * 0.07, 52)
      const need = Math.ceil(freeTop + 2 * ay * 1.45 + 44 + Math.max(40, H * 0.07) + 30 + 150 + 16)
      if (H < need) {
        host.style.minHeight = `${need}px`
        return // the ResizeObserver calls resize() again with the new height
      }
    }
    col = readColors()
    drawGrid()
    warmup()
    if (paused) frame(0)
  }

  /** fill the belt with the samples it would carry by now */
  function warmup() {
    const te = 1 / Fe
    const span = (W * 0.75) / v + N_FFT * te
    samples = []
    let t = Math.floor((now - span) / te) * te
    for (; t <= now; t += te) samples.push({ t, v: sampleAt(t, te) })
    tNext = t
  }

  // layout: chain band right below the text panel, then the spectrum, the loop panels at the lower right
  const L = () => {
    const xg = W * 0.3
    const ay = small ? Math.min(H * 0.07, 52) : Math.min(H * 0.085, 80)
    const band = ay * 1.45 // labels above, status below the chain
    const y0 = Math.max(freeTop + band + 12, H * 0.32)
    const below = y0 + band + 16
    if (small) {
      const spec = { x: 12, y: below + 22, w: W - 24, h: Math.max(40, H * 0.07) }
      const zs = Math.min(W * 0.4, 150, H - (spec.y + spec.h + 30) - 10)
      const zone = { x: W - zs - 12, y: spec.y + spec.h + 30, s: zs }
      const step = { x: 12, y: zone.y + 22, w: zone.x - 24, h: zs - 30 }
      return { xg, xz: W * 0.52, xq: W * 0.74, y0, ay, zone, step, spec }
    }
    const zs = Math.max(120, Math.min(W * 0.17, H - below - 16, 230))
    const zone = { x: W - zs - 28, y: Math.min(below, H - zs - 16), s: zs }
    const step = { x: zone.x - zs * 1.3 - 24, y: zone.y + 22, w: zs * 1.3, h: zs - 30 }
    const spec = { x: W * 0.04, y: zone.y + 20, w: step.x - 24 - W * 0.04, h: Math.max(50, zs - 34) }
    return { xg, xz: W * 0.52, xq: W * 0.74, y0, ay, zone, step, spec }
  }

  function step(dt: number) {
    now += dt
    const idle = now - lastPointer > 8
    if (idle) {
      // ambient: Fe drifts across the Nyquist boundary, K sweeps through K_crit
      feTarget = 1.2 + 1.6 * (0.5 + 0.5 * Math.sin((TAU * now) / 41))
      kNudgeTarget = 0
    }
    Fe += (feTarget - Fe) * Math.min(1, dt * 1.5)
    kNudge += (kNudgeTarget - kNudge) * Math.min(1, dt * 2)
    const sweep = 0.22 + 0.95 * (0.5 - 0.5 * Math.cos((TAU * now) / 36)) // 0.22·Kcrit … 1.17·Kcrit
    K = Math.max(0.02, K_CRIT * (sweep + kNudge))
    const te = 1 / Fe
    // sampling gate
    if (tNext < now - 2) warmup()
    while (tNext <= now) {
      samples.push({ t: tNext, v: sampleAt(tNext, te) })
      gateTick = 1
      tNext += te
    }
    gateTick = Math.max(0, gateTick - dt * 3)
    const keepFrom = now - (W * 0.75) / v - N_FFT * 4.5
    while (samples.length > N_FFT + 4 && samples[0].t < keepFrom) samples.shift()
    while (impulses.length && impulses[0] < now - (W * 0.75) / v - 2) impulses.shift()
  }

  const yv = (y0: number, ay: number, s: number) => y0 - ay * s

  function frame(dt: number) {
    if (dt) step(dt)
    const { xg, xz, xq, y0, ay, zone, step: sp, spec } = L()
    const c = ctx
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (grid) c.drawImage(grid, 0, 0, W, H)
    else {
      c.fillStyle = col.bg
      c.fillRect(0, 0, W, H)
    }
    const fmax = fmaxAt(now)
    const aliasing = Fe < 2 * fmax
    const xOf = (t: number) => xg + v * (now - t)
    c.lineJoin = 'round'
    c.lineCap = 'round'
    c.font = `${small ? 10 : 11}px "IBM Plex Mono", ui-monospace, monospace`

    // 1. continuous signal, flowing in from the left (glow = wide faint stroke + thin bright one)
    c.beginPath()
    for (let x = 0; x <= xg; x += px) {
      const y = yv(y0, ay, signal(now + (xg - x) / v))
      x ? c.lineTo(x, y) : c.moveTo(x, y)
    }
    c.strokeStyle = col.cyan
    c.globalAlpha = 0.18
    c.lineWidth = 7
    c.stroke()
    c.globalAlpha = 1
    c.lineWidth = 2
    c.stroke()
    // its continuation right of the gate, faint: what the samples stand for
    c.beginPath()
    for (let x = xg; x <= W; x += px) {
      const y = yv(y0, ay, signal(now - (x - xg) / v))
      x === xg ? c.moveTo(x, y) : c.lineTo(x, y)
    }
    c.globalAlpha = opts.calm ? 0.12 : 0.22
    c.lineWidth = 1.2
    c.stroke()
    c.globalAlpha = 1

    // 2. sampling gate, with its clock tick (a short mark that fades, never a flash)
    c.strokeStyle = col.inkSoft
    c.lineWidth = 1
    c.setLineDash([2, 4])
    c.beginPath()
    c.moveTo(xg + 0.5, y0 - ay * 1.3)
    c.lineTo(xg + 0.5, y0 + ay * 1.3)
    c.stroke()
    c.setLineDash([])
    const lastS = samples[samples.length - 1]
    if (lastS && gateTick > 0) {
      c.globalAlpha = 0.6 * gateTick
      c.strokeStyle = col.amber
      c.lineWidth = 2
      c.beginPath()
      c.moveTo(xg - 7, yv(y0, ay, lastS.v))
      c.lineTo(xg + 7, yv(y0, ay, lastS.v))
      c.stroke()
      c.globalAlpha = 1
    }

    // 3. samples (stems), then the zero-order hold, then the quantizer
    const R = 1.1
    const q = (2 * R) / 2 ** BITS
    const quant = (s: number) => Math.max(-R + q / 2, Math.min(R - q / 2, q * (Math.floor(s / q) + 0.5)))
    c.strokeStyle = col.amber
    c.fillStyle = col.amber
    c.lineWidth = 1.6
    c.beginPath()
    for (let i = samples.length - 1; i >= 0; i--) {
      const x = xOf(samples[i].t)
      if (x > xz) break
      c.moveTo(x, y0)
      c.lineTo(x, yv(y0, ay, samples[i].v))
    }
    c.stroke()
    for (let i = samples.length - 1; i >= 0; i--) {
      const x = xOf(samples[i].t)
      if (x > xz) break
      c.beginPath()
      c.arc(x, yv(y0, ay, samples[i].v), small ? 2.4 : 3.2, 0, TAU)
      c.fill()
    }
    // hold: sample k is held from its instant until the next one (spatially, from x_k down to x_k+1)
    const stair = (quantized: boolean, from: number, to: number) => {
      c.beginPath()
      let started = false
      for (let i = samples.length - 1; i >= 0; i--) {
        const xa = Math.max(from, i + 1 < samples.length ? xOf(samples[i + 1].t) : xg)
        const xb = Math.min(to, xOf(samples[i].t))
        if (xb < from) continue
        if (xa > to) break
        const y = yv(y0, ay, quantized ? quant(samples[i].v) : samples[i].v)
        started ? c.lineTo(xa, y) : c.moveTo(xa, y)
        c.lineTo(xb, y)
        started = true
      }
      c.stroke()
    }
    c.strokeStyle = col.zoh
    c.lineWidth = 1.8
    stair(false, xz, xq)
    // quantization levels, then the quantized staircase and the error marks
    c.strokeStyle = col.inkSoft
    c.globalAlpha = 0.35
    c.lineWidth = 1
    c.beginPath()
    for (let k = 0; k < 2 ** BITS; k++) {
      const y = yv(y0, ay, -R + q / 2 + k * q)
      c.moveTo(xq, y)
      c.lineTo(W, y)
    }
    c.stroke()
    c.globalAlpha = 1
    c.strokeStyle = col.zoh
    c.lineWidth = 1.8
    stair(true, xq, W)
    c.strokeStyle = col.inkSoft
    c.lineWidth = 1
    c.beginPath()
    for (let i = samples.length - 1; i >= 0; i--) {
      const x = xOf(samples[i].t)
      if (x < xq) continue
      if (x > W) break
      c.moveTo(x, yv(y0, ay, samples[i].v))
      c.lineTo(x, yv(y0, ay, quant(samples[i].v)))
    }
    c.stroke()

    // 4. aliasing: the wrong reconstruction through the same samples (dashed ghost)
    const te = 1 / Fe
    const ref = lastS ? lastS.t : now
    if (aliasing) {
      const m = COMP.map((_, i) => Math.round(freqAt(i, now) / Fe))
      c.strokeStyle = col.magenta
      c.lineWidth = 1.6
      c.setLineDash([6, 5])
      c.beginPath()
      for (let x = xg; x <= W; x += px) {
        const t = now - (x - xg) / v
        let s = 0
        for (let i = 0; i < 3; i++) s += ampAt(i, t) * Math.sin(phaseAt(i, t) - TAU * m[i] * Fe * (t - ref))
        const y = yv(y0, ay, s)
        x === xg ? c.moveTo(x, y) : c.lineTo(x, y)
      }
      c.stroke()
      c.setLineDash([])
    }

    // labels of the chain
    c.fillStyle = col.inkSoft
    const ly = y0 - ay * 1.45
    if (!small) {
      c.fillText('x(t) continu', 12, ly)
      c.fillText('bloqueur d’ordre 0', xz + 6, ly)
      c.fillText(`quantification · ${BITS} bits`, xq + 6, ly)
    }
    c.fillText(`échantillonneur · Te = ${fmt(te, 2)} s`, xg + 6, ly)
    c.fillStyle = aliasing ? col.magenta : col.ink
    c.fillText(
      small
        ? `${aliasing ? 'Repliement' : 'Shannon respecté'} · Fe = ${fmt(Fe, 2)} Hz`
        : aliasing
          ? `Repliement spectral · Fe = ${fmt(Fe, 2)} Hz < 2·fmax = ${fmt(2 * fmax, 2)} Hz`
          : `Shannon respecté · Fe = ${fmt(Fe, 2)} Hz ≥ 2·fmax = ${fmt(2 * fmax, 2)} Hz`,
      small ? 12 : xg + 6,
      y0 + ay * 1.45 + 4,
    )

    // 5. spectrum of the last N samples (Hann window, engine fft)
    const win = samples.slice(-N_FFT)
    const xs = win.map((s, n) => s.v * (0.5 - 0.5 * Math.cos((TAU * n) / (win.length - 1))))
    const X = fft(xs, N_FFT)
    const fx = (f: number) => spec.x + (f / F_AXIS) * spec.w
    const base = spec.y + spec.h
    c.strokeStyle = col.inkSoft
    c.globalAlpha = 0.6
    c.beginPath()
    c.moveTo(spec.x, base + 0.5)
    c.lineTo(spec.x + spec.w, base + 0.5)
    c.stroke()
    c.globalAlpha = 1
    const bw = Math.max(1.5, (Fe / N_FFT / F_AXIS) * spec.w * 0.6)
    for (let k = 0; k < N_FFT; k++) {
      const f = (k * Fe) / N_FFT
      if (f > F_AXIS) break
      const a = (4 / N_FFT) * Math.hypot(X.re[k], X.im[k]) // Hann gain 1/2, one side ×2
      const hgt = (Math.log10(1 + 20 * a) / Math.log10(21)) * spec.h
      const mirror = k > N_FFT / 2
      c.fillStyle = mirror ? col.inkSoft : col.amber
      c.globalAlpha = mirror ? 0.13 : 0.85
      c.fillRect(fx(f) - bw / 2, base - hgt, bw, hgt)
    }
    c.globalAlpha = 1
    // Fe/2, the true components, and the folding of the ones above Fe/2
    c.strokeStyle = col.ink
    c.setLineDash([4, 4])
    c.beginPath()
    c.moveTo(fx(Fe / 2), spec.y - 6)
    c.lineTo(fx(Fe / 2), base)
    c.stroke()
    c.setLineDash([])
    c.fillStyle = col.ink
    c.fillText('Fe/2', fx(Fe / 2) + 4, spec.y + 4)
    c.fillStyle = col.inkSoft
    c.fillText('|X(f)|', spec.x, spec.y - 4)
    for (let i = 0; i < 3; i++) {
      const f = freqAt(i, now)
      c.fillStyle = col.cyan
      c.beginPath()
      c.moveTo(fx(f), base + 2)
      c.lineTo(fx(f) - 4, base + 9)
      c.lineTo(fx(f) + 4, base + 9)
      c.fill()
      if (f > Fe / 2) {
        const fa = Math.abs(f - Math.round(f / Fe) * Fe)
        const xa = fx(f)
        const xb = fx(fa)
        c.strokeStyle = col.magenta
        c.lineWidth = 1.4
        c.beginPath()
        c.moveTo(xa, base - 2)
        c.quadraticCurveTo((xa + xb) / 2, spec.y - spec.h * 0.25, xb, base - 2)
        c.stroke()
        c.fillStyle = col.magenta
        c.beginPath()
        c.arc(xb, base - 2, 3, 0, TAU)
        c.fill()
      }
    }
    if (aliasing) {
      c.fillStyle = col.magenta
      c.fillText('Repliement spectral', fx(Fe / 2) + 4, spec.y + 18)
    }

    if (!opts.calm) drawLoop(zone, sp, dt)
  }

  /** lower right: z-plane of the sampled loop, root-locus trail, step response */
  function drawLoop(zone: { x: number; y: number; s: number }, sp: { x: number; y: number; w: number; h: number }, dt: number) {
    const c = ctx
    const F = loopAt(K)
    const ps = poles(F)
    const r = Math.max(...ps.map((p) => Math.hypot(p.re, p.im)))
    const unstable = r > 1
    redGlow += ((unstable ? 1 : 0) - redGlow) * Math.min(1, dt * 2.5) // soft, about 0.4 s
    const cx = zone.x + zone.s / 2
    const cy = zone.y + zone.s / 2
    const R = zone.s * 0.36
    c.fillStyle = col.panel
    c.fillRect(zone.x, zone.y, zone.s, zone.s)
    c.fillRect(sp.x, sp.y - 18, sp.w, sp.h + 26)
    // axes and unit circle
    c.strokeStyle = col.inkSoft
    c.lineWidth = 1
    c.globalAlpha = 0.5
    c.beginPath()
    c.moveTo(zone.x + 8, cy)
    c.lineTo(zone.x + zone.s - 8, cy)
    c.moveTo(cx, zone.y + 8)
    c.lineTo(cx, zone.y + zone.s - 8)
    c.stroke()
    c.globalAlpha = 1
    if (redGlow > 0.01) {
      c.strokeStyle = col.red
      c.globalAlpha = 0.25 * redGlow
      c.lineWidth = 10
      c.beginPath()
      c.arc(cx, cy, R, 0, TAU)
      c.stroke()
      c.globalAlpha = 1
    }
    c.strokeStyle = redGlow > 0.5 ? col.red : col.ink
    c.lineWidth = 1.4
    c.beginPath()
    c.arc(cx, cy, R, 0, TAU)
    c.stroke()
    // trail of the poles (fading root locus)
    for (const p of ps) trail.push({ x: p.re, y: p.im, t: now })
    while (trail.length && trail[0].t < now - (small || low ? 2.5 : 5)) trail.shift()
    c.fillStyle = col.zoh
    for (const p of trail) {
      c.globalAlpha = 0.5 * (1 - (now - p.t) / 5)
      c.fillRect(cx + p.x * R - 1, cy - p.y * R - 1, 2, 2)
    }
    c.globalAlpha = 1
    c.strokeStyle = unstable ? col.red : col.zoh
    c.lineWidth = 2
    for (const p of ps) {
      const x = cx + Math.max(-1.6, Math.min(1.6, p.re)) * R
      const y = cy - Math.max(-1.6, Math.min(1.6, p.im)) * R
      c.beginPath()
      c.moveTo(x - 5, y - 5)
      c.lineTo(x + 5, y + 5)
      c.moveTo(x - 5, y + 5)
      c.lineTo(x + 5, y - 5)
      c.stroke()
    }
    c.fillStyle = col.inkSoft
    c.fillText('plan z', zone.x + 8, zone.y + 16)
    c.fillText(`K = ${fmt(K, 3)}`, zone.x + 8, zone.y + zone.s - 10)
    c.fillStyle = unstable ? col.red : col.inkSoft
    c.fillText(`|z|max = ${fmt(r, 3)}`, zone.x + zone.s - (small ? 92 : 104), zone.y + zone.s - 10)
    // step response of the loop, setpoint dashed
    const n = 40
    const y = stepDiscrete(F, n)
    const sx = (k: number) => sp.x + 8 + (k / (n - 1)) * (sp.w - 16)
    const sy = (val: number) => sp.y + sp.h - 4 - (Math.max(-0.4, Math.min(2.2, val)) / 2.2) * (sp.h - 8)
    c.strokeStyle = col.inkSoft
    c.setLineDash([4, 4])
    c.beginPath()
    c.moveTo(sp.x + 8, sy(1))
    c.lineTo(sp.x + sp.w - 8, sy(1))
    c.stroke()
    c.setLineDash([])
    c.strokeStyle = unstable ? col.red : col.cyan
    c.lineWidth = 1.6
    c.beginPath()
    for (let k = 0; k < n; k++) {
      k ? c.lineTo(sx(k), sy(y[k - 1])) : c.moveTo(sx(0), sy(0))
      c.lineTo(sx(k), sy(y[k]))
    }
    c.stroke()
    c.fillStyle = col.inkSoft
    c.fillText('réponse indicielle', sp.x + 8, sp.y - 4)
  }

  function loop(ts: number) {
    raf = 0
    if (paused || !visible) return
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0
    last = ts
    frame(dt)
    raf = requestAnimationFrame(loop)
  }
  const kick = () => {
    if (!raf && !paused && visible && !document.hidden) {
      last = 0
      raf = requestAnimationFrame(loop)
    }
  }

  // pointer: x sets Fe, y nudges K, click injects δ[n]
  const onMove = (e: PointerEvent) => {
    const r = host.getBoundingClientRect()
    const fx = (e.clientX - r.left) / r.width
    const fy = (e.clientY - r.top) / r.height
    feTarget = FE_MIN + (FE_MAX - FE_MIN) * Math.min(1, Math.max(0, fx))
    if (e.pointerType === 'mouse') kNudgeTarget = (0.5 - Math.min(1, Math.max(0, fy))) * 0.9
    lastPointer = now
  }
  const onScroll = () => {
    if (!matchMedia('(pointer: coarse)').matches) return
    const r = host.getBoundingClientRect()
    kNudgeTarget = Math.min(0.9, Math.max(-0.4, -r.top / r.height)) // scrolling down raises K
    lastPointer = now
  }
  const onDown = (e: PointerEvent) => {
    const r = host.getBoundingClientRect()
    const { xg } = L()
    const x = Math.min(xg - 40, Math.max(20, e.clientX - r.left))
    impulses.push(now + (xg - x) / v)
    impulses.sort((a, b) => a - b)
    lastPointer = now
    if (paused) frame(0)
  }
  host.addEventListener('pointermove', onMove, { passive: true })
  host.addEventListener('pointerdown', onDown, { passive: true })
  addEventListener('scroll', onScroll, { passive: true })
  const ro = new ResizeObserver(() => resize())
  ro.observe(host)
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting
    if (visible) kick()
  })
  io.observe(host)
  const onVis = () => (document.hidden ? undefined : kick())
  document.addEventListener('visibilitychange', onVis)

  resize()
  frame(0)
  kick()

  return {
    setPaused(p: boolean) {
      paused = p
      if (p) frame(0)
      else kick()
    },
    refreshColors() {
      col = readColors()
      drawGrid()
      frame(0)
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      host.removeEventListener('pointermove', onMove)
      host.removeEventListener('pointerdown', onDown)
      removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVis)
    },
  }
}
