export function isString(val: unknown): val is string {
  return typeof val === 'string'
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function isUndefined(value: unknown): value is undefined {
  return value === 'undefined'
}

// eslint-disable-next-line ts/no-unsafe-function-type
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function'
}
