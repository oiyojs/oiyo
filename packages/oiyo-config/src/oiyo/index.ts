import type { OiyoConfig } from './types'

import { defu } from 'defu'

import { defaultConfig } from './default'

export function resolveOiyoConfig(userConfig?: OiyoConfig) {
  return defu(userConfig, defaultConfig) as Required<OiyoConfig>
}

export function defineOiyoConfig(config?: OiyoConfig) {
  return config
}

export { DEFAULT_EXCLUDE } from './default'

export type * from './types'
