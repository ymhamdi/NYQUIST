<script lang="ts">
  /** Mode DS, Automatique échantillonnée: the shared player with the Automatique generator. */
  import { KIND_LABEL, makeExercise, type ExerciseKind } from '../exercises/aeExercises'
  import DsPlayer from './DsPlayer.svelte'
</script>

<DsPlayer labels={KIND_LABEL} make={(seed, kind) => makeExercise(seed, kind as ExerciseKind | undefined)} />
