import type { ManifestJson } from './interfaces'

export type * from './interfaces'

export interface ManifestConfig extends ManifestJson {}

export function defineManifestConfig(config: ManifestConfig): ManifestConfig {
  return config
}
