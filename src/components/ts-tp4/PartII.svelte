<script lang="ts">
  /** Traitement du signal TP4, partie II: the second-order low-pass IIR filter. Every number comes from the engine. */
  import type { Complex } from '../../engine/complex'
  import { INTRO_II, question } from '../../content/tsTp4'
  import { stabilityFromPoles } from '../../derive/signal'
  import { fmt } from '../../lib/format'
  import { SCRIPT_NAME, SCRIPT_SOURCE, ts4 } from '../../lib/stores/tsTp4.svelte'
  import CodeCell from '../CodeCell.svelte'
  import Derivation from '../Derivation.svelte'
  import ParamSlider from '../ParamSlider.svelte'
  import Plot from '../Plot.svelte'
  import Predict from '../Predict.svelte'
  import QuestionHead from '../QuestionHead.svelte'
  import ZPlane from '../ZPlane.svelte'
  import McuFilter from '../mcu/McuFilter.svelte'
  import { MCU_DEFAULTS } from '../../content/mcu'

  interface Props {
    report?: boolean
    errataBase: string
  }
  let { report = false, errataBase }: Props = $props()
  const v = ts4.values
  $effect(() => ts4.restore())
  const spec = (n: string) => ts4.specs.find((s) => s.name === n)!
  const r = $derived(ts4.result)
  const c1 = $derived(r['II.1'])
  const c2 = $derived(r['II.2'])
  const c3 = $derived(r['II.3'])
  const imprime = $derived(c1.utiliser_imprime === 1)
  const ordre = $derived(c1.a.length - 1)
  const stableImprime = $derived(c1.module_poles_imprime.every((m) => m < 1))

  const sum = (c: number[]) => c.reduce((s, x) => s + x, 0)
  const cx = (z: Complex) => (Math.abs(z.im) < 1e-9 ? fmt(z.re, 4) : `${fmt(z.re, 4)} ${z.im < 0 ? '−' : '+'} ${fmt(Math.abs(z.im), 4)}j`)
  const wPi = $derived(c2.w.map((w) => w / Math.PI))
  const phase = $derived(c2.H.re.map((x, i) => Math.atan2(c2.H.im[i], x)))
  const minus3 = $derived(20 * Math.log10(c2.gain_continu / Math.SQRT2))
  /** both zeros of b at the same point (b is a perfect square) */
  const zeroDouble = $derived(c3.zeros_rii.length === 2 && Math.hypot(c3.zeros_rii[0].re - c3.zeros_rii[1].re, c3.zeros_rii[0].im - c3.zeros_rii[1].im) < 1e-6)
  const zeroAt = $derived(c3.zeros_rii[0])
</script>

<section aria-labelledby="partie-II">
  <h2 id="partie-II">II. Filtre passe-bas RII</h2>
  <div class="statement">
    <p><q>{INTRO_II}</q></p>
    <p class="muted">Énoncé transcrit, non vérifié sur le fascicule original.</p>
  </div>
  <p class="note">
    Avec ce dénominateur, les pôles ont un module {fmt(c1.module_poles_imprime[0], 4)} : le filtre est instable, qu'on lise les coefficients en z ou en z⁻¹. C'est le
    polynôme [{c1.a_corrige.map((x) => fmt(x, 4)).join(' ')}] écrit à l'envers ; inverser l'ordre des coefficients inverse les pôles (module
    {fmt(c1.module_poles_corrige[0], 4)}). Le site utilise la version stable par défaut (<a href={`${errataBase}#E-TS8`}>errata E-TS8</a>).
  </p>
  {#if !report}
    <div class="card params no-print" role="group" aria-label="Réglages de la partie II">
      <div class="grid">
        <ParamSlider
          spec={spec('utiliser_imprime')}
          values={v}
          label="Dénominateur du filtre"
          choiceLabels={[`corrigé [${c1.a_corrige.map((x) => fmt(x, 4)).join(' ')}] (stable)`, `imprimé [${c1.a_imprime.map((x) => fmt(x, 4)).join(' ')}] (instable)`]}
          errata={`${errataBase}#E-TS8`}
        />
      </div>
    </div>
  {:else}
    <p class="card">Dénominateur utilisé : {imprime ? 'tel qu’imprimé (instable)' : 'corrigé (stable)'}, a = [{c1.a.map((x) => fmt(x, 4)).join(' ')}].</p>
  {/if}

  <article>
    <QuestionHead q={question('II.1')} part="II" />
    <p class="note">
      « L'ordre du filtre N = {c1.N} » : {c1.N} est le nombre d'échantillons de h[n] calculés par impz ; le filtre est d'ordre {ordre} (<a href={`${errataBase}#E-TS9`}
        >errata E-TS9</a
      >).
    </p>
    <Predict always={report} id="ts4-II1" kind="choice" prompt="Avec le dénominateur tel qu'imprimé, h[n] tend-il vers 0 ?" options={['oui', 'non, il diverge']} correct={stableImprime ? 0 : 1}>
      <Derivation steps={[...stabilityFromPoles('Dénominateur imprimé', c1.module_poles_imprime), ...stabilityFromPoles('Dénominateur corrigé', c1.module_poles_corrige)]} />
      <Plot
        series={[{ x: c1.h.map((_, k) => k), y: c1.h, kind: 'stem', label: 'h[n]', color: imprime ? 2 : 1 }]}
        xLabel="n"
        yLabel="h[n]"
        summary={`Réponse impulsionnelle sur ${c1.N} échantillons, dénominateur ${imprime ? 'imprimé : elle diverge' : 'corrigé : elle tend vers 0'}.`}
        height={260}
      />
      <CodeCell script={ts4.script} original={SCRIPT_SOURCE} cell="II.1" filename={SCRIPT_NAME} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('II.2')} part="II" />
    <Predict always={report} id="ts4-II2" kind="number" prompt="Quel est le gain continu |H(1)| du filtre ?" expected={c2.gain_continu} tolerance={0.01}>
      <p>
        En ω = 0, z = 1 : H(1) = Σb / Σa = {fmt(sum(c1.b), 4)} / {fmt(sum(c1.a), 4)} = {fmt(c2.gain_continu, 4)}, soit {fmt(20 * Math.log10(c2.gain_continu), 3)} dB. Le gain
        culmine à {fmt(c2.gain_max, 4)} ({fmt(20 * Math.log10(c2.gain_max), 3)} dB) en ω = {fmt(c2.w_resonance, 3)}π, puis passe sous {fmt(minus3, 3)} dB en ω =
        {fmt(c2.w_coupure, 3)}π (fréquence de coupure à −3 dB). {imprime
          ? 'Avec le dénominateur imprimé, le filtre est instable : cette courbe ne décrit aucun régime permanent.'
          : 'Les basses fréquences passent, les hautes sont atténuées : passe-bas.'}
      </p>
      <Plot
        series={[{ x: wPi, y: c2.gain_dB, label: '|H| (dB)', color: 1 }]}
        xLabel="ω / π"
        yLabel="|H| (dB)"
        hRules={[{ at: minus3, label: `${fmt(minus3, 3)} dB`, color: 4 }]}
        vRules={Number.isFinite(c2.w_coupure) ? [{ at: c2.w_coupure, label: `${fmt(c2.w_coupure, 3)}π`, color: 4 }] : []}
        summary={`Réponse en amplitude sur ${c2.L} points : ${fmt(20 * Math.log10(c2.gain_continu), 3)} dB en continu, coupure à ${fmt(c2.w_coupure, 3)}π.`}
        height={260}
      />
      <Plot series={[{ x: wPi, y: phase, label: 'phase (rad)', color: 2 }]} xLabel="ω / π" yLabel="phase (rad)" summary="Réponse en phase du filtre RII, de 0 à π." height={240} />
      <CodeCell script={ts4.script} original={SCRIPT_SOURCE} cell="II.2" filename={SCRIPT_NAME} needs={['II.1']} />
    </Predict>
  </article>

  <article>
    <QuestionHead q={question('II.3')} part="II" />
    <Predict
      always={report}
      id="ts4-II3"
      kind="choice"
      prompt="Où sont les zéros du filtre ?"
      options={[`un zéro double en z = ${fmt(zeroAt.re, 3)}`, 'deux zéros distincts dans le cercle', 'aucun zéro fini']}
      correct={zeroDouble ? 0 : 1}
    >
      <p>
        Le numérateur [{c1.b.map((x) => fmt(x, 4)).join(' ')}] {zeroDouble ? `est un carré parfait : zéro double en z = ${cx(zeroAt)}` : `a deux zéros distincts : z = ${c3.zeros_rii.map(cx).join(' ; ')}`}. Le point
        z = −1 correspond à ω = π (Fe/2) : le gain y est nul, c'est bien un passe-bas. Pôles : {c3.poles_rii.map(cx).join(' ; ')}, de module
        {c3.module_poles_rii.map((m) => fmt(m, 4)).join(' ; ')}.
      </p>
      <ZPlane
        title="Filtre RII"
        poles={c3.poles_rii}
        zeros={c3.zeros_rii}
        summary={`Zéros en ${c3.zeros_rii.map(cx).join(' et ')} ; pôles de module ${fmt(c3.module_poles_rii[0], 4)}, ${c3.module_poles_rii.every((m) => m < 1) ? 'dans' : 'hors du'} cercle unité.`}
      />
      <CodeCell script={ts4.script} original={SCRIPT_SOURCE} cell="II.3" filename={SCRIPT_NAME} needs={['II.1']} />
    </Predict>
  </article>

  {#if !report}
    <article class="no-print">
      <h3 id="mcu-rii">Vers le microcontrôleur</h3>
      <McuFilter
        name="filtre_rii"
        title="Filtre passe-bas RII du second ordre (TP4, partie II)"
        b={c1.b}
        a={c1.a}
        FeDefault={MCU_DEFAULTS.filtreFe}
        note={`La fréquence d'échantillonnage n'est pas donnée : ${fmt(MCU_DEFAULTS.filtreFe)} Hz par défaut (errata E-TS11). Elle ne change que l'axe des fréquences et le réglage du timer.`}
      />
    </article>
  {/if}
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
