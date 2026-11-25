<script lang="ts">
  /** Traitement du signal TP3, questions 1-8 (x1, x2, x3 on tmax). Every number comes from the engine. */
  import { magnitude } from '../../engine/dsp'
  import { INTRO, question } from '../../content/tsTp3'
  import { cosineLines, dcLine, delayPhase } from '../../derive/signal'
  import { fmt } from '../../lib/format'
  import { SCRIPT_NAME, SCRIPT_SOURCE, ts3 } from '../../lib/stores/tsTp3.svelte'
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
  const v = ts3.values
  $effect(() => ts3.restore())
  const spec = (n: string) => ts3.specs.find((s) => s.name === n)!
  const r = $derived(ts3.result)
  const c1 = $derived(r.Q1)
  const N = $derived(c1.N)
  const f = $derived(r.Q2.f)
  const div = (a: number[]) => a.map((x) => x / N)
  const X1 = $derived(r.Q2.X1)
  const X2 = $derived(r.Q5.X2)
  const X3 = $derived(r.Q7.X3)
  const imagZero = $derived(Math.max(...X1.im.map(Math.abs)) < 1e-9 * Math.max(...magnitude(X1)))
  const stem = (y: number[], label: string, color = 1) => [{ x: f, y, kind: 'stem' as const, label, color }]
  const A = $derived(r.Q4.amplitude_cosinus)
  /** frequency of the cosines (100 Hz in the script) */
  const f0 = $derived(c1.f0)
</script>

<section aria-labelledby="partie-2.2">
  <h2 id="partie-2.2">2.2 Manipulation</h2>
  <div class="statement">
    <p><q>{INTRO}</q></p>
    <p class="muted">Énoncé transcrit, non vérifié sur le fascicule original.</p>
  </div>
  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages des questions 1 à 8">
      <div class="grid">
        <ParamSlider spec={spec('tmax')} values={v} label="Temps d'acquisition tmax" />
        <ParamSlider spec={spec('inclure_tmax')} values={v} label="Nombre de points" choiceLabels={['N = tmax·Fe (n = 0 … N−1)', 'N + 1 (t = 0:Te:tmax)']} errata={`${errataBase}#E-TS5`} />
      </div>
    </div>
  {:else}
    <p class="card">Valeurs utilisées : tmax = {fmt(c1.tmax, 6)} s, N = {N} points.</p>
  {/if}

  <article>
    <QuestionHead q={question('Q1')} part="2.2" />
    <Predict always={report} id="ts3-Q1" kind="number" prompt={`Combien d'échantillons x1[n] pour tmax = ${fmt(c1.tmax, 4)} s ?`} expected={N} tolerance={0.001}>
      <p>
        N = tmax·Fe = {fmt(c1.tmax * c1.Fe, 4)}{v.inclure_tmax ? ' + 1 = ' + N + ' (t = 0:Te:tmax inclut tmax)' : ' points, n = 0 … N − 1'}. « Sur une durée tmax » peut se lire des deux
        façons : avec N + 1 points, {fmt(f0)} Hz ne tombe plus sur une raie (<a href={`${errataBase}#E-TS5`}>errata E-TS5</a>).
      </p>
      <Plot series={[{ x: c1.n.map((k) => k * c1.Te), y: c1.x1, kind: 'stem', label: 'x1[n]', color: 1 }]} xLabel="t = nTe (s)" yLabel="x1[n]" summary={`Échantillons de 3cos(2π·${fmt(f0)}·nTe), ${N} points.`} height={240} />
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q1" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('Q2')} part="2.2" />
    <Predict always={report} id="ts3-Q2" kind="choice" prompt="La partie imaginaire de X1(f) est-elle nulle ?" options={['oui, aux arrondis près', 'non']} correct={imagZero ? 0 : 1}>
      <p>
        {#if imagZero}Oui : avec N = {N}, x1 contient un nombre entier de périodes et vérifie x1[N − n] = x1[n] ; sa TFD est réelle. La partie imaginaire tracée est un zéro
          numérique.{:else}Non : avec N = {N}, le signal ne contient plus un nombre entier de périodes, sa TFD n'est plus réelle.{/if}
      </p>
      <Plot series={stem(X1.re, 'Re X1(f)')} xLabel="f (Hz)" yLabel="Re X1" summary={`Partie réelle de X1 : deux raies à ±${fmt(f0)} Hz.`} height={220} />
      <Plot series={stem(X1.im, 'Im X1(f)', 2)} xLabel="f (Hz)" yLabel="Im X1" summary="Partie imaginaire de X1." height={220} />
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q2" filename={SCRIPT_NAME} needs={['Q1']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('Q3')} part="2.2" />
    <Predict always={report} id="ts3-Q3" kind="number" prompt="Quelle est la hauteur des deux raies de |X1(f)| ?" expected={r.Q4.amplitude_raie} tolerance={0.02}>
      <Plot series={stem(magnitude(X1), '|X1(f)|')} xLabel="f (Hz)" yLabel="|X1|" summary={`Spectre d'amplitude : raies de ${fmt(r.Q4.amplitude_raie, 4)} à ±${fmt(r.Q4.f_raie, 4)} Hz.`} height={240} />
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q3" filename={SCRIPT_NAME} needs={['Q1', 'Q2']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('Q4')} part="2.2" />
    <Predict always={report} id="ts3-Q4" kind="number" prompt="Quelle amplitude du cosinus retrouve-t-on avec 2·|X1|/N ?" expected={A} tolerance={0.02}>
      <Derivation steps={cosineLines(A, r.Q4.f_raie, N, c1.Fe)} />
      <Plot series={stem(div(magnitude(X1)), '|X1(f)|/N')} xLabel="f (Hz)" yLabel="|X1|/N" summary={`Spectre normalisé : raies de ${fmt(r.Q4.amplitude_bilaterale, 4)}.`} height={240} />
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q4" filename={SCRIPT_NAME} needs={['Q1', 'Q2']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('Q5')} part="2.2" />
    <Predict always={report} id="ts3-Q5" kind="number" prompt="Avant division par N, quelle est la hauteur de la raie de X2 à f = 0 ?" expected={r.Q6.raie_continue * N} tolerance={0.02}>
      <Plot series={stem(div(X2.re), 'Re X2/N')} xLabel="f (Hz)" yLabel="Re X2/N" summary={`Partie réelle de X2/N : raie continue et raies à ±${fmt(f0)} Hz.`} height={220} />
      <Plot series={stem(div(X2.im), 'Im X2/N', 2)} xLabel="f (Hz)" yLabel="Im X2/N" summary="Partie imaginaire de X2/N." height={220} />
      <Plot series={stem(div(magnitude(X2)), '|X2|/N', 3)} xLabel="f (Hz)" yLabel="|X2|/N" summary={`Spectre d'amplitude de x2 : raie continue ${fmt(r.Q6.raie_continue, 4)}.`} height={220} />
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q5" filename={SCRIPT_NAME} needs={['Q1', 'Q2']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('Q6')} part="2.2" />
    <Predict always={report} id="ts3-Q6" kind="number" prompt="Après division par N, combien vaut la raie à f = 0 ?" expected={r.Q6.raie_continue} tolerance={0.02}>
      <Derivation steps={dcLine(r.Q6.raie_continue, N)} />
      <p>Raies à ±{fmt(f0)} Hz inchangées : {fmt(r.Q6.raie_100_x2, 4)}.</p>
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q6" filename={SCRIPT_NAME} needs={['Q5']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('Q7')} part="2.2" />
    <Predict always={report} id="ts3-Q7" kind="choice" prompt={`La raie de X3 à +${fmt(f0)} Hz est-elle réelle ?`} options={['oui', 'non']} correct={Math.abs(r.Q8.raie_x3.im) > 1e-9 ? 1 : 0}>
      <Plot series={stem(div(X3.re), 'Re X3/N')} xLabel="f (Hz)" yLabel="Re X3/N" summary="Partie réelle de X3/N." height={220} />
      <Plot series={stem(div(X3.im), 'Im X3/N', 2)} xLabel="f (Hz)" yLabel="Im X3/N" summary={`Partie imaginaire de X3/N : non nulle à ±${fmt(f0)} Hz.`} height={220} />
      <Plot series={stem(div(magnitude(X3)), '|X3|/N', 3)} xLabel="f (Hz)" yLabel="|X3|/N" summary="Spectre d'amplitude de x3." height={220} />
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q7" filename={SCRIPT_NAME} needs={['Q1']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('Q8')} part="2.2" />
    <p class="note">
      x3 a une amplitude 1 alors que x2 a une amplitude 3 : comparé à X2, l'effet du retard se mélange à un facteur 1/3. On compare donc aussi avec 5 + cos(2π·{fmt(f0)}·nTe)
      (<a href={`${errataBase}#E-TS10`}>errata E-TS10</a>).
    </p>
    <Predict always={report} id="ts3-Q8" kind="number" prompt={`Quel déphasage (en rad) mesure-t-on sur la raie à +${fmt(f0)} Hz ?`} expected={r.Q8.dephasage_mesure} tolerance={0.02} unit="rad">
      <Derivation steps={delayPhase(r.Q8.dephasage_mesure, r.Q4.f_raie)} />
      <p>
        Mesuré : raie X3(+{fmt(f0)})/N = {fmt(r.Q8.raie_x3.re, 4)} {r.Q8.raie_x3.im < 0 ? '−' : '+'} {fmt(Math.abs(r.Q8.raie_x3.im), 4)}j ; rapport des modules avec la référence
        {fmt(r.Q8.rapport_modules, 4)} (le module ne change pas) ; rapport avec X2 {fmt(r.Q8.rapport_x3_x2, 4)} (effet de l'amplitude, pas du retard).
      </p>
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q8" filename={SCRIPT_NAME} needs={['Q5', 'Q7']} />
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
