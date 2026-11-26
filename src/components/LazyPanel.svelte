<script module lang="ts">
  /** Loader: the step response of a second-order loop (engine) settling on its final value. */
  import { stepContinuous, tf } from '../engine/lti'
  import { linspace } from '../engine/stepinfo'

  const t = linspace(0, 6, 61)
  const y = stepContinuous(tf(4, [1, 1.4, 4]), t) // ωn = 2, ζ = 0.35
  const top = Math.max(...y)
  const LY = (v: number) => (32 - (v / top) * 28).toFixed(1)
  const LOADER = t.map((v, i) => `${i ? 'L' : 'M'}${(3 + v * 12.3).toFixed(1)} ${LY(y[i])}`).join('')
  const SET = LY(1)
</script>

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
      <span class="loader" role="status">
        <svg viewBox="0 0 80 36" width="80" height="36" aria-hidden="true">
          <line class="sp" x1="3" x2="77" y1={SET} y2={SET}></line>
          <path class="resp" d={LOADER} pathLength="1"></path>
        </svg>
        Chargement…
      </span>
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
  .loader {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }
  .sp {
    stroke: currentColor;
    stroke-dasharray: 3 3;
    opacity: 0.7;
  }
  .resp {
    fill: none;
    stroke: var(--c1);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 1;
    animation: settle 1.8s ease-out infinite;
  }
  @keyframes settle {
    0% {
      stroke-dashoffset: 1;
    }
    70%,
    100% {
      stroke-dashoffset: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .resp {
      animation: none;
      stroke-dashoffset: 0;
    }
  }
</style>
