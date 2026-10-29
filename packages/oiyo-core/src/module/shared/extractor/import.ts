import { parse as babelParse } from '@babel/parser'
import * as t from '@babel/types'

import { traverseAst } from '~/shared'

import { parseCode } from '../parser'

export function extractImportNames(scriptContent: string): Set<string> {
  const names = new Set<string>()
  if (!scriptContent || !scriptContent.includes('import')) {
    return names
  }

  const ast = babelParse(scriptContent, {
    sourceType: 'module',
    plugins: ['typescript'],
  })

  traverseAst(ast, {
    ImportDeclaration(path) {
      for (const specifier of path.node.specifiers) {
        names.add(specifier.local.name)
      }
    },
  })

  return names
}

export interface ImportInfo {
  importPath: string;
  exportName: string;
  importName: string;
  offsetStart?: number;
  offsetEnd?: number;
}
export function extractImports(script: string) {
  const imports = new Map<string, ImportInfo>()
  if (!script || !script.includes('import')) {
    return imports
  }

  const ast = parseCode(script)

  traverseAst(ast, {
    Program(programPath) {
      for (const stmtPath of programPath.get('body')) {
        if (!stmtPath.isImportDeclaration() || stmtPath.node.importKind === 'type') {
          continue
        }
        const importPath = stmtPath.node.source.value
        for (const spec of stmtPath.node.specifiers) {
          if (t.isImportSpecifier(spec)) {
            imports.set(spec.local.name, {
              importPath,
              exportName: t.isIdentifier(spec.imported)
                ? spec.imported.name
                : spec.imported.value,
              importName: spec.local.name,
              offsetStart: stmtPath.node.start ?? 0,
              offsetEnd: stmtPath.node.end ?? 0,
            })
          }
          if (t.isImportDefaultSpecifier(spec)) {
            imports.set(spec.local.name, {
              importPath,
              exportName: 'default',
              importName: spec.local.name,
              offsetStart: stmtPath.node.start ?? 0,
              offsetEnd: stmtPath.node.end ?? 0,
            })
          }
          if (t.isImportNamespaceSpecifier(spec)) {
            imports.set(spec.local.name, {
              importPath,
              exportName: '*',
              importName: spec.local.name,
              offsetStart: stmtPath.node.start ?? 0,
              offsetEnd: stmtPath.node.end ?? 0,
            })
          }
        }
        programPath.stop()
      }
    },
  })

  return imports
}
