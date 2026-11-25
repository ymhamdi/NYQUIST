<script lang="ts">
  /** Traitement du signal TP4, partie I: z-transform functions on H1 and H2. Every number comes from the engine. */
  import type { Complex } from '../../engine/complex'
  import { DONNEES_I, OBJECTIF_I, question } from '../../content/tsTp4'
  import { longDivision, stabilityFromPoles, zConvention } from '../../derive/signal'
  import { fmt } from '../../lib/format'
  import { eq, frac, math, mi, mn, paren, poly, row, sub } from '../../lib/mathml'
  import { SCRIPT_NAME, SCRIPT_SOURCE, ts4 } from '../../lib/stores/tsTp4.svelte'
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
  const v = ts4.values
  $effect(() => ts4.restore())
  const spec = (n: string) => ts4.specs.find((s) => s.name === n)!
  const r = $derived(ts4.result)
  const c1 = $derived(r['I.1'])
  const c3 = $derived(r['I.3'])
  const c4 = $derived(r['I.4'])
  const c5 = $derived(r['I.5'])
  const est = $derived(r['Hors-fascicule'])

  const sum = (c: number[]) => c.reduce((s, x) => s + x, 0)
  const vec = (c: number[]) => `[${c.map((x) => String(x)).join(' ')}]`
  const cx = (z: Complex) => (Math.abs(z.im) < 1e-12 ? fmt(z.re, 4) : `${fmt(z.re, 4)} ${z.im < 0 ? '−' : '+'} ${fmt(Math.abs(z.im), 4)}j`)
  /** H_k(z) = num/den; the H_k(z) row is separate so its parentheses do not stretch to the fraction */
  const Hz = (num: number[], den: number[], k: number) => math(eq(row(sub(mi('H'), mn(k)), paren(mi('z'))), frac(poly(num, 'z'), poly(den, 'z'))), { display: true })
  const dB = (H: { re: number[]; im: number[] }) => H.re.map((x, i) => 20 * Math.log10(Math.hypot(x, H.im[i])))
  const phase = (H: { re: number[]; im: number[] }) => H.re.map((x, i) => Math.atan2(H.im[i], x))
  /** Num2 as a learner may type it: non-zero coefficients only, the right vector, or padded for impz */
  const num2Options = $derived([vec(c1.Num2.filter((x) => x !== 0)), vec(c1.Num2), vec([0, ...c1.Num2])])
  const k3 = 3
  /** frequency of the poles of H1: arg(p)/(2πTe) */
  const fPole = $derived(Math.abs(Math.atan2(c3.poles1[0].im, c3.poles1[0].re)) / (2 * Math.PI * c1.Te))
  const SUPS = ['', '', '²', '³', '⁴', '⁵']
  /** a polynomial in z as plain text, e.g. "z² − 0,3" */
  const ptxt = (c: number[]) =>
    c
      .map((a, i) => ({ a, k: c.length - 1 - i }))
      .filter((t) => t.a !== 0)
      .map((t, j) => `${t.a < 0 ? (j ? ' − ' : '−') : j ? ' + ' : ''}${Math.abs(t.a) === 1 && t.k ? '' : fmt(Math.abs(t.a), 4)}${t.k ? 'z' + SUPS[t.k] : ''}`)
      .join('')
</script>

<section aria-labelledby="partie-I">
  <h2 id="partie-I">I. Transformée en Z avec Matlab</h2>
  <div class="statement">
    <p><q>{OBJECTIF_I}</q></p>
    <p><q>{DONNEES_I}</q></p>
    <p class="muted">Énoncé transcrit, non vérifié sur le fascicule original.</p>
  </div>
  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages de la partie I">
      <div class="grid">
        <ParamSlider spec={spec('n_imp')} values={v} label="Échantillons de h[n] (impz)" />
        <ParamSlider spec={spec('n_freq')} values={v} label="Points de fréquence (freqz)" />
      </div>
    </div>
  {:else}
    <p class="card">Valeurs utilisées : {c4.n_imp} échantillons pour impz, {c5.n_freq} points pour freqz.</p>
  {/if}

  <article>
    <QuestionHead q={question('I.1')} part="I" />
    <Predict always={report} id="ts4-I1" kind="choice" prompt={`Quel vecteur MATLAB représente le numérateur ${ptxt(c1.Num2)} de H₂ ?`} options={num2Options} correct={1}>
      <p>
        Un polynôme est le vecteur de ses coefficients en puissances décroissantes, <strong>y compris les zéros</strong> des puissances absentes : il manque le terme en z,
        d'où Num2 = {vec(c1.Num2)}. Te = {fmt(c1.Te, 4)} s.
      </p>
      <CodeCell script={ts4.script} original={SCRIPT_SOURCE} cell="I.1" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('I.2')} part="I" />
    <div class="formula">{@html Hz(c1.Num1, c1.Den1, 1)}</div>
    <div class="formula">{@html Hz(c1.Num2, c1.Den2, 2)}</div>
    <p class="note">
      Le programme fourni utilise <code>dfilt.df1</code> (ancien objet de la Signal Processing Toolbox) et écrit <code>ft</code> pour <code>tf</code> :
      <code>tf(Num, Den, Te)</code> affiche la TZ avec sa période d'échantillonnage (<a href={`${errataBase}#E-TS7`}>errata E-TS7</a>).
    </p>
    <CodeCell script={ts4.script} original={SCRIPT_SOURCE} cell="I.2" filename={SCRIPT_NAME} needs={['I.1']} />
  </article>

  <article>
    <QuestionHead q={question('I.3')} part="I" />
    <Predict always={report} id="ts4-I3" kind="choice" prompt="H₂ est-il stable ?" options={['oui', 'non']} correct={c3.stable2 ? 0 : 1}>
      <Derivation steps={[...stabilityFromPoles('H₁', c3.module_poles1), ...stabilityFromPoles('H₂', c3.module_poles2)]} />
      <p>
        Pôles de H₁ : {c3.poles1.map(cx).join(' ; ')} ; zéro : {c3.zeros1.map(cx).join(' ; ')}.<br />
        Pôles de H₂ : {c3.poles2.map(cx).join(' ; ')} ; zéros : {c3.zeros2.map(cx).join(' ; ')}.
      </p>
      <div class="zgrid">
        <ZPlane title="H₁(z)" poles={c3.poles1} zeros={c3.zeros1} summary={`H1 : pôles de module ${c3.module_poles1.map((m) => fmt(m, 4)).join(' et ')}, dans le cercle unité.`} />
        <ZPlane
          title="H₂(z)"
          poles={c3.poles2}
          zeros={c3.zeros2}
          summary={`H2 : pôles de module ${c3.module_poles2.map((m) => fmt(m, 4)).join(', ')} ; ${c3.stable2 ? 'tous dans le cercle unité' : 'au moins un pôle hors du cercle unité'}.`}
        />
      </div>
      <CodeCell script={ts4.script} original={SCRIPT_SOURCE} cell="I.3" filename={SCRIPT_NAME} needs={['I.1']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('I.4')} part="I" />
    <Predict always={report} id="ts4-I4" kind="number" prompt={`Par division selon les puissances de z⁻¹, combien vaut h₁[${k3}] ?`} expected={c4.h1[k3]} tolerance={0.01}>
      <Derivation steps={[...zConvention(c1.Num1, c1.Den1), ...longDivision(c4.b1, c1.Den1, c4.h1)]} />
      <p>
        <code>filter(b1, Den1, δ)</code> donne la même suite que <code>impz</code> : écart maximal {fmt(c4.ecart_impz_filter, 3)}. Le second filtre, instable, a une réponse
        impulsionnelle qui diverge : |h₂[{c4.n_imp - 1}]| = {fmt(Math.abs(c4.h2[c4.n_imp - 1]), 4)}.
      </p>
      <Plot series={[{ x: c4.n.map((k) => k * c1.Te), y: c4.h1, kind: 'stem', label: 'h₁[n]', color: 1 }]} xLabel="t = nTe (s)" yLabel="h₁[n]" summary={`h1 : ${c4.n_imp} échantillons qui tendent vers 0 (filtre stable).`} height={240} />
      <Plot series={[{ x: c4.n.map((k) => k * c1.Te), y: c4.h2, kind: 'stem', label: 'h₂[n]', color: 2 }]} xLabel="t = nTe (s)" yLabel="h₂[n]" summary={`h2 : ${c4.n_imp} échantillons qui divergent (filtre instable).`} height={240} />
      <CodeCell script={ts4.script} original={SCRIPT_SOURCE} cell="I.4" filename={SCRIPT_NAME} needs={['I.1']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('I.5')} part="I" />
    <p class="note">
      Le programme fourni écrit <code>freqz(Num, Den, 1/Te)</code> : le troisième argument est un <em>nombre de points</em>, pas la fréquence d'échantillonnage. La forme
      correcte est <code>freqz(b, a, nPoints, Fe)</code> (<a href={`${errataBase}#E-TS7`}>errata E-TS7</a>).
    </p>
    <Predict always={report} id="ts4-I5" kind="number" prompt="Quel est le gain continu |H₁(1)| (f = 0, donc z = 1) ?" expected={c5.gain_continu_1} tolerance={0.01}>
      <p>
        En f = 0, z = e^(j0) = 1 : H₁(1) = ΣNum1 / ΣDen1 = {fmt(sum(c1.Num1), 4)} / {fmt(sum(c1.Den1), 4)} = {fmt(c5.gain_continu_1, 4)}. Le gain passe par un maximum de
        {fmt(c5.gain_max_1, 4)} à f = {fmt(c5.f_resonance_1, 4)} Hz, près de la fréquence des pôles arg(p)/(2πTe) = {fmt(fPole, 4)} Hz. Pour H₂, instable, freqz calcule bien H(e^(j2πfTe)), mais ce n'est pas un
        régime permanent : la sortie diverge.
      </p>
      <Plot
        series={[
          { x: c5.f1, y: dB(c5.Hf1), label: 'H₁', color: 1 },
          { x: c5.f2, y: dB(c5.Hf2), label: 'H₂ (instable)', color: 2, dashed: true },
        ]}
        xLabel="f (Hz)"
        yLabel="|H| (dB)"
        summary={`Réponses en amplitude : H1 part de ${fmt(20 * Math.log10(c5.gain_continu_1), 3)} dB, maximum à ${fmt(c5.f_resonance_1, 3)} Hz.`}
        height={260}
      />
      <Plot
        series={[
          { x: c5.f1, y: phase(c5.Hf1), label: 'H₁', color: 1 },
          { x: c5.f2, y: phase(c5.Hf2), label: 'H₂ (instable)', color: 2, dashed: true },
        ]}
        xLabel="f (Hz)"
        yLabel="phase (rad)"
        summary="Réponses en phase de H1 et H2, de 0 à Fe/2."
        height={260}
      />
      <CodeCell script={ts4.script} original={SCRIPT_SOURCE} cell="I.5" filename={SCRIPT_NAME} needs={['I.1', 'I.4']} />
    </Predict>
  </article>

  <article>
    <h3 id="q-Hors-fascicule">Hors fascicule : invfreqz</h3>
    <p>
      L'objectif du TP cite <code>invfreqz</code> sans question associée. À partir des {c5.n_freq} points de la réponse en fréquence de H₁, il retrouve les coefficients :
      b = [{est.b1_estime.map((x) => fmt(x, 4)).join(' ')}], a = [{est.a1_estime.map((x) => fmt(x, 4)).join(' ')}] (écart maximal {fmt(est.ecart_invfreqz, 3)}).
    </p>
    <CodeCell script={ts4.script} original={SCRIPT_SOURCE} cell="Hors-fascicule" filename={SCRIPT_NAME} needs={['I.1', 'I.4', 'I.5']} />
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
  .zgrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
    gap: 0 1rem;
  }
  .formula {
    overflow-x: auto;
  }
  article {
    margin-top: 2rem;
  }
</style>
