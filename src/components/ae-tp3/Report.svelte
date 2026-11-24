<script lang="ts">
  /**
   * The lab report ("compte rendu") of Automatique TP3: cover page, the
   * parameters used, every question with its answer, derivation and figures
   * at the current values, the student's observations, and the MATLAB script
   * (with the same values) in an annex. Printed to PDF by the browser.
   */
  import { setContext } from 'svelte'
  import { TP } from '../../content/aeTp3'
  import { fmt } from '../../lib/format'
  import { highlightLine } from '../../lib/matlabHighlight'
  import { SCRIPT_NAME, tp3 } from '../../lib/stores/aeTp3.svelte'
  import PartII from './PartII.svelte'
  import PartIII from './PartIII.svelte'

  interface Props {
    errataBase: string
    tpHref: string
  }
  let { errataBase, tpHref }: Props = $props()
  setContext('nyq-report', true)
  $effect(() => tp3.restore())

  // identity and notes, kept in this browser
  const ID_KEY = 'nyq-identity'
  const NOTES_KEY = 'nyq-notes-ae-tp3'
  let who = $state({ name: 'Youssef El Mhamdi', group: 'IIA 3/1', school: 'INSAT' })
  let notes = $state('')
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  $effect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ID_KEY) ?? 'null')
      if (saved) who = { ...who, ...saved }
      notes = localStorage.getItem(NOTES_KEY) ?? ''
    } catch {
      /* no storage */
    }
  })
  function persist() {
    try {
      localStorage.setItem(ID_KEY, JSON.stringify(who))
      localStorage.setItem(NOTES_KEY, notes)
    } catch {
      /* ignore */
    }
  }

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
  const lines = $derived(tp3.script.replace(/\r/g, '').split('\n'))
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
    <p class="course">{TP.course}</p>
    <h1>Compte rendu — TP{TP.number}</h1>
    <p class="title">{TP.title}</p>
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
    <p class="gen">
      Calculs et figures produits par Nyquist ; script MATLAB en annexe, exécutable tel quel (mêmes valeurs que les figures).
    </p>
  </section>

  <section class="params">
    <h2>Valeurs utilisées</h2>
    <p>
      Le fascicule ne donne ni la période d'échantillonnage ni le gain : les valeurs ci-dessous ont été choisies (voir l'<a href={errataBase}>errata</a>).
    </p>
    <table class="num">
      <thead><tr><th>Paramètre</th><th>Valeur</th><th>Origine</th></tr></thead>
      <tbody>
        {#each tp3.specs as s (s.name)}
          {@const v = tp3.values[s.name]}
          <tr>
            <td>{LABELS[s.name] ?? s.name}</td>
            <td>{Array.isArray(v) ? v.map((x) => fmt(x, 6)).join(' ; ') : fmt(v, 6)}{s.unit ? ` ${s.unit}` : ''}</td>
            <td>{tp3.isDefault(s.name) ? 'valeur par défaut du script' : 'modifiée'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <PartII report {errataBase} />
  <PartIII report {errataBase} />

  <section class="obs">
    <h2>Observations et conclusion</h2>
    <label class="no-print" for="notes">Vos observations (elles apparaissent dans le PDF) :</label>
    <textarea id="notes" class="no-print" rows="8" bind:value={notes} onchange={persist}></textarea>
    <div class="print-only notes">{notes || '…'}</div>
  </section>

  <section class="annex">
    <h2>Annexe — script MATLAB <code>{SCRIPT_NAME}</code></h2>
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
