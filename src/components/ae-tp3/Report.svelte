<script lang="ts">
  /** Compte rendu of Automatique TP3 (shared shell + the TP's two parts). */
  import { TP } from '../../content/aeTp3'
  import { SCRIPT_NAME, tp3 } from '../../lib/stores/aeTp3.svelte'
  import ReportShell from '../ReportShell.svelte'
  import PartII from './PartII.svelte'
  import PartIII from './PartIII.svelte'

  interface Props {
    errataBase: string
    tpHref: string
  }
  let { errataBase, tpHref }: Props = $props()

  const LABELS: Record<string, string> = {
    T: "Période d'échantillonnage T, partie II",
    K: 'Gain K, partie II',
    e: 'Consigne e, partie II',
    T_r: "Période d'échantillonnage T, partie III",
    K_r: 'Gain K, partie III',
    consigne: 'Consigne de hauteur, partie III',
    T_liste: 'Périodes comparées (III.3)',
    eps_tol: 'Tolérance sur la hauteur (III.4)',
  }
</script>

<ReportShell
  store={tp3}
  tp={TP}
  scriptName={SCRIPT_NAME}
  labels={LABELS}
  valuesNote="Le fascicule ne donne ni la période d'échantillonnage ni le gain : les valeurs ci-dessous ont été choisies"
  {errataBase}
  {tpHref}
>
  <PartII report {errataBase} />
  <PartIII report {errataBase} />
</ReportShell>
