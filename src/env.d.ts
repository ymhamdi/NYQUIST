/// <reference types="astro/client" />
/// <reference types="svelte" />

declare module '*.m?raw' {
  const source: string
  export default source
}
