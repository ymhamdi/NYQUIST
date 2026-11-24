<script lang="ts">
  /**
   * Automatique TP3, part II: G₁(s) = 1/(s + 1), ZOH, proportional digital
   * controller K, unity feedback. Every number comes from the engine
   * (src/engine/tp/aeTp3.ts) at the current slider values.
   */
  import { PART_II, question } from '../../content/aeTp3'
  import { closedLoop } from '../../derive/firstOrderLoop'
  import { fmt } from '../../lib/format'
  import { eq, frac, math, mi, minus, mn, paren, row } from '../../lib/mathml'
  import { SCRIPT_NAME, SCRIPT_SOURCE, tp3 } from '../../lib/stores/aeTp3.svelte'
  import CodeCell from '../CodeCell.svelte'
  import Derivation from '../Derivation.svelte'
  import ParamSlider from '../ParamSlider.svelte'
  import Plot from '../Plot.svelte'
  import Predict from '../Predict.svelte'
  import QuestionHead from '../QuestionHead.svelte'
  import SampledLoopDiagram from '../SampledLoopDiagram.svelte'
  import ZPlane from '../ZPlane.svelte'

  interface Props {
    /** report mode: no sliders, no predictions, every answer shown */
    report?: boolean
    errataBase: string
  }
  let { report = false, errataBase }: Props = $props()

  const v = tp3.values
  $effect(() => tp3.restore()) // after hydration: URL and saved values (see tpStore)
  const spec = (n: string) => tp3.specs.find((s) => s.name === n)!
  const r = $derived(tp3.result)
  const T = $derived(v.T as number)
  const K = $derived(v.K as number)
  const loop = $derived(closedLoop({ k: 1, tau: 1, T, K, plant: 'G₁', sym: 'a' }))
  const a = $derived(r['II.3'].a)
  const pole = $derived(r['II.5'].pole_main)
  const stable = $derived(r['II.5'].stable[0])
  const Kmax = $derived(r['II.7'].Kmax)
  const tfFormula = (num: number, p: number) => math(eq(row(mi('G'), paren(mi('z'))), frac(mn(num, 4), minus(mi('z'), p, 6))), { display: true })

  // root locus: p(K) = a − K(1 − a), K from 0 to 1.5·Kmax
  const locus = $derived(Array.from({ length: 61 }, (_, i) => ({ re: a - ((1.5 * Kmax * i) / 60) * (1 - a), im: 0 })))
  const sim = $derived(r['II.6'])
  const essais = $derived(r['II.7'])
  const yMaxEssais = $derived(Math.max(2.2, ...essais.reponses_essais.slice(0, 3).flat().map(Math.abs)) * 1.1)
  /** an unstable response is cut one sample after it leaves the axes: the divergence is visible without hiding the others */
  const cut = (y: number[]) => {
    const i = y.findIndex((v) => Math.abs(v) > yMaxEssais)
    return i < 0 ? y : y.slice(0, i + 1)
  }
</script>

<section aria-labelledby="partie-II">
  <h2 id="partie-II">II. {PART_II.title}</h2>
  <div class="statement">
    <p><q>{PART_II.intro[0]}</q></p>
    <p><q>{PART_II.intro[1]}</q></p>
    <p class="muted">Fascicule, p. 13. La période T et le gain K ne sont pas donnés : voir l'<a href={`${errataBase}#E-AE1`}>errata E-AE1</a> et <a href={`${errataBase}#E-AE2`}>E-AE2</a>.</p>
  </div>

  <SampledLoopDiagram figure={PART_II.figure.number} caption={PART_II.figure.caption} input="e(t)" output="S(t)" {T} {K} k={1} tau={1} {errataBase} />

  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages de la partie II">
      <p class="ptitle"><strong>Réglages</strong> — le code MATLAB et toutes les valeurs ci-dessous suivent ces curseurs.</p>
      <div class="grid">
        <ParamSlider spec={spec('T')} values={v} label="Période d'échantillonnage T" errata={`${errataBase}#E-AE1`} />
        <ParamSlider spec={spec('K')} values={v} label="Gain du contrôleur K" errata={`${errataBase}#E-AE2`} />
        <ParamSlider spec={spec('e')} values={v} label="Consigne e (échelon)" />
      </div>
    </div>
  {:else}
    <p class="card">Valeurs utilisées : T = {fmt(T, 6)} s, K = {fmt(K, 6)}, consigne e = {fmt(v.e as number, 6)}.</p>
  {/if}

  <!-- Question 3 -->
  <article>
    <QuestionHead q={question('II.3')} part="II" />
    <Predict always={report} id="ae3-II3" kind="number" prompt={`Où se trouve le pôle de G(z) en boucle fermée, pour T = ${fmt(T, 4)} s et K = ${fmt(K, 4)} ?`} expected={pole} tolerance={0.02}>
      <Derivation steps={loop.steps.slice(0, 6)} />
      <p><strong>Résultat :</strong></p>
      {@html tfFormula(r['II.3'].G_bf_main.num[0], pole)}
      <p>Avec a = e<sup>−T</sup> = {fmt(a, 6)}, le pôle est p = a − K(1 − a) = {fmt(pole, 6)}.</p>
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="II.3" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <!-- Question 4 -->
  <article>
    <QuestionHead q={question('II.4')} part="II" />
    <Predict always={report} id="ae3-II4" kind="number" prompt="Quel coefficient c2d doit-il donner au numérateur de G₀(z) = c2d(G₁, T) ?" expected={r['II.4'].G0.num.at(-1)!} tolerance={0.01}>
      <p>
        MATLAB donne les mêmes coefficients que le calcul à la main. L'écart, mesuré sur le pôle et le gain statique, vaut
        {fmt(r['II.4'].ecart_bo, 3)} en boucle ouverte et {fmt(r['II.4'].ecart_bf, 3)} en boucle fermée : c'est l'erreur d'arrondi de la machine.
      </p>
      <table class="cmp num">
        <thead><tr><th></th><th>calcul à la main</th><th><code>c2d</code> / <code>feedback</code></th></tr></thead>
        <tbody>
          <tr><th>G₀(z), numérateur</th><td>1 − a = {fmt(1 - a, 6)}</td><td>{fmt(r['II.4'].G0.num.at(-1)!, 6)}</td></tr>
          <tr><th>G₀(z), pôle</th><td>a = {fmt(a, 6)}</td><td>{fmt(-r['II.4'].G0.den[1] / r['II.4'].G0.den[0], 6)}</td></tr>
          <tr><th>G(z), pôle</th><td>a − K(1 − a) = {fmt(pole, 6)}</td><td>{fmt(-r['II.4'].G_bf.den[1] / r['II.4'].G_bf.den[0], 6)}</td></tr>
        </tbody>
      </table>
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="II.4" filename={SCRIPT_NAME} needs={['II.3']} />
    </Predict>
  </article>

  <!-- Question 5 -->
  <article>
    <QuestionHead q={question('II.5')} part="II" />
    <Predict
      always={report}
      id="ae3-II5"
      kind="choice"
      prompt={`Pour T = ${fmt(T, 4)} s et K = ${fmt(K, 4)}, la boucle est-elle stable ?`}
      options={['stable', 'instable']}
      correct={stable ? 0 : 1}
    >
      <p>
        Ordre {r['II.5'].ordre} : un seul pôle, p = {fmt(pole, 6)}, et aucun zéro. |p| {stable ? '<' : '≥'} 1 : la boucle est
        <strong>{stable ? 'stable' : 'instable'}</strong>.
      </p>
      <p>
        Le lieu des racines (<code>rlocus</code>) montre le pôle quand K varie : il part de z = a = {fmt(a, 4)} pour K = 0, se déplace vers la gauche sur l'axe réel
        et sort du cercle unité en z = −1 pour K = K<sub>max</sub> = {fmt(Kmax, 4)}.
      </p>
      <ZPlane
        poles={[{ re: pole, im: 0 }]}
        {locus}
        marks={[
          { re: a, im: 0, label: 'K = 0' },
          { re: -1, im: 0, label: 'Kmax' },
        ]}
        title="Pôle en boucle fermée et lieu des racines"
        summary={`Plan z : cercle unité, pôle en ${fmt(pole, 4)}, lieu des racines sur l'axe réel de ${fmt(a, 4)} vers la gauche, sortie du cercle en −1 pour K = ${fmt(Kmax, 4)}.`}
      />
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="II.5" filename={SCRIPT_NAME} needs={['II.3', 'II.4']} />
    </Predict>
  </article>

  <!-- Question 6 -->
  <article>
    <QuestionHead q={question('II.6')} part="II" />
    <Predict always={report} id="ae3-II6" kind="number" prompt={`Vers quelle valeur tend la sortie S(t) pour une consigne e = ${fmt(v.e as number, 4)} ?`} expected={sim.s_final} tolerance={0.03}>
      <p>
        Simulink montre la sortie continue S(t) du procédé. Entre deux instants d'échantillonnage, la commande est maintenue par le bloqueur : S(t) évolue
        comme la réponse du premier ordre à un échelon constant. Aux instants kT, elle coïncide avec le modèle discret G(z) (écart {fmt(sim.ecart_instants, 2)}).
        Elle tend vers e·K/(1 + K) = {fmt(sim.s_final, 4)} : l'erreur statique n'est pas nulle.
      </p>
      <Plot
        series={[
          { x: sim.t_fin, y: sim.s_continue, label: 'S(t) continue', color: 1 },
          { x: sim.kk.map((k) => k * T), y: sim.u_k, kind: 'stairs', label: 'commande u maintenue', color: 2, dashed: true },
          { x: sim.kk.map((k) => k * T), y: sim.s_k, kind: 'stem', label: 'S(kT), modèle discret', color: 3 },
        ]}
        xLabel="t (s)"
        yLabel="amplitude"
        hRules={[{ at: sim.s_final, label: `valeur finale ${fmt(sim.s_final, 3)}`, color: 4 }]}
        summary={`Réponse indicielle de la boucle : la sortie part de 0 et tend vers ${fmt(sim.s_final, 3)} ; la commande maintenue part de ${fmt(sim.u_k[0], 3)}.`}
      />
      <details class="card recipe">
        <summary>Construire le modèle dans Simulink</summary>
        <ol>
          <li><code>Step</code> (Final value = {fmt(v.e as number, 6)}) → <code>Sum</code> (signes <code>+-</code>).</li>
          <li><code>Zero-Order Hold</code>, Sample time = {fmt(T, 6)} : c'est l'échantillonneur et le bloqueur à la fois.</li>
          <li><code>Gain</code> = {fmt(K, 6)} (le contrôleur), puis <code>Transfer Fcn</code> : numérateur <code>[1]</code>, dénominateur <code>[1 1]</code>.</li>
          <li>Ramener la sortie sur l'entrée <code>-</code> du <code>Sum</code> ; <code>Scope</code> sur la sortie. Durée de simulation : {fmt(sim.duree, 4)} s.</li>
        </ol>
      </details>
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="II.6" filename={SCRIPT_NAME} needs={['II.3', 'II.4']} />
    </Predict>
  </article>

  <!-- Question 7 -->
  <article>
    <QuestionHead q={question('II.7')} part="II" />
    <Predict always={report} id="ae3-II7" kind="number" prompt={`Quelle est la valeur limite de K pour T = ${fmt(T, 4)} s ?`} expected={Kmax} tolerance={0.05}>
      <Derivation steps={loop.steps.slice(6, 8)} title="Valeur limite de K, pas à pas" />
      <p>
        <strong>K<sub>max</sub> = {fmt(Kmax, 5)}</strong>. Pour K = K<sub>max</sub>, MATLAB place bien le pôle en
        {fmt(r['II.7'].pole_a_Kmax[0].re, 6)}, sur le cercle unité. Au-delà, le pôle passe sous −1 : la réponse oscille en changeant de signe à chaque période et
        diverge.
      </p>
      <Plot
        series={essais.K_essais.map((k, i) => ({
          x: Array.from({ length: cut(essais.reponses_essais[i]).length }, (_, j) => j * T),
          y: cut(essais.reponses_essais[i]),
          kind: 'stairs' as const,
          label: `K = ${fmt(k, 3)} (p = ${fmt(essais.poles_essais[i], 3)})`,
          color: i + 1,
          dashed: i === 3,
        }))}
        xLabel="t (s)"
        yLabel="sortie S(kT)"
        yDomain={[-yMaxEssais, yMaxEssais]}
        summary={`Réponses indicielles pour K = 1, 0,5·Kmax, 0,9·Kmax et 1,1·Kmax : stables sauf la dernière, qui diverge en oscillant.`}
      />
      <Plot
        series={[{ x: essais.T_grille, y: essais.Kmax_T, label: 'Kmax(T) = (1 + e^−T)/(1 − e^−T)', color: 1 }]}
        xLabel="T (s)"
        yLabel="Kmax"
        yDomain={[0, Math.min(60, Math.max(...essais.Kmax_T.filter((x) => x < 60)) * 1.05)]}
        vRules={[{ at: T, label: `T = ${fmt(T, 3)} s`, color: 2 }]}
        hRules={[{ at: K, label: `K = ${fmt(K, 3)}`, color: 3 }]}
        summary={`Gain limite en fonction de T : décroissant ; ${fmt(Kmax, 4)} pour T = ${fmt(T, 3)} s.`}
        height={260}
      />
      <p>Échantillonner plus lentement (T plus grand) réduit le gain admissible : la boucle réagit avec retard aux écarts.</p>
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="II.7" filename={SCRIPT_NAME} needs={['II.3', 'II.4']} />
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
  article {
    margin-top: 2rem;
  }
  .cmp {
    margin: 0.6rem 0;
    display: block;
    overflow-x: auto;
  }
  .cmp th[scope],
  .cmp tbody th {
    font-weight: 600;
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
