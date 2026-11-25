<script lang="ts">
  /**
   * The lab report ("compte rendu") shell shared by every TP: cover page,
   * the values used, the TP's questions (children), the student's
   * observations, and the MATLAB script with the same values in an annex.
   * Inside it, code cells hide themselves (context 'nyq-report').
   */
  import { setContext, type Snippet } from 'svelte'
  import type { TpMeta } from '../content/types'
  import { fmt } from '../lib/format'
  import { highlightLine } from '../lib/matlabHighlight'
  import type { TpStore } from '../lib/tpStore.svelte'

  interface Props {
    store: TpStore<unknown>
    tp: TpMeta
    scriptName: string
    /** French label of each @param */
    labels: Record<string, string>
    /** sentence above the table of values (which values the handout omits) */
    valuesNote: string
    errataBase: string
    tpHref: string
    children: Snippet
  }
  let { store, tp, scriptName, labels, valuesNote, errataBase, tpHref, children }: Props = $props()
  setContext('nyq-report', true)
  $effect(() => store.restore())

  const ID_KEY = 'nyq-identity'
  const notesKey = $derived(`nyq-notes-${store.key}`)
  let who = $state({ name: 'Youssef El Mhamdi', group: 'IIA 3/1', school: 'INSAT' })
  let notes = $state('')
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  $effect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ID_KEY) ?? 'null')
      if (saved) who = { ...who, ...saved }
      notes = localStorage.getItem(notesKey) ?? ''
    } catch {
      /* no storage */
    }
  })
  function persist() {
    try {
      localStorage.setItem(ID_KEY, JSON.stringify(who))
      localStorage.setItem(notesKey, notes)
    } catch {
      /* ignore */
    }
  }
  const lines = $derived(store.script.replace(/\r/g, '').split('\n'))
  const show = (v: number | number[]) => (Array.isArray(v) ? v.map((x) => fmt(x, 6)).join(' ; ') : fmt(v, 6))
</script>

<div class="report">
  <div class="toolbar no-print card">
    <p>
      Vérifiez vos nom, groupe et observations, puis <strong>Imprimer → Enregistrer au format PDF</strong>. Les figures et les valeurs sont celles des
      curseurs du TP ; pour les changer, <a href={tpHref}>revenez à la page du TP</a>.
    </p>
    <button class="btn" type="button" onclick={() => window.print()}>Imprimer / enregistrer en PDF</button>
  </div>

  <section class="cover">
    <p class="school">{who.school}</p>
    <p class="course">{tp.course}</p>
    <h1>Compte rendu — TP{tp.number}</h1>
    <p class="title">{tp.title}</p>
    <dl>
      <dt>Étudiant</dt>
      <dd>
        <input class="no-print" aria-label="Nom" bind:value={who.name} onchange={persist} />
        <span class="print-only">{who.name}</span>
      </dd>
      <dt>Groupe</dt>
      <dd>
        <input class="no-print" aria-label="Groupe" bind:value={who.group} onchange={persist} />
        <span class="print-only">{who.group}</span>
      </dd>
      <dt>Date</dt>
      <dd>{today}</dd>
    </dl>
    <p class="gen">Calculs et figures produits par Nyquist ; script MATLAB en annexe, exécutable tel quel (mêmes valeurs que les figures).</p>
    {#if !tp.verified}<p class="gen">Énoncé transcrit, non vérifié sur le fascicule original.</p>{/if}
  </section>

  <section class="params">
    <h2>Valeurs utilisées</h2>
    <p>{valuesNote} (voir l'<a href={errataBase}>errata</a>).</p>
    <table class="num">
      <thead><tr><th>Paramètre</th><th>Valeur</th><th>Origine</th></tr></thead>
      <tbody>
        {#each store.specs as s (s.name)}
          <tr>
            <td>{labels[s.name] ?? s.name}</td>
            <td>{show(store.values[s.name])}{s.unit ? ` ${s.unit}` : ''}</td>
            <td>{store.isDefault(s.name) ? 'valeur par défaut du script' : 'modifiée'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  {@render children()}

  <section class="obs">
    <h2>Observations et conclusion</h2>
    <label class="no-print" for="notes">Vos observations (elles apparaissent dans le PDF) :</label>
    <textarea id="notes" class="no-print" rows="8" bind:value={notes} onchange={persist}></textarea>
    <div class="print-only notes">{notes || '…'}</div>
  </section>

  <section class="annex">
    <h2>Annexe — script MATLAB <code>{scriptName}</code></h2>
    <p>Script rendu, avec les valeurs utilisées dans ce compte rendu.</p>
    <pre><code>{#each lines as l, i (i)}<span class="ln"><span class="no" aria-hidden="true">{i + 1}</span>{@html highlightLine(l) || ' '}</span>{/each}</code></pre>
  </section>
</div>

<style>
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    align-items: center;
    justify-content: space-between;
    margin: 1.5rem 0;
  }
  .toolbar p {
    margin: 0;
  }
  .cover {
    text-align: center;
    padding: 3rem 0 2rem;
  }
  .school,
  .course {
    margin: 0.2rem auto;
    font-weight: 600;
    color: var(--ink-soft);
  }
  .cover h1 {
    margin-top: 2rem;
  }
  .title {
    font: 600 1.3rem/1.3 var(--font-head);
    margin: 0 auto 2rem;
  }
  dl {
    display: grid;
    grid-template-columns: max-content minmax(0, 18rem);
    gap: 0.5rem 1rem;
    justify-content: center;
    text-align: left;
    margin: 0 auto;
  }
  dt {
    font-weight: 600;
    align-self: center;
  }
  dd {
    margin: 0;
  }
  dd input {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.3rem 0.6rem;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
  }
  .gen {
    margin: 2.5rem auto 0;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .params table {
    width: 100%;
    display: block;
    overflow-x: auto;
  }
  textarea {
    width: 100%;
    margin-top: 0.4rem;
    padding: 0.6rem;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    font: inherit;
  }
  .notes {
    white-space: pre-wrap;
  }
  .annex pre {
    font-size: 0.75rem;
    line-height: 1.45;
    background: var(--code-bg);
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    padding: 0.5rem 0;
    overflow-x: auto;
  }
  .ln {
    display: block;
    white-space: pre;
    padding-right: 0.8rem;
  }
  .no {
    display: inline-block;
    width: 3.2em;
    padding-right: 0.8em;
    text-align: right;
    color: var(--ink-soft);
    user-select: none;
  }
  .print-only {
    display: none;
  }
  @media print {
    .print-only {
      display: inline;
    }
    .notes.print-only {
      display: block;
    }
    .cover {
      break-after: page;
      padding-top: 30vh;
    }
    .annex {
      break-before: page;
    }
    .annex pre {
      white-space: pre-wrap;
      overflow: visible;
      font-size: 7.5pt;
    }
    .ln {
      white-space: pre-wrap;
    }
    :global(.report article) {
      break-inside: auto;
    }
  }
</style>
