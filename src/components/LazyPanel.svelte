<script lang="ts">
  /**
   * A disclosure whose content is loaded only when opened (its JavaScript is
   * a separate chunk): keeps optional tools, such as the microcontroller
   * export, out of the page's initial load. The props stay reactive.
   */
  import type { Component } from 'svelte'

  interface Props {
    summary: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    load: () => Promise<{ default: Component<any> }>
    props: Record<string, unknown>
  }
  let { summary, load, props }: Props = $props()
  let open = $state(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let Loaded = $state<Component<any> | null>(null)
  let failed = $state(false)
  $effect(() => {
    if (open && !Loaded && !failed)
      load()
        .then((m) => (Loaded = m.default))
        .catch(() => (failed = true))
  })
</script>

<details class="lazy" bind:open>
  <summary>{summary}</summary>
  <div class="body">
    {#if Loaded}
      <Loaded {...props} />
    {:else if failed}
      <p role="alert">Chargement impossible (hors ligne sans copie locale ?). Rechargez la page.</p>
    {:else if open}
      <p class="muted" role="status">Chargement…</p>
    {/if}
  </div>
</details>

<style>
  .lazy {
    margin: 1rem 0;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--surface);
  }
  summary {
    cursor: pointer;
    padding: 0.6rem 0.9rem;
    min-height: 2.75rem;
    display: flex;
    align-items: center;
    font-weight: 600;
  }
  .body {
    padding: 0 0.9rem 0.6rem;
  }
</style>
