<script lang="ts">
  /** Before/after table of stepinfo results (MATLAB R2021a+ definitions), with the static error. */
  import type { StepInfo } from '../engine/stepinfo'
  import { fmt } from '../lib/format'

  interface Props {
    before: StepInfo
    after: StepInfo
    before5: StepInfo
    after5: StepInfo
    errBefore: number
    errAfter: number
    unit: string
    errataBase: string
  }
  let { before, after, before5, after5, errBefore, errAfter, unit, errataBase }: Props = $props()
  const t = (v: number) => (Number.isFinite(v) ? `${fmt(v, 4)} s` : '—')
  const rows = $derived([
    { label: 'Erreur statique', a: `${fmt(errBefore, 4)} ${unit}`, b: `${fmt(errAfter, 4)} ${unit}` },
    { label: 'Temps de réponse à 2 % (SettlingTime)', a: t(before.SettlingTime), b: t(after.SettlingTime) },
    { label: 'Temps de réponse à 5 %', a: t(before5.SettlingTime), b: t(after5.SettlingTime) },
    { label: 'Temps de montée 10 → 90 % (RiseTime)', a: t(before.RiseTime), b: t(after.RiseTime) },
    { label: 'Dépassement (Overshoot)', a: `${fmt(before.Overshoot, 3)} %`, b: `${fmt(after.Overshoot, 3)} %` },
    { label: 'Temps de réponse, définition MATLAB ≤ R2020b (TransientTime)', a: t(before.TransientTime), b: t(after.TransientTime) },
  ])
</script>

<table class="si num">
  <thead><tr><th></th><th>sans PID</th><th>avec PID</th></tr></thead>
  <tbody>
    {#each rows as r (r.label)}<tr><th scope="row">{r.label}</th><td>{r.a}</td><td>{r.b}</td></tr>{/each}
  </tbody>
</table>
<p class="muted small">
  Définitions de <code>stepinfo</code> depuis MATLAB R2021a : temps de réponse quand |y − y∞| reste sous 2 % de |y∞ − y₀|. Avant R2021a, la bande était
  mesurée par rapport à l'écart maximal (dernière ligne) : <a href={`${errataBase}#E-AE11`}>errata E-AE11</a>.
</p>

<style>
  .si {
    display: block;
    overflow-x: auto;
    margin: 0.6rem 0;
  }
  .si tbody th {
    font-weight: 500;
  }
  .small {
    font-size: 0.85rem;
  }
</style>
