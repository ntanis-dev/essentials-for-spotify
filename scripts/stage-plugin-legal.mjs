// Copies the licence and notices into the .sdPlugin directory, which is what
// `streamdeck pack` turns into the installed artifact.
//
// The README never reaches a user: they install a packed plugin, not the
// repository. Since bin/plugin.js has third-party code compiled into it, and
// the icons are licensed rather than owned, those terms have to travel inside
// the package or they are not being delivered at all.
import { copyFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const PLUGIN_DIRECTORY = 'com.ntanis.essentials-for-spotify.sdPlugin'
const FILES = ['LICENSE', 'THIRD-PARTY-NOTICES.md', 'THIRD-PARTY-ASSETS.md']

const target = resolve(PLUGIN_DIRECTORY)
if (!existsSync(target)) throw new Error(`${PLUGIN_DIRECTORY} not found; run from the repository root.`)

for (const file of FILES) {
  const source = resolve(file)
  if (!existsSync(source)) {
    throw new Error(`${file} is missing; it must ship inside the plugin package.`)
  }
  copyFileSync(source, join(target, file))
}

console.log(`staged into ${PLUGIN_DIRECTORY}: ${FILES.join(', ')}`)
