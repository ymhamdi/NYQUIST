<script lang="ts">
  /** Automatique TP1: the tutorial (part II) and the first-order system of figure 1.6 (part III). */
  import { PART_II, PART_III, question } from '../../content/aeTp1'
  import { unityFeedbackFirstOrder } from '../../derive/continuous'
  import { fig16 } from '../../figures/aeTp1'
  import { fmt } from '../../lib/format'
  import { SCRIPT_NAME, SCRIPT_SOURCE, tp1 } from '../../lib/stores/aeTp1.svelte'
  import BlockDiagram from '../BlockDiagram.svelte'
  import CodeCell from '../CodeCell.svelte'
  import Derivation from '../Derivation.svelte'
  import ParamSlider from '../ParamSlider.svelte'
  import Plot from '../Plot.svelte'
  import Predict from '../Predict.svelte'
  import QuestionHead from '../QuestionHead.svelte'

  interface Props {
    report?: boolean
    errataBase: string
  }
  let { report = false, errataBase }: Props = $props()
  const v = tp1.values
  $effect(() => tp1.restore())
  const spec = (n: string) => tp1.specs.find((s) => s.name === n)!
  const r = $derived(tp1.result)
  const c1 = $derived(r['III.1'])
  const c2 = $derived(r['III.2'])
  const b = $derived(c1.G.num.at(-1)!)
  const a = $derived(c1.G.den.at(-1)!)
</script>

<section aria-labelledby="partie-II">
  <h2 id="partie-II">II. {PART_II.title}</h2>
  <p>Cette partie du fascicule présente l'interface (figures 1.1 à 1.5), sans question. En résumé :</p>
  <ol>
    {#each PART_II.steps as s (s)}<li>{s}</li>{/each}
  </ol>
</section>

<section aria-labelledby="partie-III">
  <h2 id="partie-III">III. {PART_III.title}</h2>
  <BlockDiagram figure={PART_III.figure.number} caption={PART_III.figure.caption} {...fig16(c1.G, c1.F, c1.Uf, c1.t_step)} {errataBase} />
  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages de la partie III">
      <div class="grid">
        <ParamSlider spec={spec('Uf')} values={v} label="Valeur finale du bloc Step" />
        <ParamSlider spec={spec('t_step')} values={v} label="Instant du saut (Step time)" />
      </div>
    </div>
  {:else}
    <p class="card">Valeurs utilisées : valeur finale {fmt(c1.Uf, 6)}, saut à t = {fmt(c1.t_step, 6)} s.</p>
  {/if}

  <article>
    <QuestionHead q={question('III.1')} part="III" />
    <p class="note">
      L'énoncé écrit G(p) = 9/(s+9) (variables p et s mélangées) et parle du système G ; or la figure 1.6 ferme la boucle par le bloc Sum. Le Scope montre donc
      la boucle fermée (<a href={`${errataBase}#E-AE15`}>errata E-AE15</a>).
    </p>
    <Predict always={report} id="ae1-III1" kind="number" prompt={`Vers quelle valeur la sortie du Scope tend-elle pour un échelon de ${fmt(c1.Uf, 4)} ?`} expected={c1.y_final} tolerance={0.03}>
      <Derivation steps={unityFeedbackFirstOrder(b, a, c1.Uf)} />
      <Plot
        series={[
          { x: c1.t, y: c1.u, label: 'Step', color: 4, dashed: true },
          { x: c1.t, y: c1.y, label: 'sortie (boucle de la figure 1.6)', color: 1 },
          { x: c1.t, y: c1.y_bo, label: 'G seule, sans retour', color: 2, dashed: true },
        ]}
        xLabel="t (s)"
        yLabel="amplitude"
        summary={`Scope : échelon à t = ${fmt(c1.t_step, 3)} s ; la sortie de la boucle tend vers ${fmt(c1.y_final, 3)}, G seule vers ${fmt(c1.Uf * c1.gain_statique_bo, 3)}.`}
      />
      <CodeCell script={tp1.script} original={SCRIPT_SOURCE} cell="III.1" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('III.2')} part="III" />
    <Predict always={report} id="ae1-III2" kind="choice" prompt="Si l'on double la valeur finale du Step, la constante de temps de la réponse…" options={['double', 'est divisée par deux', 'ne change pas']} correct={2}>
      <p>
        Le système est linéaire : la sortie est proportionnelle à l'entrée. La valeur finale vaut {fmt(c1.gain_statique, 4)} × la valeur du Step (rapport mesuré :
        {c2.rapport_sortie_entree.map((x) => fmt(x, 4)).join(' ; ')}), et la constante de temps reste {fmt(c1.tau, 4)} s.
      </p>
      <Plot
        series={c2.reponses.map((y, i) => ({ x: c1.t, y, label: `valeur finale ${fmt(c2.Uf_liste[i], 3)}`, color: i + 1 }))}
        xLabel="t (s)"
        yLabel="sortie"
        summary={`Réponses pour des valeurs finales ${c2.Uf_liste.map((x) => fmt(x, 3)).join(', ')} : même forme, amplitudes proportionnelles.`}
      />
      <CodeCell script={tp1.script} original={SCRIPT_SOURCE} cell="III.2" filename={SCRIPT_NAME} needs={['III.1']} />
    </Predict>
  </article>
</section>

<style>
  .params {
    margin: 1rem 0;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 0.8rem 1.4rem;
  }
  article {
    margin-top: 2rem;
  }
</style>
