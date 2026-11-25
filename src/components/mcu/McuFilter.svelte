<script lang="ts">
  /**
   * "Vers le microcontrôleur" for a digital filter: the difference equation,
   * floating or fixed point (int16 coefficients), what quantization does to
   * the poles and to the frequency response, then the C code. Every number
   * comes from the engine.
   */
  import type { FilterSpec } from '../../engine/codegen'
  import { freqz } from '../../engine/dsp'
  import { normalize, poleModuli, qIntBits, quantize } from '../../engine/mcu'
  import type { Step } from '../../derive/firstOrderLoop'
  import { fmt, superscript } from '../../lib/format'
  import { eq, math, mi, mn, mo, row } from '../../lib/mathml'
  import Derivation from '../Derivation.svelte'
  import Plot from '../Plot.svelte'
  import CodeExport from './CodeExport.svelte'

  interface Props {
    name: string
    title: string
    /** powers of z⁻¹ */
    b: number[]
    a: number[]
    FeDefault: number
    note: string
  }
  let p: Props = $props()
  const uid = $props.id()

  // svelte-ignore state_referenced_locally (initial value only)
  let Fe = $state(p.FeDefault)
  let fixed = $state(false)
  const nz = $derived(normalize(p.b, p.a))
  const m = $derived(qIntBits([...nz.b, ...nz.a]))
  // svelte-ignore state_referenced_locally
  let frac = $state(15 - qIntBits([...normalize(p.b, p.a).b, ...normalize(p.b, p.a).a]))
  const fracOk = $derived(Math.min(frac, 15 - m))
  const qb = $derived(quantize(nz.b, fracOk))
  const qa = $derived(quantize(nz.a, fracOk))
  const rFloat = $derived(poleModuli(nz.a))
  const rFixed = $derived(poleModuli(qa.values))
  const valid = $derived(Fe > 0 && Number.isFinite(Fe) && Fe <= 1e6)
  const L = 512
  const hf = $derived(freqz(nz.b, nz.a, L, valid ? Fe : p.FeDefault))
  const hq = $derived(freqz(qb.values, qa.values, L, valid ? Fe : p.FeDefault))
  const dB = (H: { re: number; im: number }[]) => H.map((h) => 20 * Math.log10(Math.max(Math.hypot(h.re, h.im), 1e-12)))

  const sig = (s: string, k: number) => row(mi(s), mo('['), mi('n'), ...(k ? [mo('−'), mn(k)] : []), mo(']'))
  const diffEq = $derived(
    math(
      eq(
        sig('y', 0),
        row(
          ...nz.b.flatMap((v, k) => (v === 0 ? [] : [row(...(v < 0 ? [mo('−')] : k ? [mo('+')] : []), mn(Math.abs(v), 5), mo('·'), sig('x', k))])),
          ...nz.a.slice(1).flatMap((v, j) => (v === 0 ? [] : [row(mo(v > 0 ? '−' : '+'), mn(Math.abs(v), 5), mo('·'), sig('y', j + 1))])),
        ),
      ),
      { display: true },
    ),
  )
  const stableF = $derived(rFloat.every((r) => r < 1))
  const stableQ = $derived(rFixed.every((r) => r < 1))
  const steps = $derived<Step[]>([
    { text: `À chaque échantillon (Fe = ${fmt(valid ? Fe : p.FeDefault, 5)} Hz), le microcontrôleur calcule :`, math: diffEq },
    {
      text: fixed
        ? `Virgule fixe : chaque coefficient devient un entier sur 16 bits, au format Q${15 - fracOk}.${fracOk} (valeur = entier / 2${superscript(fracOk)}, pas ${fmt(2 ** -fracOk, 3)}). Il faut ${m} bit${m > 1 ? 's' : ''} de partie entière pour représenter le plus grand coefficient (${fmt(Math.max(...[...nz.b, ...nz.a].map(Math.abs)), 4)}).`
        : `Virgule flottante (float, 32 bits) : les coefficients sont gardés presque exactement ; c'est simple, mais lent sur un petit microcontrôleur sans unité de calcul flottant (Arduino Uno).`,
    },
    ...(fixed
      ? [
          {
            text: `Arrondir les coefficients déplace les pôles : module ${rFloat.map((r) => fmt(r, 5)).join(' ; ')} en exact, ${rFixed.map((r) => fmt(r, 5)).join(' ; ')} après quantification. ${
              stableQ ? 'Le filtre quantifié reste stable.' : stableF ? 'Avec si peu de bits, un pôle sort du cercle unité : le filtre quantifié est instable.' : 'Le filtre est déjà instable avant quantification.'
            } C'est la quantification du signal vue en cours, appliquée aux coefficients.`,
          },
        ]
      : []),
  ])
  const spec = $derived<FilterSpec>({ kind: 'filter', name: p.name, title: p.title, b: nz.b, a: nz.a, Fe: valid ? Fe : p.FeDefault, frac: fixed ? fracOk : null })
</script>

<div class="mcu">
  <p>
    Sur une carte, le filtre devient une équation aux différences calculée à chaque échantillon. En virgule fixe, les coefficients sont arrondis : réglez le
    nombre de bits pour voir ce que cela change.
  </p>
  <div class="card params" role="group" aria-label="Réglages du filtre embarqué">
    <div class="grid">
      <label class="field">
        <span>Fréquence d'échantillonnage Fe</span>
        <span class="in"><input type="number" step="any" min="0" bind:value={Fe} aria-describedby={`${uid}-note`} /> Hz</span>
      </label>
      <label class="field check"><input type="checkbox" bind:checked={fixed} /> Virgule fixe (int16)</label>
      {#if fixed}
        <label class="field">
          <span>Bits fractionnaires : {fracOk} (Q{15 - fracOk}.{fracOk})</span>
          <input type="range" min="2" max={15 - m} step="1" bind:value={frac} />
        </label>
      {/if}
    </div>
    <p class="muted" id={`${uid}-note`}>{p.note}</p>
    {#if !valid}<p class="warn" role="alert">Fréquence invalide : les courbes et le code gardent Fe = {fmt(p.FeDefault, 5)} Hz.</p>{/if}
    {#if !stableF}<p class="warn" role="alert">Ce filtre est instable : ne pas le programmer tel quel (voir l'errata).</p>{/if}
  </div>

  <Derivation steps={steps} title="Du filtre au code embarqué" />

  {#if fixed}
    <table class="cmp num">
      <caption class="visually-hidden">Coefficients exacts et quantifiés</caption>
      <thead><tr><th>coefficient</th><th>exact</th><th>entier (int16)</th><th>valeur codée</th></tr></thead>
      <tbody>
        {#each nz.b as v, k (k)}<tr><td>b{k}</td><td>{fmt(v, 6)}</td><td>{qb.ints[k]}</td><td>{fmt(qb.values[k], 6)}</td></tr>{/each}
        {#each nz.a as v, k (k)}<tr><td>a{k}</td><td>{fmt(v, 6)}</td><td>{qa.ints[k]}</td><td>{fmt(qa.values[k], 6)}</td></tr>{/each}
      </tbody>
    </table>
  {/if}

  <Plot
    series={[
      { x: hf.f, y: dB(hf.H), label: 'coefficients exacts', color: 1 },
      ...(fixed ? [{ x: hq.f, y: dB(hq.H), label: `Q${15 - fracOk}.${fracOk}`, color: 2, dashed: true }] : []),
    ]}
    xLabel="f (Hz)"
    yLabel="|H| (dB)"
    summary={`Réponse en amplitude du filtre embarqué, de 0 à Fe/2 = ${fmt((valid ? Fe : p.FeDefault) / 2, 4)} Hz${fixed ? `, exacte et avec ${fracOk} bits fractionnaires` : ''}.`}
    height={260}
  />

  <CodeExport {spec} />
</div>

<style>
  .params {
    margin: 1rem 0;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
    gap: 0.6rem 1.2rem;
    align-items: end;
  }
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-weight: 600;
  }
  .field.check {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    min-height: 2.75rem;
  }
  .check input {
    width: 1.2rem;
    height: 1.2rem;
    accent-color: var(--accent);
  }
  .in {
    display: flex;
    gap: 0.4rem;
    align-items: center;
    font-weight: 400;
  }
  .in input {
    width: 100%;
    min-width: 0;
    min-height: 2.75rem;
    padding: 0.3rem 0.5rem;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
  }
  input[type='range'] {
    width: 100%;
    min-height: 2.75rem;
    accent-color: var(--accent);
  }
  .warn {
    color: var(--bad);
  }
  .cmp {
    display: block;
    overflow-x: auto;
    margin: 0.6rem 0;
  }
</style>
