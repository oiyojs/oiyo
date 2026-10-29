export function generateImportDeclaration(importPath: string, importName: string, exportName: string, isType: boolean = false) {
  if (exportName === 'default') {
    return `import ${importName} from '${importPath}'`
  }

  if (exportName === importName) {
    return `import ${isType ? 'type ' : ''}{ ${importName} } from '${importPath}'`
  }

  return `import { ${exportName} as ${importName} } from '${importPath}'`
}
