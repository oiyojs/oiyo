import { createHash } from 'node:crypto'
import { existsSync, renameSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pid } from 'node:process'

import { parse as babelParse } from '@babel/parser'
import _traverse from '@babel/traverse'
import * as path from 'pathe'
import * as tg from 'tinyglobby'

export const traverseAst: typeof _traverse = (typeof _traverse === 'function' ? _traverse : (_traverse as any).default)

export const nativeRequire = createRequire(import.meta.url)

export type GlobRule = string | string[]

export interface ScanFilesOptions {
  dir: string;
  pattern?: GlobRule;
  ignore?: GlobRule;
}

const DEFAULT_SCAN_PATTERN = '**/*'

export function toArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) {
    return []
  }
  return Array.isArray(value) ? value : [value]
}

export function normalizeGlobRule(input?: GlobRule): string[] {
  if (!input) {
    return []
  }

  return Array.isArray(input) ? input : [input]
}

function getDefaultScanPatterns(dir: string) {
  if (!existsSync(dir)) {
    return [DEFAULT_SCAN_PATTERN]
  }

  try {
    return statSync(dir).isFile() ? [path.basename(dir)] : [DEFAULT_SCAN_PATTERN]
  }
  catch {
    return [DEFAULT_SCAN_PATTERN]
  }
}

export async function scanFiles(options: ScanFilesOptions): Promise<string[]> {
  const {
    dir,
    pattern,
    ignore,
  } = options

  if (!existsSync(dir)) {
    return []
  }

  const isFile = statSync(dir).isFile()
  const cwd = isFile ? path.dirname(dir) : dir
  const patterns = normalizeGlobRule(pattern)
  const resolvedPatterns = patterns.length > 0 ? patterns : getDefaultScanPatterns(dir)

  try {
    const files = await tg.glob(resolvedPatterns, {
      cwd,
      absolute: true,
      ignore: normalizeGlobRule(ignore),
    })

    return files.map(file => path.normalize(file))
  }
  catch (error) {
    console.error('[oiyo] Error scanning file:', error)
    return []
  }
}

export function isScannedFilePath(targetPath: string, sourcePath: string, options?: { pattern?: GlobRule; ignore?: GlobRule }) {
  const id = path.normalize(targetPath)
  const root = path.normalize(sourcePath)

  if (existsSync(root)) {
    try {
      if (statSync(root).isFile()) {
        return id === root
      }
    }
    catch {
      return false
    }
  }

  if (id !== root && !id.startsWith(`${root}/`)) {
    return false
  }

  const relativePath = path.normalize(path.relative(root, id))
  const patterns = normalizeGlobRule(options?.pattern)
  const ignores = normalizeGlobRule(options?.ignore)

  if (ignores.some(rule => path.matchesGlob(relativePath, rule))) {
    return false
  }

  if (patterns.length === 0) {
    return true
  }

  return patterns.some(rule => path.matchesGlob(relativePath, rule))
}

export function generateHash(input: string, length = 8) {
  return createHash('sha256')
    .update(input)
    .digest('hex')
    .slice(0, length)
}

export function atomicWriteFile(
  targetPath: string,
  content: string,
): boolean {
  const tempPath = `${targetPath}.${pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`
  writeFileSync(tempPath, content, 'utf-8')

  if (existsSync(targetPath)) {
    unlinkSync(targetPath)
  }

  renameSync(tempPath, targetPath)

  return true
}

export function toDeclarationImportPath(
  fromDir: string,
  filePath: string,
  options?: { stripExtension?: boolean },
) {
  let importPath = path.relative(fromDir, filePath)

  if (options?.stripExtension) {
    importPath = importPath.replace(/\.[cm]?[jt]sx?$/, '')
  }

  return importPath.startsWith('.') ? importPath : `./${importPath}`
}

export function extractPackageName(specifier: string) {
  const segments = specifier.split('/').filter(Boolean)

  if (specifier.startsWith('@')) {
    return segments.slice(0, 2).join('/')
  }

  return segments[0] || specifier
}

export function toScannedImportSpecifier(filePath: string, sourcePath: string, importBase?: string) {
  if (!importBase) {
    return filePath
  }

  const relativePath = path.relative(sourcePath, filePath)

  if (!relativePath || relativePath === '.') {
    return importBase
  }

  return `${importBase}/${relativePath}`
}

export function toKebabCase(str: string): string {
  if (!str) {
    return ''
  }

  const KEBAB_REGEX = /\p{Lu}/gu

  const result = str.replace(KEBAB_REGEX, match => `-${match.toLowerCase()}`)

  if (result.startsWith('-')) {
    return result.slice(1)
  }

  return result
}

export function toPascalCase(str: string): string {
  if (!str) {
    return ''
  }

  return str
    .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, c => c.toUpperCase())
}

export function toCamelCase(str: string) {
  const pascalCase = toPascalCase(str)

  if (!pascalCase) {
    return ''
  }

  return pascalCase[0].toLowerCase() + pascalCase.slice(1)
}

export function findMarcoOffset(scriptContent: string, marcoName: string): { start: number;end: number } {
  const ast = babelParse(scriptContent, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  const offset: { start: number;end: number } = { start: 0, end: 0 }

  traverseAst(ast, {
    CallExpression(path) {
      const { callee, arguments: args } = path.node

      if (
        callee.type === 'Identifier'
        && callee.name === marcoName
        && args.length > 0
        && path.node.start != null
        && path.node.end != null
      ) {
        offset.start = path.node.start
        offset.end = path.node.end
        path.stop()
      }
    },
  })

  return offset
}

export function cleanSpace(str: string) {
  return str.replace(/\s+/g, '')
}
