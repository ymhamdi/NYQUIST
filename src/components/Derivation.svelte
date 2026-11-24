<script lang="ts">
  /** Step-by-step hand calculation (text + MathML), computed with the current values. */
  import type { Step } from '../derive/firstOrderLoop'

  interface Props {
    steps: Step[]
    title?: string
    open?: boolean
  }
  let { steps, title = 'Calcul à la main, pas à pas', open = true }: Props = $props()
</script>

<details class="deriv" {open}>
  <summary>{title}</summary>
  <ol>
    {#each steps as s, i (i)}
      <li>
        <p>{s.text}</p>
        {#if s.math}{@html s.math}{/if}
      </li>
    {/each}
  </ol>
</details>

<style>
  .deriv {
    margin: 1rem 0;
    border: 1px solid var(--rule);
    border-radius: var(--radius);
    background: var(--surface);
  }
  summary {
    cursor: pointer;
    padding: 0.6rem 0.9rem;
    font-weight: 600;
    min-height: 2.75rem;
    display: flex;
    align-items: center;
  }
  ol {
    margin: 0;
    padding: 0.2rem 1.2rem 0.8rem 2.4rem;
  }
  li {
    margin: 0.4rem 0;
  }
  li p {
    margin: 0.2rem 0;
  }
</style>
