<script lang="ts">
  /** Compte rendu of Automatique TP4 (shared shell + the TP's parts). */
  import { TP } from '../../content/aeTp4'
  import { SCRIPT_NAME, tp4 } from '../../lib/stores/aeTp4.svelte'
  import ReportShell from '../ReportShell.svelte'
  import PartIII from './PartIII.svelte'
  import PartIV from './PartIV.svelte'

  interface Props {
    errataBase: string
    tpHref: string
  }
  let { errataBase, tpHref }: Props = $props()

  const LABELS: Record<string, string> = {
    consigne: 'Consigne de hauteur (III)',
    kp: 'kp, réservoir',
    ki: 'ki, réservoir',
    kd: 'kd, réservoir',
    N_filtre: 'Filtre de dérivée N (bloc PID Controller)',
    kp_liste: 'kp comparés (III.2)',
    ki_liste: 'ki comparés (III.2)',
    kd_liste: 'kd comparés (III.2)',
    L: 'Inductance L du moteur',
    U: 'Consigne de vitesse U (IV)',
    Cr: 'Couple résistant cr',
    t_cr: "Instant d'application de cr",
    kp_m: 'kp, moteur',
    ki_m: 'ki, moteur',
    kd_m: 'kd, moteur',
    kpm_liste: 'kp comparés (IV.6)',
    kim_liste: 'ki comparés (IV.6)',
    kdm_liste: 'kd comparés (IV.6)',
  }
</script>

<ReportShell
  store={tp4}
  tp={TP}
  scriptName={SCRIPT_NAME}
  labels={LABELS}
  valuesNote="Le fascicule ne définit pas la « réponse désirée » et donne deux inductances pour le même moteur : les réglages ci-dessous ont été choisis"
  {errataBase}
  {tpHref}
>
  <PartIII report {errataBase} />
  <PartIV report {errataBase} />
</ReportShell>
