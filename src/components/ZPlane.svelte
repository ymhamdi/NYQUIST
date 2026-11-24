<script lang="ts">
  /**
   * The z-plane (or s-plane): unit circle, poles (×), zeros (○), and an
   * optional root-locus path. For a sampled system, stable ⇔ every pole
   * inside the circle.
   */
  import type { Complex } from '../engine/complex'
  import { fmt } from '../lib/format'

  interface Marker extends Complex {
    label?: string
  }
  interface Props {
    poles: Complex[]
    zeros?: Complex[]
    /** root locus: list of points, drawn as a path */
    locus?: Complex[]
    /** points along the locus to label (e.g. K = Kmax) */
    marks?: Marker[]
    summary: string
    title?: string
    /** half-width of the square view (default fits the unit circle and every point) */
    span?: number
    unitCircle?: boolean
  }
  let { poles, zeros = [], locus = [], marks = [], summary, title, span, unitCircle = true }: Props = $props()

  const S = 320
  const pad = 30
  const R = $derived(
    span ??
      Math.max(
        unitCircle ? 1.25 : 0.5,
        ...[...poles, ...zeros, ...marks].map((z) => Math.max(Math.abs(z.re), Math.abs(z.im)) * 1.15),
      ),
  )
  const sc = $derived((S / 2 - pad) / R)
  const X = (re: number) => S / 2 + re * sc
  const Y = (im: number) => S / 2 - im * sc
  const clip = (v: number) => Math.max(-R * 1.05, Math.min(R * 1.05, v))
  const locusPath = $derived(
    locus.filter((z) => Number.isFinite(z.re)).map((z, i) => `${i ? 'L' : 'M'}${X(clip(z.re)).toFixed(1)} ${Y(clip(z.im)).toFixed(1)}`).join(''),
  )
  const ticks = $derived([-1, 1].map((k) => k * (R >= 2 ? Math.floor(R) : 1)))
</script>

<figure class="zp">
  {#if title}<figcaption>{title}</figcaption>{/if}
  <div class="frame" role="img" aria-label={summary}>
    <svg viewBox={`0 0 ${S} ${S}`} aria-hidden="true">
      <line class="ax" x1={pad / 2} x2={S - pad / 2} y1={S / 2} y2={S / 2}></line>
      <line class="ax" y1={pad / 2} y2={S - pad / 2} x1={S / 2} x2={S / 2}></line>
      {#each ticks as t (t)}
        <text x={X(t)} y={S / 2 + 16} text-anchor="middle">{fmt(t, 2)}</text>
      {/each}
      <text x={S - pad / 2} y={S / 2 - 6} text-anchor="end" class="lbl">Re</text>
      <text x={S / 2 + 6} y={pad / 2 + 8} class="lbl">Im</text>
      {#if unitCircle}<circle class="unit" cx={S / 2} cy={S / 2} r={sc}></circle>{/if}
      {#if locusPath}<path class="locus" d={locusPath}></path>{/if}
      {#each marks as m, i (i)}
        <circle class="mark" cx={X(clip(m.re))} cy={Y(clip(m.im))} r="4"></circle>
        {#if m.label}<text class="mlabel" x={X(clip(m.re))} y={Y(clip(m.im)) - 9} text-anchor="middle">{m.label}</text>{/if}
      {/each}
      {#each zeros as z, i (i)}
        <circle class="zero" cx={X(clip(z.re))} cy={Y(clip(z.im))} r="6"></circle>
      {/each}
      {#each poles as p, i (i)}
        <g class="pole" transform={`translate(${X(clip(p.re))} ${Y(clip(p.im))})`}>
          <line x1="-6" y1="-6" x2="6" y2="6"></line>
          <line x1="-6" y1="6" x2="6" y2="-6"></line>
        </g>
      {/each}
    </svg>
  </div>
  <p class="key"><span class="k-pole">×</span> pôle · <span class="k-zero">○</span> zéro{#if locus.length} · <span class="k-locus">—</span> lieu des racines{/if}{#if unitCircle} · cercle unité en pointillés{/if}</p>
</figure>

<style>
  .zp {
    margin: 1rem 0;
    max-width: 22rem;
  }
  figcaption {
    font-weight: 600;
    margin-bottom: 0.3rem;
  }
  .frame {
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .ax {
    stroke: var(--ink-soft);
    stroke-width: 1;
  }
  text {
    fill: var(--ink-soft);
    font: 12px var(--font-body);
  }
  .lbl {
    font-style: italic;
  }
  .unit {
    fill: none;
    stroke: var(--ink-soft);
    stroke-dasharray: 4 4;
  }
  .locus {
    fill: none;
    stroke: var(--c1);
    stroke-width: 3;
    opacity: 0.55;
  }
  .mark {
    fill: var(--c2);
  }
  .mlabel {
    fill: var(--ink);
    font-weight: 600;
  }
  .pole line {
    stroke: var(--c2);
    stroke-width: 2.6;
  }
  .zero {
    fill: none;
    stroke: var(--c3);
    stroke-width: 2.4;
  }
  .key {
    font-size: 0.85rem;
    color: var(--ink-soft);
    margin: 0.3rem 0 0;
  }
  .k-pole {
    color: var(--c2);
    font-weight: 700;
  }
  .k-zero {
    color: var(--c3);
    font-weight: 700;
  }
  .k-locus {
    color: var(--c1);
    font-weight: 700;
  }
</style>
