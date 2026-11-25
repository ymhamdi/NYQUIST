<script lang="ts">
  /** Compte rendu of Traitement du signal TP4 (shared shell + the TP's questions). */
  import { TP } from '../../content/tsTp4'
  import { SCRIPT_NAME, ts4 } from '../../lib/stores/tsTp4.svelte'
  import ReportShell from '../ReportShell.svelte'
  import PartI from './PartI.svelte'
  import PartII from './PartII.svelte'

  interface Props {
    errataBase: string
    tpHref: string
  }
  let { errataBase, tpHref }: Props = $props()
  const LABELS: Record<string, string> = {
    n_imp: 'Échantillons de h[n] calculés (I.4)',
    n_freq: 'Points de fréquence de freqz (I.5)',
    utiliser_imprime: 'Dénominateur imprimé (1) ou corrigé (0) (partie II)',
  }
</script>

<ReportShell store={ts4} tp={TP} scriptName={SCRIPT_NAME} labels={LABELS} valuesNote="L'énoncé ne fixe pas ces nombres de points, et son dénominateur de la partie II est instable : les choix faits sont indiqués ci-dessous" {errataBase} {tpHref}>
  <PartI report {errataBase} />
  <PartII report {errataBase} />
</ReportShell>
