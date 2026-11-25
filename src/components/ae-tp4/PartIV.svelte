<script lang="ts">
  /** Automatique TP4, part IV: PID speed control of the DC motor. Every number comes from the engine. */
  import { PART_IV, question } from '../../content/aeTp4'
  import { motorModel, motorPid } from '../../derive/pid'
  import { fig43 } from '../../figures/aeTp4'
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
  import { SETTLING_DIVISOR, samplingFromSettling } from '../../engine/mcu'
  import { MCU_DEFAULTS } from '../../content/mcu'

  interface Props {
    report?: boolean
    errataBase: string
  }
  let { report = false, errataBase }: Props = $props()

  const v = tp4.values
  $effect(() => tp4.restore())
  const spec = (n: string) => tp4.specs.find((s) => s.name === n)!
  const r = $derived(tp4.result)
  const m = $derived(r['IV.5'])
  const sw = $derived(r['IV.6'])
  const c8 = $derived(r['IV.8'])
  const d43 = $derived(fig43({ kp: m.kp_m, ki: m.ki_m, kd: m.kd_m, L: m.L, R: m.R, J: m.J, f: m.f, kem: m.kem, kc: m.kc, Gm: m.Gm, Cr: m.Cr, U: m.U }))
  const kdTrend = $derived(r['IV.7'].variation_kdm[0])
  const trendIndex = (dv: number) => (dv > 0.3 ? 0 : dv < -0.3 ? 1 : 2)
  const sweepPlot = (resp: number[][], values: number[], name: string) =>
    resp.map((y, i) => ({ x: sw.t3, y, label: `${name} = ${fmt(values[i], 3)}`, color: i + 1 }))
  const choiceL = $derived(spec('L').choices ?? [])
</script>

<section aria-labelledby="partie-IV">
  <h2 id="partie-IV">IV. {PART_IV.title}</h2>
  <div class="statement">
    <p><q>{PART_IV.intro[0]}</q></p>
    <p><q>{PART_IV.intro[1]}</q></p>
    <p class="muted">Fascicule, p. 18.</p>
  </div>
  <BlockDiagram figure={PART_IV.figure.number} caption={PART_IV.figure.caption} {...d43} {errataBase} />
  <table class="t41 num">
    <caption>Tableau 4.1. Paramètres d'un moteur à courant continu (tel qu'imprimé)</caption>
    <tbody>{#each PART_IV.table as [name, val] (name)}<tr><th scope="row">{name}</th><td>{val}</td></tr>{/each}</tbody>
  </table>
  <p class="note">
    Le tableau 2.1 du même fascicule donne L = {fmt(choiceL[0] ?? NaN, 4)} H pour le même moteur. Avec la valeur imprimée ({fmt((choiceL[1] ?? NaN) * 1000, 4)} mH),
    le pôle électrique est vers {fmt(-(m.R / (choiceL[1] ?? NaN)), 3)} rad/s : on prend {fmt(choiceL[0] ?? NaN, 4)} H par défaut (<a href={`${errataBase}#E-AE7`}>errata
      E-AE7</a>). La consigne U = {fmt(m.U, 4)} est une vitesse en rad/s (<a href={`${errataBase}#E-AE13`}>E-AE13</a>).
  </p>

  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages de la partie IV">
      <p class="ptitle"><strong>Réglages</strong> — le code MATLAB et toutes les valeurs ci-dessous suivent ces curseurs.</p>
      <div class="grid">
        <ParamSlider spec={spec('kp_m')} values={v} label="Gain proportionnel kp" />
        <ParamSlider spec={spec('ki_m')} values={v} label="Gain intégral ki" />
        <ParamSlider spec={spec('kd_m')} values={v} label="Gain dérivé kd" />
        <ParamSlider spec={spec('L')} values={v} label="Inductance L" choiceLabels={['0,011 H (tableau 2.1)', '0,011 mH (tableau 4.1)']} errata={`${errataBase}#E-AE7`} />
        <ParamSlider spec={spec('U')} values={v} label="Consigne de vitesse U" errata={`${errataBase}#E-AE13`} />
        <ParamSlider spec={spec('Cr')} values={v} label="Couple résistant cr" errata={`${errataBase}#E-AE12`} />
        <ParamSlider spec={spec('t_cr')} values={v} label="Instant d'application de cr" />
      </div>
      <p class="spec" class:ok={c8.cahier_des_charges_m_respecte} role="status">
        Cahier des charges (dépassement ≤ 5 %, erreur nulle) : <strong>{c8.cahier_des_charges_m_respecte ? 'respecté' : 'non respecté'}</strong>
        — dépassement {fmt(c8.Sm_avec.Overshoot, 3)} %, erreur {fmt(c8.erreur_m_avec, 3)} rad/s, temps de réponse {fmt(c8.Sm_avec.SettlingTime, 4)} s.
      </p>
    </div>
  {:else}
    <p class="card">
      Valeurs utilisées : kp = {fmt(m.kp_m, 6)}, ki = {fmt(m.ki_m, 6)}, kd = {fmt(m.kd_m, 6)}, L = {fmt(m.L, 4)} H, U = {fmt(m.U, 4)} rad/s, cr = {fmt(m.Cr, 4)} N·m.
    </p>
  {/if}

  <article>
    <QuestionHead q={question('IV.5')} part="IV" />
    <Predict always={report} id="ae4-IV5" kind="number" prompt={`Sans régulateur, en appliquant U = ${fmt(m.U, 4)} V au moteur, quelle vitesse atteint-il (rad/s) ?`} expected={m.omega_bo_final} tolerance={0.03} unit="rad/s">
      <Derivation steps={motorModel(m, m.Gm)} title="Le modèle du moteur, pas à pas" />
      <Plot
        series={[
          { x: m.tm, y: m.w_bo, label: `boucle ouverte (${fmt(m.U, 3)} V)`, color: 2, dashed: true },
          { x: m.tm, y: m.w_sans, label: 'sans PID (C = 1)', color: 3 },
          { x: m.tm, y: m.w_avec, label: `PID kp = ${fmt(m.kp_m, 3)}, ki = ${fmt(m.ki_m, 3)}, kd = ${fmt(m.kd_m, 3)}`, color: 1 },
        ]}
        xLabel="t (s)"
        yLabel="vitesse Ω (rad/s)"
        hRules={[{ at: m.U, label: `consigne ${fmt(m.U, 3)} rad/s`, color: 4 }]}
        vRules={m.Cr !== 0 ? [{ at: m.t_cr, label: `cr = ${fmt(m.Cr, 3)} N·m`, color: 2 }] : []}
        summary={`Vitesse du moteur : ${fmt(m.omega_bo_final, 3)} rad/s en boucle ouverte, ${fmt(m.U - c8.erreur_m_sans, 3)} rad/s sans PID, ${fmt(m.U - c8.erreur_m_avec, 3)} rad/s avec le PID.`}
      />
      {#if m.Cr !== 0}
        <p>À t = {fmt(m.t_cr, 3)} s, le couple résistant fait chuter la vitesse ; l'action intégrale la ramène à la consigne.</p>
      {/if}
      <details class="card recipe">
        <summary>Construire le modèle dans Simulink</summary>
        <ol>
          <li><code>Step</code> (U) → <code>Sum</code> (<code>+-</code>) → <code>PID Controller</code> → <code>Sum</code> (<code>+-</code>) → <code>Transfer Fcn</code> [1]/[{fmt(m.L, 6)} {fmt(m.R, 6)}] → <code>Gain</code> {fmt(m.kc, 6)}.</li>
          <li>→ <code>Sum</code> (<code>+-</code>, cr sur l'entrée <code>-</code>) → <code>Transfer Fcn</code> [1]/[{fmt(m.J, 6)} {fmt(m.f, 6)}] → Ω.</li>
          <li>Ω → <code>Gain</code> {fmt(m.kem, 6)} → entrée <code>-</code> du second <code>Sum</code> ; Ω → entrée <code>-</code> du premier <code>Sum</code>. Sans PID : supprimer le bloc PID.</li>
        </ol>
      </details>
      <CodeCell script={tp4.script} original={SCRIPT_SOURCE} cell="IV.5" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('IV.6')} part="IV" />
    <Predict
      always={report}
      id="ae4-IV6"
      kind="choice"
      prompt={`Avec kp = ${fmt(m.kp_m, 3)}, ki = ${fmt(m.ki_m, 3)}, kd = ${fmt(m.kd_m, 3)}, le cahier des charges est-il respecté ?`}
      options={['oui', 'non']}
      correct={c8.cahier_des_charges_m_respecte ? 0 : 1}
    >
      <Derivation steps={motorPid(m.Gm, m.kp_m, m.ki_m, m.kd_m)} title="La boucle avec le PID, pas à pas" />
      <p>
        Dépassement {fmt(c8.Sm_avec.Overshoot, 3)} %, temps de réponse à 2 % de {fmt(c8.Sm_avec.SettlingTime, 4)} s, erreur {fmt(c8.erreur_m_avec, 3)} rad/s :
        cahier des charges <strong>{c8.cahier_des_charges_m_respecte ? 'respecté' : 'non respecté'}</strong>.
      </p>
      <CodeCell script={tp4.script} original={SCRIPT_SOURCE} cell="IV.6" filename={SCRIPT_NAME} needs={['IV.5']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('IV.7')} part="IV" />
    <Predict
      always={report}
      id="ae4-IV7"
      kind="choice"
      prompt={`Quand kd augmente (kp = ${fmt(sw.kp_fixe_m, 3)}, ki = ${fmt(sw.ki_fixe_m, 3)}), le dépassement…`}
      options={['augmente', 'diminue', 'ne change pas']}
      correct={trendIndex(kdTrend)}
    >
      <EffectTable
        rows={[
          { gain: 'kp', range: `${fmt(sw.kpm_liste[0], 3)} → ${fmt(sw.kpm_liste.at(-1)!, 3)}, ki = kd = 0`, first: sw.info_kpm[0], last: sw.info_kpm.at(-1)! },
          { gain: 'ki', range: `${fmt(sw.kim_liste[0], 3)} → ${fmt(sw.kim_liste.at(-1)!, 3)}, kp = ${fmt(sw.kp_fixe_m, 3)}`, first: sw.info_kim[0], last: sw.info_kim.at(-1)! },
          { gain: 'kd', range: `${fmt(sw.kdm_liste[0], 3)} → ${fmt(sw.kdm_liste.at(-1)!, 3)}, kp = ${fmt(sw.kp_fixe_m, 3)}, ki = ${fmt(sw.ki_fixe_m, 3)}`, first: sw.info_kdm[0], last: sw.info_kdm.at(-1)! },
        ]}
      />
      <p>
        Le moteur est du second ordre : kp accélère et réduit l'erreur mais augmente le dépassement ; ki annule l'erreur et augmente encore le dépassement ;
        kd amortit. C'est le compromis classique stabilité / rapidité / précision.
      </p>
      <div class="sweeps">
        <Plot series={sweepPlot(sw.rep_kpm, sw.kpm_liste, 'kp')} xLabel="t (s)" yLabel="Ω (rad/s)" title="Effet de kp (ki = kd = 0)" height={240} summary="Réponses pour plusieurs kp : plus rapides et plus proches de la consigne quand kp augmente." />
        <Plot series={sweepPlot(sw.rep_kim, sw.kim_liste, 'ki')} xLabel="t (s)" yLabel="Ω (rad/s)" title={`Effet de ki (kp = ${fmt(sw.kp_fixe_m, 3)})`} height={240} summary="Réponses pour plusieurs ki : erreur annulée, dépassement croissant." />
        <Plot series={sweepPlot(sw.rep_kdm, sw.kdm_liste, 'kd')} xLabel="t (s)" yLabel="Ω (rad/s)" title={`Effet de kd (kp = ${fmt(sw.kp_fixe_m, 3)}, ki = ${fmt(sw.ki_fixe_m, 3)})`} height={240} summary="Réponses pour plusieurs kd : dépassement réduit." />
      </div>
      <CodeCell script={tp4.script} original={SCRIPT_SOURCE} cell="IV.7" filename={SCRIPT_NAME} needs={['IV.5', 'IV.6']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('IV.8')} part="IV" />
    <Predict always={report} id="ae4-IV8" kind="number" prompt="Quelle est l'erreur statique sans PID (en rad/s) ?" expected={c8.erreur_m_sans} tolerance={0.03} unit="rad/s">
      <StepInfoTable before={c8.Sm_sans} after={c8.Sm_avec} before5={c8.Sm_sans_5} after5={c8.Sm_avec_5} errBefore={c8.erreur_m_sans} errAfter={c8.erreur_m_avec} unit="rad/s" {errataBase} />
      <CodeCell script={tp4.script} original={SCRIPT_SOURCE} cell="IV.8" filename={SCRIPT_NAME} needs={['IV.5']} />
    </Predict>
  </article>

  {#if !report}
    <article class="no-print">
      <h3 id="mcu-moteur">Vers le microcontrôleur</h3>
      <McuPid
        name="moteur"
        title="Vitesse du moteur à courant continu (TP4, partie IV)"
        plant={m.Gm}
        kp={m.kp_m}
        ki={m.ki_m}
        kd={m.kd_m}
        N={v.N_filtre as number}
        setpoint={m.U}
        duration={m.tm.at(-1)!}
        TsDefault={samplingFromSettling(c8.Sm_avec.SettlingTime)}
        limitsDefault={MCU_DEFAULTS.moteur}
        measure="vitesse"
        command="tension"
        unitMeasure="rad/s"
        unitCommand="V"
        note={`Te par défaut : temps de réponse à 2 % divisé par ${SETTLING_DIVISOR}, arrondi. Tension bornée par l'alimentation du Tableau 2.1 ; le couple résistant n'est pas simulé ici ; dérivée filtrée avec le N du bloc PID Controller. Errata E-AE27.`}
      />
    </article>
  {/if}
</section>

<style>
  .t41 {
    margin: 0.6rem 0;
  }
  .t41 caption {
    text-align: left;
    font-size: 0.9rem;
    color: var(--ink-soft);
    padding-bottom: 0.3rem;
  }
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
