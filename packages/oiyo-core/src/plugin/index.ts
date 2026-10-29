import type { OiyoConfig } from '@oiyo/config'
import type { Plugin } from 'vite'

import { OiyoBuildPlugin } from './build'
import { OiyoCommonPlugin } from './common'
import { OiyoServePlugin } from './serve'

export function OiyoCorePlugin(options: OiyoConfig = {}): Plugin[] {
  const config = options

  return [
    ...OiyoCommonPlugin(config),
    ...OiyoServePlugin(),
    ...OiyoBuildPlugin(),
  ]
}
