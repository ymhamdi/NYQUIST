<script lang="ts">
  /**
   * One tunable value of the TP script (@param line): a range slider plus a
   * number field, or radio buttons for a set of choices. The script's
   * default is shown, and an errata link explains values the handout omits.
   */
  import type { ParamSpec } from '../engine/matlabScript'
  import { fmt } from '../lib/format'

  interface Props {
    spec: ParamSpec
    values: Record<string, number | number[]>
    label: string
    /** what the choices mean, in the same order as spec.choices */
    choiceLabels?: string[]
    errata?: string
    /** short note under the control */
    hint?: string
  }
  let { spec, values, label, choiceLabels, errata, hint }: Props = $props()
  const id = `p-${spec.name}`
  const step = spec.range?.step ?? niceStep(spec.range?.min ?? 0, spec.range?.max ?? 1)

  function niceStep(min: number, max: number): number {
    const raw = (max - min) / 200
    const p = 10 ** Math.floor(Math.log10(raw))
    return [1, 2, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? raw
  }
  function set(v: number) {
    if (!Number.isFinite(v)) return
    if (spec.range) v = Math.min(spec.range.max, Math.max(spec.range.min, v))
    values[spec.name] = Number(v.toPrecision(12))
  }
  const current = $derived(values[spec.name] as number)
  const isDefault = $derived(current === spec.value)
</script>

<div class="param">
  {#if spec.choices}
    <fieldset>
      <legend>{label}{#if spec.unit}&nbsp;<span class="unit">({spec.unit})</span>{/if}</legend>
      <div class="choices">
        {#each spec.choices as c, i (c)}
          <label class="choice">
            <input type="radio" name={id} value={c} checked={current === c} onchange={() => set(c)} />
            <span>{choiceLabels?.[i] ?? fmt(c, 6)}</span>
          </label>
        {/each}
      </div>
    </fieldset>
  {:else}
    <label for={id} class="head">
      <span>{label}</span>
      {#if spec.unit}<span class="unit">({spec.unit})</span>{/if}
    </label>
    <div class="row">
      <input
        id={id}
        type="range"
        min={spec.range?.min}
        max={spec.range?.max}
        {step}
        value={current}
        oninput={(e) => set(Number((e.currentTarget as HTMLInputElement).value))}
      />
      <input
        class="num"
        type="number"
        aria-label={`${label}, valeur exacte`}
        min={spec.range?.min}
        max={spec.range?.max}
        step="any"
        value={current}
        onchange={(e) => set(Number((e.currentTarget as HTMLInputElement).value))}
      />
    </div>
  {/if}
  <p class="meta">
    {#if !isDefault}
      <button type="button" class="linkish" onclick={() => set(spec.value as number)}>valeur du script : {fmt(spec.value as number, 6)}</button>
    {:else}
      <span>valeur du script</span>
    {/if}
    {#if errata}· <a href={errata}>pourquoi cette valeur ?</a>{/if}
    {#if hint}· {hint}{/if}
  </p>
</div>

<style>
  .param {
    min-width: 0;
  }
  .head {
    display: flex;
    gap: 0.35em;
    font-weight: 600;
  }
  .unit {
    color: var(--ink-soft);
    font-weight: 400;
  }
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 6.5rem;
    gap: 0.6rem;
    align-items: center;
  }
  input[type='range'] {
    width: 100%;
    min-height: 2.75rem;
    accent-color: var(--accent);
  }
  input[type='number'] {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.3rem 0.5rem;
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
  }
  legend {
    font-weight: 600;
    padding: 0;
  }
  .choices {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 1rem;
  }
  .choice {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2.75rem;
    cursor: pointer;
  }
  .choice input {
    width: 1.2rem;
    height: 1.2rem;
    accent-color: var(--accent);
  }
  .meta {
    margin: 0.1rem 0 0;
    font-size: 0.85rem;
    color: var(--ink-soft);
  }
  .linkish {
    background: none;
    border: 0;
    padding: 0.2rem 0;
    min-height: 1.5rem;
    color: var(--accent);
    text-decoration: underline;
    font: inherit;
    cursor: pointer;
  }
</style>
