<script lang="ts">
  /** Question heading: handout number, type tags, and the statement quoted verbatim with its page. */
  import { QTYPE_LABEL, type Question } from '../content/types'

  interface Props {
    q: Question
    part: string
  }
  let { q, part }: Props = $props()
</script>

<header class="qhead">
  <h3 id={`q-${q.id}`}>Question {q.number} <span class="part">(partie {part})</span></h3>
  <p class="tags">
    {#each q.types as t (t)}<span class="tag">{QTYPE_LABEL[t]}</span>{/each}
  </p>
  <blockquote class="statement">
    <q>{q.text}</q>
    <footer class="muted">{#if q.page !== null}Fascicule, p. {q.page}{:else}Énoncé transcrit, non vérifié sur le fascicule original{/if}</footer>
  </blockquote>
</header>

<style>
  .qhead h3 {
    margin-bottom: 0.2rem;
  }
  .part {
    font: 400 0.9rem var(--font-body);
    color: var(--ink-soft);
  }
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin: 0.2rem 0 0.4rem;
  }
  blockquote {
    margin-left: 0;
    margin-right: 0;
  }
  footer {
    font-size: 0.82rem;
    margin-top: 0.2rem;
  }
</style>
