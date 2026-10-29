import { isRecord } from './is'

export function deepMerge<T extends object>(base: T, override: T): T {
  const result: any = {
    ...base,
    ...override,
  }

  for (const key of Object.keys(base)) {
    const baseValue = base[key as keyof T]
    const overrideValue = override[key as keyof T]

    if (isRecord(baseValue) && isRecord(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue)
    }
  }

  return result as T
}
