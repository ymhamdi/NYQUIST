<script lang="ts">
  /**
   * Effect of each PID gain, read on the engine's sweeps (smallest to largest
   * value): overshoot → stability, settling time → speed, |static error| → precision.
   */
  import { fmt } from '../lib/format'

  interface Row {
    gain: string
    /** first and last rows of the sweep: [overshoot %, settling time, static error] */
    first: number[]
    last: number[]
    range: string
  }
  interface Props {
    rows: Row[]
  }
  let { rows }: Props = $props()

  const stab = (a: number, b: number) => (!Number.isFinite(b) ? 'se dégrade (instable)' : b - a > 0.3 ? `se dégrade (D : ${fmt(a, 3)} → ${fmt(b, 3)} %)` : a - b > 0.3 ? `s'améliore (D : ${fmt(a, 3)} → ${fmt(b, 3)} %)` : `peu d'effet (D ≈ ${fmt(b, 3)} %)`)
  const speed = (a: number, b: number) => (!Number.isFinite(a) || !Number.isFinite(b) ? '—' : b < 0.9 * a ? `plus rapide (${fmt(a, 3)} → ${fmt(b, 3)} s)` : b > 1.1 * a ? `plus lent (${fmt(a, 3)} → ${fmt(b, 3)} s)` : `peu d'effet (≈ ${fmt(b, 3)} s)`)
  const prec = (a: number, b: number) => {
    const A = Math.abs(a)
    const B = Math.abs(b)
    if (A < 1e-9 && B < 1e-9) return 'erreur nulle (intégrateur)'
    return B < 0.9 * A ? `meilleure (${fmt(A, 3)} → ${fmt(B, 3)})` : B > 1.1 * A ? `moins bonne (${fmt(A, 3)} → ${fmt(B, 3)})` : `peu d'effet (≈ ${fmt(B, 3)})`
  }
</script>

<table class="eff">
  <thead><tr><th>Gain qui augmente</th><th>Stabilité</th><th>Rapidité</th><th>Précision</th></tr></thead>
  <tbody>
    {#each rows as r (r.gain)}
      <tr>
        <th scope="row">{r.gain} <span class="muted">({r.range})</span></th>
        <td>{stab(r.first[0], r.last[0])}</td>
        <td>{speed(r.first[1], r.last[1])}</td>
        <td>{prec(r.first[2], r.last[2])}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .eff {
    display: block;
    overflow-x: auto;
    margin: 0.6rem 0;
    font-size: 0.95rem;
  }
  .eff tbody th {
    font-weight: 600;
    white-space: nowrap;
  }
</style>
