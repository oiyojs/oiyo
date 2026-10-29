import { parse as babelParse } from '@babel/parser'

export function parseCode(code: string) {
  try {
    return babelParse(code, {
      sourceType: 'module',
      plugins: ['typescript'],
    })
  }
  catch {
    return babelParse(`(${code})`, {
      sourceType: 'module',
      plugins: ['typescript'],
    })
  }
}
