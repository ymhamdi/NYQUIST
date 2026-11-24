<script lang="ts">
  /**
   * Mode DS (Automatique): a generated subject, answered then corrected by the
   * engine, with the full step-by-step correction. The subject number (seed)
   * is in the URL, so a subject can be shared or retried.
   */
  import Derivation from './Derivation.svelte'
  import { grade, KIND_LABEL, makeExercise, type ExerciseKind } from '../exercises/aeExercises'
  import { fmt } from '../lib/format'

  const kinds = Object.keys(KIND_LABEL) as ExerciseKind[]
  let seed = $state(1)
  let kind = $state<ExerciseKind | 'auto'>('auto')
  let answers = $state<Record<string, string>>({})
  let corrected = $state(false)

  $effect(() => {
    const q = new URLSearchParams(location.search)
    const s = Number(q.get('sujet'))
    seed = Number.isInteger(s) && s > 0 ? s : 1 + Math.floor(Math.random() * 99999)
    const k = q.get('type')
    if (k && (kinds as string[]).includes(k)) kind = k as ExerciseKind
  })
  const ex = $derived(makeExercise(seed, kind === 'auto' ? undefined : kind))
  const results = $derived(ex.items.map((it) => grade(it, answers[it.id] ?? null)))
  const score = $derived(results.filter((r) => r === true).length)

  function sync() {
    const url = new URL(location.href)
    url.searchParams.set('sujet', String(seed))
    if (kind === 'auto') url.searchParams.delete('type')
    else url.searchParams.set('type', kind)
    history.replaceState(null, '', url)
  }
  function fresh() {
    seed = 1 + Math.floor(Math.random() * 99999)
    answers = {}
    corrected = false
    sync()
  }
  function onKind(e: Event) {
    kind = (e.currentTarget as HTMLSelectElement).value as ExerciseKind | 'auto'
    answers = {}
    corrected = false
    sync()
  }
  function submit(e: SubmitEvent) {
    e.preventDefault()
    corrected = true
    sync()
  }
</script>

<div class="ds">
  <div class="bar card">
    <label>
      Type de sujet
      <select value={kind} onchange={onKind}>
        <option value="auto">au hasard</option>
        {#each kinds as k (k)}<option value={k}>{KIND_LABEL[k]}</option>{/each}
      </select>
    </label>
    <span class="tag">Sujet n° {seed}</span>
    <button type="button" class="btn ghost" onclick={fresh}>Nouveau sujet</button>
  </div>

  <article class="sujet">
    <h2>{KIND_LABEL[ex.kind]}</h2>
    {#each ex.statement as p (p)}<p>{p}</p>{/each}
    <form onsubmit={submit}>
      <ol>
        {#each ex.items as it, i (it.id)}
          <li>
            <p>{it.prompt}</p>
            {#if it.kind === 'number'}
              <label class="field">
                <span class="visually-hidden">Réponse {i + 1}</span>
                <input inputmode="decimal" autocomplete="off" bind:value={answers[it.id]} disabled={corrected} placeholder="réponse" />
                {#if it.unit}<span class="unit">{it.unit}</span>{/if}
              </label>
            {:else}
              <fieldset disabled={corrected}>
                <legend class="visually-hidden">{it.prompt}</legend>
                {#each it.options ?? [] as o, j (o)}
                  <label class="opt"><input type="radio" name={it.id} value={String(j)} bind:group={answers[it.id]} /> {o}</label>
                {/each}
              </fieldset>
            {/if}
            {#if corrected}
              <p class="res" class:ok={results[i] === true} class:bad={results[i] === false} role="status">
                {results[i] === true ? 'Juste.' : results[i] === false ? 'Faux.' : 'Sans réponse.'}
                Réponse attendue :
                <strong>{it.kind === 'choice' ? it.options?.[it.answer] : `${fmt(it.answer, 5)}${it.unit ? ` ${it.unit}` : ''}`}</strong>
              </p>
            {/if}
          </li>
        {/each}
      </ol>
      {#if !corrected}
        <button class="btn" type="submit">Corriger</button>
      {:else}
        <p class="score"><strong>{score} / {ex.items.length}</strong></p>
      {/if}
    </form>
  </article>

  {#if corrected}
    <Derivation steps={ex.correction} title="Correction détaillée" />
    <button type="button" class="btn" onclick={fresh}>Nouveau sujet</button>
  {/if}
</div>

<style>
  .bar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem 1.2rem;
    align-items: center;
    margin: 1rem 0;
  }
  select {
    display: block;
    min-height: 2.75rem;
    margin-top: 0.2rem;
    padding: 0.3rem 0.5rem;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
  }
  .sujet h2 {
    border: 0;
    margin-top: 1rem;
  }
  ol {
    padding-left: 1.4rem;
  }
  li {
    margin: 0.9rem 0;
  }
  li > p {
    margin: 0.2rem 0;
  }
  .field {
    display: inline-flex;
    gap: 0.5rem;
    align-items: center;
  }
  .field input {
    width: 10rem;
    min-height: 2.75rem;
    padding: 0.3rem 0.6rem;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
    display: flex;
    gap: 1.2rem;
  }
  .opt {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
    min-height: 2.75rem;
  }
  .opt input {
    width: 1.2rem;
    height: 1.2rem;
    accent-color: var(--accent);
  }
  .unit {
    color: var(--ink-soft);
  }
  .res {
    padding: 0.35rem 0.6rem;
    border-radius: var(--radius);
    background: var(--surface-2);
  }
  .res.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .res.bad {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .score {
    font-size: 1.3rem;
  }
</style>
