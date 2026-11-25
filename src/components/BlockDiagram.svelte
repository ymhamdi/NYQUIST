<script lang="ts">
  import type { DBlock, DInfo, DSum, DText, DWire } from '../lib/diagram'
  /**
   * A handout block diagram redrawn in SVG from a declarative description.
   * Blocks and junctions that have an entry in `info` are buttons: Enter,
   * Space or a click shows their role and transfer function (current values).
   */
  interface Props {
    figure: string
    caption: string
    width: number
    height: number
    blocks: DBlock[]
    sums?: DSum[]
    wires: DWire[]
    texts?: DText[]
    info: Record<string, DInfo>
    errataBase: string
  }
  let { figure, caption, width, height, blocks, sums = [], wires, texts = [], info, errataBase }: Props = $props()
  let active = $state<string | null>(null)
  const uid = $props.id()
  const toggle = (id: string) => (active = active === id ? null : id)
  const key = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(id)
    }
  }
  const tri = (b: DBlock) => `${b.x},${b.y} ${b.x + b.w},${b.y + b.h / 2} ${b.x},${b.y + b.h}`
</script>

<figure class="bd">
  <svg viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${figure ? `Figure ${figure}. ` : ""}${caption}. Les blocs sont des boutons.`}>
    <defs>
      <marker id={`${uid}-a`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" fill="currentColor"></path>
      </marker>
    </defs>
    <g class="wires" style="color: var(--ink)">
      {#each wires as w, i (i)}
        <polyline points={w.pts.join(' ')} fill="none" marker-end={w.arrow === false ? undefined : `url(#${uid}-a)`}></polyline>
      {/each}
    </g>
    {#each texts as t, i (i)}
      <text x={t.x} y={t.y} class:it={t.italic} text-anchor={t.anchor ?? 'start'} class="lbl">{t.text}</text>
    {/each}
    {#each sums as s (s.id)}
      {@const clickable = !!info[s.id]}
      <g
        class="hit"
        class:clickable
        role={clickable ? 'button' : undefined}
        tabindex={clickable ? 0 : undefined}
        aria-pressed={clickable ? active === s.id : undefined}
        aria-label={clickable ? info[s.id].title : undefined}
        onclick={clickable ? () => toggle(s.id) : undefined}
        onkeydown={clickable ? (e) => key(e, s.id) : undefined}
      >
        <circle cx={s.x} cy={s.y} r="13" class="shape"></circle>
        <line x1={s.x - 9} y1={s.y - 9} x2={s.x + 9} y2={s.y + 9}></line>
        <line x1={s.x + 9} y1={s.y - 9} x2={s.x - 9} y2={s.y + 9}></line>
      </g>
      {#each s.signs ?? [] as [txt, dx, dy] (txt + dx + dy)}
        <text x={s.x + dx} y={s.y + dy} class="sign" text-anchor="middle">{txt}</text>
      {/each}
    {/each}
    {#each blocks as b (b.id)}
      {@const clickable = !!info[b.id]}
      <g
        class="hit"
        class:clickable
        role={clickable ? 'button' : undefined}
        tabindex={clickable ? 0 : undefined}
        aria-pressed={clickable ? active === b.id : undefined}
        aria-label={clickable ? info[b.id].title : undefined}
        onclick={clickable ? () => toggle(b.id) : undefined}
        onkeydown={clickable ? (e) => key(e, b.id) : undefined}
      >
        {#if b.gain}
          <polygon points={tri(b)} class="shape"></polygon>
          <text x={b.x + b.w * 0.36} y={b.y + b.h / 2 + 5} text-anchor="middle" class="blk small">{b.label}{b.sub ?? ''}</text>
        {:else}
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="4" class="shape"></rect>
          <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 6} text-anchor="middle" class="blk"><tspan font-style="italic">{b.label}</tspan>{b.sub ?? ''}</text>
        {/if}
      </g>
    {/each}
  </svg>
  <figcaption>{#if figure}Figure {figure}. {caption} <span class="muted">(redessinée ; cliquer un bloc pour voir sa fonction de transfert)</span>{:else}{caption} <span class="muted">(schéma proposé, absent du fascicule ; cliquer un bloc pour voir sa fonction de transfert)</span>{/if}</figcaption>
  <div class="panel" aria-live="polite">
    {#if active && info[active]}
      {@const it = info[active]}
      <h4>{it.title}</h4>
      <p>{it.text}</p>
      {#if it.formula}{@html it.formula}{/if}
      {#if it.errata}<p class="muted">Voir l'errata <a href={`${errataBase}#${it.errata}`}>{it.errata}</a>.</p>{/if}
    {/if}
  </div>
</figure>

<style>
  .bd {
    margin: 1.2rem 0;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
    background: var(--surface);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
  }
  .wires polyline {
    stroke: currentColor;
    stroke-width: 1.8;
  }
  .lbl {
    fill: var(--ink);
    font: 600 14px var(--font-head);
  }
  .lbl.it {
    font-style: italic;
  }
  .sign {
    fill: var(--ink);
    font: 700 14px var(--font-body);
  }
  .hit .shape {
    fill: var(--surface);
    stroke: var(--ink);
    stroke-width: 1.8;
  }
  .hit line {
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .clickable {
    cursor: pointer;
    outline: none;
  }
  .clickable:hover .shape,
  .clickable[aria-pressed='true'] .shape {
    fill: var(--accent-soft);
  }
  .clickable[aria-pressed='true'] .shape {
    stroke: var(--accent);
    stroke-width: 2.4;
  }
  .clickable:focus-visible .shape {
    stroke: var(--focus);
    stroke-width: 3;
  }
  .blk {
    fill: var(--ink);
    font: 600 16px var(--font-head);
  }
  .blk.small {
    font-size: 14px;
  }
  figcaption {
    font-size: 0.9rem;
    margin-top: 0.4rem;
  }
  .panel :global(h4) {
    margin: 0.6rem 0 0.2rem;
    font-size: 1rem;
  }
  .panel p {
    margin: 0.2rem 0;
  }
</style>
