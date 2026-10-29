import * as fs from 'node:fs'

import * as path from 'pathe'
import * as tg from 'tinyglobby'

import { toArray } from '~/shared'

export function stripExtension(filePath: string): string {
  const ext = path.extname(filePath)
  return ext ? filePath.slice(0, -ext.length) : filePath
}

export function isFile(file: string) {
  try {
    return fs.existsSync(file) && fs.statSync(file).isFile()
  }
  catch {
    return false
  }
}

export interface ScanFilesOptions {
  dir: string;
  pattern?: string | string[];
  ignore?: string | string[];
}
export async function scanFiles(options: ScanFilesOptions): Promise<string[]> {
  const {
    dir,
    pattern,
    ignore,
  } = options

  if (!fs.existsSync(dir)) {
    return []
  }

  let cwd = dir
  let patterns = toArray(pattern)
  if (isFile(dir)) {
    cwd = path.dirname(dir)
    patterns = [path.basename(dir)]
  }

  try {
    const files = await tg.glob(patterns, {
      cwd,
      ignore: toArray(ignore),
      absolute: true,
    })

    return files.map(file => path.normalize(file))
  }
  catch (error) {
    console.error('[oiyo] Error scanning file:', error)
    return []
  }
}
