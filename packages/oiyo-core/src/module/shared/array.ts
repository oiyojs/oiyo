import { deepMerge } from './object'

export function dedupeArray<T extends object>(items: T[], getKey: (item: T) => string | undefined): T[] {
  const indexes = new Map<string, number>()
  const result: T[] = []

  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index]
    const key = getKey(item)

    if (key === undefined) {
      result.push(item)
      continue
    }

    const existingIndex = indexes.get(key)

    if (existingIndex !== undefined) {
      result[existingIndex] = deepMerge(item, result[existingIndex])
      continue
    }

    indexes.set(key, result.length)
    result.push(item)
  }

  return result.reverse()
}
