<script lang="ts">
  /** Automatique TP4, part III: PID control of the water tank. Every number comes from the engine. */
  import { PART_III, RAPPEL, question } from '../../content/aeTp4'
  import { tankPi, tankWithoutPid } from '../../derive/pid'
  import { fig41, fig42 } from '../../figures/aeTp4'
  import { fmt } from '../../lib/format'
  import { SCRIPT_NAME, SCRIPT_SOURCE, tp4 } from '../../lib/stores/aeTp4.svelte'
  import BlockDiagram from '../BlockDiagram.svelte'
  import CodeCell from '../CodeCell.svelte'
  import Derivation from '../Derivation.svelte'
  import EffectTable from '../EffectTable.svelte'
  import ParamSlider from '../ParamSlider.svelte'
  import Plot from '../Plot.svelte'
  import Predict from '../Predict.svelte'
  import QuestionHead from '../QuestionHead.svelte'
  import StepInfoTable from '../StepInfoTable.svelte'
  import McuPid from '../mcu/McuPid.svelte'
  import { samplingFromSettling } from '../../engine/mcu'

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
  const sw = $derived(r['III.2'])
  const c4 = $derived(r['III.4'])
  const kp = $derived(v.kp as number)
  const ki = $derived(v.ki as number)
  const kd = $derived(v.kd as number)
  const H0 = $derived(v.consigne as number)
  const k = $derived(c1.G.num.at(-1)! / c1.G.den.at(-1)!)
  const tau = $derived(c1.G.den[0] / c1.G.den.at(-1)!)
  const d41 = $derived(fig41(kp, ki, kd, v.N_filtre as number))
  const d42 = $derived(fig42(kp, ki, kd, c1.G, H0))
  const kiTrend = $derived(r['III.3'].variation_ki[0])
  const trendIndex = (dv: number) => (dv > 0.3 ? 0 : dv < -0.3 ? 1 : 2)
  const sweepPlot = (resp: number[][], values: number[], name: string) =>
    resp.map((y, i) => ({ x: sw.t2, y, label: `${name} = ${fmt(values[i], 3)}`, color: i + 1 }))
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

  <article>
    <QuestionHead q={question('III.2')} part="III" />
    <Predict
      always={report}
      id="ae4-III2"
      kind="choice"
      prompt={`Avec kp = ${fmt(kp, 3)}, ki = ${fmt(ki, 3)}, kd = ${fmt(kd, 3)}, le cahier des charges (dépassement ≤ 5 %, erreur nulle) est-il respecté ?`}
      options={['oui', 'non']}
      correct={c4.cahier_des_charges_respecte ? 0 : 1}
    >
      <Derivation steps={tankPi(k, tau, kp, ki, kd)} title="La boucle avec le PID, pas à pas" />
      <p>
        Résultat : dépassement {fmt(c4.S_avec.Overshoot, 3)} %, temps de réponse à 2 % de {fmt(c4.S_avec.SettlingTime, 4)} s, erreur statique
        {fmt(c4.erreur_avec, 3)} m : cahier des charges <strong>{c4.cahier_des_charges_respecte ? 'respecté' : 'non respecté'}</strong>. Le réglage du script
        (ki/kp = 1/τ) compense le pôle du réservoir : c'est le plus simple qui le respecte.
      </p>
      <CodeCell script={tp4.script} original={SCRIPT_SOURCE} cell="III.2" filename={SCRIPT_NAME} needs={['III.1']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('III.3')} part="III" />
    <Predict always={report} id="ae4-III3" kind="choice" prompt={`Quand ki augmente (kp = ${fmt(sw.kp_fixe, 3)}, kd = 0), le dépassement…`} options={['augmente', 'diminue', 'ne change pas']} correct={trendIndex(kiTrend)}>
      <EffectTable
        rows={[
          { gain: 'kp', range: `${fmt(sw.kp_liste[0], 3)} → ${fmt(sw.kp_liste.at(-1)!, 3)}, ki = kd = 0`, first: sw.info_kp[0], last: sw.info_kp.at(-1)! },
          { gain: 'ki', range: `${fmt(sw.ki_liste[0], 3)} → ${fmt(sw.ki_liste.at(-1)!, 3)}, kp = ${fmt(sw.kp_fixe, 3)}`, first: sw.info_ki[0], last: sw.info_ki.at(-1)! },
          { gain: 'kd', range: `${fmt(sw.kd_liste[0], 3)} → ${fmt(sw.kd_liste.at(-1)!, 3)}, kp = ${fmt(sw.kp_fixe, 3)}, ki = ${fmt(sw.ki_fixe, 3)}`, first: sw.info_kd[0], last: sw.info_kd.at(-1)! },
        ]}
      />
      <p>
        kp accélère et réduit l'erreur, sans l'annuler. ki annule l'erreur ; au-delà de la compensation du pôle, il crée un dépassement qui grandit : la
        stabilité se dégrade. Sur ce procédé du premier ordre, kd n'apporte presque rien : il fait sauter la sortie à t = 0 et amplifierait le bruit.
      </p>
      <div class="sweeps">
        <Plot series={sweepPlot(sw.rep_kp, sw.kp_liste, 'kp')} xLabel="t (s)" yLabel="H (m)" title="Effet de kp (ki = kd = 0)" height={240} summary="Réponses pour plusieurs kp : plus rapides et plus proches de la consigne quand kp augmente, sans l'atteindre." />
        <Plot series={sweepPlot(sw.rep_ki, sw.ki_liste, 'ki')} xLabel="t (s)" yLabel="H (m)" title={`Effet de ki (kp = ${fmt(sw.kp_fixe, 3)})`} height={240} summary="Réponses pour plusieurs ki : erreur nulle, dépassement croissant avec ki." />
        <Plot series={sweepPlot(sw.rep_kd, sw.kd_liste, 'kd')} xLabel="t (s)" yLabel="H (m)" title={`Effet de kd (kp = ${fmt(sw.kp_fixe, 3)}, ki = ${fmt(sw.ki_fixe, 3)})`} height={240} summary="Réponses pour plusieurs kd : saut initial de la sortie, peu d'effet ensuite." />
      </div>
      <CodeCell script={tp4.script} original={SCRIPT_SOURCE} cell="III.3" filename={SCRIPT_NAME} needs={['III.1', 'III.2']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('III.4')} part="III" />
    <Predict always={report} id="ae4-III4" kind="number" prompt="Quelle est l'erreur statique sans PID (en m) ?" expected={c4.erreur_sans} tolerance={0.03} unit="m">
      <StepInfoTable before={c4.S_sans} after={c4.S_avec} before5={c4.S_sans_5} after5={c4.S_avec_5} errBefore={c4.erreur_sans} errAfter={c4.erreur_avec} unit="m" {errataBase} />
      <CodeCell script={tp4.script} original={SCRIPT_SOURCE} cell="III.4" filename={SCRIPT_NAME} needs={['III.1']} />
    </Predict>
  </article>

  {#if !report}
    <article class="no-print">
      <h3 id="mcu-reservoir">Vers le microcontrôleur</h3>
      <McuPid
        name="reservoir"
        title="Hauteur d'eau du réservoir (TP4, partie III)"
        plant={c1.G}
        {kp}
        {ki}
        {kd}
        N={v.N_filtre as number}
        setpoint={H0}
        duration={c1.t.at(-1)!}
        TsDefault={samplingFromSettling(c4.S_avec.SettlingTime)}
        limitsDefault={{ umin: 0, umax: 0.5 }}
        measure="hauteur"
        command="débit Qe"
        unitMeasure="m"
        unitCommand="u.d."
        note="Te par défaut : temps de réponse à 2 % divisé par 40, arrondi. Le débit d'entrée ne peut pas être négatif et son maximum n'est pas donné (u.d. : unités de débit). Choix non donnés par le fascicule : errata E-AE27."
      />
    </article>
  {/if}
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
  .sweeps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: 0 1rem;
  }
</style>
