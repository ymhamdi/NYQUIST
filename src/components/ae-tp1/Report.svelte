<script lang="ts">
  /** Compte rendu of Automatique TP1 (shared shell + the TP's part). */
  import { TP } from '../../content/aeTp1'
  import { SCRIPT_NAME, tp1 } from '../../lib/stores/aeTp1.svelte'
  import ReportShell from '../ReportShell.svelte'
  import PartIII from './PartIII.svelte'

  interface Props {
    errataBase: string
    tpHref: string
  }
  let { errataBase, tpHref }: Props = $props()
  const LABELS: Record<string, string> = { t_step: 'Instant du saut du bloc Step', Uf: 'Valeur finale du bloc Step', Uf_liste: 'Valeurs finales comparées (III.2)' }
</script>

<ReportShell store={tp1} tp={TP} scriptName={SCRIPT_NAME} labels={LABELS} valuesNote="Valeurs du bloc Step (réglages par défaut de Simulink, sauf modification)" {errataBase} {tpHref}>
  <PartIII report {errataBase} />
</ReportShell>
