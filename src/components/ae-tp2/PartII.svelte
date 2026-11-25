<script lang="ts">
  /** Automatique TP2, part II: a zero-order hold on sin(t). Every number comes from the engine. */
  import { PART_II, question } from '../../content/aeTp2'
  import { zohSine } from '../../derive/discretization'
  import { figZohChain } from '../../figures/aeTp2'
  import { fmt } from '../../lib/format'
  import { SCRIPT_NAME, SCRIPT_SOURCE, tp2 } from '../../lib/stores/aeTp2.svelte'
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
  const v = tp2.values
  $effect(() => tp2.restore())
  const spec = (n: string) => tp2.specs.find((s) => s.name === n)!
  const r = $derived(tp2.result)
  const c1 = $derived(r['II.1'])
  const c2 = $derived(r['II.2'])
  const T = $derived(v.T_sin as number)
</script>

<section aria-labelledby="partie-II">
  <h2 id="partie-II">II. {PART_II.title}</h2>
  <p class="note">
    « Fréquence 1 rad/sec » : le rad/s est l'unité d'une pulsation, ω = {fmt(c1.w, 3)} rad/s, soit f = {fmt(c1.w / (2 * Math.PI), 3)} Hz. La période d'échantillonnage
    n'est pas donnée (<a href={`${errataBase}#E-AE16`}>errata E-AE16</a>).
  </p>
  <BlockDiagram figure="" caption="Schéma Simulink de la partie II" {...figZohChain(c1.w, T)} {errataBase} />
  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages de la partie II">
      <ParamSlider spec={spec('T_sin')} values={v} label="Période d'échantillonnage T" errata={`${errataBase}#E-AE16`} />
    </div>
  {:else}
    <p class="card">Valeur utilisée : T = {fmt(T, 6)} s.</p>
  {/if}

  <article>
    <QuestionHead q={question('II.1')} part="II" />
    <Predict always={report} id="ae2-II1" kind="number" prompt={`Combien d'échantillons par période de la sinusoïde pour T = ${fmt(T, 4)} s ?`} expected={(2 * Math.PI) / (c1.w * T)} tolerance={0.05}>
      <Derivation steps={zohSine(c1.w, T)} />
      <Plot
        series={[
          { x: c1.t, y: c1.x, label: 'sin(t)', color: 1 },
          { x: c1.t, y: c1.x_bloque, label: 'sortie du bloqueur', color: 2, width: 2.4 },
          { x: c1.tk, y: c1.xk, kind: 'points', label: 'échantillons x(kT)', color: 3 },
        ]}
        xLabel="t (s)"
        yLabel="amplitude"
        summary={`Sinusoïde et sortie du bloqueur pour T = ${fmt(T, 3)} s : écart maximal ${fmt(c1.erreur_max, 3)}, sous la borne ω·T = ${fmt(c1.borne_erreur, 3)}.`}
      />
      <p>Écart maximal mesuré : {fmt(c1.erreur_max, 4)}, sous la borne ω·T = {fmt(c1.borne_erreur, 4)}.</p>
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="II.1" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('II.2')} part="II" />
    <Predict always={report} id="ae2-II2" kind="number" prompt="Au-delà de quelle période T (en s) la sinusoïde n'est-elle plus reconstituable (Shannon) ?" expected={c2.T_shannon} tolerance={0.03} unit="s">
      <table class="cmp num">
        <thead><tr><th>T (s)</th><th>points par période</th><th>écart maximal</th><th>retard moyen (s)</th></tr></thead>
        <tbody>
          {#each c2.T_liste as Ti, i (Ti)}
            <tr><td>{fmt(Ti, 3)}</td><td>{fmt(c2.points_par_periode[i], 3)}</td><td>{fmt(c2.erreurs[i], 3)}</td><td>{fmt(c2.retard_moyen[i], 3)}</td></tr>
          {/each}
        </tbody>
      </table>
      <div class="grid4">
        {#each c2.T_liste as Ti, i (Ti)}
          <Plot
            series={[
              { x: c1.t, y: c1.x, label: 'sin(t)', color: 1 },
              { x: c1.t, y: c2.bloques[i], label: 'bloqué', color: 2 },
            ]}
            xLabel="t (s)"
            yLabel="x"
            title={`T = ${fmt(Ti, 3)} s`}
            height={220}
            summary={`T = ${fmt(Ti, 3)} s : ${fmt(c2.points_par_periode[i], 3)} points par période, écart maximal ${fmt(c2.erreurs[i], 3)}.`}
          />
        {/each}
      </div>
      <p>
        Plus T grandit, plus l'escalier s'écarte de la sinusoïde et la retarde. Au-delà de T = π/ω = {fmt(c2.T_shannon, 4)} s, il y a moins de deux points par
        période : la sinusoïde ne peut plus être reconstituée.
      </p>
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="II.2" filename={SCRIPT_NAME} needs={['II.1']} />
    </Predict>
  </article>
</section>

<style>
  .params {
    margin: 1rem 0;
    max-width: 30rem;
  }
  article {
    margin-top: 2rem;
  }
  .cmp {
    display: block;
    overflow-x: auto;
    margin: 0.6rem 0;
  }
  .grid4 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
    gap: 0 1rem;
  }
</style>
