<script lang="ts">
  /** Traitement du signal TP3, questions 9-12 (resolution, zero-padding). Every number comes from the engine. */
  import { magnitude } from '../../engine/dsp'
  import { question } from '../../content/tsTp3'
  import { resolution, zeroPadding } from '../../derive/signal'
  import { fmt } from '../../lib/format'
  import { SCRIPT_NAME, SCRIPT_SOURCE, ts3 } from '../../lib/stores/tsTp3.svelte'
  import CodeCell from '../CodeCell.svelte'
  import Derivation from '../Derivation.svelte'
  import Plot from '../Plot.svelte'
  import Predict from '../Predict.svelte'
  import QuestionHead from '../QuestionHead.svelte'

  interface Props {
    report?: boolean
    errataBase: string
  }
  let { report = false, errataBase }: Props = $props()
  $effect(() => ts3.restore())
  const r = $derived(ts3.result)
  const Fe = $derived(r.Q1.Fe)
  const f4 = $derived(r.Q9.f4)
  const q10 = $derived(r.Q10)
  const q12 = $derived(r.Q12)
  const nette = $derived(q10.sur_une_raie.findIndex(Boolean))
  /** true line height: the peak measured where the frequency falls on a bin */
  const vrai = $derived(q10.pics[Math.max(0, nette)])
</script>

<section aria-labelledby="partie-2b">
  <h2 id="partie-2b" class="visually-hidden">Questions 9 à 12</h2>
  <article>
    <QuestionHead q={question('Q9')} part="2.2" />
    <Predict always={report} id="ts3-Q9" kind="choice" prompt={`Avec tmax = ${fmt(r.Q9.N9 / Fe, 3)} s, la raie à ${fmt(f4, 4)} Hz est-elle nette (une seule raie) ?`} options={['oui', 'non']} correct={q10.sur_une_raie[1] ? 0 : 1}>
      <Derivation steps={resolution(r.Q9.N9 / Fe, f4, Fe)} />
      <Plot
        series={[{ x: r.Q9.f9, y: magnitude(r.Q9.X4), kind: 'stem', label: '|X4(f)|/N', color: 1 }]}
        xLabel="f (Hz)"
        yLabel="|X4|/N"
        summary={`Spectre de x4 : pic de ${fmt(r.Q9.pic_x4, 3)} au lieu de ${fmt(vrai, 3)}, l'énergie fuit sur les raies voisines.`}
        height={240}
      />
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q9" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('Q10')} part="2.2" />
    <Predict
      always={report}
      id="ts3-Q10"
      kind="choice"
      prompt={`Quelle durée d'acquisition donne une raie nette à ${fmt(f4, 4)} Hz ?`}
      options={q10.tmax_liste.map((t) => `${fmt(t, 3)} s`)}
      correct={Math.max(0, nette)}
    >
      <table class="cmp num">
        <thead><tr><th>tmax</th><th>Δf = 1/tmax</th><th>{fmt(f4, 4)} Hz sur une raie ?</th><th>hauteur du pic (vraie : {fmt(vrai, 3)})</th></tr></thead>
        <tbody>
          {#each q10.tmax_liste as tm, i (tm)}
            <tr><td>{fmt(tm, 3)} s</td><td>{fmt(q10.delta_f_liste[i], 3)} Hz</td><td>{q10.sur_une_raie[i] ? 'oui' : 'non'}</td><td>{fmt(q10.pics[i], 4)}</td></tr>
          {/each}
        </tbody>
      </table>
      <p>
        La résolution Δf = 1/tmax s'affine quand on observe plus longtemps. La hauteur du pic dépend de la position de {fmt(f4, 4)} Hz par rapport aux raies : exacte
        seulement si c'est un multiple de Δf.
      </p>
      <div class="grid3">
        {#each q10.spectra as s, i (s.tmax)}
          <Plot series={[{ x: s.f, y: s.mag, kind: 'stem', label: `tmax = ${fmt(s.tmax, 3)} s`, color: i + 1 }]} xLabel="f (Hz)" yLabel="|X4|/N" title={`tmax = ${fmt(s.tmax, 3)} s`} height={220} summary={`Spectre pour tmax = ${fmt(s.tmax, 3)} s : pic ${fmt(s.pic, 3)}.`} />
        {/each}
      </div>
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q10" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('Q11')} part="2.2" />
    <Predict always={report} id="ts3-Q11" kind="number" prompt={`Pour N = ${r.Q11.N11} échantillons, quel est p ?`} expected={r.Q11.p} tolerance={0.001}>
      <p>
        2^{r.Q11.p - 1} = {2 ** (r.Q11.p - 1)} ≤ N = {r.Q11.N11} &lt; 2^{r.Q11.p} = {r.Q11.L} : p = {r.Q11.p}. « Dépasse » se lit strictement supérieur ; <code>nextpow2</code> de MATLAB
        donnerait une valeur différente si N était une puissance de 2 (<a href={`${errataBase}#E-TS6`}>errata E-TS6</a>). La fonction
        <code>exposant_puissance2</code> est à la fin du script.
      </p>
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q11" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('Q12')} part="2.2" />
    <Predict always={report} id="ts3-Q12" kind="choice" prompt="Ajouter des zéros améliore-t-il la résolution fréquentielle ?" options={['oui', 'non']} correct={1}>
      <Derivation steps={zeroPadding(r.Q11.N11, r.Q11.L, Fe)} />
      <p class="note">
        Avec seulement {r.Q11.N11} points, le pic de la TFTD n'est pas à {fmt(f4, 4)} Hz mais à {fmt(q12.f_pic_tftd, 4)} Hz : le lobe de la composante continue ({fmt(r.Q6.raie_continue / vrai, 3)} fois plus
        grande) et la raie image débordent sur lui. Pics trouvés : {fmt(q12.f_pic_N, 4)} Hz sur {r.Q11.N11} points, {fmt(q12.f_pic_L, 4)} Hz sur {r.Q11.L} points.
        Les zéros rapprochent du pic de la TFTD, pas de la vraie fréquence.
      </p>
      <Plot
        series={[
          { x: q12.fd, y: magnitude(q12.Xd), label: 'TFTD de x4', color: 4, width: 1.4 },
          { x: q12.f11, y: magnitude(q12.X4_11), kind: 'stem', label: `x4, ${r.Q11.N11} points`, color: 2 },
          { x: q12.f5, y: magnitude(q12.X5), kind: 'points', label: `x5, ${r.Q11.L} points`, color: 1 },
        ]}
        xLabel="f (Hz)"
        yLabel="|X|/N"
        xDomain={[0, 2 * f4]}
        yDomain={[0, 0.8]}
        summary={`Ajout de zéros : les ${r.Q11.L} points suivent la TFTD ; pic à ${fmt(q12.f_pic_L, 4)} Hz.`}
      />
      <CodeCell script={ts3.script} original={SCRIPT_SOURCE} cell="Q12" filename={SCRIPT_NAME} needs={['Q11']} />
    </Predict>
  </article>
</section>

<style>
  article {
    margin-top: 2rem;
  }
  .cmp {
    display: block;
    overflow-x: auto;
    margin: 0.6rem 0;
  }
  .grid3 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
    gap: 0 1rem;
  }
</style>
