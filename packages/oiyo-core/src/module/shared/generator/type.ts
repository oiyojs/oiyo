import * as path from 'pathe'

import { stripExtension } from '../file'

export function generateConstType(importPath: string, importName: string, exportName: string, opts?: {
  baseDir?: string;
  noExtension?: boolean;
}) {
  importPath = opts?.baseDir ? path.relative(opts?.baseDir, importPath) : importPath
  importPath = opts?.noExtension ? stripExtension(importPath) : importPath

  return `const ${importName}: typeof import('${importPath}')['${exportName}'];`
}

export function generateInterfaceItemType(importPath: string, importName: string, exportName: string, opts?: {
  baseDir?: string;
}) {
  importPath = opts?.baseDir ? path.relative(opts?.baseDir, importPath) : importPath

  return `${importName}: typeof import('${importPath}')['${exportName}'];`
}

export function generateVueTemplateType(importPath: string, importName: string, exportName: string, opts?: {
  baseDir?: string;
}) {
  importPath = opts?.baseDir ? path.relative(opts?.baseDir, importPath) : importPath

  return `readonly ${importName}: UnwrapRef<typeof import('${importPath}')['${exportName}']>;`
}
