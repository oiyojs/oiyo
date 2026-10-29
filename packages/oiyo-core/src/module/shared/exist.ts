import * as path from 'pathe'

export function hasSuffix(filePath: string, suffix: string) {
  return path.basename(filePath, path.extname(filePath)).endsWith(suffix)
}
