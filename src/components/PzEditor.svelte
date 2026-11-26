<script lang="ts">
  /**
   * Pole/zero explorer: a conjugate pole pair and a conjugate zero pair that
   * the learner moves on the z-plane (pointer drag, or keyboard: arrows on a
   * focused handle). The filter H(z) = g·(z² − 2ρcosφ z + ρ²)/(z² − 2r cosθ z + r²),
   * its frequency and impulse responses, stability and MATLAB coefficients
   * follow. Every number comes from the engine.
   */
  import { freqz } from '../engine/dsp'
  import { impz } from '../engine/lti'
  import { fmt } from '../lib/format'
  import Plot from './Plot.svelte'

  const uid = $props.id()
  let pole = $state({ r: 0.8, th: Math.PI / 4 })
  let zero = $state({ r: 1, th: Math.PI })
  let dragging = $state<'pole' | 'zero' | null>(null)

  const quad = (m: number, ang: number) => [1, -2 * m * Math.cos(ang), m * m]
  const a = $derived(quad(pole.r, pole.th))
  const b0 = $derived(quad(zero.r, zero.th))
  /** unit gain at z = 1 when possible */
  const g = $derived(Math.abs(b0[0] + b0[1] + b0[2]) > 1e-9 ? (a[0] + a[1] + a[2]) / (b0[0] + b0[1] + b0[2]) : 1)
  const b = $derived(b0.map((v) => v * g))
  const stable = $derived(pole.r < 1)
  const fr = $derived(freqz(b, a, 256))
  const dB = $derived(fr.H.map((h) => 20 * Math.log10(Math.max(Math.hypot(h.re, h.im), 1e-12))))
  const wPi = $derived(fr.w.map((w) => w / Math.PI))
  const h = $derived(impz(b, a, 40))
  const peak = $derived(wPi[dB.indexOf(Math.max(...dB))])
  /** 6 significant digits; round-off such as cos(π/2) ≈ 6e-17 written as 0 */
  const num = (v: number) => (Math.abs(v) < 1e-12 ? '0' : String(Number(v.toPrecision(6))))
  const matlab = $derived(`b = [${b.map(num).join(' ')}];\na = [${a.map(num).join(' ')}];\nzplane(b, a); figure; freqz(b, a); figure; impz(b, a, ${h.length});`)

  // geometry of the plane
  const S = 300
  const R = 1.5
  const sc = (S / 2 - 16) / R
  const X = (re: number) => S / 2 + re * sc
  const Y = (im: number) => S / 2 - im * sc
  const pt = (p: { r: number; th: number }) => ({ x: X(p.r * Math.cos(p.th)), y: Y(p.r * Math.sin(p.th)) })
  const mirror = (p: { r: number; th: number }) => ({ x: X(p.r * Math.cos(p.th)), y: Y(-p.r * Math.sin(p.th)) })
  let svg: SVGSVGElement | undefined = $state()

  const clampR = (r: number) => Math.min(1.45, Math.max(0, r))
  const clampTh = (t: number) => Math.min(Math.PI, Math.max(0, t))
  function move(which: 'pole' | 'zero', e: PointerEvent) {
    if (!svg) return
    const m = svg.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const re = (p.x - S / 2) / sc
    const im = Math.abs((S / 2 - p.y) / sc) // the handle stays in the upper half; its conjugate mirrors it
    const target = { r: clampR(Math.hypot(re, im)), th: clampTh(Math.atan2(im, re)) }
    if (which === 'pole') pole = target
    else zero = target
  }
  function key(which: 'pole' | 'zero', e: KeyboardEvent) {
    const p = which === 'pole' ? pole : zero
    const k = e.shiftKey ? 5 : 1
    let { r, th } = p
    if (e.key === 'ArrowLeft') th += (k * Math.PI) / 90
    else if (e.key === 'ArrowRight') th -= (k * Math.PI) / 90
    else if (e.key === 'ArrowUp') r += 0.01 * k
    else if (e.key === 'ArrowDown') r -= 0.01 * k
    else return
    e.preventDefault()
    const next = { r: clampR(r), th: clampTh(th) }
    if (which === 'pole') pole = next
    else zero = next
  }
  const describe = (name: string, p: { r: number; th: number }) =>
    `${name} : module ${fmt(p.r, 3)}, angle ${fmt(p.th / Math.PI, 3)}π. Flèches gauche et droite : angle ; haut et bas : module.`
</script>

<div class="pz">
  <p>
    Déplacez la paire de pôles (×) et la paire de zéros (○), à la souris, au doigt ou au clavier (sélectionnez une poignée avec Tab, puis les flèches). Le
    conjugué suit, donc les coefficients restent réels ; le gain est réglé pour |H(1)| = 1 quand c'est possible.
  </p>
  <div class="grid">
    <figure>
      <svg bind:this={svg} viewBox={`0 0 ${S} ${S}`} role="group" aria-label="Plan z : poignées du pôle et du zéro" style="touch-action: none">
        <line class="ax" x1="8" x2={S - 8} y1={S / 2} y2={S / 2}></line>
        <line class="ax" y1="8" y2={S - 8} x1={S / 2} x2={S / 2}></line>
        <circle class="unit" cx={S / 2} cy={S / 2} r={sc}></circle>
        <text x={X(1) + 3} y={S / 2 + 14} class="lbl">1</text>
        <text x={X(-1) - 12} y={S / 2 + 14} class="lbl">−1</text>
        <!-- conjugates (follow the handles) -->
        <circle class="zero ghost" cx={mirror(zero).x} cy={mirror(zero).y} r="7"></circle>
        <g class="pole ghost" transform={`translate(${mirror(pole).x} ${mirror(pole).y})`}><line x1="-7" y1="-7" x2="7" y2="7"></line><line x1="-7" y1="7" x2="7" y2="-7"></line></g>
        <!-- handles -->
        <g
          class="handle"
          class:active={dragging === 'zero'}
          role="button"
          tabindex="0"
          aria-label={describe('Zéro', zero)}
          aria-describedby={`${uid}-state`}
          onpointerdown={(e) => {
            dragging = 'zero'
            ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
          }}
          onpointermove={(e) => dragging === 'zero' && move('zero', e)}
          onpointerup={() => (dragging = null)}
          onkeydown={(e) => key('zero', e)}
        >
          <circle class="hit" cx={pt(zero).x} cy={pt(zero).y} r="18"></circle>
          <circle class="zero" cx={pt(zero).x} cy={pt(zero).y} r="8"></circle>
        </g>
        <g
          class="handle"
          class:active={dragging === 'pole'}
          role="button"
          tabindex="0"
          aria-label={describe('Pôle', pole)}
          aria-describedby={`${uid}-state`}
          onpointerdown={(e) => {
            dragging = 'pole'
            ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
          }}
          onpointermove={(e) => dragging === 'pole' && move('pole', e)}
          onpointerup={() => (dragging = null)}
          onkeydown={(e) => key('pole', e)}
        >
          <circle class="hit" cx={pt(pole).x} cy={pt(pole).y} r="18"></circle>
          <g class="pole" transform={`translate(${pt(pole).x} ${pt(pole).y})`}><line x1="-8" y1="-8" x2="8" y2="8"></line><line x1="-8" y1="8" x2="8" y2="-8"></line></g>
        </g>
      </svg>
      <figcaption id={`${uid}-state`} class:bad={!stable} aria-live="polite">
        Pôles {fmt(pole.r, 3)}·e^(±j{fmt(pole.th / Math.PI, 3)}π) : {stable ? 'dans le cercle unité, filtre stable' : 'hors du cercle unité, filtre instable'}.
        Zéros {fmt(zero.r, 3)}·e^(±j{fmt(zero.th / Math.PI, 3)}π).
      </figcaption>
    </figure>
    <div>
      <Plot
        series={[{ x: wPi, y: dB, label: '|H| (dB)', color: 1 }]}
        xLabel="ω / π"
        yLabel="|H| (dB)"
        summary={`Réponse en fréquence : maximum en ω = ${fmt(peak, 3)}π, près de l'angle des pôles ; creux près de l'angle des zéros.`}
        height={220}
      />
      <Plot
        series={[{ x: h.map((_, k) => k), y: h, kind: 'stem', label: 'h[n]', color: stable ? 3 : 2 }]}
        xLabel="n"
        yLabel="h[n]"
        summary={`Réponse impulsionnelle sur ${h.length} échantillons : ${stable ? 'elle s’amortit' : 'elle diverge'}.`}
        height={200}
      />
    </div>
  </div>
  <pre aria-label="Coefficients en MATLAB"><code>{matlab}</code></pre>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: minmax(0, 20rem) minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }
  @media (max-width: 40rem) {
    .grid {
      grid-template-columns: minmax(0, 1fr);
    }
  }
  figure {
    margin: 0;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
  }
  .ax {
    stroke: var(--ink-soft);
  }
  .unit {
    fill: none;
    stroke: var(--ink-soft);
    stroke-dasharray: 4 4;
  }
  .lbl {
    fill: var(--ink-soft);
    font: 12px var(--font-body);
  }
  .zero {
    fill: var(--surface);
    stroke: var(--c3);
    stroke-width: 2.6;
  }
  .pole line {
    stroke: var(--c2);
    stroke-width: 3;
  }
  .ghost {
    opacity: 0.45;
  }
  .handle {
    cursor: grab;
    outline: none;
  }
  .handle.active {
    cursor: grabbing;
  }
  .hit {
    fill: transparent;
  }
  .handle:focus-visible .hit {
    fill: none;
    stroke: var(--focus);
    stroke-width: 3;
  }
  figcaption {
    margin-top: 0.4rem;
    font-size: 0.9rem;
  }
  figcaption.bad {
    color: var(--bad);
  }
  pre {
    margin: 0.8rem 0 0;
    padding: 0.6rem 0.9rem;
    overflow-x: auto;
    background: var(--code-bg);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    font-size: 0.85rem;
  }
  pre code {
    font-size: inherit;
  }
</style>
