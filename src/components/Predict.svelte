<script lang="ts">
  /**
   * "Predict first": the learner commits to a number or a choice before the
   * answer is shown. The expected value comes from the engine (current
   * slider values); the attempt is remembered in this browser only.
   */
  import type { Snippet } from 'svelte'
  import { fmt } from '../lib/format'

  interface Props {
    id: string
    prompt: string
    kind: 'number' | 'choice'
    /** expected number (kind = number) */
    expected?: number
    /** relative tolerance for a number (default 5 %) */
    tolerance?: number
    unit?: string
    /** options and the index of the right one (kind = choice) */
    options?: string[]
    correct?: number
    /** what to show once revealed */
    children: Snippet
    /** report mode: no prediction, the answer is always shown */
    always?: boolean
  }
  let { id, prompt, kind, expected = NaN, tolerance = 0.05, unit = '', options = [], correct = 0, children, always = false }: Props = $props()

  const key = `nyq-predict-${id}`
  interface Attempt {
    value: string
    choice: number
    revealed: boolean
  }
  let attempt = $state<Attempt>({ value: '', choice: -1, revealed: false })
  $effect(() => {
    try {
      const saved = localStorage.getItem(key)
      if (saved) attempt = JSON.parse(saved)
    } catch {
      /* no storage: start fresh */
    }
  })
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(attempt))
    } catch {
      /* ignore */
    }
  }
  const parsed = $derived(Number(attempt.value.replace(',', '.').replace(/\s/g, '')))
  const verdict = $derived.by(() => {
    if (!attempt.revealed) return null
    if (kind === 'choice') return attempt.choice < 0 ? 'skip' : attempt.choice === correct ? 'ok' : 'bad'
    if (attempt.value.trim() === '' || !Number.isFinite(parsed)) return 'skip'
    const err = Math.abs(parsed - expected) / Math.max(Math.abs(expected), 1e-12)
    return err <= tolerance ? 'ok' : 'bad'
  })
  function submit(e: SubmitEvent) {
    e.preventDefault()
    attempt.revealed = true
    save()
  }
  function retry() {
    attempt = { value: '', choice: -1, revealed: false }
    save()
  }
  const uid = $props.id()
</script>

{#if always}
  <div class="answer">{@render children()}</div>
{:else}
<section class="predict" aria-labelledby={`${uid}-q`}>
  <form onsubmit={submit} class="no-print">
    <p class="prompt" id={`${uid}-q`}><span class="tag">Prédiction</span> {prompt}</p>
    {#if kind === 'number'}
      <div class="field">
        <label class="visually-hidden" for={`${uid}-v`}>Votre valeur</label>
        <input
          id={`${uid}-v`}
          inputmode="decimal"
          autocomplete="off"
          placeholder="votre valeur"
          bind:value={attempt.value}
          disabled={attempt.revealed}
        />
        {#if unit}<span class="unit">{unit}</span>{/if}
      </div>
    {:else}
      <fieldset disabled={attempt.revealed}>
        <legend class="visually-hidden">{prompt}</legend>
        {#each options as o, i (o)}
          <label class="opt"><input type="radio" name={`${uid}-c`} value={i} bind:group={attempt.choice} /> {o}</label>
        {/each}
      </fieldset>
    {/if}
    {#if !attempt.revealed}
      <div class="row">
        <button class="btn" type="submit">Vérifier</button>
        <button class="btn ghost" type="button" onclick={() => ((attempt.revealed = true), save())}>Voir la réponse</button>
      </div>
    {/if}
  </form>
  {#if attempt.revealed}
    <div class="verdict no-print {verdict}" role="status">
      {#if verdict === 'ok'}
        <strong>Bien vu.</strong>
      {:else if verdict === 'bad'}
        <strong>Pas tout à fait.</strong>
      {/if}
      {#if kind === 'number'}
        Valeur calculée : <strong class="num">{fmt(expected, 4)}{unit ? ` ${unit}` : ''}</strong>{#if verdict !== 'skip' && Number.isFinite(parsed)} (vous : {fmt(parsed, 4)}, tolérance {fmt(tolerance * 100, 2)} %){/if}.
      {:else}
        Réponse : <strong>{options[correct]}</strong>.
      {/if}
      <button type="button" class="linkish" onclick={retry}>Recommencer</button>
    </div>
    <div class="answer">{@render children()}</div>
  {:else}
    <div class="answer print-only">{@render children()}</div>
  {/if}
</section>
{/if}

<style>
  .predict {
    margin: 1rem 0;
  }
  form {
    border: 1px dashed var(--accent);
    border-radius: var(--radius);
    padding: 0.7rem 0.9rem;
    background: var(--surface);
  }
  .prompt {
    margin: 0 0 0.5rem;
    font-weight: 600;
  }
  .field {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  input:not([type='radio']) {
    width: 10rem;
    min-height: 2.75rem;
    padding: 0.3rem 0.6rem;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--bg);
    color: var(--ink);
    font: inherit;
  }
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 1.2rem;
  }
  .opt {
    display: inline-flex;
    gap: 0.45rem;
    align-items: center;
    min-height: 2.75rem;
    cursor: pointer;
  }
  .opt input {
    width: 1.2rem;
    height: 1.2rem;
    accent-color: var(--accent);
  }
  .row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.6rem;
  }
  .unit {
    color: var(--ink-soft);
  }
  .verdict {
    margin-top: 0.6rem;
    padding: 0.5rem 0.8rem;
    border-radius: var(--radius);
    background: var(--surface-2);
  }
  .verdict.ok {
    background: var(--ok-soft);
    color: var(--ok);
  }
  .verdict.bad {
    background: var(--bad-soft);
    color: var(--bad);
  }
  .linkish {
    background: none;
    border: 0;
    color: var(--accent);
    text-decoration: underline;
    font: inherit;
    cursor: pointer;
    min-height: 2.75rem;
  }
  .print-only {
    display: none;
  }
  @media print {
    .print-only {
      display: block;
    }
  }
</style>
