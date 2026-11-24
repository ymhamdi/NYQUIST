<script lang="ts">
  /**
   * Figures 3.1 and 3.2 of the fascicule, redrawn: comparator, sampler,
   * digital controller, sampler, zero-order hold, plant, unity feedback.
   * Each block is a button: it shows its transfer function with the current
   * values (from the engine).
   */
  import { fmt } from '../lib/format'
  import { eq, exp, frac, math, mi, minus, mn, mo, paren, row, sub } from '../lib/mathml'

  interface Props {
    /** figure number and caption, as in the fascicule */
    figure: string
    caption: string
    input: string
    output: string
    T: number
    K: number
    k: number
    tau: number
    /** link to the errata page anchors */
    errataBase: string
  }
  let { figure, caption, input, output, T, K, k, tau, errataBase }: Props = $props()

  type BlockId = 'cmp' | 's1' | 'c' | 's2' | 'b0' | 'g1' | 'fb'
  let active = $state<BlockId | null>(null)
  const uid = $props.id()

  const b = $derived(Math.exp(-T / tau))
  const plant = $derived(frac(mn(k, 6), row(tau === 1 ? mi('s') : row(mn(tau, 6), mi('s')), mo('+'), mn(1))))

  const info = $derived.by((): Record<BlockId, { title: string; text: string; formula?: string; errata?: string }> => ({
    cmp: {
      title: 'Comparateur',
      text: `Il forme l'écart entre la consigne et la sortie mesurée : ε = ${input} − ${output}.`,
    },
    s1: {
      title: 'Échantillonneur',
      text: `Il prélève l'écart aux instants kT, avec T = ${fmt(T, 6)} s (la période n'est pas donnée par l'énoncé).`,
      errata: 'E-AE1',
    },
    c: {
      title: 'Contrôleur numérique proportionnel',
      text: `Il multiplie l'écart échantillonné par K = ${fmt(K, 6)}. La figure le note C(s), mais c'est un calcul numérique : C(z) = K. Comme c'est un simple gain, les deux échantillonneurs de la figure reviennent à un seul.`,
      formula: math(eq(row(mi('C'), paren(mi('z'))), mi('K'), mn(K, 6)), { display: true }),
      errata: 'E-AE4',
    },
    s2: {
      title: 'Échantillonneur (sortie du contrôleur)',
      text: `La commande est calculée une fois par période T = ${fmt(T, 6)} s.`,
    },
    b0: {
      title: "Bloqueur d'ordre zéro",
      text: `Il maintient la commande constante pendant toute la période, jusqu'à l'échantillon suivant.`,
      formula: math(
        eq(row(sub(mi('B'), mn(0)), paren(mi('s'))), frac(row(mn(1), mo('−'), exp(row(mo('−'), mi('s'), mi('T')))), mi('s'))),
        { display: true },
      ),
    },
    g1: {
      title: 'Procédé',
      text: `Premier ordre : gain statique ${fmt(k, 6)}, constante de temps ${fmt(tau, 6)} s. Associé au bloqueur, il donne une transformée en z du premier ordre (calcul détaillé dans la question correspondante).`,
      formula: math(
        row(
          eq(row(sub(mi('G'), mn(1)), paren(mi('s'))), plant),
          mo(';'),
          mtextSpace(),
          eq(row(sub(mi('G'), mn(0)), paren(mi('z'))), frac(mn(k * (1 - b), 4), minus(mi('z'), b, 6))),
        ),
        { display: true },
      ),
    },
    fb: {
      title: 'Retour unitaire',
      text: `La sortie ${output} est ramenée telle quelle sur le comparateur (gain 1).`,
    },
  }))
  function mtextSpace() {
    return '<mspace width="1em"></mspace>'
  }
  function toggle(id: BlockId) {
    active = active === id ? null : id
  }
  function key(e: KeyboardEvent, id: BlockId) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(id)
    }
  }
  const blocks: { id: BlockId; x: number; w: number; label: string; sub?: string }[] = [
    { id: 'c', x: 176, w: 84, label: 'C', sub: '(s)' },
    { id: 'b0', x: 346, w: 92, label: 'B', sub: '₀(s)' },
    { id: 'g1', x: 470, w: 92, label: 'G', sub: '₁(s)' },
  ]
</script>

<figure class="loop">
  <svg viewBox="0 0 720 190" role="group" aria-label={`Figure ${figure}. ${caption}. Chaque bloc est un bouton.`}>
    <defs>
      <marker id={`${uid}-arr`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" fill="currentColor"></path>
      </marker>
    </defs>
    <g class="wires" style="color: var(--ink)">
      <text x="6" y="48" class="io">{input}</text>
      <line x1="6" y1="64" x2="86" y2="64" marker-end={`url(#${uid}-arr)`}></line>
      <line x1="114" y1="64" x2="128" y2="64"></line>
      <line x1="128" y1="64" x2="152" y2="50" class="switch"></line>
      <line x1="154" y1="64" x2="174" y2="64" marker-end={`url(#${uid}-arr)`}></line>
      <line x1="260" y1="64" x2="290" y2="64"></line>
      <line x1="290" y1="64" x2="314" y2="50" class="switch"></line>
      <line x1="316" y1="64" x2="344" y2="64" marker-end={`url(#${uid}-arr)`}></line>
      <line x1="438" y1="64" x2="468" y2="64" marker-end={`url(#${uid}-arr)`}></line>
      <line x1="562" y1="64" x2="700" y2="64" marker-end={`url(#${uid}-arr)`}></line>
      <text x="640" y="48" class="io">{output}</text>
      <line x1="610" y1="64" x2="610" y2="150" class="fbline"></line>
      <line x1="610" y1="150" x2="100" y2="150" class="fbline"></line>
      <line x1="100" y1="150" x2="100" y2="80" class="fbline" marker-end={`url(#${uid}-arr)`}></line>
      <text x="76" y="56" class="sign">+</text>
      <text x="106" y="96" class="sign">−</text>
    </g>

    <!-- clickable parts -->
    <g class="hit" role="button" tabindex="0" aria-pressed={active === 'cmp'} aria-label="Comparateur" onclick={() => toggle('cmp')} onkeydown={(e) => key(e, 'cmp')}>
      <circle cx="100" cy="64" r="14" class="shape"></circle>
      <line x1="90" y1="54" x2="110" y2="74"></line>
      <line x1="110" y1="54" x2="90" y2="74"></line>
    </g>
    {#each [{ id: 's1' as BlockId, x: 126 }, { id: 's2' as BlockId, x: 288 }] as s (s.id)}
      <g class="hit" role="button" tabindex="0" aria-pressed={active === s.id} aria-label="Échantillonneur" onclick={() => toggle(s.id)} onkeydown={(e) => key(e, s.id)}>
        <rect x={s.x - 4} y="38" width="36" height="34" class="pad"></rect>
        <text x={s.x + 14} y="94" class="small" text-anchor="middle">T</text>
      </g>
    {/each}
    {#each blocks as bl (bl.id)}
      <g class="hit" role="button" tabindex="0" aria-pressed={active === bl.id} aria-label={`Bloc ${bl.label}${bl.sub}`} onclick={() => toggle(bl.id)} onkeydown={(e) => key(e, bl.id)}>
        <rect x={bl.x} y="40" width={bl.w} height="48" rx="4" class="shape"></rect>
        <text x={bl.x + bl.w / 2} y="70" text-anchor="middle" class="blk"><tspan font-style="italic">{bl.label}</tspan>{bl.sub}</text>
      </g>
    {/each}
    <g class="hit" role="button" tabindex="0" aria-pressed={active === 'fb'} aria-label="Retour unitaire" onclick={() => toggle('fb')} onkeydown={(e) => key(e, 'fb')}>
      <rect x="300" y="138" width="140" height="24" class="pad"></rect>
      <text x="370" y="176" text-anchor="middle" class="small">retour unitaire</text>
    </g>
  </svg>
  <figcaption>Figure {figure}. {caption} <span class="muted">(redessinée ; cliquer un bloc pour voir sa fonction de transfert)</span></figcaption>
  <div class="panel" aria-live="polite">
    {#if active}
      {@const it = info[active]}
      <h4>{it.title}</h4>
      <p>{it.text}</p>
      {#if it.formula}{@html it.formula}{/if}
      {#if it.errata}<p class="muted">Voir l'errata <a href={`${errataBase}#${it.errata}`}>{it.errata}</a>.</p>{/if}
    {/if}
  </div>
</figure>

<style>
  .loop {
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
  .wires line {
    stroke: currentColor;
    stroke-width: 1.8;
  }
  .switch {
    stroke-width: 2.2;
  }
  .io {
    fill: var(--ink);
    font: italic 600 15px var(--font-head);
  }
  .sign {
    fill: var(--ink);
    font: 700 15px var(--font-body);
  }
  .hit {
    cursor: pointer;
    outline: none;
  }
  .hit .shape {
    fill: var(--surface);
    stroke: var(--ink);
    stroke-width: 1.8;
  }
  .hit line {
    stroke: var(--ink);
    stroke-width: 1.6;
  }
  .hit .pad {
    fill: transparent;
    stroke: transparent;
  }
  .hit:hover .shape,
  .hit:hover .pad {
    fill: var(--accent-soft);
  }
  .hit[aria-pressed='true'] .shape,
  .hit[aria-pressed='true'] .pad {
    fill: var(--accent-soft);
    stroke: var(--accent);
    stroke-width: 2.4;
  }
  .hit:focus-visible .shape,
  .hit:focus-visible .pad {
    stroke: var(--focus);
    stroke-width: 3;
  }
  .blk {
    fill: var(--ink);
    font: 600 17px var(--font-head);
  }
  .small {
    fill: var(--ink-soft);
    font: 13px var(--font-body);
  }
  figcaption {
    font-size: 0.9rem;
    margin-top: 0.4rem;
  }
  .panel {
    min-height: 0.5rem;
  }
  .panel :global(h4) {
    margin: 0.6rem 0 0.2rem;
    font-size: 1rem;
  }
  .panel p {
    margin: 0.2rem 0;
  }
</style>
