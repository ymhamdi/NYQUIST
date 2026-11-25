<script lang="ts">
  /** Mode DS, Traitement du signal: the shared player with the signal generator. */
  import { KIND_LABEL, makeExercise, type ExerciseKind } from '../exercises/tsExercises'
  import DsPlayer from './DsPlayer.svelte'
</script>

<DsPlayer labels={KIND_LABEL} make={(seed, kind) => makeExercise(seed, kind as ExerciseKind | undefined)} />
