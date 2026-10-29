import type { PagesJson } from './interfaces'

export type * from './interfaces'

export interface PagesConfig extends PagesJson {}

export function definePagesConfig(config: PagesConfig): PagesConfig {
  return config
}
