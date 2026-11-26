/**
 * Starts the scene of a hero (landing or course page) after the first paint:
 * the remembered Pause choice (else prefers-reduced-motion), the toggle
 * button, and theme changes.
 */
import { mountScene, type Scene } from './chain'

const KEY = 'nyq-motion'

export function startHero(hero: HTMLElement) {
  const canvas = hero.querySelector('canvas')!
  const btn = hero.querySelector<HTMLButtonElement>('.motion')
  const calm = hero.dataset.calm === 'true'
  let stored: string | null = null
  try {
    stored = localStorage.getItem(KEY)
  } catch {
    /* storage unavailable */
  }
  let paused = stored ? stored === 'paused' : matchMedia('(prefers-reduced-motion: reduce)').matches
  let scene: Scene | null = null
  const label = () => {
    if (!btn) return
    btn.setAttribute('aria-pressed', String(paused))
    btn.textContent = paused ? 'Reprendre l’animation' : 'Pause animation'
  }
  label()
  btn?.addEventListener('click', () => {
    paused = !paused
    label()
    scene?.setPaused(paused)
    try {
      localStorage.setItem(KEY, paused ? 'paused' : 'playing')
    } catch {
      /* not remembered */
    }
  })
  const go = () => {
    scene = mountScene(canvas, { paused, calm })
    new MutationObserver(() => scene?.refreshColors()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => scene?.refreshColors())
  }
  // after the first paint, once the label font is there
  const start = () => document.fonts.load('11px "IBM Plex Mono"').then(go, go)
  const idle = (cb: () => void) => ('requestIdleCallback' in window ? requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 200))
  if (document.readyState === 'complete') idle(start)
  else addEventListener('load', () => idle(start), { once: true })
}
