<script lang="ts" module>
  export interface Series {
    x: readonly number[]
    y: readonly number[]
    label: string
    kind?: 'line' | 'stem' | 'stairs' | 'points'
    /** 1…6: theme colours --c1…--c6 */
    color?: number
    dashed?: boolean
    width?: number
  }
  export interface Rule {
    at: number
    label?: string
    color?: number
  }

  /** 1-2-5 ticks covering [a, b]. */
  export function niceTicks(a: number, b: number, count = 6): number[] {
    if (!(b > a)) return [a]
    const raw = (b - a) / count
    const p = 10 ** Math.floor(Math.log10(raw))
    const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? raw
    const out: number[] = []
    for (let v = Math.ceil(a / step - 1e-9) * step; v <= b + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v)
    return out
  }
</script>

<script lang="ts">
  import { fmt } from '../lib/format'

  interface Props {
    series: Series[]
    xLabel: string
    yLabel: string
    /** accessible description of what the figure shows (with its key numbers) */
    summary: string
    title?: string
    xDomain?: [number, number]
    yDomain?: [number, number]
    hRules?: Rule[]
    vRules?: Rule[]
    height?: number
  }
  let { series, xLabel, yLabel, summary, title, xDomain, yDomain, hRules = [], vRules = [], height = 300 }: Props = $props()

  const W = 640
  const uid = $props.id() // stable between the server render and hydration
  const H = $derived(height)

  const finite = (v: number) => Number.isFinite(v)
  const xs = $derived(xDomain ?? extent(series.flatMap((s) => s.x as number[])))
  const ys = $derived(yDomain ?? padded(extent([...series.flatMap((s) => (s.kind === 'stem' ? [...s.y, 0] : (s.y as number[]))), ...hRules.map((r) => r.at)])))

  function extent(v: number[]): [number, number] {
    let lo = Infinity
    let hi = -Infinity
    for (const x of v) if (finite(x)) {
      if (x < lo) lo = x
      if (x > hi) hi = x
    }
    if (!finite(lo)) return [0, 1]
    if (lo === hi) return [lo - 1, hi + 1]
    return [lo, hi]
  }
  function padded([a, b]: [number, number]): [number, number] {
    const d = (b - a) * 0.06
    return [a - d, b + d]
  }

  const sx = (x: number) => M.l + ((x - xs[0]) / (xs[1] - xs[0])) * pw
  const sy = (y: number) => M.t + ph - ((y - ys[0]) / (ys[1] - ys[0])) * ph
  const clampY = (y: number) => Math.max(M.t - 50, Math.min(M.t + ph + 50, sy(y)))

  /** keeps the first, min, max and last point of each pixel column */
  function decimate(x: readonly number[], y: readonly number[]): [number[], number[]] {
    if (x.length <= 2 * pw) return [x as number[], y as number[]]
    const ox: number[] = []
    const oy: number[] = []
    let col = -1
    let bucket: number[] = []
    const flush = () => {
      if (!bucket.length) return
      let iMin = bucket[0]
      let iMax = bucket[0]
      for (const i of bucket) {
        if (y[i] < y[iMin]) iMin = i
        if (y[i] > y[iMax]) iMax = i
      }
      for (const i of [...new Set([bucket[0], Math.min(iMin, iMax), Math.max(iMin, iMax), bucket[bucket.length - 1]])]) {
        ox.push(x[i])
        oy.push(y[i])
      }
      bucket = []
    }
    for (let i = 0; i < x.length; i++) {
      const c = Math.floor(sx(x[i]))
      if (c !== col) {
        flush()
        col = c
      }
      bucket.push(i)
    }
    flush()
    return [ox, oy]
  }

  function linePath(s: Series): string {
    const [x, y] = decimate(s.x, s.y)
    let d = ''
    let pen = false
    for (let i = 0; i < x.length; i++) {
      if (!finite(y[i]) || !finite(x[i])) {
        pen = false
        continue
      }
      d += `${pen ? 'L' : 'M'}${sx(x[i]).toFixed(1)} ${clampY(y[i]).toFixed(1)}`
      pen = true
    }
    return d
  }
  function stairsPath(s: Series): string {
    let d = ''
    let pen = false
    for (let i = 0; i < s.x.length; i++) {
      if (!finite(s.y[i])) {
        pen = false
        continue
      }
      const X = sx(s.x[i]).toFixed(1)
      const Y = clampY(s.y[i]).toFixed(1)
      d += pen ? `H${X}V${Y}` : `M${X} ${Y}`
      pen = true
    }
    // hold the last value one step further
    const n = s.x.length
    if (pen && n > 1) d += `H${sx(s.x[n - 1] + (s.x[n - 1] - s.x[n - 2])).toFixed(1)}`
    return d
  }
  const base = $derived(sy(Math.max(ys[0], Math.min(ys[1], 0))))

  const xticks = $derived(niceTicks(xs[0], xs[1], 7))
  const yticks = $derived(niceTicks(ys[0], ys[1], 5))
  /** left margin wide enough for the longest y tick label (≈ 7 px per character at 12 px) next to the rotated y label */
  const M = $derived({ l: Math.max(62, 30 + 7 * Math.max(...yticks.map((t) => fmt(t, 3).length))), r: 14, t: 14, b: 46 })
  const pw = $derived(W - M.l - M.r)
  const ph = $derived(H - M.t - M.b)
  const colorOf = (s: { color?: number }, i: number) => `var(--c${s.color ?? (i % 6) + 1})`

  // cursor (pointer or keyboard)
  let cursorX = $state<number | null>(null)
  const nearest = (x: readonly number[], v: number) => {
    let lo = 0
    let hi = x.length - 1
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1
      if (x[mid] <= v) lo = mid
      else hi = mid
    }
    return Math.abs(x[hi] - v) < Math.abs(x[lo] - v) ? hi : lo
  }
  const readout = $derived(
    cursorX === null
      ? []
      : series.map((s, i) => {
          const j = nearest(s.x, cursorX!)
          return { label: s.label, x: s.x[j], y: s.y[j], color: colorOf(s, i) }
        }),
  )
  let svgEl: SVGSVGElement | undefined = $state()
  function onMove(e: PointerEvent) {
    if (!svgEl) return
    const r = svgEl.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    if (px < M.l || px > W - M.r) return
    cursorX = xs[0] + ((px - M.l) / pw) * (xs[1] - xs[0])
  }
  function onKey(e: KeyboardEvent) {
    const s0 = series[0]
    if (!s0?.x.length) return
    const step = (xs[1] - xs[0]) / 100
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const cur = cursorX ?? xs[0]
      cursorX = Math.min(xs[1], Math.max(xs[0], cur + (e.key === 'ArrowRight' ? step : -step)))
    } else if (e.key === 'Escape') cursorX = null
  }
</script>

<figure class="plot">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="frame"
    role="img"
    aria-label={summary}
    tabindex="0"
    onkeydown={onKey}
    onpointermove={onMove}
    onpointerleave={() => (cursorX = null)}
    onblur={() => (cursorX = null)}
  >
    <svg bind:this={svgEl} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs>
        <clipPath id={`${uid}-clip`}><rect x={M.l} y={M.t} width={pw} height={ph}></rect></clipPath>
      </defs>
      <g class="grid">
        {#each xticks as t (t)}<line x1={sx(t)} x2={sx(t)} y1={M.t} y2={M.t + ph}></line>{/each}
        {#each yticks as t (t)}<line x1={M.l} x2={M.l + pw} y1={sy(t)} y2={sy(t)}></line>{/each}
      </g>
      <g class="axis">
        <line x1={M.l} x2={M.l} y1={M.t} y2={M.t + ph}></line>
        <line x1={M.l} x2={M.l + pw} y1={M.t + ph} y2={M.t + ph}></line>
        {#each xticks as t (t)}<text x={sx(t)} y={M.t + ph + 18} text-anchor="middle">{fmt(t, 3)}</text>{/each}
        {#each yticks as t (t)}<text x={M.l - 8} y={sy(t) + 4} text-anchor="end">{fmt(t, 3)}</text>{/each}
        <text class="label" x={M.l + pw / 2} y={H - 6} text-anchor="middle">{xLabel}</text>
        <text class="label" transform={`translate(14 ${M.t + ph / 2}) rotate(-90)`} text-anchor="middle">{yLabel}</text>
      </g>
      <g clip-path={`url(#${uid}-clip)`}>
        {#each hRules as r (r.at)}
          <line class="rule" x1={M.l} x2={M.l + pw} y1={sy(r.at)} y2={sy(r.at)} style={`stroke: var(--c${r.color ?? 2})`}></line>
          {#if r.label}<text class="rule-label" x={M.l + pw - 4} y={sy(r.at) - 5 < M.t + 10 ? sy(r.at) + 14 : sy(r.at) - 5} text-anchor="end">{r.label}</text>{/if}
        {/each}
        {#each vRules as r, i (r.at)}
          <line class="rule" x1={sx(r.at)} x2={sx(r.at)} y1={M.t} y2={M.t + ph} style={`stroke: var(--c${r.color ?? 2})`}></line>
          <!-- labels stacked so that close rules do not overlap -->
          {#if r.label}<text class="rule-label" x={sx(r.at) + 4} y={M.t + 14 + 16 * i}>{r.label}</text>{/if}
        {/each}
        {#each series as s, i (s.label)}
          {@const c = colorOf(s, i)}
          {#if s.kind === 'stem'}
            <g style={`stroke: ${c}; fill: ${c}`}>
              {#each s.x as x, j (j)}
                {#if finite(s.y[j])}
                  <line x1={sx(x)} x2={sx(x)} y1={base} y2={clampY(s.y[j])} stroke-width="1.4"></line>
                  {#if s.x.length <= 160}<circle cx={sx(x)} cy={clampY(s.y[j])} r="2.8"></circle>{/if}
                {/if}
              {/each}
            </g>
          {:else if s.kind === 'points'}
            <g style={`fill: ${c}`}>
              {#each s.x as x, j (j)}{#if finite(s.y[j])}<circle cx={sx(x)} cy={clampY(s.y[j])} r="3"></circle>{/if}{/each}
            </g>
          {:else}
            <path
              d={s.kind === 'stairs' ? stairsPath(s) : linePath(s)}
              fill="none"
              stroke={c}
              stroke-width={s.width ?? 2}
              stroke-dasharray={s.dashed ? '6 4' : undefined}
              stroke-linejoin="round"
            ></path>
          {/if}
        {/each}
      </g>
      {#if cursorX !== null}
        <line class="cursor" x1={sx(cursorX)} x2={sx(cursorX)} y1={M.t} y2={M.t + ph}></line>
        {#each readout as r (r.label)}
          {#if finite(r.y) && r.y >= ys[0] && r.y <= ys[1]}<circle cx={sx(r.x)} cy={sy(r.y)} r="4.5" style={`fill: ${r.color}`} class="dot"></circle>{/if}
        {/each}
      {/if}
    </svg>
  </div>
  <div class="foot">
    <ul class="legend">
      {#each series as s, i (s.label)}
        <li>
          <svg width="22" height="10" aria-hidden="true">
            <line x1="1" x2="21" y1="5" y2="5" style={`stroke: ${colorOf(s, i)}`} stroke-width="3" stroke-dasharray={s.dashed ? '5 3' : undefined}></line>
          </svg>
          {s.label}
        </li>
      {/each}
    </ul>
    <p class="readout" aria-live="polite">
      {#if cursorX !== null}
        {#each readout as r, i (r.label)}{#if i === 0}{xLabel.split(' (')[0]} = {fmt(r.x, 4)} · {/if}{r.label} : {fmt(r.y, 4)}{#if i < readout.length - 1}&nbsp;· {/if}{/each}
      {:else}
        <span class="muted">Survoler la figure (ou flèches ← → après l'avoir sélectionnée) pour lire les valeurs.</span>
      {/if}
    </p>
  </div>
</figure>

<style>
  .plot {
    margin: 1rem 0;
    min-width: 0;
  }
  .title {
    font-weight: 600;
    margin-bottom: 0.3rem;
  }
  .frame {
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    touch-action: pan-y;
  }
  .frame svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .legend svg {
    flex: none;
  }
  .grid line {
    stroke: var(--grid);
    stroke-width: 1;
  }
  .axis line {
    stroke: var(--ink-soft);
  }
  .axis text {
    fill: var(--ink-soft);
    font: 12px var(--font-body);
  }
  .axis .label {
    fill: var(--ink);
    font: 600 13px var(--font-body);
  }
  .rule {
    stroke-width: 1.4;
    stroke-dasharray: 3 3;
  }
  .rule-label {
    fill: var(--ink-soft);
    font: 12px var(--font-body);
  }
  .cursor {
    stroke: var(--ink-soft);
    stroke-dasharray: 2 3;
  }
  .dot {
    stroke: var(--surface);
    stroke-width: 1.5;
  }
  .foot {
    font-size: 0.88rem;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1rem;
    list-style: none;
    padding: 0;
    margin: 0.4rem 0 0;
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }
  .readout {
    margin: 0.3rem 0 0;
    min-height: 1.5em;
    font-variant-numeric: tabular-nums;
  }
</style>
