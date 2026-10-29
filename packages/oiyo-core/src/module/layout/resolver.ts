import * as path from 'pathe'

import { toKebabCase, toPascalCase } from '~/shared'

export function resolveLayoutUseName(filePath: string, baseDir: string): string {
  const relativePath = path.relative(baseDir, filePath)
  const { dir, name } = path.parse(relativePath)
  const segments = dir && dir !== '.' ? [...dir.split(path.sep), name] : [name]

  return segments
    .map(segment => toKebabCase(segment))
    .join('-')
}

export function resolveLayoutComponentName(layoutName: string): string {
  const pascalCase = toPascalCase(layoutName)

  return `OiyoLayout${pascalCase}`
}
