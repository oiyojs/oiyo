import type { OiyoConfig } from '@oiyo/config'
import type { Plugin } from 'vite'

import { OiyoCorePlugin } from '@oiyo/core'

import { OiyoUniPlugin } from './uni'

function OiyoPlugin(options: OiyoConfig = {}): Plugin[] {
  return [
    ...OiyoCorePlugin(options),
    ...OiyoUniPlugin(),
  ]
}

export {
  OiyoPlugin as default,
  OiyoPlugin,
}
