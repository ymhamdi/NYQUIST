<script lang="ts">
  /**
   * Automatique TP4, part III (second island): III.2–III.4 and "Vers le microcontrôleur", hydrated when
   * visible (the gain sweeps are the costly part of the page). Same store as PartIII. Every number comes from the engine.
   */
  import { question } from '../../content/aeTp4'
  import { tankPi } from '../../derive/pid'
  import { fmt } from '../../lib/format'
  import { SCRIPT_NAME, SCRIPT_SOURCE, tp4 } from '../../lib/stores/aeTp4.svelte'
  import CodeCell from '../CodeCell.svelte'
  import Derivation from '../Derivation.svelte'
  import EffectTable from '../EffectTable.svelte'
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
  $effect(() => tp4.restore()) // after hydration: URL and saved values (see tpStore)
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
  const kiTrend = $derived(r['III.3'].variation_ki[0])
  const trendIndex = (dv: number) => (dv > 0.3 ? 0 : dv < -0.3 ? 1 : 2)
  const sweepPlot = (resp: number[][], values: number[], name: string) =>
    resp.map((y, i) => ({ x: sw.t2, y, label: `${name} = ${fmt(values[i], 3)}`, color: i + 1 }))
</script>

<div class="suite">
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
        limitsDefault={MCU_DEFAULTS.reservoir}
        measure="hauteur"
        command="débit Qe"
        unitMeasure="m"
        unitCommand="u.d."
        note={`Te par défaut : temps de réponse à 2 % divisé par ${SETTLING_DIVISOR}, arrondi. Le débit d'entrée ne peut pas être négatif et son maximum n'est pas donné (u.d. : unités de débit). Choix non donnés par le fascicule : errata E-AE27.`}
      />
    </article>
  {/if}
</div>

<style>
  article {
    margin-top: 2rem;
  }
  .sweeps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr));
    gap: 0 1rem;
  }
</style>
