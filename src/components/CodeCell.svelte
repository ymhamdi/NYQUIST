<script lang="ts">
  /**
   * The "%%" cell of the submitted MATLAB script that answers a question,
   * with the current slider values written into its @param lines (marked).
   * Pasting the whole script into MATLAB reproduces the figures on screen.
   */
  import { getContext } from 'svelte'
  import { cellSource, parseParams } from '../engine/matlabScript'
  import { highlightLine } from '../lib/matlabHighlight'

  /** inside the report the code goes to the annex, not under each question */
  const inReport = getContext<boolean>('nyq-report') ?? false

  interface Props {
    /** the script with the current values (store.script) */
    script: string
    /** the original script (to mark the lines whose value changed) */
    original: string
    cell: string
    filename: string
    /** cells to run first, in the handout's numbering */
    needs?: string[]
  }
  let { script, original, cell, filename, needs = [] }: Props = $props()

  const source = $derived(cellSource(script, cell))
  const firstLine = $derived(script.replace(/\r/g, '').split('\n').findIndex((l) => new RegExp(`^\\s*%%\\s*${cell.replace('.', '\\.')}(\\s|$)`).test(l)))
  const changed = $derived.by(() => {
    const now = parseParams(script)
    const before = new Map(parseParams(original).map((p) => [p.line, JSON.stringify(p.value)]))
    return new Set(now.filter((p) => before.get(p.line) !== JSON.stringify(p.value)).map((p) => p.line))
  })
  const lines = $derived(source.split('\n'))
  let status = $state('')

  async function copy(text: string, what: string) {
    try {
      await navigator.clipboard.writeText(text)
      status = `${what} copié.`
    } catch {
      status = 'Copie impossible : sélectionnez le texte à la main.'
    }
    setTimeout(() => (status = ''), 2500)
  }
  function download() {
    const url = URL.createObjectURL(new Blob([script], { type: 'text/plain;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
</script>

{#if !inReport}
<details class="code" open>
  <summary>
    <span>Code MATLAB — cellule <code>%% {cell}</code> de <code>{filename}</code></span>
    {#if changed.size}<span class="tag live">valeurs du curseur</span>{/if}
  </summary>
  {#if needs.length}
    <p class="needs">À exécuter après {needs.length > 1 ? 'les cellules' : 'la cellule'} {needs.join(', ')} (ou tout le script).</p>
  {/if}
  <pre aria-label={`Cellule ${cell} du script ${filename}`}><code>{#each lines as l, i (i)}<span class="ln" class:changed={changed.has(firstLine + i)}><span class="no" aria-hidden="true">{firstLine + i + 1}</span>{@html highlightLine(l) || ' '}</span>{/each}</code></pre>
  <div class="actions no-print">
    <button type="button" class="btn ghost" onclick={() => copy(source, 'Cellule')}>Copier la cellule</button>
    <button type="button" class="btn ghost" onclick={() => copy(script, 'Script complet')}>Copier le script complet</button>
    <button type="button" class="btn ghost" onclick={download}>Télécharger {filename}</button>
    <span class="status" role="status">{status}</span>
  </div>
</details>
{/if}

<style>
  .code {
    margin: 1rem 0;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--code-bg);
  }
  summary {
    cursor: pointer;
    padding: 0.6rem 0.9rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    min-height: 2.75rem;
    font-weight: 600;
  }
  .live {
    background: var(--ok-soft);
    color: var(--ok);
    border-color: var(--ok);
  }
  .needs {
    margin: 0 0.9rem 0.4rem;
    font-size: 0.88rem;
    color: var(--ink-soft);
  }
  pre {
    margin: 0;
    padding: 0.4rem 0;
    overflow-x: auto;
    font-size: 0.82rem;
    line-height: 1.5;
    border-top: 1px solid var(--rule);
  }
  .ln {
    display: block;
    padding: 0 0.9rem 0 0;
    white-space: pre;
  }
  .ln.changed {
    background: var(--ok-soft);
    box-shadow: inset 3px 0 0 var(--ok);
  }
  .no {
    display: inline-block;
    width: 3.2em;
    padding-right: 0.8em;
    text-align: right;
    color: var(--ink-soft);
    user-select: none;
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
  :global(.tok-com) {
    color: #3f7d3a;
  }
  :global(.tok-str) {
    color: #8b3fb3;
  }
  :global(.tok-kw) {
    color: #1d4ed8;
    font-weight: 600;
  }
  :global(.tok-num) {
    color: #a1460a;
  }
  :global(:root[data-theme='dark'] .tok-com) {
    color: #8fcf88;
  }
  :global(:root[data-theme='dark'] .tok-str) {
    color: #d2a8ff;
  }
  :global(:root[data-theme='dark'] .tok-kw) {
    color: #8fb4ff;
  }
  :global(:root[data-theme='dark'] .tok-num) {
    color: #ffb27a;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme='light']) .tok-com) {
      color: #8fcf88;
    }
    :global(:root:not([data-theme='light']) .tok-str) {
      color: #d2a8ff;
    }
    :global(:root:not([data-theme='light']) .tok-kw) {
      color: #8fb4ff;
    }
    :global(:root:not([data-theme='light']) .tok-num) {
      color: #ffb27a;
    }
  }
</style>
