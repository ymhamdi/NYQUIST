<script lang="ts">
  /**
   * The generated C for one controller or filter: target choice (Arduino
   * Uno, STM32 HAL, portable C), the code, copy and download. The code is
   * regenerated whenever the settings above it change.
   */
  import { generateC, type Spec, type Target } from '../../engine/codegen'

  interface Props {
    spec: Spec
  }
  let { spec }: Props = $props()
  const uid = $props.id()
  const TARGETS: { id: Target; label: string }[] = [
    { id: 'arduino', label: 'Arduino Uno' },
    { id: 'stm32', label: 'STM32 (HAL)' },
    { id: 'c', label: 'C portable' },
  ]
  let target = $state<Target>('arduino')
  const gen = $derived(generateC(spec, target))
  let status = $state('')

  async function copy() {
    try {
      await navigator.clipboard.writeText(gen.code)
      status = 'Code copié.'
    } catch {
      status = 'Copie impossible : sélectionnez le texte à la main.'
    }
    setTimeout(() => (status = ''), 2500)
  }
  function download() {
    const url = URL.createObjectURL(new Blob([gen.code], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = gen.filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
</script>

<div class="export">
  <fieldset class="targets">
    <legend>Cible</legend>
    {#each TARGETS as t (t.id)}
      <label class="opt"><input type="radio" name={`${uid}-target`} value={t.id} bind:group={target} /> {t.label}</label>
    {/each}
  </fieldset>
  <details class="code" open>
    <summary>Code C — <code>{gen.filename}</code></summary>
    <pre aria-label={`Code C généré, ${gen.filename}`}><code>{gen.code}</code></pre>
    <div class="actions">
      <button type="button" class="btn ghost" onclick={copy}>Copier le code</button>
      <button type="button" class="btn ghost" onclick={download}>Télécharger {gen.filename}</button>
      <span class="status" role="status">{status}</span>
    </div>
  </details>
</div>

<style>
  .targets {
    border: 0;
    margin: 0.6rem 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0 1.2rem;
    align-items: center;
  }
  legend {
    font-weight: 600;
    float: left;
    margin-right: 1rem;
    padding: 0;
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
  .code {
    margin: 0.6rem 0 1rem;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--code-bg);
  }
  summary {
    cursor: pointer;
    padding: 0.6rem 0.9rem;
    min-height: 2.75rem;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-weight: 600;
  }
  pre {
    margin: 0;
    padding: 0.6rem 0.9rem;
    max-height: 32rem;
    overflow: auto;
    font-size: 0.85rem;
    line-height: 1.45;
    border-top: 1px solid var(--rule);
  }
  pre code {
    font-size: inherit; /* 13.6 px: legible on a phone */
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    padding: 0.6rem 0.9rem;
    border-top: 1px solid var(--rule);
  }
  .status {
    font-size: 0.88rem;
    color: var(--ok);
  }
</style>
