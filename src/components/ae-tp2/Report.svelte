<script lang="ts">
  /** Compte rendu of Automatique TP2 (shared shell + the TP's parts). */
  import { TP } from '../../content/aeTp2'
  import { SCRIPT_NAME, tp2 } from '../../lib/stores/aeTp2.svelte'
  import ReportShell from '../ReportShell.svelte'
  import PartII from './PartII.svelte'
  import PartIII from './PartIII.svelte'
  import PartIV from './PartIV.svelte'

  interface Props {
    errataBase: string
    tpHref: string
  }
  let { errataBase, tpHref }: Props = $props()
  const LABELS: Record<string, string> = {
    T_sin: "Période d'échantillonnage de la sinusoïde (II)",
    T_liste: 'Périodes comparées (II.2)',
    T: "Période d'échantillonnage de G(s) (III)",
    L: 'Inductance L du moteur',
    U: "Tension d'alimentation U",
    Cr: 'Couple résistant Cr',
    T_m: "Période d'échantillonnage du moteur (IV)",
  }
</script>

<ReportShell store={tp2} tp={TP} scriptName={SCRIPT_NAME} labels={LABELS} valuesNote="Le fascicule ne donne aucune période d'échantillonnage ni le couple résistant : les valeurs ci-dessous ont été choisies" {errataBase} {tpHref}>
  <PartII report {errataBase} />
  <PartIII report {errataBase} />
  <PartIV report {errataBase} />
</ReportShell>
