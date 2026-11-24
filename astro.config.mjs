import svelte from '@astrojs/svelte'
import { defineConfig } from 'astro/config'

// NYQ_BASE: the sub-path when deployed on GitHub Pages ("/NYQUIST-lab./"); "/" locally.
export default defineConfig({
  site: 'https://ymhamdi.github.io',
  base: process.env.NYQ_BASE ?? '/',
  trailingSlash: 'ignore',
  integrations: [svelte()],
  build: { format: 'directory', inlineStylesheets: 'auto' },
  vite: {
    // the TP scripts are imported as text (?raw): the code shown is the submitted file
    assetsInclude: ['**/*.m'],
  },
})
