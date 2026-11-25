<script lang="ts">
  /**
   * "Vers le microcontrôleur" for a PID loop: the controller sampled at Te,
   * the command limited, with or without anti-windup; the digital loop
   * (engine mcu.ts, exactly what the generated C computes) against the
   * continuous loop, then the C code. Every number comes from the engine.
   */
  import type { PidSpec } from '../../engine/codegen'
  import { feedback, pid, series, stepContinuous, type TF } from '../../engine/lti'
  import { discretePid, simulateDigitalLoop, type Limits } from '../../engine/mcu'
  import { linspace, maxOf } from '../../engine/stepinfo'
  import type { Step } from '../../derive/firstOrderLoop'
  import { fmt, pct } from '../../lib/format'
  import { eq, math, mi, mn, mo, row } from '../../lib/mathml'
  import Derivation from '../Derivation.svelte'
  import Plot from '../Plot.svelte'
  import CodeExport from './CodeExport.svelte'

  interface Props {
    /** C identifier prefix */
    name: string
    title: string
    plant: TF
    kp: number
    ki: number
    kd: number
    N: number
    setpoint: number
    duration: number
    /** default sampling period and command limits (not given by the handout) */
    TsDefault: number
    limitsDefault: Limits
    measure: string
    command: string
    unitMeasure: string
    unitCommand: string
    /** why these defaults (French, shown under the settings) */
    note: string
  }
  let p: Props = $props()
  const uid = $props.id()

  // svelte-ignore state_referenced_locally (initial values only: the learner edits them)
  let Ts = $state(p.TsDefault)
  // svelte-ignore state_referenced_locally
  let umin = $state(p.limitsDefault.umin)
  // svelte-ignore state_referenced_locally
  let umax = $state(p.limitsDefault.umax)
  let saturation = $state(true)
  let antiWindup = $state(true)

  const valid = $derived(Ts > 0 && Number.isFinite(Ts) && p.duration / Ts <= 20000 && umax > umin)
  const g = $derived({ kp: p.kp, ki: p.ki, kd: p.kd, N: p.N, Ts })
  const lim = $derived<Limits | null>(saturation ? { umin, umax } : null)
  /** the settings actually used (the default period while the input is invalid) */
  const gEff = $derived(valid ? g : { ...g, Ts: p.TsDefault })
  const n = $derived(Math.floor(p.duration / gEff.Ts) + 1)
  const runAw = $derived(simulateDigitalLoop(p.plant, gEff, p.setpoint, n, lim, true))
  const runNoAw = $derived(saturation ? simulateDigitalLoop(p.plant, gEff, p.setpoint, n, lim, false) : runAw)
  const run = $derived(antiWindup ? runAw : runNoAw)
  const other = $derived(antiWindup ? runNoAw : runAw)
  const tc = $derived(linspace(0, p.duration, 1001))
  const yc = $derived(stepContinuous(feedback(series(pid(p.kp, p.ki, p.kd, 1 / p.N), p.plant), 1), tc, p.setpoint))
  const zd = $derived(discretePid(gEff))
  const overshoot = (y: number[]) => Math.max(0, (maxOf(y) / p.setpoint - 1) * 100)
  /** with and without anti-windup differ only if the command reaches a limit */
  const awMatters = $derived(saturation && runNoAw.y.some((y, i) => Math.abs(y - runAw.y[i]) > 1e-9 * Math.abs(p.setpoint)))
  const satShare = $derived(run.u.filter((u) => saturation && (u >= umax - 1e-12 || u <= umin + 1e-12)).length / run.u.length)

  /** u[n] = Σ b_k e[n−k] − Σ a_k u[n−k] */
  const sig = (s: string, k: number) => row(mi(s), mo('['), mi('n'), ...(k ? [mo('−'), mn(k)] : []), mo(']'))
  const terms = (c: number[], s: string, first: boolean, minus: boolean) =>
    c.flatMap((v, k) => {
      if (minus && k === 0) return []
      const val = minus ? -v : v
      if (Math.abs(val) < 1e-15) return []
      const lead = first && k === (minus ? 1 : 0)
      const sign = val < 0 ? '−' : lead ? '' : '+'
      return [row(...(sign ? [mo(sign)] : []), mn(Math.abs(val), 5), mo('·'), sig(s, k))]
    })
  const diffEq = $derived(math(eq(sig('u', 0), row(...terms(zd.b, 'e', true, false), ...terms(zd.a, 'u', false, true))), { display: true }))

  const steps = $derived<Step[]>([
    {
      text: `Le microcontrôleur calcule la commande une fois par période Te = ${fmt(gEff.Ts, 4)} s. Intégrale par Euler arrière : I[n] = I[n−1] + ki·Te·e[n] ; dérivée filtrée comme dans le bloc PID Controller (N = ${fmt(p.N, 4)}) : D[n] = (D[n−1] + kd·N·(e[n] − e[n−1]))/(1 + N·Te).`,
    },
    { text: 'Sans saturation, ces deux récurrences donnent une seule équation aux différences, celle que le code exécute :', math: diffEq },
    saturation
      ? {
          text: `La commande réelle est limitée entre ${fmt(umin, 4)} et ${fmt(umax, 4)} ${p.unitCommand} : elle est en butée pendant ${pct(satShare * 100, 3)} des périodes. ${
            satShare === 0
              ? "Elle ne touche jamais les bornes : l'anti-windup n'intervient pas. Resserrez les bornes pour voir son effet."
              : `Sans anti-windup, l'intégrale continue de grossir pendant la butée et la ${p.measure} dépasse la consigne de ${pct(overshoot(runNoAw.y), 3)} ; avec l'anti-windup (on n'intègre pas quand l'écart pousse vers la butée), le dépassement est de ${pct(overshoot(runAw.y), 3)}.${antiWindup ? '' : " Le code ci-dessous est sans anti-windup (case décochée)."}`
          }`,
        }
      : { text: 'Sans saturation, la commande peut prendre n’importe quelle valeur : ce n’est pas réaliste pour un actionneur.' },
  ])
  const spec = $derived<PidSpec>({
    kind: 'pid',
    name: p.name,
    title: p.title,
    gains: valid ? g : { ...g, Ts: p.TsDefault },
    limits: lim,
    antiWindup: saturation && antiWindup,
    setpoint: p.setpoint,
    measure: `${p.measure} (${p.unitMeasure})`,
    command: `${p.command} (${p.unitCommand})`,
  })
  const tSample = $derived(run.t)
</script>

<div class="mcu">
  <p>
    Sur une carte, le PID devient un calcul fait à chaque période d'échantillonnage, et la commande est bornée par l'actionneur. Réglez la période et les
    bornes : la courbe en points est exactement ce que calcule le code C ci-dessous.
  </p>
  <div class="card params" role="group" aria-label="Réglages du code embarqué">
    <div class="grid">
      <label class="field">
        <span>Période Te ({fmt(1 / Ts, 4)} Hz)</span>
        <span class="in"><input type="number" step="any" min="0" bind:value={Ts} aria-describedby={`${uid}-note`} /> s</span>
      </label>
      <label class="field check"><input type="checkbox" bind:checked={saturation} /> Saturation de la commande</label>
      {#if saturation}
        <label class="field"><span>Commande minimale</span><span class="in"><input type="number" step="any" bind:value={umin} /> {p.unitCommand}</span></label>
        <label class="field"><span>Commande maximale</span><span class="in"><input type="number" step="any" bind:value={umax} /> {p.unitCommand}</span></label>
        <label class="field check"><input type="checkbox" bind:checked={antiWindup} /> Anti-windup</label>
      {/if}
    </div>
    <p class="muted" id={`${uid}-note`}>{p.note}</p>
    {#if !valid}<p class="warn" role="alert">Période ou bornes invalides : les courbes et le code gardent Te = {fmt(p.TsDefault, 4)} s.</p>{/if}
  </div>

  <Derivation steps={steps} title="Du PID continu au code embarqué" />

  <Plot
    series={[
      { x: tc, y: yc, label: 'PID continu (sans saturation)', color: 4, dashed: true },
      ...(awMatters ? [{ x: tSample, y: other.y, label: antiWindup ? 'code, sans anti-windup' : 'code, avec anti-windup', color: 2, kind: 'points' as const }] : []),
      { x: tSample, y: run.y, label: saturation ? (antiWindup ? 'code, avec anti-windup' : 'code, sans anti-windup') : 'code embarqué', color: 1, kind: 'points' as const },
    ]}
    xLabel="t (s)"
    yLabel={`${p.measure} (${p.unitMeasure})`}
    hRules={[{ at: p.setpoint, label: 'consigne', color: 4 }]}
    summary={`Boucle avec le code embarqué, Te = ${fmt(gEff.Ts, 3)} s : dépassement ${pct(overshoot(run.y), 3)}, valeur finale ${fmt(run.y.at(-1)!, 4)} ${p.unitMeasure}.`}
    height={280}
  />
  <Plot
    series={[{ x: tSample, y: run.u, label: 'commande u[n]', color: 3, kind: 'stairs' }]}
    xLabel="t (s)"
    yLabel={`${p.command} (${p.unitCommand})`}
    hRules={saturation ? [{ at: umax, label: 'max', color: 2 }, { at: umin, label: 'min', color: 2 }] : []}
    summary={`Commande calculée par le code, ${saturation ? `bornée entre ${fmt(umin, 3)} et ${fmt(umax, 3)}` : 'sans borne'}.`}
    height={220}
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
  .warn {
    color: var(--bad);
  }
</style>
