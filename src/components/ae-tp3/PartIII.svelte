<script lang="ts">
  /**
   * Automatique TP3, part III: the water tank G₁(s) = 12.5/(50s + 1) behind a
   * ZOH, proportional digital controller, unity feedback. Every number comes
   * from the engine at the current slider values.
   */
  import { PART_III, question } from '../../content/aeTp3'
  import { closedLoop, gainForTolerance } from '../../derive/firstOrderLoop'
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
    report?: boolean
    errataBase: string
  }
  let { report = false, errataBase }: Props = $props()

  const v = tp3.values
  $effect(() => tp3.restore()) // after hydration: URL and saved values (see tpStore)
  const spec = (n: string) => tp3.specs.find((s) => s.name === n)!
  const r = $derived(tp3.result)
  const T = $derived(v.T_r as number)
  const K = $derived(v.K_r as number)
  const H0 = $derived(v.consigne as number)
  const eps = $derived(v.eps_tol as number)
  const loop = $derived(closedLoop({ k: r['III.1'].k_reservoir, tau: r['III.1'].tau_reservoir, T, K, plant: 'G₁', sym: 'b' }))
  const tol = $derived(gainForTolerance(r['III.1'].k_reservoir, r['III.1'].tau_reservoir, eps, T))
  const b = $derived(r['III.1'].b)
  const kr = $derived(r['III.1'].k_reservoir)
  const taur = $derived(r['III.1'].tau_reservoir)
  const pole = $derived(r['III.5'].pole_r_main)
  const stable = $derived(r['III.5'].stable_bf_r)
  const t3 = $derived(r['III.3'])
  const t4 = $derived(r['III.4'])
  const t6 = $derived(r['III.6'])
  const lastT = $derived(t3.T_liste.at(-1)!)
  const locus = $derived(Array.from({ length: 61 }, (_, i) => ({ re: b - ((1.5 * t4.Kmax_r * i) / 60) * kr * (1 - b), im: 0 })))
  const tfFormula = (num: number, p: number) => math(eq(row(mi('G'), paren(mi('z'))), frac(mn(num, 4), minus(mi('z'), p, 6))), { display: true })
</script>

<section aria-labelledby="partie-III">
  <h2 id="partie-III">III. {PART_III.title}</h2>
  <div class="statement">
    {#each PART_III.intro as p (p)}<p><q>{p}</q></p>{/each}
    <p class="muted">
      Fascicule, p. 14. La consigne est une hauteur (2 m), notée Qₑ(S) sur la figure (<a href={`${errataBase}#E-AE5`}>errata E-AE5</a>) ; T et K ne sont pas
      donnés (<a href={`${errataBase}#E-AE1`}>E-AE1</a>).
    </p>
  </div>

  <SampledLoopDiagram figure={PART_III.figure.number} caption={PART_III.figure.caption} input="Qₑ(S)" output="H(s)" {T} {K} k={kr} tau={taur} {errataBase} />

  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages de la partie III">
      <p class="ptitle"><strong>Réglages</strong> — le code MATLAB et toutes les valeurs ci-dessous suivent ces curseurs.</p>
      <div class="grid">
        <ParamSlider spec={spec('T_r')} values={v} label="Période d'échantillonnage T" errata={`${errataBase}#E-AE1`} />
        <ParamSlider spec={spec('K_r')} values={v} label="Gain du contrôleur K" errata={`${errataBase}#E-AE2`} />
        <ParamSlider spec={spec('consigne')} values={v} label="Consigne de hauteur" />
        <ParamSlider spec={spec('eps_tol')} values={v} label="Tolérance sur la hauteur (question 4)" errata={`${errataBase}#E-AE6`} />
      </div>
    </div>
  {:else}
    <p class="card">Valeurs utilisées : T = {fmt(T, 6)} s, K = {fmt(K, 6)}, consigne {fmt(H0, 6)} m, tolérance {fmt(eps * 100, 4)} %.</p>
  {/if}

  <!-- III.1 -->
  <article>
    <QuestionHead q={question('III.1')} part="III" />
    <Predict always={report} id="ae3-III1" kind="number" prompt={`Où se trouve le pôle de G(z) en boucle fermée, pour T = ${fmt(T, 4)} s et K = ${fmt(K, 4)} ?`} expected={pole} tolerance={0.02}>
      <Derivation steps={loop.steps.slice(0, 6)} />
      <p><strong>Résultat :</strong></p>
      {@html tfFormula(r['III.1'].G_bf_r_main.num[0], pole)}
      <p>Avec b = e<sup>−T/τ</sup> = {fmt(b, 6)} (τ = {fmt(taur, 4)} s) : le pôle vaut b − kK(1 − b) = {fmt(pole, 6)}, avec k = {fmt(kr, 4)}.</p>
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="III.1" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <!-- III.2 -->
  <article>
    <QuestionHead q={question('III.2')} part="III" />
    <Predict always={report} id="ae3-III2" kind="number" prompt="Quel numérateur c2d doit-il donner pour G₀(z) ?" expected={r['III.2'].G0r.num.at(-1)!} tolerance={0.01}>
      <table class="cmp num">
        <thead><tr><th></th><th>calcul à la main</th><th><code>c2d</code> / <code>feedback</code></th></tr></thead>
        <tbody>
          <tr><th>G₀(z), numérateur</th><td>k(1 − b) = {fmt(kr * (1 - b), 6)}</td><td>{fmt(r['III.2'].G0r.num.at(-1)!, 6)}</td></tr>
          <tr><th>G₀(z), pôle</th><td>b = {fmt(b, 6)}</td><td>{fmt(-r['III.2'].G0r.den[1] / r['III.2'].G0r.den[0], 6)}</td></tr>
          <tr><th>G(z), pôle</th><td>{fmt(pole, 6)}</td><td>{fmt(-r['III.2'].G_bf_r.den[1] / r['III.2'].G_bf_r.den[0], 6)}</td></tr>
        </tbody>
      </table>
      <p>Écart entre les deux calculs : {fmt(r['III.2'].ecart_r, 3)} (arrondi machine).</p>
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="III.2" filename={SCRIPT_NAME} needs={['III.1']} />
    </Predict>
  </article>

  <!-- III.3 -->
  <article>
    <QuestionHead q={question('III.3')} part="III" />
    <Predict
      always={report}
      id="ae3-III3"
      kind="choice"
      prompt={`Avec K = ${fmt(K, 4)}, la boucle est-elle encore stable pour T = ${fmt(lastT, 4)} s ?`}
      options={['stable', 'instable']}
      correct={t3.stable_liste.at(-1) ? 0 : 1}
    >
      <p>
        K<sub>max</sub>(T) = (1 + b)/(k(1 − b)) baisse quand T augmente. Avec K = {fmt(K, 4)}, la boucle devient instable dès que
        T > {fmt(t3.T_limite, 4)} s{#if !Number.isFinite(t3.T_limite)} (jamais ici : k·K = {fmt(kr * K, 3)} ≤ 1){/if}.
      </p>
      <table class="cmp num">
        <thead><tr><th>T (s)</th><th>K<sub>max</sub>(T)</th><th>K = {fmt(K, 3)}</th></tr></thead>
        <tbody>
          {#each t3.T_liste as Ti, i (Ti)}
            <tr><td>{fmt(Ti, 4)}</td><td>{fmt(t3.Kmax_liste[i], 4)}</td><td>{t3.stable_liste[i] ? 'stable' : 'instable'}</td></tr>
          {/each}
        </tbody>
      </table>
      <Plot
        series={t3.hauteurs.map((h, i) => ({ x: h.t, y: h.H, kind: 'stairs' as const, label: `T = ${fmt(h.T, 3)} s${t3.stable_liste[i] ? '' : ' (instable)'}`, color: i + 1, dashed: !t3.stable_liste[i] }))}
        xLabel="t (s)"
        yLabel="hauteur H (m)"
        yDomain={[-H0, 2.6 * H0]}
        hRules={[{ at: H0, label: `consigne ${fmt(H0, 3)} m`, color: 4 }]}
        summary={`Hauteur aux instants d'échantillonnage pour T = ${t3.T_liste.join(', ')} s ; les réponses stables tendent vers ${fmt(r['III.6'].H_final, 3)} m.`}
      />
      <p>
        Les réponses stables se ressemblent tant que T reste petit devant la constante de temps ({fmt(taur, 4)} s pour le réservoir, plus courte en boucle fermée). Quand T
        grandit, la commande est corrigée trop rarement et la boucle oscille puis diverge.
      </p>
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="III.3" filename={SCRIPT_NAME} needs={['III.1', 'III.2']} />
    </Predict>
  </article>

  <!-- III.4 -->
  <article>
    <QuestionHead q={question('III.4')} part="III" />
    <p class="note">
      L'énoncé ne fixe pas de tolérance : avec un contrôleur proportionnel, H(∞) = consigne·kK/(1 + kK) n'atteint jamais exactement la consigne. On cherche
      donc le plus petit K qui donne une erreur relative d'au plus {fmt(eps * 100, 4)} % (<a href={`${errataBase}#E-AE6`}>errata E-AE6</a>).
    </p>
    <Predict
      always={report}
      id="ae3-III4"
      kind="choice"
      prompt={`Avec T = ${fmt(T, 4)} s, un contrôleur proportionnel peut-il amener la hauteur à ${fmt(eps * 100, 3)} % près de ${fmt(H0, 3)} m ?`}
      options={['oui', 'non']}
      correct={t4.realisable ? 0 : 1}
    >
      <Derivation steps={tol.steps} title="Gain nécessaire et période maximale" />
      <p>
        <strong>K ≥ {fmt(t4.K_min, 4)}</strong> donne H(∞) = {fmt(t4.H_final_Kmin, 5)} m.
        {#if t4.realisable}
          À T = {fmt(T, 4)} s, K<sub>max</sub> = {fmt(t4.Kmax_r, 5)} : ce gain est stable, la consigne est atteinte à la tolérance près.
        {:else}
          Mais à T = {fmt(T, 4)} s, K<sub>max</sub> = {fmt(t4.Kmax_r, 5)} : ce gain rendrait la boucle instable. La meilleure erreur possible à cette période est
          {fmt(t4.erreur_min_atteignable * 100, 3)} % ; il faut échantillonner plus vite que T = {fmt(t4.T_max_tolerance, 4)} s.
        {/if}
      </p>
      <Plot
        series={[{ x: t4.T_grille_r, y: t4.Kmax_r_T, label: 'Kmax(T) du réservoir', color: 1 }]}
        xLabel="T (s)"
        yLabel="gain K"
        yDomain={[0, Math.max(2 * t4.K_min, 2)]}
        hRules={[{ at: t4.K_min, label: `K nécessaire = ${fmt(t4.K_min, 3)}`, color: 2 }]}
        vRules={[
          { at: T, label: `T = ${fmt(T, 3)} s`, color: 3 },
          ...(Number.isFinite(t4.T_max_tolerance) && t4.T_max_tolerance < 60 ? [{ at: t4.T_max_tolerance, label: `Tmax = ${fmt(t4.T_max_tolerance, 3)} s`, color: 4 }] : []),
        ]}
        summary={`Le gain nécessaire ${fmt(t4.K_min, 3)} est sous la courbe Kmax(T) pour T inférieur à ${fmt(t4.T_max_tolerance, 3)} s.`}
        height={260}
      />
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="III.4" filename={SCRIPT_NAME} needs={['III.1']} />
    </Predict>
  </article>

  <!-- III.5 -->
  <article>
    <QuestionHead q={question('III.5')} part="III" />
    <Predict always={report} id="ae3-III5" kind="choice" prompt={`Pour T = ${fmt(T, 4)} s et K = ${fmt(K, 4)}, la boucle est-elle stable ?`} options={['stable', 'instable']} correct={stable ? 0 : 1}>
      <p>
        Un pôle p = {fmt(pole, 6)}, aucun zéro : la boucle est <strong>{stable ? 'stable' : 'instable'}</strong> (|p| {stable ? '<' : '≥'} 1). Le lieu des
        racines part de b = {fmt(b, 4)} et sort du cercle unité pour K = {fmt(t4.Kmax_r, 4)}.
      </p>
      <ZPlane
        poles={[{ re: pole, im: 0 }]}
        {locus}
        marks={[
          { re: b, im: 0, label: 'K = 0' },
          { re: -1, im: 0, label: 'Kmax' },
        ]}
        title="Pôle du réservoir en boucle fermée"
        summary={`Plan z : pôle en ${fmt(pole, 4)} ; lieu des racines de ${fmt(b, 4)} vers la gauche ; sortie du cercle unité pour K = ${fmt(t4.Kmax_r, 4)}.`}
      />
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="III.5" filename={SCRIPT_NAME} needs={['III.1', 'III.2']} />
    </Predict>
  </article>

  <!-- III.6 -->
  <article>
    <QuestionHead q={question('III.6')} part="III" />
    <Predict always={report} id="ae3-III6" kind="number" prompt={`Quelle erreur statique (en m) pour K = ${fmt(K, 4)} et une consigne de ${fmt(H0, 3)} m ?`} expected={t6.erreur_statique} tolerance={0.03} unit="m">
      <Derivation steps={loop.steps.slice(8)} title="Erreur statique" />
      <p>
        <strong>ε∞ = {fmt(t6.erreur_statique, 4)} m</strong> (formule : {fmt(t6.erreur_statique_main, 4)} m) ; la hauteur se stabilise à H(∞) =
        {fmt(t6.H_final, 4)} m{#if !stable} — en théorie seulement : avec ces réglages la boucle est instable{/if}.
      </p>
      <CodeCell script={tp3.script} original={SCRIPT_SOURCE} cell="III.6" filename={SCRIPT_NAME} needs={['III.1', 'III.2']} />
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
</style>
