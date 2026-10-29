export function findFnOffset(content: string, name: string) {
  interface ScanState {
    inQuote: string | null;
    isEscaped: boolean;
    inLineComment: boolean;
    inBlockComment: boolean;
  }

  const createScanState = (): ScanState => ({
    inQuote: null,
    isEscaped: false,
    inLineComment: false,
    inBlockComment: false,
  })

  const skipIgnoredContent = (index: number, state: ScanState) => {
    const char = content[index]
    const nextChar = content[index + 1]

    if (state.inLineComment) {
      if (char === '\n' || char === '\r') {
        state.inLineComment = false
      }
      return { ignored: true, index }
    }
    if (state.inBlockComment) {
      if (char === '*' && nextChar === '/') {
        state.inBlockComment = false
        return { ignored: true, index: index + 1 }
      }
      return { ignored: true, index }
    }
    if (state.inQuote) {
      if (state.isEscaped) {
        state.isEscaped = false
        return { ignored: true, index }
      }
      if (char === '\\') {
        state.isEscaped = true
        return { ignored: true, index }
      }
      if (char === state.inQuote) {
        state.inQuote = null
      }
      return { ignored: true, index }
    }
    if (char === '\'' || char === '"' || char === '`') {
      state.inQuote = char
      return { ignored: true, index }
    }
    if (char === '/' && nextChar === '/') {
      state.inLineComment = true
      return { ignored: true, index: index + 1 }
    }
    if (char === '/' && nextChar === '*') {
      state.inBlockComment = true
      return { ignored: true, index: index + 1 }
    }

    return { ignored: false, index }
  }

  let start = -1
  const nameScanState = createScanState()
  for (let i = 0; i < content.length; i++) {
    const result = skipIgnoredContent(i, nameScanState)
    if (result.ignored) {
      i = result.index
      continue
    }
    if (content.startsWith(name, i)) {
      let nextIndex = i + name.length
      while (nextIndex < content.length && /\s/.test(content[nextIndex]!)) {
        nextIndex++
      }
      const nextChar = content[nextIndex]
      if (nextChar === '(' || nextChar === '<') {
        start = i
        break
      }
    }
  }

  if (start === -1) {
    return null
  }

  let startSearchIndex = -1
  let angleCount = 0
  const callScanState = createScanState()

  for (let i = start + name.length; i < content.length; i++) {
    const result = skipIgnoredContent(i, callScanState)
    if (result.ignored) {
      i = result.index
      continue
    }

    const char = content[i]
    if (char === '<') {
      angleCount++
      continue
    }
    if (char === '>' && angleCount > 0 && content[i - 1] !== '=') {
      angleCount--
      continue
    }
    if (char === '(' && angleCount === 0) {
      startSearchIndex = i
      break
    }
  }

  if (startSearchIndex === -1) {
    return null
  }

  let pCount = 1
  const argsScanState = createScanState()

  let end = startSearchIndex

  for (let i = startSearchIndex + 1; i < content.length; i++) {
    end = i

    const result = skipIgnoredContent(i, argsScanState)
    if (result.ignored) {
      i = result.index
      continue
    }

    const char = content[i]
    if (char === '(') {
      pCount++
    }
    if (char === ')') {
      pCount--
    }

    if (pCount === 0) {
      break
    }
  }
  return { start, end: end + 1 }
}

export function extractFnContent(content: string, name: string): string | null {
  const offset = findFnOffset(content, name)
  if (!offset) {
    return null
  }

  return content.substring(offset.start, offset.end).trim()
}

export function removeFnContent(content: string, name: string): string | null {
  const offset = findFnOffset(content, name)
  if (!offset) {
    return null
  }

  const leftContent = content.slice(0, offset.start)
  const rightContent = content.slice(offset.end + 1, content.length)

  return (leftContent + rightContent).trim()
}
