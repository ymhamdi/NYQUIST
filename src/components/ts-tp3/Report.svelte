<script lang="ts">
  /** Compte rendu of Traitement du signal TP3 (shared shell + the TP's questions). */
  import { TP } from '../../content/tsTp3'
  import { SCRIPT_NAME, ts3 } from '../../lib/stores/tsTp3.svelte'
  import ReportShell from '../ReportShell.svelte'
  import PartA from './PartA.svelte'
  import PartB from './PartB.svelte'

  interface Props {
    errataBase: string
    tpHref: string
  }
  let { errataBase, tpHref }: Props = $props()
  const LABELS: Record<string, string> = { tmax: "Temps d'acquisition tmax (Q1-Q8)", inclure_tmax: 'Point t = tmax inclus (1) ou non (0)', tmax_liste: 'Durées comparées (Q10)' }
</script>

<ReportShell store={ts3} tp={TP} scriptName={SCRIPT_NAME} labels={LABELS} valuesNote="« Sur une durée tmax » se lit de deux façons (N ou N + 1 points) : le choix fait est indiqué ci-dessous" {errataBase} {tpHref}>
  <PartA report {errataBase} />
  <PartB report {errataBase} />
</ReportShell>
