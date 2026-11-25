<script lang="ts">
  /** Automatique TP2, part IV: the DC motor, discretized with and without a hold. Every number comes from the engine. */
  import { PART_IV, question } from '../../content/aeTp2'
  import { motorPolesZ } from '../../derive/discretization'
  import { motorModel } from '../../derive/pid'
  import { figMotorOpen } from '../../figures/aeTp2'
  import { fmt } from '../../lib/format'
  import { SCRIPT_NAME, SCRIPT_SOURCE, tp2 } from '../../lib/stores/aeTp2.svelte'
  import BlockDiagram from '../BlockDiagram.svelte'
  import CodeCell from '../CodeCell.svelte'
  import Derivation from '../Derivation.svelte'
  import ParamSlider from '../ParamSlider.svelte'
  import Plot from '../Plot.svelte'
  import Predict from '../Predict.svelte'
  import QuestionHead from '../QuestionHead.svelte'
  import ZPlane from '../ZPlane.svelte'

  interface Props {
    report?: boolean
    errataBase: string
  }
  let { report = false, errataBase }: Props = $props()
  const v = tp2.values
  $effect(() => tp2.restore())
  const spec = (n: string) => tp2.specs.find((s) => s.name === n)!
  const r = $derived(tp2.result)
  const m = $derived(r['IV.1'])
  const z = $derived(r['IV.2'])
  const c3 = $derived(r['IV.3'])
  const c4 = $derived(r['IV.4'])
  const Tm = $derived(v.T_m as number)
  const tk = $derived(c3.km.map((i) => i * Tm))
</script>

<section aria-labelledby="partie-IV">
  <h2 id="partie-IV">IV. {PART_IV.title}</h2>
  <div class="statement">
    {#each PART_IV.intro as p (p)}<p><q>{p}</q></p>{/each}
    <p class="muted">Fascicule, p. 11. L'équation mécanique écrite avant (2) a une erreur de signe (<a href={`${errataBase}#E-AE21`}>errata E-AE21</a>) ; T et Cr ne sont pas donnés (<a href={`${errataBase}#E-AE24`}>E-AE24</a>).</p>
  </div>
  <table class="t21 num">
    <caption>Tableau 2.1. Paramètres d'un moteur à courant continu (tel qu'imprimé)</caption>
    <tbody>{#each PART_IV.table as [name, val] (name)}<tr><th scope="row">{name}</th><td>{val}</td></tr>{/each}</tbody>
  </table>
  <BlockDiagram figure="" caption="Moteur à courant continu, d'après les équations (1) et (2)" {...figMotorOpen(m)} {errataBase} />
  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages de la partie IV">
      <div class="grid">
        <ParamSlider spec={spec('T_m')} values={v} label="Période d'échantillonnage T" errata={`${errataBase}#E-AE24`} />
        <ParamSlider spec={spec('U')} values={v} label="Tension U" />
        <ParamSlider spec={spec('Cr')} values={v} label="Couple résistant Cr" errata={`${errataBase}#E-AE24`} />
        <ParamSlider spec={spec('L')} values={v} label="Inductance L" choiceLabels={['0,011 H (tableau 2.1)', '0,011 mH (tableau 4.1)']} errata={`${errataBase}#E-AE7`} />
      </div>
    </div>
  {:else}
    <p class="card">Valeurs utilisées : T = {fmt(Tm, 6)} s, U = {fmt(m.U, 6)} V, Cr = {fmt(m.Cr, 6)} N·m, L = {fmt(m.L, 4)} H.</p>
  {/if}

  <article>
    <QuestionHead q={question('IV.1')} part="IV" />
    <Predict always={report} id="ae2-IV1" kind="number" prompt={`Quelle vitesse finale (rad/s) pour U = ${fmt(m.U, 4)} V et Cr = ${fmt(m.Cr, 4)} N·m ?`} expected={m.omega_final} tolerance={0.03} unit="rad/s">
      <Derivation steps={motorModel(m, m.Gm)} title="Le modèle du moteur, pas à pas" />
      <p>Vitesse finale : U·{fmt(m.gain_statique_moteur, 4)} {m.Cr !== 0 ? `+ Cr·(Ω/Cr)(0)` : ''} = <strong>{fmt(m.omega_final, 4)} rad/s</strong>.</p>
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="IV.1" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('IV.2')} part="IV" />
    <Predict always={report} id="ae2-IV2" kind="number" prompt={`Quel est le module des pôles de G(z) pour T = ${fmt(Tm, 4)} s ?`} expected={Math.hypot(z.poles_moteur_z[0].re, z.poles_moteur_z[0].im)} tolerance={0.01}>
      <Derivation steps={motorPolesZ(m.poles_moteur, Tm)} />
      <ZPlane poles={z.poles_moteur_z} title="Pôles du moteur discrétisé" summary={`Plan z : pôles du moteur discrétisé, de module ${fmt(Math.hypot(z.poles_moteur_z[0].re, z.poles_moteur_z[0].im), 4)}.`} />
      <p>Gain statique de G(z) : {fmt(z.gain_statique_moteur_z, 5)}, identique au gain continu.</p>
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="IV.2" filename={SCRIPT_NAME} needs={['IV.1']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('IV.3')} part="IV" />
    <p class="note">Le signal d'entrée n'est pas précisé : on prend un échelon de U (<a href={`${errataBase}#E-AE25`}>errata E-AE25</a>).</p>
    <Predict always={report} id="ae2-IV3" kind="choice" prompt="Avec un échelon de U, le bloqueur change-t-il la vitesse aux instants kT ?" options={['oui', 'non']} correct={1}>
      <p>Non : un échelon est déjà constant entre deux instants. L'écart entre la réponse discrète et la réponse continue aux instants kT vaut {fmt(c3.ecart_moteur_zoh, 2)} rad/s.</p>
      <Plot
        series={[
          { x: c3.t_m, y: c3.w_continu, label: 'continu', color: 1 },
          { x: tk, y: c3.w_zoh, kind: 'stairs', label: 'échantillonné-bloqué', color: 2 },
        ]}
        xLabel="t (s)"
        yLabel="vitesse Ω (rad/s)"
        summary={`Vitesse du moteur pour U = ${fmt(m.U, 3)} V : la réponse échantillonnée suit exactement la réponse continue aux instants kT.`}
      />
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="IV.3" filename={SCRIPT_NAME} needs={['IV.1', 'IV.2']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('IV.4')} part="IV" />
    <Predict always={report} id="ae2-IV4" kind="number" prompt="Sans bloqueur (invariance impulsionnelle, × T), quel gain statique obtient-on ?" expected={c4.gain_statique_moteur_imp} tolerance={0.02}>
      <p>
        Sans bloqueur, la discrétisation n'est plus exacte pour un échelon : gain statique {fmt(c4.gain_statique_moteur_imp, 5)} au lieu de
        {fmt(z.gain_statique_moteur_z, 5)}, et écart maximal {fmt(c4.ecart_moteur_imp, 4)} rad/s.
      </p>
      <Plot
        series={[
          { x: c3.t_m, y: c3.w_continu, label: 'continu', color: 1 },
          { x: tk, y: c3.w_zoh, kind: 'stairs', label: 'avec bloqueur', color: 2 },
          { x: tk, y: c4.w_imp, kind: 'stairs', label: 'sans bloqueur', color: 3, dashed: true },
        ]}
        xLabel="t (s)"
        yLabel="vitesse Ω (rad/s)"
        summary="Avec et sans bloqueur : seul le modèle avec bloqueur coïncide avec la réponse continue."
      />
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="IV.4" filename={SCRIPT_NAME} needs={['IV.1', 'IV.2', 'IV.3']} />
    </Predict>
  </article>
</section>

<style>
  .t21 {
    margin: 0.6rem 0;
  }
  .t21 caption {
    text-align: left;
    font-size: 0.9rem;
    color: var(--ink-soft);
    padding-bottom: 0.3rem;
  }
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
