<script lang="ts">
  /**
   * Automatique TP4, part III (first island): the rappel, figure 4.2, the settings and III.1.
   * III.2–III.4 and the microcontroller panel are PartIIIb, hydrated when visible. Every number comes from the engine.
   */
  import { PART_III, RAPPEL, question } from '../../content/aeTp4'
  import { tankWithoutPid } from '../../derive/pid'
  import { fig41, fig42 } from '../../figures/aeTp4'
  import { fmt } from '../../lib/format'
  import { SCRIPT_NAME, SCRIPT_SOURCE, tp4 } from '../../lib/stores/aeTp4.svelte'
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

  const v = tp4.values
  $effect(() => tp4.restore()) // after hydration: URL and saved values (see tpStore)
  const spec = (n: string) => tp4.specs.find((s) => s.name === n)!
  const r = $derived(tp4.result)
  const c1 = $derived(r['III.1'])
  const c4 = $derived(r['III.4'])
  const kp = $derived(v.kp as number)
  const ki = $derived(v.ki as number)
  const kd = $derived(v.kd as number)
  const H0 = $derived(v.consigne as number)
  const k = $derived(c1.G.num.at(-1)! / c1.G.den.at(-1)!)
  const tau = $derived(c1.G.den[0] / c1.G.den.at(-1)!)
  const d41 = $derived(fig41(kp, ki, kd, v.N_filtre as number))
  const d42 = $derived(fig42(kp, ki, kd, c1.G, H0))
  const yTop = $derived(Math.max(c1.H_max, c1.H_bo_final) * 1.08)
</script>

<section aria-labelledby="rappel">
  <h2 id="rappel">II. Rappel</h2>
  <div class="statement">
    {#each RAPPEL as p (p)}<p><q>{p}</q></p>{/each}
    <p class="muted">Fascicule, p. 16.</p>
  </div>
  <BlockDiagram figure="4.1" caption="Le contrôleur Proportionnel, Intégral et Dérivé (PID) dans l'interface Simulink" {...d41} {errataBase} />
</section>

<section aria-labelledby="partie-III">
  <h2 id="partie-III">III. {PART_III.title}</h2>
  <div class="statement">
    {#each PART_III.intro as p (p)}<p><q>{p}</q></p>{/each}
    <p class="muted">Fascicule, p. 17. La « réponse désirée » n'est pas définie : cahier des charges retenu, dépassement ≤ 5 % et erreur statique nulle (<a href={`${errataBase}#E-AE10`}>errata E-AE10</a>).</p>
  </div>
  <BlockDiagram figure={PART_III.figure.number} caption={PART_III.figure.caption} {...d42} {errataBase} />

  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages de la partie III">
      <p class="ptitle"><strong>Réglages</strong> — le code MATLAB et toutes les valeurs ci-dessous suivent ces curseurs.</p>
      <div class="grid">
        <ParamSlider spec={spec('kp')} values={v} label="Gain proportionnel kp" />
        <ParamSlider spec={spec('ki')} values={v} label="Gain intégral ki" />
        <ParamSlider spec={spec('kd')} values={v} label="Gain dérivé kd" />
        <ParamSlider spec={spec('consigne')} values={v} label="Consigne de hauteur" />
        <ParamSlider spec={spec('N_filtre')} values={v} label="Filtre de dérivée N (bloc PID Controller)" errata={`${errataBase}#E-AE14`} />
      </div>
      <p class="spec" class:ok={c4.cahier_des_charges_respecte} role="status">
        Cahier des charges (dépassement ≤ 5 %, erreur nulle) : <strong>{c4.cahier_des_charges_respecte ? 'respecté' : 'non respecté'}</strong>
        — dépassement {fmt(c4.S_avec.Overshoot, 3)} %, erreur {fmt(c4.erreur_avec, 3)} m, temps de réponse {fmt(c4.S_avec.SettlingTime, 4)} s.
      </p>
    </div>
  {:else}
    <p class="card">Valeurs utilisées : kp = {fmt(kp, 6)}, ki = {fmt(ki, 6)}, kd = {fmt(kd, 6)}, consigne {fmt(H0, 6)} m.</p>
  {/if}

  <article>
    <QuestionHead q={question('III.1')} part="III" />
    <Predict always={report} id="ae4-III1" kind="number" prompt={`Sans PID (retour unitaire, C = 1), vers quelle hauteur tend H pour une consigne de ${fmt(H0, 4)} m ?`} expected={H0 - c4.erreur_sans} tolerance={0.03} unit="m">
      <Derivation steps={tankWithoutPid(k, tau, H0, c1.H_max)} />
      <Plot
        series={[
          { x: c1.t, y: c1.H_bo, label: 'boucle ouverte (débit constant)', color: 2, dashed: true },
          { x: c1.t, y: c1.H_sans, label: 'sans PID (C = 1)', color: 3 },
          { x: c1.t, y: c1.H_avec, label: `PID kp = ${fmt(kp, 3)}, ki = ${fmt(ki, 3)}, kd = ${fmt(kd, 3)}`, color: 1 },
          ...(kd !== 0 ? [{ x: c1.t, y: c1.H_avec_simulink, label: 'bloc PID Controller (dérivée filtrée)', color: 4, dashed: true }] : []),
        ]}
        xLabel="t (s)"
        yLabel="hauteur H (m)"
        yDomain={[0, yTop]}
        hRules={[
          { at: c1.H_max, label: `réservoir : ${fmt(c1.H_max, 3)} m`, color: 2 },
          { at: H0, label: `consigne ${fmt(H0, 3)} m`, color: 4 },
        ]}
        summary={`Hauteur d'eau : la boucle ouverte tend vers ${fmt(c1.H_bo_final, 3)} m${Number.isFinite(c1.t_debordement) ? ` et déborde à ${fmt(c1.t_debordement, 3)} s` : ''} ; sans PID ${fmt(H0 - c4.erreur_sans, 3)} m ; avec le PID ${fmt(H0 - c4.erreur_avec, 3)} m.`}
      />
      <details class="card recipe">
        <summary>Construire les modèles dans Simulink</summary>
        <ol>
          <li>Sans PID : <code>Step</code> (Final value = {fmt(H0, 6)}) → <code>Sum</code> (<code>+-</code>) → <code>Transfer Fcn</code> [{fmt(k, 6)}] / [{fmt(tau, 6)} 1] → <code>Scope</code>, sortie ramenée sur l'entrée <code>-</code>.</li>
          <li>Avec PID : insérer un bloc <code>PID Controller</code> (P = {fmt(kp, 6)}, I = {fmt(ki, 6)}, D = {fmt(kd, 6)}, N = {fmt(v.N_filtre as number, 6)}) entre le <code>Sum</code> et la <code>Transfer Fcn</code>.</li>
        </ol>
      </details>
      <CodeCell script={tp4.script} original={SCRIPT_SOURCE} cell="III.1" filename={SCRIPT_NAME} />
    </Predict>
  </article>
</section>

<style>
  .params {
    margin: 1rem 0;
  }
  .ptitle {
    margin: 0 0 0.6rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    gap: 0.8rem 1.4rem;
  }
  .spec {
    margin: 0.8rem 0 0;
    padding: 0.5rem 0.8rem;
    border-radius: var(--radius);
    background: var(--bad-soft);
    color: var(--bad);
  }
  .spec.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  article {
    margin-top: 2rem;
  }
  .recipe {
    margin: 1rem 0;
  }
  .recipe summary {
    cursor: pointer;
    font-weight: 600;
    min-height: 2.75rem;
    display: flex;
    align-items: center;
  }
</style>
