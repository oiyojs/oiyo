import type { MetaObject, MetaValue } from './types'

import { parseCode } from '#/shared/parser'

import { traverseAst } from '~/shared'

export function parseMacro<T extends MetaObject>(js: string, name: string): T | null {
  if (!js) {
    return null
  }

  const ast = parseCode(js)

  let meta: MetaObject | null = null

  traverseAst(ast, {
    CallExpression(path) {
      const { callee, arguments: args } = path.node

      if (
        callee.type === 'Identifier'
        && callee.name === name
        && args.length > 0
      ) {
        const arg = args[0]

        if (arg.type === 'ObjectExpression') {
          meta = parseObjectExpression(arg)
          path.stop()
        }
      }
    },
  })

  return meta
}

function parseObjectExpression(node: any): MetaObject {
  const result: MetaObject = {}

  for (const prop of node.properties) {
    if (prop.type === 'ObjectProperty') {
      const key = getPropertyKey(prop.key)
      const value = parsePropertyValue(prop.value)

      if (key) {
        result[key] = value
      }
    }
  }

  return result
}

function getPropertyKey(node: any): string | null {
  if (node.type === 'Identifier') {
    return node.name
  }
  if (node.type === 'StringLiteral') {
    return node.value
  }
  return null
}

function parsePropertyValue(node: any): MetaValue | undefined {
  switch (node.type) {
    case 'StringLiteral':
      return node.value

    case 'NumericLiteral':
      return node.value

    case 'BooleanLiteral':
      return node.value

    case 'NullLiteral':
      return null

    case 'ArrayExpression':
      return node.elements.map((el: any) => parsePropertyValue(el)).filter((v: any) => v !== undefined)

    case 'ObjectExpression':
      return parseObjectExpression(node)

    default:
      return undefined
  }
}
