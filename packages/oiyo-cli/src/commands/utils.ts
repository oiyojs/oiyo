import { createRequire } from 'node:module'
import process from 'node:process'

import { normalize } from 'pathe'

export function createProjectRequire() {
  return createRequire(`${normalize(process.cwd())}/`)
}

export function findFileEntry(id: string): string {
  const require = createRequire(import.meta.url)
  return normalize(require.resolve(id))
}
