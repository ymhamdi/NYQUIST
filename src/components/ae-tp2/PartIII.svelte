<script lang="ts">
  /** Automatique TP2, part III: G(s) = 9/(s + 9) with and without a hold. Every number comes from the engine. */
  import { PART_III, question } from '../../content/aeTp2'
  import { impulseInvariance } from '../../derive/discretization'
  import { zohFirstOrder } from '../../derive/firstOrderLoop'
  import { fmt } from '../../lib/format'
  import { eq, frac, math, mi, minus, mn, mo, paren, row } from '../../lib/mathml'
  import { SCRIPT_NAME, SCRIPT_SOURCE, tp2 } from '../../lib/stores/aeTp2.svelte'
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
  const T = $derived(v.T as number)
  const G = $derived(r['III.1'].G)
  const k = $derived(G.num.at(-1)! / G.den.at(-1)!)
  const tau = $derived(G.den[0] / G.den.at(-1)!)
  const pole = $derived(r['III.2'].poles_G[0].re)
  const c4 = $derived(r['III.4'])
  const c5 = $derived(r['III.5'])
  const c6 = $derived(r['III.6'])
  const zoh = $derived(zohFirstOrder({ k, tau, T, K: 1, plant: 'G', sym: 'a' }))
  const tk = $derived(c5.kz.map((i) => i * T))
  const tfz = (num: number, p: number) => math(eq(row(mi('G'), paren(mi('z'))), frac(mn(num, 4), minus(mi('z'), p, 6))), { display: true })
</script>

<section aria-labelledby="partie-III">
  <h2 id="partie-III">III. {PART_III.title}</h2>
  <div class="statement">
    <p><q>{PART_III.intro}</q></p>
    <p class="muted">Fascicule, p. 10. T n'est pas donnée (<a href={`${errataBase}#E-AE17`}>errata E-AE17</a>).</p>
  </div>
  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages de la partie III">
      <ParamSlider spec={spec('T')} values={v} label="Période d'échantillonnage T" errata={`${errataBase}#E-AE17`} />
    </div>
  {:else}
    <p class="card">Valeur utilisée : T = {fmt(T, 6)} s.</p>
  {/if}

  <article>
    <QuestionHead q={question('III.1')} part="III" />
    <Predict always={report} id="ae2-III1" kind="number" prompt="Quelle est la constante de temps de G(s) (en s) ?" expected={tau} tolerance={0.03} unit="s">
      <p>
        G(s) = {fmt(G.num.at(-1)!, 4)}/(s + {fmt(G.den.at(-1)!, 4)}) = {fmt(k, 4)}/({fmt(tau, 4)}s + 1) : gain statique {fmt(k, 4)}, constante de temps
        1/{fmt(G.den.at(-1)!, 4)} = {fmt(tau, 4)} s. En MATLAB : <code>G = tf({fmt(G.num.at(-1)!, 4)}, [1 {fmt(G.den.at(-1)!, 4)}])</code>.
      </p>
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="III.1" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('III.2')} part="III" />
    <p class="note">rlocus trace le lieu des racines ; les pôles et zéros de G en sont les points de départ et d'arrivée. pole, zero et pzmap les donnent directement (<a href={`${errataBase}#E-AE18`}>errata E-AE18</a>).</p>
    <Predict always={report} id="ae2-III2" kind="number" prompt="Où est le pôle de G(s) ?" expected={pole} tolerance={0.01}>
      <p>Un pôle, s = {fmt(pole, 4)}, et aucun zéro. Le lieu des racines de 1 + K·G(s) part de ce pôle et va vers −∞ sur l'axe réel : la boucle reste stable pour tout K > 0.</p>
      <ZPlane poles={r['III.2'].poles_G} unitCircle={false} span={Math.abs(pole) * 1.4} locus={[{ re: pole, im: 0 }, { re: pole * 1.4, im: 0 }]} title="Plan s : pôle de G" summary={`Plan s : un pôle en ${fmt(pole, 3)}, aucun zéro.`} />
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="III.2" filename={SCRIPT_NAME} needs={['III.1']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('III.3')} part="III" />
    <Predict
      always={report}
      id="ae2-III3"
      kind="choice"
      prompt="Le bloc Zero-Pole de Simulink trace-t-il le diagramme des pôles et des zéros ?"
      options={['oui', 'non, il définit le système']}
      correct={1}
    >
      <p>
        Le bloc Zero-Pole <em>définit</em> un système par ses zéros, ses pôles et son gain : Zeros = [], Poles = [{fmt(pole, 4)}], Gain = {fmt(G.num.at(-1)!, 4)}.
        Il donne le même système que tf (écart {fmt(r['III.3'].ecart_zp_tf, 2)}). Le diagramme se trace avec <code>pzmap</code> (<a href={`${errataBase}#E-AE19`}>errata E-AE19</a>).
      </p>
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="III.3" filename={SCRIPT_NAME} needs={['III.1']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('III.4')} part="III" />
    <Predict always={report} id="ae2-III4" kind="number" prompt={`Où est le pôle de G(z) pour T = ${fmt(T, 4)} s ?`} expected={c4.pole_z[0].re} tolerance={0.005}>
      <Derivation steps={zoh.steps} />
      {@html tfz(c4.Gz.num.at(-1)! / c4.Gz.den[0], c4.a)}
      <p>Le pôle s = {fmt(pole, 4)} devient z = e^(sT) = {fmt(c4.a, 6)} ; gain statique G(1) = {fmt(c4.gain_statique_z, 6)}, comme G(0).</p>
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="III.4" filename={SCRIPT_NAME} needs={['III.1']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('III.5')} part="III" />
    <Predict always={report} id="ae2-III5" kind="choice" prompt="Aux instants kT, la réponse discrète (avec bloqueur) est-elle égale à la réponse continue ?" options={['oui, exactement', 'non, approximativement']} correct={0}>
      <p>
        Oui : un échelon est constant entre deux instants, le bloqueur ne le modifie pas. L'écart mesuré aux instants kT vaut {fmt(c5.ecart_zoh_instants, 2)}.
      </p>
      <Plot
        series={[
          { x: c5.tc, y: c5.yc, label: 'G(s) continu', color: 1 },
          { x: tk, y: c5.yz, kind: 'stairs', label: 'G(z) avec bloqueur', color: 2 },
        ]}
        xLabel="t (s)"
        yLabel="sortie"
        summary={`Réponses indicielles continue et discrète : identiques aux instants kT, gain statique ${fmt(c4.gain_statique_z, 3)}.`}
      />
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="III.5" filename={SCRIPT_NAME} needs={['III.1', 'III.4']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('III.6')} part="III" />
    <p class="note">
      La commande « 'imp' » n'existe pas : on la lit comme <code>c2d(G, T, 'impulse')</code>, la discrétisation sans bloqueur (<a href={`${errataBase}#E-AE20`}
        >errata E-AE20</a
      >). GNU Octave renvoie Z{'{'}g(kT){'}'} ; MATLAB le multiplie peut-être par T, à vérifier (<a href={`${errataBase}#E-AE26`}>E-AE26</a>).
    </p>
    <Predict always={report} id="ae2-III6" kind="number" prompt={"Sans bloqueur, quel est le gain statique de Z{g(kT)} ?"} expected={c6.gain_statique_imp} tolerance={0.02}>
      <Derivation steps={impulseInvariance(k, tau, T)} />
      <Plot
        series={[
          { x: c5.tc, y: c5.yc, label: 'continu', color: 1 },
          { x: tk, y: c5.yz, kind: 'stairs', label: 'avec bloqueur', color: 2 },
          { x: tk, y: c6.yi_T, kind: 'stairs', label: 'sans bloqueur (× T)', color: 3, dashed: true },
        ]}
        xLabel="t (s)"
        yLabel="sortie"
        summary={`Avec bloqueur la réponse discrète est exacte ; sans bloqueur (× T) elle tend vers ${fmt(c6.gain_statique_imp_T, 4)} au lieu de ${fmt(c6.gain_statique_zoh, 4)}.`}
      />
      <CodeCell script={tp2.script} original={SCRIPT_SOURCE} cell="III.6" filename={SCRIPT_NAME} needs={['III.1', 'III.4', 'III.5']} />
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
</style>
