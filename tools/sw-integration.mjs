// Astro integration: after the build, writes dist/sw.js from
// tools/sw.template.js with the list of every built file (pages as their
// directory URL) and a version that is a hash of their contents, so a new
// deployment replaces the offline copy and an unchanged one keeps it.
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(path)))
    else out.push(path)
  }
  return out
}

export default function serviceWorker() {
  let base = '/'
  return {
    name: 'nyquist-service-worker',
    hooks: {
      'astro:config:done': ({ config }) => {
        base = config.base.replace(/\/?$/, '/')
      },
      'astro:build:done': async ({ dir, logger }) => {
        const root = fileURLToPath(dir)
        const files = (await walk(root))
          .map((f) => relative(root, f).split(sep).join('/'))
          .filter((f) => f !== 'sw.js')
          .sort()
        const hash = createHash('sha256')
        for (const f of files) {
          hash.update(f)
          hash.update(await readFile(join(root, f)))
        }
        const version = hash.digest('hex').slice(0, 12)
        const urls = files.map((f) => base + f.replace(/(^|\/)index\.html$/, '$1'))
        const template = await readFile(new URL('./sw.template.js', import.meta.url), 'utf8')
        const sw = template
          .replace('__VERSION__', version)
          .replace('__BASE__', JSON.stringify(base))
          .replace('__FILES__', JSON.stringify(urls))
        await writeFile(join(root, 'sw.js'), sw)
        logger.info(`sw.js: ${urls.length} files precached, version ${version}`)
      },
    },
  }
}
